/**
 * Villa Hassan | Light fixtures, materials and scene lighting
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        // ============================================================================
        // 5. LIGHTING SYSTEM & INTERACTIVE 3D SMART BULBS IN EVERY ROOM
        // ============================================================================
        const COLOR_SPECTRUM_STOPS = [
            { t: 0.00, hex: '#ff8c1a', name: 'دافئ شموع 2700K' },
            { t: 0.16, hex: '#ffb454', name: 'دافئ 3000K' },
            { t: 0.24, hex: '#ffcf94', name: 'دافئ ناعم' },
            { t: 0.32, hex: '#fff4e6', name: 'أبيض ناعم 4000K' },
            { t: 0.48, hex: '#38bdf8', name: 'سماوي نهاري' },
            { t: 0.64, hex: '#818cf8', name: 'أزرق ملكي' },
            { t: 0.80, hex: '#f43f5e', name: 'وردي دافئ' },
            { t: 1.00, hex: '#10b981', name: 'أخضر زمردي' }
        ];

        function setupLighting() {
            ambientLight = new THREE.AmbientLight(0xfffbf0, 0.22);
            scene.add(ambientLight);

            hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.20);
            hemiLight.position.set(0, 25, 0);
            scene.add(hemiLight);

            dirLight = new THREE.DirectionalLight(0xfff7ed, 0.25);
            dirLight.position.set(12, 22, 14);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.camera.near = 1;
            dirLight.shadow.camera.far = 50;
            const d = 12;
            dirLight.shadow.camera.left = -d;
            dirLight.shadow.camera.right = d;
            dirLight.shadow.camera.top = d;
            dirLight.shadow.camera.bottom = -d;
            dirLight.shadow.bias = -0.0005;
            scene.add(dirLight);

            // Local downlights with soft shadows keep lighting concentrated in its room.
            const glowCanvas = document.createElement('canvas');
            glowCanvas.width = glowCanvas.height = 64;
            const glowContext = glowCanvas.getContext('2d');
            const gradient = glowContext.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.22, 'rgba(255,255,255,.7)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,.16)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            glowContext.fillStyle = gradient;
            glowContext.fillRect(0, 0, 64, 64);
            const bulbGlowTexture = new THREE.CanvasTexture(glowCanvas);
            const roomLightSpecs = [
                { id: 'bulb_rightBedroom', name: 'إضاءة الغرفة اليمنى', zone: 'rightBedroom', x: 5.36537, y: 1.80, z: 6.090278, maxI: 2.15, dist: 7, range: 7, angle: 1.0, penumbra: 0.65, color: '#ffcf94' },
                { id: 'bulb_leftBedroom', name: 'إضاءة الغرفة اليسرى', zone: 'leftBedroom', x: -4.240185, y: 1.80, z: 0.487037, maxI: 1.85, dist: 7, range: 7, angle: 1.05, penumbra: 0.65, color: '#ffcf94' },
                { id: 'bulb_terraceLounge', name: 'إضاءة جلسة التراس', zone: 'terraceLounge', x: 7.423704, y: 1.80, z: -7.975, maxI: 1.7, dist: 7, range: 7, angle: 1.0, penumbra: 0.65, color: '#ffcf94' },
                { id: 'bulb_guestBathroom', name: 'إضاءة حمام الضيوف', zone: 'guestBathroom', x: -5.337963, y: 1.80, z: 3.414444, maxI: 1.15, dist: 7, range: 7, angle: 0.64, penumbra: 0.65, color: '#ffcf94' },
                { id: 'bulb_washbasins', name: 'إضاءة المغاسل', zone: 'washbasins', x: -2.982315, y: 1.80, z: 3.345833, maxI: 1.35, dist: 7, range: 7, angle: 0.7, penumbra: 0.65, color: '#ffcf94' },
                { id: 'bulb_courtyard', name: 'إضاءة التراس الأيسر', zone: 'courtyard', x: -5.475185, y: 1.80, z: -8.020741, maxI: 1.5, dist: 7, range: 7, angle: 0.88, penumbra: 0.65, color: '#ffcf94' },
                { id: 'bulb_masterBed', name: 'لمبة غرفة النوم', zone: 'masterBedroom', x: 0.219537, y: 1.75, z: -4.544444, maxI: 2.2, dist: 7.5, color: '#ffb454' },
                { id: 'bulb_bayLounge', name: 'لمبة الجلسة القوسية', zone: 'masterBedroom', x: 2.392222, y: 1.75, z: -6.831481, maxI: 2.0, dist: 6.5, color: '#ffb454' },
                { id: 'bulb_dressing', name: 'لمبة غرفة الملابس', zone: 'dressing', x: -2.753611, y: 1.80, z: -4.315741, maxI: 1.9, dist: 6.0, color: '#fff4e6' },
                { id: 'bulb_bathroom', name: 'لمبة الحمام الرئيسي', zone: 'bathroom', x: -5.337963, y: 1.80, z: -4.430093, maxI: 1.9, dist: 6.5, color: '#38bdf8' },
                { id: 'bulb_living', name: 'ثريا الصالة العائلية', zone: 'livingRoom', x: 0.676944, y: 1.85, z: 0.830093, maxI: 2.6, dist: 9.0, color: '#ffb454' },
                { id: 'bulb_lobby', name: 'لمبة بهو الحوض', zone: 'lobbyPlanter', x: 0.288148, y: 1.70, z: 5.495648, maxI: 2.2, dist: 7.5, color: '#10b981' },
                { id: 'bulb_terrace', name: 'إضاءة التراس والحديقة', zone: 'terrace', x: 7.423704, y: 1.70, z: -4.109907, maxI: 2.0, dist: 7.5, color: '#ffb454' },
                { id: 'bulb_stairs', name: 'لمبة الدرج', zone: 'stairs', x: -4.240185, y: 1.85, z: 5.930185, maxI: 1.9, dist: 7.0, color: '#fff4e6' }
            ];

            smartLights = [];
            nightLights = [];

            roomLightSpecs.forEach((spec, idx) => {
                const pl = new THREE.SpotLight(spec.color, spec.maxI, spec.range ?? spec.dist * 0.92, spec.angle ?? 1.06, spec.penumbra ?? 0.62, 1.3);
                pl.position.set(spec.x, spec.zone === 'stairs' ? 3.15 : spec.y + 0.35, spec.z);
                pl.target.position.set(spec.x, 0, spec.z);
                pl.castShadow = true;
                pl.shadow.mapSize.set(512, 512);
                pl.shadow.camera.near = 0.12;
                pl.shadow.camera.far = spec.dist;
                pl.shadow.bias = -0.0004;
                pl.shadow.normalBias = 0.018;
                pl.userData = { baseIntensity: spec.maxI };
                scene.add(pl, pl.target);
                nightLights.push(pl);

                const fixtureGroup = new THREE.Group();
                fixtureGroup.position.set(spec.x, spec.y, spec.z);

                const mountMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 12), mountMat);
                stem.position.y = 0.20;
                const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.05, 20), mountMat);
                cap.position.y = 0.08;
                fixtureGroup.add(stem, cap);

                const bulbMat = new THREE.MeshStandardMaterial({
                    color: spec.color,
                    emissive: spec.color,
                    emissiveIntensity: 1.8,
                    roughness: 0.15
                });
                const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), bulbMat);
                fixtureGroup.add(bulbMesh);

                const haloMat = new THREE.MeshBasicMaterial({
                    color: spec.color,
                    transparent: true,
                    opacity: 0.38,
                    side: THREE.DoubleSide
                });
                const haloMesh = new THREE.Mesh(new THREE.RingGeometry(0.20, 0.34, 32), haloMat);
                haloMesh.rotation.x = Math.PI / 2;
                fixtureGroup.add(haloMesh);
                const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: bulbGlowTexture, color: spec.color, transparent: true,
                    opacity: 0.50, blending: THREE.AdditiveBlending, depthWrite: false
                }));
                glowSprite.scale.set(0.85, 0.85, 1);
                fixtureGroup.add(glowSprite);

                fixtureGroup.visible = false;
                scene.add(fixtureGroup);

                const smartLightObj = {
                    id: spec.id,
                    index: idx,
                    name: spec.name,
                    zone: spec.zone,
                    pos: new THREE.Vector3(spec.x, spec.y, spec.z),
                    pointLight: pl,
                    fixtureGroup,
                    bulbMesh,
                    bulbMat,
                    haloMesh,
                    haloMat,
                    glowSprite,
                    isOn: true,
                    brightness: 90,
                    colorHex: spec.color,
                    colorRatio: (COLOR_SPECTRUM_STOPS.find(stop => stop.hex === spec.color) || COLOR_SPECTRUM_STOPS[1]).t,
                    maxIntensity: spec.maxI,
                    timerMinutes: 0,
                    timerRemainingSec: 0,
                    timerInterval: null,
                    pinEl: null
                };

                fixtureGroup.traverse(child => {
                    if (child.isMesh) {
                        child.userData = { isSmartBulb: true, smartLight: smartLightObj };
                        interactiveObjects.push(child);
                    }
                });

                smartLights.push(smartLightObj);
                applySmartLightState(smartLightObj);
            });

            // Register existing lights for future device tabs and integrations.
            window.VillaLightingAdapter.registerLights();

            // Set default dark mode scene lighting
            setLightingMode('night');
        }

        function applySmartLightState(lightObj) {
            if (!lightObj) return;
            const c = new THREE.Color(lightObj.colorHex);
            lightObj.pointLight.color.copy(c);
            lightObj.bulbMat.color.copy(c);
            lightObj.haloMat.color.copy(c);
            lightObj.glowSprite.material.color.copy(c);
            lightObj.glowSprite.material.opacity = lightObj.isOn ? lightObj.brightness / 100 * 0.5 : 0;

            if (lightObj.isOn && lightObj.brightness > 0) {
                const ratio = lightObj.brightness / 100;
                const envMultiplier = isNightMode ? 1.65 : 0.70;
                lightObj.pointLight.intensity = lightObj.maxIntensity * ratio * envMultiplier;
                lightObj.bulbMat.emissive.copy(c);
                lightObj.bulbMat.emissiveIntensity = 0.6 + ratio * 1.6;
                lightObj.haloMat.opacity = 0.12 + ratio * 0.38;
                lightObj.haloMesh.scale.setScalar(0.85 + ratio * 0.45);
            } else {
                lightObj.pointLight.intensity = 0;
                lightObj.bulbMat.emissive.setHex(0x000000);
                lightObj.bulbMat.emissiveIntensity = 0;
                lightObj.haloMat.opacity = 0;
            }

            updateSmartBulbPinUI(lightObj);
            if (window.VillaLightingAdapter) window.VillaLightingAdapter.publish(lightObj);
            if (!isApplyingLightingPreset) {
                syncLightingDecor();
                syncLightingPresetUI();
            }
        }

        function createWarmLEDStrip(w, h, d, x, y, z, zone) {
            const mat = new THREE.MeshStandardMaterial({
                color: 0xffedd5,
                emissive: 0xff9d2e,
                emissiveIntensity: 0.8,
                roughness: 0.2
            });
            mat.userData.zone = zone;
            emissiveMaterials.push(mat);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.position.set(x, y, z);
            furnitureGroup.add(mesh);
            return mesh;
        }
