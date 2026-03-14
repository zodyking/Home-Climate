"""WebSocket API for Home Climate integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    parse_temp_from_state,
    TTS_MANUAL_ON,
    TTS_MANUAL_OFF,
    TTS_MODE_CHANGE,
    TTS_TEMP_CHANGE,
    TTS_FAN_CHANGE,
)

_LOGGER = logging.getLogger(__name__)


def async_setup(hass: HomeAssistant) -> None:
    """Set up WebSocket API."""
    websocket_api.async_register_command(hass, websocket_get_config)
    websocket_api.async_register_command(hass, websocket_save_config)
    websocket_api.async_register_command(hass, websocket_get_entities)
    websocket_api.async_register_command(hass, websocket_get_user_info)
    websocket_api.async_register_command(hass, websocket_send_tts)
    websocket_api.async_register_command(hass, websocket_get_dashboard_data)
    websocket_api.async_register_command(hass, websocket_set_climate_and_announce)
    websocket_api.async_register_command(hass, websocket_set_temperature)
    websocket_api.async_register_command(hass, websocket_set_fan_mode)
    _LOGGER.info("Home Climate WebSocket API registered")


def _get_connection_user_id(connection: Any) -> str | None:
    """Get user ID from WebSocket connection (for admin check in get_user_info)."""
    if hasattr(connection, "user") and connection.user:
        return getattr(connection.user, "id", None)
    return None


@websocket_api.websocket_command(
    {vol.Required("type"): "home_climate/get_config"}
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
        vol.Required("type"): "home_climate/save_config",
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


def _device_name_to_notify_slug(name: str) -> str:
    """Convert device name to notify.mobile_app_ slug: lowercase, spaces to underscore, remove apostrophes."""
    if not name:
        return ""
    s = str(name).lower().strip()
    for c in "'\"`":
        s = s.replace(c, "")
    s = "_".join(s.split())
    return s


def _get_mobile_app_devices(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Get Mobile App devices with their notify entity_id for notification targeting."""
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    result: list[dict[str, Any]] = []
    dev_reg = dr.async_get(hass)
    ent_reg = er.async_get(hass)

    mobile_entry_ids = {e.entry_id for e in hass.config_entries.async_entries("mobile_app")}
    for device in dev_reg.devices.values():
        if not mobile_entry_ids or not device.config_entries:
            continue
        if not (device.config_entries & mobile_entry_ids):
            continue
        device_name = device.name or device.name_by_user or f"Mobile App {device.id[:8]}"
        entity_id = None
        for ent in ent_reg.entities.values():
            if ent.device_id == device.id and ent.entity_id.startswith("notify.mobile_app_"):
                entity_id = ent.entity_id
                break
        if not entity_id:
            slug = _device_name_to_notify_slug(device_name)
            if slug:
                entity_id = f"notify.mobile_app_{slug}"
        if entity_id:
            result.append({"device_name": device_name, "entity_id": entity_id})
    return sorted(result, key=lambda x: (x.get("device_name") or "").lower())


def _entity_list_from_registry(
    hass: HomeAssistant,
    domain: str,
    extra_attrs: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Get all entities for a domain from entity registry (includes disabled/unavailable)."""
    from homeassistant.helpers import entity_registry as er

    registry = er.async_get(hass)
    out: list[dict[str, Any]] = []
    for entry in registry.entities.values():
        if not entry.entity_id.startswith(f"{domain}."):
            continue
        state = hass.states.get(entry.entity_id)
        friendly_name = (
            state.attributes.get("friendly_name")
            if state
            else None
        ) or entry.name or entry.original_name or entry.entity_id
        item: dict[str, Any] = {
            "entity_id": entry.entity_id,
            "friendly_name": friendly_name,
        }
        if extra_attrs and state:
            for attr in extra_attrs:
                if attr in state.attributes:
                    item[attr] = state.attributes[attr]
        out.append(item)
    return sorted(out, key=lambda x: (x["friendly_name"] or "").lower())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "home_climate/get_entities",
        vol.Optional("entity_type"): str,
    }
)
@websocket_api.async_response
async def websocket_get_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get available entities from entity registry (climate, sensors, persons, zones, media_players, switches, notify)."""
    entity_type = msg.get("entity_type")
    result: dict[str, list[dict[str, Any]]] = {
        "climate": [],
        "sensors": [],
        "persons": [],
        "zones": [],
        "media_players": [],
        "weather": [],
        "notify": [],
        "switch": [],
        "mobile_app_devices": [],
    }

    domains = [
        ("climate", "climate"),
        ("sensor", "sensors"),
        ("person", "persons"),
        ("zone", "zones"),
        ("media_player", "media_players"),
        ("weather", "weather"),
        ("notify", "notify"),
        ("switch", "switch"),
    ]
    for domain, key in domains:
        if entity_type is not None and entity_type != key and entity_type != domain:
            continue
        extra = ["unit_of_measurement"] if domain == "sensor" else None
        items = _entity_list_from_registry(hass, domain, extra)
        for it in items:
            if domain == "sensor" and "unit_of_measurement" not in it:
                it["unit_of_measurement"] = ""
        result[key] = items

    if entity_type is None or entity_type in ("mobile_app_devices", "notify"):
        result["mobile_app_devices"] = _get_mobile_app_devices(hass)

    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {vol.Required("type"): "home_climate/get_user_info"}
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
        vol.Required("type"): "home_climate/send_tts",
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


def _get_climate_state(
    hass: HomeAssistant,
    entity_id: str,
    config_manager: Any = None,
    appliance: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Get climate entity state attributes for dashboard."""
    state = hass.states.get(entity_id)
    if not state:
        return {}
    attrs = state.attributes
    target_temp = attrs.get("temperature")
    if target_temp is not None:
        try:
            target_temp = float(target_temp)
        except (ValueError, TypeError):
            target_temp = None
    min_temp = 16.0
    max_temp = 30.0
    _min = attrs.get("min_temp")
    if _min is not None:
        try:
            min_temp = float(_min)
        except (ValueError, TypeError):
            pass
    _max = attrs.get("max_temp")
    if _max is not None:
        try:
            max_temp = float(_max)
        except (ValueError, TypeError):
            pass

    climate_state = state.state
    climate_mode = attrs.get("hvac_mode") or state.state
    if config_manager and appliance:
        from .power_detector import get_appliance_power_state
        power_state = get_appliance_power_state(hass, config_manager, entity_id)
        if power_state is not None:
            if power_state == "off":
                climate_state = "off"
                climate_mode = "off"

    percentage = attrs.get("percentage")
    if percentage is not None:
        try:
            percentage = int(percentage)
        except (ValueError, TypeError):
            percentage = None

    return {
        "climate_state": climate_state,
        "climate_mode": climate_mode,
        "target_temp": target_temp,
        "hvac_action": attrs.get("hvac_action"),
        "fan_mode": attrs.get("fan_mode"),
        "percentage": percentage,
        "min_temp": min_temp,
        "max_temp": max_temp,
        "hvac_modes": list(attrs.get("hvac_modes") or []),
        "fan_modes": list(attrs.get("fan_modes") or []),
        "current_temperature": attrs.get("current_temperature"),
    }


@websocket_api.websocket_command(
    {vol.Required("type"): "home_climate/get_dashboard_data"}
)
@websocket_api.async_response
async def websocket_get_dashboard_data(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get dashboard data: nested rooms with appliances (parent room + appliance sub-cards)."""
    config_manager = hass.data.get(DOMAIN, {}).get("config_manager")
    if not config_manager:
        connection.send_result(msg["id"], {"rooms": [], "outdoor": {"temp": None, "humidity": None}, "indoor_aggregate": {"temp": None, "humidity": None, "room_count": 0}})
        return

    rooms_data = []
    temp_unit = hass.config.units.temperature_unit

    # Outdoor from weather entity
    outdoor_temp = None
    outdoor_humidity = None
    weather_entity = (config_manager.config.get("weather_entity") or "").strip()
    if weather_entity:
        wstate = hass.states.get(weather_entity)
        if wstate and wstate.state not in ("unknown", "unavailable"):
            attrs = wstate.attributes or {}
            t = attrs.get("temperature")
            if t is not None:
                try:
                    outdoor_temp = float(t)
                    if temp_unit == "°F":
                        outdoor_temp = (outdoor_temp - 32) * 5 / 9
                except (ValueError, TypeError):
                    pass
            h = attrs.get("humidity")
            if h is not None:
                try:
                    outdoor_humidity = float(h)
                except (ValueError, TypeError):
                    pass

    def _c_to_display(temp_c: float, unit: str) -> float:
        """Convert Celsius to display unit."""
        if unit == "°F":
            return temp_c * 9 / 5 + 32
        return temp_c

    for room in config_manager.rooms:
        temp = None
        humidity = None

        if room.get("temp_sensor"):
            state = hass.states.get(room["temp_sensor"])
            if state and state.state not in ("unknown", "unavailable"):
                unit = state.attributes.get("unit_of_measurement") if state.attributes else None
                temp_c = parse_temp_from_state(state.state, unit)
                if temp_c is not None:
                    temp = _c_to_display(temp_c, temp_unit)

        if room.get("humidity_sensor"):
            state = hass.states.get(room["humidity_sensor"])
            if state and state.state not in ("unknown", "unavailable"):
                try:
                    humidity = float(state.state)
                except (ValueError, TypeError):
                    pass

        appliances = room.get("appliances") or []
        appliances_data = []

        for appliance in appliances:
            is_smart = appliance.get("is_smart_appliance", True)
            climate_entity = (appliance.get("climate_entity") or "").strip()
            switch_entity = config_manager.get_appliance_switch_entity(appliance)
            control_entity = climate_entity if (is_smart and climate_entity) else (switch_entity or "")

            if is_smart and climate_entity:
                climate_data = _get_climate_state(hass, climate_entity, config_manager, appliance)
                climate_current_temp = climate_data.get("current_temperature")
                if climate_current_temp is not None:
                    try:
                        climate_current_temp = float(climate_current_temp)
                    except (ValueError, TypeError):
                        climate_current_temp = None
                use_temp = temp if temp is not None else climate_current_temp
                appliances_data.append({
                    "appliance_id": appliance.get("id"),
                    "device_type": appliance.get("device_type", "minisplit"),
                    "device_name": config_manager.get_device_name(appliance),
                    "is_smart_appliance": True,
                    "climate_entity": climate_entity,
                    "control_entity": climate_entity,
                    "temp": use_temp,
                    "target_temp": climate_data.get("target_temp"),
                    "hvac_action": climate_data.get("hvac_action"),
                    "fan_mode": climate_data.get("fan_mode"),
                    "percentage": climate_data.get("percentage"),
                    "climate_mode": climate_data.get("climate_mode"),
                    "climate_state": climate_data.get("climate_state"),
                    "min_temp": climate_data.get("min_temp", 16),
                    "max_temp": climate_data.get("max_temp", 30),
                    "hvac_modes": climate_data.get("hvac_modes", []),
                    "fan_modes": climate_data.get("fan_modes", []),
                })
            elif switch_entity:
                from .power_detector import get_appliance_power_state
                power_state = get_appliance_power_state(hass, config_manager, switch_entity)
                switch_state = hass.states.get(switch_entity)
                is_on = (power_state == "on") if power_state is not None else (switch_state and switch_state.state == "on")
                appliances_data.append({
                    "appliance_id": appliance.get("id"),
                    "device_type": appliance.get("device_type", "minisplit"),
                    "device_name": config_manager.get_device_name(appliance),
                    "is_smart_appliance": False,
                    "climate_entity": None,
                    "control_entity": switch_entity,
                    "temp": temp,
                    "target_temp": None,
                    "hvac_action": None,
                    "fan_mode": None,
                    "climate_mode": "on" if is_on else "off",
                    "climate_state": "on" if is_on else "off",
                    "min_temp": 16,
                    "max_temp": 30,
                    "hvac_modes": ["on", "off"],
                    "fan_modes": [],
                })

        rooms_data.append({
            "id": room.get("id"),
            "name": room.get("name"),
            "temp_sensor": room.get("temp_sensor"),
            "humidity_sensor": room.get("humidity_sensor"),
            "temp": temp,
            "humidity": humidity,
            "temperature_unit": temp_unit,
            "is_monitor_only": len(appliances_data) == 0,
            "appliances": appliances_data,
        })

    # Indoor aggregate: average temp (C) and humidity across rooms with data
    def _to_celsius(val: float, unit: str) -> float:
        if unit == "°F":
            return (val - 32) * 5 / 9
        return val

    temps_c = []
    for r in rooms_data:
        if r["temp"] is not None:
            temps_c.append(_to_celsius(r["temp"], temp_unit))
    humids = [r["humidity"] for r in rooms_data if r["humidity"] is not None]
    indoor_aggregate = {
        "temp": sum(temps_c) / len(temps_c) if temps_c else None,
        "humidity": sum(humids) / len(humids) if humids else None,
        "room_count": len([r for r in rooms_data if r["temp"] is not None or r["humidity"] is not None]),
    }

    connection.send_result(msg["id"], {
        "rooms": rooms_data,
        "outdoor": {"temp": outdoor_temp, "humidity": outdoor_humidity},
        "indoor_aggregate": indoor_aggregate,
    })


@websocket_api.websocket_command(
    {
        vol.Required("type"): "home_climate/set_climate_and_announce",
        vol.Required("entity_id"): str,
        vol.Required("service"): vol.In(("turn_off", "turn_on", "set_hvac_mode")),
        vol.Optional("hvac_mode"): str,
        vol.Optional("room_name"): str,
    }
)
@websocket_api.async_response
async def websocket_set_climate_and_announce(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set climate mode or switch on/off, optionally announce via TTS."""
    entity_id = msg["entity_id"]
    service = msg["service"]
    hvac_mode = msg.get("hvac_mode") or "off"

    config_manager = hass.data.get(DOMAIN, {}).get("config_manager")
    pair = config_manager.get_room_for_control_entity(entity_id) if config_manager else None
    is_simple = pair and not (pair[1].get("is_smart_appliance", True))
    power_switch = None
    if config_manager:
        from .power_detector import get_appliance_power_switch
        power_switch = get_appliance_power_switch(config_manager, entity_id)

    try:
        if is_simple:
            if service == "turn_off":
                await hass.services.async_call(
                    "switch", "turn_off", {ATTR_ENTITY_ID: entity_id}, blocking=True,
                )
                tts_event = TTS_MANUAL_OFF
            elif service == "turn_on":
                await hass.services.async_call(
                    "switch", "turn_on", {ATTR_ENTITY_ID: entity_id}, blocking=True,
                )
                tts_event = TTS_MANUAL_ON
            else:
                tts_event = TTS_MANUAL_OFF if hvac_mode.lower() == "off" else TTS_MANUAL_ON
                await hass.services.async_call(
                    "switch",
                    "turn_off" if hvac_mode.lower() == "off" else "turn_on",
                    {ATTR_ENTITY_ID: entity_id},
                    blocking=True,
                )
        elif service == "turn_off":
            if power_switch:
                await hass.services.async_call(
                    "switch", "turn_off", {ATTR_ENTITY_ID: power_switch}, blocking=True,
                )
            else:
                await hass.services.async_call(
                    "climate", "turn_off", {ATTR_ENTITY_ID: entity_id}, blocking=True,
                )
            tts_event = TTS_MANUAL_OFF
        elif service == "turn_on":
            if power_switch:
                await hass.services.async_call(
                    "switch", "turn_on", {ATTR_ENTITY_ID: power_switch}, blocking=True,
                )
            else:
                await hass.services.async_call(
                    "climate", "turn_on", {ATTR_ENTITY_ID: entity_id}, blocking=True,
                )
            tts_event = TTS_MANUAL_ON
        else:
            if hvac_mode and hvac_mode.lower() != "off":
                state = hass.states.get(entity_id)
                current_state = (state.state if state else "").lower()
                if current_state == "off":
                    if power_switch:
                        await hass.services.async_call(
                            "switch", "turn_on", {ATTR_ENTITY_ID: power_switch}, blocking=True,
                        )
                    else:
                        await hass.services.async_call(
                            "climate", "turn_on", {ATTR_ENTITY_ID: entity_id}, blocking=True,
                        )
            await hass.services.async_call(
                "climate",
                "set_hvac_mode",
                {ATTR_ENTITY_ID: entity_id, "hvac_mode": hvac_mode},
                blocking=True,
            )
            tts_event = TTS_MODE_CHANGE

        if config_manager:
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event

            mode_arg = ""
            if tts_event == TTS_MODE_CHANGE:
                mode_arg = hvac_mode or ""
            elif is_simple and service != "set_hvac_mode":
                mode_arg = "on" if (service == "turn_on" or (service == "set_hvac_mode" and hvac_mode.lower() != "off")) else "off"

            await async_send_tts_for_event(
                hass, config_manager, entity_id, tts_event, mode=mode_arg,
            )
            await async_send_notification_for_event(
                hass, config_manager, entity_id, tts_event, mode=mode_arg,
            )

        connection.send_result(msg["id"], {"success": True})
    except Exception as e:
        _LOGGER.exception("set_climate_and_announce failed: %s", e)
        connection.send_error(msg["id"], "climate_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "home_climate/set_temperature",
        vol.Required("entity_id"): str,
        vol.Required("temperature"): vol.Coerce(float),
        vol.Optional("hvac_mode"): str,
        vol.Optional("room_name"): str,
    }
)
@websocket_api.async_response
async def websocket_set_temperature(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set climate target temperature and optionally announce via TTS."""
    entity_id = msg["entity_id"]
    temperature = msg["temperature"]
    hvac_mode = msg.get("hvac_mode")

    config_manager = hass.data.get(DOMAIN, {}).get("config_manager")
    if config_manager:
        pair = config_manager.get_room_for_control_entity(entity_id)
        if pair and not pair[1].get("is_smart_appliance", True):
            connection.send_error(msg["id"], "climate_failed", "Simple appliances do not support temperature control")
            return

    try:
        service_data: dict[str, Any] = {
            ATTR_ENTITY_ID: entity_id,
            "temperature": temperature,
        }
        if hvac_mode:
            service_data["hvac_mode"] = hvac_mode

        await hass.services.async_call(
            "climate",
            "set_temperature",
            service_data,
            blocking=True,
        )

        config_manager = hass.data.get(DOMAIN, {}).get("config_manager")
        if config_manager:
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event

            temp_val = int(temperature) if temperature == int(temperature) else temperature
            await async_send_tts_for_event(
                hass,
                config_manager,
                entity_id,
                TTS_TEMP_CHANGE,
                temp=temp_val,
            )
            await async_send_notification_for_event(
                hass,
                config_manager,
                entity_id,
                TTS_TEMP_CHANGE,
                temp=temp_val,
            )

        connection.send_result(msg["id"], {"success": True})
    except Exception as e:
        _LOGGER.exception("set_temperature failed: %s", e)
        connection.send_error(msg["id"], "climate_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "home_climate/set_fan_mode",
        vol.Required("entity_id"): str,
        vol.Required("fan_mode"): str,
    }
)
@websocket_api.async_response
async def websocket_set_fan_mode(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set climate fan mode and optionally announce via TTS."""
    entity_id = msg["entity_id"]
    fan_mode = msg["fan_mode"]

    try:
        await hass.services.async_call(
            "climate",
            "set_fan_mode",
            {ATTR_ENTITY_ID: entity_id, "fan_mode": fan_mode},
            blocking=True,
        )

        config_manager = hass.data.get(DOMAIN, {}).get("config_manager")
        if config_manager:
            from .tts_event import async_send_tts_for_event
            from .notification_event import async_send_notification_for_event

            await async_send_tts_for_event(
                hass,
                config_manager,
                entity_id,
                TTS_FAN_CHANGE,
                fan_mode=fan_mode,
            )
            await async_send_notification_for_event(
                hass,
                config_manager,
                entity_id,
                TTS_FAN_CHANGE,
                fan_mode=fan_mode,
            )

        connection.send_result(msg["id"], {"success": True})
    except Exception as e:
        _LOGGER.exception("set_fan_mode failed: %s", e)
        connection.send_error(msg["id"], "climate_failed", str(e))
