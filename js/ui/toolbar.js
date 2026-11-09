/**
 * Villa Hassan | Top toolbar, popovers and contextual information
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        // ============================================================================
        // 17. AUTO-HIDE TOOLBAR, POPOVERS, CONTEXT CARD & BOTTOM DOCK LOGIC
        // ============================================================================
        function scheduleToolbarAutoHide(delayMs = 3500) {
            clearTimeout(toolbarHideTimer);
            toolbarHideTimer = setTimeout(() => {
                if (!activePopover) {
                    hideToolbarImmediately();
                }
            }, delayMs);
        }

        function pauseToolbarAutoHide() {
            clearTimeout(toolbarHideTimer);
        }

        function resetToolbarAutoHide() {
            clearTimeout(toolbarHideTimer);
            scheduleToolbarAutoHide(4500);
        }

        function hideToolbarImmediately(event) {
            if (event) event.stopPropagation();
            clearTimeout(toolbarHideTimer);
            closeAllPopovers();
            const toolbar = document.getElementById('main-toolbar');
            const summonBtn = document.getElementById('summon-ui-btn');
            if (toolbar) toolbar.classList.add('ui-bar-hidden');
            if (summonBtn) {
                summonBtn.classList.remove('opacity-0', 'pointer-events-none');
            }
        }

        function summonMainToolbar(event) {
            if (event) event.stopPropagation();
            const toolbar = document.getElementById('main-toolbar');
            const summonBtn = document.getElementById('summon-ui-btn');
            if (toolbar) toolbar.classList.remove('ui-bar-hidden');
            if (summonBtn) {
                summonBtn.classList.add('opacity-0', 'pointer-events-none');
            }
            scheduleToolbarAutoHide(4000);
        }

        function hideAllUIImmediately() {
            hideRoomLabels();
            closeAllPopovers();
            hideContextCard();
            closeRadialLightMenu();
            VillaCoveringControls.closePanel();
            hideToolbarImmediately();
        }

        function togglePopoverMenu(menuKey, event) {
            closeLightingModes();
            if (event) event.stopPropagation();
            closeRadialLightMenu();
            hideContextCard();

            const roomsPopover = document.getElementById('popover-rooms');
            const layersPopover = document.getElementById('popover-layers');

            if (activePopover === menuKey) {
                closeAllPopovers();
                scheduleToolbarAutoHide(3000);
                return;
            }

            roomsPopover.classList.add('popover-hidden');
            layersPopover.classList.add('popover-hidden');

            if (menuKey === 'rooms') {
                roomsPopover.classList.remove('popover-hidden');
                activePopover = 'rooms';
            } else if (menuKey === 'layers') {
                layersPopover.classList.remove('popover-hidden');
                activePopover = 'layers';
            }
            pauseToolbarAutoHide();
        }

        function closeAllPopovers() {
            const r = document.getElementById('popover-rooms');
            const l = document.getElementById('popover-layers');
            if (r) r.classList.add('popover-hidden');
            if (l) l.classList.add('popover-hidden');
            activePopover = null;
        }

        // Contextual Info Card (Auto-hides after 4s or on canvas interaction)
        function showContextCardForSpec(spec, isSpecificItem = false) {
            if (!spec) return;
            closeAllPopovers();
            closeRadialLightMenu();

            document.getElementById('ctx-title').textContent = spec.title;
            document.getElementById('ctx-tag').textContent = spec.tag;
            document.getElementById('ctx-desc').textContent = spec.desc;
            document.getElementById('ctx-dim1').textContent = spec.dim1;
            document.getElementById('ctx-dim2').textContent = spec.dim2;

            const visBtn = document.getElementById('ctx-toggle-vis-btn');
            if (isSpecificItem && selectedTargetGroup) {
                visBtn.classList.remove('hidden');
                document.getElementById('ctx-vis-text').textContent = selectedTargetGroup.visible ? 'إخفاء مؤقت' : 'إظهار العنصر';
            } else {
                visBtn.classList.add('hidden');
            }

            const card = document.getElementById('context-card');
            card.classList.remove('context-card-hidden');

            card.className = "context-card-anim fixed left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-sm glass-panel rounded-2xl p-3.5 pointer-events-auto shadow-2xl";
            card.style.top = 'auto';
            card.style.bottom = (getBottomOverlayHeight() + 10) + 'px';
            document.getElementById('ctx-dim1').parentElement.hidden = !showDimBadgesFlag;

            startContextCardCountdown(4000);
        }

        function startContextCardCountdown(durationMs = 4000) {
            clearInterval(contextCardProgressInterval);
            contextRemainingMs = durationMs;
            isContextTimerPaused = false;
            const prog = document.getElementById('context-progress');
            if (prog) prog.style.width = '100%';

            contextCardProgressInterval = setInterval(() => {
                if (isContextTimerPaused) return;
                contextRemainingMs -= 80;
                const pct = Math.max(0, (contextRemainingMs / durationMs) * 100);
                if (prog) prog.style.width = `${pct}%`;
                if (contextRemainingMs <= 0) {
                    clearInterval(contextCardProgressInterval);
                    hideContextCard();
                }
            }, 80);
        }

        function pauseContextCardTimer() {
            isContextTimerPaused = true;
        }

        function resumeContextCardTimer() {
            isContextTimerPaused = false;
        }

        function hideContextCard() {
            clearInterval(contextCardProgressInterval);
            const card = document.getElementById('context-card');
            if (card) card.classList.add('context-card-hidden');
            if (selectionBoxHelper) selectionBoxHelper.visible = false;
        }

        function focusCurrentContextObject() {
            selectZoneFromDock(selectedZoneKey || 'overview');
        }

        function toggleSelectedObjectVisibility() {
            if (!selectedTargetGroup) return;
            selectedTargetGroup.visible = !selectedTargetGroup.visible;
            requestLightingShadowUpdate();
            document.getElementById('ctx-vis-text').textContent = selectedTargetGroup.visible ? 'إخفاء مؤقت' : 'إظهار العنصر';
            if (selectionBoxHelper) selectionBoxHelper.visible = selectedTargetGroup.visible;
        }

        function hideRoomLabels() {
            clearTimeout(roomLabelsHideTimer);
            roomLabelsAwake = false;
            document.getElementById('labels-container').classList.remove('labels-awake');
        }

        function revealRoomLabels() {
            if (!showRoomLabelsFlag || focusedZoneKey !== 'overview') return;
            clearTimeout(roomLabelsHideTimer);
            roomLabelsAwake = true;
            document.getElementById('labels-container').classList.add('labels-awake');
            roomLabelsHideTimer = setTimeout(hideRoomLabels, ROOM_LABEL_IDLE_MS);
        }
