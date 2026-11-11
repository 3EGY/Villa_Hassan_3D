        // ============================================================================
        // 13. MAIN STAIRCASE (140 cm flights) & GUEST WASHBASINS (210×150) / WC (175×140)
        // ============================================================================
        function buildMainStaircaseAndGuestWash() {
            const stepMarble = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#f8fafc', '#cbd5e1'), roughness: 0.25 });
            const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });

            const stairsMasterGroup = new THREE.Group();

            // 1. Guest Washbasin Room (210 × 150 cm): Vanity Counter + Basin (50 cm) + Planter (45 cm)
            const counter = new THREE.Mesh(new THREE.BoxGeometry(2.10, 0.78, 0.48), stepMarble);
            counter.position.set(-3.15, 0.39, 3.05);
            counter.castShadow = true;
            stairsMasterGroup.add(counter);

            const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.16, 0.14, 24), ceramicMat);
            basin.position.set(-3.65, 0.85, 3.05);
            stairsMasterGroup.add(basin);

            const washPlanter = createPlanterBox(-2.45, 3.05, 0.65, 0.42, 0.82, 2);
            stairsMasterGroup.add(washPlanter);

            // 2. Guest Powder Room / WC (175 × 140 cm)
            const wcBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.54), ceramicMat);
            wcBase.position.set(-5.55, 0.21, 3.00);
            stairsMasterGroup.add(wcBase);

            const smallSink = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.15, 20), ceramicMat);
            smallSink.position.set(-6.15, 0.82, 2.35);
            stairsMasterGroup.add(smallSink);

            // 3. Main 3-Flight U-Shaped Staircase (140 cm flight widths, 42 cm central gap)
            const stairGroup = new THREE.Group();
            for (let i = 0; i < 10; i++) {
                const tread = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.14, 1.35), stepMarble);
                tread.position.set(-2.15 - i * 0.30, 0.08 + i * 0.12, 4.10);
                tread.castShadow = true;
                tread.receiveShadow = true;
                stairGroup.add(tread);
            }

            const landing = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.16, 3.30), stepMarble);
            landing.position.set(-5.70, 1.28, 5.10);
            landing.castShadow = true;
            stairGroup.add(landing);

            for (let i = 0; i < 10; i++) {
                const tread = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.14, 1.35), stepMarble);
                tread.position.set(-4.95 + i * 0.30, 1.38 + i * 0.12, 6.10);
                tread.castShadow = true;
                stairGroup.add(tread);
            }

            const balustrade = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.85, 0.04), glassMat);
            balustrade.position.set(-3.55, 1.15, 4.80);
            stairGroup.add(balustrade);

            stairsMasterGroup.add(stairGroup);
            structureGroup.add(stairsMasterGroup);
            registerInteractiveItem(stairsMasterGroup, 'groundStaircaseAndWash', 'stairsWash');
        }

        // Helper to build rectangular planter boxes with 3D greenery
        function createPlanterBox(cx, cz, w, d, h, numPlants = 4) {
            const boxGroup = new THREE.Group();
            boxGroup.position.set(cx, 0, cz);

            const rimMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.5 });
            const soilMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.9 });

            const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), rimMat);
            boxMesh.position.y = h / 2;
            boxMesh.castShadow = true;
            boxMesh.receiveShadow = true;
            boxGroup.add(boxMesh);

            const soilMesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.1, w - 0.08), h + 0.02, Math.max(0.1, d - 0.08)), soilMat);
            soilMesh.position.y = h / 2;
            boxGroup.add(soilMesh);

            for (let i = 0; i < numPlants; i++) {
                const px = (w > d) ? ((i / Math.max(1, numPlants - 1)) - 0.5) * (w * 0.70) : (Math.random() - 0.5) * (w * 0.45);
                const pz = (d >= w) ? ((i / Math.max(1, numPlants - 1)) - 0.5) * (d * 0.70) : (Math.random() - 0.5) * (d * 0.45);
                createTropicalPlantCluster(boxGroup, px, h, pz, 0.65 + Math.random() * 0.30);
            }

            plantsGroup.add(boxGroup);
            return boxGroup;
        }

        function createTropicalPlantCluster(parentGroup, x, y, z, scale = 1.0, hasTrunk = false) {
            const cluster = new THREE.Group();
            cluster.position.set(x, y, z);

            const greens = [0x15803d, 0x16a34a, 0x22c55e, 0x059669];
            if (hasTrunk) {
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.65 * scale, 10), trunkMat);
                trunk.position.y = 0.32 * scale;
                trunk.castShadow = true;
                cluster.add(trunk);
            }

            const foliageCount = hasTrunk ? 7 : 5;
            for (let i = 0; i < foliageCount; i++) {
                const leafMat = new THREE.MeshStandardMaterial({
                    color: greens[i % greens.length],
                    roughness: 0.5
                });
                const r = (0.14 + Math.random() * 0.10) * scale;
                const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), leafMat);
                const angle = (i / foliageCount) * Math.PI * 2;
                const dist = hasTrunk ? 0.14 * scale : 0.08 * scale;
                leaf.position.set(
                    Math.cos(angle) * dist,
                    (hasTrunk ? 0.62 : 0.14) * scale + Math.random() * 0.12 * scale,
                    Math.sin(angle) * dist
                );
                leaf.scale.set(1.1, 0.75, 1.1);
                leaf.castShadow = true;
                cluster.add(leaf);
            }

            parentGroup.add(cluster);
        }

