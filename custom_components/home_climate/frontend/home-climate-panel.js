/**
 * Home Climate Panel - Della Air-inspired climate dashboard
 * Deep blue palette, glass cards, icons, full state display
 */

const STYLES = `
  :host {
    display: block;
    height: 100%;
    background: #152238;
    color: #e8eef3;
    font-family: 'Inter', 'Roboto', 'Segoe UI', -apple-system, sans-serif;
    --accent: #6b9cf5;
    --accent-hover: #8ab4f7;
    --accent-dim: rgba(91, 141, 239, 0.2);
    --card-bg: rgba(28, 50, 88, 0.75);
    --card-border: rgba(255, 255, 255, 0.1);
    --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  * { box-sizing: border-box; }
  .panel-container {
    min-height: 100vh;
    padding: clamp(12px, 2.5vw, 24px);
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: clamp(14px, 3vw, 22px) clamp(18px, 4vw, 28px);
    background: #152238;
    border-bottom: 1px solid var(--card-border);
    margin: calc(-1 * clamp(12px, 2.5vw, 24px)) calc(-1 * clamp(12px, 2.5vw, 24px)) clamp(16px, 2.5vw, 24px);
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: clamp(10px, 2vw, 18px);
  }
  .panel-title {
    font-size: clamp(20px, 4vw, 26px);
    font-weight: 600;
    margin: 0;
    letter-spacing: 0.02em;
  }
  .header-datetime {
    text-align: right;
  }
  .header-time {
    font-size: clamp(22px, 4vw, 30px);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    display: block;
  }
  .header-date {
    font-size: clamp(12px, 2vw, 14px);
    opacity: 0.85;
  }
  .settings-btn {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    border: 1px solid var(--card-border);
    background: var(--card-bg);
    color: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .settings-btn:hover {
    background: var(--accent-dim);
    border-color: var(--accent);
  }
  .settings-btn svg {
    width: 22px;
    height: 22px;
    fill: currentColor;
  }
  .rooms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: clamp(16px, 3vw, 24px);
  }
  .room-card-parent {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--card-bg);
    border-radius: clamp(14px, 3vw, 18px);
    border: 1px solid var(--card-border);
    padding: clamp(18px, 3.5vw, 24px);
    transition: box-shadow 0.25s, transform 0.2s;
  }
  .room-card-parent:hover {
    box-shadow: var(--card-shadow);
  }
  .appliances-subgrid {
    display: flex;
    flex-direction: column;
    gap: clamp(16px, 2.5vw, 20px);
    margin-top: clamp(12px, 2vw, 16px);
    min-width: 0;
    width: 100%;
  }
  .appliance-subcard {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.15);
    border-radius: clamp(10px, 2vw, 12px);
    border: 1px solid var(--card-border);
    padding: clamp(14px, 2.5vw, 20px);
  }
  .onoff-toggle-wrap {
    position: absolute;
    top: clamp(8px, 1.5vw, 12px);
    right: clamp(8px, 1.5vw, 12px);
  }
  .onoff-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--card-border);
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: all 0.2s;
  }
  .onoff-toggle.on {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--card-border);
  }
  .onoff-toggle .toggle-icon {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }
  .fan-badge-btn {
    all: unset;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--card-border);
    font-size: inherit;
    color: inherit;
    opacity: 0.9;
  }
  .fan-badge-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--accent);
  }
  .fan-popover {
    position: fixed;
    z-index: 9999;
    min-width: 120px;
    padding: 6px 0;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 8px;
    box-shadow: var(--card-shadow);
  }
  .fan-popover-option {
    display: block;
    width: 100%;
    padding: 8px 14px;
    border: none;
    background: none;
    color: inherit;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
  }
  .fan-popover-option:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .fan-popover-option.active {
    background: var(--accent-dim);
    color: var(--accent);
  }
  .device-name {
    font-size: clamp(14px, 2.2vw, 16px);
    font-weight: 600;
    margin: 0 0 clamp(10px, 2vw, 14px);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.95;
  }
  .room-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: var(--card-bg);
    border-radius: clamp(14px, 3vw, 18px);
    border: 1px solid var(--card-border);
    padding: clamp(18px, 3.5vw, 24px);
    transition: box-shadow 0.25s, transform 0.2s;
  }
  .room-card:hover {
    box-shadow: var(--card-shadow);
  }
  .room-name {
    font-size: clamp(15px, 2.5vw, 17px);
    font-weight: 600;
    margin: 0 0 clamp(14px, 2.5vw, 18px);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.95;
  }
  .temp-wheel-wrap {
    position: relative;
    width: 140px;
    height: 140px;
    margin: 0 0 clamp(8px, 2vw, 12px);
  }
  .temp-wheel-svg {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .temp-wheel-wrap {
    cursor: pointer;
  }
  .temp-wheel-track {
    fill: none;
    stroke: rgba(255,255,255,0.12);
    stroke-width: 10;
  }
  .temp-wheel-fill {
    fill: none;
    stroke: var(--accent);
    stroke-width: 10;
    stroke-linecap: round;
    transition: stroke-dasharray 0.15s;
  }
  .temp-wheel-knob {
    fill: var(--accent);
    cursor: pointer;
    transition: transform 0.1s;
  }
  .temp-wheel-knob:hover { fill: var(--accent-hover); }
  .temp-wheel-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .temp-wheel-target {
    font-size: clamp(28px, 5vw, 36px);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .temp-wheel-mode {
    font-size: clamp(10px, 1.8vw, 11px);
    opacity: 0.75;
    text-transform: capitalize;
  }
  .temp-wheel-room {
    font-size: clamp(11px, 2vw, 12px);
    opacity: 0.7;
    margin-top: 2px;
  }
  .temp-wheel-wrap.temp-wheel-disabled {
    pointer-events: none;
    opacity: 0.6;
  }
  .temp-buttons.temp-buttons-hidden { display: none; }
  .temp-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: clamp(12px, 2vw, 16px);
  }
  .temp-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--card-border);
    background: rgba(255,255,255,0.04);
    color: inherit;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .temp-btn:hover { background: rgba(255,255,255,0.1); }
  .room-stats {
    display: flex;
    justify-content: center;
    gap: clamp(20px, 4vw, 28px);
    margin-bottom: clamp(12px, 2vw, 16px);
  }
  .room-stat {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .stat-icon {
    width: 28px;
    height: 28px;
    opacity: 0.85;
  }
  .room-stat-inner {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .room-stat-value {
    font-size: clamp(22px, 4.5vw, 28px);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .room-stat-unit {
    font-size: clamp(12px, 2vw, 13px);
    opacity: 0.75;
  }
  .room-state-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-bottom: clamp(12px, 2vw, 16px);
  }
  .fan-controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: clamp(8px, 1.5vw, 12px);
  }
  .fan-btn {
    padding: 6px 12px;
    font-size: 11px;
    text-transform: capitalize;
  }
  .state-badge {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--card-border);
    opacity: 0.9;
  }
  .state-badge.state-action {
    background: var(--accent-dim);
    border-color: rgba(91, 141, 239, 0.3);
  }
  .state-badge.state-fan {
    opacity: 0.8;
  }
  .room-controls {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;
    max-width: 100%;
    justify-content: center;
    gap: clamp(4px, 1vw, 8px);
    margin-top: clamp(10px, 2vw, 14px);
    padding: 0 clamp(4px, 1vw, 8px);
  }
  .ctrl-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 0;
    min-width: 0;
    gap: 4px;
    padding: clamp(6px, 1.5vw, 10px) clamp(6px, 1.5vw, 12px);
    border-radius: 8px;
    border: 1px solid var(--card-border);
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    font-size: clamp(10px, 1.5vw, 13px);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ctrl-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ctrl-btn[data-action="mode"] { min-width: 42px; }
  .ctrl-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .ctrl-btn.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .ctrl-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    object-fit: contain;
  }
  .loading {
    padding: 60px 24px;
    text-align: center;
    font-size: clamp(15px, 2.5vw, 17px);
    opacity: 0.9;
  }
  .loading-spinner {
    width: 48px;
    height: 48px;
    margin: 0 auto 20px;
    border: 3px solid var(--card-border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error {
    padding: 40px 24px;
    text-align: center;
    font-size: clamp(14px, 2.5vw, 16px);
    color: #f87171;
  }
  .empty-state {
    text-align: center;
    padding: clamp(48px, 12vw, 96px) 24px;
    color: rgba(232, 238, 243, 0.65);
    font-size: clamp(15px, 2.5vw, 17px);
  }
  .empty-illustration {
    width: 120px;
    height: 120px;
    margin: 0 auto 24px;
    opacity: 0.4;
  }
  .empty-illustration path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.2;
  }
`;

class HomeWeatherPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._dashboardData = null;
    this._isAdmin = false;
    this._showSettings = false;
    this._settingsTab = "rooms";
    this._entities = null;
    this._loading = true;
    this._error = null;
    this._refreshInterval = null;
    this._collapsedRooms = new Set();
    this._collapsedAppliances = new Set();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config && hass) this._loadConfig();
  }

  set panel(panel) {
    this._panelConfig = panel?.config;
  }

  connectedCallback() {
    this._render();
    this._loadConfig();
    this._startClock();
  }

  disconnectedCallback() {
    this._stopRefresh();
  }

  _startClock() {
    this._updateClock();
    setInterval(() => this._updateClock(), 1000);
  }

  _updateClock() {
    const now = new Date();
    const timeEl = this.shadowRoot?.querySelector(".header-time");
    const dateEl = this.shadowRoot?.querySelector(".header-date");
    if (timeEl) timeEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (dateEl) dateEl.textContent = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }

  _startRefresh() {
    this._stopRefresh();
    this._refreshInterval = setInterval(() => this._loadDashboardData(), 1000);
  }

  _stopRefresh() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }
  }

  async _loadConfig() {
    if (!this._hass) return;
    this._loading = true;
    this._error = null;
    this._render();

    try {
      const [configRes, userRes, entitiesRes] = await Promise.all([
        this._hass.callWS({ type: "home_climate/get_config" }),
        this._hass.callWS({ type: "home_climate/get_user_info" }).catch(() => ({ is_admin: false })),
        this._hass.callWS({ type: "home_climate/get_entities" }).catch(() => ({ climate: [], sensors: [], persons: [], zones: [], media_players: [] })),
      ]);
      this._config = configRes || {};
      this._isAdmin = userRes?.is_admin === true;
      this._entities = entitiesRes || { climate: [], sensors: [], persons: [], zones: [], media_players: [] };
      await this._loadDashboardData();
      this._loading = false;
      this._render();
      this._startRefresh();
    } catch (e) {
      console.error("Home Climate load config error:", e);
      this._loading = false;
      this._error = e?.message || "Failed to load";
      this._render();
    }
  }

  async _loadDashboardData() {
    if (!this._hass || this._showSettings) return;
    try {
      const res = await this._hass.callWS({ type: "home_climate/get_dashboard_data" });
      const prevData = this._dashboardData;
      this._dashboardData = res;

      if (!this._loading) {
        const root = this.shadowRoot;
        const grid = root?.querySelector(".rooms-grid");
        const canPatch = grid && !this._showSettings && prevData?.rooms?.length > 0;

        if (canPatch && this._patchDashboardData(res, prevData)) {
          return;
        }
        this._render();
      }
    } catch (e) {
      console.error("Home Climate dashboard data error:", e);
    }
  }

  _patchDashboardData(newData, prevData) {
    const root = this.shadowRoot;
    if (!root || !newData?.rooms || !prevData?.rooms) return false;

    const newRooms = newData.rooms || [];
    const prevRooms = prevData.rooms || [];

    if (newRooms.length !== prevRooms.length) return false;
    const structureMatch = newRooms.every((r, i) => {
      const pr = prevRooms[i];
      if (!pr || r.id !== pr.id) return false;
      const newApps = r.appliances || [];
      const prevApps = pr.appliances || [];
      if (newApps.length !== prevApps.length) return false;
      return newApps.every((a, j) => (prevApps[j]?.climate_entity || "") === (a.climate_entity || ""));
    });
    if (!structureMatch) return false;

    for (const room of newRooms) {
      const roomCard = Array.from(root.querySelectorAll(".room-card-parent")).find((el) => (el.dataset.roomId || "") === (room.id || ""));
      if (!roomCard) continue;

      const statValues = roomCard.querySelectorAll(".room-stat-value");
      if (statValues.length >= 2) {
        statValues[0].textContent = room.temp != null ? room.temp.toFixed(1) : "—";
        statValues[1].textContent = room.humidity != null ? room.humidity.toFixed(0) : "—";
      }

      for (const app of room.appliances || []) {
        const entity = app.climate_entity || "";
        const appCard = Array.from(roomCard.querySelectorAll(".appliance-subcard")).find((el) => (el.dataset.entity || "") === entity);
        if (!appCard) continue;

        const isOn = (app.climate_mode || app.climate_state || "off") !== "off";
        const mode = app.climate_mode || "off";
        const fanMode = app.fan_mode || "";
        const fanModes = app.fan_modes || [];
        const appUnit = (room.temperature_unit || "°C").replace("°", "").toUpperCase() === "F" ? "°F" : "°C";
        const roomTemp = app.temp != null ? app.temp.toFixed(1) : "—";
        const isFanOnly = mode === "fan_only";
        const targetDisplay = isFanOnly ? "—" : `${app.target_temp != null ? Math.round(app.target_temp) : "—"}${appUnit}`;

        const toggle = appCard.querySelector(".onoff-toggle");
        if (toggle) {
          toggle.classList.toggle("on", isOn);
          toggle.dataset.isOn = isOn;
          toggle.setAttribute("aria-label", isOn ? "Turn off" : "Turn on");
          const img = toggle.querySelector(".toggle-icon");
          if (img) img.src = `/home_climate_panel/icons/${isOn ? "power-on" : "power-off"}.png`;
        }

        appCard.querySelectorAll(".ctrl-btn[data-action='mode']").forEach((btn) => {
          const m = (btn.dataset.hvacMode || "").toLowerCase();
          btn.classList.toggle("active", mode === m);
        });

        const fanBtn = appCard.querySelector("[data-action='fan-popover']");
        if (fanBtn) {
          fanBtn.textContent = `Fan: ${fanMode || "—"}`;
          fanBtn.dataset.fanMode = fanMode;
        }

        const wheelWrap = appCard.querySelector(".temp-wheel-wrap");
        if (wheelWrap) {
          wheelWrap.classList.toggle("temp-wheel-disabled", isFanOnly);
          wheelWrap.dataset.disabled = isFanOnly;
          const targetEl = wheelWrap.querySelector(".temp-wheel-target");
          const roomEl = wheelWrap.querySelector(".temp-wheel-room");
          if (targetEl) targetEl.textContent = targetDisplay;
          if (roomEl) roomEl.textContent = `Room − ${roomTemp}${appUnit}`;
        }

        const tempBtns = appCard.querySelector(".temp-buttons");
        if (tempBtns) {
          tempBtns.classList.toggle("temp-buttons-hidden", isFanOnly);
          tempBtns.dataset.fanOnly = isFanOnly;
        }
      }
    }

    return true;
  }

  async _setClimateAndAnnounce(entityId, service, hvacMode, roomName) {
    if (!this._hass || !entityId) return;
    try {
      await this._hass.callWS({
        type: "home_climate/set_climate_and_announce",
        entity_id: entityId,
        service,
        hvac_mode: hvacMode,
        room_name: roomName,
      });
      await this._loadDashboardData();
    } catch (e) {
      console.error("Climate set-and-announce error:", e);
    }
  }

  _render() {
    const root = this.shadowRoot;
    if (!root) return;

    root.innerHTML = `
      <style>${STYLES}</style>
      <div class="panel-container">
        <header class="panel-header">
          <div class="header-left">
            <h1 class="panel-title">Home Climate</h1>
            ${this._isAdmin ? `
              <button class="settings-btn" aria-label="Settings" title="Settings">
                <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
              </button>
            ` : ""}
          </div>
          <div class="header-datetime">
            <span class="header-time">--:--</span>
            <span class="header-date"></span>
          </div>
        </header>

        ${this._loading ? '<div class="loading"><div class="loading-spinner" aria-hidden="true"></div>Loading...</div>' : ""}
        ${this._error ? `<div class="error">${this._escapeHtml(this._error)}</div>` : ""}

        ${!this._loading && !this._error && this._showSettings ? this._renderSettings() : ""}
        ${!this._loading && !this._error && !this._showSettings ? this._renderDashboard() : ""}
      </div>
    `;

    const settingsBtn = root.querySelector(".settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        this._showSettings = !this._showSettings;
        this._render();
      });
    }

    root.querySelectorAll(".settings-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this._settingsTab = tab.dataset.tab;
        this._render();
      });
    });

    const closeSettingsBtn = root.querySelector("[data-action='close-settings']");
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener("click", () => {
        this._showSettings = false;
        this._render();
      });
    }

    const saveSettingsBtn = root.querySelector("[data-action='save-settings']");
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener("click", () => this._saveSettings());
    }

    const addRoomBtn = root.querySelector("[data-action='add-room']");
    if (addRoomBtn) {
      addRoomBtn.addEventListener("click", () => {
        this._config = this._config || {};
        this._config.rooms = this._config.rooms || [];
        this._config.rooms.push({
          id: crypto.randomUUID(),
          name: "",
          temp_sensor: "",
          humidity_sensor: "",
          media_player: "",
          volume: 0.7,
          tts_overrides: {},
          appliances: [],
        });
        this._render();
      });
    }

    root.querySelectorAll("[data-action='delete-room']").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const roomName = btn.dataset.roomName || "this room";
        if (!confirm(`Delete ${roomName}? This cannot be undone.`)) return;
        const idx = parseInt(btn.dataset.roomIndex, 10);
        const rooms = this._config?.rooms || [];
        if (idx >= 0 && idx < rooms.length) {
          rooms.splice(idx, 1);
          this._collapsedRooms.clear();
          this._collapsedAppliances.clear();
          this._render();
        }
      });
    });

    root.querySelectorAll("[data-action='delete-appliance']").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const appName = btn.dataset.appName || "this appliance";
        if (!confirm(`Delete ${appName}? This cannot be undone.`)) return;
        const roomIdx = parseInt(btn.dataset.roomIndex, 10);
        const appIdx = parseInt(btn.dataset.appIndex, 10);
        const room = this._config?.rooms?.[roomIdx];
        if (room?.appliances && appIdx >= 0 && appIdx < room.appliances.length) {
          room.appliances.splice(appIdx, 1);
          this._collapsedAppliances.clear();
          this._render();
        }
      });
    });

    root.querySelectorAll("[data-action='toggle-room']").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-action='delete-room']")) return;
        const key = el.dataset.key;
        if (!key) return;
        if (this._collapsedRooms.has(key)) this._collapsedRooms.delete(key);
        else this._collapsedRooms.add(key);
        const row = el.closest(".room-row");
        if (row) row.classList.toggle("collapsed");
      });
    });

    root.querySelectorAll("[data-action='toggle-appliance']").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-action='delete-appliance']")) return;
        const key = el.dataset.key;
        if (!key) return;
        if (this._collapsedAppliances.has(key)) this._collapsedAppliances.delete(key);
        else this._collapsedAppliances.add(key);
        const card = el.closest(".appliance-card");
        if (card) card.classList.toggle("collapsed");
      });
    });

    root.querySelectorAll("[data-action='add-appliance']").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const roomIndex = parseInt(e.currentTarget.dataset.roomIndex, 10);
        const rooms = this._config?.rooms || [];
        const room = rooms[roomIndex];
        if (!room) return;
        room.appliances = room.appliances || [];
        room.appliances.push({
          id: crypto.randomUUID(),
          device_type: "minisplit",
          custom_name: "",
          climate_entity: "",
          automation: {
            person: "",
            zone: "",
            enter_duration_sec: 30,
            exit_duration_sec: 300,
            target_temp_on_enter: 22,
            heat_threshold_c: 18,
            cool_threshold_c: 26,
            seasonal_mode: "outdoor_temp",
            outdoor_temp_sensor: "",
            date_winter_start: "11-01",
            date_winter_end: "03-31",
            outdoor_cool_only_above_c: 25,
            outdoor_heat_only_below_c: 15,
          },
        });
        this._render();
      });
    });

    this._bindRoomControls(root);

    if (this._showSettings) {
      this._initEntityAutocompletes(root.querySelector(".settings-view"));
    }
  }

  _renderDashboard() {
    const rooms = this._dashboardData?.rooms || [];
    if (rooms.length === 0) {
      return `
        <div class="empty-state">
          <svg class="empty-illustration" viewBox="0 0 120 120" aria-hidden="true">
            <path d="M60 20L20 55v45h30V70h20v30h30V55z"/>
            <circle cx="60" cy="45" r="8"/>
          </svg>
          <p>No rooms configured.</p>
          <p>${this._isAdmin ? "Open Settings to add rooms and map climate entities." : "Contact an admin to configure rooms."}</p>
        </div>
      `;
    }

    return `
      <div class="rooms-grid">
        ${rooms.map((r) => this._renderRoomParentCard(r)).join("")}
      </div>
    `;
  }

  _renderRoomParentCard(room) {
    const temp = room.temp != null ? room.temp.toFixed(1) : "—";
    const humidity = room.humidity != null ? room.humidity.toFixed(0) : "—";
    const roomName = room.name || "Room";
    const unit = (room.temperature_unit || "°C").replace("°", "").toUpperCase() === "F" ? "°F" : "°C";
    const appliances = room.appliances || [];
    const isMonitorOnly = room.is_monitor_only || appliances.length === 0;

    const tempIcon = `<svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2v-6z"/></svg>`;
    const humidityIcon = `<svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;

    return `
      <div class="room-card-parent" data-room-id="${this._escapeHtml(room.id || "")}">
        <h3 class="room-name">${this._escapeHtml(roomName)}</h3>
        <div class="room-stats">
          <div class="room-stat">
            ${tempIcon}
            <div class="room-stat-inner">
              <span class="room-stat-value">${temp}</span>
              <span class="room-stat-unit">${unit}</span>
            </div>
          </div>
          <div class="room-stat">
            ${humidityIcon}
            <div class="room-stat-inner">
              <span class="room-stat-value">${humidity}</span>
              <span class="room-stat-unit">%</span>
            </div>
          </div>
        </div>
        ${isMonitorOnly ? `<div class="room-state-row"><span class="state-badge">Monitor</span></div>` : ""}
        ${appliances.length > 0 ? `
          <div class="appliances-subgrid">
            ${appliances.map((app) => this._renderApplianceSubCard(app, room)).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }

  _renderApplianceSubCard(appliance, room) {
    const app = {
      ...appliance,
      name: appliance.device_name || "Appliance",
      humidity: room.humidity,
      temperature_unit: room.temperature_unit,
      _roomNameForTts: room.name || "Room",
    };
    const isOn = (appliance.climate_mode || appliance.climate_state || "off") !== "off";
    const entity = this._escapeHtml(appliance.climate_entity || "");
    const roomName = this._escapeHtml(room.name || "Room");
    return `
      <div class="appliance-subcard" data-entity="${entity}" data-room-name="${roomName}">
        <div class="onoff-toggle-wrap">
          <button class="onoff-toggle ${isOn ? "on" : ""}" data-action="onoff" data-entity="${entity}" data-room-name="${roomName}" data-is-on="${isOn}" aria-label="${isOn ? "Turn off" : "Turn on"}">
            <img class="toggle-icon" src="/home_climate_panel/icons/${isOn ? "power-on" : "power-off"}.png" alt="">
          </button>
        </div>
        <h4 class="device-name">${this._escapeHtml(appliance.device_name || "Appliance")}</h4>
        ${this._renderRoomCard(app, true)}
      </div>
    `;
  }

  _hvacActionLabel(action) {
    const labels = { heating: "Heating", cooling: "Cooling", idle: "Idle", off: "Off" };
    return labels[action] || (action || "—");
  }

  _modeLabel(mode) {
    const labels = { heat: "Heat", cool: "Cool", dry: "Dehumidifier", fan_only: "Fan Only", off: "Off" };
    return labels[mode] || mode;
  }

  _allowedModes(hvacModes, excludeOff = false) {
    const exclude = new Set(["heat_cool", "auto"]);
    let allowed = ["heat", "cool", "dry", "fan_only", "off"];
    if (excludeOff) allowed = allowed.filter((m) => m !== "off");
    if (hvacModes && hvacModes.length > 0) {
      return allowed.filter((m) => hvacModes.includes(m) && !exclude.has(m));
    }
    return allowed;
  }

  _renderTempWheel(room) {
    const minT = room.min_temp ?? 16;
    const maxT = room.max_temp ?? 30;
    const mode = (room.climate_mode || room.climate_state || "off").toLowerCase();
    const isFanOnly = mode === "fan_only";
    const target = room.target_temp != null ? Math.round(room.target_temp) : Math.round((minT + maxT) / 2);
    const range = maxT - minT || 1;
    const norm = isFanOnly ? 0 : Math.max(0, Math.min(1, (target - minT) / range));
    const unit = (room.temperature_unit || "°C").replace("°", "").toUpperCase() === "F" ? "°F" : "°C";
    const roomTemp = room.temp != null ? room.temp.toFixed(1) : "—";
    const targetDisplay = isFanOnly ? "—" : `${target}${unit}`;

    const r = 45;
    const circum = 2 * Math.PI * r;
    const arcLen = circum * 0.75;
    const dashLen = norm * arcLen;
    const dashOffset = circum * 0.625;

    const knobAngle = -135 + 270 * norm;
    const rad = (knobAngle * Math.PI) / 180;
    const knobX = 50 + r * Math.cos(rad);
    const knobY = 50 + r * Math.sin(rad);

    const modeLabel = mode !== "off" ? this._modeLabel(mode) : "";

    const ttsRoomName = room._roomNameForTts || room.name || "Room";
    const disabledClass = isFanOnly ? " temp-wheel-disabled" : "";
    return `
      <div class="temp-wheel-wrap${disabledClass}" data-entity="${this._escapeHtml(room.climate_entity || "")}" data-room-name="${this._escapeHtml(ttsRoomName)}" data-min="${minT}" data-max="${maxT}" data-target="${target}" data-unit="${this._escapeHtml(unit)}" data-disabled="${isFanOnly}">
        <svg class="temp-wheel-svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="temp-wheel-track" cx="50" cy="50" r="${r}" />
          <circle class="temp-wheel-fill" cx="50" cy="50" r="${r}" stroke-dasharray="${dashLen} 500" stroke-dashoffset="${-dashOffset}" />
          <circle class="temp-wheel-knob" cx="${knobX}" cy="${knobY}" r="6" data-wheel-knob />
        </svg>
        <div class="temp-wheel-inner">
          <span class="temp-wheel-target">${targetDisplay}</span>
          ${modeLabel ? `<span class="temp-wheel-mode">${modeLabel}</span>` : ""}
          <span class="temp-wheel-room">Room − ${roomTemp}${unit}</span>
        </div>
      </div>
    `;
  }

  _renderRoomCard(room, asSubCard = false) {
    const temp = room.temp != null ? room.temp.toFixed(1) : "—";
    const humidity = room.humidity != null ? room.humidity.toFixed(0) : "—";
    const mode = (room.climate_mode || room.climate_state || "off").toLowerCase();
    const hvacAction = room.hvac_action || null;
    const fanMode = room.fan_mode || null;
    const hasClimate = !!(room.climate_entity && !room.is_monitor_only);
    const roomName = (asSubCard && room._roomNameForTts) ? room._roomNameForTts : (room.name || "Room");
    const unit = (room.temperature_unit || "°C").replace("°", "").toUpperCase() === "F" ? "°F" : "°C";
    const minT = room.min_temp ?? 16;
    const maxT = room.max_temp ?? 30;
    const allowedModes = this._allowedModes(room.hvac_modes);
    const fanModes = room.fan_modes || [];

    const iconBase = "/home_climate_panel/icons";
    const heatIcon = `<img class="ctrl-icon" src="${iconBase}/heatmode.png" alt="Heat">`;
    const coolIcon = `<img class="ctrl-icon" src="${iconBase}/coolmode.png" alt="Cool">`;
    const dryIcon = `<img class="ctrl-icon" src="${iconBase}/drymode.png" alt="Dehumidifier">`;
    const fanIcon = `<img class="ctrl-icon" src="${iconBase}/fan_onlymode.png" alt="Fan">`;
    const offIcon = `<svg class="ctrl-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>`;

    const modeIcons = { heat: heatIcon, cool: coolIcon, dry: dryIcon, fan_only: fanIcon, off: offIcon };
    const currentTarget = room.target_temp != null ? room.target_temp : (minT + maxT) / 2;
    const modesForRow = asSubCard ? this._allowedModes(room.hvac_modes, true) : this._allowedModes(room.hvac_modes);

    const content = `
      ${hasClimate ? this._renderTempWheel(room) : ""}
      ${hasClimate ? `
        <div class="temp-buttons ${mode === "fan_only" ? "temp-buttons-hidden" : ""}" data-fan-only="${mode === "fan_only"}">
          <button class="temp-btn" data-action="temp-down" data-entity="${this._escapeHtml(room.climate_entity)}" data-room-name="${this._escapeHtml(roomName)}" data-min="${minT}" data-max="${maxT}" data-target="${currentTarget}">−</button>
          <button class="temp-btn" data-action="temp-up" data-entity="${this._escapeHtml(room.climate_entity)}" data-room-name="${this._escapeHtml(roomName)}" data-min="${minT}" data-max="${maxT}" data-target="${currentTarget}">+</button>
        </div>
      ` : ""}
      ${!asSubCard ? `
        <div class="room-stats">
          <div class="room-stat">
            <svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2v-6z"/></svg>
            <div class="room-stat-inner">
              <span class="room-stat-value">${temp}</span>
              <span class="room-stat-unit">${unit}</span>
            </div>
          </div>
          <div class="room-stat">
            <svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            <div class="room-stat-inner">
              <span class="room-stat-value">${humidity}</span>
              <span class="room-stat-unit">%</span>
            </div>
          </div>
        </div>
      ` : ""}
      <div class="room-state-row">
        ${room.is_monitor_only ? `<span class="state-badge">Monitor</span>` : ""}
        ${!room.is_monitor_only && hvacAction ? `<span class="state-badge state-action">${this._hvacActionLabel(hvacAction)}</span>` : ""}
        ${!room.is_monitor_only && fanModes.length > 0 ? `<button type="button" class="fan-badge-btn state-badge state-fan" data-action="fan-popover" data-entity="${this._escapeHtml(room.climate_entity)}" data-fan-mode="${this._escapeHtml(fanMode || "")}" data-fan-modes="${this._escapeHtml(fanModes.join(","))}" data-room-name="${this._escapeHtml(roomName)}">Fan: ${this._escapeHtml(fanMode || "—")}</button>` : ""}
      </div>
      ${hasClimate ? `
        <div class="room-controls">
          ${modesForRow.map((m) => `
            <button class="ctrl-btn ${mode === m ? "active" : ""}" title="${this._escapeHtml(this._modeLabel(m))}" aria-label="${this._escapeHtml(this._modeLabel(m))}" data-action="mode" data-hvac-mode="${m}" data-entity="${this._escapeHtml(room.climate_entity)}" data-room-name="${this._escapeHtml(roomName)}">${modeIcons[m] || offIcon}</button>
          `).join("")}
        </div>
      ` : ""}
    `;

    if (asSubCard) {
      return content;
    }
    return `
      <div class="room-card" data-room-id="${this._escapeHtml(room.id || "")}">
        <h3 class="room-name">${this._escapeHtml(roomName)}</h3>
        ${content}
      </div>
    `;
  }

  async _setTemperature(entityId, temperature, roomName) {
    if (!this._hass || !entityId) return;
    try {
      await this._hass.callWS({
        type: "home_climate/set_temperature",
        entity_id: entityId,
        temperature: parseFloat(temperature),
        room_name: roomName || "Room",
      });
      await this._loadDashboardData();
    } catch (e) {
      console.error("Set temperature error:", e);
    }
  }

  async _setFanMode(entityId, fanMode) {
    if (!this._hass || !entityId) return;
    try {
      await this._hass.callWS({
        type: "home_climate/set_fan_mode",
        entity_id: entityId,
        fan_mode: fanMode,
      });
      await this._loadDashboardData();
    } catch (e) {
      console.error("Set fan mode error:", e);
    }
  }

  _closeFanPopover() {
    const pop = this.shadowRoot?.querySelector(".fan-popover");
    if (pop) pop.remove();
    document.removeEventListener("click", this._fanPopoverOutsideClick);
    document.removeEventListener("keydown", this._fanPopoverEscape);
  }

  _showFanPopover(btn) {
    this._closeFanPopover();
    const entity = btn.dataset.entity;
    const fanModesStr = btn.dataset.fanModes || "";
    const fanModes = fanModesStr.split(",").filter(Boolean);
    const currentMode = (btn.dataset.fanMode || "").toLowerCase();
    if (!entity || fanModes.length === 0) return;

    const popover = document.createElement("div");
    popover.className = "fan-popover";
    popover.innerHTML = fanModes.map((fm) => {
      const isActive = (fm || "").toLowerCase() === currentMode;
      return `<button type="button" class="fan-popover-option ${isActive ? "active" : ""}" data-fan-mode="${this._escapeHtml(fm)}">${this._escapeHtml(fm)}</button>`;
    }).join("");

    const rect = btn.getBoundingClientRect();
    popover.style.left = `${rect.left + (rect.width / 2) - 60}px`;
    popover.style.top = `${rect.bottom + 4}px`;

    fanModes.forEach((fm, i) => {
      popover.children[i].addEventListener("click", (e) => {
        e.stopPropagation();
        this._setFanMode(entity, fm);
        this._closeFanPopover();
      });
    });

    this.shadowRoot.appendChild(popover);

    this._fanPopoverOutsideClick = (e) => {
      if (!popover.contains(e.target) && e.target !== btn) this._closeFanPopover();
    };
    this._fanPopoverEscape = (e) => {
      if (e.key === "Escape") this._closeFanPopover();
    };
    setTimeout(() => {
      document.addEventListener("click", this._fanPopoverOutsideClick);
      document.addEventListener("keydown", this._fanPopoverEscape);
    }, 0);
  }

  _bindRoomControls(root) {
    root.querySelectorAll(".onoff-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        const isOn = e.currentTarget.dataset.isOn === "true";
        if (!entity) return;
        if (isOn) {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else {
          this._setClimateAndAnnounce(entity, "turn_on", null, roomName);
        }
      });
    });

    root.querySelectorAll("[data-action='fan-popover']").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._showFanPopover(e.currentTarget);
      });
    });

    root.querySelectorAll(".ctrl-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const action = e.currentTarget.dataset.action;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        if (!entity || action !== "mode") return;
        const hvacMode = e.currentTarget.dataset.hvacMode;
        if (hvacMode === "off") {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else {
          this._setClimateAndAnnounce(entity, "set_hvac_mode", hvacMode, roomName);
        }
      });
    });

    root.querySelectorAll(".temp-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const action = e.currentTarget.dataset.action;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        if (!entity) return;
        const minT = parseFloat(e.currentTarget.dataset.min) || 16;
        const maxT = parseFloat(e.currentTarget.dataset.max) || 30;
        let target = parseFloat(e.currentTarget.dataset.target) || (minT + maxT) / 2;
        const step = 1;
        if (action === "temp-down") target = Math.max(minT, target - step);
        else if (action === "temp-up") target = Math.min(maxT, target + step);
        this._setTemperature(entity, target, roomName);
      });
    });

    root.querySelectorAll(".temp-wheel-wrap:not(.temp-wheel-disabled)").forEach((wrap) => {
      const entity = wrap.dataset.entity;
      const roomName = wrap.dataset.roomName || "Room";
      const minT = parseFloat(wrap.dataset.min) || 16;
      const maxT = parseFloat(wrap.dataset.max) || 30;
      const unit = wrap.dataset.unit || "°C";
      if (!entity) return;
      const fillCircle = wrap.querySelector(".temp-wheel-fill");
      const knob = wrap.querySelector("[data-wheel-knob]");
      const targetEl = wrap.querySelector(".temp-wheel-target");
      const r = 45;
      const circum = 2 * Math.PI * r;
      const arcLen = circum * 0.75;
      const dashOffset = circum * 0.625;

      const getNormFromEvent = (e) => {
        const rect = wrap.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const x = (e.clientX || e.touches?.[0]?.clientX) - cx;
        const y = (e.clientY || e.touches?.[0]?.clientY) - cy;
        const angleDeg = (Math.atan2(y, x) * 180) / Math.PI;
        return Math.max(0, Math.min(1, (angleDeg + 135) / 270));
      };

      const normToTemp = (norm) => Math.round(minT + norm * (maxT - minT));

      const updateDOM = (norm) => {
        const dashLen = norm * arcLen;
        if (fillCircle) {
          fillCircle.setAttribute("stroke-dasharray", `${dashLen} 500`);
          fillCircle.setAttribute("stroke-dashoffset", String(-dashOffset));
        }
        const knobAngle = -135 + 270 * norm;
        const rad = (knobAngle * Math.PI) / 180;
        const knobX = 50 + r * Math.cos(rad);
        const knobY = 50 + r * Math.sin(rad);
        if (knob) {
          knob.setAttribute("cx", String(knobX));
          knob.setAttribute("cy", String(knobY));
        }
        if (targetEl) targetEl.textContent = `${normToTemp(norm)}${unit}`;
      };

      const handleSetTemp = (norm) => {
        const temp = normToTemp(norm);
        this._setTemperature(entity, temp, roomName);
      };

      const onDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let lastNorm = getNormFromEvent(e);
        updateDOM(lastNorm);
        const onMove = (ev) => {
          ev.preventDefault();
          lastNorm = getNormFromEvent(ev);
          updateDOM(lastNorm);
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          document.removeEventListener("touchmove", onMove, { passive: false });
          document.removeEventListener("touchend", onUp);
          handleSetTemp(lastNorm);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onUp);
      };

      wrap.addEventListener("mousedown", onDown);
      wrap.addEventListener("touchstart", onDown, { passive: false });
    });
  }

  _getEntitiesForAutocomplete(entityType) {
    const entities = this._entities || {};
    if (entityType === "sensor") {
      return (entities.sensors || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
    }
    if (entityType === "sensor_temp") {
      return (entities.sensors || []).filter((s) => (s.unit || "").includes("°") || (s.unit || "").toLowerCase().includes("c")).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
    }
    if (entityType === "climate") {
      return (entities.climate || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
    }
    if (entityType === "person") {
      return (entities.persons || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
    }
    if (entityType === "zone") {
      return (entities.zones || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
    }
    return [];
  }

  _filterEntityMatches(entities, query) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return entities.slice(0, 20);
    const scored = entities.map((e) => {
      let score = 0;
      const id = (e.entity_id || "").toLowerCase();
      const name = (e.friendly_name || e.entity_id || "").toLowerCase();
      if (id.includes(q)) score += 2;
      if (name.includes(q)) score += 3;
      if (id.startsWith(q) || name.startsWith(q)) score += 5;
      if (id === q || name === q) score += 20;
      return { ...e, _score: score };
    }).filter((e) => e._score > 0).sort((a, b) => b._score - a._score);
    return scored.slice(0, 15).map(({ _score, ...e }) => e);
  }

  _renderEntityAutocomplete(value, entityType, fieldName, placeholder) {
    this._entityDatalistId = (this._entityDatalistId || 0) + 1;
    const dlId = `entity-dl-${this._entityDatalistId}`;
    const val = (value || "").trim();
    const safeVal = val.replace(/"/g, "&quot;");
    return `
      <input type="text" class="form-input entity-datalist-input" value="${safeVal}" placeholder="${(placeholder || "Type to search...").replace(/"/g, "&quot;")}" list="${dlId}" data-entity-type="${entityType}" data-field="${fieldName || ""}" autocomplete="off">
      <datalist id="${dlId}" data-entity-type="${entityType}"></datalist>
    `;
  }

  _initEntityAutocompletes(container) {
    if (!container) return;
    container.querySelectorAll(".entity-datalist-input").forEach((input) => {
      const dlId = input.getAttribute("list");
      const datalist = dlId ? container.querySelector(`#${dlId}`) : null;
      const entityType = input.dataset.entityType;
      if (!datalist || !entityType) return;
      if (input._entityDatalistInit) return;
      input._entityDatalistInit = true;
      const update = () => {
        const entities = this._getEntitiesForAutocomplete(entityType);
        const matches = this._filterEntityMatches(entities, input.value);
        datalist.innerHTML = matches.map((e) => {
          const id = (e.entity_id || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
          const label = (e.friendly_name || e.entity_id || "").replace(/</g, "&lt;");
          return `<option value="${id}">${label}</option>`;
        }).join("");
      };
      input.addEventListener("focus", () => update());
      input.addEventListener("input", () => update());
    });
  }

  _ttsEventLabels() {
    return {
      manual_on: "Manual turn on",
      manual_off: "Manual turn off",
      mode_change: "Mode change",
      temp_change: "Temperature change",
      presence_enter: "Presence enter zone",
      presence_leave: "Presence leave zone",
      fan_change: "Fan speed change",
    };
  }

  _renderSettings() {
    const rooms = this._config?.rooms || [];
    const ttsSettings = this._config?.tts_settings || {};
    const ttsMessages = ttsSettings.messages || {};
    const entities = this._entities || { climate: [], sensors: [], persons: [], zones: [], media_players: [] };

    const settingsStyles = `
      .settings-tabs { display: flex; gap: 4px; margin-bottom: 20px; flex-wrap: wrap; }
      .settings-tab { padding: 10px 16px; border: none; background: transparent; color: rgba(225,232,237,0.7); cursor: pointer; border-radius: 8px; font-size: 13px; }
      .settings-tab:hover { background: rgba(255,255,255,0.05); }
      .settings-tab.active { background: var(--accent); color: #fff; }
      .settings-tab-content { display: none; }
      .settings-tab-content.active { display: block; }
      .settings-card { background: var(--card-bg); border-radius: 12px; border: 1px solid var(--card-border); padding: 20px; margin-bottom: 16px; }
      .settings-card h3 { margin: 0 0 16px; font-size: 14px; }
      .settings-card h4 { margin: 12px 0 8px; font-size: 12px; opacity: 0.9; }
      .form-group { margin-bottom: 14px; }
      .form-label { display: block; font-size: 12px; margin-bottom: 4px; opacity: 0.9; }
      .form-input, .form-select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--card-border); background: #1a2840; color: #e8eef3; font-size: 13px; }
      .form-select { cursor: pointer; color-scheme: dark; }
      .form-select option { background: #1a2840; color: #e8eef3; }
      .btn-save { margin-top: 16px; padding: 10px 20px; background: var(--accent); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
      .btn-save:hover { background: var(--accent-hover); }
      .btn-add { padding: 8px 14px; background: rgba(124,58,237,0.2); color: var(--accent); border: 1px solid var(--accent); border-radius: 8px; cursor: pointer; font-size: 12px; margin-bottom: 12px; }
      .btn-add:hover { background: var(--accent-dim); }
      .btn-delete { padding: 6px 12px; background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.4); border-radius: 6px; cursor: pointer; font-size: 11px; }
      .btn-delete:hover { background: rgba(239,68,68,0.25); }
      .room-row { padding: 0; background: rgba(0,0,0,0.15); border-radius: 8px; margin-bottom: 14px; border: 1px solid var(--card-border); overflow: hidden; }
      .room-row-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; user-select: none; }
      .room-row-header:hover { background: rgba(255,255,255,0.03); }
      .room-row-header .chevron { transition: transform 0.2s; }
      .room-row.collapsed .room-row-header .chevron { transform: rotate(-90deg); }
      .room-row-content { padding: 0 16px 16px; }
      .room-row.collapsed .room-row-content { display: none; }
      .appliance-card { padding: 0; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--card-border); overflow: hidden; }
      .appliance-card-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: pointer; user-select: none; }
      .appliance-card-header:hover { background: rgba(255,255,255,0.03); }
      .appliance-card-header .chevron { transition: transform 0.2s; }
      .appliance-card.collapsed .appliance-card-header .chevron { transform: rotate(-90deg); }
      .appliance-card-content { padding: 12px; }
      .appliance-card.collapsed .appliance-card-content { display: none; }
      .tts-event-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
      .tts-event-row .form-input { flex: 1; min-width: 200px; }
      .tts-toggle { min-width: 50px; }
    `;

    const ttsEventKeys = ["manual_on", "manual_off", "mode_change", "temp_change", "presence_enter", "presence_leave", "fan_change"];
    const labels = this._ttsEventLabels();

    return `
      <style>${settingsStyles}</style>
      <div class="settings-view">
        <div class="settings-tabs">
          <button class="settings-tab ${this._settingsTab === "rooms" ? "active" : ""}" data-tab="rooms">Rooms</button>
          <button class="settings-tab ${this._settingsTab === "tts" ? "active" : ""}" data-tab="tts">TTS</button>
        </div>

        <div class="settings-tab-content ${this._settingsTab === "rooms" ? "active" : ""}" id="tab-rooms">
          <div class="settings-card">
            <h3>Rooms</h3>
            <button class="btn-add" data-action="add-room">+ Add Room</button>
            <div id="rooms-list">
              ${rooms.length === 0 ? "<p style='opacity:0.7;'>No rooms. Add a room to configure sensors and HVAC appliances.</p>" : ""}
              ${rooms.map((r, i) => this._renderRoomRow(r, i, entities)).join("")}
            </div>
          </div>
        </div>

        <div class="settings-tab-content ${this._settingsTab === "tts" ? "active" : ""}" id="tab-tts">
          <div class="settings-card">
            <h3>TTS Settings</h3>
            <div class="form-group">
              <label class="form-label">Global prefix</label>
              <input type="text" class="form-input" id="tts-prefix" value="${this._escapeHtml(ttsSettings.prefix || "Message from Home Climate.")}">
            </div>
            <div class="form-group">
              <label class="form-label">Language</label>
              <input type="text" class="form-input" id="tts-language" value="${this._escapeHtml(ttsSettings.language || "en")}" placeholder="en">
            </div>
            <h4>Message templates (variables: {prefix}, {room_name}, {device_name}, {device_type}, {mode}, {temp}, {fan_mode})</h4>
            ${ttsEventKeys.map((key) => {
              const entry = ttsMessages[key] || { enabled: true, template: "" };
              return `
              <div class="tts-event-row" data-tts-key="${key}">
                <label class="form-label" style="min-width:120px;">${labels[key] || key}</label>
                <input type="text" class="form-input" data-field="template" value="${this._escapeHtml(entry.template || "")}" placeholder="e.g. {prefix} {room_name} {device_name} turned on">
                <label class="form-label" style="margin:0;">Enable</label>
                <input type="checkbox" class="tts-toggle" data-field="enabled" ${entry.enabled !== false ? "checked" : ""}>
              </div>`;
            }).join("")}
          </div>
        </div>

        <div style="margin-top: 20px;">
          <button class="btn-save" data-action="save-settings">Save All</button>
          <button class="ctrl-btn" style="margin-left: 12px;" data-action="close-settings">Close</button>
        </div>
      </div>
    `;
  }

  _renderRoomRow(room, index, entities) {
    const roomId = room.id || crypto.randomUUID();
    const mediaOpts = (entities.media_players || []).map(m => `<option value="${m.entity_id}" ${room.media_player === m.entity_id ? "selected" : ""}>${this._escapeHtml(m.friendly_name || m.entity_id)}</option>`).join("");
    const deviceTypes = [
      { value: "heater", label: "Heater" },
      { value: "ac", label: "AC" },
      { value: "minisplit", label: "Minisplit" },
      { value: "dehumidifier", label: "Dehumidifier" },
    ];
    const appliances = room.appliances || [];

    const roomKey = `room-${index}`;
    const isCollapsed = this._collapsedRooms.has(roomKey);
    return `
      <div class="room-row ${isCollapsed ? "collapsed" : ""}" data-room-index="${index}" data-room-id="${this._escapeHtml(roomId)}" data-collapse-key="${roomKey}">
        <div class="room-row-header" data-action="toggle-room" data-key="${roomKey}">
          <span>${this._escapeHtml(room.name || "Unnamed room")}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="btn-delete" data-action="delete-room" data-room-index="${index}" data-room-name="${this._escapeHtml(room.name || "room")}">Delete</button>
            <svg class="chevron" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
          </div>
        </div>
        <div class="room-row-content">
        <div class="form-group">
          <label class="form-label">Room name</label>
          <input type="text" class="form-input" data-field="name" value="${this._escapeHtml(room.name || "")}" placeholder="e.g. Bedroom">
        </div>
        <div class="form-group">
          <label class="form-label">Temp sensor</label>
          ${this._renderEntityAutocomplete(room.temp_sensor || "", "sensor", "temp_sensor", "e.g. sensor.temperature")}
        </div>
        <div class="form-group">
          <label class="form-label">Humidity sensor</label>
          ${this._renderEntityAutocomplete(room.humidity_sensor || "", "sensor", "humidity_sensor", "e.g. sensor.humidity")}
        </div>
        <div class="form-group">
          <label class="form-label">Media player (for TTS)</label>
          <select class="form-select" data-field="media_player">
            <option value="">— None —</option>${mediaOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Volume (0-1)</label>
          <input type="number" class="form-input" data-field="volume" value="${room.volume ?? 0.7}" step="0.1" min="0" max="1">
        </div>
        <h4>HVAC Appliances</h4>
        <button class="btn-add" data-action="add-appliance" data-room-index="${index}">+ Add appliance</button>
        <div class="appliances-list">
          ${appliances.map((app, ai) => this._renderApplianceCard(room, app, ai, index, entities)).join("")}
        </div>
        </div>
      </div>
    `;
  }

  _renderApplianceCard(room, app, appIndex, roomIndex, entities) {
    const deviceTypes = [
      { value: "heater", label: "Heater" },
      { value: "ac", label: "AC" },
      { value: "minisplit", label: "Minisplit" },
      { value: "dehumidifier", label: "Dehumidifier" },
    ];
    const auto = app.automation || {};
    const appKey = `app-${roomIndex}-${appIndex}`;
    const isAppCollapsed = this._collapsedAppliances.has(appKey);
    const appLabel = (app.custom_name || "").trim() || (app.device_type ? String(app.device_type).charAt(0).toUpperCase() + String(app.device_type).slice(1) : "Appliance");

    return `
      <div class="appliance-card ${isAppCollapsed ? "collapsed" : ""}" data-room-index="${roomIndex}" data-app-index="${appIndex}" data-collapse-key="${appKey}">
        <div class="appliance-card-header" data-action="toggle-appliance" data-key="${appKey}">
          <span>${this._escapeHtml(appLabel)}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <button class="btn-delete" data-action="delete-appliance" data-room-index="${roomIndex}" data-app-index="${appIndex}" data-app-name="${this._escapeHtml(appLabel)}">Delete</button>
            <svg class="chevron" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
          </div>
        </div>
        <div class="appliance-card-content">
        <div class="form-group">
          <label class="form-label">Device type</label>
          <select class="form-select" data-field="device_type">
            ${deviceTypes.map(d => `<option value="${d.value}" ${app.device_type === d.value ? "selected" : ""}>${d.label}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Custom name (optional)</label>
          <input type="text" class="form-input" data-field="custom_name" value="${this._escapeHtml(app.custom_name || "")}" placeholder="e.g. Samsung Minisplit">
        </div>
        <div class="form-group">
          <label class="form-label">Climate entity</label>
          ${this._renderEntityAutocomplete(app.climate_entity || "", "climate", "climate_entity", "e.g. climate.minisplit")}
        </div>
        <h4 style="margin-top:12px;">Automation (enter/leave zone)</h4>
        <div class="form-group">
          <label class="form-label">Person</label>
          ${this._renderEntityAutocomplete(auto.person || "", "person", "person", "e.g. person.brandon")}
        </div>
        <div class="form-group">
          <label class="form-label">Zone</label>
          ${this._renderEntityAutocomplete(auto.zone || "", "zone", "zone", "e.g. zone.home")}
        </div>
        <div class="form-group">
          <label class="form-label">Enter duration (sec)</label>
          <input type="number" class="form-input" data-field="enter_duration_sec" value="${auto.enter_duration_sec ?? 30}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Exit duration (sec)</label>
          <input type="number" class="form-input" data-field="exit_duration_sec" value="${auto.exit_duration_sec ?? 300}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Target temp on enter (°C)</label>
          <input type="number" class="form-input" data-field="target_temp_on_enter" value="${auto.target_temp_on_enter ?? 22}" step="0.5">
        </div>
        <h4 style="margin-top:12px;">Thresholds</h4>
        <div class="form-group">
          <label class="form-label">Heat below (°C)</label>
          <input type="number" class="form-input" data-field="heat_threshold_c" value="${auto.heat_threshold_c ?? 18}" step="0.5">
        </div>
        <div class="form-group">
          <label class="form-label">Cool above (°C)</label>
          <input type="number" class="form-input" data-field="cool_threshold_c" value="${auto.cool_threshold_c ?? 26}" step="0.5">
        </div>
        <div class="form-group">
          <label class="form-label">Seasonal mode</label>
          <select class="form-select" data-field="seasonal_mode">
            <option value="outdoor_temp" ${auto.seasonal_mode === "outdoor_temp" ? "selected" : ""}>Outdoor temperature</option>
            <option value="date" ${auto.seasonal_mode === "date" ? "selected" : ""}>Date-based</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Outdoor temp sensor</label>
          ${this._renderEntityAutocomplete(auto.outdoor_temp_sensor || "", "sensor_temp", "outdoor_temp_sensor", "e.g. sensor.outdoor_temp")}
        </div>
        <div class="form-group">
          <label class="form-label">Winter start (MM-DD)</label>
          <input type="text" class="form-input" data-field="date_winter_start" value="${auto.date_winter_start || "11-01"}">
        </div>
        <div class="form-group">
          <label class="form-label">Winter end (MM-DD)</label>
          <input type="text" class="form-input" data-field="date_winter_end" value="${auto.date_winter_end || "03-31"}">
        </div>
        </div>
      </div>
    `;
  }

  async _saveSettings() {
    if (!this._hass) return;
    const root = this.shadowRoot;
    const config = { ...this._config };

    const roomRows = root.querySelectorAll(".room-row");
    config.rooms = [];
    for (let i = 0; i < roomRows.length; i++) {
      const row = roomRows[i];
      const name = row.querySelector("[data-field='name']")?.value?.trim();
      if (!name) continue;
      const roomId = row.dataset.roomId || crypto.randomUUID();
      const tempEl = row.querySelector("[data-field='temp_sensor']");
      const humidityEl = row.querySelector("[data-field='humidity_sensor']");
      const mediaEl = row.querySelector("[data-field='media_player']");
      const volumeEl = row.querySelector("[data-field='volume']");

      const appliances = [];
      const acards = root.querySelectorAll(`.appliance-card[data-room-index="${i}"]`);
      acards.forEach((acard) => {
        const climateEl = acard.querySelector("[data-field='climate_entity']");
        const deviceTypeEl = acard.querySelector("[data-field='device_type']");
        const customNameEl = acard.querySelector("[data-field='custom_name']");
        const personEl = acard.querySelector("[data-field='person']");
        const zoneEl = acard.querySelector("[data-field='zone']");
        const enterEl = acard.querySelector("[data-field='enter_duration_sec']");
        const exitEl = acard.querySelector("[data-field='exit_duration_sec']");
        const targetTempEl = acard.querySelector("[data-field='target_temp_on_enter']");
        const heatEl = acard.querySelector("[data-field='heat_threshold_c']");
        const coolEl = acard.querySelector("[data-field='cool_threshold_c']");
        const seasonalEl = acard.querySelector("[data-field='seasonal_mode']");
        const outdoorEl = acard.querySelector("[data-field='outdoor_temp_sensor']");
        const winterStartEl = acard.querySelector("[data-field='date_winter_start']");
        const winterEndEl = acard.querySelector("[data-field='date_winter_end']");

        const existingRoom = this._config?.rooms?.[i];
        const existingApps = existingRoom?.appliances || [];
        const existingApp = existingApps[appliances.length];

        appliances.push({
          id: existingApp?.id || crypto.randomUUID(),
          device_type: deviceTypeEl?.value || "minisplit",
          custom_name: (customNameEl?.value || "").trim(),
          climate_entity: (climateEl?.value || "").trim() || null,
          automation: {
            person: (personEl?.value || "").trim(),
            zone: (zoneEl?.value || "").trim(),
            enter_duration_sec: parseInt(enterEl?.value, 10) || 30,
            exit_duration_sec: parseInt(exitEl?.value, 10) || 300,
            target_temp_on_enter: parseFloat(targetTempEl?.value) || 22,
            heat_threshold_c: parseFloat(heatEl?.value) || 18,
            cool_threshold_c: parseFloat(coolEl?.value) || 26,
            seasonal_mode: seasonalEl?.value || "outdoor_temp",
            outdoor_temp_sensor: (outdoorEl?.value || "").trim(),
            date_winter_start: (winterStartEl?.value || "11-01").trim(),
            date_winter_end: (winterEndEl?.value || "03-31").trim(),
          },
        });
      });

      config.rooms.push({
        id: roomId,
        name,
        temp_sensor: (tempEl?.value || "").trim() || null,
        humidity_sensor: (humidityEl?.value || "").trim() || null,
        media_player: (mediaEl?.value || "").trim() || "",
        volume: parseFloat(volumeEl?.value) || 0.7,
        tts_overrides: {},
        appliances,
      });
    }

    const ttsPrefixEl = root.querySelector("#tts-prefix");
    const ttsLangEl = root.querySelector("#tts-language");
    config.tts_settings = {
      ...config.tts_settings,
      prefix: ttsPrefixEl?.value || "Message from Home Climate.",
      language: (ttsLangEl?.value || "en").trim(),
      messages: {},
    };

    const ttsEventKeys = ["manual_on", "manual_off", "mode_change", "temp_change", "presence_enter", "presence_leave", "fan_change"];
    ttsEventKeys.forEach((key) => {
      const row = root.querySelector(`[data-tts-key="${key}"]`);
      const templateEl = row?.querySelector("[data-field='template']");
      const enabledEl = row?.querySelector("[data-field='enabled']");
      config.tts_settings.messages[key] = {
        template: (templateEl?.value || "").trim(),
        enabled: enabledEl?.checked !== false,
      };
    });

    try {
      await this._hass.callWS({ type: "home_climate/save_config", config });
      this._config = config;
      this._showSettings = false;
      await this._loadDashboardData();
      this._render();
    } catch (e) {
      console.error("Save settings error:", e);
    }
  }

  _escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = String(s);
    return div.innerHTML;
  }
}

customElements.define("home-climate-panel", HomeWeatherPanel);
