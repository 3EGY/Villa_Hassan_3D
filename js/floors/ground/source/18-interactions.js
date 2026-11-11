        // ============================================================================
        // 18. RAYCASTER CLICK / TOUCH INTERACTION & ANIMATION LOOP
        // ============================================================================
        function setupRaycasterInteraction() {
            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2();
            let downPos = { x: 0, y: 0 };
            let downTime = 0;

            const domElem = renderer.domElement;

            domElem.addEventListener('pointerdown', (e) => {
                downPos.x = e.clientX;
                downPos.y = e.clientY;
                downTime = performance.now();
            });

            domElem.addEventListener('pointerup', (e) => {
                const moveDist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
                const elapsed = performance.now() - downTime;
                if (moveDist > 9 || elapsed > 500) return;

                pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
                pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(pointer, camera);
                const hits = raycaster.intersectObjects(interactiveObjects, true);

                if(window.VillaGroundReview?.isActive && window.VillaGroundReview.handleSceneTap(e,raycaster,pointer,hits)) return;

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

                    // 3. Otherwise, floor slab tap -> show room info card above bottom dock
                    if (hitObj.userData && hitObj.userData.zone) {
                        const zKey = hitObj.userData.zone;
                        selectedZoneKey = zKey;
                        selectedTargetGroup = null;
                        if (selectionBoxHelper) selectionBoxHelper.visible = false;
                        showContextCardForSpec(ZONE_SPECS[zKey], false);
                        return;
                    }
                }

                closeRadialLightMenu();
                hideContextCard();
                closeAllPopovers();
            });
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);

            if (cameraAnim) {
                cameraAnim.progress += 0.045;
                if (cameraAnim.progress >= 1) {
                    camera.position.copy(cameraAnim.endPos);
                    controls.target.copy(cameraAnim.endTarget);
                    cameraAnim = null;
                } else {
                    const t = 1 - Math.pow(1 - cameraAnim.progress, 3);
                    camera.position.lerpVectors(cameraAnim.startPos, cameraAnim.endPos, t);
                    controls.target.lerpVectors(cameraAnim.startTarget, cameraAnim.endTarget, t);
                }
            }

            controls.update();
            updateHTMLOverlaysPosition();
            window.VillaGroundReview?.updatePins?.();
            renderer.render(scene, camera);
        }

        window.onload = function () {
            initScene();
        };
    