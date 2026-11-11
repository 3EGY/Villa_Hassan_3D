        // ============================================================================
        // 10. FORMAL DINING ROOM (452 cm wide, 250 × 90 cm Table with 8 Chairs)
        // ============================================================================
        function buildCentralDiningRoom() {
            const marbleTop = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#fffbeb', '#cbd5e1'), roughness: 0.15 });
            const walnutWood = new THREE.MeshStandardMaterial({ map: createWoodTexture('#5c371c', '#3d2410'), roughness: 0.35 });
            const chairFabric = new THREE.MeshStandardMaterial({ color: 0xf5ebe0, roughness: 0.55 });
            const chairBackMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });

            const diningGroup = new THREE.Group();
            diningGroup.position.set(0.55, 0, -0.05);

            // 1. Dining Table Top (250 × 90 cm)
            const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.50, 0.06, 0.90), marbleTop);
            tableTop.position.y = 0.76;
            tableTop.castShadow = true;
            tableTop.receiveShadow = true;
            diningGroup.add(tableTop);

            // Twin Sculptural Pedestal Bases
            [-0.75, 0.75].forEach(xOff => {
                const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.73, 20), walnutWood);
                ped.position.set(xOff, 0.365, 0);
                ped.castShadow = true;
                diningGroup.add(ped);
            });

            // 2. Eight Dining Chairs (3 North, 3 South, 1 West head, 1 East head)
            const chairPositions = [
                { x: -0.78, z: -0.68, rot: 0 },
                { x: 0.00,  z: -0.68, rot: 0 },
                { x: 0.78,  z: -0.68, rot: 0 },
                { x: -0.78, z: 0.68,  rot: Math.PI },
                { x: 0.00,  z: 0.68,  rot: Math.PI },
                { x: 0.78,  z: 0.68,  rot: Math.PI },
                { x: -1.52, z: 0.00,  rot: Math.PI / 2 },
                { x: 1.52,  z: 0.00,  rot: -Math.PI / 2 }
            ];

            chairPositions.forEach(cp => {
                const ch = new THREE.Group();
                ch.position.set(cp.x, 0, cp.z);
                ch.rotation.y = cp.rot;

                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.08, 0.48), chairFabric);
                seat.position.y = 0.46;
                seat.castShadow = true;
                ch.add(seat);

                const back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.08), chairBackMat);
                back.position.set(0, 0.70, -0.21);
                back.castShadow = true;
                ch.add(back);

                const legGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.44, 8);
                [
                    [-0.20, -0.19], [0.20, -0.19],
                    [-0.20, 0.19],  [0.20, 0.19]
                ].forEach(([lx, lz]) => {
                    const leg = new THREE.Mesh(legGeo, walnutWood);
                    leg.position.set(lx, 0.22, lz);
                    ch.add(leg);
                });

                diningGroup.add(ch);
            });

            // 3. Left Decorative Wall Niche Console / Sideboard (194 × 45 cm)
            const buffet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.86, 1.94), walnutWood);
            buffet.position.set(-2.08, 0.43, 0);
            buffet.castShadow = true;
            diningGroup.add(buffet);

            furnitureGroup.add(diningGroup);
            registerInteractiveItem(diningGroup, 'diningTableSet', 'diningRoom');
        }

