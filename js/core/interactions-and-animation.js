/**
 * Villa Hassan | Raycasting, resize and render loop
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        // ============================================================================
        // 19. RAYCASTER CLICK / TOUCH INTERACTION & ANIMATION LOOP
        // ============================================================================
        function setupRaycasterInteraction() {
            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2();
            let downPos = { x: 0, y: 0 };
            let downTime = 0;
            let downLabelsWereVisible = false;
            let downHadManualView = false;
            const pointers = new Set();
            let multiTouchGesture = false;

            const domElem = renderer.domElement;

            domElem.addEventListener('pointerdown', (e) => {
                pointers.add(e.pointerId);
                if (pointers.size > 1) multiTouchGesture = true;
                downLabelsWereVisible = isUserOrbiting ? roomLabelsWereVisibleAtGestureStart : roomLabelsAwake;
                downHadManualView = isUserOrbiting ? cameraWasManualAtGestureStart : cameraWasManuallyMoved;
                downPos.x = e.clientX;
                downPos.y = e.clientY;
                downTime = performance.now();
            });

            domElem.addEventListener('pointercancel', () => {
                pointers.clear();
                multiTouchGesture = false;
            });

            domElem.addEventListener('pointerup', (e) => {
                pointers.delete(e.pointerId);
                if (multiTouchGesture) {
                    if (!pointers.size) multiTouchGesture = false;
                    return;
                }
                if (cameraAnim) return;
                const moveDist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
                const elapsed = performance.now() - downTime;
                // Only treat as a tap/click if finger/mouse didn't drag
                if (moveDist > 9 || elapsed > 500) return;
                cameraWasManuallyMoved = downHadManualView;

                if (focusedZoneKey === 'overview' && showRoomLabelsFlag && !downLabelsWereVisible) {
                    revealRoomLabels();
                    return;
                }
                revealRoomLabels();
                pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
                pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(pointer, camera);
                const hits = raycaster.intersectObjects(interactiveObjects.filter(isEffectivelyVisible), true);

                if (hits.length > 0) {
                    const hitObj = hits[0].object;

                    // 1. Check if user tapped a 3D Smart Bulb fixture directly
                    if (hitObj.userData && hitObj.userData.isSmartBulb && hitObj.userData.smartLight) {
                        openRadialLightMenu(hitObj.userData.smartLight, e.clientX, e.clientY);
                        return;
                    }

                    // 2. Check if user tapped a specific piece of furniture or planter
                    if (hitObj.userData && hitObj.userData.itemKey) {
                        const itemSpec = ITEM_SPECS[hitObj.userData.itemKey];
                        if (itemSpec) {
                            selectedTargetGroup = hitObj.userData.targetGroup || hitObj;
                            selectedZoneKey = itemSpec.zone || 'overview';
                            if (selectionBoxHelper && selectedTargetGroup) {
                                selectionBoxHelper.setFromObject(selectedTargetGroup);
                                selectionBoxHelper.visible = true;
                            }
                            showContextCardForSpec(itemSpec, true);
                            return;
                        }
                    }

                    // 3. Otherwise, floor slab tap -> show room info card
                    if (hitObj.userData && hitObj.userData.zone) {
                        const zKey = hitObj.userData.zone;
                        selectedZoneKey = zKey;
                        selectedTargetGroup = null;
                        if (selectionBoxHelper) selectionBoxHelper.visible = false;
                        selectZoneFromDock(zKey);
                        return;
                    }
                }

                // Tapped empty space -> dismiss radial menus & context card
                VillaCoveringControls.closeRadial();
                closeRadialLightMenu();
                hideContextCard();
                closeAllPopovers();
            });
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            closeRadialLightMenu();
            VillaCoveringControls.closeRadial();
            hideContextCard();
            updateFocusedRoomLabel();
            updateLightingModesLayout();
            if (!cameraWasManuallyMoved) focusZone(focusedZoneKey);
        }

        function animate(timestamp = performance.now()) {
            requestAnimationFrame(animate);
            if (cameraAnim) {
                // Keep transitions short even when a phone renders fewer frames.
                cameraAnim.progress = Math.max(0, Math.min(1, (timestamp - cameraAnim.startTime) / 650));
                const t = 1 - Math.pow(1 - cameraAnim.progress, 3);
                camera.position.lerpVectors(cameraAnim.startPos, cameraAnim.endPos, t);
                controls.target.lerpVectors(cameraAnim.startTarget, cameraAnim.endTarget, t);
                if (cameraAnim.progress >= 1) {
                    cameraAnim = null;
                    controls.enabled = true;
                    controls.enableDamping = true;
                }
            }
            controls.update();
            camera.updateMatrixWorld();
            updateHTMLOverlaysPosition();
            VillaCoveringVisuals.frame(timestamp);
            renderer.render(scene, camera);
        }
