/**
 * Villa Hassan | Walls, window openings and doors
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        function addWallSegment(x1, z1, x2, z2, thickness = 0.20, isPartition = false) {
            const dx = x2 - x1;
            const dz = z2 - z1;
            const length = Math.hypot(dx, dz);
            if (length < 0.02) return;
            const angle = Math.atan2(dz, dx);
            const cx = (x1 + x2) / 2;
            const cz = (z1 + z2) / 2;

            // Unit height geometry (1.0m) scaled dynamically by currentWallHeight
            const geo = new THREE.BoxGeometry(length, 1.0, thickness);
            geo.translate(0, 0.5, 0);
            const mesh = new THREE.Mesh(geo, wallMat);
            mesh.position.set(cx, 0, cz);
            mesh.rotation.y = -angle;
            mesh.scale.y = currentWallHeight;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            structureGroup.add(mesh);

            // Top architectural section cap
            const capGeo = new THREE.BoxGeometry(length + 0.01, 0.03, thickness + 0.01);
            const capMesh = new THREE.Mesh(capGeo, wallCapMat);
            capMesh.position.set(cx, currentWallHeight + 0.015, cz);
            capMesh.rotation.y = -angle;
            structureGroup.add(capMesh);

            wallMeshes.push({ body: mesh, cap: capMesh, isPartition });
        }

        function addWindowOrDoor(x1, z1, x2, z2, type = 'window') {
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
                doorWindowMeshes.push({ mesh: glass, sill });
            } else if (type === 'door') {
                const frameGeo = new THREE.BoxGeometry(length, 0.08, 0.05);
                const panel = new THREE.Mesh(frameGeo, woodDoorMat);
                panel.position.set(cx, 0.04, cz);
                panel.rotation.y = -angle + 0.45; // Slightly ajar 3D door leaf
                const leafGeo = new THREE.BoxGeometry(length * 0.9, 1.0, 0.04);
                leafGeo.translate(0, 0.5, 0);
                const leaf = new THREE.Mesh(leafGeo, woodDoorMat);
                leaf.position.set(cx, 0, cz);
                leaf.rotation.y = -angle + 0.55;
                leaf.scale.y = currentWallHeight * 0.95;
                structureGroup.add(leaf);
                doorWindowMeshes.push({ mesh: leaf, sill: 0 });
            }
        }

        // Hinged leaves use a local pivot at the jamb. Unit-height groups track the wall-height control.
        function addHingedBedroomDoor(zone, x, z, width, angle) {
            const hinge = new THREE.Group();
            hinge.name = `Door_${zone}`;
            hinge.position.set(x, 0, z);
            hinge.rotation.y = angle;
            const material = new THREE.MeshStandardMaterial({ color: 0x805c3e, roughness: 0.65 });
            const leaf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.05, 0.94, 0.045), material);
            leaf.position.set(width / 2, 0.47, 0);
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025 / 1.35, 0.07),
                new THREE.MeshStandardMaterial({ color: 0xb38d4c, roughness: 0.3, metalness: 0.7 }));
            handle.position.set(width - 0.14, 0.75 / 1.35, -0.04);
            hinge.add(leaf, handle);
            hinge.scale.y = currentWallHeight;
            hinge.traverse(child => {
                if (child.isMesh) { child.userData.zone = zone; interactiveObjects.push(child); }
            });
            structureGroup.add(hinge);
            doorWindowMeshes.push({ mesh: hinge, sill: 0 });
        }
