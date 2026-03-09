"""WebSocket API for Home Climate integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def async_setup(hass: HomeAssistant) -> None:
    """Set up WebSocket API."""
    websocket_api.async_register_command(hass, websocket_get_config)
    websocket_api.async_register_command(hass, websocket_save_config)
    websocket_api.async_register_command(hass, websocket_get_entities)
    websocket_api.async_register_command(hass, websocket_get_user_info)
    websocket_api.async_register_command(hass, websocket_send_tts)
    websocket_api.async_register_command(hass, websocket_get_dashboard_data)
    _LOGGER.info("Home Climate WebSocket API registered")


def _get_connection_user_id(connection: Any) -> str | None:
    """Get user ID from WebSocket connection (for admin check in get_user_info)."""
    if hasattr(connection, "user") and connection.user:
        return getattr(connection.user, "id", None)
    return None


@websocket_api.websocket_command(
    {vol.Required("type"): "home_weather/get_config"}
)
@websocket_api.async_response
async def websocket_get_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get the full configuration."""
    config_manager = hass.data.get(DOMAIN, {}).get("config_manager")
    if config_manager:
        connection.send_result(msg["id"], config_manager.config)
    else:
        connection.send_error(msg["id"], "not_ready", "Config manager not initialized")


@websocket_api.websocket_command(
    {
        vol.Required("type"): "home_weather/save_config",
        vol.Required("config"): dict,
    }
)
@websocket_api.async_response
async def websocket_save_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Save Home Climate configuration."""
    config_manager = hass.data.get(DOMAIN, {}).get("config_manager")
    if not config_manager:
        connection.send_error(msg["id"], "not_ready", "Config manager not initialized")
        return
    try:
        await config_manager.async_update_config(msg["config"])
        connection.send_result(msg["id"], {"success": True})
    except Exception as e:
        _LOGGER.exception("Failed to save config: %s", e)
        connection.send_error(msg["id"], "save_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "home_weather/get_entities",
        vol.Optional("entity_type"): str,
    }
)
@websocket_api.async_response
async def websocket_get_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get available entities (climate, sensors, persons, zones, media players)."""
    entity_type = msg.get("entity_type")
    result: dict[str, list[dict[str, Any]]] = {
        "climate": [],
        "sensors": [],
        "persons": [],
        "zones": [],
        "media_players": [],
    }

    for state in hass.states.async_all():
        entity_id = state.entity_id
        friendly_name = state.attributes.get("friendly_name", entity_id)

        if entity_type is None or entity_type == "climate":
            if entity_id.startswith("climate."):
                result["climate"].append({
                    "entity_id": entity_id,
                    "friendly_name": friendly_name,
                })

        if entity_type is None or entity_type == "sensor":
            if entity_id.startswith("sensor."):
                unit = state.attributes.get("unit_of_measurement", "")
                result["sensors"].append({
                    "entity_id": entity_id,
                    "friendly_name": friendly_name,
                    "unit": unit,
                })

        if entity_type is None or entity_type == "person":
            if entity_id.startswith("person."):
                result["persons"].append({
                    "entity_id": entity_id,
                    "friendly_name": friendly_name,
                })

        if entity_type is None or entity_type == "zone":
            if entity_id.startswith("zone."):
                result["zones"].append({
                    "entity_id": entity_id,
                    "friendly_name": friendly_name,
                })

        if entity_type is None or entity_type == "media_player":
            if entity_id.startswith("media_player."):
                result["media_players"].append({
                    "entity_id": entity_id,
                    "friendly_name": friendly_name,
                })

    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {vol.Required("type"): "home_weather/get_user_info"}
)
@websocket_api.async_response
async def websocket_get_user_info(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get current user info (is_admin) for conditional UI."""
    is_admin = False
    if hasattr(connection, "user") and connection.user:
        is_admin = getattr(connection.user, "is_admin", False)
    connection.send_result(msg["id"], {"is_admin": is_admin})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "home_weather/send_tts",
        vol.Required("media_player"): str,
        vol.Required("message"): str,
        vol.Optional("language"): str,
        vol.Optional("volume"): vol.Coerce(float),
    }
)
@websocket_api.async_response
async def websocket_send_tts(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Send TTS to a media player."""
    from .tts_queue import async_send_tts_or_queue

    try:
        await async_send_tts_or_queue(
            hass,
            media_player=msg["media_player"],
            message=msg["message"],
            language=msg.get("language"),
            volume=msg.get("volume"),
        )
        connection.send_result(msg["id"], {"success": True})
    except Exception as e:
        _LOGGER.error("TTS failed: %s", e)
        connection.send_error(msg["id"], "tts_failed", str(e))


@websocket_api.websocket_command(
    {vol.Required("type"): "home_weather/get_dashboard_data"}
)
@websocket_api.async_response
async def websocket_get_dashboard_data(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get dashboard data (room states with temp, humidity, climate status)."""
    config_manager = hass.data.get(DOMAIN, {}).get("config_manager")
    if not config_manager:
        connection.send_result(msg["id"], {"rooms": []})
        return

    rooms_data = []
    for room in config_manager.rooms:
        temp = None
        humidity = None
        climate_state = None
        climate_mode = None

        if room.get("temp_sensor"):
            state = hass.states.get(room["temp_sensor"])
            if state and state.state not in ("unknown", "unavailable"):
                try:
                    temp = float(state.state)
                except (ValueError, TypeError):
                    pass

        if room.get("humidity_sensor"):
            state = hass.states.get(room["humidity_sensor"])
            if state and state.state not in ("unknown", "unavailable"):
                try:
                    humidity = float(state.state)
                except (ValueError, TypeError):
                    pass

        if room.get("climate_entity"):
            state = hass.states.get(room["climate_entity"])
            if state:
                climate_state = state.state
                climate_mode = state.attributes.get("hvac_mode")

        rooms_data.append({
            "id": room.get("id"),
            "name": room.get("name"),
            "climate_entity": room.get("climate_entity"),
            "temp_sensor": room.get("temp_sensor"),
            "humidity_sensor": room.get("humidity_sensor"),
            "temp": temp,
            "humidity": humidity,
            "climate_state": climate_state,
            "climate_mode": climate_mode,
        })

    connection.send_result(msg["id"], {"rooms": rooms_data})
