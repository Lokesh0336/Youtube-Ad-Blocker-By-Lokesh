(function () {
    'use strict';

    const LOG_PREFIX = '[PRO-BLOCKER]';

    // =========================================================
    // 1. JSON.parse INTERCEPTOR — strip all ad data
    // =========================================================
    const AD_KEYS = [
        'adPlacements',
        'playerAds',
        'adSlots',
        'adFlags',
        'adsConfig',
        'adBreakHeartbeatParams',
        'adBreakServiceRenderer',
        'adOnesieRenderer',
        'adParams',
        'adSafetyReason',
        'adThumbnail',
        'adTracking',
        'adVideos',
        'displayAd',
        'instreamAd',
        'midrollAd',
        'prerollAd',
        'postrollAd',
        'adBreakParams',
        'adBreakService',
        'playerAdParams',
        'ad3ModuleConfig',
        'adClientParams',
        'adDeviceParams',
        'adFormats',
        'adLayouts'
    ];

    function cleanObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                obj[i] = cleanObject(obj[i]);
            }
            return obj;
        }

        for (const key of AD_KEYS) {
            if (key in obj) {
                if (key === 'adFlags' || key === 'adParams') {
                    obj[key] = 0;
                } else if (Array.isArray(obj[key])) {
                    obj[key] = [];
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    obj[key] = {};
                } else {
                    obj[key] = null;
                }
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

        if (obj.responseContext) {
            if (obj.responseContext.adParams) delete obj.responseContext.adParams;
        }

        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                obj[key] = cleanObject(obj[key]);
            }
        }

        return obj;
    }

    const nativeParse = JSON.parse;
    JSON.parse = function () {
        const result = nativeParse.apply(this, arguments);
        try {
            return cleanObject(result);
        } catch (e) {
            return result;
        }
    };

    // =========================================================
    // 2. FETCH INTERCEPTOR — strip ads from player API
    // =========================================================
    const nativeFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await nativeFetch.apply(this, args);

        try {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';

            if (
                url.includes('/youtubei/v1/player') ||
                url.includes('/youtubei/v1/next') ||
                url.includes('/youtubei/v1/browse') ||
                url.includes('/youtubei/v1/search')
            ) {
                const clone = response.clone();
                const text = await clone.text();
                let json;
                try {
                    json = nativeParse(text);
                } catch (e) {
                    return response;
                }
                const cleaned = cleanObject(json);
                return new Response(JSON.stringify(cleaned), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            }
        } catch (e) {
            // ignore
        }

        return response;
    };

    // =========================================================
    // 3. XHR INTERCEPTOR — strip ads from XMLHttpRequest
    // =========================================================
    const nativeOpen = XMLHttpRequest.prototype.open;
    const nativeSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._url = url;
        return nativeOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (...args) {
        if (this._url && (
            this._url.includes('/youtubei/v1/player') ||
            this._url.includes('/youtubei/v1/next') ||
            this._url.includes('/youtubei/v1/browse')
        )) {
            this.addEventListener('readystatechange', function () {
                if (this.readyState === 4) {
                    try {
                        const data = nativeParse(this.responseText);
                        const cleaned = cleanObject(data);
                        Object.defineProperty(this, 'responseText', {
                            value: JSON.stringify(cleaned),
                            writable: false
                        });
                        Object.defineProperty(this, 'response', {
                            value: JSON.stringify(cleaned),
                            writable: false
                        });
                    } catch (e) {
                        // ignore
                    }
                }
            });
        }
        return nativeSend.apply(this, args);
    };

    // =========================================================
    // 4. PLAYER STATE ENFORCEMENT — kill stalls, force play
    // =========================================================
    function forceInstantPlay() {
        const player =
            document.querySelector('#movie_player') ||
            document.querySelector('ytmusic-player') ||
            document.querySelector('.html5-video-player');

        if (!player) return;

        try {
            if (player.getPlayerState && player.getPlayerState() === 3) {
                player.playVideo();
            }

            if (player.getConfig) {
                const cfg = player.getConfig();
                if (cfg && cfg.args) {
                    cfg.args.ad_flags = 0;
                    cfg.args.ad3_module = 0;
                    cfg.args.vss_host = '';
                }
            }
        } catch (e) {
            // ignore
        }
    }

    setInterval(forceInstantPlay, 50);
    window.addEventListener('yt-navigate-finish', forceInstantPlay, true);
    window.addEventListener('yt-page-data-updated', forceInstantPlay, true);

    // =========================================================
    // 5. YOUTUBE PLAYER API HOOK — remove ad modules
    // =========================================================
    function hookPlayerAPI() {
        const player = document.querySelector('#movie_player');
        if (!player || player._adBlockHooked) return;
        player._adBlockHooked = true;

        try {
            const origLoad = player.loadModule;
            if (origLoad) {
                player.loadModule = function (name) {
                    if (name === 'ad' || name === 'ads' || name === 'ad3') return;
                    return origLoad.apply(this, arguments);
                };
            }

            const origAddEventListener = player.addEventListener;
            player.addEventListener = function (type, listener, options) {
                if (type === 'onAdStart' || type === 'onAdEnd' || type === 'onAdStateChange') {
                    return;
                }
                return origAddEventListener.apply(this, arguments);
            };
        } catch (e) {
            // ignore
        }
    }

    setInterval(hookPlayerAPI, 100);
    window.addEventListener('yt-navigate-finish', hookPlayerAPI, true);

    // =========================================================
    // 6. FORCE SKIP INSTANTLY — patch the ad skip button
    // =========================================================
    function forceSkipAd() {
        const player = document.querySelector('#movie_player');
        if (!player) return;

        const isAd =
            player.classList.contains('ad-showing') ||
            player.classList.contains('ad-interrupting');

        if (isAd) {
            const video = document.querySelector('video');
            if (video) {
                try {
                    if (video.duration && isFinite(video.duration)) {
                        video.currentTime = video.duration;
                    }
                    video.playbackRate = 16;
                    video.muted = true;
                    video.play();
                } catch (e) {}
            }
            const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
            if (skipBtn) {
                try { skipBtn.click(); } catch (e) {}
            }
        }
    }

    setInterval(forceSkipAd, 20);
    window.addEventListener('yt-navigate-finish', forceSkipAd, true);

    console.log(`${LOG_PREFIX} Engine v9 loaded — instant-play mode active.`);
})();