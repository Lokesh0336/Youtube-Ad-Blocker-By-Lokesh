/* ============================================================
 *  YouTube Adblocker By Lokesh.R
 *  ------------------------------------------------------------
 *  Author   : Lokesh.R
 *  GitHub   : https://github.com/Lokesh0336
 *  Project  : https://github.com/Lokesh0336/Youtube-Ad-Blocker-By-Lokesh
 *  Version  : 13.0.0
 *  License  : MIT
 *  ------------------------------------------------------------
 *  © 2026 Lokesh.R — All Rights Reserved
 *  Unauthorized removal of this watermark is prohibited.
 * ============================================================ */
(function () {
    'use strict';

    // =========================================================
    // Ad key list — everything YouTube uses to schedule ads
    // =========================================================
    const AD_KEYS = [
        'adPlacements', 'playerAds', 'adSlots', 'adFlags', 'adsConfig',
        'adBreakHeartbeatParams', 'adBreakServiceRenderer', 'adOnesieRenderer',
        'adParams', 'adSafetyReason', 'adThumbnail', 'adTracking', 'adVideos',
        'displayAd', 'instreamAd', 'midrollAd', 'prerollAd', 'postrollAd',
        'adBreakParams', 'adBreakService', 'playerAdParams', 'ad3ModuleConfig',
        'adClientParams', 'adDeviceParams', 'adFormats', 'adLayouts',
        'adBreakRenderer', 'adSlotLoggingData', 'serverSideAdConfig'
    ];

    function cleanObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) obj[i] = cleanObject(obj[i]);
            return obj;
        }
        for (let i = 0; i < AD_KEYS.length; i++) {
            const key = AD_KEYS[i];
            if (key in obj) {
                const val = obj[key];
                if (key === 'adFlags' || key === 'adParams') obj[key] = 0;
                else if (Array.isArray(val)) obj[key] = [];
                else if (typeof val === 'object' && val !== null) obj[key] = {};
                else obj[key] = null;
            }
        }
        if (obj.playerConfig) {
            obj.playerConfig.adSelectionConfig = {};
            if (obj.playerConfig.adConfig) obj.playerConfig.adConfig = {};
        }
        if (obj.playbackContext) {
            if (obj.playbackContext.contentPlaybackContext) {
                obj.playbackContext.contentPlaybackContext = {
                    ...obj.playbackContext.contentPlaybackContext,
                    signatureTimestamp: 19000
                };
            }
            if (obj.playbackContext.adPlaybackContext) {
                delete obj.playbackContext.adPlaybackContext;
            }
        }
        if (obj.streamingData && obj.streamingData.adPlacements) {
            obj.streamingData.adPlacements = [];
        }
        if (obj.responseContext && obj.responseContext.adParams) {
            delete obj.responseContext.adParams;
        }
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                obj[key] = cleanObject(obj[key]);
            }
        }
        return obj;
    }

    // =========================================================
    // 1. HOOK ytInitialPlayerResponse (setter + getter)
    // =========================================================
    let _playerResponse;
    try {
        Object.defineProperty(window, 'ytInitialPlayerResponse', {
            configurable: true,
            get: function () { return _playerResponse; },
            set: function (v) { _playerResponse = cleanObject(v); }
        });
    } catch (e) {}

    let _initialData;
    try {
        Object.defineProperty(window, 'ytInitialData', {
            configurable: true,
            get: function () { return _initialData; },
            set: function (v) { _initialData = cleanObject(v); }
        });
    } catch (e) {}

    // =========================================================
    // 2. HOOK JSON.parse
    // =========================================================
    const nativeParse = JSON.parse;
    JSON.parse = function () {
        const result = nativeParse.apply(this, arguments);
        try { return cleanObject(result); } catch (e) { return result; }
    };

    // =========================================================
    // 3. HOOK fetch — preserve original response properties
    // =========================================================
    const nativeFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await nativeFetch.apply(this, args);
        try {
            const url = typeof args[0] === 'string'
                ? args[0]
                : (args[0] && args[0].url) || '';
            if (url.indexOf('/youtubei/v1/player') !== -1 ||
                url.indexOf('/youtubei/v1/next') !== -1 ||
                url.indexOf('/youtubei/v1/browse') !== -1 ||
                url.indexOf('/youtubei/v1/search') !== -1 ||
                url.indexOf('/youtubei/v1/reel') !== -1) {
                const clone = response.clone();
                const text = await clone.text();
                let json;
                try { json = nativeParse(text); } catch (e) { return response; }
                const cleaned = cleanObject(json);
                const newResponse = new Response(JSON.stringify(cleaned), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
                // Preserve important properties
                try {
                    Object.defineProperty(newResponse, 'url', { value: response.url });
                    Object.defineProperty(newResponse, 'redirected', { value: response.redirected });
                    Object.defineProperty(newResponse, 'type', { value: response.type });
                } catch (e) {}
                return newResponse;
            }
        } catch (e) {}
        return response;
    };

    // =========================================================
    // 4. HOOK XMLHttpRequest
    // =========================================================
    const nativeOpen = XMLHttpRequest.prototype.open;
    const nativeSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._abUrl = url;
        return nativeOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
        const self = this;
        const url = self._abUrl || '';
        if (url.indexOf('/youtubei/v1/player') !== -1 ||
            url.indexOf('/youtubei/v1/next') !== -1 ||
            url.indexOf('/youtubei/v1/browse') !== -1 ||
            url.indexOf('/youtubei/v1/search') !== -1) {
            self.addEventListener('readystatechange', function () {
                if (self.readyState === 4) {
                    try {
                        const cleaned = cleanObject(nativeParse(self.responseText));
                        const str = JSON.stringify(cleaned);
                        Object.defineProperty(self, 'responseText', {
                            value: str, writable: false, configurable: true
                        });
                        Object.defineProperty(self, 'response', {
                            value: str, writable: false, configurable: true
                        });
                    } catch (e) {}
                }
            });
        }
        return nativeSend.apply(this, arguments);
    };

    // =========================================================
    // 5. DISABLE ad modules on the player
    // =========================================================
    function hookPlayer() {
        const player = document.getElementById('movie_player') ||
                       document.querySelector('ytmusic-player') ||
                       document.querySelector('.html5-video-player');
        if (!player || player._abHooked) return;
        player._abHooked = true;

        try {
            const origLoad = player.loadModule;
            if (origLoad) {
                player.loadModule = function (name) {
                    if (name === 'ad' || name === 'ads' || name === 'ad3' ||
                        name === 'adsense' || name === 'advertising') return;
                    return origLoad.apply(this, arguments);
                };
            }
        } catch (e) {}

        try {
            const origAdd = player.addEventListener;
            player.addEventListener = function (type, listener, options) {
                if (type === 'onAdStart' || type === 'onAdEnd' ||
                    type === 'onAdStateChange' || type === 'onAdProgress') return;
                return origAdd.apply(this, arguments);
            };
        } catch (e) {}

        try {
            if (player.getConfig) {
                const cfg = player.getConfig();
                if (cfg && cfg.args) {
                    cfg.args.ad_flags = 0;
                    cfg.args.ad3_module = 0;
                    cfg.args.ad_config = '';
                    cfg.args.vss_host = '';
                }
            }
        } catch (e) {}
    }

    setInterval(hookPlayer, 500);
    window.addEventListener('yt-navigate-finish', hookPlayer, true);

    console.log('[PRO-BLOCKER] Inject v13 loaded.');
})();