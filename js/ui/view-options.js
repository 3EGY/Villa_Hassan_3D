/**
 * Villa Hassan | Layers, labels and visibility toggles
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        function toggleGroupVisibility(groupName, visible) {
            if (groupName === 'furniture' && furnitureGroup) furnitureGroup.visible = visible;
            if (groupName === 'plants' && plantsGroup) plantsGroup.visible = visible;
            requestLightingShadowUpdate();
        }

        function toggleRoomLabels(visible) {
            showRoomLabelsFlag = visible;
            if (visible) revealRoomLabels();
            else hideRoomLabels();
            updateFocusedRoomLabel();
        }

        function toggleDimensionBadges(visible) {
            showDimBadgesFlag = visible;
            document.getElementById('dimensions-toggle').checked = visible;
            document.querySelectorAll('.room-label .lbl-sub').forEach(el => { el.hidden = !visible; });
            document.getElementById('ctx-dim1').parentElement.hidden = !visible;
        }

        function toggleSmartBulbPins(visible) {
            showSmartBulbPinsFlag = visible;
            if (!visible) closeRadialLightMenu();
            updateHTMLOverlaysPosition();
        }

        function toggleWallXRay(enabled) {
            isWallXRay = enabled;
            wallMat.transparent = enabled;
            wallMat.opacity = enabled ? 0.22 : 1.0;
            wallMat.needsUpdate = true;
        }

        function isEffectivelyVisible(object) {
            for (let node = object; node; node = node.parent) {
                if (!node.visible) return false;
            }
            return true;
        }
