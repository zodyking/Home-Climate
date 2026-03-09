"""TTS helper functions for Home Climate."""
from __future__ import annotations

import logging

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant

from .const import DEFAULT_TTS_LANGUAGE

_LOGGER = logging.getLogger(__name__)

READY_FOR_TTS_STATES = ("on", "idle", "standby")


def is_media_player_ready_for_tts(hass: HomeAssistant, media_player: str) -> bool:
    """Return True if media player is ready for TTS (on, idle, or standby only)."""
    state = hass.states.get(media_player)
    if state is None:
        return False
    return (state.state or "").lower() in READY_FOR_TTS_STATES


async def async_send_tts(
    hass: HomeAssistant,
    media_player: str,
    message: str,
    language: str | None = None,
    volume: float | None = None,
    tts_entity: str | None = None,
    blocking: bool = False,
) -> None:
    """Send TTS message to a media player."""
    if not message or not message.strip():
        _LOGGER.warning("Empty TTS message, skipping")
        return

    if not media_player:
        _LOGGER.warning("No media player specified for TTS")
        return

    state = hass.states.get(media_player)
    if state is None:
        _LOGGER.error("Media player %s not found", media_player)
        return

    if volume is not None:
        await async_set_volume(hass, media_player, volume)

    if not tts_entity:
        tts_entity = await _find_tts_entity(hass, language)

    if not tts_entity:
        _LOGGER.error("No TTS entity found")
        return

    try:
        await hass.services.async_call(
            "tts",
            "speak",
            {
                "media_player_entity_id": media_player,
                "message": message.strip(),
            },
            target={"entity_id": tts_entity},
            blocking=blocking,
        )
    except Exception as e:
        _LOGGER.error("Failed to send TTS: %s", e)
        raise


async def _find_tts_entity(hass: HomeAssistant, language: str | None = None) -> str | None:
    """Find an available TTS entity."""
    lang = language or DEFAULT_TTS_LANGUAGE
    tts_entities = [
        s.entity_id for s in hass.states.async_all()
        if s.entity_id.startswith("tts.")
    ]
    if not tts_entities:
        return None
    for entity_id in tts_entities:
        if lang in entity_id.lower():
            return entity_id
    return tts_entities[0]


async def async_set_volume(
    hass: HomeAssistant,
    media_player: str,
    volume: float,
) -> None:
    """Set volume on a media player."""
    if not media_player:
        return
    volume = max(0.0, min(1.0, volume))
    try:
        await hass.services.async_call(
            "media_player",
            "volume_set",
            {
                ATTR_ENTITY_ID: media_player,
                "volume_level": volume,
            },
            blocking=True,
        )
    except Exception as e:
        _LOGGER.error("Failed to set volume on %s: %s", media_player, e)
        raise
