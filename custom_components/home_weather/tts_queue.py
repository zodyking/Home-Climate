"""TTS queue: wait for media player to be ready (on/idle/standby) before sending."""
from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from dataclasses import dataclass

from homeassistant.core import HomeAssistant

from .tts_helper import async_send_tts, is_media_player_ready_for_tts

_LOGGER = logging.getLogger(__name__)

POLL_INTERVAL = 1.0


@dataclass
class TTSPendingItem:
    """A pending TTS message waiting for media player to be ready."""

    media_player: str
    message: str
    language: str | None
    volume: float | None


class TTSPendingQueue:
    """Per-media-player queue; polls and sends when player is ready."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._queues: dict[str, list[TTSPendingItem]] = defaultdict(list)
        self._poll_tasks: dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()

    async def enqueue(self, item: TTSPendingItem) -> None:
        """Add item to queue; start poll task if needed."""
        async with self._lock:
            self._queues[item.media_player].append(item)
            if (
                item.media_player not in self._poll_tasks
                or self._poll_tasks[item.media_player].done()
            ):
                self._poll_tasks[item.media_player] = asyncio.create_task(
                    self._poll_until_ready(item.media_player)
                )

    async def _poll_until_ready(self, media_player: str) -> None:
        """Poll every second; when ready, send next item."""
        try:
            while True:
                await asyncio.sleep(POLL_INTERVAL)
                async with self._lock:
                    queue = self._queues[media_player]
                    if not queue:
                        self._poll_tasks.pop(media_player, None)
                        return
                    if not is_media_player_ready_for_tts(self.hass, media_player):
                        continue
                    item = queue.pop(0)
                await async_send_tts(
                    self.hass,
                    media_player=item.media_player,
                    message=item.message,
                    language=item.language,
                    volume=item.volume,
                )
        except asyncio.CancelledError:
            pass
        except Exception as e:
            _LOGGER.error("TTS queue poll error for %s: %s", media_player, e)


_queue: TTSPendingQueue | None = None


def _get_queue(hass: HomeAssistant) -> TTSPendingQueue:
    global _queue
    if _queue is None:
        _queue = TTSPendingQueue(hass)
    return _queue


async def async_send_tts_or_queue(
    hass: HomeAssistant,
    media_player: str,
    message: str,
    language: str | None = None,
    volume: float | None = None,
) -> None:
    """Send TTS immediately if player ready, else enqueue and poll until ready."""
    if not message or not message.strip():
        _LOGGER.warning("Empty TTS message, skipping")
        return
    if not media_player:
        _LOGGER.warning("No media player specified for TTS")
        return

    if is_media_player_ready_for_tts(hass, media_player):
        await async_send_tts(
            hass,
            media_player=media_player,
            message=message,
            language=language,
            volume=volume,
        )
        return

    item = TTSPendingItem(
        media_player=media_player,
        message=message,
        language=language,
        volume=volume,
    )
    await _get_queue(hass).enqueue(item)
    _LOGGER.debug("TTS enqueued for %s (player not ready)", media_player)
