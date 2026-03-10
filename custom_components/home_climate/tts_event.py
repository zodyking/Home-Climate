"""TTS event helper: resolve room/appliance, template, and send TTS."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant

from .const import (
    TTS_EVENT_KEYS,
    TTS_MANUAL_ON,
    TTS_MANUAL_OFF,
    TTS_MODE_CHANGE,
    TTS_TEMP_CHANGE,
    TTS_PRESENCE_ENTER,
    TTS_PRESENCE_LEAVE,
    TTS_FAN_CHANGE,
    DEFAULT_TTS_MESSAGES,
)

if TYPE_CHECKING:
    from .config_manager import ConfigManager

_LOGGER = logging.getLogger(__name__)


def _format_for_speech(s: str) -> str:
    """Replace underscores with spaces for TTS (e.g. fan_only -> fan only)."""
    if not s:
        return ""
    return str(s).replace("_", " ").strip()


def _mode_for_display(mode: str) -> str:
    """Map HVAC mode to user-friendly label for TTS/notifications (e.g. dry -> dehumidifier)."""
    if not mode:
        return ""
    m = str(mode).strip().lower()
    if m == "dry":
        return "dehumidifier"
    return _format_for_speech(mode)


async def async_send_tts_for_event(
    hass: HomeAssistant,
    config_manager: "ConfigManager",
    climate_entity: str,
    event: str,
    **format_vars: Any,
) -> None:
    """
    Send TTS for an event (manual_on, manual_off, mode_change, etc.).

    Resolves room and appliance from climate_entity, uses room media_player and volume,
    picks template from room tts_overrides or global messages, checks enabled, formats and sends.
    """
    if event not in TTS_EVENT_KEYS:
        _LOGGER.warning("Unknown TTS event: %s", event)
        return

    pair = config_manager.get_room_for_control_entity(climate_entity)
    if not pair:
        _LOGGER.debug("No room/appliance for %s, skipping TTS", climate_entity)
        return

    room, appliance = pair
    media_player = (room.get("media_player") or "").strip()
    if not media_player:
        _LOGGER.debug("No media player for room %s, skipping TTS", room.get("name"))
        return

    tts_settings = config_manager.tts_settings
    msg_entry = tts_settings.get("messages", {}).get(event)
    if not msg_entry or not msg_entry.get("enabled", True):
        return

    template = (
        room.get("tts_overrides") or {}
    ).get(event) or msg_entry.get("template", "")
    if not template:
        template = DEFAULT_TTS_MESSAGES.get(event, "")
    if not template:
        return

    room_name = room.get("name") or "Room"
    device_name = config_manager.get_device_name(appliance)
    device_type = appliance.get("device_type") or "minisplit"
    prefix = tts_settings.get("prefix", "Message from Home Climate.")

    vars_dict = {
        "prefix": prefix,
        "room_name": room_name,
        "device_name": device_name,
        "device_type": device_type,
        "temp": format_vars.get("temp", ""),
        "person_name": format_vars.get("person_name", "Someone"),
        "zone_name": format_vars.get("zone_name", "zone"),
    }
    vars_dict.update(format_vars)
    vars_dict["mode"] = _mode_for_display(str(vars_dict.get("mode", "")))
    vars_dict["fan_mode"] = _format_for_speech(str(vars_dict.get("fan_mode", "")))

    try:
        message = template.format(**vars_dict)
    except KeyError as e:
        _LOGGER.warning("TTS template missing variable %s: %s", e, template)
        return

    from .tts_queue import async_send_tts_or_queue

    volume = room.get("volume")
    if volume is None:
        volume = tts_settings.get("volume", 0.7)

    await async_send_tts_or_queue(
        hass,
        media_player=media_player,
        message=message,
        language=tts_settings.get("language"),
        volume=float(volume) if volume is not None else 0.7,
    )
