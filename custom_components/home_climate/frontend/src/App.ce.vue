<script>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import RoomCard from "./components/RoomCard.vue";
import SettingsView from "./components/SettingsView.vue";

export default {
  name: "HomeClimatePanel",
  components: { RoomCard, SettingsView },
  props: {
    hass: { type: Object, default: null },
    panel: { type: Object, default: null },
  },
  setup(props) {
    const config = ref(null);
    const dashboardData = ref(null);
    const isAdmin = ref(false);
    const showSettings = ref(false);
    const settingsTab = ref("rooms");
    const entities = ref({
      climate: [],
      sensors: [],
      persons: [],
      zones: [],
      media_players: [],
    });
    const loading = ref(true);
    const error = ref(null);
    const headerTime = ref("--:--");
    const headerDate = ref("");
    let refreshInterval = null;
    let clockInterval = null;

    const rooms = computed(() => {
      const data = dashboardData.value?.rooms || config.value?.rooms || [];
      return data;
    });

    async function loadConfig() {
      if (!props.hass) return;
      loading.value = true;
      error.value = null;

      try {
        const [configRes, userRes, entitiesRes] = await Promise.all([
          props.hass.callWS({ type: "home_climate/get_config" }),
          props.hass.callWS({ type: "home_climate/get_user_info" }).catch(() => ({ is_admin: false })),
          props.hass.callWS({ type: "home_climate/get_entities" }).catch(() => ({
            climate: [],
            sensors: [],
            persons: [],
            zones: [],
            media_players: [],
          })),
        ]);
        config.value = configRes || {};
        isAdmin.value = userRes?.is_admin === true;
        entities.value = entitiesRes || { climate: [], sensors: [], persons: [], zones: [], media_players: [] };
        await loadDashboardData();
        loading.value = false;
        startRefresh();
      } catch (e) {
        console.error("Home Climate load config error:", e);
        loading.value = false;
        error.value = e?.message || "Failed to load";
      }
    }

    async function loadDashboardData() {
      if (!props.hass || showSettings.value) return;
      try {
        const res = await props.hass.callWS({ type: "home_climate/get_dashboard_data" });
        dashboardData.value = res;
      } catch (e) {
        console.error("Home Climate dashboard data error:", e);
      }
    }

    async function setClimateAndAnnounce(entityId, service, hvacMode, roomName) {
      if (!props.hass || !entityId) return;
      try {
        await props.hass.callWS({
          type: "home_climate/set_climate_and_announce",
          entity_id: entityId,
          service,
          hvac_mode: hvacMode,
          room_name: roomName,
        });
        await loadDashboardData();
      } catch (e) {
        console.error("Climate set-and-announce error:", e);
      }
    }

    function startRefresh() {
      stopRefresh();
      refreshInterval = setInterval(loadDashboardData, 15000);
    }

    function stopRefresh() {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    }

    function updateClock() {
      const now = new Date();
      headerTime.value = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      headerDate.value = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    }

    function addRoom() {
      config.value = config.value || {};
      config.value.rooms = config.value.rooms || [];
      config.value.rooms.push({
        id: crypto.randomUUID(),
        name: "",
        climate_entity: "",
        temp_sensor: "",
        humidity_sensor: "",
      });
    }

    function addPresenceRule() {
      config.value = config.value || {};
      config.value.presence_rules = config.value.presence_rules || [];
      config.value.presence_rules.push({
        person: "",
        zone: "",
        climate_entity: "",
        enter_duration_sec: 30,
        exit_duration_sec: 300,
      });
    }

    watch(props, (next) => {
      if (next.hass && !config.value) loadConfig();
    });

    onMounted(() => {
      updateClock();
      clockInterval = setInterval(updateClock, 1000);
      loadConfig();
    });

    onUnmounted(() => {
      stopRefresh();
      if (clockInterval) clearInterval(clockInterval);
    });

    return {
      config,
      dashboardData,
      isAdmin,
      showSettings,
      settingsTab,
      entities,
      loading,
      error,
      rooms,
      headerTime,
      headerDate,
      loadConfig,
      loadDashboardData,
      setClimateAndAnnounce,
      handleSave,
    };
  },
};
</script>

<template>
  <div class="panel-container">
    <header class="panel-header">
      <div class="header-left">
        <h1 class="panel-title">Home Climate</h1>
        <button
          v-if="isAdmin"
          class="settings-btn"
          aria-label="Settings"
          title="Settings"
          @click="showSettings = !showSettings"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
            />
          </svg>
        </button>
      </div>
      <div class="header-datetime">
        <span class="header-time">{{ headerTime }}</span>
        <span class="header-date">{{ headerDate }}</span>
      </div>
    </header>

    <div v-if="loading" class="loading">
      <div class="loading-spinner" aria-hidden="true"></div>
      Loading...
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <SettingsView
      v-else-if="showSettings"
      :config="config"
      :entities="entities"
      :settings-tab="settingsTab"
      :hass="hass"
      @update:settings-tab="settingsTab = $event"
      @close="showSettings = false"
      @save="handleSave"
    />

    <div v-else-if="rooms.length === 0" class="empty-state">
      <svg class="empty-illustration" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M60 20L20 55v45h30V70h20v30h30V55z" />
        <circle cx="60" cy="45" r="8" />
      </svg>
      <p>No rooms configured.</p>
      <p>
        {{ isAdmin ? "Open Settings to add rooms and map climate entities." : "Contact an admin to configure rooms." }}
      </p>
    </div>

    <div v-else class="rooms-grid">
      <RoomCard
        v-for="room in rooms"
        :key="room.id || room.name"
        :room="room"
        @set-climate="setClimateAndAnnounce"
      />
    </div>
  </div>
</template>

<style>
:host {
  display: block;
  height: 100%;
  background: linear-gradient(165deg, #060d18 0%, #0a1628 35%, #0e2942 70%, #132f4c 100%);
  color: #e8eef3;
  font-family: "Inter", "Roboto", "Segoe UI", -apple-system, sans-serif;
  --accent: #5b8def;
  --accent-hover: #7aa3f5;
  --accent-dim: rgba(91, 141, 239, 0.18);
  --card-bg: rgba(13, 30, 55, 0.65);
  --card-border: rgba(255, 255, 255, 0.06);
  --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}
* {
  box-sizing: border-box;
}
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
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
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
/* RoomCard + SettingsView styles (inherited by children in shadow root) */
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
.settings-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.settings-tab {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: rgba(225, 232, 237, 0.7);
  cursor: pointer;
  border-radius: 8px;
  font-size: 13px;
}
.settings-tab:hover {
  background: rgba(255, 255, 255, 0.05);
}
.settings-tab.active {
  background: var(--accent);
  color: #fff;
}
.settings-tab-content {
  display: block;
}
.settings-card {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--card-border);
  padding: 20px;
  margin-bottom: 16px;
}
.settings-card h3 {
  margin: 0 0 16px;
  font-size: 14px;
}
.form-group {
  margin-bottom: 14px;
}
.form-label {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
  opacity: 0.9;
}
.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: rgba(0, 0, 0, 0.2);
  color: inherit;
  font-size: 13px;
}
.form-select {
  cursor: pointer;
}
.btn-save {
  margin-top: 16px;
  padding: 10px 20px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}
.btn-save:hover {
  background: var(--accent-hover);
}
.btn-add {
  padding: 8px 14px;
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 12px;
}
.btn-add:hover {
  background: rgba(91, 141, 239, 0.25);
}
.rule-row,
.room-row {
  padding: 12px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  margin-bottom: 10px;
}
</style>
