        // ============================================================================
        // 12. FAMILY LIVING ROOM & LOBBY PARTITION / PLANTER (349×92 Sofa, 200×91 Partition)
        // ============================================================================
        function buildFamilyLivingAndLobbyPartition() {
            const sofaFabric = new THREE.MeshStandardMaterial({ color: 0xf3e8d6, roughness: 0.55 });
            const sofaAccent = new THREE.MeshStandardMaterial({ color: 0xc27838, roughness: 0.5 });
            const walnutMat = new THREE.MeshStandardMaterial({ map: createWoodTexture('#6b3e26', '#472818'), roughness: 0.35 });
            const marbleMat = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#fffbeb', '#d6d3d1'), roughness: 0.15 });
            const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });

            // 1. Central Feature TV Partition + Planter Unit (200 cm long × 91 cm total width)
            // Located at X = 0.55, Z = 4.55 (between 206 cm stair passage on left and 207 cm clearance to coffee table on right)
            const partitionGroup = new THREE.Group();

            // Wooden Media & Shelving Wall (48 cm deep × 200 cm long)
            const mediaUnit = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.32, 2.00), walnutMat);
            mediaUnit.position.set(0.68, 0.66, 4.55);
            mediaUnit.castShadow = true;
            partitionGroup.add(mediaUnit);

            // 75" Smart TV mounted facing the Family Living Room (East)
            const tvScreen = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.88, 1.65),
                new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1, metalness: 0.85 })
            );
            tvScreen.position.set(0.94, 0.82, 4.55);
            partitionGroup.add(tvScreen);

            // Attached Indoor Planter Box on the left/top side of the partition (70 × 53 cm)
            const partPlanter = createPlanterBox(0.18, 3.90, 0.53, 0.70, 0.52, 3);
            partitionGroup.add(partPlanter);

            // Two small round tables/poufs at the bottom of the partition (Ø57 cm & Ø36 cm)
            const pTbl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.45, 24), marbleMat);
            pTbl1.position.set(0.45, 0.225, 5.82);
            partitionGroup.add(pTbl1);

            const pTbl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.52, 20), brassMat);
            pTbl2.position.set(0.75, 0.26, 5.65);
            partitionGroup.add(pTbl2);

            furnitureGroup.add(partitionGroup);
            registerInteractiveItem(partitionGroup, 'lobbyTvPartition', 'lobbyPartition');

            // 2. Two Angled Lobby Armchairs (90 × 90 cm) just below the Dining Room's 200 cm door
            const lobbyChairsGroup = new THREE.Group();
            [
                { x: -1.10, z: 2.38, rot: 0.45, tblX: -1.52 },
                { x: 2.05,  z: 2.38, rot: -0.45, tblX: 2.48 }
            ].forEach(lc => {
                const cGrp = new THREE.Group();
                cGrp.position.set(lc.x, 0, lc.z);
                cGrp.rotation.y = lc.rot;

                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.38, 0.88), sofaFabric);
                seat.position.y = 0.19;
                seat.castShadow = true;
                cGrp.add(seat);

                const back = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.46, 0.20), sofaAccent);
                back.position.set(0, 0.55, -0.34);
                back.castShadow = true;
                cGrp.add(back);

                lobbyChairsGroup.add(cGrp);

                const sideTbl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.48, 20), brassMat);
                sideTbl.position.set(lc.tblX, 0.24, lc.z - 0.10);
                lobbyChairsGroup.add(sideTbl);
            });

            furnitureGroup.add(lobbyChairsGroup);
            registerInteractiveItem(lobbyChairsGroup, 'lobbyArmchairs', 'lobbyPartition');

            // 3. Family Living Room Bottom Main Sofa (349 × 92 cm) + Corner Lounge Chair (90 × 98 cm)
            const familyBottomGroup = new THREE.Group();

            const sofa349Base = new THREE.Mesh(new THREE.BoxGeometry(3.49, 0.14, 0.92), walnutMat);
            sofa349Base.position.set(2.85, 0.07, 6.12);
            familyBottomGroup.add(sofa349Base);

            const sofa349Seat = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.30, 0.86), sofaFabric);
            sofa349Seat.position.set(2.85, 0.28, 6.08);
            sofa349Seat.castShadow = true;
            familyBottomGroup.add(sofa349Seat);

            const sofa349Back = new THREE.Mesh(new THREE.BoxGeometry(3.49, 0.48, 0.22), sofaAccent);
            sofa349Back.position.set(2.85, 0.58, 6.47);
            sofa349Back.castShadow = true;
            familyBottomGroup.add(sofa349Back);

            // Bottom-Right Angled Armchair (90 × 98 cm) + Round Table (Ø52 cm)
            const cornerChair = new THREE.Group();
            cornerChair.position.set(5.32, 0, 6.08);
            cornerChair.rotation.y = -0.45;

            const ccSeat = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.38, 0.96), sofaFabric);
            ccSeat.position.y = 0.19;
            ccSeat.castShadow = true;
            cornerChair.add(ccSeat);

            const ccBack = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.48, 0.22), sofaAccent);
            ccBack.position.set(0, 0.56, 0.36);
            cornerChair.add(ccBack);
            familyBottomGroup.add(cornerChair);

            const tbl52 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.48, 20), brassMat);
            tbl52.position.set(4.78, 0.24, 5.55);
            familyBottomGroup.add(tbl52);

            furnitureGroup.add(familyBottomGroup);
            registerInteractiveItem(familyBottomGroup, 'familyBottomSofa', 'familyLiving');

            // 4. Family Living Room Top Sofa (200 × 75 cm) + Center Coffee Table (160 × 70 cm) + Right Wall Unit (252 × 48 cm)
            const familyTopGroup = new THREE.Group();

            // Top Sofa (200 × 75 cm)
            const sofa200Base = new THREE.Mesh(new THREE.BoxGeometry(2.00, 0.14, 0.75), walnutMat);
            sofa200Base.position.set(3.85, 0.07, 3.08);
            familyTopGroup.add(sofa200Base);

            const sofa200Seat = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.28, 0.70), sofaFabric);
            sofa200Seat.position.set(3.85, 0.26, 3.10);
            sofa200Seat.castShadow = true;
            familyTopGroup.add(sofa200Seat);

            const sofa200Back = new THREE.Mesh(new THREE.BoxGeometry(2.00, 0.45, 0.18), sofaAccent);
            sofa200Back.position.set(3.85, 0.54, 2.80);
            sofa200Back.castShadow = true;
            familyTopGroup.add(sofa200Back);

            // Round Side Table (Ø60 cm) beside top sofa
            const tbl60 = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.48, 24), marbleMat);
            tbl60.position.set(2.55, 0.24, 3.25);
            familyTopGroup.add(tbl60);

            // Center Coffee Table (160 × 70 cm)
            const coffee160Top = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.05, 0.70), marbleMat);
            coffee160Top.position.set(3.55, 0.42, 4.65);
            coffee160Top.castShadow = true;
            familyTopGroup.add(coffee160Top);

            const coffee160Base = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.38, 0.50), walnutMat);
            coffee160Base.position.set(3.55, 0.19, 4.65);
            familyTopGroup.add(coffee160Base);

            // Right Wall Console / Shelving Unit (252 × 48 cm)
            const rightConsole = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.85, 2.52), walnutMat);
            rightConsole.position.set(5.88, 0.425, 4.55);
            rightConsole.castShadow = true;
            familyTopGroup.add(rightConsole);

            furnitureGroup.add(familyTopGroup);
            registerInteractiveItem(familyTopGroup, 'familyTopSofaAndTable', 'familyLiving');
        }

