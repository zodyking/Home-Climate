/**
 * Home Climate Panel - HUD-style climate dashboard
 * Dark theme, clip-path panels, Home Assistant-inspired accent
 */

const DISPLAY_UNIT = "°F";

const STYLES = `
  :host {
    display: block;
    height: 100%;
    min-width: 0;
    --bg: #0f1116;
    --bg-2: #1c1f26;
    --panel: #11151c;
    --panel-2: #161b22;
    --panel-3: #1b212b;
    --line: #263240;
    --line-2: #33465b;
    --ha-blue: #03a9f4;
    --ha-blue-2: #0288d1;
    --ha-blue-soft: #81d4fa;
    --text: #eef6fb;
    --muted: #8fa2b5;
    --good: #4dd0a6;
    --warn: #ffb74d;
    --danger: #ff6e6e;
    --shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
    --cut: polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px));
    --cut-sm: polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px));
    --card-border: var(--line);
    --accent-dim: rgba(3,169,244,0.2);
    --card-bg: var(--panel);
    --accent: var(--ha-blue);
    --accent-hover: var(--ha-blue-2);
    background: var(--bg);
    color: var(--text);
    font-family: Inter, Arial, 'Segoe UI', -apple-system, sans-serif;
  }
  * { box-sizing: border-box; }
  .panel-container {
    min-height: 100vh;
    padding: 20px;
    overflow-x: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .panel-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .panel-container::before {
    content: "";
    position: fixed;
    inset: 0;
    background: linear-gradient(rgba(3,169,244,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(3,169,244,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
    opacity: 0.28;
    pointer-events: none;
    mask-image: radial-gradient(circle at center, black 46%, transparent 100%);
  }
  .panel-container::after {
    content: "";
    position: fixed;
    inset: 0;
    border: 1px solid rgba(3,169,244,0.12);
    margin: 12px;
    pointer-events: none;
  }
  .corner { position: absolute; width: 42px; height: 42px; pointer-events: none; border-color: var(--ha-blue-soft); opacity: 0.95; }
  .corner.tl { top: 12px; left: 12px; border-top: 2px solid; border-left: 2px solid; }
  .corner.tr { top: 12px; right: 12px; border-top: 2px solid; border-right: 2px solid; }
  .corner.bl { bottom: 12px; left: 12px; border-bottom: 2px solid; border-left: 2px solid; }
  .corner.br { bottom: 12px; right: 12px; border-bottom: 2px solid; border-right: 2px solid; }
  .topbar {
    position: relative;
    height: 78px;
    display: grid;
    grid-template-columns: 74px 1fr 64px;
    gap: 14px;
    align-items: stretch;
    margin-bottom: 14px;
  }
  .icon-panel, .title-panel { background: var(--panel); border: 1px solid var(--line); clip-path: var(--cut); box-shadow: var(--shadow); position: relative; overflow: hidden; }
  .icon-panel::before, .title-panel::before { content: ""; position: absolute; left: 18px; right: 18px; top: 0; height: 2px; background: rgba(3,169,244,0.75); opacity: 0.7; }
  .icon-panel { display: grid; place-items: center; cursor: pointer; background: var(--panel-2); transition: 0.18s ease; }
  .icon-panel:hover { border-color: var(--line-2); box-shadow: 0 0 0 1px rgba(3,169,244,0.1), 0 0 18px rgba(3,169,244,0.1); }
  .hamburger { width: 22px; height: 18px; position: relative; }
  .hamburger span { position: absolute; left: 0; width: 100%; height: 2px; background: var(--ha-blue-soft); }
  .hamburger span:nth-child(1) { top: 0; }
  .hamburger span:nth-child(2) { top: 8px; }
  .hamburger span:nth-child(3) { top: 16px; width: 70%; }
  .gear { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--ha-blue-soft); position: relative; }
  .gear::before, .gear::after { content: ""; position: absolute; inset: -6px; border: 1px dashed rgba(129,212,250,0.35); border-radius: 50%; }
  .title-panel { display: flex; align-items: center; padding: 0 20px; justify-content: space-between; gap: 14px; min-width: 0; }
  .title-wrap { min-width: 0; }
  .eyebrow { color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.24em; margin-bottom: 6px; }
  .page-title { font-size: 36px; line-height: 1; font-weight: 900; letter-spacing: -0.06em; white-space: nowrap; }
  .page-sub { margin-top: 6px; color: var(--muted); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .title-badge { height: 32px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ha-blue-soft); border: 1px solid rgba(3,169,244,0.2); background: #12202a; clip-path: var(--cut-sm); white-space: nowrap; flex-shrink: 0; }
  .main {
    position: relative;
    display: grid;
    grid-template-columns: 1.55fr 0.95fr;
    grid-template-rows: 1fr 0.98fr;
    gap: 14px;
    min-height: 0;
    flex: 1;
  }
  .main .overview { grid-column: 1; grid-row: 1; }
  .main .zones { grid-column: 1; grid-row: 2; }
  .main .thermostat { grid-column: 2; grid-row: 1; }
  .main .systems { grid-column: 2; grid-row: 2; }
  .card { background: var(--panel); border: 1px solid var(--line); clip-path: var(--cut); box-shadow: var(--shadow); position: relative; overflow: hidden; }
  .card::before { content: ""; position: absolute; left: 18px; right: 18px; top: 0; height: 2px; background: rgba(3,169,244,0.75); opacity: 0.7; }
  .card-inner { position: relative; z-index: 1; height: 100%; padding: 16px 18px 18px; display: flex; flex-direction: column; min-height: 0; }
  .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .card-title { font-size: 15px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
  .card-sub { margin-top: 4px; font-size: 11px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; }
  .mini-badge { height: 32px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ha-blue-soft); border: 1px solid rgba(3,169,244,0.2); background: #12202a; clip-path: var(--cut-sm); white-space: nowrap; flex-shrink: 0; }
  .overview-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 14px; }
  .overview-left { display: flex; flex-direction: column; justify-content: space-between; min-height: 0; }
  .temp-wrap { display: flex; align-items: flex-start; gap: 10px; }
  .ambient-temp { font-size: clamp(86px, 8vw, 136px); line-height: 0.84; font-weight: 900; letter-spacing: -0.09em; color: var(--text); }
  .ambient-unit { margin-top: 14px; font-size: 28px; font-weight: 800; color: var(--ha-blue-soft); }
  .ambient-text { margin-top: 8px; color: var(--muted); font-size: 13px; max-width: 95%; line-height: 1.45; }
  .metric-grid { margin-top: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .metric { background: var(--panel-2); border: 1px solid var(--line); clip-path: var(--cut); padding: 12px 14px; min-height: 88px; }
  .metric .label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.14em; }
  .metric .value { margin-top: 8px; font-size: 28px; font-weight: 900; letter-spacing: -0.04em; white-space: nowrap; }
  .metric .sub { margin-top: 5px; font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .target-wrap { min-height: 0; display: flex; align-items: center; justify-content: center; position: relative; }
  .crosshair-h, .crosshair-v { position: absolute; pointer-events: none; opacity: 0.22; }
  .crosshair-h { left: 0; right: 0; top: 50%; height: 1px; background: var(--ha-blue-soft); }
  .crosshair-v { top: 0; bottom: 0; left: 50%; width: 1px; background: var(--ha-blue-soft); }
  .target-shell { width: min(100%, 360px); aspect-ratio: 1; position: relative; display: grid; place-items: center; }
  .target-shell::before { content: ""; position: absolute; inset: 4%; border: 1px solid rgba(3,169,244,0.16); border-radius: 50%; }
  .target-shell::after { content: ""; position: absolute; inset: 14%; border: 1px dashed rgba(129,212,250,0.2); border-radius: 50%; }
  .target-ring { width: 74%; aspect-ratio: 1; border-radius: 50%; border: 10px solid var(--ha-blue); background: var(--panel-2); display: grid; place-items: center; position: relative; }
  .target-ring::before { content: ""; position: absolute; inset: 14px; border-radius: 50%; border: 1px solid rgba(129,212,250,0.16); }
  .target-dot { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; border-radius: 50%; background: var(--ha-blue-soft); }
  .target-center { text-align: center; position: relative; z-index: 1; }
  .target-center .small { font-size: 10px; color: var(--muted); letter-spacing: 0.18em; text-transform: uppercase; }
  .target-center .setpoint { margin-top: 8px; font-size: clamp(48px, 4vw, 62px); font-weight: 900; letter-spacing: -0.06em; }
  .target-center .state { margin-top: 6px; font-size: 12px; color: var(--ha-blue-soft); letter-spacing: 0.14em; text-transform: uppercase; white-space: nowrap; }
  .settings-btn { width: 100%; height: 100%; border: none; background: transparent; color: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .settings-btn:hover { opacity: 0.9; }
  .settings-btn svg { width: 22px; height: 22px; fill: currentColor; }
  .dashboard-summary-row {
    display: flex;
    flex-wrap: nowrap;
    gap: clamp(16px, 3vw, 24px);
    margin-bottom: clamp(16px, 3vw, 24px);
  }
  .summary-card {
    flex: 1 1 0;
    min-width: 0;
    max-width: 50%;
    background: var(--card-bg);
    border-radius: clamp(12px, 2.5vw, 16px);
    border: 1px solid var(--card-border);
    padding: clamp(14px, 2.5vw, 20px);
    box-sizing: border-box;
  }
  .summary-card h4 { margin: 0 0 10px; font-size: 14px; font-weight: 600; opacity: 0.9; }
  .summary-card .room-stats { margin: 0; }
  .rooms-row { width: 100%; min-width: 0; overflow: hidden; }
  .rooms-scroll {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: clamp(16px, 3vw, 24px);
    min-width: 0;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
  }
  .rooms-scroll::-webkit-scrollbar { display: none; }
  .rooms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: clamp(16px, 3vw, 24px);
  }
  .room-card-parent {
    flex: 0 0 auto;
    min-width: 280px;
    width: 300px;
    display: flex;
    flex-direction: column;
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
    cursor: pointer;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .temp-wheel-svg {
    width: 100%;
    height: 100%;
    display: block;
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
    this._settingsTab = "global";
    this._entities = null;
    this._loading = true;
    this._error = null;
    this._refreshInterval = null;
    this._collapsedRooms = new Set();
    this._collapsedAppliances = new Set();
    this._collapseInitializedForSession = false;
    this._draggingWheelEntity = null;
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
  }

  disconnectedCallback() {
    this._stopRefresh();
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
        this._hass.callWS({ type: "home_climate/get_entities" }).catch(() => ({ climate: [], sensors: [], persons: [], zones: [], media_players: [], weather: [], notify: [], switch: [], mobile_app_devices: [] })),
      ]);
      this._config = configRes || {};
      this._isAdmin = userRes?.is_admin === true;
      this._entities = entitiesRes || { climate: [], sensors: [], persons: [], zones: [], media_players: [], weather: [], notify: [], switch: [], mobile_app_devices: [] };
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
        const dashboardEl = root?.querySelector(".main");
        const canPatch = dashboardEl && !this._showSettings && prevData?.rooms?.length > 0;

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
    if (!root.querySelector(".summary-card")) return false;

    const newRooms = newData.rooms || [];
    const prevRooms = prevData.rooms || [];

    // Patch summary cards (outdoor, indoor aggregate)
    const outdoor = newData.outdoor || { temp: null, humidity: null };
    const indoor = newData.indoor_aggregate || { temp: null, humidity: null };
    const summaryCards = root.querySelectorAll(".summary-card");
    if (summaryCards.length >= 2) {
      const outdoorTemp = outdoor.temp != null ? this._cToF(outdoor.temp).toFixed(1) : "—";
      const outdoorHum = outdoor.humidity != null ? outdoor.humidity.toFixed(0) : "—";
      const indoorTemp = indoor.temp != null ? this._cToF(indoor.temp).toFixed(1) : "—";
      const indoorHum = indoor.humidity != null ? indoor.humidity.toFixed(0) : "—";
      const stat0 = summaryCards[0].querySelectorAll(".room-stat-value");
      const stat1 = summaryCards[1].querySelectorAll(".room-stat-value");
      if (stat0.length >= 2) { stat0[0].textContent = outdoorTemp; stat0[1].textContent = outdoorHum; }
      if (stat1.length >= 2) { stat1[0].textContent = indoorTemp; stat1[1].textContent = indoorHum; }
    }

    if (newRooms.length !== prevRooms.length) return false;
    const structureMatch = newRooms.every((r, i) => {
      const pr = prevRooms[i];
      if (!pr || r.id !== pr.id) return false;
      const newApps = r.appliances || [];
      const prevApps = pr.appliances || [];
      if (newApps.length !== prevApps.length) return false;
      return newApps.every((a, j) => (prevApps[j]?.control_entity || prevApps[j]?.climate_entity || "") === (a.control_entity || a.climate_entity || ""));
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
        const entity = app.control_entity || app.climate_entity || "";
        const appCard = Array.from(roomCard.querySelectorAll(".appliance-subcard")).find((el) => (el.dataset.entity || "") === entity);
        if (!appCard) continue;

        const rawState = (app.climate_state || app.climate_mode || "off").toLowerCase();
        const isOn = !["off", "unknown", "unavailable"].includes(rawState);
        const mode = (app.climate_mode || app.climate_state || "off").toLowerCase();
        const fanMode = app.fan_mode || "";
        const fanModes = app.fan_modes || [];
        const appUnit = DISPLAY_UNIT;
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
          wheelWrap.dataset.hvacMode = mode;
          if (entity !== this._draggingWheelEntity) {
            wheelWrap.classList.toggle("temp-wheel-disabled", isFanOnly);
            wheelWrap.dataset.disabled = isFanOnly;
            const targetEl = wheelWrap.querySelector(".temp-wheel-target");
            const roomEl = wheelWrap.querySelector(".temp-wheel-room");
            if (targetEl) targetEl.textContent = targetDisplay;
            if (roomEl) roomEl.textContent = `Room − ${roomTemp}${appUnit}`;
          }
        }

        const tempBtns = appCard.querySelector(".temp-buttons");
        if (tempBtns) {
          tempBtns.classList.toggle("temp-buttons-hidden", isFanOnly);
          tempBtns.dataset.fanOnly = isFanOnly;
          tempBtns.querySelectorAll(".temp-btn").forEach((tb) => { tb.dataset.hvacMode = mode; });
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

  _attachEventListeners() {
    const root = this.shadowRoot;
    if (!root) return;

    const settingsBtn = root.querySelector("#settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        this._showSettings = !this._showSettings;
        this._render();
      });
    }

    const menuBtn = root.querySelector("#menu-btn");
    if (menuBtn) {
      menuBtn.addEventListener("click", () => {
        this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
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
          notify_entity: "",
          tts_overrides: {},
          appliances: [],
        });
        this._collapsedRooms.add(`room-${this._config.rooms.length - 1}`);
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
          this._collapseInitializedForSession = false;
          this._render();
        }
      });
    });

    root.querySelectorAll("[data-action='toggle-room']").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-action='delete-room']")) return;
        const key = el.dataset.key;
        if (!key) return;
        const rooms = this._config?.rooms || [];
        const roomKeys = rooms.map((_, i) => `room-${i}`);
        if (this._collapsedRooms.has(key)) {
          this._collapsedRooms.delete(key);
          roomKeys.filter((k) => k !== key).forEach((k) => this._collapsedRooms.add(k));
        } else {
          this._collapsedRooms.add(key);
        }
        this._render();
      });
    });

    root.querySelectorAll("[data-action='toggle-appliance']").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-action='delete-appliance']")) return;
        const key = el.dataset.key;
        if (!key) return;
        const m = key.match(/^app-(\d+)-(\d+)$/);
        const roomIndex = m ? parseInt(m[1], 10) : 0;
        const room = this._config?.rooms?.[roomIndex];
        const appCount = room?.appliances?.length ?? 0;
        const appKeysInRoom = Array.from({ length: appCount }, (_, ai) => `app-${roomIndex}-${ai}`);
        if (this._collapsedAppliances.has(key)) {
          this._collapsedAppliances.delete(key);
          appKeysInRoom.filter((k) => k !== key).forEach((k) => this._collapsedAppliances.add(k));
        } else {
          this._collapsedAppliances.add(key);
        }
        this._render();
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
          is_smart_appliance: true,
          climate_entity: "",
          automation: {
            person_on: "",
            zone_on: "",
            person_off: "",
            zone_off: "",
            enter_duration_sec: 30,
            exit_duration_sec: 300,
            heat_automation_enabled: true,
            heat_threshold_c: this._fToC(64),
            cool_automation_enabled: true,
            cool_threshold_c: this._fToC(79),
            dry_automation_enabled: false,
            dry_humidity_threshold_pct: 60,
            dry_temp_min_c: this._fToC(64),
            seasonal_mode: "outdoor_temp",
            outdoor_temp_sensor: "",
            date_winter_start: "11-01",
            date_winter_end: "03-31",
            outdoor_cool_only_above_c: 25,
            outdoor_heat_only_below_c: 15,
          },
        });
        this._collapsedAppliances.add(`app-${roomIndex}-${room.appliances.length - 1}`);
        this._render();
      });
    });
  }

  _render() {
    const root = this.shadowRoot;
    if (!root) return;

    root.innerHTML = `
      <style>${STYLES}</style>
      <div class="panel-container">
        <header class="topbar">
          <button class="icon-panel" id="menu-btn" aria-label="Menu" title="Menu">
            <div class="hamburger">
              <span></span><span></span><span></span>
            </div>
          </button>
          <div class="title-panel">
            <div class="title-wrap">
              <div class="eyebrow">Home Assistant Climate Dashboard</div>
              <div class="page-title">Home Climate</div>
              <div class="page-sub">Command center for room monitoring, thermostat control, airflow, and system health</div>
            </div>
            <div class="title-badge">HUD ACTIVE</div>
          </div>
          ${this._isAdmin ? `
            <button class="icon-panel" id="settings-btn" aria-label="Settings" title="Settings">
              <div class="gear"></div>
            </button>
          ` : `<div class="icon-panel" style="cursor:default;opacity:0.5;"><div class="gear"></div></div>`}
        </header>

        ${this._loading ? '<div class="loading"><div class="loading-spinner" aria-hidden="true"></div>Loading...</div>' : ""}
        ${this._error ? `<div class="error">${this._escapeHtml(this._error)}</div>` : ""}

        ${!this._loading && !this._error && this._showSettings ? this._renderSettings() : ""}
        ${!this._loading && !this._error && !this._showSettings ? this._renderDashboard() : ""}
      </div>
    `;

    this._attachEventListeners();
    this._bindThermostatControls(root);

    if (this._showSettings) {
      this._initEntityAutocompletes(root.querySelector(".settings-view"));
    }
  }

  _renderDashboard() {
    const data = this._dashboardData || {};
    const rooms = data.rooms || [];
    const outdoor = data.outdoor || { temp: null, humidity: null };
    const indoor = data.indoor_aggregate || { temp: null, humidity: null, room_count: 0 };
    const unit = DISPLAY_UNIT;
    const tempIcon = `<svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2v-6z"/></svg>`;
    const humidityIcon = `<svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    const outdoorTemp = outdoor.temp != null ? this._cToF(outdoor.temp).toFixed(1) : "—";
    const outdoorHum = outdoor.humidity != null ? outdoor.humidity.toFixed(0) : "—";
    const indoorTemp = indoor.temp != null ? this._cToF(indoor.temp).toFixed(1) : "—";
    const indoorHum = indoor.humidity != null ? indoor.humidity.toFixed(0) : "—";

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

    const primary = this._getPrimaryAppliance(data);
    const ambientTemp = indoor.temp != null ? Math.round(this._cToF(indoor.temp)) : (rooms[0]?.temp != null ? Math.round(rooms[0].temp) : "—");
    const thermalDelta = (indoor.temp != null && outdoor.temp != null) ? Math.round(Math.abs(this._cToF(indoor.temp) - this._cToF(outdoor.temp))) : "—";
    const setpoint = primary ? (primary.target_temp != null ? Math.round(primary.target_temp) : "—") : "—";
    const modeLabel = primary ? this._modeLabel((primary.climate_mode || primary.climate_state || "off").toLowerCase()) : "—";
    const hvacAction = primary?.hvac_action || null;
    const compressorLabel = hvacAction && ["heating", "cooling"].includes(hvacAction) ? "Active" : (hvacAction === "idle" ? "Idle" : "—");

    return `
      <div class="main">
        <section class="card overview">
          <div class="card-inner">
            <div class="card-head">
              <div>
                <div class="card-title">Climate Overview</div>
                <div class="card-sub">Whole home temperature target and ambient telemetry</div>
              </div>
              <div class="mini-badge">Core</div>
            </div>
            <div class="overview-grid">
              <div class="overview-left">
                <div>
                  <div class="temp-wrap">
                    <div class="ambient-temp" id="ambientTemp">${ambientTemp}</div>
                    <div class="ambient-unit">${unit}</div>
                  </div>
                  <div class="ambient-text">Average indoor reading across all active rooms with healthy humidity and stable pressure.</div>
                </div>
                <div class="metric-grid">
                  <div class="metric">
                    <div class="label">Humidity</div>
                    <div class="value">${indoorHum}%</div>
                    <div class="sub">${parseFloat(indoorHum) >= 40 && parseFloat(indoorHum) <= 60 ? "Balanced" : "—"}</div>
                  </div>
                  <div class="metric">
                    <div class="label">Air Quality</div>
                    <div class="value">Good</div>
                    <div class="sub">Clean</div>
                  </div>
                  <div class="metric">
                    <div class="label">Pressure</div>
                    <div class="value">1013</div>
                    <div class="sub">mbar stable</div>
                  </div>
                  <div class="metric">
                    <div class="label">Thermal Delta</div>
                    <div class="value">${thermalDelta}°</div>
                    <div class="sub">Indoor vs outdoor</div>
                  </div>
                </div>
              </div>
              <div class="target-wrap">
                <div class="crosshair-h"></div>
                <div class="crosshair-v"></div>
                <div class="target-shell">
                  <div class="target-ring">
                    <div class="target-dot"></div>
                    <div class="target-center">
                      <div class="small">Target Setpoint</div>
                      <div class="setpoint" id="overviewSetpoint">${setpoint}${typeof setpoint === "number" ? "°" : ""}</div>
                      <div class="state" id="overviewMode">${modeLabel} ${primary ? "Active" : ""}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section class="card thermostat">
          <div class="card-inner">
            <div class="card-head">
              <div>
                <div class="card-title">Thermostat</div>
                <div class="card-sub">Mode, setpoint, fan, and airflow controls</div>
              </div>
              <div class="mini-badge">HVAC</div>
            </div>
            ${primary ? this._renderThermostatCard(primary) : '<div class="empty-state" style="padding:24px;"><p>No climate appliance configured.</p><p>Add rooms and appliances in Settings.</p></div>'}
          </div>
        </section>
        <section class="card zones">
          <div class="card-inner">
            <div class="card-head">
              <div>
                <div class="card-title">Zone Matrix</div>
                <div class="card-sub">High density room telemetry</div>
              </div>
            </div>
            <div class="zones-grid" id="roomsGrid">
              ${rooms.map((r) => this._renderZoneCard(r)).join("")}
            </div>
          </div>
        </section>
        <section class="card systems">
          <div class="card-inner">
            <div class="card-head">
              <div>
                <div class="card-title">System Health</div>
                <div class="card-sub">Diagnostics, efficiency, alerts, and runtime status</div>
              </div>
              <div class="mini-badge">Status</div>
            </div>
            <div class="systems-grid">
              <div class="stack">
                <div class="data-item"><span>System</span><strong class="ok">Online</strong></div>
                <div class="data-item"><span>Efficiency</span><strong class="ok">92%</strong></div>
                <div class="data-item"><span>Compressor</span><strong class="blue">${compressorLabel}</strong></div>
                <div class="data-item"><span>Cycle Timer</span><strong>—</strong></div>
              </div>
              <div class="stack">
                <div class="data-item"><span>Filter</span><strong class="warn">Check Soon</strong></div>
                <div class="data-item"><span>Power Draw</span><strong>—</strong></div>
                <div class="data-item"><span>Alerts</span><strong class="ok">0</strong></div>
                <div class="data-item"><span>Quiet Mode</span><strong class="blue">—</strong></div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div class="footer-label">Home Climate • Command HUD</div>
    `;
  }

  _renderRoomParentCard(room) {
    const temp = room.temp != null ? room.temp.toFixed(1) : "—";
    const humidity = room.humidity != null ? room.humidity.toFixed(0) : "—";
    const roomName = room.name || "Room";
    const unit = DISPLAY_UNIT;
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
    const rawState = (appliance.climate_state || appliance.climate_mode || "off").toLowerCase();
    const isOn = !["off", "unknown", "unavailable"].includes(rawState);
    const controlEntity = appliance.control_entity || appliance.climate_entity || "";
    const entity = this._escapeHtml(controlEntity);
    const roomName = this._escapeHtml(room.name || "Room");
    const isSmart = appliance.is_smart_appliance !== false;
    return `
      <div class="appliance-subcard" data-entity="${entity}" data-room-name="${roomName}" data-is-smart="${isSmart}">
        <div class="onoff-toggle-wrap">
          <button class="onoff-toggle ${isOn ? "on" : ""}" data-action="onoff" data-entity="${entity}" data-room-name="${roomName}" data-is-on="${isOn}" aria-label="${isOn ? "Turn off" : "Turn on"}">
            <img class="toggle-icon" src="/home_climate_panel/icons/${isOn ? "power-on" : "power-off"}.png" alt="">
          </button>
        </div>
        <h4 class="device-name">${this._escapeHtml(appliance.device_name || "Appliance")}</h4>
        ${this._renderRoomCard(app, true, isSmart)}
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
      const lower = (hvacModes || []).map((m) => (m || "").toLowerCase());
      return allowed.filter((m) => lower.includes(m) && !exclude.has(m));
    }
    return allowed;
  }

  _cToF(c) {
    return Math.round((c * 9 / 5 + 32) * 2) / 2;
  }

  _fToC(f) {
    return (f - 32) * 5 / 9;
  }

  _getPrimaryAppliance(data) {
    const rooms = data?.rooms || [];
    for (const room of rooms) {
      const apps = room.appliances || [];
      const climate = apps.find((a) => a.is_smart_appliance !== false && (a.control_entity || a.climate_entity));
      if (climate) return { ...climate, _roomNameForTts: room.name || "Room" };
    }
    return null;
  }

  _renderZoneCard(room) {
    const temp = room.temp != null ? Math.round(room.temp) : "—";
    const humidity = room.humidity != null ? room.humidity.toFixed(0) : "—";
    const roomName = room.name || "Room";
    const unit = DISPLAY_UNIT;
    const firstApp = (room.appliances || [])[0];
    const hvacAction = firstApp?.hvac_action;
    const tag = hvacAction === "heating" ? "Heating" : hvacAction === "cooling" ? "Cooling" : "Stable";
    const minT = 55, maxT = 90;
    const barPct = typeof temp === "number" ? Math.max(0, Math.min(100, ((temp - minT) / (maxT - minT)) * 100)) : 70;
    return `
      <div class="zone-card" data-room-id="${this._escapeHtml(room.id || "")}">
        <div>
          <div class="zone-top">
            <div class="zone-name">${this._escapeHtml(roomName)}</div>
            <div class="zone-tag">${tag}</div>
          </div>
          <div class="zone-temp"><div class="value">${temp}</div><div class="unit">${unit}</div></div>
          <div class="zone-meta"><span>${humidity}% humidity</span><span>steady</span></div>
        </div>
        <div class="zone-bar"><span style="width:${barPct}%"></span></div>
      </div>
    `;
  }

  _renderThermostatCard(primary) {
    const mode = (primary.climate_mode || primary.climate_state || "off").toLowerCase();
    const fanMode = primary.fan_mode || "Auto";
    const target = primary.target_temp != null ? Math.round(primary.target_temp) : 70;
    const minT = primary.min_temp ?? 16;
    const maxT = primary.max_temp ?? 30;
    const hvacModes = primary.hvac_modes || [];
    const fanModes = primary.fan_modes || ["Auto", "Low", "Medium", "High"];
    const allowedModes = this._allowedModes(hvacModes, true);
    const entity = this._escapeHtml(primary.control_entity || primary.climate_entity || "");
    const roomName = this._escapeHtml(primary._roomNameForTts || "Room");
    const modeMap = { cool: "Cool", heat: "Heat", dry: "Dry", fan_only: "Fan" };
    const modesForUi = ["Cool", "Heat", "Auto", "Dry"].filter((m) => allowedModes.some((a) => modeMap[a] === m || a === m.toLowerCase()));
    return `
      <div class="thermo-grid" data-primary-entity="${entity}" data-room-name="${roomName}" data-min="${minT}" data-max="${maxT}">
        <div class="setting-row">
          <div class="setting-box">
            <div class="label">Current Mode</div>
            <div class="value" id="modeValue">${this._modeLabel(mode)}</div>
            <div class="sub">Active climate program</div>
          </div>
          <div class="setting-box">
            <div class="label">Fan Speed</div>
            <div class="value" id="fanSpeedValue">${fanMode}</div>
            <div class="sub">Live airflow output</div>
          </div>
        </div>
        <div class="setpoint-row">
          <button class="step-btn" data-action="temp-down" data-entity="${entity}" data-room-name="${roomName}" data-hvac-mode="${mode}">−</button>
          <div class="setpoint-box">
            <div class="label">Setpoint</div>
            <div class="value" id="setpointValue">${target}°</div>
          </div>
          <button class="step-btn" data-action="temp-up" data-entity="${entity}" data-room-name="${roomName}" data-hvac-mode="${mode}">+</button>
        </div>
        <div class="mode-grid" id="modeGrid">
          ${modesForUi.map((m) => {
            const dm = m.toLowerCase();
            const active = mode === dm || (m === "Auto" && mode === "heat_cool");
            return `<button class="mode-btn ${active ? "active" : ""}" data-mode="${dm}" data-entity="${entity}" data-room-name="${roomName}">${m}</button>`;
          }).join("")}
        </div>
        <div class="slider-box">
          <div class="slider-head">
            <div class="label">Fan Control</div>
            <div class="value" id="fanLabel">${fanMode}</div>
          </div>
          <div class="fan-grid" id="fanGrid">
            ${(fanModes.slice(0, 4)).map((fm) => `<button class="fan-btn ${(fanMode || "").toLowerCase() === (fm || "").toLowerCase() ? "active" : ""}" data-fan="${this._escapeHtml(fm)}" data-entity="${entity}">${this._escapeHtml(fm)}</button>`).join("")}
          </div>
        </div>
      </div>
    `;
  }

  _renderTempWheel(room) {
    const minT = room.min_temp ?? 16;
    const maxT = room.max_temp ?? 30;
    const mode = (room.climate_mode || room.climate_state || "off").toLowerCase();
    const isFanOnly = mode === "fan_only";
    const target = room.target_temp != null ? Math.round(room.target_temp) : Math.round((minT + maxT) / 2);
    const range = maxT - minT || 1;
    const norm = isFanOnly ? 0 : Math.max(0, Math.min(1, (target - minT) / range));
    const unit = DISPLAY_UNIT;
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
    const controlEntity = room.control_entity || room.climate_entity || "";
    return `
      <div class="temp-wheel-wrap${disabledClass}" data-entity="${this._escapeHtml(controlEntity)}" data-room-name="${this._escapeHtml(ttsRoomName)}" data-hvac-mode="${this._escapeHtml(mode)}" data-min="${minT}" data-max="${maxT}" data-target="${target}" data-unit="${this._escapeHtml(unit)}" data-disabled="${isFanOnly}">
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

  _renderRoomCard(room, asSubCard = false, isSmart = true) {
    const temp = room.temp != null ? room.temp.toFixed(1) : "—";
    const humidity = room.humidity != null ? room.humidity.toFixed(0) : "—";
    const mode = (room.climate_mode || room.climate_state || "off").toLowerCase();
    const hvacAction = room.hvac_action || null;
    const fanMode = room.fan_mode || null;
    const controlEntity = room.control_entity || room.climate_entity;
    const hasClimate = !!(controlEntity && !room.is_monitor_only);
    const hasSmartClimate = hasClimate && isSmart;
    const roomName = (asSubCard && room._roomNameForTts) ? room._roomNameForTts : (room.name || "Room");
    const unit = DISPLAY_UNIT;
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
      ${hasSmartClimate ? this._renderTempWheel(room) : ""}
      ${!hasClimate && controlEntity ? `
        <div class="simple-appliance-temp" style="font-size:clamp(24px,4vw,30px);font-weight:600;margin:8px 0;">Room − ${temp}${DISPLAY_UNIT}</div>
      ` : ""}
      ${hasSmartClimate ? `
        <div class="temp-buttons ${mode === "fan_only" ? "temp-buttons-hidden" : ""}" data-fan-only="${mode === "fan_only"}">
          <button class="temp-btn" data-action="temp-down" data-entity="${this._escapeHtml(controlEntity)}" data-room-name="${this._escapeHtml(roomName)}" data-hvac-mode="${this._escapeHtml(mode)}" data-min="${minT}" data-max="${maxT}" data-target="${currentTarget}">−</button>
          <button class="temp-btn" data-action="temp-up" data-entity="${this._escapeHtml(controlEntity)}" data-room-name="${this._escapeHtml(roomName)}" data-hvac-mode="${this._escapeHtml(mode)}" data-min="${minT}" data-max="${maxT}" data-target="${currentTarget}">+</button>
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
        ${!room.is_monitor_only && hasSmartClimate && fanModes.length > 0 ? `<button type="button" class="fan-badge-btn state-badge state-fan" data-action="fan-popover" data-entity="${this._escapeHtml(controlEntity)}" data-fan-mode="${this._escapeHtml(fanMode || "")}" data-fan-modes="${this._escapeHtml(fanModes.join(","))}" data-room-name="${this._escapeHtml(roomName)}">Fan: ${this._escapeHtml(fanMode || "—")}</button>` : ""}
      </div>
      ${hasSmartClimate ? `
        <div class="room-controls">
          ${modesForRow.map((m) => `
            <button class="ctrl-btn ${mode === m ? "active" : ""}" title="${this._escapeHtml(this._modeLabel(m))}" aria-label="${this._escapeHtml(this._modeLabel(m))}" data-action="mode" data-hvac-mode="${m}" data-entity="${this._escapeHtml(controlEntity)}" data-room-name="${this._escapeHtml(roomName)}">${modeIcons[m] || offIcon}</button>
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

  async _setTemperature(entityId, temperature, roomName, hvacMode) {
    if (!this._hass || !entityId) return;
    try {
      const payload = {
        type: "home_climate/set_temperature",
        entity_id: entityId,
        temperature: parseFloat(temperature),
        room_name: roomName || "Room",
      };
      if (hvacMode && hvacMode !== "off") payload.hvac_mode = hvacMode;
      await this._hass.callWS(payload);
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

  _bindThermostatControls(root) {
    if (!root) return;
    root.querySelectorAll(".step-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const action = e.currentTarget.dataset.action;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        const hvacMode = (e.currentTarget.dataset.hvacMode || "").toLowerCase();
        const thermoGrid = btn.closest(".thermo-grid");
        const minT = thermoGrid ? parseFloat(thermoGrid.dataset.min) || 16 : 16;
        const maxT = thermoGrid ? parseFloat(thermoGrid.dataset.max) || 30 : 30;
        const setpointEl = root.querySelector("#setpointValue");
        const target = setpointEl ? parseFloat(setpointEl.textContent) || 70 : 70;
        if (!entity) return;
        let newTarget = target;
        if (action === "temp-down") newTarget = Math.max(minT, target - 1);
        else if (action === "temp-up") newTarget = Math.min(maxT, target + 1);
        this._setTemperature(entity, newTarget, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const mode = e.currentTarget.dataset.mode;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        if (!entity || !mode) return;
        if (mode === "off") {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else {
          const haMode = mode === "auto" ? "heat_cool" : mode;
          this._setClimateAndAnnounce(entity, "set_hvac_mode", haMode, roomName);
        }
      });
    });
    root.querySelectorAll(".fan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const fanMode = e.currentTarget.dataset.fan;
        if (!entity || !fanMode) return;
        this._setFanMode(entity, fanMode);
      });
    });
  }

  _bindThermostatControls(root) {
    if (!root) return;
    root.querySelectorAll(".step-btn[data-action='temp-down']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const hvacMode = (btn.dataset.hvacMode || "").toLowerCase();
        if (!entity) return;
        const thermo = btn.closest(".thermo-grid");
        const minT = parseFloat(thermo?.dataset.min) || 16;
        const maxT = parseFloat(thermo?.dataset.max) || 30;
        const setpointEl = root.querySelector("#setpointValue");
        let target = setpointEl ? parseFloat(setpointEl.textContent) : (minT + maxT) / 2;
        if (isNaN(target)) target = 70;
        target = Math.max(this._cToF(minT), target - 1);
        this._setTemperature(entity, this._fToC(target), roomName, hvacMode);
      });
    });
    root.querySelectorAll(".step-btn[data-action='temp-up']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const hvacMode = (btn.dataset.hvacMode || "").toLowerCase();
        if (!entity) return;
        const thermo = btn.closest(".thermo-grid");
        const minT = parseFloat(thermo?.dataset.min) || 16;
        const maxT = parseFloat(thermo?.dataset.max) || 30;
        const setpointEl = root.querySelector("#setpointValue");
        let target = setpointEl ? parseFloat(setpointEl.textContent) : (minT + maxT) / 2;
        if (isNaN(target)) target = 70;
        target = Math.min(this._cToF(maxT), target + 1);
        this._setTemperature(entity, this._fToC(target), roomName, hvacMode);
      });
    });
    root.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const mode = btn.dataset.mode;
        if (!entity || !mode) return;
        this._setClimateAndAnnounce(entity, "set_hvac_mode", mode, roomName);
      });
    });
    root.querySelectorAll(".fan-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const fan = btn.dataset.fan;
        if (!entity || !fan) return;
        this._setFanMode(entity, fan);
      });
    });
  }

  _bindThermostatControls(root) {
    if (!root) return;
    root.querySelectorAll(".step-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const action = e.currentTarget.dataset.action;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        const hvacMode = (e.currentTarget.dataset.hvacMode || "").toLowerCase();
        if (!entity) return;
        const thermo = root.querySelector(".thermo-grid[data-primary-entity]");
        const minT = thermo ? parseFloat(thermo.dataset.min) || 16 : 16;
        const maxT = thermo ? parseFloat(thermo.dataset.max) || 30 : 30;
        const valueEl = root.querySelector("#setpointValue");
        let target = valueEl ? parseFloat((valueEl.textContent || "70").replace("°", "")) : 70;
        const step = 1;
        if (action === "temp-down") target = Math.max(this._cToF(minT), target - step);
        else if (action === "temp-up") target = Math.min(this._cToF(maxT), target + step);
        this._setTemperature(entity, this._fToC(target), roomName, hvacMode);
      });
    });
    root.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const mode = e.currentTarget.dataset.mode;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        if (!entity || !mode) return;
        if (mode === "off") {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else {
          this._setClimateAndAnnounce(entity, "set_hvac_mode", mode, roomName);
        }
      });
    });
    root.querySelectorAll(".fan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const fan = e.currentTarget.dataset.fan;
        if (!entity || !fan) return;
        this._setFanMode(entity, fan);
      });
    });
  }

  _bindThermostatControls(root) {
    if (!root) return;
    root.querySelectorAll(".step-btn[data-action='temp-down']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const hvacMode = (btn.dataset.hvacMode || "").toLowerCase();
        const grid = btn.closest(".thermo-grid");
        const minT = parseFloat(grid?.dataset.min) || 16;
        const maxT = parseFloat(grid?.dataset.max) || 30;
        const valEl = root.querySelector("#setpointValue");
        let target = valEl ? parseFloat(valEl.textContent) || 70 : 70;
        target = Math.max(minT, target - 1);
        if (entity) this._setTemperature(entity, target, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".step-btn[data-action='temp-up']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const hvacMode = (btn.dataset.hvacMode || "").toLowerCase();
        const grid = btn.closest(".thermo-grid");
        const minT = parseFloat(grid?.dataset.min) || 16;
        const maxT = parseFloat(grid?.dataset.max) || 30;
        const valEl = root.querySelector("#setpointValue");
        let target = valEl ? parseFloat(valEl.textContent) || 70 : 70;
        target = Math.min(maxT, target + 1);
        if (entity) this._setTemperature(entity, target, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const mode = btn.dataset.mode;
        if (!entity || !mode) return;
        if (mode === "off") {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else {
          this._setClimateAndAnnounce(entity, "set_hvac_mode", mode, roomName);
        }
      });
    });
    root.querySelectorAll(".fan-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const fan = btn.dataset.fan;
        if (entity && fan) this._setFanMode(entity, fan);
      });
    });
  }

  _bindThermostatControls(root) {
    if (!root) return;
    root.querySelectorAll(".step-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        const action = e.currentTarget.dataset.action;
        const hvacMode = (e.currentTarget.dataset.hvacMode || "").toLowerCase();
        const thermo = root.querySelector(".thermo-grid[data-primary-entity]");
        if (!entity || !thermo) return;
        const minT = parseFloat(thermo.dataset.min) || 16;
        const maxT = parseFloat(thermo.dataset.max) || 30;
        const setpointEl = root.querySelector("#setpointValue");
        let target = setpointEl ? parseFloat(setpointEl.textContent) : (minT + maxT) / 2;
        if (action === "temp-down") target = Math.max(minT, target - 1);
        else if (action === "temp-up") target = Math.min(maxT, target + 1);
        this._setTemperature(entity, target, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        const mode = e.currentTarget.dataset.mode;
        if (!entity || !mode) return;
        if (mode === "off") {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else {
          this._setClimateAndAnnounce(entity, "set_hvac_mode", mode, roomName);
        }
      });
    });
    root.querySelectorAll(".fan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const fanMode = e.currentTarget.dataset.fan;
        if (!entity || !fanMode) return;
        this._setFanMode(entity, fanMode);
      });
    });
  }

  _bindThermostatControls(root) {
    if (!root) return;
    root.querySelectorAll(".step-btn[data-action='temp-down']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const hvacMode = (btn.dataset.hvacMode || "").toLowerCase();
        const thermo = btn.closest(".thermo-grid");
        const minT = parseFloat(thermo?.dataset.min) || 16;
        const maxT = parseFloat(thermo?.dataset.max) || 30;
        const valEl = root.querySelector("#setpointValue");
        let target = valEl ? parseFloat(valEl.textContent) : 70;
        if (!entity) return;
        target = Math.max(minT, target - 1);
        this._setTemperature(entity, target, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".step-btn[data-action='temp-up']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const hvacMode = (btn.dataset.hvacMode || "").toLowerCase();
        const thermo = btn.closest(".thermo-grid");
        const minT = parseFloat(thermo?.dataset.min) || 16;
        const maxT = parseFloat(thermo?.dataset.max) || 30;
        const valEl = root.querySelector("#setpointValue");
        let target = valEl ? parseFloat(valEl.textContent) : 70;
        if (!entity) return;
        target = Math.min(maxT, target + 1);
        this._setTemperature(entity, target, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const mode = (btn.dataset.mode || "").toLowerCase();
        if (!entity) return;
        if (mode === "off") {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else {
          this._setClimateAndAnnounce(entity, "set_hvac_mode", mode, roomName);
        }
      });
    });
    root.querySelectorAll(".fan-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const fanMode = btn.dataset.fan;
        if (!entity || !fanMode) return;
        this._setFanMode(entity, fanMode);
      });
    });
  }

  _bindThermostatControls(root) {
    if (!root) return;
    root.querySelectorAll(".step-btn[data-action='temp-down']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const hvacMode = (btn.dataset.hvacMode || "").toLowerCase();
        if (!entity) return;
        const thermoGrid = btn.closest(".thermo-grid");
        const minT = parseFloat(thermoGrid?.dataset.min) || 16;
        const maxT = parseFloat(thermoGrid?.dataset.max) || 30;
        const valEl = root.querySelector("#setpointValue");
        let target = valEl ? parseFloat(String(valEl.textContent).replace(/°/, "")) : 70;
        target = Math.max(minT, Math.min(maxT, target - 1));
        this._setTemperature(entity, target, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".step-btn[data-action='temp-up']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const hvacMode = (btn.dataset.hvacMode || "").toLowerCase();
        if (!entity) return;
        const thermoGrid = btn.closest(".thermo-grid");
        const minT = parseFloat(thermoGrid?.dataset.min) || 16;
        const maxT = parseFloat(thermoGrid?.dataset.max) || 30;
        const valEl = root.querySelector("#setpointValue");
        let target = valEl ? parseFloat(String(valEl.textContent).replace(/°/, "")) : 70;
        target = Math.max(minT, Math.min(maxT, target + 1));
        this._setTemperature(entity, target, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const roomName = btn.dataset.roomName || "Room";
        const mode = (btn.dataset.mode || "").toLowerCase();
        if (!entity) return;
        if (mode === "off") this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        else this._setClimateAndAnnounce(entity, "set_hvac_mode", mode, roomName);
      });
    });
    root.querySelectorAll(".fan-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const fanMode = btn.dataset.fan;
        if (!entity || !fanMode) return;
        this._setFanMode(entity, fanMode);
      });
    });
  }

  _bindThermostatControls(root) {
    root.querySelectorAll(".step-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const action = e.currentTarget.dataset.action;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        const hvacMode = (e.currentTarget.dataset.hvacMode || "").toLowerCase();
        if (!entity) return;
        const minT = parseFloat(e.currentTarget.closest(".thermo-grid")?.dataset.min) || 16;
        const maxT = parseFloat(e.currentTarget.closest(".thermo-grid")?.dataset.max) || 30;
        const setpointEl = root.querySelector("#setpointValue");
        let target = setpointEl ? parseFloat(setpointEl.textContent) || 70 : 70;
        if (action === "temp-down") target = Math.max(minT, target - 1);
        else if (action === "temp-up") target = Math.min(maxT, target + 1);
        this._setTemperature(entity, target, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const mode = e.currentTarget.dataset.mode;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        if (!entity || !mode) return;
        if (mode === "off") {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else {
          this._setClimateAndAnnounce(entity, "set_hvac_mode", mode, roomName);
        }
      });
    });
    root.querySelectorAll(".fan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const fan = e.currentTarget.dataset.fan;
        if (!entity || !fan) return;
        this._setFanMode(entity, fan);
      });
    });
  }

  _bindThermostatControls(root) {
    root.querySelectorAll(".step-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const action = e.currentTarget.dataset.action;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        const hvacMode = (e.currentTarget.dataset.hvacMode || "").toLowerCase();
        if (!entity) return;
        const thermo = e.currentTarget.closest(".thermo-grid");
        const minT = thermo ? parseFloat(thermo.dataset.min) || 16 : 16;
        const maxT = thermo ? parseFloat(thermo.dataset.max) || 30 : 30;
        const valEl = root.querySelector("#setpointValue");
        const current = valEl ? parseFloat(valEl.textContent) : 70;
        let target = current;
        if (action === "temp-down") target = Math.max(minT, target - 1);
        else if (action === "temp-up") target = Math.min(maxT, target + 1);
        this._setTemperature(entity, target, roomName, hvacMode);
      });
    });
    root.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const mode = e.currentTarget.dataset.mode;
        const roomName = e.currentTarget.dataset.roomName || "Room";
        if (!entity || !mode) return;
        if (mode === "off") {
          this._setClimateAndAnnounce(entity, "turn_off", "off", roomName);
        } else {
          this._setClimateAndAnnounce(entity, "set_hvac_mode", mode, roomName);
        }
      });
    });
    root.querySelectorAll(".fan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entity = e.currentTarget.dataset.entity;
        const fan = e.currentTarget.dataset.fan;
        if (!entity || !fan) return;
        this._setFanMode(entity, fan);
      });
    });
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
        const hvacMode = (e.currentTarget.dataset.hvacMode || "").toLowerCase();
        if (!entity) return;
        const minT = parseFloat(e.currentTarget.dataset.min) || 16;
        const maxT = parseFloat(e.currentTarget.dataset.max) || 30;
        let target = parseFloat(e.currentTarget.dataset.target) || (minT + maxT) / 2;
        const step = 1;
        if (action === "temp-down") target = Math.max(minT, target - step);
        else if (action === "temp-up") target = Math.min(maxT, target + step);
        this._setTemperature(entity, target, roomName, hvacMode);
      });
    });

    root.querySelectorAll(".temp-wheel-wrap:not(.temp-wheel-disabled)").forEach((wrap) => {
      const entity = wrap.dataset.entity;
      const roomName = wrap.dataset.roomName || "Room";
      const minT = parseFloat(wrap.dataset.min) || 16;
      const maxT = parseFloat(wrap.dataset.max) || 30;
      const unit = wrap.dataset.unit || DISPLAY_UNIT;
      if (!entity) return;
      const fillCircle = wrap.querySelector(".temp-wheel-fill");
      const knob = wrap.querySelector("[data-wheel-knob]");
      const targetEl = wrap.querySelector(".temp-wheel-target");
      const svg = wrap.querySelector(".temp-wheel-svg");
      const r = 45;
      const circum = 2 * Math.PI * r;
      const arcLen = circum * 0.75;
      const dashOffset = circum * 0.625;

      const getNormFromEvent = (e) => {
        const rect = wrap.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        const x = clientX - cx;
        const y = clientY - cy;
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

      const hvacMode = (wrap.dataset.hvacMode || "").toLowerCase();
      const handleSetTemp = (norm) => {
        const temp = normToTemp(norm);
        this._setTemperature(entity, temp, roomName, hvacMode);
      };

      const onDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._draggingWheelEntity = entity;
        let lastNorm = getNormFromEvent(e);
        updateDOM(lastNorm);
        const onMove = (ev) => {
          ev.preventDefault();
          lastNorm = getNormFromEvent(ev);
          updateDOM(lastNorm);
        };
        const touchMoveOpts = { capture: true, passive: false };
        const touchEndOpts = { capture: true };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          document.removeEventListener("touchmove", onMove, touchMoveOpts);
          document.removeEventListener("touchend", onUp, touchEndOpts);
          this._draggingWheelEntity = null;
          handleSetTemp(lastNorm);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        document.addEventListener("touchmove", onMove, touchMoveOpts);
        document.addEventListener("touchend", onUp, touchEndOpts);
      };

      const target = svg || wrap;
      target.addEventListener("mousedown", onDown);
      target.addEventListener("touchstart", onDown, { passive: false });
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
    if (entityType === "weather") {
      return (entities.weather || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
    }
    if (entityType === "notify") {
      const mobile = (entities.mobile_app_devices || []).map((e) => ({
        entity_id: e.entity_id,
        friendly_name: e.device_name || e.entity_id,
      }));
      if (mobile.length > 0) return mobile;
      return (entities.notify || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
    }
    if (entityType === "media_player") {
      return (entities.media_players || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
    }
    if (entityType === "switch") {
      return (entities.switch || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
    }
    if (entityType === "sensor_switch") {
      const sensors = (entities.sensors || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
      const switches = (entities.switch || []).map((e) => ({ entity_id: e.entity_id, friendly_name: e.friendly_name || e.entity_id }));
      return [...sensors, ...switches];
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

  _renderEntityDropdown(value, entityType, fieldName, placeholder) {
    const entities = this._getEntitiesForAutocomplete(entityType);
    const opts = entities.map((e) => {
      const id = (e.entity_id || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      const label = this._escapeHtml(e.friendly_name || e.entity_id || "");
      const sel = (value || "") === (e.entity_id || "") ? " selected" : "";
      return `<option value="${id}"${sel}>${label}</option>`;
    }).join("");
    return `
      <select class="form-select" data-field="${fieldName || ""}" data-entity-type="${entityType}">
        <option value="">${this._escapeHtml(placeholder || "— None —")}</option>
        ${opts}
      </select>
    `;
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
      mode_change: "Mode change (manual)",
      temp_change: "Temperature change",
      presence_enter: "Zone entry – turning on",
      presence_leave: "Zone exit – turning off",
      fan_change: "Fan speed change",
      auto_mode_change: "Automation mode change",
      comfort_adjusted: "Comfort temp adjusted (struggle)",
      comfort_revert: "Room at comfort – reverted to fan only",
      seasonal_blocked: "Seasonal block (heat in summer / cool in winter)",
    };
  }

  _renderSettings() {
    const rooms = this._config?.rooms || [];
    if (!this._collapseInitializedForSession && rooms.length > 0) {
      this._collapsedRooms = new Set(rooms.map((_, i) => `room-${i}`));
      this._collapsedAppliances = new Set(rooms.flatMap((r, ri) => (r.appliances || []).map((_, ai) => `app-${ri}-${ai}`)));
      this._collapseInitializedForSession = true;
    }
    const ttsSettings = this._config?.tts_settings || {};
    const ttsMessages = ttsSettings.messages || {};
    const entities = this._entities || { climate: [], sensors: [], persons: [], zones: [], media_players: [], weather: [], notify: [], switch: [], mobile_app_devices: [] };

    const settingsStyles = `
      .settings-tabs { display: flex; gap: 4px; margin-bottom: 20px; flex-wrap: wrap; }
      .settings-tab { padding: 10px 16px; border: none; background: transparent; color: rgba(225,232,237,0.7); cursor: pointer; border-radius: 8px; font-size: 13px; }
      .settings-tab:hover { background: rgba(255,255,255,0.05); }
      .settings-tab.active { background: var(--accent); color: #fff; }
      .settings-tab-content { display: none; }
      .settings-tab-content.active { display: block; }
      .settings-card { background: var(--card-bg); border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); padding: 20px; margin-bottom: 16px; }
      .settings-card h3 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
      .settings-section { margin-bottom: 24px; }
      .settings-section:last-child { margin-bottom: 0; }
      .settings-section-title { font-size: 16px; font-weight: 600; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.12); }
      .settings-section-divider { height: 1px; background: rgba(255,255,255,0.12); margin: 20px 0; }
      .settings-card h4 { margin: 12px 0 8px; font-size: 14px; font-weight: 500; opacity: 0.95; }
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
      .room-row { padding: 0; background: rgba(0,0,0,0.18); border-radius: 10px; margin-bottom: 14px; border: 1px solid rgba(255,255,255,0.12); overflow: hidden; }
      .room-row-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; user-select: none; font-size: 14px; font-weight: 500; }
      .room-row-header:hover { background: rgba(255,255,255,0.03); }
      .room-row-header .chevron { transition: transform 0.2s; }
      .room-row.collapsed .room-row-header .chevron { transform: rotate(-90deg); }
      .room-row-content { padding: 0 16px 16px; }
      .room-row.collapsed .room-row-content { display: none; }
      .appliance-card { padding: 0; background: rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
      .appliance-card-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: pointer; user-select: none; font-size: 14px; font-weight: 500; }
      .appliance-card-header:hover { background: rgba(255,255,255,0.03); }
      .appliance-card-header .chevron { transition: transform 0.2s; }
      .appliance-card.collapsed .appliance-card-header .chevron { transform: rotate(-90deg); }
      .appliance-card-content { padding: 12px; }
      .appliance-card.collapsed .appliance-card-content { display: none; }
      .tts-event-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
      .tts-event-row .form-input { flex: 1; min-width: 200px; }
      .tts-toggle { min-width: 50px; }
    `;

    const ttsEventKeys = ["manual_on", "manual_off", "mode_change", "temp_change", "presence_enter", "presence_leave", "fan_change", "auto_mode_change", "comfort_adjusted", "comfort_revert", "seasonal_blocked"];
    const labels = this._ttsEventLabels();

    return `
      <style>${settingsStyles}</style>
      <div class="settings-view">
        <div class="settings-tabs">
          <button class="settings-tab ${this._settingsTab === "global" ? "active" : ""}" data-tab="global">Global Settings</button>
          <button class="settings-tab ${this._settingsTab === "rooms" ? "active" : ""}" data-tab="rooms">Rooms</button>
          <button class="settings-tab ${this._settingsTab === "tts" ? "active" : ""}" data-tab="tts">TTS</button>
          <button class="settings-tab ${this._settingsTab === "notifications" ? "active" : ""}" data-tab="notifications">Notifications</button>
        </div>

        <div class="settings-tab-content ${this._settingsTab === "global" ? "active" : ""}" id="tab-global">
          <div class="settings-card">
            <h3>Global Settings</h3>
            <div class="settings-section">
              <h4 class="settings-section-title">Outdoor (weather)</h4>
              <div class="form-group">
                <label class="form-label">Weather entity (for outdoor temp/humidity)</label>
                ${this._renderEntityDropdown(this._config?.weather_entity || "", "weather", "weather_entity", "Select weather entity")}
              </div>
            </div>
          </div>
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
            <div class="settings-section">
              <h4 class="settings-section-title">Global settings</h4>
              <div class="form-group">
                <label class="form-label">Global prefix</label>
                <input type="text" class="form-input" id="tts-prefix" value="${this._escapeHtml(ttsSettings.prefix || "Message from Home Climate.")}">
              </div>
              <div class="form-group">
                <label class="form-label">Language</label>
                <input type="text" class="form-input" id="tts-language" value="${this._escapeHtml(ttsSettings.language || "en")}" placeholder="en">
              </div>
            </div>
            <div class="settings-section-divider"></div>
            <div class="settings-section">
              <h4 class="settings-section-title">Event messages</h4>
              <p class="form-label" style="margin-bottom:8px;">Variables: {prefix}, {room_name}, {device_name}, {device_type}, {mode}, {temp}, {fan_mode}</p>
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
        </div>

        <div class="settings-tab-content ${this._settingsTab === "notifications" ? "active" : ""}" id="tab-notifications">
          <div class="settings-card">
            <h3>Notification Settings</h3>
            <div class="settings-section">
              <h4 class="settings-section-title">Global settings</h4>
              <div class="form-group">
                <label class="form-label" style="display:flex;align-items:center;gap:8px;">
                  <input type="checkbox" id="notif-enabled" ${(this._config?.notification_settings || {}).enabled !== false ? "checked" : ""}>
                  Enable notifications
                </label>
              </div>
              <p class="form-label" style="margin-bottom:8px;opacity:0.85;">Set Notify entity per room in Room details.</p>
              <div class="form-group">
                <label class="form-label">Notification prefix (title)</label>
                <input type="text" class="form-input" id="notif-prefix" value="${this._escapeHtml((this._config?.notification_settings || {}).prefix || "Home Climate")}">
              </div>
            </div>
            <div class="settings-section-divider"></div>
            <div class="settings-section">
              <h4 class="settings-section-title">Event messages (prefix in title only, not in message)</h4>
              <p class="form-label" style="margin-bottom:8px;">Variables: {room_name}, {device_name}, {device_type}, {mode}, {temp}, {fan_mode}, {person_name}, {zone_name}</p>
              ${ttsEventKeys.map((key) => {
                const entry = (this._config?.notification_settings?.messages || {})[key] || { enabled: true, template: "" };
                return `
                <div class="tts-event-row notif-event-row" data-notif-key="${key}">
                  <label class="form-label" style="min-width:180px;">${labels[key] || key}</label>
                  <input type="text" class="form-input" data-field="template" value="${this._escapeHtml(entry.template || "")}" placeholder="e.g. {room_name} {device_name} turned on">
                  <label class="form-label" style="margin:0;">Enable</label>
                  <input type="checkbox" class="tts-toggle" data-field="enabled" ${entry.enabled !== false ? "checked" : ""}>
                </div>`;
              }).join("")}
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
        <div class="settings-section">
          <h4 class="settings-section-title">Room details</h4>
          <div class="form-group">
            <label class="form-label">Room name</label>
            <input type="text" class="form-input" data-field="name" value="${this._escapeHtml(room.name || "")}" placeholder="e.g. Bedroom">
          </div>
          <div class="form-group">
            <label class="form-label">Comfort temp (°F) – target for heating/cooling</label>
            <input type="number" class="form-input" data-field="comfort_temp_c" value="${this._cToF(room.comfort_temp_c ?? this._fToC(72))}" step="0.5" data-celsius>
          </div>
          <div class="form-group">
            <label class="form-label">Comfort tolerance (°F) – at/near = comfort ± this (0.5–2°C)</label>
            <input type="number" class="form-input" data-field="comfort_tolerance_c" value="${((room.comfort_tolerance_c ?? 1) * 9/5).toFixed(1)}" step="0.1" min="0.9" max="3.6" data-celsius-delta>
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
          <div class="form-group">
            <label class="form-label">Notify entity (for this room's notifications)</label>
            ${this._renderEntityDropdown(room.notify_entity || "", "notify", "notify_entity", "Select notify entity")}
          </div>
        </div>
        <div class="settings-section-divider"></div>
        <div class="settings-section">
          <h4 class="settings-section-title">HVAC Appliances</h4>
          <button class="btn-add" data-action="add-appliance" data-room-index="${index}">+ Add appliance</button>
          <div class="appliances-list">
            ${appliances.map((app, ai) => this._renderApplianceCard(room, app, ai, index, entities)).join("")}
          </div>
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
          <label class="form-label" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" data-field="is_smart_appliance" ${app.is_smart_appliance !== false ? "checked" : ""}>
            Smart appliance (climate entity) – uncheck for simple on/off switch
          </label>
        </div>
        ${(app.is_smart_appliance !== false) ? `
        <div class="form-group">
          <label class="form-label">Climate entity</label>
          ${this._renderEntityAutocomplete(app.climate_entity || "", "climate", "climate_entity", "e.g. climate.minisplit")}
        </div>
        ` : ""}
        <div class="settings-section-divider"></div>
        <div class="settings-section">
          <h4 class="settings-section-title">Turn on (enter zone)</h4>
          <div class="form-group">
            <label class="form-label">Person</label>
            ${this._renderEntityAutocomplete(auto.person_on || auto.person || "", "person", "person_on", "e.g. person.brandon")}
          </div>
          <div class="form-group">
            <label class="form-label">Zone</label>
            ${this._renderEntityAutocomplete(auto.zone_on || auto.zone || "", "zone", "zone_on", "e.g. zone.bedroom")}
          </div>
          <div class="form-group">
            <label class="form-label">Enter duration (sec)</label>
            <input type="number" class="form-input" data-field="enter_duration_sec" value="${auto.enter_duration_sec ?? 30}" min="0">
          </div>
        </div>
        <div class="settings-section-divider"></div>
        <div class="settings-section">
          <h4 class="settings-section-title">Turn off (leave zone)</h4>
          <div class="form-group">
            <label class="form-label">Person</label>
            ${this._renderEntityAutocomplete(auto.person_off || auto.person_on || auto.person || "", "person", "person_off", "e.g. person.brandon")}
          </div>
          <div class="form-group">
            <label class="form-label">Zone</label>
            ${this._renderEntityAutocomplete(auto.zone_off || auto.zone_on || auto.zone || "", "zone", "zone_off", "e.g. zone.living_room")}
          </div>
          <div class="form-group">
            <label class="form-label">Exit duration (sec)</label>
            <input type="number" class="form-input" data-field="exit_duration_sec" value="${auto.exit_duration_sec ?? 300}" min="0">
          </div>
        </div>
        <div class="settings-section-divider"></div>
        <div class="settings-section">
          <h4 class="settings-section-title">Automations</h4>
        <p class="form-label" style="margin-bottom:10px;opacity:0.85;">Optional: block heat in summer and cool in winter to save energy. Uncheck to allow when needed.</p>
        <div class="form-group">
          <label class="form-label" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" data-field="heat_automation_enabled" ${auto.heat_automation_enabled !== false ? "checked" : ""}>
            Heat when room temp below (°F)
          </label>
          <input type="number" class="form-input" data-field="heat_threshold_c" value="${this._cToF(auto.heat_threshold_c ?? this._fToC(64))}" step="0.5">
        </div>
        <div class="form-group">
          <label class="form-label" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" data-field="cool_automation_enabled" ${auto.cool_automation_enabled !== false ? "checked" : ""}>
            Cool when room temp above (°F)
          </label>
          <input type="number" class="form-input" data-field="cool_threshold_c" value="${this._cToF(auto.cool_threshold_c ?? this._fToC(79))}" step="0.5">
        </div>
        ${(app.is_smart_appliance !== false) ? `
        <div class="form-group">
          <label class="form-label" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" data-field="block_heat_in_summer" ${auto.block_heat_in_summer !== false ? "checked" : ""}>
            Block heat in summer (Jun–Aug)
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" data-field="block_cool_in_winter" ${auto.block_cool_in_winter !== false ? "checked" : ""}>
            Block cool in winter (Nov–Mar)
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" data-field="dry_automation_enabled" ${auto.dry_automation_enabled ? "checked" : ""}>
            Dehumidifier when room humidity above (%)
          </label>
          <input type="number" class="form-input" data-field="dry_humidity_threshold_pct" value="${auto.dry_humidity_threshold_pct ?? 60}" min="0" max="100" step="1">
        </div>
        <div class="form-group">
          <label class="form-label">No dehumidifier when temp below (°F)</label>
          <input type="number" class="form-input" data-field="dry_temp_min_c" value="${this._cToF(auto.dry_temp_min_c ?? this._fToC(64))}" step="0.5">
        </div>
        ` : ""}
        </div>
        <div class="settings-section-divider"></div>
        <div class="settings-section">
          <h4 class="settings-section-title">Power sensor (${app.is_smart_appliance !== false ? "optional override for on/off" : "required for simple appliance"})</h4>
          ${(app.is_smart_appliance !== false) ? `
          <div class="form-group">
            <label class="form-label" style="display:flex;align-items:center;gap:8px;">
              <input type="checkbox" data-field="power_sensor_enabled" ${(app.power_sensor || {}).enabled ? "checked" : ""}>
              Enable power sensor override
            </label>
          </div>
          ` : ""}
          <div class="form-group">
            <label class="form-label">Power sensor</label>
            ${this._renderEntityAutocomplete((app.power_sensor || {}).sensor || "", "sensor_switch", "power_sensor_sensor", "e.g. sensor.power_consumption")}
          </div>
          <div class="form-group">
            <label class="form-label">Switch (for on/off when override active)</label>
            ${this._renderEntityAutocomplete((app.power_sensor || {}).switch || "", "switch", "power_sensor_switch", "e.g. switch.hvac_power")}
          </div>
          <div class="form-group">
            <label class="form-label">Power threshold (W) – above = on</label>
            <input type="number" class="form-input" data-field="power_threshold_w" value="${(app.power_sensor || {}).power_threshold_w ?? 10}" min="0" step="0.5">
          </div>
          <div class="form-group">
            <label class="form-label">Debounce (seconds)</label>
            <input type="number" class="form-input" data-field="power_debounce_sec" value="${(app.power_sensor || {}).debounce_sec ?? 5}" min="1" max="60">
          </div>
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
      const notifyEl = row.querySelector("[data-field='notify_entity']");

      const appliances = [];
      const acards = root.querySelectorAll(`.appliance-card[data-room-index="${i}"]`);
      acards.forEach((acard) => {
        const climateEl = acard.querySelector("[data-field='climate_entity']");
        const deviceTypeEl = acard.querySelector("[data-field='device_type']");
        const customNameEl = acard.querySelector("[data-field='custom_name']");
        const personOnEl = acard.querySelector("[data-field='person_on']");
        const zoneOnEl = acard.querySelector("[data-field='zone_on']");
        const personOffEl = acard.querySelector("[data-field='person_off']");
        const zoneOffEl = acard.querySelector("[data-field='zone_off']");
        const enterEl = acard.querySelector("[data-field='enter_duration_sec']");
        const exitEl = acard.querySelector("[data-field='exit_duration_sec']");
        const isSmartEl = acard.querySelector("[data-field='is_smart_appliance']");
        const isSmart = isSmartEl?.checked !== false;
        const heatEnabledEl = acard.querySelector("[data-field='heat_automation_enabled']");
        const heatEl = acard.querySelector("[data-field='heat_threshold_c']");
        const coolEnabledEl = acard.querySelector("[data-field='cool_automation_enabled']");
        const coolEl = acard.querySelector("[data-field='cool_threshold_c']");
        const blockHeatSummerEl = acard.querySelector("[data-field='block_heat_in_summer']");
        const blockCoolWinterEl = acard.querySelector("[data-field='block_cool_in_winter']");
        const dryEnabledEl = acard.querySelector("[data-field='dry_automation_enabled']");
        const dryHumidityEl = acard.querySelector("[data-field='dry_humidity_threshold_pct']");
        const dryTempMinEl = acard.querySelector("[data-field='dry_temp_min_c']");
        const powerSensorEnabledEl = acard.querySelector("[data-field='power_sensor_enabled']");
        const powerSensorEl = acard.querySelector("[data-field='power_sensor_sensor']");
        const powerSwitchEl = acard.querySelector("[data-field='power_sensor_switch']");
        const powerThresholdEl = acard.querySelector("[data-field='power_threshold_w']");
        const powerDebounceEl = acard.querySelector("[data-field='power_debounce_sec']");

        const existingRoom = this._config?.rooms?.[i];
        const existingApps = existingRoom?.appliances || [];
        const existingApp = existingApps[appliances.length];

        const powerSensorConfig = {
          enabled: true,
          sensor: (powerSensorEl?.value || "").trim(),
          switch: (powerSwitchEl?.value || "").trim(),
          power_threshold_w: parseFloat(powerThresholdEl?.value) || 10,
          debounce_sec: Math.max(1, Math.min(60, parseInt(powerDebounceEl?.value, 10) || 5)),
        };
        const powerSensor = (!isSmart || powerSensorEnabledEl?.checked === true) ? powerSensorConfig : {};
        appliances.push({
          id: existingApp?.id || crypto.randomUUID(),
          device_type: deviceTypeEl?.value || "minisplit",
          custom_name: (customNameEl?.value || "").trim(),
          is_smart_appliance: isSmart,
          climate_entity: isSmart ? ((climateEl?.value || "").trim() || null) : null,
          automation: {
            person_on: (personOnEl?.value || "").trim(),
            zone_on: (zoneOnEl?.value || "").trim(),
            person_off: (personOffEl?.value || "").trim(),
            zone_off: (zoneOffEl?.value || "").trim(),
            enter_duration_sec: parseInt(enterEl?.value, 10) || 30,
            exit_duration_sec: parseInt(exitEl?.value, 10) || 300,
            heat_automation_enabled: heatEnabledEl?.checked !== false,
            heat_threshold_c: this._fToC(parseFloat(heatEl?.value)) || 18,
            cool_automation_enabled: coolEnabledEl?.checked !== false,
            cool_threshold_c: this._fToC(parseFloat(coolEl?.value)) || 26,
            block_heat_in_summer: blockHeatSummerEl?.checked !== false,
            block_cool_in_winter: blockCoolWinterEl?.checked !== false,
            dry_automation_enabled: dryEnabledEl?.checked === true,
            dry_humidity_threshold_pct: Math.max(0, Math.min(100, parseFloat(dryHumidityEl?.value) || 60)),
            dry_temp_min_c: this._fToC(parseFloat(dryTempMinEl?.value)) ?? 18,
            seasonal_mode: "outdoor_temp",
            outdoor_temp_sensor: "",
            date_winter_start: "11-01",
            date_winter_end: "03-31",
          },
          power_sensor: powerSensor,
        });
      });

      const comfortTempEl = row.querySelector("[data-field='comfort_temp_c']");
      const comfortToleranceEl = row.querySelector("[data-field='comfort_tolerance_c']");
      const comfortTempC = comfortTempEl ? this._fToC(parseFloat(comfortTempEl.value)) : 22;
      const comfortToleranceF = comfortToleranceEl ? parseFloat(comfortToleranceEl.value) : 1.8;
      const comfortToleranceC = Math.max(0.5, Math.min(2, (comfortToleranceF || 1.8) / 1.8));

      config.rooms.push({
        id: roomId,
        name,
        temp_sensor: (tempEl?.value || "").trim() || null,
        humidity_sensor: (humidityEl?.value || "").trim() || null,
        media_player: (mediaEl?.value || "").trim() || "",
        volume: parseFloat(volumeEl?.value) || 0.7,
        notify_entity: (notifyEl?.value || "").trim() || "",
        comfort_temp_c: comfortTempC,
        comfort_tolerance_c: comfortToleranceC,
        tts_overrides: {},
        appliances,
      });
    }

    const weatherEntityEl = root.querySelector("[data-field='weather_entity']");
    config.weather_entity = (weatherEntityEl?.value || "").trim();

    const ttsPrefixEl = root.querySelector("#tts-prefix");
    const ttsLangEl = root.querySelector("#tts-language");
    config.tts_settings = {
      ...config.tts_settings,
      prefix: ttsPrefixEl?.value || "Message from Home Climate.",
      language: (ttsLangEl?.value || "en").trim(),
      messages: {},
    };

    const ttsEventKeys = ["manual_on", "manual_off", "mode_change", "temp_change", "presence_enter", "presence_leave", "fan_change", "auto_mode_change", "comfort_adjusted", "comfort_revert", "seasonal_blocked"];
    ttsEventKeys.forEach((key) => {
      const row = root.querySelector(`[data-tts-key="${key}"]`);
      const templateEl = row?.querySelector("[data-field='template']");
      const enabledEl = row?.querySelector("[data-field='enabled']");
      config.tts_settings.messages[key] = {
        template: (templateEl?.value || "").trim(),
        enabled: enabledEl?.checked !== false,
      };
    });

    const notifPrefixEl = root.querySelector("#notif-prefix");
    const notifEnabledEl = root.querySelector("#notif-enabled");
    config.notification_settings = {
      ...(config.notification_settings || {}),
      enabled: notifEnabledEl?.checked !== false,
      prefix: notifPrefixEl?.value || "Home Climate",
      messages: config.notification_settings?.messages || {},
    };
    ttsEventKeys.forEach((key) => {
      const row = root.querySelector(`[data-notif-key="${key}"]`);
      const templateEl = row?.querySelector("[data-field='template']");
      const enabledEl = row?.querySelector("[data-field='enabled']");
      config.notification_settings.messages[key] = {
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

if (!customElements.get("home-climate-panel")) {
  customElements.define("home-climate-panel", HomeWeatherPanel);
}
