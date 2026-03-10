"""Presence tracker for Home Climate - person/zone enter/exit automation (per-appliance)."""
from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change

if TYPE_CHECKING:
    from .config_manager import ConfigManager

from .const import DOMAIN, TTS_PRESENCE_ENTER, TTS_PRESENCE_LEAVE

_LOGGER = logging.getLogger(__name__)


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
    Returns list of {room, appliance, climate_entity, person_on, zone_on, person_off, zone_off, ...}.
    """
    rules = []
    for room in config_manager.rooms:
        for appliance in room.get("appliances", []):
            climate_entity = (appliance.get("climate_entity") or "").strip()
            if not climate_entity:
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
                "climate_entity": climate_entity,
                "person_on": person_on,
                "zone_on": zone_on,
                "person_off": person_off,
                "zone_off": zone_off,
                "enter_duration_sec": max(0, min(600, int(auto.get("enter_duration_sec") or 30))),
                "exit_duration_sec": max(0, min(3600, int(auto.get("exit_duration_sec") or 300))),
                "target_temp_on_enter": auto.get("target_temp_on_enter"),
            })
    return rules


def _enter_rule_key(rule: dict[str, Any]) -> str:
    """Unique key for enter task."""
    return f"enter|{rule.get('person_on')}|{rule.get('zone_on')}|{rule.get('climate_entity')}"


def _exit_rule_key(rule: dict[str, Any]) -> str:
    """Unique key for exit task."""
    return f"exit|{rule.get('person_off')}|{rule.get('zone_off')}|{rule.get('climate_entity')}"


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

        for entity_id in person_entities:
            unsub = async_track_state_change(
                self.hass,
                entity_id,
                self._on_person_state_change,
            )
            self._unsubscribe.append(unsub)

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
            climate_entity = (rule.get("climate_entity") or "").strip()
            if not climate_entity:
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
        """After delay, if person_on still in zone_on, turn on climate."""
        await asyncio.sleep(delay_sec)
        enter_key = _enter_rule_key(rule)
        self._enter_tasks.pop(enter_key, None)

        person_on = (rule.get("person_on") or "").strip()
        zone_on = (rule.get("zone_on") or "").strip()
        climate_entity = (rule.get("climate_entity") or "").strip()

        state = self.hass.states.get(person_on)
        if not state or not _person_in_zone(state.state, zone_on):
            return

        from .power_detector import get_appliance_power_state, get_appliance_power_switch
        power_switch = get_appliance_power_switch(self.config_manager, climate_entity)
        if power_switch:
            await self.hass.services.async_call(
                "switch",
                "turn_on",
                {ATTR_ENTITY_ID: power_switch},
                blocking=True,
            )
        else:
            power_state = get_appliance_power_state(
                self.hass, self.config_manager, climate_entity
            )
            if power_state == "off":
                _LOGGER.debug(
                    "Skipping presence turn_on for %s: power sensor reports off",
                    climate_entity,
                )
                return
            await self.hass.services.async_call(
                "climate",
                "turn_on",
                {ATTR_ENTITY_ID: climate_entity},
                blocking=True,
            )

        target_temp = rule.get("target_temp_on_enter")
        try:
            if target_temp is not None:
                await self.hass.services.async_call(
                    "climate",
                    "set_temperature",
                    {
                        ATTR_ENTITY_ID: climate_entity,
                        "temperature": float(target_temp),
                    },
                    blocking=True,
                )
        except Exception as e:
            _LOGGER.error("Presence enter: failed to turn on %s: %s", climate_entity, e)
            return

        try:
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event

            await async_send_tts_for_event(
                self.hass,
                self.config_manager,
                climate_entity,
                TTS_PRESENCE_ENTER,
            )
            await async_send_notification_for_event(
                self.hass,
                self.config_manager,
                climate_entity,
                TTS_PRESENCE_ENTER,
            )
        except Exception as e:
            _LOGGER.error("Presence enter: failed to turn on %s: %s", climate_entity, e)

    async def _exit_delayed(self, rule: dict[str, Any], delay_sec: int) -> None:
        """After delay, turn off climate (unless person_off re-entered zone_off)."""
        await asyncio.sleep(delay_sec)
        exit_key = _exit_rule_key(rule)
        self._exit_tasks.pop(exit_key, None)

        person_off = (rule.get("person_off") or "").strip()
        zone_off = (rule.get("zone_off") or "").strip()
        climate_entity = (rule.get("climate_entity") or "").strip()

        state = self.hass.states.get(person_off)
        if state and _person_in_zone(state.state, zone_off):
            return

        from .power_detector import get_appliance_power_switch
        power_switch = get_appliance_power_switch(self.config_manager, climate_entity)
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
                {ATTR_ENTITY_ID: climate_entity},
                blocking=True,
            )

        try:
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event

            await async_send_tts_for_event(
                self.hass,
                self.config_manager,
                climate_entity,
                TTS_PRESENCE_LEAVE,
            )
            await async_send_notification_for_event(
                self.hass,
                self.config_manager,
                climate_entity,
                TTS_PRESENCE_LEAVE,
            )
        except Exception as e:
            _LOGGER.error("Presence exit: failed to turn off %s: %s", climate_entity, e)


async def async_start_presence_tracker(
    hass: HomeAssistant, config_manager: "ConfigManager"
) -> None:
    """Start the presence tracker."""
    tracker = PresenceTracker(hass, config_manager)
    hass.data.setdefault(DOMAIN, {})["presence_tracker"] = tracker
    tracker._setup_listeners()
    _LOGGER.info("Home Climate presence tracker started")
