        // ============================================================================
        // 6. GROUND FLOOR SLABS & CAD BLUEPRINT UNDERLAY
        // ============================================================================
        function buildFloorsAndSlabs() {
            const creamMarbleTex = createMarbleTexture('#f5f2eb', '#dfd8c8');
            const kitchenTileTex = createMarbleTexture('#e2e8f0', '#cbd5e1');
            const receptionMarbleTex = createMarbleTexture('#faf7f2', '#e5dec9');
            const courtStoneTex = createMarbleTexture('#d6d3d1', '#a8a29e');

            const mainFloorMat = new THREE.MeshStandardMaterial({ map: creamMarbleTex, roughness: 0.24, metalness: 0.06 });
            const majlisFloorMat = new THREE.MeshStandardMaterial({ map: receptionMarbleTex, roughness: 0.20, metalness: 0.08 });
            const kitchenFloorMat = new THREE.MeshStandardMaterial({ map: kitchenTileTex, roughness: 0.25, metalness: 0.08 });
            const courtMat = new THREE.MeshStandardMaterial({ map: courtStoneTex, roughness: 0.65 });

            // Base Podium under the Ground Floor
            const podiumGeo = new THREE.BoxGeometry(16.8, 0.35, 17.2);
            const podiumMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
            const podium = new THREE.Mesh(podiumGeo, podiumMat);
            podium.position.set(-0.1, -0.20, -0.4);
            podium.receiveShadow = true;
            structureGroup.add(podium);

            function addFloorSlab(w, d, x, z, mat, zoneKey) {
                const geo = new THREE.BoxGeometry(w, 0.06, d);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x, 0, z);
                mesh.receiveShadow = true;
                mesh.userData = { zone: zoneKey };
                structureGroup.add(mesh);
                interactiveObjects.push(mesh);
            }

            // 1. Top-Left Service Court & Upper Guest Washroom (200 × 700 cm)
            addFloorSlab(2.35, 3.00, -5.42, -7.20, courtMat, 'receptionLounge');
            addFloorSlab(2.35, 4.00, -5.42, -3.70, kitchenFloorMat, 'receptionLounge');

            // 2. Reception Lounge (Left side of 1010 cm hall)
            addFloorSlab(3.90, 4.45, -1.95, -4.02, majlisFloorMat, 'receptionLounge');

            // 3. Grand Majlis (Right side of 1010 cm hall: 620 × 445 cm)
            addFloorSlab(6.35, 4.45, 3.12, -4.02, majlisFloorMat, 'grandMajlis');

            // 4. Middle-Left Main Kitchen (450 × 360 cm)
            addFloorSlab(4.65, 3.65, -4.15, -0.02, kitchenFloorMat, 'kitchen');

            // 5. Middle-Center Formal Dining Room (452 × 360 cm)
            addFloorSlab(4.75, 3.65, 0.55, -0.02, mainFloorMat, 'diningRoom');

            // 6. Bottom-Left Guest Washbasins, WC & Main Staircase (465 × 510 cm)
            addFloorSlab(4.65, 5.15, -4.15, 4.35, mainFloorMat, 'stairsWash');

            // 7. Bottom-Center Entrance/Stair Lobby & Partition Zone
            addFloorSlab(3.10, 5.15, -0.28, 4.35, mainFloorMat, 'lobbyPartition');

            // 8. Bottom-Right Family Living Room
            addFloorSlab(5.05, 4.45, 3.75, 4.70, mainFloorMat, 'familyLiving');

            // CAD Blueprint Overlay Plane
            const cadTex = createCADBlueprintTexture();
            const cadGeo = new THREE.PlaneGeometry(18.0, 18.0);
            const cadMat = new THREE.MeshBasicMaterial({
                map: cadTex,
                transparent: true,
                opacity: 0.45,
                depthWrite: false
            });
            cadOverlayMesh = new THREE.Mesh(cadGeo, cadMat);
            cadOverlayMesh.rotation.x = -Math.PI / 2;
            cadOverlayMesh.position.set(0.0, 0.036, 0.0);
            structureGroup.add(cadOverlayMesh);
        }

