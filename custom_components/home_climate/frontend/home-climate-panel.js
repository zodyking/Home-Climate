/**
 * Home Climate Panel - Della Air-inspired climate dashboard
 * Deep blue palette, glass cards, icons, full state display
 */

const STYLES = `
  :host {
    display: block;
    height: 100%;
    background: linear-gradient(165deg, #060d18 0%, #0a1628 35%, #0e2942 70%, #132f4c 100%);
    color: #e8eef3;
    font-family: 'Inter', 'Roboto', 'Segoe UI', -apple-system, sans-serif;
    --accent: #5b8def;
    --accent-hover: #7aa3f5;
    --accent-dim: rgba(91, 141, 239, 0.18);
    --card-bg: rgba(13, 30, 55, 0.65);
    --card-border: rgba(255, 255, 255, 0.06);
    --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
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
    background: rgba(6, 13, 24, 0.85);
    border-bottom: 1px solid var(--card-border);
    backdrop-filter: blur(16px);
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
  .room-card {
    background: var(--card-bg);
    border-radius: clamp(14px, 3vw, 18px);
    border: 1px solid var(--card-border);
    padding: clamp(18px, 3.5vw, 24px);
    backdrop-filter: blur(12px);
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
  .room-stats {
    display: flex;
    gap: clamp(20px, 4vw, 28px);
    margin-bottom: clamp(12px, 2vw, 16px);
  }
  .room-stat {
    display: flex;
    align-items: center;
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
    gap: 8px;
    margin-bottom: clamp(12px, 2vw, 16px);
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
    flex-wrap: wrap;
    gap: 10px;
    margin-top: clamp(10px, 2vw, 14px);
  }
  .ctrl-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 10px;
    border: 1px solid var(--card-border);
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    font-size: clamp(12px, 2vw, 13px);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ctrl-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .ctrl-btn.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .ctrl-icon {
    width: 18px;
    height: 18px;
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
    this._refreshInterval = setInterval(() => this._loadDashboardData(), 15000);
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
      this._dashboardData = res;
      if (!this._loading) this._render();
    } catch (e) {
      console.error("Home Climate dashboard data error:", e);
    }
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
        this._config.rooms.push({ id: crypto.randomUUID(), name: "", climate_entity: "", temp_sensor: "", humidity_sensor: "" });
        this._render();
      });
    }

    const addPresenceRuleBtn = root.querySelector("[data-action='add-presence-rule']");
    if (addPresenceRuleBtn) {
      addPresenceRuleBtn.addEventListener("click", () => {
        this._config = this._config || {};
        this._config.presence_rules = this._config.presence_rules || [];
        this._config.presence_rules.push({ person: "", zone: "", climate_entity: "", enter_duration_sec: 30, exit_duration_sec: 300 });
        this._render();
      });
    }

    this._bindRoomControls(root);
  }

  _renderDashboard() {
    const rooms = this._dashboardData?.rooms || this._config?.rooms || [];
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
        ${rooms.map((r) => this._renderRoomCard(r)).join("")}
      </div>
    `;
  }

  _hvacActionLabel(action) {
    const labels = { heating: "Heating", cooling: "Cooling", idle: "Idle", off: "Off" };
    return labels[action] || (action || "—");
  }

  _renderRoomCard(room) {
    const temp = room.temp != null ? room.temp.toFixed(1) : "—";
    const humidity = room.humidity != null ? room.humidity.toFixed(0) : "—";
    const targetTemp = room.target_temp != null ? room.target_temp.toFixed(0) : null;
    const mode = room.climate_mode || "off";
    const hvacAction = room.hvac_action || null;
    const fanMode = room.fan_mode || null;
    const hasClimate = !!room.climate_entity;
    const roomName = room.name || "Room";

    const tempIcon = `<svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2v-6z"/></svg>`;
    const humidityIcon = `<svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    const heatIcon = `<svg class="ctrl-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 1.67c.74 0 1.33.6 1.33 1.33 0 .67-.47 1.2-1.1 1.32L12 4.5 9.6 4.08c-.63-.12-1.1-.65-1.1-1.32 0-.73.59-1.33 1.33-1.33H13.5zM6 22.67c0 .73.59 1.33 1.33 1.33h9.34c.74 0 1.33-.6 1.33-1.33V12h-12v10.67zM14 14v6.67h-4V14h4z"/></svg>`;
    const coolIcon = `<svg class="ctrl-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M22 11h-4.17l3.24-3.24-1.41-1.41L16 9.34V5h-2v4.34l-3.83-3.83-1.41 1.41L10.17 11H6v2h4.17l-3.24 3.24 1.41 1.41L14 14.66V19h2v-4.34l3.83 3.83 1.41-1.41L17.83 13H22z"/></svg>`;
    const offIcon = `<svg class="ctrl-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M18 14.49V9c0-1.1-.9-2-2-2h-3.15l-1.6-1.6L10 7h4v2H6v2h8v2H6v2h8v2H6v2h10c1.1 0 2-.9 2-2v-5.51l2 2z"/></svg>`;
    const onIcon = `<svg class="ctrl-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;

    return `
      <div class="room-card" data-room-id="${this._escapeHtml(room.id || "")}">
        <h3 class="room-name">${this._escapeHtml(roomName)}</h3>
        <div class="room-stats">
          <div class="room-stat">
            ${tempIcon}
            <div class="room-stat-inner">
              <span class="room-stat-value">${temp}</span>
              <span class="room-stat-unit">°C</span>
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
        <div class="room-state-row">
          ${targetTemp != null ? `<span class="state-badge">Target: ${targetTemp} °C</span>` : ""}
          ${hvacAction ? `<span class="state-badge state-action">${this._hvacActionLabel(hvacAction)}</span>` : ""}
          ${fanMode ? `<span class="state-badge state-fan">Fan: ${this._escapeHtml(fanMode)}</span>` : ""}
        </div>
        ${hasClimate ? `
          <div class="room-controls">
            <button class="ctrl-btn ${mode !== "off" ? "active" : ""}" data-action="on" data-entity="${this._escapeHtml(room.climate_entity)}" data-room-name="${this._escapeHtml(roomName)}">${onIcon}<span>ON</span></button>
            <button class="ctrl-btn ${mode === "heat" ? "active" : ""}" data-action="heat" data-entity="${this._escapeHtml(room.climate_entity)}" data-room-name="${this._escapeHtml(roomName)}">${heatIcon}<span>HEAT</span></button>
            <button class="ctrl-btn ${mode === "cool" ? "active" : ""}" data-action="cool" data-entity="${this._escapeHtml(room.climate_entity)}" data-room-name="${this._escapeHtml(roomName)}">${coolIcon}<span>COOL</span></button>
            <button class="ctrl-btn ${mode === "off" ? "active" : ""}" data-action="off" data-entity="${this._escapeHtml(room.climate_entity)}" data-room-name="${this._escapeHtml(roomName)}">${offIcon}<span>OFF</span></button>
          </div>
        ` : ""}
      </div>
    `;
  }

  _bindRoomControls(root) {
    root.querySelectorAll(".ctrl-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const action = e.currentTarget.dataset.action;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        if (!entity) return;
        if (action === "off") {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else if (action === "on") {
          this._setClimateAndAnnounce(entity, "turn_on", "on", roomName);
        } else if (action === "heat" || action === "cool") {
          this._setClimateAndAnnounce(entity, "set_hvac_mode", action, roomName);
        }
      });
    });
  }

  _renderSettings() {
    const rooms = this._config?.rooms || [];
    const automation = this._config?.automation || {};
    const presenceRules = this._config?.presence_rules || [];
    const ttsSettings = this._config?.tts_settings || {};
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
      .form-group { margin-bottom: 14px; }
      .form-label { display: block; font-size: 12px; margin-bottom: 4px; opacity: 0.9; }
      .form-input, .form-select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--card-border); background: rgba(0,0,0,0.2); color: inherit; font-size: 13px; }
      .form-select { cursor: pointer; }
      .btn-save { margin-top: 16px; padding: 10px 20px; background: var(--accent); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
      .btn-save:hover { background: var(--accent-hover); }
      .btn-add { padding: 8px 14px; background: rgba(124,58,237,0.2); color: var(--accent); border: 1px solid var(--accent); border-radius: 8px; cursor: pointer; font-size: 12px; margin-bottom: 12px; }
      .btn-add:hover { background: var(--accent-dim); }
      .rule-row, .room-row { padding: 12px; background: rgba(0,0,0,0.15); border-radius: 8px; margin-bottom: 10px; }
    `;

    return `
      <style>${settingsStyles}</style>
      <div class="settings-view">
        <div class="settings-tabs">
          <button class="settings-tab ${this._settingsTab === "rooms" ? "active" : ""}" data-tab="rooms">Rooms</button>
          <button class="settings-tab ${this._settingsTab === "automation" ? "active" : ""}" data-tab="automation">Automation</button>
          <button class="settings-tab ${this._settingsTab === "presence" ? "active" : ""}" data-tab="presence">Presence</button>
          <button class="settings-tab ${this._settingsTab === "tts" ? "active" : ""}" data-tab="tts">TTS</button>
        </div>

        <div class="settings-tab-content ${this._settingsTab === "rooms" ? "active" : ""}" id="tab-rooms">
          <div class="settings-card">
            <h3>Rooms</h3>
            <button class="btn-add" data-action="add-room">+ Add Room</button>
            <div id="rooms-list">
              ${rooms.length === 0 ? "<p style='opacity:0.7;'>No rooms. Add a room to map climate entities.</p>" : ""}
              ${rooms.map((r, i) => this._renderRoomRow(r, i, entities)).join("")}
            </div>
          </div>
        </div>

        <div class="settings-tab-content ${this._settingsTab === "automation" ? "active" : ""}" id="tab-automation">
          <div class="settings-card">
            <h3>Thresholds & Seasonal Logic</h3>
            <div class="form-group">
              <label class="form-label">Heat below (°C)</label>
              <input type="number" class="form-input" id="heat-threshold" value="${automation.heat_threshold_c ?? 18}" step="0.5" min="5" max="35">
            </div>
            <div class="form-group">
              <label class="form-label">Cool above (°C)</label>
              <input type="number" class="form-input" id="cool-threshold" value="${automation.cool_threshold_c ?? 26}" step="0.5" min="15" max="40">
            </div>
            <div class="form-group">
              <label class="form-label">Seasonal mode</label>
              <select class="form-select" id="seasonal-mode">
                <option value="outdoor_temp" ${automation.seasonal_mode === "outdoor_temp" ? "selected" : ""}>Outdoor temperature</option>
                <option value="date" ${automation.seasonal_mode === "date" ? "selected" : ""}>Date-based</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Outdoor temp sensor</label>
              <select class="form-select" id="outdoor-sensor">
                <option value="">— None —</option>
                ${(entities.sensors || []).filter(s => (s.unit || "").includes("°") || (s.unit || "").toLowerCase().includes("c")).map(s => `<option value="${s.entity_id}" ${automation.outdoor_temp_sensor === s.entity_id ? "selected" : ""}>${this._escapeHtml(s.friendly_name || s.entity_id)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Winter start (MM-DD)</label>
              <input type="text" class="form-input" id="winter-start" value="${automation.date_winter_start || "11-01"}" placeholder="11-01">
            </div>
            <div class="form-group">
              <label class="form-label">Winter end (MM-DD)</label>
              <input type="text" class="form-input" id="winter-end" value="${automation.date_winter_end || "03-31"}" placeholder="03-31">
            </div>
          </div>
        </div>

        <div class="settings-tab-content ${this._settingsTab === "presence" ? "active" : ""}" id="tab-presence">
          <div class="settings-card">
            <h3>Presence Rules (turn on when entering, off when exiting)</h3>
            <button class="btn-add" data-action="add-presence-rule">+ Add Rule</button>
            <div id="presence-rules-list">
              ${presenceRules.map((r, i) => this._renderPresenceRuleRow(r, i, entities)).join("")}
            </div>
          </div>
        </div>

        <div class="settings-tab-content ${this._settingsTab === "tts" ? "active" : ""}" id="tab-tts">
          <div class="settings-card">
            <h3>TTS Settings</h3>
            <div class="form-group">
              <label class="form-label">Media player</label>
              <select class="form-select" id="tts-media-player">
                <option value="">— None —</option>
                ${(entities.media_players || []).map(m => `<option value="${m.entity_id}" ${ttsSettings.media_player === m.entity_id ? "selected" : ""}>${this._escapeHtml(m.friendly_name || m.entity_id)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prefix</label>
              <input type="text" class="form-input" id="tts-prefix" value="${this._escapeHtml(ttsSettings.prefix || "Message from Home Climate.")}">
            </div>
            <div class="form-group">
              <label class="form-label">Volume (0-1)</label>
              <input type="number" class="form-input" id="tts-volume" value="${ttsSettings.volume ?? 0.7}" step="0.1" min="0" max="1">
            </div>
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
    const climateOpts = (entities.climate || []).map(c => `<option value="${c.entity_id}" ${room.climate_entity === c.entity_id ? "selected" : ""}>${this._escapeHtml(c.friendly_name || c.entity_id)}</option>`).join("");
    const tempSensorOpts = (entities.sensors || []).map(s => `<option value="${s.entity_id}" ${room.temp_sensor === s.entity_id ? "selected" : ""}>${this._escapeHtml(s.friendly_name || s.entity_id)}</option>`).join("");
    const humiditySensorOpts = (entities.sensors || []).map(s => `<option value="${s.entity_id}" ${room.humidity_sensor === s.entity_id ? "selected" : ""}>${this._escapeHtml(s.friendly_name || s.entity_id)}</option>`).join("");
    return `
      <div class="room-row" data-room-index="${index}" data-room-id="${this._escapeHtml(roomId)}">
        <div class="form-group">
          <label class="form-label">Room name</label>
          <input type="text" class="form-input" data-field="name" value="${this._escapeHtml(room.name || "")}" placeholder="e.g. Bedroom">
        </div>
        <div class="form-group">
          <label class="form-label">Climate entity</label>
          <select class="form-select" data-field="climate_entity">
            <option value="">— None —</option>${climateOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Temp sensor</label>
          <select class="form-select" data-field="temp_sensor">
            <option value="">— None —</option>${tempSensorOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Humidity sensor</label>
          <select class="form-select" data-field="humidity_sensor">
            <option value="">— None —</option>${humiditySensorOpts}
          </select>
        </div>
      </div>
    `;
  }

  _renderPresenceRuleRow(rule, index, entities) {
    const personOpts = (entities.persons || []).map(p => `<option value="${p.entity_id}" ${rule.person === p.entity_id ? "selected" : ""}>${this._escapeHtml(p.friendly_name || p.entity_id)}</option>`).join("");
    const zoneOpts = (entities.zones || []).map(z => `<option value="${z.entity_id}" ${rule.zone === z.entity_id ? "selected" : ""}>${this._escapeHtml(z.friendly_name || z.entity_id)}</option>`).join("");
    const climateOpts = (entities.climate || []).map(c => `<option value="${c.entity_id}" ${rule.climate_entity === c.entity_id ? "selected" : ""}>${this._escapeHtml(c.friendly_name || c.entity_id)}</option>`).join("");
    return `
      <div class="rule-row" data-rule-index="${index}">
        <div class="form-group">
          <label class="form-label">Person</label>
          <select class="form-select" data-field="person"><option value="">— Select —</option>${personOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Zone</label>
          <select class="form-select" data-field="zone"><option value="">— Select —</option>${zoneOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Climate entity</label>
          <select class="form-select" data-field="climate_entity"><option value="">— Select —</option>${climateOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Enter duration (sec)</label>
          <input type="number" class="form-input" data-field="enter_duration_sec" value="${rule.enter_duration_sec ?? 30}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Exit duration (sec)</label>
          <input type="number" class="form-input" data-field="exit_duration_sec" value="${rule.exit_duration_sec ?? 300}" min="0">
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
    roomRows.forEach((row) => {
      const name = row.querySelector("[data-field='name']")?.value?.trim();
      if (!name) return;
      const roomId = row.dataset.roomId || crypto.randomUUID();
      const climateEl = row.querySelector("[data-field='climate_entity']");
      const tempEl = row.querySelector("[data-field='temp_sensor']");
      const humidityEl = row.querySelector("[data-field='humidity_sensor']");
      config.rooms.push({
        id: roomId,
        name,
        climate_entity: climateEl?.value || null,
        temp_sensor: tempEl?.value || null,
        humidity_sensor: humidityEl?.value || null,
      });
    });

    const heatEl = root.querySelector("#heat-threshold");
    const coolEl = root.querySelector("#cool-threshold");
    const seasonalEl = root.querySelector("#seasonal-mode");
    const outdoorEl = root.querySelector("#outdoor-sensor");
    const winterStartEl = root.querySelector("#winter-start");
    const winterEndEl = root.querySelector("#winter-end");
    config.automation = {
      ...config.automation,
      heat_threshold_c: parseFloat(heatEl?.value) || 18,
      cool_threshold_c: parseFloat(coolEl?.value) || 26,
      seasonal_mode: seasonalEl?.value || "outdoor_temp",
      outdoor_temp_sensor: outdoorEl?.value || "",
      date_winter_start: winterStartEl?.value || "11-01",
      date_winter_end: winterEndEl?.value || "03-31",
    };

    const ruleRows = root.querySelectorAll(".rule-row");
    config.presence_rules = [];
    ruleRows.forEach((row) => {
      const person = row.querySelector("[data-field='person']")?.value;
      const zone = row.querySelector("[data-field='zone']")?.value;
      const climateEntity = row.querySelector("[data-field='climate_entity']")?.value;
      const enterDur = row.querySelector("[data-field='enter_duration_sec']")?.value;
      const exitDur = row.querySelector("[data-field='exit_duration_sec']")?.value;
      if (!person || !zone || !climateEntity) return;
      config.presence_rules.push({
        person,
        zone,
        climate_entity: climateEntity,
        enter_duration_sec: parseInt(enterDur, 10) || 30,
        exit_duration_sec: parseInt(exitDur, 10) || 300,
      });
    });

    const ttsMediaEl = root.querySelector("#tts-media-player");
    const ttsPrefixEl = root.querySelector("#tts-prefix");
    const ttsVolumeEl = root.querySelector("#tts-volume");
    config.tts_settings = {
      ...config.tts_settings,
      media_player: ttsMediaEl?.value || "",
      prefix: ttsPrefixEl?.value || "Message from Home Climate.",
      volume: parseFloat(ttsVolumeEl?.value) || 0.7,
    };

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
