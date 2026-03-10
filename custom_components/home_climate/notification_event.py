"""Notification event helper: resolve room/recipients, template, and send notify."""
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
    """Replace underscores with spaces (e.g. fan_only -> fan only)."""
    if not s:
        return ""
    return str(s).replace("_", " ").strip()


async def async_send_notification_for_event(
    hass: HomeAssistant,
    config_manager: "ConfigManager",
    climate_entity: str,
    event: str,
    **format_vars: Any,
) -> None:
    """
    Send notification for an event (manual_on, manual_off, mode_change, etc.).

    Resolves room and recipients, picks template from notification_settings,
    checks enabled, formats and sends to each room recipient's notify entity.
    """
    if event not in TTS_EVENT_KEYS:
        _LOGGER.warning("Unknown notification event: %s", event)
        return

    pair = config_manager.get_room_for_climate_entity(climate_entity)
    if not pair:
        _LOGGER.debug(
            "No room/appliance for %s, skipping notification", climate_entity
        )
        return

    room, appliance = pair

    notif_settings = config_manager.notification_settings
    if not notif_settings.get("enabled", True):
        return

    notify_entity = (notif_settings.get("notify_entity") or "").strip()
    if not notify_entity:
        _LOGGER.debug(
            "No notify entity configured, skipping notification for %s",
            room.get("name"),
        )
        return
    msg_entry = notif_settings.get("messages", {}).get(event)
    if not msg_entry or not msg_entry.get("enabled", True):
        return

    template = msg_entry.get("template", "")
    if not template:
        template = DEFAULT_TTS_MESSAGES.get(event, "")
    if not template:
        return

    room_name = room.get("name") or "Room"
    device_name = config_manager.get_device_name(appliance)
    device_type = appliance.get("device_type") or "minisplit"
    prefix = notif_settings.get("prefix", "Home Climate")

    vars_dict = {
        "prefix": prefix,
        "room_name": room_name,
        "device_name": device_name,
        "device_type": device_type,
        "temp": format_vars.get("temp", ""),
    }
    vars_dict.update(format_vars)
    vars_dict["mode"] = _format_for_speech(str(vars_dict.get("mode", "")))
    vars_dict["fan_mode"] = _format_for_speech(str(vars_dict.get("fan_mode", "")))

    try:
        message = template.format(**vars_dict)
    except KeyError as e:
        _LOGGER.warning(
            "Notification template missing variable %s: %s", e, template
        )
        return

    title = prefix
    try:
        service_name = (
            notify_entity.split(".", 1)[1]
            if notify_entity.startswith("notify.")
            else notify_entity
        )
        await hass.services.async_call(
            "notify",
            service_name,
            {"title": title, "message": message},
            blocking=False,
        )
    except Exception as e:
        _LOGGER.warning(
            "Failed to send notification to %s: %s", notify_entity, e
        )
