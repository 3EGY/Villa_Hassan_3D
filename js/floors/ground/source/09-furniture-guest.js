        // ============================================================================
        // 9. TOP-LEFT GUEST WASHROOM, VANITY & INDOOR PLANTERS (200 × 350 cm)
        // ============================================================================
        function buildTopLeftGuestWashroom() {
            const ceramicWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12 });
            const stoneVanity = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#f8fafc', '#94a3b8'), roughness: 0.2 });

            const washGroup = new THREE.Group();

            // Lower Vanity Counter (50 × 165 cm) with round sink bowl
            const vanity = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.78, 0.50), stoneVanity);
            vanity.position.set(-5.75, 0.39, -2.10);
            vanity.castShadow = true;
            washGroup.add(vanity);

            const sink = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.16, 0.14, 24), ceramicWhite);
            sink.position.set(-5.85, 0.85, -2.10);
            washGroup.add(sink);

            // Upper WC compartment (200 × 130 cm)
            const wc = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.42, 0.55), ceramicWhite);
            wc.position.set(-5.85, 0.21, -4.25);
            washGroup.add(wc);

            // Indoor greenery planters shown in green in the top-left washroom
            const p1 = createPlanterBox(-4.85, -2.12, 0.55, 0.42, 0.42, 2);
            const p2 = createPlanterBox(-6.05, -3.25, 0.55, 0.50, 0.42, 2);
            const p3 = createPlanterBox(-5.85, -5.25, 0.85, 0.45, 0.45, 3);
            washGroup.add(p1, p2, p3);

            furnitureGroup.add(washGroup);
            registerInteractiveItem(washGroup, 'topLeftWashroom', 'receptionLounge');
        }

