"""Climate monitor for Home Climate - threshold and seasonal automation (per-appliance)."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant
from homeassistant.const import ATTR_ENTITY_ID

from .const import (
    CLIMATE_CHECK_INTERVAL,
    DOMAIN,
    SEASONAL_MODE_DATE,
    SEASONAL_MODE_OUTDOOR_TEMP,
    TTS_MODE_CHANGE,
)

if TYPE_CHECKING:
    from .config_manager import ConfigManager

_LOGGER = logging.getLogger(__name__)


def _parse_temp(value: Any, unit: str | None) -> float | None:
    """Parse temperature from state, return Celsius or None."""
    if value is None or value == "":
        return None
    try:
        temp = float(str(value).strip())
    except (ValueError, TypeError):
        return None
    if unit and "f" in unit.lower():
        temp = (temp - 32) * 5 / 9
    return temp


def _get_outdoor_temp_c(
    hass: "HomeAssistant",
    config: dict[str, Any],
    appliance_auto: dict[str, Any],
) -> float | None:
    """Get outdoor temperature in Celsius from weather entity (preferred) or sensor."""
    # Prefer global weather entity
    weather_entity = (config.get("weather_entity") or "").strip()
    if weather_entity:
        wstate = hass.states.get(weather_entity)
        if wstate and wstate.state not in ("unknown", "unavailable"):
            attrs = wstate.attributes or {}
            t = attrs.get("temperature")
            if t is not None:
                temp_unit = hass.config.units.temperature_unit
                return _parse_temp(t, temp_unit)
    # Fall back to per-appliance outdoor_temp_sensor
    outdoor_sensor = (appliance_auto.get("outdoor_temp_sensor") or "").strip()
    if outdoor_sensor:
        ostate = hass.states.get(outdoor_sensor)
        if ostate and ostate.state not in ("unknown", "unavailable"):
            ounit = ostate.attributes.get("unit_of_measurement")
            return _parse_temp(ostate.state, ounit)
    return None


def _is_winter_date(winter_start: str, winter_end: str) -> bool:
    """Return True if today is in winter range (e.g. 11-01 to 03-31)."""
    try:
        today = datetime.now()
        mmdd = today.strftime("%m-%d")
        if winter_start <= winter_end:
            return winter_start <= mmdd <= winter_end
        return mmdd >= winter_start or mmdd <= winter_end
    except Exception:
        return False


class ClimateMonitor:
    """Monitor indoor/outdoor temps and control climate entities (per-appliance)."""

    def __init__(self, hass: HomeAssistant, config_manager: "ConfigManager") -> None:
        self.hass = hass
        self.config_manager = config_manager
        self._task: asyncio.Task | None = None
        self._last_mode: dict[str, str] = {}
        self._cooldown_until: dict[str, float] = {}
        self._COOLDOWN_SEC = 300

    async def async_stop(self) -> None:
        """Stop the climate monitor."""
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None

    async def _run_loop(self) -> None:
        """Main monitoring loop."""
        while True:
            try:
                await self._check_and_control()
            except asyncio.CancelledError:
                raise
            except Exception as e:
                _LOGGER.exception("Climate monitor error: %s", e)
            await asyncio.sleep(CLIMATE_CHECK_INTERVAL)

    async def _check_and_control(self) -> None:
        """Check temps and apply climate control logic (per-appliance)."""
        config_manager = self.config_manager
        rooms = config_manager.rooms
        if not rooms:
            return

        now = datetime.now().timestamp()

        for room in rooms:
            temp_sensor = (room.get("temp_sensor") or "").strip()
            if not temp_sensor:
                continue

            state = self.hass.states.get(temp_sensor)
            if not state or state.state in ("unknown", "unavailable"):
                continue

            unit = state.attributes.get("unit_of_measurement")
            indoor_temp = _parse_temp(state.state, unit)
            if indoor_temp is None:
                continue

            for appliance in room.get("appliances", []):
                climate_entity = (appliance.get("climate_entity") or "").strip()
                if not climate_entity:
                    continue

                auto = appliance.get("automation") or {}
                heat_threshold = float(auto.get("heat_threshold_c", 18))
                cool_threshold = float(auto.get("cool_threshold_c", 26))
                seasonal_mode = auto.get("seasonal_mode", SEASONAL_MODE_OUTDOOR_TEMP)
                cool_only_above = float(auto.get("outdoor_cool_only_above_c", 25))
                heat_only_below = float(auto.get("outdoor_heat_only_below_c", 15))
                winter_start = (auto.get("date_winter_start") or "11-01").strip()
                winter_end = (auto.get("date_winter_end") or "03-31").strip()

                outdoor_temp = _get_outdoor_temp_c(
                    self.hass,
                    config_manager.config,
                    auto,
                )

                heat_allowed = True
                cool_allowed = True
                if seasonal_mode == SEASONAL_MODE_OUTDOOR_TEMP and outdoor_temp is not None:
                    if outdoor_temp < heat_only_below:
                        cool_allowed = False
                    elif outdoor_temp > cool_only_above:
                        heat_allowed = False
                elif seasonal_mode == SEASONAL_MODE_DATE:
                    if _is_winter_date(winter_start, winter_end):
                        cool_allowed = False
                    else:
                        heat_allowed = False

                climate_state = self.hass.states.get(climate_entity)
                current_mode = (
                    (climate_state.attributes.get("hvac_mode") or "off")
                    if climate_state
                    else "off"
                )

                if climate_entity in self._cooldown_until and now < self._cooldown_until[climate_entity]:
                    continue

                target_mode: str | None = None
                if indoor_temp < heat_threshold and heat_allowed:
                    target_mode = "heat"
                elif indoor_temp > cool_threshold and cool_allowed:
                    target_mode = "cool"
                else:
                    target_mode = "off"

                if target_mode != current_mode and target_mode is not None:
                    if target_mode != "off":
                        from .power_detector import get_appliance_power_state, get_appliance_power_switch
                        if get_appliance_power_switch(config_manager, climate_entity):
                            pass
                        else:
                            power_state = get_appliance_power_state(
                                self.hass, config_manager, climate_entity
                            )
                            if power_state == "off":
                                _LOGGER.debug(
                                    "Skipping turn_on for %s: power sensor reports off",
                                    climate_entity,
                                )
                                continue
                    await self._set_climate_mode(climate_entity, target_mode)
                    self._last_mode[climate_entity] = target_mode
                    self._cooldown_until[climate_entity] = now + self._COOLDOWN_SEC

    async def _set_climate_mode(self, entity_id: str, mode: str) -> None:
        """Set climate mode and optionally announce via TTS."""
        from .power_detector import get_appliance_power_switch

        config_manager = self.config_manager
        power_switch = get_appliance_power_switch(config_manager, entity_id)

        try:
            if mode == "off":
                if power_switch:
                    await self.hass.services.async_call(
                        "switch",
                        "turn_off",
                        {ATTR_ENTITY_ID: power_switch},
                        blocking=True,
                    )
                else:
                    await self.hass.services.async_call(
                        "climate",
                        "turn_off",
                        {ATTR_ENTITY_ID: entity_id},
                        blocking=True,
                    )
            else:
                if power_switch:
                    await self.hass.services.async_call(
                        "switch",
                        "turn_on",
                        {ATTR_ENTITY_ID: power_switch},
                        blocking=True,
                    )
                await self.hass.services.async_call(
                    "climate",
                    "set_hvac_mode",
                    {ATTR_ENTITY_ID: entity_id, "hvac_mode": mode},
                    blocking=True,
                )

            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event

            await async_send_tts_for_event(
                self.hass,
                self.config_manager,
                entity_id,
                TTS_MODE_CHANGE,
                mode=mode,
            )
            await async_send_notification_for_event(
                self.hass,
                self.config_manager,
                entity_id,
                TTS_MODE_CHANGE,
                mode=mode,
            )
        except Exception as e:
            _LOGGER.error("Failed to set climate %s to %s: %s", entity_id, mode, e)


async def async_start_climate_monitor(
    hass: HomeAssistant, config_manager: "ConfigManager"
) -> None:
    """Start the climate monitor loop."""
    monitor = ClimateMonitor(hass, config_manager)
    hass.data.setdefault(DOMAIN, {})["climate_monitor"] = monitor
    monitor._task = asyncio.create_task(monitor._run_loop())
    _LOGGER.info("Home Climate climate monitor started")
