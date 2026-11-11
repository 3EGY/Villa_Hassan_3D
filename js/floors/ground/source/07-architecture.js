        // ============================================================================
        // 7. ARCHITECTURAL WALLS, WINDOWS & SLIDING DOORS (Exact Ground Floor Plan)
        // ============================================================================
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xfafaf9,
            roughness: 0.55,
            metalness: 0.05
        });
        const wallCapMat = new THREE.MeshStandardMaterial({
            color: 0xd97706,
            roughness: 0.4
        });
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xbae6fd,
            transparent: true,
            opacity: 0.38,
            roughness: 0.05,
            metalness: 0.1,
            transmission: 0.6
        });
        const woodDoorMat = new THREE.MeshStandardMaterial({
            color: 0x9a5b32,
            roughness: 0.45
        });

        function addWallSegment(x1, z1, x2, z2, thickness = 0.20, isPartition = false) {
            const dx = x2 - x1;
            const dz = z2 - z1;
            const length = Math.hypot(dx, dz);
            if (length < 0.02) return;
            const angle = Math.atan2(dz, dx);
            const cx = (x1 + x2) / 2;
            const cz = (z1 + z2) / 2;

            const geo = new THREE.BoxGeometry(length, 1.0, thickness);
            geo.translate(0, 0.5, 0);
            const mesh = new THREE.Mesh(geo, wallMat);
            mesh.position.set(cx, 0, cz);
            mesh.rotation.y = -angle;
            mesh.scale.y = currentWallHeight;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            structureGroup.add(mesh);

            const capGeo = new THREE.BoxGeometry(length + 0.01, 0.03, thickness + 0.01);
            const capMesh = new THREE.Mesh(capGeo, wallCapMat);
            capMesh.position.set(cx, currentWallHeight + 0.015, cz);
            capMesh.rotation.y = -angle;
            structureGroup.add(capMesh);

            wallMeshes.push({ body: mesh, cap: capMesh, isPartition });
        }

        function addWindowOrDoor(x1, z1, x2, z2, type = 'window') {
            const sourceIndex=doorWindowMeshes.length;
            const reviewRecord=window.GroundReviewModel?.getByIndex(sourceIndex);
            const dx = x2 - x1;
            const dz = z2 - z1;
            const length = Math.hypot(dx, dz);
            const angle = Math.atan2(dz, dx);
            const cx = (x1 + x2) / 2;
            const cz = (z1 + z2) / 2;

            if (type === 'window' || type === 'slidingGlass') {
                const sill = type === 'window' ? 0.45 : 0.05;
                const geo = new THREE.BoxGeometry(length, 1.0, 0.06);
                geo.translate(0, 0.5, 0);
                const glass = new THREE.Mesh(geo, glassMat);
                glass.position.set(cx, sill, cz);
                glass.rotation.y = -angle;
                glass.scale.y = Math.max(0.1, currentWallHeight - sill);
                structureGroup.add(glass);
                doorWindowMeshes.push({ mesh: glass, sill, reviewId:reviewRecord?.id, sourceWidthCm:length*100, sourceIndex });
            } else if (type === 'door') {
                const leafGeo = new THREE.BoxGeometry(length * 0.9, 1.0, 0.04);
                leafGeo.translate(0, 0.5, 0);
                const leaf = new THREE.Mesh(leafGeo, woodDoorMat);
                leaf.position.set(cx, 0, cz);
                leaf.rotation.y = -angle + 0.50;
                leaf.scale.y = currentWallHeight * 0.95;
                structureGroup.add(leaf);
                doorWindowMeshes.push({ mesh: leaf, sill: 0, reviewId:reviewRecord?.id, sourceWidthCm:length*100, sourceIndex });
            }
            const latest=doorWindowMeshes[doorWindowMeshes.length-1];
            if(latest?.sourceIndex===sourceIndex)latest.mesh.userData.reviewOpeningId=reviewRecord?.id;
        }

        function buildAllWallsAndOpenings() {
            // 1. Top-Left Service Courtyard & Upper Washroom Walls
            addWallSegment(-6.50, -8.65, -4.30, -8.65, 0.22);
            addWallSegment(-6.50, -8.65, -6.50, -1.80, 0.22);
            addWallSegment(-4.30, -8.65, -4.30, -6.20, 0.22);
            addWallSegment(-6.50, -7.25, -4.30, -7.25, 0.18);
            addWallSegment(-6.50, -5.65, -4.30, -5.65, 0.18);
            addWallSegment(-6.50, -3.65, -4.75, -3.65, 0.16);

            //Wall between Top-Left Washroom & Reception Lounge (X = -3.90)
            addWallSegment(-3.90, -6.20, -3.90, -2.75, 0.20);
            addWindowOrDoor(-3.90, -2.75, -3.90, -1.95, 'door');

            // 2. Grand Majlis & Reception Top Wall (Z = -6.20, total span from X = -3.90 to +6.25 -> 1010 cm interior)
            addWallSegment(-3.90, -6.20, -3.45, -6.20, 0.22);
            addWindowOrDoor(-3.45, -6.20, -1.45, -6.20, 'slidingGlass'); // 200 cm entrance/patio door
            addWallSegment(-1.45, -6.20, 0.90, -6.20, 0.22);
            addWindowOrDoor(0.90, -6.20, 2.75, -6.20, 'window');
            addWallSegment(2.75, -6.20, 4.10, -6.20, 0.22);
            addWindowOrDoor(4.10, -6.20, 5.45, -6.20, 'window');
            addWallSegment(5.45, -6.20, 6.25, -6.20, 0.22);

            // 3. Grand Majlis Right Outer Wall (X = 6.25, from Z = -6.20 to -1.80)
            addWallSegment(6.25, -6.20, 6.25, -4.40, 0.22);
            addWindowOrDoor(6.25, -4.40, 6.25, -2.65, 'window');
            addWallSegment(6.25, -2.65, 6.25, -1.80, 0.22);

            // 4. Wall between Majlis/Reception & Kitchen/Dining (Z = -1.80)
            // Left section above Kitchen + Reception bottom wall + 200 cm sliding door to Dining + 295 cm wall behind 251 cm sofa
            addWallSegment(-6.50, -1.80, -0.45, -1.80, 0.20);
            addWindowOrDoor(-0.45, -1.80, 1.55, -1.80, 'slidingGlass'); // 200 cm sliding door into Dining Room
            addWallSegment(1.55, -1.80, 6.25, -1.80, 0.22);

            // 5. Middle Section: Kitchen (Left, width 450 cm) & Dining Room (Center, width 452 cm)
            // Left outer wall of Kitchen (X = -6.50, from Z = -1.80 to +1.80)
            addWallSegment(-6.50, -1.80, -6.50, -0.65, 0.22);
            addWindowOrDoor(-6.50, -0.65, -6.50, 0.65, 'window'); // 130 cm window over kitchen sink
            addWallSegment(-6.50, 0.65, -6.50, 1.80, 0.22);

            // Partition Wall between Kitchen and Dining Room (X = -1.80, with decorative niches 45×61 cm)
            addWallSegment(-1.80, -1.80, -1.80, 1.80, 0.22);

            // Right Outer Wall of Dining Room (X = 2.90, from Z = -1.80 to +2.45, with big window)
            addWallSegment(2.90, -1.80, 2.90, -0.95, 0.22);
            addWindowOrDoor(2.90, -0.95, 2.90, 1.15, 'window');
            addWallSegment(2.90, 1.15, 2.90, 2.45, 0.22);

            // 6. Wall between Kitchen/Dining & Bottom Section (Z = 1.80)
            // Kitchen bottom wall with 115 cm door opening
            addWallSegment(-6.50, 1.80, -3.15, 1.80, 0.20);
            addWindowOrDoor(-3.15, 1.80, -2.00, 1.80, 'door'); // 115 cm kitchen door
            addWallSegment(-2.00, 1.80, -0.45, 1.80, 0.20);
            // Dining Room bottom wall: 147 cm left + 200 cm sliding glass door + 151 cm right
            addWindowOrDoor(-0.45, 1.80, 1.55, 1.80, 'slidingGlass');
            addWallSegment(1.55, 1.80, 2.90, 1.80, 0.20);

            // 7. Bottom-Right Family Living Room Outer Walls
            // Top stepped wall (Z = 2.45, from X = 2.90 to 6.25, with 328 cm window)
            addWallSegment(2.90, 2.45, 3.25, 2.45, 0.22);
            addWindowOrDoor(3.25, 2.45, 5.85, 2.45, 'window');
            addWallSegment(5.85, 2.45, 6.25, 2.45, 0.22);

            // Right outer wall of Family Living Room (X = 6.25, from Z = 2.45 to 6.85)
            addWallSegment(6.25, 2.45, 6.25, 6.85, 0.22);

            // Bottom outer wall of entire Villa (Z = 6.85, from X = -6.50 to +6.25)
            addWallSegment(-6.50, 6.85, 1.15, 6.85, 0.24);
            addWindowOrDoor(1.15, 6.85, 4.55, 6.85, 'window'); // Window behind 349 cm sofa
            addWallSegment(4.55, 6.85, 6.25, 6.85, 0.24);

            // 8. Bottom-Left Guest Washbasins (210×150), WC (175×140) & Main Staircase Walls
            addWallSegment(-6.50, 1.80, -6.50, 6.85, 0.22);
            addWallSegment(-1.80, 1.80, -1.80, 3.40, 0.18);
            addWallSegment(-6.50, 3.35, -1.80, 3.35, 0.18);
            addWallSegment(-4.55, 1.80, -4.55, 3.35, 0.16);
            addWindowOrDoor(-5.35, 3.35, -4.65, 3.35, 'door');
        }

