/**
 * Villa Hassan | Room selection and bottom dock
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        // Bottom Dock & Zone Navigation
        function selectZoneFromDock(zoneKey, showCard = false, labelName = '', anchor = null) {
            closeLightingModes();
            closeAllPopovers();
            closeRadialLightMenu();
            VillaCoveringControls.closeRadial();
            hideContextCard();
            hideRoomLabels();
            focusedZoneKey = ZONE_SPECS[zoneKey] ? zoneKey : 'overview';
            if (focusedZoneKey === 'overview') overviewViewMode = 'top';
            focusedLabelName = labelName;
            const roomLights = smartLights.filter(light => light.zone === focusedZoneKey);
            const nearestLight = anchor
                ? roomLights.slice().sort((a, b) => a.pos.distanceToSquared(anchor) - b.pos.distanceToSquared(anchor))[0]
                : roomLights[0];
            focusedLightId = nearestLight ? nearestLight.id : null;
            document.querySelectorAll('.dock-btn').forEach(btn => btn.classList.remove('btn-active'));
            const activeBtn = document.getElementById(`dock-${focusedZoneKey}`);
            if (activeBtn) {
                activeBtn.classList.add('btn-active');
                activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            updateFocusedRoomLabel();
            focusZone(focusedZoneKey, showCard);
            updateHTMLOverlaysPosition();
            revealRoomLabels();
        }

        function getFocusedLight() {
            return smartLights.find(light => light.id === focusedLightId)
                || smartLights.find(light => light.zone === focusedZoneKey);
        }

        function updateFocusedRoomLabel() {
            const label = document.getElementById('focused-room-label');
            label.hidden = focusedZoneKey === 'overview' || !showRoomLabelsFlag;
            const name = focusedLabelName || (ZONE_SPECS[focusedZoneKey] || ZONE_SPECS.overview).title;
            document.getElementById('focused-room-name').textContent = name;
            document.getElementById('focused-light-btn').hidden = !getFocusedLight();
            const dock = document.getElementById('bottom-places-dock').getBoundingClientRect();
            document.documentElement.style.setProperty('--dock-top-space', `${window.innerHeight - dock.top + 9}px`);
            updateLightingModesLayout();
        }

        function getBottomOverlayHeight() {
            const dockTop = document.getElementById('bottom-places-dock').getBoundingClientRect().top;
            const label = document.getElementById('focused-room-label');
            const top = label.hidden ? dockTop : label.getBoundingClientRect().top;
            return window.innerHeight - top;
        }

        function showFocusedRoomInfo() {
            selectedTargetGroup = null;
            selectedZoneKey = focusedZoneKey;
            showContextCardForSpec(ZONE_SPECS[focusedZoneKey], false);
        }

        function openFocusedRoomLight(event) {
            if (event) event.stopPropagation();
            const light = getFocusedLight();
            if (!light) return;
            const projected = light.pos.clone().project(camera);
            openRadialLightMenu(light, (projected.x + 1) * window.innerWidth / 2,
                (1 - projected.y) * window.innerHeight / 2);
        }

        function selectZoneAndClose(zoneKey) {
            hideToolbarImmediately();
            selectZoneFromDock(zoneKey);
        }
