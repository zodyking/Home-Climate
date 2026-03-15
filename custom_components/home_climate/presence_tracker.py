"""Presence tracker for Home Climate - person/zone enter/exit automation (per-appliance)."""
from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event

if TYPE_CHECKING:
    from .config_manager import ConfigManager

from .const import DOMAIN, parse_temp_from_state, TTS_PRESENCE_ENTER, TTS_PRESENCE_LEAVE

_LOGGER = logging.getLogger(__name__)


def _entity_friendly_name(hass: HomeAssistant, entity_id: str) -> str:
    """Get friendly name for an entity, or derive from entity_id (e.g. zone.living_room -> Living room)."""
    if not entity_id:
        return ""
    state = hass.states.get(entity_id)
    if state:
        name = state.attributes.get("friendly_name")
        if name:
            return str(name).strip()
    # Derive from entity_id: zone.living_room -> Living room, person.brandon -> Brandon
    parts = str(entity_id).split(".")
    if len(parts) >= 2:
        slug = parts[-1].replace("_", " ").strip()
        return slug.title() if slug else entity_id
    return entity_id


def _person_in_zone(person_state: str | None, zone_entity_id: str) -> bool:
    """Return True if person state indicates they are in the given zone."""
    if not person_state or not zone_entity_id:
        return False
    if person_state == zone_entity_id:
        return True
    zone_name = zone_entity_id.replace("zone.", "").replace("_", " ")
    if person_state.lower() == zone_name.lower():
        return True
    return False


def _build_presence_rules(config_manager: "ConfigManager") -> list[dict[str, Any]]:
    """
    Build presence rules from room.appliances[].automation.

    Each appliance with person_on+zone_on (and person_off+zone_off) configured becomes a rule.
    Skips appliances that have proximity_entity set (those use proximity rules instead).
    """
    rules = []
    for room in config_manager.rooms:
        for appliance in room.get("appliances", []):
            auto = appliance.get("automation") or {}
            if (auto.get("proximity_entity") or "").strip():
                continue  # Use proximity instead
            is_smart = appliance.get("is_smart_appliance", True)
            climate_entity = (appliance.get("climate_entity") or "").strip()
            switch_entity = config_manager.get_appliance_switch_entity(appliance)
            control_entity = climate_entity if is_smart and climate_entity else (switch_entity or "")
            if not control_entity:
                continue
            person_on = (auto.get("person_on") or "").strip()
            zone_on = (auto.get("zone_on") or "").strip()
            person_off = (auto.get("person_off") or person_on or "").strip()
            zone_off = (auto.get("zone_off") or zone_on or "").strip()
            if not person_on or not zone_on:
                continue
            if not person_off or not zone_off:
                continue
            rules.append({
                "room": room,
                "appliance": appliance,
                "control_entity": control_entity,
                "climate_entity": climate_entity,
                "is_smart": is_smart,
                "person_on": person_on,
                "zone_on": zone_on,
                "person_off": person_off,
                "zone_off": zone_off,
                "enter_duration_sec": max(0, min(600, int(auto.get("enter_duration_sec") or 30))),
                "exit_duration_sec": max(0, min(3600, int(auto.get("exit_duration_sec") or 300))),
            })
    return rules


def _build_proximity_rules(config_manager: "ConfigManager") -> list[dict[str, Any]]:
    """
    Build proximity/geo-fencing rules from room.appliances[].automation.

    Appliances with proximity_entity configured use AHC-style proximity logic:
    - Turn ON: direction in (towards, arrived) and distance <= threshold, sustained for duration
    - Turn OFF: direction in (away_from) or distance > threshold, sustained for duration
    """
    rules = []
    for room in config_manager.rooms:
        for appliance in room.get("appliances", []):
            auto = appliance.get("automation") or {}
            proximity_entity = (auto.get("proximity_entity") or "").strip()
            if not proximity_entity:
                continue
            is_smart = appliance.get("is_smart_appliance", True)
            climate_entity = (appliance.get("climate_entity") or "").strip()
            switch_entity = config_manager.get_appliance_switch_entity(appliance)
            control_entity = climate_entity if is_smart and climate_entity else (switch_entity or "")
            if not control_entity:
                continue
            duration_min = max(0, min(120, int(auto.get("proximity_duration_min") or 5)))
            distance_m = max(0, min(50000, int(auto.get("proximity_distance_m") or 500)))
            rules.append({
                "room": room,
                "appliance": appliance,
                "control_entity": control_entity,
                "climate_entity": climate_entity,
                "is_smart": is_smart,
                "proximity_entity": proximity_entity,
                "proximity_duration_sec": duration_min * 60,
                "proximity_distance_m": distance_m,
            })
    return rules


def _proximity_is_approaching(direction_state: str | None) -> bool:
    """True if direction indicates approaching or arrived (towards, arrived)."""
    if not direction_state:
        return False
    s = str(direction_state).lower().strip()
    return s in ("towards", "arrived")


def _proximity_is_leaving(direction_state: str | None) -> bool:
    """True if direction indicates away (away_from). stationary/unknown = ambiguous."""
    if not direction_state:
        return True
    s = str(direction_state).lower().strip()
    return s in ("away_from",)


def _proximity_rule_key(rule: dict[str, Any]) -> str:
    """Unique key for a proximity rule."""
    return f"prox|{rule.get('proximity_entity')}|{rule.get('control_entity')}"


def _enter_rule_key(rule: dict[str, Any]) -> str:
    """Unique key for enter task."""
    return f"enter|{rule.get('person_on')}|{rule.get('zone_on')}|{rule.get('control_entity')}"


def _exit_rule_key(rule: dict[str, Any]) -> str:
    """Unique key for exit task."""
    return f"exit|{rule.get('person_off')}|{rule.get('zone_off')}|{rule.get('control_entity')}"


class PresenceTracker:
    """Track person/zone presence and control climate on enter/exit (per-appliance)."""

    def __init__(self, hass: HomeAssistant, config_manager: "ConfigManager") -> None:
        self.hass = hass
        self.config_manager = config_manager
        self._unsubscribe: list[Any] = []
        self._enter_tasks: dict[str, asyncio.Task] = {}
        self._exit_tasks: dict[str, asyncio.Task] = {}
        self._proximity_enter_tasks: dict[str, asyncio.Task] = {}
        self._proximity_exit_tasks: dict[str, asyncio.Task] = {}

    async def async_stop(self) -> None:
        """Stop the presence tracker."""
        for unsub in self._unsubscribe:
            unsub()
        self._unsubscribe.clear()
        for task in list(self._enter_tasks.values()) + list(self._exit_tasks.values()):
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        self._enter_tasks.clear()
        self._exit_tasks.clear()

    def _setup_listeners(self) -> None:
        """Set up state listeners for all person entities (person_on and person_off) in appliance automation rules."""
        rules = _build_presence_rules(self.config_manager)
        person_entities: set[str] = set()
        for rule in rules:
            for key in ("person_on", "person_off"):
                person = (rule.get(key) or "").strip()
                if person and person.startswith("person."):
                    person_entities.add(person)

        if person_entities:
            unsub = async_track_state_change_event(
                self.hass,
                list(person_entities),
                self._on_person_state_change_event,
            )
            self._unsubscribe.append(unsub)

        self._setup_proximity_listeners()

    def _setup_proximity_listeners(self) -> None:
        """Set up state listeners for proximity entities (AHC-style geo-fencing)."""
        rules = _build_proximity_rules(self.config_manager)
        proximity_entities: set[str] = set()
        for rule in rules:
            ent = (rule.get("proximity_entity") or "").strip()
            if ent:
                proximity_entities.add(ent)
        if proximity_entities:
            unsub = async_track_state_change_event(
                self.hass,
                list(proximity_entities),
                self._on_proximity_state_change_event,
            )
            self._unsubscribe.append(unsub)

    @callback
    def _on_proximity_state_change_event(self, event) -> None:
        """Handle proximity entity state change (direction sensor)."""
        data = event.data
        self._on_proximity_state_change(
            data["entity_id"],
            data.get("old_state"),
            data.get("new_state"),
        )

    @callback
    def _on_proximity_state_change(
        self, entity_id: str, old_state: Any, new_state: Any
    ) -> None:
        """Handle proximity direction change: towards/arrived = on, away_from = off."""
        old_val = old_state.state if old_state else None
        new_val = new_state.state if new_state else None

        rules = _build_proximity_rules(self.config_manager)
        for rule in rules:
            if (rule.get("proximity_entity") or "").strip() != entity_id:
                continue
            control_entity = (rule.get("control_entity") or "").strip()
            if not control_entity:
                continue
            duration_sec = int(rule.get("proximity_duration_sec") or 300)
            prox_key = _proximity_rule_key(rule)
            enter_key = f"prox_enter|{prox_key}"
            exit_key = f"prox_exit|{prox_key}"

            distance_entity = (entity_id.replace("_direction", "_distance").replace("_dir", "")
                if "_direction" in entity_id or "_dir" in entity_id else "")
            distance_m = rule.get("proximity_distance_m") or 500
            if distance_entity:
                dstate = self.hass.states.get(distance_entity)
                try:
                    dist_val = float(dstate.state) if dstate and dstate.state not in ("unknown", "unavailable") else 99999
                except (ValueError, TypeError):
                    dist_val = 99999
                within_distance = dist_val <= distance_m
            else:
                within_distance = True

            now_approaching = _proximity_is_approaching(new_val) and within_distance
            was_approaching = _proximity_is_approaching(old_val) and within_distance
            now_leaving = _proximity_is_leaving(new_val) or (not within_distance if distance_entity else False)
            was_leaving = _proximity_is_leaving(old_val) or (not within_distance if distance_entity else False)

            if now_approaching and not was_approaching:
                if self._enter_tasks.get(enter_key) and not self._enter_tasks[enter_key].done():
                    self._enter_tasks[enter_key].cancel()
                    self._enter_tasks.pop(enter_key, None)
                self._enter_tasks[enter_key] = asyncio.create_task(
                    self._proximity_enter_delayed(rule, duration_sec)
                )
            if now_leaving and not was_leaving:
                if self._exit_tasks.get(exit_key) and not self._exit_tasks[exit_key].done():
                    self._exit_tasks[exit_key].cancel()
                    self._exit_tasks.pop(exit_key, None)
                self._exit_tasks[exit_key] = asyncio.create_task(
                    self._proximity_exit_delayed(rule, duration_sec)
                )

    @callback
    def _on_person_state_change_event(self, event) -> None:
        """Handle person state change (StateChanged event)."""
        data = event.data
        self._on_person_state_change(
            data["entity_id"],
            data.get("old_state"),
            data.get("new_state"),
        )

    @callback
    def _on_person_state_change(
        self, entity_id: str, old_state: Any, new_state: Any
    ) -> None:
        """Handle person entity state change."""
        old_val = old_state.state if old_state else None
        new_val = new_state.state if new_state else None

        rules = _build_presence_rules(self.config_manager)
        for rule in rules:
            person_on = (rule.get("person_on") or "").strip()
            person_off = (rule.get("person_off") or "").strip()
            zone_on = (rule.get("zone_on") or "").strip()
            zone_off = (rule.get("zone_off") or "").strip()
            control_entity = (rule.get("control_entity") or "").strip()
            if not control_entity:
                continue

            # Person entered/left zone_on -> handle enter task
            if entity_id == person_on and zone_on:
                enter_key = _enter_rule_key(rule)
                was_in = _person_in_zone(old_val, zone_on)
                now_in = _person_in_zone(new_val, zone_on)
                if self._enter_tasks.get(enter_key) and not self._enter_tasks[enter_key].done():
                    self._enter_tasks[enter_key].cancel()
                    self._enter_tasks.pop(enter_key, None)
                if now_in and not was_in:
                    enter_sec = int(rule.get("enter_duration_sec") or 30)
                    self._enter_tasks[enter_key] = asyncio.create_task(
                        self._enter_delayed(rule, enter_sec)
                    )

            # Person left zone_off -> handle exit task
            if entity_id == person_off and zone_off:
                exit_key = _exit_rule_key(rule)
                was_in = _person_in_zone(old_val, zone_off)
                now_in = _person_in_zone(new_val, zone_off)
                if self._exit_tasks.get(exit_key) and not self._exit_tasks[exit_key].done():
                    self._exit_tasks[exit_key].cancel()
                    self._exit_tasks.pop(exit_key, None)
                if was_in and not now_in:
                    exit_sec = int(rule.get("exit_duration_sec") or 300)
                    self._exit_tasks[exit_key] = asyncio.create_task(
                        self._exit_delayed(rule, exit_sec)
                    )

    async def _enter_delayed(self, rule: dict[str, Any], delay_sec: int) -> None:
        """After delay, if person_on still in zone_on, turn on appliance (climate or switch)."""
        await asyncio.sleep(delay_sec)
        enter_key = _enter_rule_key(rule)
        self._enter_tasks.pop(enter_key, None)

        person_on = (rule.get("person_on") or "").strip()
        zone_on = (rule.get("zone_on") or "").strip()
        control_entity = (rule.get("control_entity") or "").strip()
        is_smart = rule.get("is_smart", True)
        climate_entity = (rule.get("climate_entity") or "").strip()
        room = rule.get("room") or {}

        state = self.hass.states.get(person_on)
        if not state or not _person_in_zone(state.state, zone_on):
            return

        if not is_smart:
            await self.hass.services.async_call(
                "switch", "turn_on", {ATTR_ENTITY_ID: control_entity}, blocking=True,
            )
        else:
            from .power_detector import get_appliance_power_state, get_appliance_power_switch
            power_switch = get_appliance_power_switch(self.config_manager, control_entity)
            if power_switch:
                await self.hass.services.async_call(
                    "switch", "turn_on", {ATTR_ENTITY_ID: power_switch}, blocking=True,
                )
            else:
                power_state = get_appliance_power_state(
                    self.hass, self.config_manager, control_entity
                )
                if power_state == "off":
                    _LOGGER.debug(
                        "Skipping presence turn_on for %s: power sensor reports off",
                        control_entity,
                    )
                    return
                await self.hass.services.async_call(
                    "climate", "turn_on", {ATTR_ENTITY_ID: climate_entity}, blocking=True,
                )

            comfort_temp = float(room.get("comfort_temp_c", 22.0))
            temp_sensor = (room.get("temp_sensor") or "").strip()
            room_temp = comfort_temp
            if temp_sensor:
                tstate = self.hass.states.get(temp_sensor)
                if tstate and tstate.state not in ("unknown", "unavailable"):
                    unit = tstate.attributes.get("unit_of_measurement") if tstate.attributes else None
                    parsed = parse_temp_from_state(tstate.state, unit)
                    if parsed is not None:
                        room_temp = parsed
            mode = "heat" if room_temp < comfort_temp else "cool"
            min_t, max_t = 16.0, 30.0
            if climate_entity:
                cstate = self.hass.states.get(climate_entity)
                if cstate:
                    attrs = cstate.attributes or {}
                    try:
                        min_t = float(attrs.get("min_temp", 16))
                        max_t = float(attrs.get("max_temp", 30))
                    except (ValueError, TypeError):
                        pass
            set_temp = max_t if mode == "heat" else min_t
            await self.hass.services.async_call(
                "climate", "set_hvac_mode",
                {ATTR_ENTITY_ID: climate_entity, "hvac_mode": mode},
                blocking=True,
            )
            await self.hass.services.async_call(
                "climate", "set_temperature",
                {ATTR_ENTITY_ID: climate_entity, "temperature": set_temp},
                blocking=True,
            )

        try:
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event

            person_name = _entity_friendly_name(self.hass, person_on)
            zone_name = _entity_friendly_name(self.hass, zone_on)
            format_vars = {"person_name": person_name, "zone_name": zone_name}

            await async_send_tts_for_event(
                self.hass,
                self.config_manager,
                control_entity,
                TTS_PRESENCE_ENTER,
                **format_vars,
            )
            await async_send_notification_for_event(
                self.hass,
                self.config_manager,
                control_entity,
                TTS_PRESENCE_ENTER,
                **format_vars,
            )
        except Exception as e:
            _LOGGER.error("Presence enter: failed for %s: %s", control_entity, e)

    async def _exit_delayed(self, rule: dict[str, Any], delay_sec: int) -> None:
        """After delay, turn off appliance (unless person_off re-entered zone_off)."""
        await asyncio.sleep(delay_sec)
        exit_key = _exit_rule_key(rule)
        self._exit_tasks.pop(exit_key, None)

        person_off = (rule.get("person_off") or "").strip()
        zone_off = (rule.get("zone_off") or "").strip()
        control_entity = (rule.get("control_entity") or "").strip()
        is_smart = rule.get("is_smart", True)
        climate_entity = (rule.get("climate_entity") or "").strip()

        state = self.hass.states.get(person_off)
        if state and _person_in_zone(state.state, zone_off):
            return

        if not is_smart:
            await self.hass.services.async_call(
                "switch", "turn_off", {ATTR_ENTITY_ID: control_entity}, blocking=True,
            )
        else:
            from .power_detector import get_appliance_power_switch
            power_switch = get_appliance_power_switch(self.config_manager, control_entity)
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

            person_name = _entity_friendly_name(self.hass, person_off)
            zone_name = _entity_friendly_name(self.hass, zone_off)
            format_vars = {"person_name": person_name, "zone_name": zone_name}

            await async_send_tts_for_event(
                self.hass,
                self.config_manager,
                control_entity,
                TTS_PRESENCE_LEAVE,
                **format_vars,
            )
            await async_send_notification_for_event(
                self.hass,
                self.config_manager,
                control_entity,
                TTS_PRESENCE_LEAVE,
                **format_vars,
            )
        except Exception as e:
            _LOGGER.error("Presence exit: failed for %s: %s", control_entity, e)

    async def _proximity_enter_delayed(self, rule: dict[str, Any], delay_sec: int) -> None:
        """After delay, if still approaching (towards/arrived and within distance), turn on appliance."""
        await asyncio.sleep(delay_sec)
        enter_key = f"prox_enter|{_proximity_rule_key(rule)}"
        self._enter_tasks.pop(enter_key, None)

        prox_entity = (rule.get("proximity_entity") or "").strip()
        control_entity = (rule.get("control_entity") or "").strip()
        distance_m = int(rule.get("proximity_distance_m") or 500)
        room = rule.get("room") or {}
        is_smart = rule.get("is_smart", True)
        climate_entity = (rule.get("climate_entity") or "").strip()

        dir_state = self.hass.states.get(prox_entity)
        dir_val = dir_state.state if dir_state else None
        if not _proximity_is_approaching(dir_val):
            return
        distance_entity = _infer_distance_entity(prox_entity)
        if distance_entity:
            dist_state = self.hass.states.get(distance_entity)
            if dist_state and dist_state.state not in ("unknown", "unavailable"):
                try:
                    dist_val = float(dist_state.state)
                    if dist_val > distance_m:
                        return
                except (ValueError, TypeError):
                    pass

        if not is_smart:
            await self.hass.services.async_call(
                "switch", "turn_on", {ATTR_ENTITY_ID: control_entity}, blocking=True,
            )
        else:
            from .power_detector import get_appliance_power_state, get_appliance_power_switch
            power_switch = get_appliance_power_switch(self.config_manager, control_entity)
            if power_switch:
                await self.hass.services.async_call(
                    "switch", "turn_on", {ATTR_ENTITY_ID: power_switch}, blocking=True,
                )
            else:
                power_state = get_appliance_power_state(
                    self.hass, self.config_manager, control_entity
                )
                if power_state == "off":
                    _LOGGER.debug(
                        "Skipping proximity turn_on for %s: power sensor reports off",
                        control_entity,
                    )
                    return
                await self.hass.services.async_call(
                    "climate", "turn_on", {ATTR_ENTITY_ID: climate_entity}, blocking=True,
                )
            comfort_temp = float(room.get("comfort_temp_c", 22.0))
            temp_sensor = (room.get("temp_sensor") or "").strip()
            room_temp = comfort_temp
            if temp_sensor:
                tstate = self.hass.states.get(temp_sensor)
                if tstate and tstate.state not in ("unknown", "unavailable"):
                    unit = tstate.attributes.get("unit_of_measurement") if tstate.attributes else None
                    parsed = parse_temp_from_state(tstate.state, unit)
                    if parsed is not None:
                        room_temp = parsed
            mode = "heat" if room_temp < comfort_temp else "cool"
            min_t, max_t = 16.0, 30.0
            if climate_entity:
                cstate = self.hass.states.get(climate_entity)
                if cstate:
                    attrs = cstate.attributes or {}
                    try:
                        min_t = float(attrs.get("min_temp", 16))
                        max_t = float(attrs.get("max_temp", 30))
                    except (ValueError, TypeError):
                        pass
            set_temp = max_t if mode == "heat" else min_t
            await self.hass.services.async_call(
                "climate", "set_hvac_mode",
                {ATTR_ENTITY_ID: climate_entity, "hvac_mode": mode},
                blocking=True,
            )
            await self.hass.services.async_call(
                "climate", "set_temperature",
                {ATTR_ENTITY_ID: climate_entity, "temperature": set_temp},
                blocking=True,
            )

        try:
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event
            prox_name = _entity_friendly_name(self.hass, prox_entity)
            format_vars = {"person_name": "Proximity", "zone_name": prox_name}
            await async_send_tts_for_event(
                self.hass, self.config_manager, control_entity,
                TTS_PRESENCE_ENTER, **format_vars,
            )
            await async_send_notification_for_event(
                self.hass, self.config_manager, control_entity,
                TTS_PRESENCE_ENTER, **format_vars,
            )
        except Exception as e:
            _LOGGER.error("Proximity enter: failed for %s: %s", control_entity, e)

    async def _proximity_exit_delayed(self, rule: dict[str, Any], delay_sec: int) -> None:
        """After delay, if still leaving (away_from or distance > threshold), turn off appliance."""
        await asyncio.sleep(delay_sec)
        exit_key = f"prox_exit|{_proximity_rule_key(rule)}"
        self._exit_tasks.pop(exit_key, None)

        prox_entity = (rule.get("proximity_entity") or "").strip()
        control_entity = (rule.get("control_entity") or "").strip()
        distance_m = int(rule.get("proximity_distance_m") or 500)
        is_smart = rule.get("is_smart", True)
        climate_entity = (rule.get("climate_entity") or "").strip()

        dir_state = self.hass.states.get(prox_entity)
        dir_val = dir_state.state if dir_state else None
        if _proximity_is_approaching(dir_val):
            return
        distance_entity = _infer_distance_entity(prox_entity)
        if distance_entity:
            dist_state = self.hass.states.get(distance_entity)
            if dist_state and dist_state.state not in ("unknown", "unavailable"):
                try:
                    dist_val = float(dist_state.state)
                    if dist_val <= distance_m and _proximity_is_approaching(dir_val):
                        return
                except (ValueError, TypeError):
                    pass

        if not is_smart:
            await self.hass.services.async_call(
                "switch", "turn_off", {ATTR_ENTITY_ID: control_entity}, blocking=True,
            )
        else:
            from .power_detector import get_appliance_power_switch
            power_switch = get_appliance_power_switch(self.config_manager, control_entity)
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
            prox_name = _entity_friendly_name(self.hass, prox_entity)
            format_vars = {"person_name": "Proximity", "zone_name": prox_name}
            await async_send_tts_for_event(
                self.hass, self.config_manager, control_entity,
                TTS_PRESENCE_LEAVE, **format_vars,
            )
            await async_send_notification_for_event(
                self.hass, self.config_manager, control_entity,
                TTS_PRESENCE_LEAVE, **format_vars,
            )
        except Exception as e:
            _LOGGER.error("Proximity exit: failed for %s: %s", control_entity, e)


def _infer_distance_entity(direction_entity: str) -> str | None:
    """Infer distance sensor entity from direction entity (HA proximity naming)."""
    if not direction_entity or "_direction" not in direction_entity:
        return None
    return direction_entity.replace("_direction", "_distance").replace("_dir", "")


async def async_start_presence_tracker(
    hass: HomeAssistant, config_manager: "ConfigManager"
) -> None:
    """Start the presence tracker."""
    tracker = PresenceTracker(hass, config_manager)
    hass.data.setdefault(DOMAIN, {})["presence_tracker"] = tracker
    tracker._setup_listeners()
    _LOGGER.info("Home Climate presence tracker started")
