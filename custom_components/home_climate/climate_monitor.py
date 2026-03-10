"""Climate monitor for Home Climate - comfort-based automation with dynamic set temp (per-appliance)."""
from __future__ import annotations

import asyncio
import logging
import math
from datetime import datetime
from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant
from homeassistant.const import ATTR_ENTITY_ID

from .const import (
    CLIMATE_CHECK_INTERVAL,
    CLIMATE_SET_TEMP_INTERVAL,
    DEFAULT_DRY_HUMIDITY_THRESHOLD_PCT,
    DEFAULT_DRY_TEMP_MIN_C,
    DOMAIN,
    parse_temp_from_state,
    STRUGGLE_HOUR_SEC,
    TTS_AUTO_MODE_CHANGE,
    TTS_COMFORT_ADJUSTED,
    TTS_COMFORT_REVERT,
)

if TYPE_CHECKING:
    from .config_manager import ConfigManager

_LOGGER = logging.getLogger(__name__)

# Struggle detection: min temp change over 30 min to consider "progress"
STRUGGLE_PROGRESS_THRESHOLD_C = 0.5
STRUGGLE_REDUCE_CAP_C = 1.0  # Cap set temp at comfort ± this when struggling
STRUGGLE_RECHECK_MIN = 15  # Min to recheck after reducing set temp
DYNAMIC_SCALE = 0.5  # Linear: gap of 4°C -> 2°C offset


def _is_winter_month() -> bool:
    """Return True if current month is winter (Nov, Dec, Jan, Feb, Mar). No AC in winter."""
    month = datetime.now().month
    return month in (11, 12, 1, 2, 3)


def _is_summer_month() -> bool:
    """Return True if current month is summer (Jun, Jul, Aug). No heat in summer."""
    month = datetime.now().month
    return month in (6, 7, 8)


def _control_key(appliance: dict, room: dict) -> str:
    """Return unique key for appliance (climate or switch entity)."""
    if appliance.get("is_smart_appliance", True):
        return (appliance.get("climate_entity") or "").strip() or f"room_{room.get('id')}_app_{appliance.get('id')}"
    ps = appliance.get("power_sensor") or {}
    return (ps.get("switch") or "").strip() or f"room_{room.get('id')}_app_{appliance.get('id')}"


class ClimateMonitor:
    """Monitor indoor temps and control climate/switch entities with comfort-based automation."""

    def __init__(self, hass: HomeAssistant, config_manager: "ConfigManager") -> None:
        self.hass = hass
        self.config_manager = config_manager
        self._task: asyncio.Task | None = None
        self._appliance_state: dict[str, dict[str, Any]] = {}
        self._last_settemp_check: dict[str, float] = {}
        self._cooldown_until: dict[str, float] = {}
        self._COOLDOWN_SEC = 60

    async def async_stop(self) -> None:
        """Stop the climate monitor."""
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        self._appliance_state.clear()
        self._last_settemp_check.clear()

    async def _run_loop(self) -> None:
        """Main monitoring loop (30s interval)."""
        while True:
            try:
                await self._check_and_control()
            except asyncio.CancelledError:
                raise
            except Exception as e:
                _LOGGER.exception("Climate monitor error: %s", e)
            await asyncio.sleep(CLIMATE_CHECK_INTERVAL)

    def _get_appliance_state(self, key: str) -> dict[str, Any]:
        """Get or init state for appliance."""
        if key not in self._appliance_state:
            self._appliance_state[key] = {
                "phase": "idle",
                "phase_started_at": 0.0,
                "last_room_temp": None,
                "last_set_temp": None,
                "progress_checks": [],
                "current_set_temp": None,
                "struggle_reduced_at": None,
            }
        return self._appliance_state[key]

    def _at_comfort(self, indoor_temp: float, comfort: float, tolerance: float) -> bool:
        """Return True if room is at or near comfort temp."""
        return comfort - tolerance <= indoor_temp <= comfort + tolerance

    def _should_start_heat(self, indoor_temp: float, heat_threshold: float, heat_allowed: bool, heat_enabled: bool) -> bool:
        return indoor_temp < heat_threshold and heat_allowed and heat_enabled

    def _should_start_cool(self, indoor_temp: float, cool_threshold: float, cool_allowed: bool, cool_enabled: bool) -> bool:
        return indoor_temp > cool_threshold and cool_allowed and cool_enabled

    def _appliance_min_max_temp(self, climate_entity: str) -> tuple[float, float]:
        """Get appliance min/max temp from HA state."""
        state = self.hass.states.get(climate_entity)
        if not state:
            return (16.0, 30.0)
        attrs = state.attributes or {}
        min_t = attrs.get("min_temp")
        max_t = attrs.get("max_temp")
        try:
            mn = float(min_t) if min_t is not None else 16.0
            mx = float(max_t) if max_t is not None else 30.0
            return (mn, mx)
        except (ValueError, TypeError):
            return (16.0, 30.0)

    def _dynamic_set_temp_heat(self, room_temp: float, comfort: float, min_t: float, max_t: float) -> float:
        """Compute appliance set temp for heating (higher when further from comfort)."""
        gap = max(0, comfort - room_temp)
        offset = gap * DYNAMIC_SCALE
        target = comfort + offset
        return max(comfort, min(target, max_t))

    def _dynamic_set_temp_cool(self, room_temp: float, comfort: float, min_t: float, max_t: float) -> float:
        """Compute appliance set temp for cooling (lower when further from comfort)."""
        gap = max(0, room_temp - comfort)
        offset = gap * DYNAMIC_SCALE
        target = comfort - offset
        return max(min_t, min(target, comfort))

    def _supports_fan_only(self, climate_entity: str) -> bool:
        """Check if climate entity supports fan_only mode."""
        state = self.hass.states.get(climate_entity)
        if not state:
            return False
        modes = state.attributes.get("hvac_modes") or []
        return any((m or "").lower() == "fan_only" for m in modes)

    def _is_struggling(self, state: dict, now: float) -> bool:
        """Return True if appliance has been in phase > 1hr with little progress."""
        phase_start = state.get("phase_started_at") or 0
        if now - phase_start < STRUGGLE_HOUR_SEC:
            return False
        checks = state.get("progress_checks") or []
        if len(checks) < 2:
            return True
        recent = [(t, rt) for t, rt in checks if t >= now - 1800]
        if len(recent) < 2:
            return True
        temps = [rt for _, rt in recent if rt is not None]
        if not temps:
            return True
        return max(temps) - min(temps) < STRUGGLE_PROGRESS_THRESHOLD_C

    async def _check_and_control(self) -> None:
        """Check temps and apply comfort-based climate control (per-appliance)."""
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
            indoor_temp = parse_temp_from_state(state.state, unit)
            if indoor_temp is None:
                continue

            comfort_temp = float(room.get("comfort_temp_c", 22.0))
            comfort_tolerance = float(room.get("comfort_tolerance_c", 1.0))

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
                is_smart = appliance.get("is_smart_appliance", True)
                key = _control_key(appliance, room)
                astate = self._get_appliance_state(key)

                if key in self._cooldown_until and now < self._cooldown_until[key]:
                    continue

                auto = appliance.get("automation") or {}
                heat_threshold = float(auto.get("heat_threshold_c", 18))
                cool_threshold = float(auto.get("cool_threshold_c", 26))
                heat_enabled = auto.get("heat_automation_enabled", True)
                cool_enabled = auto.get("cool_automation_enabled", True)
                dry_enabled = auto.get("dry_automation_enabled", False)
                dry_humidity_pct = float(auto.get("dry_humidity_threshold_pct", DEFAULT_DRY_HUMIDITY_THRESHOLD_PCT))
                dry_temp_min = float(auto.get("dry_temp_min_c", DEFAULT_DRY_TEMP_MIN_C))

                if is_smart:
                    block_heat = auto.get("block_heat_in_summer", True)
                    block_cool = auto.get("block_cool_in_winter", True)
                    heat_allowed = (not _is_summer_month()) or (not block_heat)
                    cool_allowed = (not _is_winter_month()) or (not block_cool)
                else:
                    heat_allowed = True
                    cool_allowed = True

                if is_smart:
                    await self._check_smart_appliance(
                        key, appliance, room, indoor_temp, indoor_humidity,
                        heat_threshold, cool_threshold, heat_enabled, cool_enabled,
                        heat_allowed, cool_allowed,
                        dry_enabled, dry_humidity_pct, dry_temp_min,
                        comfort_temp, comfort_tolerance, astate, now,
                    )
                else:
                    await self._check_simple_appliance(
                        key, appliance, room, indoor_temp,
                        heat_threshold, cool_threshold, heat_enabled, cool_enabled,
                        comfort_temp, comfort_tolerance, astate, now,
                    )

    async def _check_smart_appliance(
        self,
        key: str,
        appliance: dict,
        room: dict,
        indoor_temp: float,
        indoor_humidity: float | None,
        heat_threshold: float,
        cool_threshold: float,
        heat_enabled: bool,
        cool_enabled: bool,
        heat_allowed: bool,
        cool_allowed: bool,
        dry_enabled: bool,
        dry_humidity_pct: float,
        dry_temp_min: float,
        comfort_temp: float,
        comfort_tolerance: float,
        astate: dict,
        now: float,
    ) -> None:
        """Handle smart appliance (climate entity) comfort-based logic."""
        climate_entity = (appliance.get("climate_entity") or "").strip()
        if not climate_entity:
            return

        config_manager = self.config_manager
        phase = astate.get("phase") or "idle"
        phase_started = astate.get("phase_started_at") or 0
        last_settemp = self._last_settemp_check.get(key, 0)

        climate_state = self.hass.states.get(climate_entity)
        current_mode = (
            (climate_state.attributes.get("hvac_mode") or "off")
            if climate_state
            else "off"
        )
        hvac_modes = list(climate_state.attributes.get("hvac_modes") or []) if climate_state else []
        supports_dry = any((m or "").lower() == "dry" for m in hvac_modes)
        supports_fan_only = self._supports_fan_only(climate_entity)

        from .power_detector import get_appliance_power_state, get_appliance_power_switch
        power_switch = get_appliance_power_switch(config_manager, climate_entity)
        power_state = get_appliance_power_state(self.hass, config_manager, climate_entity)

        if power_state == "off" and not power_switch:
            if phase in ("heating", "cooling") and current_mode != "off":
                pass
            elif phase == "idle" and (self._should_start_heat(indoor_temp, heat_threshold, heat_allowed, heat_enabled)
                                     or self._should_start_cool(indoor_temp, cool_threshold, cool_allowed, cool_enabled)):
                _LOGGER.debug("Skipping %s: power sensor reports off", climate_entity)
                return

        target_phase = phase
        if self._at_comfort(indoor_temp, comfort_temp, comfort_tolerance):
            current_lower = (current_mode or "").strip().lower()
            if current_lower in ("heat", "cool"):
                target_phase = "fan_only" if supports_fan_only else "off"
                temp_unit = getattr(
                    self.hass.config.units, "temperature_unit", "°C"
                )
                temp_display = (
                    round(indoor_temp * 9 / 5 + 32, 1)
                    if temp_unit == "°F"
                    else round(indoor_temp, 1)
                )
                await self._transition_to_fan_or_off(
                    climate_entity, target_phase, power_switch, config_manager,
                    comfort_revert_temp=temp_display,
                )
                astate["phase"] = "idle"
                astate["phase_started_at"] = 0
                astate["progress_checks"] = []
                self._cooldown_until[key] = now + self._COOLDOWN_SEC
                return
            elif phase == "fan_only":
                pass
            else:
                astate["phase"] = "idle"
                return

        if phase == "idle" or phase == "fan_only":
            if self._should_start_heat(indoor_temp, heat_threshold, heat_allowed, heat_enabled):
                target_phase = "heating"
            elif self._should_start_cool(indoor_temp, cool_threshold, cool_allowed, cool_enabled):
                target_phase = "cooling"
            elif (
                dry_enabled
                and supports_dry
                and indoor_temp >= dry_temp_min
                and (indoor_humidity or 0) > dry_humidity_pct
                and heat_threshold <= indoor_temp <= cool_threshold
            ):
                target_phase = "dry"
            else:
                return

            if target_phase != "dry" and target_phase != phase:
                min_t, max_t = self._appliance_min_max_temp(climate_entity)
                if target_phase == "heating":
                    set_temp = self._dynamic_set_temp_heat(indoor_temp, comfort_temp, min_t, max_t)
                else:
                    set_temp = self._dynamic_set_temp_cool(indoor_temp, comfort_temp, min_t, max_t)

                await self._start_phase(climate_entity, target_phase, set_temp, power_switch, config_manager)
                astate["phase"] = target_phase
                astate["phase_started_at"] = now
                astate["last_room_temp"] = indoor_temp
                astate["last_set_temp"] = set_temp
                astate["progress_checks"] = [(now, indoor_temp)]
                astate["struggle_reduced_at"] = None
                astate["current_set_temp"] = set_temp
                self._last_settemp_check[key] = now
                self._cooldown_until[key] = now + self._COOLDOWN_SEC
            elif target_phase == "dry":
                if current_mode != "dry":
                    await self._set_climate_mode(climate_entity, "dry", None, power_switch, config_manager)
                    self._cooldown_until[key] = now + self._COOLDOWN_SEC
            return

        if phase in ("heating", "cooling") and now - last_settemp >= CLIMATE_SET_TEMP_INTERVAL:
            progress_checks = astate.get("progress_checks") or []
            progress_checks.append((now, indoor_temp))
            while len(progress_checks) > 40:
                progress_checks.pop(0)
            astate["progress_checks"] = progress_checks
            astate["last_room_temp"] = indoor_temp
            self._last_settemp_check[key] = now

            struggle_reduced = astate.get("struggle_reduced_at")
            if struggle_reduced and now - struggle_reduced >= STRUGGLE_RECHECK_MIN * 60:
                if self._is_struggling(astate, now):
                    await self._handle_struggle_give_up(key, appliance, room, climate_entity, indoor_temp,
                                                       comfort_temp, phase, power_switch, supports_fan_only,
                                                       config_manager)
                    astate["phase"] = "idle"
                    astate["phase_started_at"] = 0
                    astate["progress_checks"] = []
                    self._cooldown_until[key] = now + self._COOLDOWN_SEC
                    return

            if self._is_struggling(astate, now) and not struggle_reduced:
                min_t, max_t = self._appliance_min_max_temp(climate_entity)
                cap_temp = comfort_temp + STRUGGLE_REDUCE_CAP_C if phase == "heating" else comfort_temp - STRUGGLE_REDUCE_CAP_C
                set_temp = max(min_t, min(cap_temp, max_t))
                await self._set_temperature(climate_entity, set_temp, power_switch)
                astate["current_set_temp"] = set_temp
                astate["struggle_reduced_at"] = now
                _LOGGER.info("Struggle: reduced set temp for %s to %.1f", climate_entity, set_temp)
                return

            min_t, max_t = self._appliance_min_max_temp(climate_entity)
            if phase == "heating":
                set_temp = self._dynamic_set_temp_heat(indoor_temp, comfort_temp, min_t, max_t)
            else:
                set_temp = self._dynamic_set_temp_cool(indoor_temp, comfort_temp, min_t, max_t)

            await self._set_temperature(climate_entity, set_temp, power_switch)
            astate["current_set_temp"] = set_temp
            astate["last_set_temp"] = set_temp

    async def _handle_struggle_give_up(
        self,
        key: str,
        appliance: dict,
        room: dict,
        climate_entity: str,
        indoor_temp: float,
        comfort_temp: float,
        phase: str,
        power_switch: str | None,
        supports_fan_only: bool,
        config_manager: "ConfigManager",
    ) -> None:
        """Switch to fan/off, notify, and auto-adjust comfort temp."""
        target_mode = "fan_only" if supports_fan_only else "off"
        await self._transition_to_fan_or_off(climate_entity, target_mode, power_switch, config_manager)

        new_comfort = math.floor(indoor_temp)
        room_id = room.get("id") or ""
        await config_manager.async_update_room_comfort(room_id, new_comfort)

        device_name = config_manager.get_device_name(appliance)
        try:
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event
            ctrl_entity = climate_entity
            await async_send_tts_for_event(
                self.hass, config_manager, ctrl_entity, TTS_COMFORT_ADJUSTED, temp=new_comfort,
            )
            await async_send_notification_for_event(
                self.hass, config_manager, ctrl_entity, TTS_COMFORT_ADJUSTED, temp=new_comfort,
            )
        except Exception as e:
            _LOGGER.warning("Failed to send comfort_adjusted: %s", e)

        _LOGGER.info("Comfort adjusted for room %s: %.0f -> %.0f (appliance %s)", room.get("name"), comfort_temp, new_comfort, device_name)

    async def _check_simple_appliance(
        self,
        key: str,
        appliance: dict,
        room: dict,
        indoor_temp: float,
        heat_threshold: float,
        cool_threshold: float,
        heat_enabled: bool,
        cool_enabled: bool,
        comfort_temp: float,
        comfort_tolerance: float,
        astate: dict,
        now: float,
    ) -> None:
        """Handle simple appliance (switch) on/off logic."""
        switch_entity = self.config_manager.get_appliance_switch_entity(appliance)
        if not switch_entity:
            return

        from .power_detector import get_appliance_power_state
        power_state = get_appliance_power_state(self.hass, self.config_manager, switch_entity)
        if power_state is None:
            switch_state = self.hass.states.get(switch_entity)
            is_on = switch_state and switch_state.state == "on"
        else:
            is_on = power_state == "on"

        phase = astate.get("phase") or "idle"
        phase_started = astate.get("phase_started_at") or 0
        last_settemp = self._last_settemp_check.get(key, 0)

        if self._at_comfort(indoor_temp, comfort_temp, comfort_tolerance):
            if phase in ("heating", "cooling") and is_on:
                await self.hass.services.async_call(
                    "switch", "turn_off", {ATTR_ENTITY_ID: switch_entity}, blocking=True,
                )
                astate["phase"] = "idle"
                astate["phase_started_at"] = 0
                astate["progress_checks"] = []
                self._cooldown_until[key] = now + self._COOLDOWN_SEC
            return

        if phase == "idle":
            if self._should_start_heat(indoor_temp, heat_threshold, True, heat_enabled):
                if not is_on:
                    await self.hass.services.async_call(
                        "switch", "turn_on", {ATTR_ENTITY_ID: switch_entity}, blocking=True,
                    )
                    astate["phase"] = "heating"
                    astate["phase_started_at"] = now
                    astate["progress_checks"] = [(now, indoor_temp)]
                    self._cooldown_until[key] = now + self._COOLDOWN_SEC
            elif self._should_start_cool(indoor_temp, cool_threshold, True, cool_enabled):
                if not is_on:
                    await self.hass.services.async_call(
                        "switch", "turn_on", {ATTR_ENTITY_ID: switch_entity}, blocking=True,
                    )
                    astate["phase"] = "cooling"
                    astate["phase_started_at"] = now
                    astate["progress_checks"] = [(now, indoor_temp)]
                    self._cooldown_until[key] = now + self._COOLDOWN_SEC
            return

        if phase in ("heating", "cooling") and now - last_settemp >= CLIMATE_SET_TEMP_INTERVAL:
            progress_checks = astate.get("progress_checks") or []
            progress_checks.append((now, indoor_temp))
            while len(progress_checks) > 40:
                progress_checks.pop(0)
            astate["progress_checks"] = progress_checks
            self._last_settemp_check[key] = now

            if now - phase_started >= STRUGGLE_HOUR_SEC and self._is_struggling(astate, now):
                new_comfort = math.floor(indoor_temp)
                room_id = room.get("id") or ""
                await self.config_manager.async_update_room_comfort(room_id, new_comfort)
                await self.hass.services.async_call(
                    "switch", "turn_off", {ATTR_ENTITY_ID: switch_entity}, blocking=True,
                )
                try:
                    from .tts_event import async_send_tts_for_event
                    from .notification_event import async_send_notification_for_event
                    await async_send_tts_for_event(
                        self.hass, self.config_manager, switch_entity, TTS_COMFORT_ADJUSTED, temp=new_comfort,
                    )
                    await async_send_notification_for_event(
                        self.hass, self.config_manager, switch_entity, TTS_COMFORT_ADJUSTED, temp=new_comfort,
                    )
                except Exception as e:
                    _LOGGER.warning("Failed to send comfort_adjusted: %s", e)
                astate["phase"] = "idle"
                astate["phase_started_at"] = 0
                astate["progress_checks"] = []
                self._cooldown_until[key] = now + self._COOLDOWN_SEC

    async def _transition_to_fan_or_off(
        self,
        climate_entity: str,
        target: str,
        power_switch: str | None,
        config_manager: "ConfigManager",
        comfort_revert_temp: float | None = None,
    ) -> None:
        """Switch to fan_only or turn off."""
        if target == "fan_only":
            await self.hass.services.async_call(
                "climate", "set_hvac_mode",
                {ATTR_ENTITY_ID: climate_entity, "hvac_mode": "fan_only"},
                blocking=True,
            )
        else:
            if power_switch:
                await self.hass.services.async_call(
                    "switch", "turn_off", {ATTR_ENTITY_ID: power_switch}, blocking=True,
                )
            else:
                await self.hass.services.async_call(
                    "climate", "turn_off", {ATTR_ENTITY_ID: climate_entity}, blocking=True,
                )
        try:
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event
            if comfort_revert_temp is not None:
                await async_send_tts_for_event(
                    self.hass, config_manager, climate_entity,
                    TTS_COMFORT_REVERT, temp=comfort_revert_temp,
                )
                await async_send_notification_for_event(
                    self.hass, config_manager, climate_entity,
                    TTS_COMFORT_REVERT, temp=comfort_revert_temp,
                )
            else:
                mode_label = "fan only" if target == "fan_only" else "off"
                await async_send_tts_for_event(
                    self.hass, config_manager, climate_entity,
                    TTS_AUTO_MODE_CHANGE, mode=mode_label,
                )
                await async_send_notification_for_event(
                    self.hass, config_manager, climate_entity,
                    TTS_AUTO_MODE_CHANGE, mode=mode_label,
                )
        except Exception as e:
            _LOGGER.warning("Failed to send mode change: %s", e)

    async def _start_phase(
        self, climate_entity: str, mode: str, set_temp: float | None,
        power_switch: str | None, config_manager: "ConfigManager",
    ) -> None:
        """Start heating/cooling phase with initial set temp."""
        await self._set_climate_mode(climate_entity, mode, set_temp, power_switch, config_manager)

    async def _set_temperature(self, climate_entity: str, temp: float, power_switch: str | None) -> None:
        """Set climate target temperature (assumes already in heat/cool mode)."""
        await self.hass.services.async_call(
            "climate", "set_temperature",
            {ATTR_ENTITY_ID: climate_entity, "temperature": temp},
            blocking=True,
        )

    async def _set_climate_mode(
        self, entity_id: str, mode: str, set_temp: float | None,
        power_switch: str | None, config_manager: "ConfigManager",
    ) -> None:
        """Set climate mode and optionally temperature, announce via TTS."""
        try:
            if mode == "off":
                if power_switch:
                    await self.hass.services.async_call(
                        "switch", "turn_off", {ATTR_ENTITY_ID: power_switch}, blocking=True,
                    )
                else:
                    await self.hass.services.async_call(
                        "climate", "turn_off", {ATTR_ENTITY_ID: entity_id}, blocking=True,
                    )
            else:
                if power_switch:
                    await self.hass.services.async_call(
                        "switch", "turn_on", {ATTR_ENTITY_ID: power_switch}, blocking=True,
                    )
                await self.hass.services.async_call(
                    "climate", "set_hvac_mode",
                    {ATTR_ENTITY_ID: entity_id, "hvac_mode": mode},
                    blocking=True,
                )
                if set_temp is not None:
                    await self.hass.services.async_call(
                        "climate", "set_temperature",
                        {ATTR_ENTITY_ID: entity_id, "temperature": set_temp},
                        blocking=True,
                    )
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event
            await async_send_tts_for_event(
                self.hass, config_manager, entity_id, TTS_AUTO_MODE_CHANGE, mode=mode,
            )
            await async_send_notification_for_event(
                self.hass, config_manager, entity_id, TTS_AUTO_MODE_CHANGE, mode=mode,
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
