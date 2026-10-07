<!--
  ============================================================
   YouTube Adblocker By Lokesh.R
   Author : Lokesh.R
   GitHub : https://github.com/Lokesh0336
   © 2026 Lokesh.R — All Rights Reserved
  ============================================================
-->

# YouTube Adblocker By Lokesh.R

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/version-13.0.0-blue.svg)
![Chrome](https://img.shields.io/badge/Chrome-111%2B-green.svg)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange.svg)

A high-performance Chrome extension that blocks **all ads** on YouTube and YouTube Music while ensuring videos start playing **instantly** — with smooth transitions and no anti-adblock popups.

---

## Features

- **Instant Video Playback** — No ad delays, no buffering stalls
- **Complete Ad Removal** — Video ads, banner ads, overlay ads, sponsored cards, merchandise shelves
- **YouTube Music Support** — Blocks ads on `music.youtube.com`
- **Anti-Adblock Bypass** — Removes YouTube's "Ad blockers violate Terms of Service" popup
- **Smooth Video Transitions** — No black screen between videos
- **User Pause Respect** — Auto-resume works only when you didn't pause manually
- **Three-Layer Defense** — Network blocking + Data interception + DOM control

---

## How It Works

This extension uses a **three-layer ad prevention system**:

### Layer 1 — Network Blocking (`rules.json`)
Blocks requests to known ad servers before they leave your browser:
- `doubleclick.net`
- `googlesyndication.com`
- `googleadservices.com`
- `/pagead/`, `/ptracking`, `/get_midroll_` endpoints

### Layer 2 — Data Interception (`inject.js`)
Runs in YouTube's MAIN world and intercepts:
- `JSON.parse` — strips ad keys from parsed responses
- `fetch` and `XMLHttpRequest` — cleans ad data from `/youtubei/v1/player` API
- Player internals — disables ad modules (`ad`, `ads`, `ad3`)

### Layer 3 — DOM & Player Control (`content.js`)
- **CSS Shield** — Hides 100+ ad-related selectors instantly
- **Ad-Kill Loop** — Runs fast only while an ad is active
- **Auto-Click Skip** — Clicks skip buttons the moment they appear
- **MutationObserver** — Reacts instantly to player state changes

---

## Installation

### Load Unpacked (Developer Mode)

1. **Clone** this repository:
   ```bash
   git clone https://github.com/Lokesh0336/Youtube-Ad-Blocker-By-Lokesh.git