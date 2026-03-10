"""Constants for Home Climate integration."""
from __future__ import annotations

DOMAIN = "home_climate"
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

TTS_EVENT_KEYS = [
    TTS_MANUAL_ON,
    TTS_MANUAL_OFF,
    TTS_MODE_CHANGE,
    TTS_TEMP_CHANGE,
    TTS_PRESENCE_ENTER,
    TTS_PRESENCE_LEAVE,
    TTS_FAN_CHANGE,
]

# Default templates per event
DEFAULT_TTS_MESSAGES = {
    TTS_MANUAL_ON: "{prefix} {room_name} {device_name} turned on",
    TTS_MANUAL_OFF: "{prefix} {room_name} {device_name} turned off",
    TTS_MODE_CHANGE: "{prefix} {room_name} {device_name} set to {mode}",
    TTS_TEMP_CHANGE: "{prefix} {room_name} {device_name} temperature set to {temp}",
    TTS_PRESENCE_ENTER: "{prefix} {room_name} {device_name} turned on",
    TTS_PRESENCE_LEAVE: "{prefix} {room_name} {device_name} turned off",
    TTS_FAN_CHANGE: "{prefix} {room_name} {device_name} fan set to {fan_mode}",
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
CLIMATE_CHECK_INTERVAL = 30  # seconds between climate logic checks
PRESENCE_CHECK_INTERVAL = 5  # seconds for presence state polling

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


def default_appliance_automation() -> dict:
    """Default automation for an appliance."""
    return {
        "person": "",
        "zone": "",
        "enter_duration_sec": DEFAULT_ENTER_DURATION_SEC,
        "exit_duration_sec": DEFAULT_EXIT_DURATION_SEC,
        "target_temp_on_enter": 22.0,
        "heat_threshold_c": DEFAULT_HEAT_THRESHOLD_C,
        "cool_threshold_c": DEFAULT_COOL_THRESHOLD_C,
        "seasonal_mode": SEASONAL_MODE_OUTDOOR_TEMP,
        "outdoor_temp_sensor": "",
        "date_winter_start": DEFAULT_DATE_WINTER_START,
        "date_winter_end": DEFAULT_DATE_WINTER_END,
        "outdoor_cool_only_above_c": DEFAULT_OUTDOOR_COOL_ONLY_ABOVE_C,
        "outdoor_heat_only_below_c": DEFAULT_OUTDOOR_HEAT_ONLY_BELOW_C,
    }


# Notification settings (mirror TTS)
DEFAULT_NOTIFICATION_PREFIX = "Home Climate"
NOTIFICATION_EVENT_KEYS = list(TTS_EVENT_KEYS)  # Same events as TTS
DEFAULT_NOTIFICATION_MESSAGES = dict(DEFAULT_TTS_MESSAGES)


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
        "prefix": DEFAULT_NOTIFICATION_PREFIX,
        "default_notify_service": "",
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
