"""Configuration manager for Home Weather integration."""
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
    DEFAULT_OUTDOOR_COOL_ONLY_ABOVE_C,
    DEFAULT_OUTDOOR_HEAT_ONLY_BELOW_C,
    SEASONAL_MODES,
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
    """Manage Home Weather configuration stored in JSON file."""

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
    def automation(self) -> dict[str, Any]:
        """Return automation configuration."""
        return self._config.get("automation", DEFAULT_CONFIG["automation"])

    @property
    def presence_rules(self) -> list[dict[str, Any]]:
        """Return presence rules configuration."""
        return self._config.get("presence_rules", [])

    @property
    def tts_settings(self) -> dict[str, Any]:
        """Return TTS settings."""
        return self._config.get("tts_settings", DEFAULT_CONFIG["tts_settings"])

    async def async_load(self) -> None:
        """Load configuration from file."""
        try:
            loaded_config = await self.hass.async_add_executor_job(
                _load_json_file, self._config_path
            )
            if loaded_config is not None:
                self._config = self._merge_with_defaults(loaded_config)
                _LOGGER.info("Loaded Home Weather configuration")
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
            _LOGGER.debug("Saved Home Weather configuration")
        except IOError as err:
            _LOGGER.error("Error saving config: %s", err)

    def _merge_with_defaults(self, loaded: dict[str, Any]) -> dict[str, Any]:
        """Merge loaded config with defaults to ensure all keys exist."""
        result = deepcopy(DEFAULT_CONFIG)

        # Rooms
        if "rooms" in loaded and isinstance(loaded["rooms"], list):
            result["rooms"] = self._validate_rooms(loaded["rooms"])

        # Automation
        if "automation" in loaded and isinstance(loaded["automation"], dict):
            result["automation"] = self._validate_automation(loaded["automation"])

        # Presence rules
        if "presence_rules" in loaded and isinstance(loaded["presence_rules"], list):
            result["presence_rules"] = self._validate_presence_rules(
                loaded["presence_rules"]
            )

        # TTS settings
        if "tts_settings" in loaded and isinstance(loaded["tts_settings"], dict):
            default_tts = DEFAULT_CONFIG["tts_settings"]
            for k, v in default_tts.items():
                result["tts_settings"][k] = loaded["tts_settings"].get(
                    k, v
                )
            # Ensure string fields are strings
            for k in ("language", "prefix", "media_player", "mode_change_msg", "presence_on_msg", "presence_off_msg"):
                if k in result["tts_settings"] and result["tts_settings"][k] is not None:
                    result["tts_settings"][k] = str(result["tts_settings"][k])
            result["tts_settings"]["speed"] = max(0.5, min(2.0, _safe_float(result["tts_settings"].get("speed"), 1.0)))
            result["tts_settings"]["volume"] = max(0.0, min(1.0, _safe_float(result["tts_settings"].get("volume"), 0.7)))

        return result

    def _validate_rooms(self, rooms: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Validate and sanitize rooms configuration."""
        validated = []
        for room in rooms:
            if isinstance(room, dict) and room.get("name"):
                room_id = room.get("id")
                if not room_id or not isinstance(room_id, str):
                    room_id = str(uuid.uuid4())
                validated.append({
                    "id": room_id,
                    "name": str(room["name"]).strip(),
                    "climate_entity": str(room.get("climate_entity", "")).strip() or None,
                    "temp_sensor": str(room.get("temp_sensor", "")).strip() or None,
                    "humidity_sensor": str(room.get("humidity_sensor", "")).strip() or None,
                })
        return validated

    def _validate_automation(self, auto: dict[str, Any]) -> dict[str, Any]:
        """Validate and sanitize automation configuration."""
        seasonal_mode = auto.get("seasonal_mode", "outdoor_temp")
        if seasonal_mode not in SEASONAL_MODES:
            seasonal_mode = "outdoor_temp"

        return {
            "heat_threshold_c": max(5, min(35, _safe_float(auto.get("heat_threshold_c"), DEFAULT_HEAT_THRESHOLD_C))),
            "cool_threshold_c": max(15, min(40, _safe_float(auto.get("cool_threshold_c"), DEFAULT_COOL_THRESHOLD_C))),
            "seasonal_mode": seasonal_mode,
            "date_winter_start": str(auto.get("date_winter_start", "11-01")).strip(),
            "date_winter_end": str(auto.get("date_winter_end", "03-31")).strip(),
            "outdoor_temp_sensor": str(auto.get("outdoor_temp_sensor", "")).strip() or "",
            "outdoor_cool_only_above_c": max(10, min(40, _safe_float(auto.get("outdoor_cool_only_above_c"), DEFAULT_OUTDOOR_COOL_ONLY_ABOVE_C))),
            "outdoor_heat_only_below_c": max(-10, min(30, _safe_float(auto.get("outdoor_heat_only_below_c"), DEFAULT_OUTDOOR_HEAT_ONLY_BELOW_C))),
        }

    def _validate_presence_rules(
        self, rules: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Validate and sanitize presence rules."""
        validated = []
        for rule in rules:
            if not isinstance(rule, dict):
                continue
            person = str(rule.get("person", "")).strip()
            zone = str(rule.get("zone", "")).strip()
            climate_entity = str(rule.get("climate_entity", "")).strip()
            if not person or not zone or not climate_entity:
                continue
            validated.append({
                "person": person,
                "zone": zone,
                "climate_entity": climate_entity,
                "enter_duration_sec": max(0, min(600, _safe_int(rule.get("enter_duration_sec"), DEFAULT_ENTER_DURATION_SEC))),
                "exit_duration_sec": max(0, min(3600, _safe_int(rule.get("exit_duration_sec"), DEFAULT_EXIT_DURATION_SEC))),
                "target_temp_on_enter": _safe_float(rule.get("target_temp_on_enter"), 22.0) if rule.get("target_temp_on_enter") else None,
            })
        return validated

    async def async_update_config(self, new_config: dict[str, Any]) -> None:
        """Update full configuration with validation."""
        if "rooms" in new_config:
            self._config["rooms"] = self._validate_rooms(new_config["rooms"])
        if "automation" in new_config:
            self._config["automation"] = self._validate_automation(new_config["automation"])
        if "presence_rules" in new_config:
            self._config["presence_rules"] = self._validate_presence_rules(
                new_config["presence_rules"]
            )
        if "tts_settings" in new_config:
            tts = new_config["tts_settings"]
            default = DEFAULT_CONFIG["tts_settings"]
            self._config["tts_settings"] = {
                "language": str(tts.get("language", default["language"])),
                "speed": max(0.5, min(2.0, _safe_float(tts.get("speed"), default["speed"]))),
                "volume": max(0.0, min(1.0, _safe_float(tts.get("volume"), default["volume"]))),
                "prefix": str(tts.get("prefix", default["prefix"])),
                "media_player": str(tts.get("media_player", "")).strip() or "",
                "mode_change_msg": str(tts.get("mode_change_msg", default["mode_change_msg"])),
                "presence_on_msg": str(tts.get("presence_on_msg", default["presence_on_msg"])),
                "presence_off_msg": str(tts.get("presence_off_msg", default["presence_off_msg"])),
            }
        await self.async_save()
