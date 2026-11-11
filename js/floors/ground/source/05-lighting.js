        // ============================================================================
        // 5. LIGHTING SYSTEM & INTERACTIVE 3D SMART BULBS IN EVERY GROUND FLOOR ROOM
        // ============================================================================
        const COLOR_SPECTRUM_STOPS = [
            { t: 0.00, hex: '#ff8c1a', name: 'دافئ شموع 2700K' },
            { t: 0.16, hex: '#ffb454', name: 'دافئ 3000K' },
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

            // Smart Bulbs placed at the exact visual center of each Ground Floor room
            const roomLightSpecs = [
                { id: 'bulb_grandMajlis', name: 'ثريا المجلس الكبير', zone: 'grandMajlis', x: 2.35, y: 1.85, z: -4.10, maxI: 2.7, dist: 9.5, color: '#ffb454' },
                { id: 'bulb_reception', name: 'لمبة بهو الاستقبال', zone: 'receptionLounge', x: -1.65, y: 1.80, z: -4.10, maxI: 2.1, dist: 7.5, color: '#ffb454' },
                { id: 'bulb_topWash', name: 'لمبة المغاسل العلوية', zone: 'receptionLounge', x: -5.40, y: 1.75, z: -3.60, maxI: 1.8, dist: 6.0, color: '#38bdf8' },
                { id: 'bulb_dining', name: 'ثريا طاولة الطعام', zone: 'diningRoom', x: 0.55, y: 1.80, z: -0.05, maxI: 2.5, dist: 8.0, color: '#ffb454' },
                { id: 'bulb_kitchen', name: 'إضاءة جزيرة المطبخ', zone: 'kitchen', x: -4.15, y: 1.80, z: -0.05, maxI: 2.3, dist: 7.5, color: '#fff4e6' },
                { id: 'bulb_familyLiving', name: 'ثريا المعيشة العائلية', zone: 'familyLiving', x: 3.35, y: 1.85, z: 4.65, maxI: 2.5, dist: 8.5, color: '#ffb454' },
                { id: 'bulb_lobbyPartition', name: 'إضاءة الموزع والحوض', zone: 'lobbyPartition', x: 0.25, y: 1.75, z: 4.25, maxI: 2.1, dist: 7.0, color: '#10b981' },
                { id: 'bulb_stairsWash', name: 'لمبة الدرج والمغاسل', zone: 'stairsWash', x: -4.15, y: 1.85, z: 4.65, maxI: 2.0, dist: 7.5, color: '#fff4e6' }
            ];

            smartLights = [];
            nightLights = [];

            const effectiveLights=roomLightSpecs.map(spec=>{
                const review=window.GroundReviewModel?.getLight(spec.id);
                return review?{...spec,x:review.x,y:review.y,z:review.z,name:review.label||spec.name}:spec;
            });
            effectiveLights.forEach((spec,idx)=>addGroundSmartLight(spec,idx));
            for(const review of (window.GroundReviewModel?.items||[])){
                if(review.kind==='light'&&review.custom){
                    addGroundSmartLight({id:review.id,name:review.label||'إضاءة مضافة',zone:review.roomId||'overview',x:review.x,y:review.y,z:review.z,color:'#ffb454',maxI:2,dist:8});
                }
            }

            setLightingMode('night');
        }

        function addGroundSmartLight(spec, idx = smartLights.length) {
                const pl = new THREE.PointLight(spec.color, spec.maxI * 0.9, spec.dist, 1.5);
                pl.position.set(spec.x, spec.y, spec.z);
                scene.add(pl);
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
                    isOn: true,
                    brightness: 90,
                    colorHex: spec.color,
                    colorRatio: idx === 6 ? 0.98 : (idx === 2 ? 0.48 : 0.16),
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
        }

        function applySmartLightState(lightObj) {
            if (!lightObj) return;
            const c = new THREE.Color(lightObj.colorHex);
            lightObj.pointLight.color.copy(c);
            lightObj.bulbMat.color.copy(c);
            lightObj.haloMat.color.copy(c);

            if (lightObj.isOn && lightObj.brightness > 0) {
                const ratio = lightObj.brightness / 100;
                const envMultiplier = isNightMode ? 1.55 : 0.95;
                lightObj.pointLight.intensity = lightObj.maxIntensity * ratio * envMultiplier;
                lightObj.bulbMat.emissive.copy(c);
                lightObj.bulbMat.emissiveIntensity = 0.6 + ratio * 1.6;
                lightObj.haloMat.opacity = 0.12 + ratio * 0.38;
                lightObj.haloMesh.scale.setScalar(0.85 + ratio * 0.45);
            } else {
                lightObj.pointLight.intensity = 0;
                lightObj.bulbMat.emissive.setHex(0x000000);
                lightObj.bulbMat.emissiveIntensity = 0;
                lightObj.haloMat.opacity = 0.04;
            }

            updateSmartBulbPinUI(lightObj);
        }

        function createWarmLEDStrip(w, h, d, x, y, z) {
            const mat = new THREE.MeshStandardMaterial({
                color: 0xffedd5,
                emissive: 0xff9d2e,
                emissiveIntensity: 0.85,
                roughness: 0.2
            });
            emissiveMaterials.push(mat);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.position.set(x, y, z);
            furnitureGroup.add(mesh);
            return mesh;
        }

