/**
 * Home Climate Panel - Vue 3 custom element entry
 * Registers the panel for Home Assistant
 */
import { defineCustomElement } from "vue";
import App from "./App.ce.vue";

const HomeClimatePanel = defineCustomElement(App);
customElements.define("home-climate-panel", HomeClimatePanel);
