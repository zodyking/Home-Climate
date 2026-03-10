"""Power detector: debounced on/off state from power sensor (per-appliance)."""
from __future__ import annotations

import asyncio
import logging
from collections import deque
from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant, callback

if TYPE_CHECKING:
    from .config_manager import ConfigManager

_LOGGER = logging.getLogger(__name__)


def _parse_power(value: Any) -> float | None:
    """Parse power from state, return Watts or None."""
    if value is None or value == "":
        return None
    try:
        return float(str(value).strip())
    except (ValueError, TypeError):
        return None


class PowerStateTracker:
    """Track power sensor values over debounce window; emit on/off when stable."""

    def __init__(
        self,
        hass: HomeAssistant,
        sensor: str,
        threshold_w: float,
        debounce_sec: int,
    ) -> None:
        self.hass = hass
        self.sensor = sensor
        self.threshold_w = threshold_w
        self.debounce_sec = debounce_sec
        self._values: deque[tuple[float, float]] = deque()  # (timestamp, value)
        self._last_state: str | None = None
        self._unsub: Any = None

    def _prune_old(self, now: float) -> None:
        """Remove values older than debounce window."""
        cutoff = now - self.debounce_sec
        while self._values and self._values[0][0] < cutoff:
            self._values.popleft()

    def _compute_state(self) -> str | None:
        """Return 'on' if all values in window above threshold, 'off' if all at/below, else None."""
        if not self._values:
            return self._last_state
        vals = [v for _, v in self._values]
        if all(v > self.threshold_w for v in vals):
            return "on"
        if all(v <= self.threshold_w for v in vals):
            return "off"
        return self._last_state

    @callback
    def _on_state_change(self, entity_id: str, old_state: Any, new_state: Any) -> None:
        """Handle power sensor state change."""
        if new_state is None or new_state.state in ("unknown", "unavailable"):
            return
        power = _parse_power(new_state.state)
        if power is None:
            return
        now = self.hass.loop.time()
        self._prune_old(now)
        self._values.append((now, power))
        self._last_state = self._compute_state()

    def start(self) -> None:
        """Start listening to power sensor."""
        from homeassistant.helpers.event import async_track_state_change_event

        state = self.hass.states.get(self.sensor)
        if state and state.state not in ("unknown", "unavailable"):
            power = _parse_power(state.state)
            if power is not None:
                now = self.hass.loop.time()
                self._values.append((now, power))
                self._last_state = "on" if power > self.threshold_w else "off"

        self._unsub = async_track_state_change_event(
            self.hass, [self.sensor], self._on_state_change_event
        )

    @callback
    def _on_state_change_event(self, event) -> None:
        """Handle power sensor state change (StateChanged event)."""
        data = event.data
        self._on_state_change(
            data["entity_id"],
            data.get("old_state"),
            data.get("new_state"),
        )

    def stop(self) -> None:
        """Stop listening."""
        if self._unsub:
            self._unsub()
            self._unsub = None
        self._values.clear()
        self._last_state = None

    def get_state(self) -> str | None:
        """Return current debounced state: 'on', 'off', or None (not enough data)."""
        now = self.hass.loop.time()
        self._prune_old(now)
        return self._compute_state()


_trackers: dict[str, PowerStateTracker] = {}


def _tracker_key(climate_entity: str) -> str:
    return climate_entity


def get_appliance_power_state(
    hass: HomeAssistant,
    config_manager: "ConfigManager",
    control_entity: str,
) -> str | None:
    """
    Return power-based on/off state for appliance, or None to use climate entity.

    control_entity: climate entity (smart) or switch entity (simple).
    Returns 'on' | 'off' when power sensor is enabled and debounced state is known.
    """
    pair = config_manager.get_room_for_control_entity(control_entity)
    if not pair:
        return None
    _room, appliance = pair
    ps = appliance.get("power_sensor") or {}
    if not ps or not ps.get("enabled"):
        return None
    sensor = (ps.get("sensor") or "").strip()
    if not sensor:
        return None
    threshold = float(ps.get("power_threshold_w", 10))
    debounce = max(1, min(60, int(ps.get("debounce_sec", 5))))

    key = _tracker_key(control_entity)
    existing = _trackers.get(key)
    if existing:
        if (
            existing.sensor != sensor
            or existing.threshold_w != threshold
            or existing.debounce_sec != debounce
        ):
            existing.stop()
            del _trackers[key]
            existing = None
    if key not in _trackers:
        tracker = PowerStateTracker(hass, sensor, threshold, debounce)
        tracker.start()
        _trackers[key] = tracker
    return _trackers[key].get_state()


def get_appliance_power_switch(
    config_manager: "ConfigManager",
    control_entity: str,
) -> str | None:
    """
    Return switch entity for on/off control when power override is active, or None.

    control_entity: climate entity (smart) or switch entity (simple).
    When power_sensor.enabled and power_sensor.switch are set, automations should
    call switch.turn_on/off instead of climate.turn_on/off.
    """
    pair = config_manager.get_room_for_control_entity(control_entity)
    if not pair:
        return None
    _room, appliance = pair
    ps = appliance.get("power_sensor") or {}
    if not ps or not ps.get("enabled"):
        return None
    return (ps.get("switch") or "").strip() or None


def async_stop_power_detectors(hass: HomeAssistant) -> None:
    """Stop all power state trackers (on integration unload)."""
    for tracker in _trackers.values():
        tracker.stop()
    _trackers.clear()
