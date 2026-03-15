"""Schedule evaluator for Home Climate - determines comfort vs eco based on schedules (AHC parity)."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant

if TYPE_CHECKING:
    from .config_manager import ConfigManager

_LOGGER = logging.getLogger(__name__)


def get_schedule_state(hass: HomeAssistant, room: dict[str, Any]) -> str:
    """
    Return "comfort" or "eco" based on room schedule configuration.

    - If no schedule_entities: default to "comfort" (always on)
    - If schedule_selector set: use it to pick which schedule is active
    - Otherwise: first schedule in schedule_entities
    - Schedule state "on" -> comfort, "off" -> eco
    """
    schedule_entities = room.get("schedule_entities") or []
    schedule_selector = (room.get("schedule_selector") or "").strip()

    if not schedule_entities:
        return "comfort"

    # Resolve which schedule is active (selector or first)
    active_schedule_entity = None
    if schedule_selector:
        sel_state = hass.states.get(schedule_selector)
        if sel_state and sel_state.state not in ("unknown", "unavailable"):
            # Selector can be: input_select (friendly name), input_number (1-based index),
            # input_boolean (on=2nd, off=1st)
            val = str(sel_state.state).strip().lower()
            try:
                idx = int(float(val))
                if 1 <= idx <= len(schedule_entities):
                    active_schedule_entity = schedule_entities[idx - 1]
            except (ValueError, TypeError):
                for ent in schedule_entities:
                    ent_state = hass.states.get(ent)
                    name = (ent_state.attributes.get("friendly_name") or ent).lower() if ent_state else ""
                    if val in name or name in val:
                        active_schedule_entity = ent
                        break
                if not active_schedule_entity and schedule_entities:
                    active_schedule_entity = schedule_entities[0]
    if not active_schedule_entity and schedule_entities:
        active_schedule_entity = schedule_entities[0]

    if not active_schedule_entity:
        return "comfort"

    state = hass.states.get(active_schedule_entity)
    if not state or state.state in ("unknown", "unavailable"):
        return "eco"
    if str(state.state).lower() in ("on", "active", "true", "1"):
        return "comfort"
    return "eco"


def get_effective_comfort_temp(
    hass: HomeAssistant,
    config_manager: "ConfigManager",
    room: dict[str, Any],
    climate_entity: str,
) -> float:
    """
    Return the effective target temp (comfort or eco) for a room/appliance.

    Uses schedule state + room comfort_temp_c / eco_temp_c.
    """
    schedule_state = get_schedule_state(hass, room)
    if schedule_state == "eco":
        return float(room.get("eco_temp_c") or 19.0)
    return float(room.get("comfort_temp_c") or 22.0)


def get_effective_hvac_mode(
    hass: HomeAssistant,
    room: dict[str, Any],
    schedule_state: str | None = None,
) -> str:
    """Return HVAC mode (comfort or eco) for the room based on schedule."""
    if schedule_state is None:
        schedule_state = get_schedule_state(hass, room)
    if schedule_state == "eco":
        return str(room.get("eco_hvac_mode") or "heat").lower()
    return str(room.get("comfort_hvac_mode") or "heat").lower()
