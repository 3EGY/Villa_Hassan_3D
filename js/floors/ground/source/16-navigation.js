        // ============================================================================
        // 16. AUTO-HIDE TOOLBAR, POPOVERS, CONTEXT CARD & BOTTOM DOCK LOGIC
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
            closeAllPopovers();
            hideContextCard();
            closeRadialLightMenu();
            hideToolbarImmediately();
        }

        function togglePopoverMenu(menuKey, event) {
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
            card.className = "context-card-anim fixed bottom-16 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-sm glass-panel rounded-2xl p-3.5 pointer-events-auto overflow-hidden shadow-2xl";

            startContextCardCountdown(4500);
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
            if (selectedZoneKey) {
                focusZone(selectedZoneKey, false);
            }
            hideContextCard();
        }

        function toggleSelectedObjectVisibility() {
            if (!selectedTargetGroup) return;
            selectedTargetGroup.visible = !selectedTargetGroup.visible;
            document.getElementById('ctx-vis-text').textContent = selectedTargetGroup.visible ? 'إخفاء مؤقت' : 'إظهار العنصر';
            if (selectionBoxHelper) selectionBoxHelper.visible = selectedTargetGroup.visible;
        }

        function selectZoneFromDock(zoneKey, showCard = true) {
            closeAllPopovers();
            closeRadialLightMenu();
            document.querySelectorAll('.dock-btn').forEach(btn => btn.classList.remove('btn-active'));
            const activeBtn = document.getElementById(`dock-${zoneKey}`);
            if (activeBtn) {
                activeBtn.classList.add('btn-active');
                activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            focusZone(zoneKey, zoneKey !== 'overview' && showCard);
        }

        function selectZoneAndClose(zoneKey) {
            closeAllPopovers();
            hideToolbarImmediately();
            selectZoneFromDock(zoneKey, true);
        }

        function focusZone(zoneKey, showCard = false) {
            const spec = ZONE_SPECS[zoneKey] || ZONE_SPECS.overview;
            selectedZoneKey = zoneKey;
            selectedTargetGroup = null;
            if (selectionBoxHelper) selectionBoxHelper.visible = false;

            cameraAnim = {
                startPos: camera.position.clone(),
                endPos: new THREE.Vector3(spec.camPos.x, spec.camPos.y, spec.camPos.z),
                startTarget: controls.target.clone(),
                endTarget: new THREE.Vector3(spec.target.x, spec.target.y, spec.target.z),
                progress: 0
            };

            if (showCard) {
                showContextCardForSpec(spec, false);
            } else if (zoneKey === 'overview') {
                hideContextCard();
            }
        }

        function setCameraView(mode) {
            ['cam-orbit', 'cam-top', 'cam-iso'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('btn-active');
            });
            const activeEl = document.getElementById(`cam-${mode}`);
            if (activeEl) activeEl.classList.add('btn-active');

            if (mode === 'top') {
                cameraAnim = {
                    startPos: camera.position.clone(),
                    endPos: new THREE.Vector3(0.4, 22.5, 0.01),
                    startTarget: controls.target.clone(),
                    endTarget: new THREE.Vector3(0.4, 0.0, 0.0),
                    progress: 0
                };
            } else if (mode === 'iso') {
                cameraAnim = {
                    startPos: camera.position.clone(),
                    endPos: new THREE.Vector3(14.5, 14.5, 14.5),
                    startTarget: controls.target.clone(),
                    endTarget: new THREE.Vector3(0.4, 0.3, -0.2),
                    progress: 0
                };
            } else {
                focusZone('overview', false);
            }
            closeAllPopovers();
        }

