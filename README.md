# Home Weather

Climate monitoring and automation for Home Assistant. A beautiful dashboard to monitor room temperatures and humidity, with configurable automation for heating, cooling, presence-based control, and TTS announcements.

## Features

- **Zero-config setup** – Add the integration and the panel appears in your sidebar
- **Room-based dashboard** – Map climate entities, temperature, and humidity sensors per room
- **Climate automation** – Threshold-based heat/cool with seasonal logic (outdoor temp or date-based)
- **Presence control** – Turn climate on when a person enters a zone, off when they leave
- **TTS alerts** – Customizable announcements on mode changes and presence events
- **Admin-only settings** – Full configuration visible only to HA admin users

## Installation

### HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Go to **Integrations** → **Explore & Download Repositories**
3. Search for **Home Weather**
4. Click **Download**
5. Restart Home Assistant
6. Go to **Settings** → **Devices & Services** → **Add Integration** → search for **Home Weather**

### Manual

1. Copy the `custom_components/home_weather` folder into your Home Assistant `custom_components` directory
2. Restart Home Assistant
3. Go to **Settings** → **Devices & Services** → **Add Integration** → search for **Home Weather**

## Configuration

Add the integration and the **Home Weather** panel will appear in your sidebar. Configure rooms, automation thresholds, presence rules, and TTS via the settings gear (admin only).

## Links

- [Documentation](https://github.com/zodyking/Home-Climate)
- [Issue Tracker](https://github.com/zodyking/Home-Climate/issues)
