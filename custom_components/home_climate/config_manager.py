"""Configuration manager for Home Climate integration."""
from __future__ import annotations

import json
import logging
import os
import uuid
from copy import deepcopy
from typing import Any

from homeassistant.core import HomeAssistant

from .const import (
    CONFIG_FILE,
    DEFAULT_CONFIG,
    DEFAULT_COOL_THRESHOLD_C,
    DEFAULT_ENTER_DURATION_SEC,
    DEFAULT_EXIT_DURATION_SEC,
    DEFAULT_HEAT_THRESHOLD_C,
    DEFAULT_NOTIFICATION_MESSAGES,
    DEFAULT_OUTDOOR_COOL_ONLY_ABOVE_C,
    DEFAULT_OUTDOOR_HEAT_ONLY_BELOW_C,
    DEFAULT_POWER_DEBOUNCE_SEC,
    DEFAULT_POWER_THRESHOLD_W,
    DEVICE_TYPES,
    NOTIFICATION_EVENT_KEYS,
    SEASONAL_MODES,
    TTS_EVENT_KEYS,
    DEFAULT_TTS_MESSAGES,
    default_appliance_automation,
)

_LOGGER = logging.getLogger(__name__)


def _safe_int(val: Any, default: int) -> int:
    """Parse int safely; return default for None, empty string, or invalid."""
    if val is None or val == "":
        return default
    try:
        return int(val) if isinstance(val, (int, float)) else int(str(val).strip())
    except (ValueError, TypeError):
        return default


def _safe_float(val: Any, default: float) -> float:
    """Parse float safely; return default for None, empty string, or invalid."""
    if val is None or val == "":
        return default
    try:
        return float(val) if isinstance(val, (int, float)) else float(str(val).strip())
    except (ValueError, TypeError):
        return default


def _load_json_file(path: str) -> dict | None:
    """Load JSON file (run in executor to avoid blocking event loop)."""
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_json_file(path: str, data: Any) -> None:
    """Write JSON file (run in executor to avoid blocking event loop)."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


class ConfigManager:
    """Manage Home Climate configuration stored in JSON file."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the config manager."""
        self.hass = hass
        self._config: dict[str, Any] = deepcopy(DEFAULT_CONFIG)
        self._config_path = hass.config.path(CONFIG_FILE)

    @property
    def config(self) -> dict[str, Any]:
        """Return the current configuration."""
        return self._config

    @property
    def rooms(self) -> list[dict[str, Any]]:
        """Return rooms configuration."""
        return self._config.get("rooms", [])

    @property
    def tts_settings(self) -> dict[str, Any]:
        """Return TTS settings."""
        return self._config.get("tts_settings", DEFAULT_CONFIG["tts_settings"])

    @property
    def notification_settings(self) -> dict[str, Any]:
        """Return notification settings."""
        return self._config.get(
            "notification_settings", DEFAULT_CONFIG["notification_settings"]
        )

    def get_room_for_climate_entity(self, climate_entity: str) -> tuple[dict, dict] | None:
        """Return (room, appliance) for a climate entity, or None."""
        for room in self.rooms:
            for appliance in room.get("appliances", []):
                if (appliance.get("climate_entity") or "").strip() == climate_entity:
                    return (room, appliance)
        return None

    def get_device_name(self, appliance: dict[str, Any]) -> str:
        """Return display name for appliance: custom_name or device_type label."""
        from .const import DEVICE_TYPE_LABELS

        custom = (appliance.get("custom_name") or "").strip()
        if custom:
            return custom
        dtype = appliance.get("device_type") or "minisplit"
        return DEVICE_TYPE_LABELS.get(dtype, dtype)

    async def async_load(self) -> None:
        """Load configuration from file."""
        try:
            loaded_config = await self.hass.async_add_executor_job(
                _load_json_file, self._config_path
            )
            if loaded_config is not None:
                self._config = self._merge_with_defaults(loaded_config)
                _LOGGER.info("Loaded Home Climate configuration")
            else:
                _LOGGER.info("No config file found, using defaults")
                await self.async_save()
        except (json.JSONDecodeError, IOError) as err:
            _LOGGER.error("Error loading config: %s", err)
            self._config = deepcopy(DEFAULT_CONFIG)

    async def async_save(self) -> None:
        """Save configuration to file."""
        try:
            await self.hass.async_add_executor_job(
                _write_json_file, self._config_path, self._config
            )
            _LOGGER.debug("Saved Home Climate configuration")
        except IOError as err:
            _LOGGER.error("Error saving config: %s", err)

    def _migrate_old_config(self, loaded: dict[str, Any]) -> dict[str, Any]:
        """Migrate old schema to new room/appliance schema."""
        result = deepcopy(DEFAULT_CONFIG)
        old_rooms = loaded.get("rooms") or []
        old_presence = loaded.get("presence_rules") or []
        old_automation = loaded.get("automation") or {}
        old_tts = loaded.get("tts_settings") or {}

        # Build presence lookup by climate_entity
        presence_by_entity: dict[str, dict] = {}
        for rule in old_presence:
            ce = (rule.get("climate_entity") or "").strip()
            if ce:
                presence_by_entity[ce] = rule

        new_rooms = []
        for room in old_rooms:
            if not isinstance(room, dict) or not room.get("name"):
                continue
            room_id = room.get("id") or str(uuid.uuid4())
            appliances = []
            climate_entity = (room.get("climate_entity") or "").strip()

            if climate_entity:
                pres = presence_by_entity.get(climate_entity, {})
                auto = default_appliance_automation()
                auto["person"] = (pres.get("person") or "").strip()
                auto["zone"] = (pres.get("zone") or "").strip()
                auto["enter_duration_sec"] = max(
                    0, min(600, _safe_int(pres.get("enter_duration_sec"), 30))
                )
                auto["exit_duration_sec"] = max(
                    0, min(3600, _safe_int(pres.get("exit_duration_sec"), 300))
                )
                tte = pres.get("target_temp_on_enter")
                auto["target_temp_on_enter"] = _safe_float(tte, 22.0) if tte is not None else 22.0
                auto["heat_threshold_c"] = _safe_float(
                    old_automation.get("heat_threshold_c"), 18
                )
                auto["cool_threshold_c"] = _safe_float(
                    old_automation.get("cool_threshold_c"), 26
                )
                auto["seasonal_mode"] = old_automation.get("seasonal_mode") or "outdoor_temp"
                auto["outdoor_temp_sensor"] = (
                    old_automation.get("outdoor_temp_sensor") or ""
                ).strip()
                auto["date_winter_start"] = (
                    old_automation.get("date_winter_start") or "11-01"
                ).strip()
                auto["date_winter_end"] = (
                    old_automation.get("date_winter_end") or "03-31"
                ).strip()

                appliances.append({
                    "id": str(uuid.uuid4()),
                    "device_type": "minisplit",
                    "custom_name": "",
                    "climate_entity": climate_entity,
                    "automation": auto,
                })

            new_rooms.append({
                "id": room_id,
                "name": str(room.get("name", "")).strip(),
                "temp_sensor": (room.get("temp_sensor") or "").strip() or None,
                "humidity_sensor": (room.get("humidity_sensor") or "").strip() or None,
                "media_player": (old_tts.get("media_player") or "").strip() or "",
                "volume": max(0.0, min(1.0, _safe_float(old_tts.get("volume"), 0.7))),
                "tts_overrides": {},
                "appliances": appliances,
            })

        result["rooms"] = self._validate_rooms(new_rooms)

        # Migrate TTS
        default_msgs = DEFAULT_CONFIG["tts_settings"]["messages"]
        messages = {}
        for key in TTS_EVENT_KEYS:
            entry = default_msgs.get(key, {"enabled": True, "template": DEFAULT_TTS_MESSAGES.get(key, "")})
            if key == "mode_change" and old_tts.get("mode_change_msg"):
                entry = {"enabled": True, "template": str(old_tts["mode_change_msg"])}
            elif key == "presence_enter" and old_tts.get("presence_on_msg"):
                entry = {"enabled": True, "template": str(old_tts["presence_on_msg"])}
            elif key == "presence_leave" and old_tts.get("presence_off_msg"):
                entry = {"enabled": True, "template": str(old_tts["presence_off_msg"])}
            messages[key] = entry

        result["tts_settings"] = {
            "language": str(old_tts.get("language", "en")),
            "speed": max(0.5, min(2.0, _safe_float(old_tts.get("speed"), 1.0))),
            "volume": max(0.0, min(1.0, _safe_float(old_tts.get("volume"), 0.7))),
            "prefix": str(old_tts.get("prefix", "Message from Home Climate.")),
            "messages": messages,
        }

        return result

    def _merge_with_defaults(self, loaded: dict[str, Any]) -> dict[str, Any]:
        """Merge loaded config with defaults; migrate old schema if needed."""
        needs_migration = "presence_rules" in loaded
        if not needs_migration and loaded.get("rooms"):
            for r in loaded["rooms"]:
                if isinstance(r, dict) and "climate_entity" in r and "appliances" not in r:
                    needs_migration = True
                    break
        if needs_migration:
            _LOGGER.info("Migrating Home Climate config from old schema")
            return self._migrate_old_config(loaded)

        result = deepcopy(DEFAULT_CONFIG)

        if "rooms" in loaded and isinstance(loaded["rooms"], list):
            result["rooms"] = self._validate_rooms(loaded["rooms"])

        if "weather_entity" in loaded and isinstance(loaded["weather_entity"], str):
            result["weather_entity"] = loaded["weather_entity"].strip()

        if "tts_settings" in loaded and isinstance(loaded["tts_settings"], dict):
            result["tts_settings"] = self._validate_tts_settings(loaded["tts_settings"])

        if "notification_settings" in loaded and isinstance(
            loaded["notification_settings"], dict
        ):
            result["notification_settings"] = self._validate_notification_settings(
                loaded["notification_settings"]
            )

        return result

    def _validate_rooms(self, rooms: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Validate and sanitize rooms configuration."""
        validated = []
        for room in rooms:
            if not isinstance(room, dict) or not room.get("name"):
                continue
            room_id = room.get("id") or str(uuid.uuid4())

            validated.append({
                "id": room_id,
                "name": str(room.get("name", "")).strip(),
                "temp_sensor": str(room.get("temp_sensor", "")).strip() or None,
                "humidity_sensor": str(room.get("humidity_sensor", "")).strip() or None,
                "media_player": str(room.get("media_player", "")).strip() or "",
                "volume": max(0.0, min(1.0, _safe_float(room.get("volume"), 0.7))),
                "notify_entity": str(room.get("notify_entity", "")).strip() or "",
                "tts_overrides": dict(room.get("tts_overrides") or {}),
                "appliances": self._validate_appliances(room.get("appliances") or []),
            })
        return validated

    def _validate_appliances(self, appliances: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Validate appliances list."""
        validated = []
        default_auto = default_appliance_automation()
        for app in appliances:
            if not isinstance(app, dict):
                continue
            app_id = app.get("id") or str(uuid.uuid4())
            dtype = app.get("device_type") or "minisplit"
            if dtype not in DEVICE_TYPES:
                dtype = "minisplit"
            climate_entity = str(app.get("climate_entity", "")).strip() or None
            auto_raw = app.get("automation") or {}
            auto = {}
            for k, default_val in default_auto.items():
                if k in ("person", "zone", "person_on", "zone_on", "person_off", "zone_off", "outdoor_temp_sensor", "date_winter_start", "date_winter_end"):
                    auto[k] = str(auto_raw.get(k, default_val)).strip() or default_val
                elif k in ("enter_duration_sec", "exit_duration_sec"):
                    auto[k] = max(0, min(3600, _safe_int(auto_raw.get(k), default_val)))
                elif k in ("heat_threshold_c", "cool_threshold_c"):
                    auto[k] = max(5, min(40, _safe_float(auto_raw.get(k), default_val)))
                elif k == "target_temp_on_enter":
                    v = auto_raw.get(k)
                    auto[k] = _safe_float(v, 22.0) if v is not None else 22.0
                elif k == "seasonal_mode":
                    auto[k] = auto_raw.get(k) if auto_raw.get(k) in SEASONAL_MODES else default_val
                elif k in ("outdoor_cool_only_above_c", "outdoor_heat_only_below_c"):
                    auto[k] = max(-10, min(40, _safe_float(auto_raw.get(k), default_val)))
                else:
                    auto[k] = auto_raw.get(k, default_val)

            # Migrate legacy person/zone to person_on/zone_on and person_off/zone_off
            if not auto.get("person_on") and auto.get("person"):
                auto["person_on"] = auto["person"]
            if not auto.get("zone_on") and auto.get("zone"):
                auto["zone_on"] = auto["zone"]
            if not auto.get("person_off") and auto.get("person_on"):
                auto["person_off"] = auto["person_on"]
            if not auto.get("zone_off") and auto.get("zone_on"):
                auto["zone_off"] = auto["zone_on"]

            power_sensor_raw = app.get("power_sensor") or {}
            power_sensor = {}
            if isinstance(power_sensor_raw, dict) and power_sensor_raw.get("enabled"):
                power_sensor = {
                    "enabled": True,
                    "sensor": str(power_sensor_raw.get("sensor", "")).strip() or "",
                    "switch": str(power_sensor_raw.get("switch", "")).strip() or "",
                    "power_threshold_w": max(
                        0,
                        min(5000, _safe_float(power_sensor_raw.get("power_threshold_w"), DEFAULT_POWER_THRESHOLD_W)),
                    ),
                    "debounce_sec": max(1, min(60, _safe_int(power_sensor_raw.get("debounce_sec"), DEFAULT_POWER_DEBOUNCE_SEC))),
                }

            validated.append({
                "id": app_id,
                "device_type": dtype,
                "custom_name": str(app.get("custom_name", "")).strip(),
                "climate_entity": climate_entity,
                "automation": auto,
                "power_sensor": power_sensor,
            })
        return validated

    def _validate_notification_settings(
        self, notif: dict[str, Any]
    ) -> dict[str, Any]:
        """Validate notification settings with messages structure."""
        default = DEFAULT_CONFIG["notification_settings"]
        messages = {}
        for key in NOTIFICATION_EVENT_KEYS:
            entry = notif.get("messages", {}).get(key)
            if isinstance(entry, dict):
                messages[key] = {
                    "enabled": bool(entry.get("enabled", True)),
                    "template": str(
                        entry.get(
                            "template",
                            DEFAULT_NOTIFICATION_MESSAGES.get(key, ""),
                        )
                    ),
                }
            else:
                messages[key] = default["messages"].get(
                    key,
                    {
                        "enabled": True,
                        "template": DEFAULT_NOTIFICATION_MESSAGES.get(key, ""),
                    },
                )

        notify_entity = str(notif.get("notify_entity", "")).strip()
        if not notify_entity and notif.get("default_notify_service"):
            notify_entity = str(notif.get("default_notify_service", "")).strip()
        if not notify_entity:
            notify_entity = str(default.get("notify_entity", "")).strip()

        return {
            "enabled": bool(notif.get("enabled", default.get("enabled", True))),
            "notify_entity": notify_entity,
            "prefix": str(notif.get("prefix", default["prefix"])),
            "messages": messages,
        }

    def _validate_tts_settings(self, tts: dict[str, Any]) -> dict[str, Any]:
        """Validate TTS settings with messages structure."""
        default = DEFAULT_CONFIG["tts_settings"]
        messages = {}
        for key in TTS_EVENT_KEYS:
            entry = tts.get("messages", {}).get(key)
            if isinstance(entry, dict):
                messages[key] = {
                    "enabled": bool(entry.get("enabled", True)),
                    "template": str(entry.get("template", DEFAULT_TTS_MESSAGES.get(key, ""))),
                }
            else:
                messages[key] = default["messages"].get(
                    key, {"enabled": True, "template": DEFAULT_TTS_MESSAGES.get(key, "")}
                )

        return {
            "language": str(tts.get("language", default["language"])),
            "speed": max(0.5, min(2.0, _safe_float(tts.get("speed"), default["speed"]))),
            "volume": max(0.0, min(1.0, _safe_float(tts.get("volume"), default["volume"]))),
            "prefix": str(tts.get("prefix", default["prefix"])),
            "messages": messages,
        }

    async def async_update_config(self, new_config: dict[str, Any]) -> None:
        """Update full configuration with validation."""
        if "rooms" in new_config:
            self._config["rooms"] = self._validate_rooms(new_config["rooms"])
        if "weather_entity" in new_config:
            self._config["weather_entity"] = str(new_config["weather_entity"] or "").strip()
        if "tts_settings" in new_config:
            self._config["tts_settings"] = self._validate_tts_settings(
                new_config["tts_settings"]
            )
        if "notification_settings" in new_config:
            self._config["notification_settings"] = self._validate_notification_settings(
                new_config["notification_settings"]
            )
        await self.async_save()
