(function () {
    'use strict';

    // =========================================================
    // 1. MASSIVE CSS SHIELD
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
        .ytd-video-masthead-ad-v3-renderer,
        .ytp-ad-module,
        .ytp-ad-overlay-container,
        .ytp-ad-overlay-slot,
        .ytp-ad-player-overlay,
        .ytp-ad-player-overlay-instream-info,
        .ytp-ad-player-overlay-layout,
        .ytp-ad-text-overlay,
        .ytp-ad-image-overlay,
        .ytp-ad-survey,
        .ytp-ad-survey-questions,
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
        .ytp-ce-element,
        .ytp-cards-teaser,
        .ytp-cards-button,
        .ytp-pause-overlay,
        .ytp-suggestion-set,
        .ytp-shorts-bar,
        .ytp-shorts-title-channel,
        .ytp-shopping-button,
        .ytp-shopping-product-overlay,
        tp-yt-iron-overlay-backdrop,
        tp-yt-paper-dialog.ytd-enforcement-message-view-model,
        #player-ads,
        #panels-full-bleed-container,
        #related > ytd-watch-next-secondary-results-renderer > #items > ytd-compact-promoted-video-renderer,
        #merchandise-shelf,
        #clarify-box,
        #masthead-ad,
        #offer-module,
        #shopping-button,
        .ytd-companion-slot-renderer,
        .ytd-action-companion-ad-renderer,
        .ytd-player-legacy-desktop-watch-ads-renderer,
        .ytd-in-feed-ad-layout-renderer,
        .ytd-ad-slot-renderer,
        .ytd-display-ad-renderer,
        .ytd-promoted-sparkles-web-renderer,
        .ytd-promoted-video-renderer,
        .ytd-compact-promoted-video-renderer,
        .ytd-banner-promo-renderer,
        .ytd-statement-banner-renderer,
        .ytd-brand-video-shelf-renderer,
        .ytd-primetime-promo-renderer,
        .ytd-enforcement-message-view-model,
        .ytmusic-ad-bar,
        .ytmusic-mealbar-promo-renderer,
        .ytmusic-statement-banner-renderer,
        ytd-ad-slot-renderer,
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
    // 2. PAUSE DETECTION LOGIC
    // =========================================================
    let userPaused = false;
    let userPausedAt = 0;

    function markUserPause() {
        userPaused = true;
        userPausedAt = Date.now();
    }

    function markUserPlay() {
        userPaused = false;
    }

    window.addEventListener('keydown', function (e) {
        if (e.code === 'Space' || e.code === 'KeyK') {
            if (userPaused) markUserPlay();
            else markUserPause();
        }
    }, true);

    window.addEventListener('mousedown', function (e) {
        const playBtn = e.target.closest(
            '.ytp-play-button, .play-pause-button, .ytp-play-button-playlist'
        );
        if (playBtn) {
            if (userPaused) markUserPlay();
            else markUserPause();
        }
    }, true);

    window.addEventListener('touchstart', function (e) {
        const playBtn = e.target.closest(
            '.ytp-play-button, .play-pause-button, .ytp-play-button-playlist'
        );
        if (playBtn) {
            if (userPaused) markUserPlay();
            else markUserPause();
        }
    }, true);

    // =========================================================
    // 3. INSTANT-REACTION LOOP (ULTRA FAST — 20ms)
    // =========================================================
    function instantFix() {
        const video = document.querySelector('video');
        const player =
            document.querySelector('#movie_player') ||
            document.querySelector('ytmusic-player') ||
            document.querySelector('.html5-video-player');

        if (!video) return;

        if (!video._adBlockListenersAttached) {
            video._adBlockListenersAttached = true;
            video.addEventListener('emptied', function () {
                userPaused = false;
                userPausedAt = 0;
            }, { once: true });
            video.addEventListener('play', function () {
                if (Date.now() - userPausedAt > 1500) {
                    userPaused = false;
                }
            });
        }

        // Remove anti-adblock popups
        const popup = document.querySelector('ytd-enforcement-message-view-model');
        if (popup) {
            popup.remove();
            document.querySelectorAll('tp-yt-iron-overlay-backdrop').forEach(function (b) {
                b.remove();
            });
            document.querySelectorAll('tp-yt-paper-dialog').forEach(function (d) {
                if (d.querySelector('ytd-enforcement-message-view-model')) d.remove();
            });
            try { video.play(); } catch (e) {}
        }

        // Detect ad state
        const isAd =
            player &&
            (player.classList.contains('ad-showing') ||
                player.classList.contains('ad-interrupting'));

        if (isAd) {
            video.muted = true;
            video.playbackRate = 16;
            if (isFinite(video.duration) && video.duration > 0) {
                try { video.currentTime = video.duration - 0.1; } catch (e) {}
            }
            if (isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 1) {
                try { video.currentTime = video.duration - 0.1; } catch (e) {}
            }

            const skipBtn = document.querySelector(
                '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button'
            );
            if (skipBtn) {
                try { skipBtn.click(); } catch (e) {}
            }

            const overlayClose = document.querySelector('.ytp-ad-overlay-close-button');
            if (overlayClose) {
                try { overlayClose.click(); } catch (e) {}
            }

            // Force play main video if ad ended
            if (!video.paused && video.currentTime >= video.duration - 0.5) {
                try { video.currentTime = 0; video.play(); } catch (e) {}
            }
        }

        // Force play if not user-paused and stuck
        if (!userPaused && video.paused && video.readyState >= 2 && !video.ended) {
            const isAdState = player && player.classList.contains('ad-showing');
            if (isAdState || video.currentTime < 1) {
                video.play().catch(function () {});
            }
        }

        // Restore muted state after ad
        if (!isAd && video.muted && !userPaused) {
            video.muted = false;
        }
        if (!isAd && video.playbackRate > 2) {
            video.playbackRate = 1;
        }
    }

    // 20ms loop = ultra instant reaction
    setInterval(instantFix, 20);

    // Also react to navigation
    window.addEventListener('yt-navigate-finish', function () {
        userPaused = false;
        userPausedAt = 0;
        instantFix();
    }, true);

    window.addEventListener('yt-page-data-updated', instantFix, true);

    // =========================================================
    // 4. MUTATION OBSERVER — instant reaction on DOM changes
    // =========================================================
    const observer = new MutationObserver(function (mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (
                        node.classList &&
                        (node.classList.contains('ad-showing') ||
                            node.classList.contains('ytp-ad-module') ||
                            node.classList.contains('ytp-ad-skip-button'))
                    ) {
                        instantFix();
                        return;
                    }
                }
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();