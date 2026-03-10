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

from .const import DOMAIN, TTS_PRESENCE_ENTER, TTS_PRESENCE_LEAVE

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
    control_entity: climate_entity (smart) or switch (simple).
    Returns list of {room, appliance, control_entity, climate_entity, person_on, zone_on, ...}.
    """
    rules = []
    for room in config_manager.rooms:
        for appliance in room.get("appliances", []):
            is_smart = appliance.get("is_smart_appliance", True)
            climate_entity = (appliance.get("climate_entity") or "").strip()
            switch_entity = config_manager.get_appliance_switch_entity(appliance)
            control_entity = climate_entity if is_smart and climate_entity else (switch_entity or "")
            if not control_entity:
                continue
            auto = appliance.get("automation") or {}
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
                    try:
                        room_temp = float(tstate.state)
                    except (ValueError, TypeError):
                        pass
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


async def async_start_presence_tracker(
    hass: HomeAssistant, config_manager: "ConfigManager"
) -> None:
    """Start the presence tracker."""
    tracker = PresenceTracker(hass, config_manager)
    hass.data.setdefault(DOMAIN, {})["presence_tracker"] = tracker
    tracker._setup_listeners()
    _LOGGER.info("Home Climate presence tracker started")
