/**
 * Villa Hassan | Welcome screen and viewer startup
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        let clientViewerReady = false;
        function setClientModalOpen(open) {
            document.getElementById('client-welcome').hidden = !open;
            for (const id of ['canvas-container', 'labels-container', 'main-toolbar', 'popover-rooms',
                'popover-layers', 'radial-light-menu', 'context-card', 'focused-room-label',
                'bottom-places-dock', 'summon-ui-btn', 'quick-home-btn', 'help-tour-btn',
                'lighting-modes-button', 'lighting-modes-panel', 'lighting-modes-backdrop',
                'covering-button-stack', 'covering-markers-layer', 'covering-modes-panel', 'covering-modes-backdrop',
                'covering-radial', 'covering-radial-scrim', 'voice-panel', 'voice-backdrop', 'voice-live']) {
                const element = document.getElementById(id);
                if (element) element.inert = open;
            }
        }
        function startClientTour() {
            if (!clientViewerReady) return;
            setClientModalOpen(false);
            revealRoomLabels();
            summonMainToolbar();
            document.getElementById('btn-menu-rooms').focus({ preventScroll: true });
        }
        function openClientHelp() {
            closeLightingModes();
            VillaCoveringControls.closePanel();
            window.VillaVoiceUI?.close();
            closeRadialLightMenu();
            hideContextCard();
            closeAllPopovers();
            setClientModalOpen(true);
            document.getElementById('client-start').textContent = 'العودة للجولة';
            document.getElementById('client-start').focus({ preventScroll: true });
        }
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeLightingModes();
            if (event.key === 'Escape' && clientViewerReady && !document.getElementById('client-welcome').hidden) {
                startClientTour();
            }
        });
        setClientModalOpen(true);

        function bootClientViewer() {
            try {
                initScene();
                focusZone('overview');
                clientViewerReady = true;
                const start = document.getElementById('client-start');
                start.disabled = false;
                start.textContent = 'ابدأ الجولة';
                document.getElementById('client-status').textContent = 'جاهز للاستكشاف · يدعم الكمبيوتر والموبايل';
                start.focus({ preventScroll: true });
            } catch (error) {
                console.error(error);
                const message = document.getElementById('scene-error');
                document.getElementById('client-status').textContent = 'تعذر تجهيز الجولة على هذا المتصفح';
                message.hidden = false;
                message.textContent = 'تعذر تشغيل العرض ثلاثي الأبعاد. افتح الملف في متصفح حديث مع تفعيل WebGL، ثم أعد تحميل الصفحة.';
            }
        }
        window.onload = () => requestAnimationFrame(() => setTimeout(bootClientViewer, 0));
    
