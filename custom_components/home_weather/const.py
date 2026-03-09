"""Constants for Home Weather integration."""
from __future__ import annotations

DOMAIN = "home_weather"
NAME = "Home Weather"

# Config file
CONFIG_FILE = "home_weather.json"

# Panel configuration
PANEL_ICON = "mdi:thermometer"
PANEL_TITLE = "Home Weather"
PANEL_URL = "home-weather"

# Default TTS settings
DEFAULT_TTS_LANGUAGE = "en"
DEFAULT_TTS_SPEED = 1.0
DEFAULT_TTS_VOLUME = 0.7

# TTS message templates (user customizable)
DEFAULT_TTS_PREFIX = "Message from Home Weather."
DEFAULT_MODE_CHANGE_MSG = "{prefix} {room_name} climate set to {mode}"
DEFAULT_PRESENCE_ON_MSG = "{prefix} {room_name} climate turned on"
DEFAULT_PRESENCE_OFF_MSG = "{prefix} {room_name} climate turned off"

# Climate monitor settings
CLIMATE_CHECK_INTERVAL = 30  # seconds between climate logic checks
PRESENCE_CHECK_INTERVAL = 5  # seconds for presence state polling

# Default automation thresholds (Celsius)
DEFAULT_HEAT_THRESHOLD_C = 18
DEFAULT_COOL_THRESHOLD_C = 26
DEFAULT_OUTDOOR_HEAT_ONLY_BELOW_C = 15
DEFAULT_OUTDOOR_COOL_ONLY_ABOVE_C = 25

# Default presence rules
DEFAULT_ENTER_DURATION_SEC = 30
DEFAULT_EXIT_DURATION_SEC = 300

# Seasonal modes
SEASONAL_MODE_OUTDOOR_TEMP = "outdoor_temp"
SEASONAL_MODE_DATE = "date"
SEASONAL_MODES = [SEASONAL_MODE_OUTDOOR_TEMP, SEASONAL_MODE_DATE]

# Default date-based seasonal (winter: Nov 1 - Mar 31)
DEFAULT_DATE_WINTER_START = "11-01"
DEFAULT_DATE_WINTER_END = "03-31"

# Default config structure
DEFAULT_CONFIG = {
    "rooms": [],
    "automation": {
        "heat_threshold_c": DEFAULT_HEAT_THRESHOLD_C,
        "cool_threshold_c": DEFAULT_COOL_THRESHOLD_C,
        "seasonal_mode": SEASONAL_MODE_OUTDOOR_TEMP,
        "date_winter_start": DEFAULT_DATE_WINTER_START,
        "date_winter_end": DEFAULT_DATE_WINTER_END,
        "outdoor_temp_sensor": "",
        "outdoor_cool_only_above_c": DEFAULT_OUTDOOR_COOL_ONLY_ABOVE_C,
        "outdoor_heat_only_below_c": DEFAULT_OUTDOOR_HEAT_ONLY_BELOW_C,
    },
    "presence_rules": [],
    "tts_settings": {
        "language": DEFAULT_TTS_LANGUAGE,
        "speed": DEFAULT_TTS_SPEED,
        "volume": DEFAULT_TTS_VOLUME,
        "prefix": DEFAULT_TTS_PREFIX,
        "media_player": "",
        "mode_change_msg": DEFAULT_MODE_CHANGE_MSG,
        "presence_on_msg": DEFAULT_PRESENCE_ON_MSG,
        "presence_off_msg": DEFAULT_PRESENCE_OFF_MSG,
    },
}
