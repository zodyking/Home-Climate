<script>
import { ref, computed, watch } from "vue";

export default {
  name: "SettingsView",
  props: {
    config: { type: Object, default: () => ({}) },
    entities: { type: Object, default: () => ({}) },
    settingsTab: { type: String, default: "rooms" },
    hass: { type: Object, default: null },
  },
  emits: ["update:settingsTab", "close", "save"],
  setup(props, { emit }) {
    const localRooms = ref([]);
    const localAutomation = ref({});
    const localPresenceRules = ref([]);
    const localTts = ref({});

    function initFromConfig() {
      const c = props.config || {};
      localRooms.value = (c.rooms || []).map((r) => ({ ...r }));
      const auto = c.automation || {};
      localAutomation.value = {
        heat_threshold_c: auto.heat_threshold_c ?? 18,
        cool_threshold_c: auto.cool_threshold_c ?? 26,
        seasonal_mode: auto.seasonal_mode || "outdoor_temp",
        outdoor_temp_sensor: auto.outdoor_temp_sensor || "",
        date_winter_start: auto.date_winter_start || "11-01",
        date_winter_end: auto.date_winter_end || "03-31",
      };
      localPresenceRules.value = (c.presence_rules || []).map((r) => ({ ...r }));
      const tts = c.tts_settings || {};
      localTts.value = {
        media_player: tts.media_player || "",
        prefix: tts.prefix || "Message from Home Climate.",
        volume: tts.volume ?? 0.7,
      };
    }

    watch(
      () => props.config,
      (c) => {
        if (c) initFromConfig();
      },
      { immediate: true, deep: true }
    );

    function addRoom() {
      localRooms.value.push({
        id: crypto.randomUUID(),
        name: "",
        climate_entity: "",
        temp_sensor: "",
        humidity_sensor: "",
      });
    }

    function addPresenceRule() {
      localPresenceRules.value.push({
        person: "",
        zone: "",
        climate_entity: "",
        enter_duration_sec: 30,
        exit_duration_sec: 300,
      });
    }

    const tempSensors = computed(() =>
      (props.entities.sensors || []).filter(
        (s) => (s.unit || "").includes("°") || (s.unit || "").toLowerCase().includes("c")
      )
    );

    function buildConfig() {
      const rooms = localRooms.value.filter((r) => (r.name || "").trim());
      return {
        rooms: rooms.map((r) => ({
          id: r.id || crypto.randomUUID(),
          name: (r.name || "").trim(),
          climate_entity: r.climate_entity || null,
          temp_sensor: r.temp_sensor || null,
          humidity_sensor: r.humidity_sensor || null,
        })),
        automation: {
          heat_threshold_c: parseFloat(localAutomation.value.heat_threshold_c) || 18,
          cool_threshold_c: parseFloat(localAutomation.value.cool_threshold_c) || 26,
          seasonal_mode: localAutomation.value.seasonal_mode || "outdoor_temp",
          outdoor_temp_sensor: localAutomation.value.outdoor_temp_sensor || "",
          date_winter_start: localAutomation.value.date_winter_start || "11-01",
          date_winter_end: localAutomation.value.date_winter_end || "03-31",
        },
        presence_rules: localPresenceRules.value
          .filter((r) => r.person && r.zone && r.climate_entity)
          .map((r) => ({
            person: r.person,
            zone: r.zone,
            climate_entity: r.climate_entity,
            enter_duration_sec: parseInt(r.enter_duration_sec, 10) || 30,
            exit_duration_sec: parseInt(r.exit_duration_sec, 10) || 300,
          })),
        tts_settings: {
          media_player: localTts.value.media_player || "",
          prefix: localTts.value.prefix || "Message from Home Climate.",
          volume: parseFloat(localTts.value.volume) || 0.7,
        },
      };
    }

    async function doSave() {
      const newConfig = buildConfig();
      emit("save", newConfig);
    }

    return {
      localRooms,
      localAutomation,
      localPresenceRules,
      localTts,
      tempSensors,
      addRoom,
      addPresenceRule,
      doSave,
    };
  },
};
</script>

<template>
  <div class="settings-view">
    <div class="settings-tabs">
      <button
        v-for="tab in ['rooms', 'automation', 'presence', 'tts']"
        :key="tab"
        class="settings-tab"
        :class="{ active: settingsTab === tab }"
        :data-tab="tab"
        @click="$emit('update:settingsTab', tab)"
      >
        {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
      </button>
    </div>

    <div v-show="settingsTab === 'rooms'" class="settings-tab-content">
      <div class="settings-card">
        <h3>Rooms</h3>
        <button class="btn-add" @click="addRoom">+ Add Room</button>
        <div v-for="(room, i) in localRooms" :key="room.id || i" class="room-row">
          <div class="form-group">
            <label class="form-label">Room name</label>
            <input v-model="room.name" type="text" class="form-input" placeholder="e.g. Bedroom" />
          </div>
          <div class="form-group">
            <label class="form-label">Climate entity</label>
            <select v-model="room.climate_entity" class="form-select">
              <option value="">— None —</option>
              <option v-for="c in (entities.climate || [])" :key="c.entity_id" :value="c.entity_id">
                {{ c.friendly_name || c.entity_id }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Temp sensor</label>
            <select v-model="room.temp_sensor" class="form-select">
              <option value="">— None —</option>
              <option v-for="s in (entities.sensors || [])" :key="s.entity_id" :value="s.entity_id">
                {{ s.friendly_name || s.entity_id }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Humidity sensor</label>
            <select v-model="room.humidity_sensor" class="form-select">
              <option value="">— None —</option>
              <option v-for="s in (entities.sensors || [])" :key="s.entity_id" :value="s.entity_id">
                {{ s.friendly_name || s.entity_id }}
              </option>
            </select>
          </div>
        </div>
        <p v-if="localRooms.length === 0" style="opacity: 0.7">No rooms. Add a room to map climate entities.</p>
      </div>
    </div>

    <div v-show="settingsTab === 'automation'" class="settings-tab-content">
      <div class="settings-card">
        <h3>Thresholds & Seasonal Logic</h3>
        <div class="form-group">
          <label class="form-label">Heat below (°C)</label>
          <input v-model.number="localAutomation.heat_threshold_c" type="number" class="form-input" step="0.5" min="5" max="35" />
        </div>
        <div class="form-group">
          <label class="form-label">Cool above (°C)</label>
          <input v-model.number="localAutomation.cool_threshold_c" type="number" class="form-input" step="0.5" min="15" max="40" />
        </div>
        <div class="form-group">
          <label class="form-label">Seasonal mode</label>
          <select v-model="localAutomation.seasonal_mode" class="form-select">
            <option value="outdoor_temp">Outdoor temperature</option>
            <option value="date">Date-based</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Outdoor temp sensor</label>
          <select v-model="localAutomation.outdoor_temp_sensor" class="form-select">
            <option value="">— None —</option>
            <option v-for="s in tempSensors" :key="s.entity_id" :value="s.entity_id">
              {{ s.friendly_name || s.entity_id }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Winter start (MM-DD)</label>
          <input v-model="localAutomation.date_winter_start" type="text" class="form-input" placeholder="11-01" />
        </div>
        <div class="form-group">
          <label class="form-label">Winter end (MM-DD)</label>
          <input v-model="localAutomation.date_winter_end" type="text" class="form-input" placeholder="03-31" />
        </div>
      </div>
    </div>

    <div v-show="settingsTab === 'presence'" class="settings-tab-content">
      <div class="settings-card">
        <h3>Presence Rules (turn on when entering, off when exiting)</h3>
        <button class="btn-add" @click="addPresenceRule">+ Add Rule</button>
        <div v-for="(rule, i) in localPresenceRules" :key="i" class="rule-row">
          <div class="form-group">
            <label class="form-label">Person</label>
            <select v-model="rule.person" class="form-select">
              <option value="">— Select —</option>
              <option v-for="p in (entities.persons || [])" :key="p.entity_id" :value="p.entity_id">
                {{ p.friendly_name || p.entity_id }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Zone</label>
            <select v-model="rule.zone" class="form-select">
              <option value="">— Select —</option>
              <option v-for="z in (entities.zones || [])" :key="z.entity_id" :value="z.entity_id">
                {{ z.friendly_name || z.entity_id }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Climate entity</label>
            <select v-model="rule.climate_entity" class="form-select">
              <option value="">— Select —</option>
              <option v-for="c in (entities.climate || [])" :key="c.entity_id" :value="c.entity_id">
                {{ c.friendly_name || c.entity_id }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Enter duration (sec)</label>
            <input v-model.number="rule.enter_duration_sec" type="number" class="form-input" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Exit duration (sec)</label>
            <input v-model.number="rule.exit_duration_sec" type="number" class="form-input" min="0" />
          </div>
        </div>
      </div>
    </div>

    <div v-show="settingsTab === 'tts'" class="settings-tab-content">
      <div class="settings-card">
        <h3>TTS Settings</h3>
        <div class="form-group">
          <label class="form-label">Media player</label>
          <select v-model="localTts.media_player" class="form-select">
            <option value="">— None —</option>
            <option v-for="m in (entities.media_players || [])" :key="m.entity_id" :value="m.entity_id">
              {{ m.friendly_name || m.entity_id }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Prefix</label>
          <input v-model="localTts.prefix" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Volume (0-1)</label>
          <input v-model.number="localTts.volume" type="number" class="form-input" step="0.1" min="0" max="1" />
        </div>
      </div>
    </div>

    <div style="margin-top: 20px">
      <button class="btn-save" @click="doSave">Save All</button>
      <button class="ctrl-btn" style="margin-left: 12px" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>
