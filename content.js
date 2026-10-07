(function () {
    'use strict';

    // =========================================================
    // 1. CSS SHIELD
    // =========================================================
    const style = document.createElement('style');
    style.textContent = `
        #masthead-ad,
        ytd-ad-slot-renderer,
        ytd-display-ad-renderer,
        ytd-player-legacy-desktop-watch-ads-renderer,
        ytd-in-feed-ad-layout-renderer,
        ytd-banner-promo-renderer,
        ytd-statement-banner-renderer,
        ytd-brand-video-shelf-renderer,
        ytd-compact-promoted-video-renderer,
        ytd-promoted-sparkles-web-renderer,
        ytd-promoted-video-renderer,
        ytd-video-masthead-ad-v3-renderer,
        ytd-primetime-promo-renderer,
        ytd-enforcement-message-view-model,
        ytmusic-ad-bar,
        ytmusic-mealbar-promo-renderer,
        ytmusic-statement-banner-renderer,
        .ytp-ad-module,
        .ytp-ad-overlay-container,
        .ytp-ad-overlay-slot,
        .ytp-ad-player-overlay,
        .ytp-ad-player-overlay-instream-info,
        .ytp-ad-player-overlay-layout,
        .ytp-ad-text-overlay,
        .ytp-ad-image-overlay,
        .ytp-ad-survey,
        .ytp-ad-progress,
        .ytp-ad-progress-list,
        .ytp-ad-button,
        .ytp-ad-message-container,
        .ytp-ad-skip-button-container,
        .ytp-ad-feedback-dialog-container,
        .ytp-ad-confirm-dialog-container,
        .ytp-ad-action-interstitial,
        .ytp-ad-action-interstitial-slot,
        .ytp-ad-action-interstitial-image,
        .ytp-ad-action-interstitial-background,
        .ytp-ad-action-interstitial-headline,
        .ytp-ad-action-interstitial-description,
        .ytp-ad-action-interstitial-action-button,
        .ytp-ad-overlay-close-button,
        .ytp-ad-overlay-close-container,
        .ytp-featured-product,
        .ytp-suggested-action,
        .ytp-cards-teaser,
        .ytp-cards-button,
        .ytp-pause-overlay,
        .ytp-shopping-button,
        .ytp-shopping-product-overlay,
        .ytp-ad-badge,
        .ytp-ad-badge-text,
        .ytp-ad-badge-icon,
        .video-ads,
        .ytp-ad-image,
        .ytp-ad-video,
        tp-yt-iron-overlay-backdrop,
        tp-yt-paper-dialog.ytd-enforcement-message-view-model,
        #player-ads,
        #panels-full-bleed-container,
        #merchandise-shelf,
        #clarify-box,
        #offer-module,
        #shopping-button,
        ytd-companion-slot-renderer,
        ytd-action-companion-ad-renderer,
        ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
        ytd-rich-section-renderer:has(ytd-statement-banner-renderer),
        ytd-item-section-renderer:has(ytd-ad-slot-renderer) {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            position: absolute !important;
            z-index: -9999 !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // =========================================================
    // 2. USER PAUSE TRACKING
    // =========================================================
    let userPaused = false;

    window.addEventListener('keydown', function (e) {
        if (e.code === 'Space' || e.code === 'KeyK') {
            userPaused = !userPaused;
        }
    }, true);

    window.addEventListener('mousedown', function (e) {
        if (e.target.closest('.ytp-play-button, .play-pause-button, .ytp-play-button-playlist')) {
            userPaused = !userPaused;
        }
    }, true);

    window.addEventListener('touchstart', function (e) {
        if (e.target.closest('.ytp-play-button, .play-pause-button, .ytp-play-button-playlist')) {
            userPaused = !userPaused;
        }
    }, true);

    // =========================================================
    // 3. AD-SKIP LOGIC
    //    - Runs fast when ad detected
    //    - Does NOT touch anything when no ad is present
    // =========================================================
    let lastAdState = false;

    function handleAd() {
        const player = document.getElementById('movie_player') ||
                       document.querySelector('ytmusic-player') ||
                       document.querySelector('.html5-video-player');
        const video = document.querySelector('video');
        if (!player || !video) return;

        // ---------- Anti-adblock popup removal (always safe) ----------
        const popup = document.querySelector('ytd-enforcement-message-view-model');
        if (popup) {
            popup.remove();
            document.querySelectorAll('tp-yt-iron-overlay-backdrop').forEach(function (b) { b.remove(); });
            document.querySelectorAll('tp-yt-paper-dialog').forEach(function (d) {
                if (d.querySelector('ytd-enforcement-message-view-model')) d.remove();
            });
            if (!userPaused) {
                const p = video.play();
                if (p && p.catch) p.catch(function () {});
            }
        }

        // ---------- Ad detection ----------
        const isAd =
            player.classList.contains('ad-showing') ||
            player.classList.contains('ad-interrupting');

        if (isAd) {
            lastAdState = true;

            // Mute + speed up
            if (!video.muted) video.muted = true;
            try {
                if (video.playbackRate < 16) video.playbackRate = 16;
            } catch (e) {}

            // Jump to end of ad
            try {
                const dur = video.duration;
                if (dur && isFinite(dur) && dur > 0.3 && video.currentTime < dur - 0.05) {
                    video.currentTime = dur - 0.05;
                }
            } catch (e) {}

            // Ensure playing
            if (video.paused) {
                const p = video.play();
                if (p && p.catch) p.catch(function () {});
            }

            // Click skip buttons
            const skips = document.querySelectorAll(
                '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button'
            );
            for (let i = 0; i < skips.length; i++) {
                try { skips[i].click(); } catch (e) {}
            }

            // Close overlay
            const close = document.querySelector('.ytp-ad-overlay-close-button');
            if (close) {
                try { close.click(); } catch (e) {}
            }
        } else {
            // ---------- Restore only if a real ad just ended ----------
            if (lastAdState) {
                lastAdState = false;
                try { video.playbackRate = 1; } catch (e) {}
                if (video.muted && !userPaused) video.muted = false;
                if (!userPaused && video.paused && !video.ended && video.readyState >= 2) {
                    const p = video.play();
                    if (p && p.catch) p.catch(function () {});
                }
            }
        }
    }

    // =========================================================
    // 4. FAST AD-KILL LOOP (only while ad is showing)
    // =========================================================
    let fastTimer = null;

    function startFastLoop() {
        if (fastTimer) return;
        fastTimer = setInterval(function () {
            const player = document.getElementById('movie_player') ||
                           document.querySelector('ytmusic-player') ||
                           document.querySelector('.html5-video-player');
            if (!player || !(player.classList.contains('ad-showing') ||
                             player.classList.contains('ad-interrupting'))) {
                clearInterval(fastTimer);
                fastTimer = null;
                handleAd();
                return;
            }
            handleAd();
        }, 25);
    }

    // Slow background scan
    setInterval(function () {
        handleAd();
        const player = document.getElementById('movie_player') ||
                       document.querySelector('ytmusic-player') ||
                       document.querySelector('.html5-video-player');
        if (player && (player.classList.contains('ad-showing') ||
                       player.classList.contains('ad-interrupting'))) {
            startFastLoop();
        }
    }, 100);

    // =========================================================
    // 5. OBSERVER on player class — instant reaction
    // =========================================================
    function attachPlayerObserver() {
        const player = document.getElementById('movie_player') ||
                       document.querySelector('ytmusic-player') ||
                       document.querySelector('.html5-video-player');
        if (player && !player._abObs) {
            player._abObs = true;
            new MutationObserver(function () {
                handleAd();
                if (player.classList.contains('ad-showing') ||
                    player.classList.contains('ad-interrupting')) {
                    startFastLoop();
                }
            }).observe(player, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    // =========================================================
    // 6. VIDEO EVENT LISTENERS
    // =========================================================
    function attachVideoListeners(video) {
        if (!video || video._abVideoHooked) return;
        video._abVideoHooked = true;
        video.addEventListener('play', handleAd, true);
        video.addEventListener('playing', handleAd, true);
        video.addEventListener('pause', handleAd, true);
        video.addEventListener('loadedmetadata', handleAd, true);
        video.addEventListener('durationchange', handleAd, true);
    }

    const domObs = new MutationObserver(function () {
        attachPlayerObserver();
        attachVideoListeners(document.querySelector('video'));
    });
    domObs.observe(document.documentElement, { childList: true, subtree: true });

    setInterval(function () {
        attachPlayerObserver();
        attachVideoListeners(document.querySelector('video'));
    }, 500);

    // =========================================================
    // 7. NAVIGATION RESET
    // =========================================================
    window.addEventListener('yt-navigate-start', function () {
        userPaused = false;
        lastAdState = false;
    }, true);

    window.addEventListener('yt-navigate-finish', function () {
        userPaused = false;
        lastAdState = false;
        setTimeout(handleAd, 100);
    }, true);

    console.log('[PRO-BLOCKER] Content v13 loaded.');
})();