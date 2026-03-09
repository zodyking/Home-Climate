"""Presence tracker for Home Climate - person/zone enter/exit automation."""
from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, callback

if TYPE_CHECKING:
    from .config_manager import ConfigManager

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def _rule_key(rule: dict[str, Any]) -> str:
    """Unique key for a presence rule."""
    return f"{rule.get('person')}|{rule.get('zone')}|{rule.get('climate_entity')}"


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


class PresenceTracker:
    """Track person/zone presence and control climate on enter/exit."""

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
        """Set up state listeners for all person entities in rules."""
        rules = self.config_manager.presence_rules
        person_entities: set[str] = set()
        for rule in rules:
            person = (rule.get("person") or "").strip()
            if person and person.startswith("person."):
                person_entities.add(person)

        for entity_id in person_entities:
            unsub = self.hass.helpers.event.async_track_state_change(
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

        rules = self.config_manager.presence_rules
        for rule in rules:
            if (rule.get("person") or "").strip() != entity_id:
                continue

            zone = (rule.get("zone") or "").strip()
            climate_entity = (rule.get("climate_entity") or "").strip()
            if not zone or not climate_entity:
                continue

            key = _rule_key(rule)
            was_in_zone = _person_in_zone(old_val, zone)
            now_in_zone = _person_in_zone(new_val, zone)

            if self._enter_tasks.get(key) and not self._enter_tasks[key].done():
                self._enter_tasks[key].cancel()
                self._enter_tasks.pop(key, None)
            if self._exit_tasks.get(key) and not self._exit_tasks[key].done():
                self._exit_tasks[key].cancel()
                self._exit_tasks.pop(key, None)

            if now_in_zone and not was_in_zone:
                enter_sec = int(rule.get("enter_duration_sec") or 30)
                self._enter_tasks[key] = asyncio.create_task(
                    self._enter_delayed(rule, enter_sec)
                )
            elif was_in_zone and not now_in_zone:
                exit_sec = int(rule.get("exit_duration_sec") or 300)
                self._exit_tasks[key] = asyncio.create_task(
                    self._exit_delayed(rule, exit_sec)
                )

    async def _enter_delayed(self, rule: dict[str, Any], delay_sec: int) -> None:
        """After delay, if person still in zone, turn on climate."""
        await asyncio.sleep(delay_sec)
        key = _rule_key(rule)
        self._enter_tasks.pop(key, None)

        person = (rule.get("person") or "").strip()
        zone = (rule.get("zone") or "").strip()
        climate_entity = (rule.get("climate_entity") or "").strip()

        state = self.hass.states.get(person)
        if not state or not _person_in_zone(state.state, zone):
            return

        try:
            await self.hass.services.async_call(
                "climate",
                "turn_on",
                {ATTR_ENTITY_ID: climate_entity},
                blocking=True,
            )

            target_temp = rule.get("target_temp_on_enter")
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

            tts_settings = self.config_manager.tts_settings
            media_player = (tts_settings.get("media_player") or "").strip()
            if media_player:
                from .tts_queue import async_send_tts_or_queue

                prefix = tts_settings.get("prefix", "Message from Home Climate.")
                msg_template = tts_settings.get(
                    "presence_on_msg",
                    "{prefix} {room_name} climate turned on",
                )
                room_name = self._room_name_for_climate(climate_entity)
                message = msg_template.format(
                    prefix=prefix,
                    room_name=room_name or "Room",
                )
                await async_send_tts_or_queue(
                    self.hass,
                    media_player=media_player,
                    message=message,
                    language=tts_settings.get("language"),
                    volume=tts_settings.get("volume"),
                )
        except Exception as e:
            _LOGGER.error("Presence enter: failed to turn on %s: %s", climate_entity, e)

    async def _exit_delayed(self, rule: dict[str, Any], delay_sec: int) -> None:
        """After delay, turn off climate (unless person re-entered)."""
        await asyncio.sleep(delay_sec)
        key = _rule_key(rule)
        self._exit_tasks.pop(key, None)

        person = (rule.get("person") or "").strip()
        zone = (rule.get("zone") or "").strip()
        climate_entity = (rule.get("climate_entity") or "").strip()

        state = self.hass.states.get(person)
        if state and _person_in_zone(state.state, zone):
            return

        try:
            await self.hass.services.async_call(
                "climate",
                "turn_off",
                {ATTR_ENTITY_ID: climate_entity},
                blocking=True,
            )

            tts_settings = self.config_manager.tts_settings
            media_player = (tts_settings.get("media_player") or "").strip()
            if media_player:
                from .tts_queue import async_send_tts_or_queue

                prefix = tts_settings.get("prefix", "Message from Home Climate.")
                msg_template = tts_settings.get(
                    "presence_off_msg",
                    "{prefix} {room_name} climate turned off",
                )
                room_name = self._room_name_for_climate(climate_entity)
                message = msg_template.format(
                    prefix=prefix,
                    room_name=room_name or "Room",
                )
                await async_send_tts_or_queue(
                    self.hass,
                    media_player=media_player,
                    message=message,
                    language=tts_settings.get("language"),
                    volume=tts_settings.get("volume"),
                )
        except Exception as e:
            _LOGGER.error("Presence exit: failed to turn off %s: %s", climate_entity, e)

    def _room_name_for_climate(self, climate_entity: str) -> str | None:
        """Get room name for a climate entity from config."""
        for room in self.config_manager.rooms:
            if (room.get("climate_entity") or "") == climate_entity:
                return room.get("name")
        return None


async def async_start_presence_tracker(
    hass: HomeAssistant, config_manager: "ConfigManager"
) -> None:
    """Start the presence tracker."""
    tracker = PresenceTracker(hass, config_manager)
    hass.data.setdefault(DOMAIN, {})["presence_tracker"] = tracker
    tracker._setup_listeners()
    _LOGGER.info("Home Climate presence tracker started")
