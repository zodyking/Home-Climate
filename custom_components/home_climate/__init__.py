"""The Home Climate integration."""
from __future__ import annotations

import json
import logging
import os
import time

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.components import frontend, panel_custom
from homeassistant.components.frontend import DATA_PANELS
from homeassistant.components.http import StaticPathConfig

from .const import DOMAIN, PANEL_ICON, PANEL_TITLE, PANEL_URL

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Home Climate from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["entry_id"] = entry.entry_id
    hass.data[DOMAIN]["options"] = dict(entry.options or {})

    # Initialize config manager
    from .config_manager import ConfigManager
    config_manager = ConfigManager(hass)
    await config_manager.async_load()
    hass.data[DOMAIN]["config_manager"] = config_manager

    # Register WebSocket API
    from .websocket import async_setup as async_setup_websocket
    async_setup_websocket(hass)

    # Register sidebar panel
    await async_register_panels(hass, entry)

    # Start climate monitor
    from .climate_monitor import async_start_climate_monitor
    await async_start_climate_monitor(hass, config_manager)

    # Start presence tracker
    from .presence_tracker import async_start_presence_tracker
    await async_start_presence_tracker(hass, config_manager)

    # Listen for options updates
    entry.async_on_unload(entry.add_update_listener(async_options_update_listener))

    return True


async def async_options_update_listener(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    """Handle options update - re-register panels."""
    if DOMAIN in hass.data:
        hass.data[DOMAIN]["options"] = dict(entry.options or {})
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    # Stop climate monitor
    climate_monitor = hass.data.get(DOMAIN, {}).get("climate_monitor")
    if climate_monitor:
        await climate_monitor.async_stop()

    # Stop presence tracker
    presence_tracker = hass.data.get(DOMAIN, {}).get("presence_tracker")
    if presence_tracker:
        await presence_tracker.async_stop()

    # Stop power detectors
    from .power_detector import async_stop_power_detectors
    async_stop_power_detectors(hass)

    # Remove panel
    try:
        frontend.async_remove_panel(hass, PANEL_URL)
    except KeyError:
        pass

    hass.data.pop(DOMAIN, None)
    return True


async def async_register_panels(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Register the sidebar panel."""
    frontend_path = os.path.join(os.path.dirname(__file__), "frontend")
    panel_url = f"/{DOMAIN}_panel"

    def _read_manifest_version() -> str:
        manifest_path = os.path.join(os.path.dirname(__file__), "manifest.json")
        try:
            with open(manifest_path, encoding="utf-8") as f:
                return json.load(f).get("version", "1.0.0")
        except Exception:
            return "1.0.0"

    version = await hass.async_add_executor_job(_read_manifest_version)
    load_id = str(int(time.time() * 1000))

    await hass.http.async_register_static_paths([
        StaticPathConfig(panel_url, frontend_path, cache_headers=False)
    ])

    try:
        frontend.async_remove_panel(hass, PANEL_URL)
    except KeyError:
        pass
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="home-climate-panel",
        frontend_url_path=PANEL_URL,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=f"{panel_url}/home-climate-panel.js?v={version}&_={load_id}",
        embed_iframe=False,
        require_admin=False,
    )
    _LOGGER.info("Registered Home Climate panel")
