"""Notification event helper: resolve room/recipients, template, and send notify."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant

from .const import (
    NOTIFICATION_EVENT_KEYS,
    TTS_MANUAL_ON,
    TTS_MANUAL_OFF,
    TTS_MODE_CHANGE,
    TTS_TEMP_CHANGE,
    TTS_PRESENCE_ENTER,
    TTS_PRESENCE_LEAVE,
    TTS_FAN_CHANGE,
    DEFAULT_NOTIFICATION_MESSAGES,
)

if TYPE_CHECKING:
    from .config_manager import ConfigManager

_LOGGER = logging.getLogger(__name__)


def _format_for_speech(s: str) -> str:
    """Replace underscores with spaces (e.g. fan_only -> fan only)."""
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
    if event not in NOTIFICATION_EVENT_KEYS:
        _LOGGER.warning("Unknown notification event: %s", event)
        return

    pair = config_manager.get_room_for_control_entity(climate_entity)
    if not pair:
        _LOGGER.debug(
            "No room/appliance for %s, skipping notification", climate_entity
        )
        return

    room, appliance = pair

    notif_settings = config_manager.notification_settings
    if not notif_settings.get("enabled", True):
        _LOGGER.debug("Notifications disabled globally, skipping for %s", event)
        return

    notify_entity = (room.get("notify_entity") or "").strip() or (notif_settings.get("notify_entity") or "").strip()
    if not notify_entity:
        _LOGGER.debug(
            "No notify entity configured for room %s, skipping notification for %s",
            room.get("name"),
            event,
        )
        return
    msg_entry = notif_settings.get("messages", {}).get(event)
    if not msg_entry or not msg_entry.get("enabled", True):
        _LOGGER.debug("Notification for event %s disabled or no template", event)
        return

    template = msg_entry.get("template", "")
    if not template:
        template = DEFAULT_NOTIFICATION_MESSAGES.get(event, "")
    if not template:
        return

    room_name = room.get("name") or "Room"
    device_name = config_manager.get_device_name(appliance)
    device_type = appliance.get("device_type") or "minisplit"
    prefix = notif_settings.get("prefix", "Home Climate")

    vars_dict = {
        "prefix": "",  # Not in message body; prefix goes to title only
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
        message = " ".join(template.format(**vars_dict).split())
    except KeyError as e:
        _LOGGER.warning(
            "Notification template missing variable %s: %s", e, template
        )
        return

    title = prefix
    # Sanitize: HA mobile_app uses brandons_iphone not brandon's_iphone (strip apostrophe-like chars)
    _apostrophes = "'\u2018\u2019\u201a\u201b\u2032`\""
    safe = str(notify_entity).strip()
    for c in _apostrophes:
        safe = safe.replace(c, "")
    entity_id = safe if safe.startswith("notify.") else f"notify.{safe}"
    service_name = entity_id.split(".", 1)[1] if "." in entity_id else safe

    _LOGGER.debug(
        "Sending notification for %s to %s: %s", event, entity_id, message[:80]
    )
    try:
        await hass.services.async_call(
            "notify",
            service_name,
            {"title": title, "message": message},
            blocking=False,
        )
    except Exception as e:
        _LOGGER.warning(
            "Failed to send notification to %s for %s: %s",
            entity_id,
            event,
            e,
        )
