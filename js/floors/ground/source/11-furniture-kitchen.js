        // ============================================================================
        // 11. MAIN KITCHEN WITH CENTRAL ISLAND (450 cm wide, Island 182 × 92 cm)
        // ============================================================================
        function buildMainKitchenAndIsland() {
            const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.1 });
            const woodCabinetMat = new THREE.MeshStandardMaterial({ map: createWoodTexture('#78472a', '#54301a'), roughness: 0.4 });
            const quartzTopMat = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#ffffff', '#cbd5e1'), roughness: 0.12 });
            const steelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.2, metalness: 0.85 });
            const burnerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.5 });

            // 1. Central Kitchen Island (182 × 92 cm) at (-4.10, -0.05)
            // Clearances: 104 cm to left sink counter, 109 cm to right wall
            const islandGroup = new THREE.Group();
            islandGroup.position.set(-4.10, 0, -0.05);

            const islandBase = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.86, 0.88), woodCabinetMat);
            islandBase.position.y = 0.43;
            islandBase.castShadow = true;
            islandBase.receiveShadow = true;
            islandGroup.add(islandBase);

            const islandTop = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.05, 0.92), quartzTopMat);
            islandTop.position.y = 0.885;
            islandTop.castShadow = true;
            islandGroup.add(islandTop);

            furnitureGroup.add(islandGroup);
            registerInteractiveItem(islandGroup, 'kitchenIsland', 'kitchen');
            createWarmLEDStrip(1.72, 0.03, 0.84, -4.10, 0.04, -0.05);

            // 2. Perimeter U-Shaped Kitchen Counters (65 cm depth along top & left, 80 cm fridge unit at bottom)
            const countersGroup = new THREE.Group();

            // Top Counter Run (450 cm wide × 65 cm deep)
            const topCounter = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.86, 0.65), cabinetMat);
            topCounter.position.set(-4.12, 0.43, -1.36);
            topCounter.castShadow = true;
            countersGroup.add(topCounter);

            const topQuartz = new THREE.Mesh(new THREE.BoxGeometry(4.47, 0.04, 0.67), quartzTopMat);
            topQuartz.position.set(-4.12, 0.88, -1.36);
            countersGroup.add(topQuartz);

            // Built-in 90 cm Cooktop / Stove on Top Counter
            const cooktop = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.02, 0.52), burnerMat);
            cooktop.position.set(-4.25, 0.91, -1.36);
            countersGroup.add(cooktop);

            // Left Counter Run (65 cm wide × 340 cm long) with 130 cm Double Sink
            const leftCounter = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.86, 2.80), cabinetMat);
            leftCounter.position.set(-6.05, 0.43, 0.05);
            leftCounter.castShadow = true;
            countersGroup.add(leftCounter);

            const leftQuartz = new THREE.Mesh(new THREE.BoxGeometry(0.67, 0.04, 2.82), quartzTopMat);
            leftQuartz.position.set(-6.05, 0.88, 0.05);
            countersGroup.add(leftQuartz);

            // Double Sink (130 cm) on Left Counter
            const sinkBasin = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 1.30), steelMat);
            sinkBasin.position.set(-6.05, 0.905, -0.05);
            countersGroup.add(sinkBasin);

            // Bottom Counter & Tall Refrigerator/Oven Tower (80 cm deep)
            const bottomCounter = new THREE.Mesh(new THREE.BoxGeometry(2.40, 0.86, 0.65), cabinetMat);
            bottomCounter.position.set(-5.15, 0.43, 1.36);
            countersGroup.add(bottomCounter);

            const fridgeTower = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.32, 0.80), steelMat);
            fridgeTower.position.set(-4.15, 0.66, 1.28);
            fridgeTower.castShadow = true;
            countersGroup.add(fridgeTower);

            furnitureGroup.add(countersGroup);
            registerInteractiveItem(countersGroup, 'kitchenCounters', 'kitchen');
        }

