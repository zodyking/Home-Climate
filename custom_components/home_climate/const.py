"""Constants for Home Climate integration."""
from __future__ import annotations

from typing import Any

DOMAIN = "home_climate"


def parse_temp_from_state(value: Any, unit: str | None) -> float | None:
    """Parse temp from sensor state; converts °F to °C. Returns Celsius or None."""
    if value is None or value == "":
        return None
    try:
        temp = float(str(value).strip())
    except (ValueError, TypeError):
        return None
    if unit and "f" in str(unit).lower():
        temp = (temp - 32) * 5 / 9
    return temp


NAME = "Home Climate"

# Config file
CONFIG_FILE = "home_climate.json"

# Panel configuration
PANEL_ICON = "mdi:thermometer"
PANEL_TITLE = "Home Climate"
PANEL_URL = "home-climate"

# Default TTS settings
DEFAULT_TTS_LANGUAGE = "en"
DEFAULT_TTS_SPEED = 1.0
DEFAULT_TTS_VOLUME = 0.7

# TTS message templates (user customizable)
DEFAULT_TTS_PREFIX = "Message from Home Climate."

# TTS event keys
TTS_MANUAL_ON = "manual_on"
TTS_MANUAL_OFF = "manual_off"
TTS_MODE_CHANGE = "mode_change"
TTS_TEMP_CHANGE = "temp_change"
TTS_PRESENCE_ENTER = "presence_enter"
TTS_PRESENCE_LEAVE = "presence_leave"
TTS_FAN_CHANGE = "fan_change"
TTS_AUTO_MODE_CHANGE = "auto_mode_change"
TTS_COMFORT_ADJUSTED = "comfort_adjusted"
TTS_COMFORT_REVERT = "comfort_revert"

TTS_EVENT_KEYS = [
    TTS_MANUAL_ON,
    TTS_MANUAL_OFF,
    TTS_MODE_CHANGE,
    TTS_TEMP_CHANGE,
    TTS_PRESENCE_ENTER,
    TTS_PRESENCE_LEAVE,
    TTS_FAN_CHANGE,
    TTS_AUTO_MODE_CHANGE,
    TTS_COMFORT_ADJUSTED,
    TTS_COMFORT_REVERT,
]

# Default templates per event (TTS uses prefix in message)
DEFAULT_TTS_MESSAGES = {
    TTS_MANUAL_ON: "{prefix} {room_name} {device_name} turned on",
    TTS_MANUAL_OFF: "{prefix} {room_name} {device_name} turned off",
    TTS_MODE_CHANGE: "{prefix} {room_name} {device_name} set to {mode}",
    TTS_TEMP_CHANGE: "{prefix} {room_name} {device_name} temperature set to {temp}",
    TTS_PRESENCE_ENTER: "{prefix} {person_name} entered {zone_name}, turning on {device_name}",
    TTS_PRESENCE_LEAVE: "{prefix} {person_name} left {zone_name}, turning off {device_name}",
    TTS_FAN_CHANGE: "{prefix} {room_name} {device_name} fan set to {fan_mode}",
    TTS_AUTO_MODE_CHANGE: "{prefix} {room_name} {device_name} set to {mode} by automation",
    TTS_COMFORT_ADJUSTED: "{prefix} {room_name} {device_name} could not reach comfort temp; target adjusted to {temp}",
    TTS_COMFORT_REVERT: "{prefix} {room_name} {device_name}: Room already at comfort temp of {temp}, reverted to fan only mode",
}

# Device types for appliances
DEVICE_TYPES = ["heater", "ac", "minisplit", "dehumidifier"]
DEVICE_TYPE_LABELS = {
    "heater": "Heater",
    "ac": "AC",
    "minisplit": "Minisplit",
    "dehumidifier": "Dehumidifier",
}

# Climate monitor settings
CLIMATE_CHECK_INTERVAL = 30  # seconds between threshold checks
CLIMATE_SET_TEMP_INTERVAL = 180  # seconds between dynamic set temp updates (3 min)
STRUGGLE_HOUR_SEC = 3600  # min time before declaring appliance cannot reach comfort
PRESENCE_CHECK_INTERVAL = 5  # seconds for presence state polling

# Default room comfort (Celsius)
DEFAULT_COMFORT_TEMP_C = 22.0
DEFAULT_COMFORT_TOLERANCE_C = 1.0  # deadband: at/near = comfort ± tolerance (0.5-2)

# Default automation thresholds (Celsius)
DEFAULT_HEAT_THRESHOLD_C = 18
DEFAULT_COOL_THRESHOLD_C = 26
DEFAULT_OUTDOOR_HEAT_ONLY_BELOW_C = 15
DEFAULT_OUTDOOR_COOL_ONLY_ABOVE_C = 25

# Default presence rules (per-appliance)
DEFAULT_ENTER_DURATION_SEC = 30
DEFAULT_EXIT_DURATION_SEC = 300

# Power sensor (per-appliance, optional override for on/off detection)
DEFAULT_POWER_THRESHOLD_W = 10.0
DEFAULT_POWER_DEBOUNCE_SEC = 5

# Seasonal modes
SEASONAL_MODE_OUTDOOR_TEMP = "outdoor_temp"
SEASONAL_MODE_DATE = "date"
SEASONAL_MODES = [SEASONAL_MODE_OUTDOOR_TEMP, SEASONAL_MODE_DATE]

# Default date-based seasonal (winter: Nov 1 - Mar 31)
DEFAULT_DATE_WINTER_START = "11-01"
DEFAULT_DATE_WINTER_END = "03-31"


def _default_tts_messages() -> dict:
    """Build default messages dict with enabled + template per event."""
    return {
        key: {"enabled": True, "template": DEFAULT_TTS_MESSAGES[key]}
        for key in TTS_EVENT_KEYS
    }


# Default dehumidifier (dry) automation
DEFAULT_DRY_HUMIDITY_THRESHOLD_PCT = 60
DEFAULT_DRY_TEMP_MIN_C = 18


def default_appliance_automation() -> dict:
    """Default automation for an appliance."""
    return {
        "person": "",  # legacy; use person_on/person_off
        "zone": "",  # legacy; use zone_on/zone_off
        "person_on": "",
        "zone_on": "",
        "person_off": "",
        "zone_off": "",
        "enter_duration_sec": DEFAULT_ENTER_DURATION_SEC,
        "exit_duration_sec": DEFAULT_EXIT_DURATION_SEC,
        "heat_threshold_c": DEFAULT_HEAT_THRESHOLD_C,
        "cool_threshold_c": DEFAULT_COOL_THRESHOLD_C,
        "heat_automation_enabled": True,
        "cool_automation_enabled": True,
        "block_heat_in_summer": True,
        "block_cool_in_winter": True,
        "dry_automation_enabled": False,
        "dry_humidity_threshold_pct": DEFAULT_DRY_HUMIDITY_THRESHOLD_PCT,
        "dry_temp_min_c": DEFAULT_DRY_TEMP_MIN_C,
        "seasonal_mode": SEASONAL_MODE_OUTDOOR_TEMP,
        "outdoor_temp_sensor": "",
        "date_winter_start": DEFAULT_DATE_WINTER_START,
        "date_winter_end": DEFAULT_DATE_WINTER_END,
        "outdoor_cool_only_above_c": DEFAULT_OUTDOOR_COOL_ONLY_ABOVE_C,
        "outdoor_heat_only_below_c": DEFAULT_OUTDOOR_HEAT_ONLY_BELOW_C,
    }


# Notification settings (prefix in title only, not in message body)
DEFAULT_NOTIFICATION_PREFIX = "Home Climate"
NOTIFICATION_EVENT_KEYS = list(TTS_EVENT_KEYS)
# No {prefix} in message - prefix goes to title only
DEFAULT_NOTIFICATION_MESSAGES = {
    TTS_MANUAL_ON: "{room_name} {device_name} turned on",
    TTS_MANUAL_OFF: "{room_name} {device_name} turned off",
    TTS_MODE_CHANGE: "{room_name} {device_name} set to {mode}",
    TTS_TEMP_CHANGE: "{room_name} {device_name} temperature set to {temp}",
    TTS_PRESENCE_ENTER: "{person_name} entered {zone_name}, turning on {device_name}",
    TTS_PRESENCE_LEAVE: "{person_name} left {zone_name}, turning off {device_name}",
    TTS_FAN_CHANGE: "{room_name} {device_name} fan set to {fan_mode}",
    TTS_AUTO_MODE_CHANGE: "{room_name} {device_name} set to {mode} by automation",
    TTS_COMFORT_ADJUSTED: "{room_name} {device_name} could not reach comfort temp; target adjusted to {temp}",
    TTS_COMFORT_REVERT: "{room_name} {device_name}: Room already at comfort temp of {temp}, reverted to fan only mode",
}


def _default_notification_messages() -> dict:
    """Build default notification messages dict with enabled + template per event."""
    return {
        key: {"enabled": True, "template": DEFAULT_NOTIFICATION_MESSAGES.get(key, "")}
        for key in NOTIFICATION_EVENT_KEYS
    }


# Default config structure (new schema)
DEFAULT_CONFIG = {
    "rooms": [],
    "weather_entity": "",
    "notification_settings": {
        "enabled": True,
        "notify_entity": "",
        "prefix": DEFAULT_NOTIFICATION_PREFIX,
        "messages": _default_notification_messages(),
    },
    "tts_settings": {
        "language": DEFAULT_TTS_LANGUAGE,
        "speed": DEFAULT_TTS_SPEED,
        "volume": DEFAULT_TTS_VOLUME,
        "prefix": DEFAULT_TTS_PREFIX,
        "messages": _default_tts_messages(),
    },
}
