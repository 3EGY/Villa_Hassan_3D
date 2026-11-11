        // ============================================================================
        // 17. WALL HEIGHT, LAYERS, LIGHTING MODES & OBJ EXPORT
        // ============================================================================
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
            window.VillaGroundReview?.refresh3D?.();
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

        function setLightingMode(mode) {
            isNightMode = (mode === 'night');
            const dayBtn = document.getElementById('light-day');
            const nightBtn = document.getElementById('light-night');
            const qIcon = document.getElementById('quick-light-icon');
            const qText = document.getElementById('quick-light-text');

            if (isNightMode) {
                if (dayBtn) dayBtn.classList.remove('btn-active');
                if (nightBtn) nightBtn.classList.add('btn-active');
                if (qIcon) qIcon.className = 'fa-solid fa-moon text-sky-300';
                if (qText) qText.textContent = 'ليلي 3000K';
                scene.background.setHex(0x050811);
                scene.fog.color.setHex(0x050811);
                ambientLight.intensity = 0.22;
                hemiLight.intensity = 0.20;
                dirLight.intensity = 0.25;
            } else {
                if (nightBtn) nightBtn.classList.remove('btn-active');
                if (dayBtn) dayBtn.classList.add('btn-active');
                if (qIcon) qIcon.className = 'fa-solid fa-sun text-amber-300';
                if (qText) qText.textContent = 'نهاري';
                scene.background.setHex(0x0b1120);
                scene.fog.color.setHex(0x0b1120);
                ambientLight.intensity = 0.65;
                hemiLight.intensity = 0.55;
                dirLight.intensity = 1.15;
            }

            smartLights.forEach(sl => applySmartLightState(sl));
        }

        function toggleDayNightQuick(event) {
            if (event) event.stopPropagation();
            setLightingMode(isNightMode ? 'day' : 'night');
        }

        function toggleGroupVisibility(groupName, visible) {
            if (groupName === 'furniture' && furnitureGroup) furnitureGroup.visible = visible;
            if (groupName === 'plants' && plantsGroup) plantsGroup.visible = visible;
        }

        function toggleRoomLabels(visible) {
            showRoomLabelsFlag = visible;
        }

        function toggleDimensionBadges(visible) {
            showDimBadgesFlag = visible;
        }

        function toggleSmartBulbPins(visible) {
            showSmartBulbPinsFlag = visible;
            smartLights.forEach(sl => {
                sl.fixtureGroup.visible = visible;
            });
            if (!visible) closeRadialLightMenu();
        }

        function toggleWallXRay(enabled) {
            isWallXRay = enabled;
            wallMat.transparent = enabled;
            wallMat.opacity = enabled ? 0.22 : 1.0;
            wallMat.needsUpdate = true;
        }

        function exportSceneToOBJ() {
            let objContent = "# Villa Hassan Ground Floor 3D Model - Exported from Three.js\n";
            let vertexOffset = 1;

            scene.traverse(node => {
                if (node.isMesh && node.visible && node !== cadOverlayMesh) {
                    const geo = node.geometry;
                    if (!geo || !geo.attributes || !geo.attributes.position) return;

                    objContent += `o ${node.name || 'Mesh_' + node.id}\n`;
                    const posAttr = geo.attributes.position;
                    const v = new THREE.Vector3();

                    for (let i = 0; i < posAttr.count; i++) {
                        v.fromBufferAttribute(posAttr, i);
                        v.applyMatrix4(node.matrixWorld);
                        objContent += `v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`;
                    }

                    if (geo.index) {
                        const idx = geo.index;
                        for (let i = 0; i < idx.count; i += 3) {
                            const a = idx.getX(i) + vertexOffset;
                            const b = idx.getX(i + 1) + vertexOffset;
                            const c = idx.getX(i + 2) + vertexOffset;
                            objContent += `f ${a} ${b} ${c}\n`;
                        }
                    } else {
                        for (let i = 0; i < posAttr.count; i += 3) {
                            const a = i + vertexOffset;
                            const b = i + 1 + vertexOffset;
                            const c = i + 2 + vertexOffset;
                            objContent += `f ${a} ${b} ${c}\n`;
                        }
                    }
                    vertexOffset += posAttr.count;
                }
            });

            const blob = new Blob([objContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Villa_Hassan_Ground_Floor_3D.obj';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("تم تصدير وتحميل ملف المجسم Villa_Hassan_Ground_Floor_3D.obj بنجاح");
        }

        let toastTimer = null;
        function showToast(text) {
            const toast = document.getElementById('toast-msg');
            const toastText = document.getElementById('toast-text');
            if (!toast || !toastText) return;
            toastText.textContent = text;
            toast.classList.remove('opacity-0');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                toast.classList.add('opacity-0');
            }, 3400);
        }

