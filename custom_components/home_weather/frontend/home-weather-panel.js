/**
 * Home Climate Panel - Climate monitoring and automation dashboard
 * Dark blue theme, clamp-responsive, admin-only settings
 */

const STYLES = `
  :host {
    display: block;
    height: 100%;
    background: linear-gradient(180deg, #0d1b2a 0%, #1b263b 100%);
    color: #e1e8ed;
    font-family: 'Roboto', 'Segoe UI', -apple-system, sans-serif;
    --accent: #7c3aed;
    --accent-hover: #8b5cf6;
    --accent-dim: rgba(124, 58, 237, 0.2);
    --card-bg: rgba(27, 38, 59, 0.85);
    --card-border: rgba(255, 255, 255, 0.08);
  }
  * { box-sizing: border-box; }
  .panel-container {
    min-height: 100vh;
    padding: clamp(8px, 2vw, 20px);
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px);
    background: rgba(13, 27, 42, 0.9);
    border-bottom: 1px solid var(--card-border);
    backdrop-filter: blur(12px);
    margin: calc(-1 * clamp(8px, 2vw, 20px)) calc(-1 * clamp(8px, 2vw, 20px)) clamp(12px, 2vw, 20px);
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: clamp(8px, 2vw, 16px);
  }
  .panel-title {
    font-size: clamp(18px, 4vw, 24px);
    font-weight: 600;
    margin: 0;
    letter-spacing: 0.02em;
  }
  .header-datetime {
    text-align: right;
  }
  .header-time {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    display: block;
  }
  .header-date {
    font-size: clamp(11px, 2vw, 13px);
    opacity: 0.85;
  }
  .settings-btn {
    width: 40px;
    height: 40px;
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
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: clamp(12px, 3vw, 20px);
  }
  .room-card {
    background: var(--card-bg);
    border-radius: clamp(12px, 3vw, 16px);
    border: 1px solid var(--card-border);
    padding: clamp(14px, 3vw, 20px);
    transition: box-shadow 0.2s;
  }
  .room-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  .room-name {
    font-size: clamp(14px, 2.5vw, 16px);
    font-weight: 600;
    margin: 0 0 clamp(12px, 2vw, 16px);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .room-stats {
    display: flex;
    gap: clamp(16px, 4vw, 24px);
    margin-bottom: clamp(12px, 2vw, 16px);
  }
  .room-stat {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .room-stat-value {
    font-size: clamp(18px, 4vw, 24px);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .room-stat-unit {
    font-size: clamp(11px, 2vw, 12px);
    opacity: 0.8;
  }
  .room-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: clamp(8px, 2vw, 12px);
  }
  .ctrl-btn {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid var(--card-border);
    background: transparent;
    color: inherit;
    font-size: clamp(11px, 2vw, 12px);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ctrl-btn:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  .ctrl-btn.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .loading, .error {
    padding: 40px;
    text-align: center;
    font-size: clamp(14px, 2.5vw, 16px);
  }
  .error { color: #f87171; }
  .empty-state {
    text-align: center;
    padding: clamp(40px, 10vw, 80px) 20px;
    color: rgba(225, 232, 237, 0.6);
    font-size: clamp(14px, 2.5vw, 16px);
  }
  .house-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    opacity: 0.5;
  }
  .house-icon path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
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
        this._hass.callWS({ type: "home_weather/get_config" }),
        this._hass.callWS({ type: "home_weather/get_user_info" }).catch(() => ({ is_admin: false })),
        this._hass.callWS({ type: "home_weather/get_entities" }).catch(() => ({ climate: [], sensors: [], persons: [], zones: [], media_players: [] })),
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
      const res = await this._hass.callWS({ type: "home_weather/get_dashboard_data" });
      this._dashboardData = res;
      if (!this._loading) this._render();
    } catch (e) {
      console.error("Home Climate dashboard data error:", e);
    }
  }

  async _callClimateService(service, entityId, data = {}) {
    if (!this._hass || !entityId) return;
    try {
      await this._hass.callService("climate", service, {
        entity_id: entityId,
        ...data,
      });
      await this._loadDashboardData();
    } catch (e) {
      console.error("Climate service error:", e);
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

        ${this._loading ? '<div class="loading">Loading...</div>' : ""}
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
          <svg class="house-icon" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 8L8 28v28h18V38h12v18h18V28z"/>
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

  _renderRoomCard(room) {
    const temp = room.temp != null ? room.temp.toFixed(1) : "—";
    const humidity = room.humidity != null ? room.humidity.toFixed(0) : "—";
    const mode = room.climate_mode || "off";
    const hasClimate = !!room.climate_entity;

    return `
      <div class="room-card" data-room-id="${this._escapeHtml(room.id || "")}">
        <h3 class="room-name">${this._escapeHtml(room.name || "Room")}</h3>
        <div class="room-stats">
          <div class="room-stat">
            <span class="room-stat-value">${temp}</span>
            <span class="room-stat-unit">°C</span>
          </div>
          <div class="room-stat">
            <span class="room-stat-value">${humidity}</span>
            <span class="room-stat-unit">%</span>
          </div>
        </div>
        ${hasClimate ? `
          <div class="room-controls">
            <button class="ctrl-btn ${mode !== "off" ? "active" : ""}" data-action="on" data-entity="${this._escapeHtml(room.climate_entity)}">ON</button>
            <button class="ctrl-btn ${mode === "heat" ? "active" : ""}" data-action="heat" data-entity="${this._escapeHtml(room.climate_entity)}">HEAT</button>
            <button class="ctrl-btn ${mode === "cool" ? "active" : ""}" data-action="cool" data-entity="${this._escapeHtml(room.climate_entity)}">COOL</button>
            <button class="ctrl-btn ${mode === "off" ? "active" : ""}" data-action="off" data-entity="${this._escapeHtml(room.climate_entity)}">OFF</button>
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
        if (!entity) return;
        if (action === "off") {
          this._callClimateService("turn_off", entity);
        } else if (action === "on") {
          this._callClimateService("turn_on", entity);
        } else if (action === "heat" || action === "cool") {
          this._callClimateService("set_hvac_mode", entity, { hvac_mode: action });
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
      await this._hass.callWS({ type: "home_weather/save_config", config });
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

customElements.define("home-weather-panel", HomeWeatherPanel);
