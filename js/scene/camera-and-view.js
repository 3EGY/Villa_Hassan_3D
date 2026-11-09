/**
 * Villa Hassan | Framing, camera transitions, wall height and CAD overlay
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        function getOverviewFramePoints() {
            const points = [];
            scene.updateMatrixWorld(true);
            for (const group of [structureGroup, furnitureGroup, plantsGroup]) {
                group.traverse(mesh => {
                    if (!mesh.isMesh || mesh === cadOverlayMesh || mesh.userData.isPresentationBase
                        || !isEffectivelyVisible(mesh)) return;
                    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
                    const box = mesh.geometry.boundingBox;
                    for (const x of [box.min.x, box.max.x]) {
                        for (const y of [box.min.y, box.max.y]) {
                            for (const z of [box.min.z, box.max.z]) {
                                points.push(new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld));
                            }
                        }
                    }
                });
            }
            return points;
        }

        // Fit only the selected footprint inside the usable area above the bottom controls.
        // Center the room itself; a lamp at an edge must not force the camera to show the whole villa.
        function getFramedCameraView(bounds, direction, isOverview = false) {
            direction = direction.clone().normalize();
            const height = Math.max(isOverview ? 2.6 : 2.15, currentWallHeight + 0.08);
            const center = new THREE.Vector3((bounds[0] + bounds[2]) / 2, height * 0.45,
                (bounds[1] + bounds[3]) / 2);
            const corners = isOverview ? getOverviewFramePoints() : [];
            if (!corners.length) for (const x of [bounds[0], bounds[2]]) {
                for (const z of [bounds[1], bounds[3]]) {
                    for (const y of [0, height]) corners.push(new THREE.Vector3(x, y, z));
                }
            }
            if (isOverview) new THREE.Box3().setFromPoints(corners).getCenter(center);
            const topInset = Math.min(64, window.innerHeight * 0.16);
            const bottomInset = Math.min(getBottomOverlayHeight() + 10, window.innerHeight * 0.36);
            const sideInset = window.innerWidth < 640 ? (isOverview ? 6 : 10) : 18;
            const minY = -1 + 2 * bottomInset / window.innerHeight;
            const maxY = 1 - 2 * topInset / window.innerHeight;
            const maxX = 1 - 2 * sideInset / window.innerWidth;
            const viewCenterY = (minY + maxY) / 2;
            const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
            const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
            const up = direction.clone().cross(right).normalize();
            const probe = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
            let target = center.clone();
            function fits(distance) {
                target = center.clone().addScaledVector(up, -viewCenterY * distance * tanHalfFov);
                probe.position.copy(target).addScaledVector(direction, distance);
                probe.lookAt(target);
                probe.updateMatrixWorld(true);
                return corners.every(point => {
                    const v = point.clone().project(probe);
                    return v.z > -1 && v.z < 1 && Math.abs(v.x) <= maxX && v.y >= minY && v.y <= maxY;
                });
            }
            let near = 2, far = 4;
            while (!fits(far) && far < 160) far *= 1.4;
            for (let i = 0; i < 22; i++) {
                const distance = (near + far) / 2;
                if (fits(distance)) far = distance;
                else near = distance;
            }
            const distance = far * 1.015;
            fits(distance);
            return { target, position: target.clone().addScaledVector(direction, distance), distance };
        }

        function focusZone(zoneKey, showCard = false) {
            const spec = ZONE_SPECS[zoneKey] || ZONE_SPECS.overview;
            const isOverview = zoneKey === 'overview' || !ROOM_VIEW_BOUNDS[zoneKey];
            selectedZoneKey = zoneKey;
            selectedTargetGroup = null;
            cameraWasManuallyMoved = false;
            if (selectionBoxHelper) selectionBoxHelper.visible = false;
            const bounds = isOverview ? VILLA_VIEW_BOUNDS : ROOM_VIEW_BOUNDS[zoneKey];
            let direction;
            if (isOverview) {
                direction = overviewViewMode === 'iso' ? new THREE.Vector3(1, 1.35, 1)
                    : overviewViewMode === 'orbit' ? new THREE.Vector3(0, 1.2, 1)
                    : new THREE.Vector3(0, 1, 0.20);
                ['cam-orbit', 'cam-top', 'cam-iso'].forEach(id => {
                    document.getElementById(id).classList.toggle('btn-active', id === `cam-${overviewViewMode}`);
                });
            } else if (camera.aspect < 0.85) {
                // On portrait phones put the longest room dimension along the taller screen axis.
                direction = bounds[2] - bounds[0] > bounds[3] - bounds[1]
                    ? new THREE.Vector3(1, 2.4, 0.12) : new THREE.Vector3(0.12, 2.4, 1);
            } else {
                direction = new THREE.Vector3(spec.camPos.x - spec.target.x,
                    spec.camPos.y - spec.target.y, spec.camPos.z - spec.target.z).normalize();
                direction.y = Math.max(direction.y, window.innerHeight < 500 ? 2.4 : 1.15);
            }
            const view = getFramedCameraView(bounds, direction, isOverview);
            controls.maxDistance = Math.max(35, view.distance * 1.5);
            beginCameraTransition(view.position, view.target);
            if (showCard) showContextCardForSpec(spec, false);
        }

        function beginCameraTransition(position, target) {
            controls.enableDamping = false;
            controls.update();
            controls.enabled = false;
            cameraAnim = {
                startPos: camera.position.clone(), endPos: position,
                startTarget: controls.target.clone(), endTarget: target,
                progress: 0, startTime: performance.now()
            };
        }

        function setCameraView(mode) {
            selectZoneFromDock('overview');
            overviewViewMode = ['top', 'orbit', 'iso'].includes(mode) ? mode : 'top';
            focusZone('overview');
            closeAllPopovers();
        }

        function updateWallHeight(val) {
            currentWallHeight = parseFloat(val);
            document.getElementById('wall-height-val').textContent = `${currentWallHeight.toFixed(2)} م`;
            wallMeshes.forEach(w => {
                w.body.scale.y = currentWallHeight;
                w.cap.position.y = currentWallHeight + 0.015;
            });
            doorWindowMeshes.forEach(dw => {
                dw.mesh.scale.y = Math.max(0.08, currentWallHeight - dw.sill);
            });
            updateReviewedWindows();
            requestLightingShadowUpdate();
            if (!cameraWasManuallyMoved) focusZone(focusedZoneKey);
        }

        function setWallHeightPreset(val) {
            const slider = document.getElementById('wall-height-slider');
            if (slider) slider.value = val;
            updateWallHeight(val);
        }

        function updateCadOverlay(val) {
            const pct = parseInt(val, 10);
            document.getElementById('cad-opacity-val').textContent = `${pct}%`;
            if (cadOverlayMesh) {
                cadOverlayMesh.material.opacity = pct / 100;
                cadOverlayMesh.visible = pct > 0;
            }
        }
