"""Window/door tracker for Home Climate - turn off or lower climate when windows open (AHC-style)."""
from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event

if TYPE_CHECKING:
    from .config_manager import ConfigManager

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def _build_window_rules(config_manager: "ConfigManager") -> list[dict[str, Any]]:
    """
    Build window rules from room.appliances[].automation.

    Appliances with windows configured: when any window open for reaction_open_sec,
    set climate off or to window_open_temp_c. When all closed for reaction_close_sec, restore.
    """
    rules = []
    for room in config_manager.rooms:
        for appliance in room.get("appliances", []):
            auto = appliance.get("automation") or {}
            windows = auto.get("windows") or []
            if not isinstance(windows, list) or not windows:
                continue
            windows = [str(w).strip() for w in windows if str(w).strip()]
            if not windows:
                continue
            is_smart = appliance.get("is_smart_appliance", True)
            climate_entity = (appliance.get("climate_entity") or "").strip()
            if not is_smart or not climate_entity:
                continue
            reaction_open = max(0, min(3600, int(auto.get("window_reaction_open_sec") or 300)))
            reaction_close = max(0, min(7200, int(auto.get("window_reaction_close_sec") or 600)))
            window_open_temp = max(5, min(30, float(auto.get("window_open_temp_c") or 5.0)))
            rules.append({
                "room": room,
                "appliance": appliance,
                "climate_entity": climate_entity,
                "windows": windows,
                "reaction_open_sec": reaction_open,
                "reaction_close_sec": reaction_close,
                "window_open_temp_c": window_open_temp,
            })
    return rules


def _any_window_open(hass: HomeAssistant, window_entities: list[str]) -> bool:
    """Return True if any window/door sensor reports open."""
    for eid in window_entities:
        state = hass.states.get(eid)
        if not state:
            continue
        s = (state.state or "").lower().strip()
        if s in ("on", "open", "true", "opened", "opening"):
            return True
        if s in ("off", "closed", "false", "closed", "closing"):
            continue
        try:
            if float(s) > 0:
                return True
        except (ValueError, TypeError):
            pass
    return False


class WindowTracker:
    """Track window/door sensors and adjust climate when windows open (AHC-style)."""

    def __init__(self, hass: HomeAssistant, config_manager: "ConfigManager") -> None:
        self.hass = hass
        self.config_manager = config_manager
        self._unsubscribe: list[Any] = []
        self._open_tasks: dict[str, asyncio.Task] = {}
        self._close_tasks: dict[str, asyncio.Task] = {}
        self._window_state: dict[str, str] = {}

    async def async_stop(self) -> None:
        """Stop the window tracker."""
        for unsub in self._unsubscribe:
            unsub()
        self._unsubscribe.clear()
        for task in list(self._open_tasks.values()) + list(self._close_tasks.values()):
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        self._open_tasks.clear()
        self._close_tasks.clear()

    def _rule_key(self, rule: dict[str, Any]) -> str:
        return f"win|{rule.get('climate_entity')}"

    def _setup_listeners(self) -> None:
        """Set up state listeners for all window entities in rules."""
        rules = _build_window_rules(self.config_manager)
        entities: set[str] = set()
        for rule in rules:
            for eid in rule.get("windows") or []:
                if eid:
                    entities.add(eid)

        if entities:
            unsub = async_track_state_change_event(
                self.hass,
                list(entities),
                self._on_window_state_change,
            )
            self._unsubscribe.append(unsub)
            _LOGGER.info("Home Climate window tracker: listening to %s", list(entities))

    @callback
    def _on_window_state_change(self, event) -> None:
        """Handle window/door state change."""
        entity_id = event.data.get("entity_id")
        new_state = event.data.get("new_state")
        new_val = new_state.state if new_state else None

        rules = _build_window_rules(self.config_manager)
        for rule in rules:
            windows = rule.get("windows") or []
            if entity_id not in windows:
                continue

            rule_key = self._rule_key(rule)
            any_open = _any_window_open(self.hass, windows)

            if any_open:
                if self._close_tasks.get(rule_key):
                    t = self._close_tasks.pop(rule_key)
                    if not t.done():
                        t.cancel()
                delay = int(rule.get("reaction_open_sec") or 300)
                if self._open_tasks.get(rule_key):
                    old = self._open_tasks.pop(rule_key)
                    if not old.done():
                        old.cancel()
                self._open_tasks[rule_key] = asyncio.create_task(
                    self._window_open_delayed(rule, delay)
                )
            else:
                if self._open_tasks.get(rule_key):
                    t = self._open_tasks.pop(rule_key)
                    if not t.done():
                        t.cancel()
                delay = int(rule.get("reaction_close_sec") or 600)
                if self._close_tasks.get(rule_key):
                    old = self._close_tasks.pop(rule_key)
                    if not old.done():
                        old.cancel()
                self._close_tasks[rule_key] = asyncio.create_task(
                    self._window_close_delayed(rule, delay)
                )

    async def _window_open_delayed(self, rule: dict[str, Any], delay_sec: int) -> None:
        """After delay, if any window still open, set climate to off or window_open_temp."""
        await asyncio.sleep(delay_sec)
        rule_key = self._rule_key(rule)
        self._open_tasks.pop(rule_key, None)

        if not _any_window_open(self.hass, rule.get("windows") or []):
            return

        climate_entity = (rule.get("climate_entity") or "").strip()
        window_temp = float(rule.get("window_open_temp_c") or 5.0)

        await self.hass.services.async_call(
            "climate", "set_temperature",
            {ATTR_ENTITY_ID: climate_entity, "temperature": window_temp},
            blocking=True,
        )
        await self.hass.services.async_call(
            "climate", "set_hvac_mode",
            {ATTR_ENTITY_ID: climate_entity, "hvac_mode": "heat"},
            blocking=True,
        )
        _LOGGER.info("Window open: set %s to %.1f °C", climate_entity, window_temp)

    async def _window_close_delayed(self, rule: dict[str, Any], delay_sec: int) -> None:
        """After delay, if all windows closed, restore climate (comfort mode)."""
        await asyncio.sleep(delay_sec)
        rule_key = self._rule_key(rule)
        self._close_tasks.pop(rule_key, None)

        if _any_window_open(self.hass, rule.get("windows") or []):
            return

        climate_entity = (rule.get("climate_entity") or "").strip()
        room = rule.get("room") or {}
        comfort_temp = float(room.get("comfort_temp_c", 22.0))

        await self.hass.services.async_call(
            "climate", "set_temperature",
            {ATTR_ENTITY_ID: climate_entity, "temperature": comfort_temp},
            blocking=True,
        )
        _LOGGER.info("Windows closed: restored %s to %.1f °C", climate_entity, comfort_temp)


async def async_start_window_tracker(
    hass: HomeAssistant, config_manager: "ConfigManager"
) -> None:
    """Start the window tracker."""
    tracker = WindowTracker(hass, config_manager)
    hass.data.setdefault(DOMAIN, {})["window_tracker"] = tracker
    tracker._setup_listeners()
    _LOGGER.info("Home Climate window tracker started")
