# YouTube Adblocker By Lokesh.R

A high-performance Chrome extension that blocks **all ads** on YouTube and YouTube Music while ensuring videos start playing **instantly** — no ad delays, no buffering stalls, and no anti-adblock popups.

---

## Features

- **Instant Video Playback** — Videos start immediately with zero ad delay
- **Complete Ad Removal** — Blocks video ads, banner ads, overlay ads, sponsored cards, and merchandise shelves
- **YouTube Music Support** — Also blocks ads on `music.youtube.com`
- **Anti-Adblock Bypass** — Automatically removes YouTube's "Ad blockers violate YouTube's Terms of Service" popup
- **User Pause Respect** — Smart detection distinguishes user pauses from auto-pauses
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
- `JSON.parse` — strips ad keys from all parsed responses
- `fetch` and `XMLHttpRequest` — cleans ad data from `/youtubei/v1/player` API
- Player internals — disables ad modules (`ad`, `ads`, `ad3`)

### Layer 3 — DOM & Player Control (`content.js`)
- **CSS Shield** — Hides 100+ ad-related selectors instantly
- **20ms Reaction Loop** — Constantly checks for ads and skips them
- **Auto-Click Skip** — Clicks skip buttons the moment they appear
- **MutationObserver** — Reacts instantly to DOM changes

---

## Installation

### Method 1 — Load Unpacked (Developer Mode)

1. **Download** or clone this repository:
   ```bash
   git clone https://github.com/Lokesh0336/Youtube-Ad-Blocker-By-Lokesh.git
