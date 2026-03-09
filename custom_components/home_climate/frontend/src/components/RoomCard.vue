<script>
const HVAC_LABELS = { heating: "Heating", cooling: "Cooling", idle: "Idle", off: "Off" };

export default {
  name: "RoomCard",
  props: {
    room: { type: Object, required: true },
  },
  emits: ["set-climate"],
  setup(props, { emit }) {
    function hvacActionLabel(action) {
      return HVAC_LABELS[action] || action || "—";
    }

    function setClimate(service, hvacMode) {
      emit("set-climate", props.room.climate_entity, service, hvacMode, props.room.name || "Room");
    }

    return { hvacActionLabel, setClimate };
  },
};
</script>

<template>
  <div class="room-card">
    <h3 class="room-name">{{ room.name || "Room" }}</h3>
    <div class="room-stats">
      <div class="room-stat">
        <svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2v-6z"
          />
        </svg>
        <div class="room-stat-inner">
          <span class="room-stat-value">{{ room.temp != null ? room.temp.toFixed(1) : "—" }}</span>
          <span class="room-stat-unit">°C</span>
        </div>
      </div>
      <div class="room-stat">
        <svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
        <div class="room-stat-inner">
          <span class="room-stat-value">{{ room.humidity != null ? room.humidity.toFixed(0) : "—" }}</span>
          <span class="room-stat-unit">%</span>
        </div>
      </div>
    </div>
    <div class="room-state-row">
      <span v-if="room.target_temp != null" class="state-badge">Target: {{ room.target_temp.toFixed(0) }} °C</span>
      <span v-if="room.hvac_action" class="state-badge state-action">{{ hvacActionLabel(room.hvac_action) }}</span>
      <span v-if="room.fan_mode" class="state-badge state-fan">Fan: {{ room.fan_mode }}</span>
    </div>
    <div v-if="room.climate_entity" class="room-controls">
      <button
        class="ctrl-btn"
        :class="{ active: room.climate_mode && room.climate_mode !== 'off' }"
        @click="setClimate('turn_on', 'on')"
      >
        <svg class="ctrl-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
          />
        </svg>
        <span>ON</span>
      </button>
      <button
        class="ctrl-btn"
        :class="{ active: room.climate_mode === 'heat' }"
        @click="setClimate('set_hvac_mode', 'heat')"
      >
        <svg class="ctrl-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M13.5 1.67c.74 0 1.33.6 1.33 1.33 0 .67-.47 1.2-1.1 1.32L12 4.5 9.6 4.08c-.63-.12-1.1-.65-1.1-1.32 0-.73.59-1.33 1.33-1.33H13.5zM6 22.67c0 .73.59 1.33 1.33 1.33h9.34c.74 0 1.33-.6 1.33-1.33V12h-12v10.67zM14 14v6.67h-4V14h4z"
          />
        </svg>
        <span>HEAT</span>
      </button>
      <button
        class="ctrl-btn"
        :class="{ active: room.climate_mode === 'cool' }"
        @click="setClimate('set_hvac_mode', 'cool')"
      >
        <svg class="ctrl-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22 11h-4.17l3.24-3.24-1.41-1.41L16 9.34V5h-2v4.34l-3.83-3.83-1.41 1.41L10.17 11H6v2h4.17l-3.24 3.24 1.41 1.41L14 14.66V19h2v-4.34l3.83 3.83 1.41-1.41L17.83 13H22z"
          />
        </svg>
        <span>COOL</span>
      </button>
      <button
        class="ctrl-btn"
        :class="{ active: room.climate_mode === 'off' }"
        @click="setClimate('turn_off', 'off')"
      >
        <svg class="ctrl-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M18 14.49V9c0-1.1-.9-2-2-2h-3.15l-1.6-1.6L10 7h4v2H6v2h8v2H6v2h8v2H6v2h10c1.1 0 2-.9 2-2v-5.51l2 2z"
          />
        </svg>
        <span>OFF</span>
      </button>
    </div>
  </div>
</template>
