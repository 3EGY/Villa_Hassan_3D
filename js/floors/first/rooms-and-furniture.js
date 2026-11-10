/**
 * Villa Hassan | Individual rooms, furniture and landscaping
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */




        // ============================================================================
        // 8. MASTER BEDROOM SUITE & UPPER CURVED LOUNGE (Furniture dimensions from reference)
        // ============================================================================
        function buildSecondaryBedrooms() {
            const wood = new THREE.MeshStandardMaterial({ color: 0x805c3e, roughness: 0.65 });
            const linen = new THREE.MeshStandardMaterial({ color: 0xe9e1d5, roughness: 0.9 });
            const blue = new THREE.MeshStandardMaterial({ color: 0x547f8e, roughness: 0.85 });
            const screen = new THREE.MeshStandardMaterial({ color: 0x101c29, emissive: 0x193e51, emissiveIntensity: 0.22, roughness: 0.25 });
            function box(group, w, h, d, x, y, z, material) {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
                mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
                group.add(mesh);
            }
            function bed(zone, x, z, angle) {
                const group = new THREE.Group(); group.name = `Bed_${zone}`;
                box(group, 2.06, 0.30, 1.72, 0, 0.18, 0, wood);
                box(group, 1.98, 0.20, 1.65, 0, 0.43, 0, linen);
                box(group, 1.42, 0.06, 1.66, 0.22, 0.56, 0, blue);
                box(group, 0.10, 1.15, 1.80, -1.02, 0.60, 0, wood);
                for (const side of [-0.42, 0.42]) box(group, 0.38, 0.14, 0.66, -0.69, 0.60, side, linen);
                group.position.set(x, 0, z); group.rotation.y = angle;
                furnitureGroup.add(group); registerInteractiveItem(group, `${zone}Bed`, zone);
            }
            function television(zone, x, z, angle) {
                const group = new THREE.Group(); group.name = `TV_${zone}`;
                box(group, 1.38, 0.84, 0.055, 0, 1.02, 0, screen);
                box(group, 1.46, 0.035, 0.12, 0, 0.56, 0, wood);
                group.position.set(x, 0, z); group.rotation.y = angle;
                furnitureGroup.add(group); registerInteractiveItem(group, `${zone}TV`, zone);
            }
            bed('leftBedroom', -4.45, -0.30, -Math.PI / 2);
            television('leftBedroom', -4.45, 1.11, 0);
            bed('rightBedroom', 4.44, 5.35, 0);
            television('rightBedroom', 7.09, 5.35, Math.PI / 2);
        }

        function buildMasterBedroomSuite() {
            const fabricCream = new THREE.MeshStandardMaterial({ color: 0xf5ebe0, roughness: 0.65 });
            const fabricAccent = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 });
            const walnutMat = new THREE.MeshStandardMaterial({ map: createWoodTexture('#6e4221', '#4a2b13'), roughness: 0.4 });
            const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.8 });
            const marbleTopMat = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#ffffff', '#cbd5e1'), roughness: 0.15 });

            // 1. Master Bed (200 × 200 cm) against left wall X = -1.45, centered at Z = -3.60
            const bedGroup = new THREE.Group();
            bedGroup.position.set(-0.45, 0, -3.60);

            // Wooden Bed Frame (200 × 200 cm)
            const frame = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.28, 2.06), walnutMat);
            frame.position.y = 0.14;
            frame.castShadow = true;
            bedGroup.add(frame);

            // Mattress (190 × 194 cm)
            const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.26, 1.94), fabricCream);
            mattress.position.set(0.03, 0.38, 0);
            mattress.castShadow = true;
            bedGroup.add(mattress);

            // Duvet / Folded Blanket
            const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.28, 1.98), fabricAccent);
            duvet.position.set(0.32, 0.39, 0);
            duvet.castShadow = true;
            bedGroup.add(duvet);

            // Upholstered Tufted Headboard against left wall
            const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.18, 2.10), walnutMat);
            headboard.position.set(-0.95, 0.59, 0);
            headboard.castShadow = true;
            bedGroup.add(headboard);

            // 4 Plush Pillows
            [-0.48, 0.48].forEach(zOff => {
                const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.72), fabricCream);
                p1.position.set(-0.68, 0.56, zOff);
                p1.rotation.z = -0.18;
                bedGroup.add(p1);

                const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.55), fabricAccent);
                p2.position.set(-0.46, 0.55, zOff);
                p2.rotation.z = -0.12;
                bedGroup.add(p2);
            });

            // 2. Two Nightstands (62 × 46 cm) above and below the bed
            [-4.96, -2.24].forEach(zPos => {
                const ns = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.62), walnutMat);
                ns.position.set(-0.77, 0.26, zPos + 3.60);
                ns.castShadow = true;
                bedGroup.add(ns);

                const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.18, 16), brassMat);
                lampBase.position.set(-0.77, 0.61, zPos + 3.60);
                bedGroup.add(lampBase);

                const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.20, 16), fabricCream);
                lampShade.position.set(-0.77, 0.78, zPos + 3.60);
                bedGroup.add(lampShade);
            });

            furnitureGroup.add(bedGroup);
            registerInteractiveItem(bedGroup, 'masterBed', 'masterBedroom');
            createWarmLEDStrip(0.06, 0.04, 2.05, -1.36, 1.15, -3.60, 'masterBedroom');

            // 3. Bed-Foot Chaise / Ottoman Bench Unit (75 × 200 cm) right in front of the bed
            const chaiseGroup = new THREE.Group();
            const chaiseBase = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 2.00), walnutMat);
            chaiseBase.position.set(0.93, 0.21, -3.60);
            chaiseBase.castShadow = true;
            chaiseGroup.add(chaiseBase);

            const chaiseCushion = new THREE.Mesh(new THREE.BoxGeometry(0.69, 0.12, 1.92), fabricCream);
            chaiseCushion.position.set(0.93, 0.46, -3.60);
            chaiseCushion.castShadow = true;
            chaiseGroup.add(chaiseCushion);

            // Low divider backrest between bed and chaise
            const chaiseBack = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.78, 2.00), walnutMat);
            chaiseBack.position.set(0.58, 0.39, -3.60);
            chaiseGroup.add(chaiseBack);
            furnitureGroup.add(chaiseGroup);
            registerInteractiveItem(chaiseGroup, 'bedFootChaise', 'masterBedroom');

            // 4. Upper Recessed Curved Bay Window Sofa (362 × 91 cm, 5 curved segments)
            const bayCenter = { x: 2.05, z: -2.95 };
            const bayRadius = 3.05;
            const baySofaGroup = new THREE.Group();
            const segCount = 5;
            const startAng = -Math.PI * 0.68;
            const endAng = -Math.PI * 0.32;
            const stepAng = (endAng - startAng) / segCount;

            for (let i = 0; i < segCount; i++) {
                const aMid = startAng + (i + 0.5) * stepAng;
                const sx = bayCenter.x + Math.cos(aMid) * bayRadius;
                const sz = bayCenter.z + Math.sin(aMid) * bayRadius;

                const segGroup = new THREE.Group();
                segGroup.position.set(sx, 0, sz);
                segGroup.rotation.y = -aMid - Math.PI / 2;

                // Seat Cushion (72 × 91 cm)
                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.91), fabricCream);
                seat.position.y = 0.21;
                seat.castShadow = true;
                segGroup.add(seat);

                // Curved Backrest along the top window
                const back = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.45, 0.22), fabricAccent);
                back.position.set(0, 0.62, -0.34);
                back.castShadow = true;
                segGroup.add(back);

                // Throw pillow
                const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.12), fabricCream);
                pillow.position.set(0, 0.54, -0.18);
                pillow.rotation.x = 0.2;
                segGroup.add(pillow);

                baySofaGroup.add(segGroup);
            }

            // Round Side Tables flanking the upper curved sofa (Ø65 cm and Ø44 cm)
            const sideTables = [
                { r: 0.325, x: -0.05, z: -5.65, h: 0.48 },
                { r: 0.22,  x: 0.35,  z: -5.25, h: 0.42 },
                { r: 0.325, x: 4.15,  z: -5.65, h: 0.48 },
                { r: 0.22,  x: 3.75,  z: -5.25, h: 0.42 }
            ];
            sideTables.forEach(st => {
                const tblTop = new THREE.Mesh(new THREE.CylinderGeometry(st.r, st.r, 0.04, 24), marbleTopMat);
                tblTop.position.set(st.x, st.h, st.z);
                tblTop.castShadow = true;
                baySofaGroup.add(tblTop);

                const tblBase = new THREE.Mesh(new THREE.CylinderGeometry(st.r * 0.45, st.r * 0.65, st.h - 0.02, 16), brassMat);
                tblBase.position.set(st.x, (st.h - 0.02) / 2, st.z);
                baySofaGroup.add(tblBase);
            });
            furnitureGroup.add(baySofaGroup);
            registerInteractiveItem(baySofaGroup, 'upperCurvedSofa', 'masterBedroom');

            // 5. Bottom-Right Vanity Desk (123 × 50 cm along the 240 cm wall) & Circular Pouf Chair
            const vanityGroup = new THREE.Group();
            const vanityDesk = new THREE.Mesh(new THREE.BoxGeometry(2.40, 0.76, 0.50), walnutMat);
            vanityDesk.position.set(4.30, 0.38, -2.06);
            vanityDesk.castShadow = true;
            vanityGroup.add(vanityDesk);

            const chairSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.45, 24), fabricAccent);
            chairSeat.position.set(4.15, 0.225, -2.62);
            chairSeat.castShadow = true;
            vanityGroup.add(chairSeat);

            const chairBack = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.06, 12, 24, Math.PI), walnutMat);
            chairBack.rotation.x = Math.PI / 2;
            chairBack.rotation.z = Math.PI;
            chairBack.position.set(4.15, 0.58, -2.62);
            vanityGroup.add(chairBack);
            furnitureGroup.add(vanityGroup);
            registerInteractiveItem(vanityGroup, 'bedroomVanity', 'masterBedroom');
        }

        // ============================================================================
        // 9. WALK-IN DRESSING ROOM (260 × 370 cm, 65 cm Wardrobes, 130 cm Corridor)
        // ============================================================================
        function buildDressingRoom() {
            const closetWood = new THREE.MeshStandardMaterial({ map: createWoodTexture('#5c3a21', '#3d2514'), roughness: 0.35 });
            const closetGroup = new THREE.Group();

            // Left Wardrobe (65 cm deep × 256 cm long)
            const leftWardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 2.56), closetWood);
            leftWardrobe.position.set(-3.76, 0.625, -4.40);
            leftWardrobe.castShadow = true;
            closetGroup.add(leftWardrobe);

            // Top Wardrobe (260 cm wide × 65 cm deep)
            const topWardrobe = new THREE.Mesh(new THREE.BoxGeometry(2.60, 1.25, 0.65), closetWood);
            topWardrobe.position.set(-2.77, 0.625, -5.76);
            topWardrobe.castShadow = true;
            closetGroup.add(topWardrobe);

            // Right Wardrobe (65 cm deep × 370 cm long)
            const rightWardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 3.70), closetWood);
            rightWardrobe.position.set(-1.80, 0.625, -4.20);
            rightWardrobe.castShadow = true;
            closetGroup.add(rightWardrobe);

            furnitureGroup.add(closetGroup);
            registerInteractiveItem(closetGroup, 'wardrobeCloset', 'dressing');

            // Warm LED Closet Strips
            createWarmLEDStrip(0.04, 0.04, 2.50, -3.42, 1.22, -4.40, 'dressing');
            createWarmLEDStrip(0.04, 0.04, 3.60, -2.14, 1.22, -4.20, 'dressing');
        }

        // ============================================================================
        // 10. MASTER BATHROOM & TOP-LEFT PLANTED COURTYARD
        // ============================================================================
        function buildMasterBathroomAndCourtyard() {
            const ceramicWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.05 });
            const vanityStone = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#f8fafc', '#94a3b8'), roughness: 0.2 });
            const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.9 });

            // 1. Oval Freestanding Bathtub (180 × 81 cm) at bottom-left corner
            const tubGroup = new THREE.Group();
            tubGroup.position.set(-6.24, 0, -2.65);

            const tubOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.36, 0.58, 32), ceramicWhite);
            tubOuter.scale.set(1.0, 1.0, 2.20); // 80 cm wide × 176 cm long
            tubOuter.position.y = 0.29;
            tubOuter.castShadow = true;
            tubGroup.add(tubOuter);

            const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, roughness: 0.05 });
            const tubWater = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 32), waterMat);
            tubWater.scale.set(1.0, 1.0, 2.0);
            tubWater.position.y = 0.52;
            tubGroup.add(tubWater);
            furnitureGroup.add(tubGroup);
            registerInteractiveItem(tubGroup, 'masterBathtub', 'bathroom');

            // 2. Indoor Bathroom Planter Bed beside Bathtub (169 × 40 cm)
            const bathPlanterGroup = createPlanterBox(-4.95, -1.95, 1.69, 0.40, 0.38, 5);
            registerInteractiveItem(bathPlanterGroup, 'bathroomPlanter', 'bathroom');

            // 3. Vanity Counter along left wall (177 × 50 cm) + Washbasin
            const bathVanityGroup = new THREE.Group();
            const vanityCounter = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.78, 1.77), vanityStone);
            vanityCounter.position.set(-6.38, 0.39, -4.45);
            vanityCounter.castShadow = true;
            bathVanityGroup.add(vanityCounter);

            const sinkBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.16, 0.14, 24), ceramicWhite);
            sinkBowl.position.set(-6.38, 0.85, -4.45);
            bathVanityGroup.add(sinkBowl);
            createWarmLEDStrip(0.05, 0.04, 1.70, -6.12, 0.76, -4.45, 'bathroom');

            // 4. Walk-in Glass Shower Enclosure (168 × 114 cm) at top-right of bathroom
            const showerGlass1 = new THREE.Mesh(new THREE.BoxGeometry(0.40, 1.35, 0.03), glassMat);
            showerGlass1.position.set(-4.72, 0.675, -4.42);
            bathVanityGroup.add(showerGlass1);

            const showerGlass2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.35, 1.68), glassMat);
            showerGlass2.position.set(-4.92, 0.675, -5.26);
            bathVanityGroup.add(showerGlass2);

            const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16), chromeMat);
            showerHead.position.set(-4.72, 1.30, -5.45);
            bathVanityGroup.add(showerHead);
            furnitureGroup.add(bathVanityGroup);
            registerInteractiveItem(bathVanityGroup, 'bathroomVanity', 'bathroom');

            // 5. Top-Left Courtyard Garden Planter (73 × 75 cm with 59/56/80 cm stone paths)
            const courtyardGroup = createPlanterBox(-5.68, -7.45, 0.75, 1.40, 0.42, 6);
            registerInteractiveItem(courtyardGroup, 'courtyardGarden', 'courtyard');
        }

        // ============================================================================
        // 11. RIGHT OUTDOOR TERRACE & LANDSCAPED GARDEN (90×260 cm beds, Ø70 table)
        // ============================================================================
        function buildRightOutdoorTerrace() {
            const teakWood = new THREE.MeshStandardMaterial({ map: createWoodTexture('#8a5229', '#61381b'), roughness: 0.5 });
            const cushionOutdoor = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });

            const terraceLoungeGroup = new THREE.Group();
            // 1. Upper Terrace Round Coffee Table (Ø70 cm) at (7.10, -7.05)
            const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 24), teakWood);
            tableTop.position.set(7.10, 0.46, -7.05);
            tableTop.castShadow = true;
            terraceLoungeGroup.add(tableTop);

            const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.44, 16), teakWood);
            tableLeg.position.set(7.10, 0.22, -7.05);
            terraceLoungeGroup.add(tableLeg);

            // Two angled outdoor lounge armchairs flanking the Ø70 cm table
            [
                { x: 6.45, z: -7.45, rot: -0.55 },
                { x: 7.75, z: -7.45, rot: 0.55 }
            ].forEach(ch => {
                const chairGrp = new THREE.Group();
                chairGrp.position.set(ch.x, 0, ch.z);
                chairGrp.rotation.y = ch.rot;

                const base = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.32, 0.78), teakWood);
                base.position.y = 0.16;
                base.castShadow = true;
                chairGrp.add(base);

                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 0.70), cushionOutdoor);
                seat.position.y = 0.36;
                chairGrp.add(seat);

                const back = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.42, 0.14), cushionOutdoor);
                back.position.set(0, 0.56, -0.28);
                back.rotation.x = -0.2;
                chairGrp.add(back);

                terraceLoungeGroup.add(chairGrp);
            });
            furnitureGroup.add(terraceLoungeGroup);
            registerInteractiveItem(terraceLoungeGroup, 'terraceLounge', 'terraceLounge');

            // 2. Perimeter Planter Strips (45 cm wide) along Upper Terrace
            createPlanterBox(7.10, -8.22, 2.85, 0.45, 0.40, 8);
            createPlanterBox(5.82, -7.15, 0.45, 1.85, 0.40, 5);

            // 3. Lower Terrace Twin Central Planters (90 × 260 cm total, 105 cm walkways left & right)
            const gardenBedsGroup = new THREE.Group();
            const bed1 = createPlanterBox(7.10, -4.35, 0.90, 1.25, 0.44, 6);
            const bed2 = createPlanterBox(7.10, -2.95, 0.90, 1.25, 0.44, 6);
            gardenBedsGroup.add(bed1, bed2);
            plantsGroup.add(gardenBedsGroup);
            registerInteractiveItem(gardenBedsGroup, 'terraceGardenBeds', 'terrace');

            // Bottom border planter strip (65 cm margin)
            createPlanterBox(7.10, -2.02, 2.85, 0.38, 0.36, 7);
        }

        // ============================================================================
        // 12. CENTRAL FAMILY LIVING ROOM (448 cm Curved Sofa, 150×75 Oval Table, Armchairs)
        // ============================================================================
        function buildCentralLivingRoom() {
            const sofaVelvet = new THREE.MeshStandardMaterial({ color: 0xf3e8d6, roughness: 0.55 });
            const sofaBackMat = new THREE.MeshStandardMaterial({ color: 0xc27838, roughness: 0.5 });
            const walnutBase = new THREE.MeshStandardMaterial({ map: createWoodTexture('#6b3e26', '#472818'), roughness: 0.35 });
            const marbleTableMat = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#fffbeb', '#d6d3d1'), roughness: 0.15 });

            // 1. Main 6-Segment Curved Sectional Sofa (Arc length 448 cm, depth 96 cm)
            // Arc center at (0.95, 0.45), radius 1.92m
            const arcCenter = { x: 0.95, z: 0.45 };
            const radius = 1.92;
            const segments = 6;
            const startAngle = Math.PI * 0.68; // Bottom-left
            const endAngle = Math.PI * 1.46;   // Top-center near bedroom sliding door
            const dAngle = (endAngle - startAngle) / segments;

            const livingSofaGroup = new THREE.Group();

            for (let i = 0; i < segments; i++) {
                const theta = startAngle + (i + 0.5) * dAngle;
                const sx = arcCenter.x + Math.cos(theta) * radius;
                const sz = arcCenter.z + Math.sin(theta) * radius;

                const unit = new THREE.Group();
                unit.position.set(sx, 0, sz);
                // Face inward toward the oval coffee table
                unit.rotation.y = -theta - Math.PI / 2;

                // Wooden plinth base
                const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.12, 0.94), walnutBase);
                plinth.position.y = 0.06;
                unit.add(plinth);

                // Plush Seat Cushion (95-97 cm arc width × 96 cm depth)
                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.32, 0.96), sofaVelvet);
                seat.position.y = 0.26;
                seat.castShadow = true;
                seat.receiveShadow = true;
                unit.add(seat);

                // Outer Curved Backrest
                const back = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.48, 0.22), sofaBackMat);
                back.position.set(0, 0.58, -0.37);
                back.castShadow = true;
                unit.add(back);

                // Throw Cushion
                const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.14), i % 2 === 0 ? sofaBackMat : sofaVelvet);
                cushion.position.set(0, 0.50, -0.18);
                cushion.rotation.x = 0.22;
                unit.add(cushion);

                livingSofaGroup.add(unit);
            }
            furnitureGroup.add(livingSofaGroup);
            registerInteractiveItem(livingSofaGroup, 'livingCurvedSofa', 'livingRoom');

            // 2. Central Oval Coffee Table (150 × 75 cm) angled along the sofa curve
            const coffeeGroup = new THREE.Group();
            coffeeGroup.position.set(0.75, 0, 0.52);
            coffeeGroup.rotation.y = Math.PI * 0.23;

            const ovalTop = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.375, 0.05, 32), marbleTableMat);
            ovalTop.scale.set(2.0, 1.0, 1.0); // 150 cm × 75 cm
            ovalTop.position.y = 0.42;
            ovalTop.castShadow = true;
            coffeeGroup.add(ovalTop);

            const ovalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.30, 0.39, 24), walnutBase);
            ovalBase.scale.set(1.6, 1.0, 0.8);
            ovalBase.position.y = 0.20;
            coffeeGroup.add(ovalBase);
            furnitureGroup.add(coffeeGroup);
            registerInteractiveItem(coffeeGroup, 'ovalCoffeeTable', 'livingRoom');

            // 3. Two Barrel Armchairs (90 × 91 cm) on the right side + Ø50 cm round side table
            const armchairsGroup = new THREE.Group();
            const chairsData = [
                { x: 2.02, z: -0.18, rot: -Math.PI * 0.72 },
                { x: 2.05, z: 1.28,  rot: -Math.PI * 1.22 }
            ];
            chairsData.forEach(cd => {
                const cGrp = new THREE.Group();
                cGrp.position.set(cd.x, 0, cd.z);
                cGrp.rotation.y = cd.rot;

                const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.42, 0.40, 24), sofaVelvet);
                seat.position.y = 0.20;
                seat.castShadow = true;
                cGrp.add(seat);

                const backArc = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.11, 16, 24, Math.PI * 1.15), sofaBackMat);
                backArc.rotation.x = Math.PI / 2;
                backArc.rotation.z = -0.22;
                backArc.position.y = 0.52;
                backArc.castShadow = true;
                cGrp.add(backArc);

                armchairsGroup.add(cGrp);
            });

            // Round Side Table (Ø50 cm) between the two armchairs
            const sideTbl = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.48, 24), walnutBase);
            sideTbl.position.set(2.35, 0.24, 0.56);
            sideTbl.castShadow = true;
            armchairsGroup.add(sideTbl);

            const sideTblTop = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 24), marbleTableMat);
            sideTblTop.position.set(2.35, 0.49, 0.56);
            armchairsGroup.add(sideTblTop);

            furnitureGroup.add(armchairsGroup);
            registerInteractiveItem(armchairsGroup, 'livingArmchairs', 'livingRoom');
        }

        // ============================================================================
        // 13. STAIR LOBBY & CENTRAL CIRCULAR PLANTER (Ø160 cm)
        // ============================================================================
        function buildStairLobbyAndCircularPlanter() {
            const stoneRimMat = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.4 });
            const soilMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 });
            const poufMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
            const cabinetMat = new THREE.MeshStandardMaterial({ map: createWoodTexture('#6e4221', '#4a2b13'), roughness: 0.4 });

            // 1. Central Circular Planter (Diameter 160 cm -> Radius 0.80 m) at (0.59, 4.60)
            // Clearances: 119 cm top, 129 cm left, 159 cm right, 130 cm bottom
            const planterGroup = new THREE.Group();
            planterGroup.position.set(0.59, 0, 4.60);

            const outerCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.80, 0.80, 0.46, 36), stoneRimMat);
            outerCyl.position.y = 0.23;
            outerCyl.castShadow = true;
            outerCyl.receiveShadow = true;
            planterGroup.add(outerCyl);

            const soilDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.48, 32), soilMat);
            soilDisk.position.y = 0.23;
            planterGroup.add(soilDisk);

            // Warm LED under-glow ring around the Ø160 cm planter
            const glowRingMat = new THREE.MeshStandardMaterial({
                color: 0xffedd5,
                emissive: 0xf59e0b,
                emissiveIntensity: 1.1
            });
            glowRingMat.userData.zone = 'lobbyPlanter';
            emissiveMaterials.push(glowRingMat);
            const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.81, 0.025, 12, 36), glowRingMat);
            glowRing.rotation.x = Math.PI / 2;
            glowRing.position.y = 0.04;
            planterGroup.add(glowRing);

            // Lush Indoor Tropical Shrubs & Feature Olive/Ficus Tree inside Ø160 cm planter
            createTropicalPlantCluster(planterGroup, 0, 0.46, 0, 1.45, true);
            createTropicalPlantCluster(planterGroup, -0.35, 0.46, 0.25, 0.9);
            createTropicalPlantCluster(planterGroup, 0.38, 0.46, -0.22, 0.85);
            createTropicalPlantCluster(planterGroup, 0.15, 0.46, 0.42, 0.75);
            createTropicalPlantCluster(planterGroup, -0.28, 0.46, -0.35, 0.8);

            plantsGroup.add(planterGroup);
            registerInteractiveItem(planterGroup, 'centralCircularPlanter', 'lobbyPlanter');

            // 2. Two Round Pouf Ottomans (Ø50 cm) in the 153 cm right niche + Wall Cabinet (197 × 63 cm)
            const lobbySideGroup = new THREE.Group();
            [3.75, 4.38].forEach(zPos => {
                const pouf = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.42, 24), poufMat);
                pouf.position.set(2.75, 0.21, zPos);
                pouf.castShadow = true;
                lobbySideGroup.add(pouf);
            });

            const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.63, 0.88, 1.97), cabinetMat);
            cabinet.position.set(2.90, 0.44, 5.78);
            cabinet.castShadow = true;
            lobbySideGroup.add(cabinet);

            furnitureGroup.add(lobbySideGroup);
            registerInteractiveItem(lobbySideGroup, 'lobbyPoufs', 'lobbyPlanter');
        }

        // ============================================================================
        // 14. MAIN STAIRCASE, WASHBASIN ALCOVE (210×160) & POWDER ROOM (100×160)
        // ============================================================================
        function buildMainStaircaseAndPowderRoom() {
            const stepMarble = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#f8fafc', '#cbd5e1'), roughness: 0.25 });
            const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });

            const stairsMasterGroup = new THREE.Group();
            const washbasinsGroup = new THREE.Group();
            const guestBathroomGroup = new THREE.Group();

            // 1. Washbasin Alcove (210 × 160 cm): Vanity + Basin (45 cm) + Indoor Planter
            const counter = new THREE.Mesh(new THREE.BoxGeometry(2.10, 0.78, 0.45), stepMarble);
            counter.position.set(-3.20, 0.39, 2.58);
            counter.castShadow = true;
            washbasinsGroup.add(counter);

            const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.14, 24), ceramicMat);
            basin.position.set(-3.75, 0.85, 2.58);
            washbasinsGroup.add(basin);

            // Small greenery planter inside the washbasin counter
            const washPlanter = createPlanterBox(-2.55, 2.58, 0.65, 0.38, 0.80, 2);
            washbasinsGroup.add(washPlanter);

            // 2. Powder Room (100 × 160 cm): WC + Wall-hung Sink
            const wcBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.54), ceramicMat);
            wcBase.position.set(-5.55, 0.21, 2.52);
            guestBathroomGroup.add(wcBase);

            const smallSink = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.15, 20), ceramicMat);
            smallSink.position.set(-6.18, 0.82, 1.85);
            guestBathroomGroup.add(smallSink);

            // 3. Main 3-Flight U-Shaped Staircase (Bottom-Left)
            const stairGroup = new THREE.Group();
            // Upper flight (10 treads along Z = 3.0 to 4.3)
            for (let i = 0; i < 10; i++) {
                const tread = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 1.25), stepMarble);
                tread.position.set(-2.15 - i * 0.32, 0.08 + i * 0.12, 3.55);
                tread.castShadow = true;
                tread.receiveShadow = true;
                stairGroup.add(tread);
            }
            // Quarter Landing
            const landing = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.16, 3.80), stepMarble);
            landing.position.set(-5.75, 1.28, 4.85);
            landing.castShadow = true;
            stairGroup.add(landing);

            // Lower flight (10 treads rising from landing)
            for (let i = 0; i < 10; i++) {
                const tread = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 1.25), stepMarble);
                tread.position.set(-5.05 + i * 0.32, 1.38 + i * 0.12, 6.10);
                tread.castShadow = true;
                stairGroup.add(tread);
            }

            // Glass Balustrade around central stair well
            const balustrade = new THREE.Mesh(new THREE.BoxGeometry(3.20, 0.85, 0.04), glassMat);
            balustrade.position.set(-3.60, 1.15, 4.22);
            stairGroup.add(balustrade);

            stairsMasterGroup.add(stairGroup);
            structureGroup.add(stairsMasterGroup);
            registerInteractiveItem(stairsMasterGroup, 'mainStaircase', 'stairs');
            furnitureGroup.add(washbasinsGroup, guestBathroomGroup);
            registerInteractiveItem(washbasinsGroup, 'guestWashbasins', 'washbasins');
            registerInteractiveItem(guestBathroomGroup, 'guestBathroomFixtures', 'guestBathroom');
        }

        // Helper to build rectangular planter boxes with lush 3D greenery
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
                const px = (w > d) ? ((i / Math.max(1, numPlants - 1)) - 0.5) * (w * 0.72) : (Math.random() - 0.5) * (w * 0.45);
                const pz = (d >= w) ? ((i / Math.max(1, numPlants - 1)) - 0.5) * (d * 0.72) : (Math.random() - 0.5) * (d * 0.45);
                createTropicalPlantCluster(boxGroup, px, h, pz, 0.65 + Math.random() * 0.35);
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
