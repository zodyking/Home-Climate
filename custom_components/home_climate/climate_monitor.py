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
    DEFAULT_DRY_HUMIDITY_THRESHOLD_PCT,
    DEFAULT_DRY_TEMP_MIN_C,
    DOMAIN,
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


def _is_winter_month() -> bool:
    """Return True if current month is winter (Nov, Dec, Jan, Feb, Mar). No AC in winter."""
    month = datetime.now().month
    return month in (11, 12, 1, 2, 3)


def _is_summer_month() -> bool:
    """Return True if current month is summer (Jun, Jul, Aug). No heat in summer."""
    month = datetime.now().month
    return month in (6, 7, 8)


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

            # Get room humidity for dry automation
            indoor_humidity: float | None = None
            humidity_sensor = (room.get("humidity_sensor") or "").strip()
            if humidity_sensor:
                hstate = self.hass.states.get(humidity_sensor)
                if hstate and hstate.state not in ("unknown", "unavailable"):
                    try:
                        indoor_humidity = float(hstate.state)
                    except (ValueError, TypeError):
                        pass

            for appliance in room.get("appliances", []):
                climate_entity = (appliance.get("climate_entity") or "").strip()
                if not climate_entity:
                    continue

                auto = appliance.get("automation") or {}
                heat_threshold = float(auto.get("heat_threshold_c", 18))
                cool_threshold = float(auto.get("cool_threshold_c", 26))
                heat_enabled = auto.get("heat_automation_enabled", True)
                cool_enabled = auto.get("cool_automation_enabled", True)
                dry_enabled = auto.get("dry_automation_enabled", False)
                dry_humidity_pct = float(auto.get("dry_humidity_threshold_pct", DEFAULT_DRY_HUMIDITY_THRESHOLD_PCT))
                dry_temp_min = float(auto.get("dry_temp_min_c", DEFAULT_DRY_TEMP_MIN_C))

                # Fixed seasonal: no AC in winter, no heat in summer
                heat_allowed = not _is_summer_month()
                cool_allowed = not _is_winter_month()

                climate_state = self.hass.states.get(climate_entity)
                current_mode = (
                    (climate_state.attributes.get("hvac_mode") or "off")
                    if climate_state
                    else "off"
                )
                hvac_modes = list(climate_state.attributes.get("hvac_modes") or []) if climate_state else []
                supports_dry = any((m or "").lower() == "dry" for m in hvac_modes)

                if climate_entity in self._cooldown_until and now < self._cooldown_until[climate_entity]:
                    continue

                target_mode: str | None = None
                if indoor_temp < heat_threshold and heat_allowed and heat_enabled:
                    target_mode = "heat"
                elif indoor_temp > cool_threshold and cool_allowed and cool_enabled:
                    target_mode = "cool"
                elif (
                    dry_enabled
                    and supports_dry
                    and indoor_temp >= dry_temp_min
                    and (indoor_humidity or 0) > dry_humidity_pct
                    and heat_threshold <= indoor_temp <= cool_threshold
                ):
                    target_mode = "dry"
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
