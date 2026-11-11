        // ============================================================================
        // 8. GRAND MAJLIS (1010 cm) & RECEPTION LOUNGE (590×190 L-Sofa, 180×90 Tables, 231 Arc)
        // ============================================================================
        function buildGrandMajlisAndReception() {
            const velvetCream = new THREE.MeshStandardMaterial({ color: 0xf5ebe0, roughness: 0.55 });
            const velvetGold = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.50 });
            const walnutMat = new THREE.MeshStandardMaterial({ map: createWoodTexture('#6b3e26', '#472818'), roughness: 0.35 });
            const marbleTopMat = new THREE.MeshStandardMaterial({ map: createMarbleTexture('#fffbeb', '#d6d3d1'), roughness: 0.15 });
            const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });

            // 1. Grand L-Shaped Continuous Majlis Sofa (590 cm top run × 190 cm right turn, 95 cm depth, 30 cm wall clearance)
            const lSofaGroup = new THREE.Group();

            // Top horizontal run (5.90m long × 0.95m deep) from X = -0.55 to +5.35, centered at Z = -5.42
            const topBase = new THREE.Mesh(new THREE.BoxGeometry(5.90, 0.14, 0.95), walnutMat);
            topBase.position.set(2.40, 0.07, -5.42);
            lSofaGroup.add(topBase);

            const topSeat = new THREE.Mesh(new THREE.BoxGeometry(5.86, 0.30, 0.90), velvetCream);
            topSeat.position.set(2.40, 0.28, -5.40);
            topSeat.castShadow = true;
            topSeat.receiveShadow = true;
            lSofaGroup.add(topSeat);

            const topBack = new THREE.Mesh(new THREE.BoxGeometry(5.90, 0.48, 0.22), velvetGold);
            topBack.position.set(2.40, 0.58, -5.78);
            topBack.castShadow = true;
            lSofaGroup.add(topBack);

            // Right vertical turn of L-Sofa (190 cm total -> 0.95m extension below corner)
            const rightBase = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 1.05), walnutMat);
            rightBase.position.set(4.88, 0.07, -4.42);
            lSofaGroup.add(rightBase);

            const rightSeat = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.30, 1.02), velvetCream);
            rightSeat.position.set(4.86, 0.28, -4.42);
            rightSeat.castShadow = true;
            lSofaGroup.add(rightSeat);

            const rightBack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 1.95), velvetGold);
            rightBack.position.set(5.24, 0.58, -4.90);
            rightBack.castShadow = true;
            lSofaGroup.add(rightBack);

            // Decorative throw cushions along the 590 cm sofa
            for (let i = 0; i < 7; i++) {
                const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.14), i % 2 === 0 ? velvetGold : velvetCream);
                pillow.position.set(-0.15 + i * 0.80, 0.52, -5.56);
                pillow.rotation.x = 0.20;
                lSofaGroup.add(pillow);
            }

            // Corner round tables flanking the L-Sofa (Left: Ø58 & Ø39 cm, Right: Ø75 & Ø39 cm)
            [
                { r: 0.29, x: -0.95, z: -5.55, h: 0.50 },
                { r: 0.20, x: -0.75, z: -5.15, h: 0.44 },
                { r: 0.375, x: 5.72, z: -5.55, h: 0.50 },
                { r: 0.20, x: 5.55, z: -5.05, h: 0.44 }
            ].forEach(tbl => {
                const top = new THREE.Mesh(new THREE.CylinderGeometry(tbl.r, tbl.r, 0.04, 24), marbleTopMat);
                top.position.set(tbl.x, tbl.h, tbl.z);
                top.castShadow = true;
                lSofaGroup.add(top);

                const leg = new THREE.Mesh(new THREE.CylinderGeometry(tbl.r * 0.4, tbl.r * 0.6, tbl.h - 0.02, 16), brassMat);
                leg.position.set(tbl.x, (tbl.h - 0.02) / 2, tbl.z);
                lSofaGroup.add(leg);
            });

            furnitureGroup.add(lSofaGroup);
            registerInteractiveItem(lSofaGroup, 'majlisMainLsofa', 'grandMajlis');

            // 2. Center Staggered Rectangular Coffee Tables (Two 180 × 90 cm tables + Two 70 × 70 cm square tables)
            const centerTablesGroup = new THREE.Group();

            // Left rectangular table (180 × 90 cm)
            const rectTop1 = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.05, 0.90), marbleTopMat);
            rectTop1.position.set(1.15, 0.42, -3.95);
            rectTop1.castShadow = true;
            centerTablesGroup.add(rectTop1);
            const rectBase1 = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.38, 0.65), walnutMat);
            rectBase1.position.set(1.15, 0.19, -3.95);
            centerTablesGroup.add(rectBase1);

            // Right rectangular table (180 × 90 cm)
            const rectTop2 = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.05, 0.90), marbleTopMat);
            rectTop2.position.set(2.65, 0.45, -4.35);
            rectTop2.castShadow = true;
            centerTablesGroup.add(rectTop2);
            const rectBase2 = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.41, 0.65), walnutMat);
            rectBase2.position.set(2.65, 0.205, -4.35);
            centerTablesGroup.add(rectBase2);

            // Two Square Accent Tables (70 × 70 cm)
            [
                { x: 1.70, z: -4.72 },
                { x: 2.38, z: -3.50 }
            ].forEach(sq => {
                const sqTop = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.05, 0.70), velvetGold);
                sqTop.position.set(sq.x, 0.48, sq.z);
                sqTop.castShadow = true;
                centerTablesGroup.add(sqTop);

                const sqBase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.44, 0.58), brassMat);
                sqBase.position.set(sq.x, 0.22, sq.z);
                centerTablesGroup.add(sqBase);
            });

            furnitureGroup.add(centerTablesGroup);
            registerInteractiveItem(centerTablesGroup, 'majlisCenterTables', 'grandMajlis');

            // 3. Bottom-Right Sofa (251 × 95 cm) + Round Corner Table (Ø77 cm)
            const bottomSofaGroup = new THREE.Group();
            const bSofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.51, 0.14, 0.95), walnutMat);
            bSofaBase.position.set(2.85, 0.07, -2.38);
            bottomSofaGroup.add(bSofaBase);

            const bSofaSeat = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.30, 0.88), velvetCream);
            bSofaSeat.position.set(2.85, 0.28, -2.40);
            bSofaSeat.castShadow = true;
            bottomSofaGroup.add(bSofaSeat);

            const bSofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.51, 0.48, 0.20), velvetGold);
            bSofaBack.position.set(2.85, 0.58, -2.00);
            bSofaBack.castShadow = true;
            bottomSofaGroup.add(bSofaBack);

            // Side armrests
            [-1.18, 1.18].forEach(xOff => {
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.95), velvetGold);
                arm.position.set(2.85 + xOff, 0.35, -2.38);
                bottomSofaGroup.add(arm);
            });

            // Ø77 cm round side table on the right of the 251 cm sofa
            const r77Top = new THREE.Mesh(new THREE.CylinderGeometry(0.385, 0.385, 0.04, 28), marbleTopMat);
            r77Top.position.set(4.58, 0.50, -2.38);
            r77Top.castShadow = true;
            bottomSofaGroup.add(r77Top);

            const r77Base = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.28, 0.48, 20), brassMat);
            r77Base.position.set(4.58, 0.24, -2.38);
            bottomSofaGroup.add(r77Base);

            furnitureGroup.add(bottomSofaGroup);
            registerInteractiveItem(bottomSofaGroup, 'majlisBottomSofa', 'grandMajlis');

            // 4. Reception Lounge (Left side of 1010 cm hall):
            // Upholstered Daybed/Chaise (173 × 75 cm) + Curved Floor Inlay (R = 231 cm) + Two Angled Armchairs (90 × 90 cm)
            const receptionGroup = new THREE.Group();

            // Daybed / Bench (173 cm long)
            const daybedBase = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 1.73), walnutMat);
            daybedBase.position.set(-0.95, 0.08, -4.30);
            receptionGroup.add(daybedBase);

            const daybedCushion = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.26, 1.68), velvetCream);
            daybedCushion.position.set(-0.95, 0.28, -4.30);
            daybedCushion.castShadow = true;
            receptionGroup.add(daybedCushion);

            const daybedBolster = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.68, 16), velvetGold);
            daybedBolster.rotation.z = Math.PI / 2;
            daybedBolster.position.set(-0.95, 0.45, -5.00);
            receptionGroup.add(daybedBolster);

            // Subtle architectural curved floor trim representing the 231 cm radius arc on the PDF
            const curveRing = new THREE.Mesh(
                new THREE.RingGeometry(2.26, 2.33, 36, 1, -0.45, 1.35),
                brassMat
            );
            curveRing.rotation.x = -Math.PI / 2;
            curveRing.position.set(-3.85, 0.038, -4.35);
            receptionGroup.add(curveRing);

            // Two Angled Armchairs (90 × 90 cm) at bottom-left of reception hall + small tables (Ø51 & Ø33 cm)
            [
                { x: -2.45, z: -2.48, rot: 0.48 },
                { x: -1.12, z: -2.48, rot: -0.48 }
            ].forEach(ch => {
                const chair = new THREE.Group();
                chair.position.set(ch.x, 0, ch.z);
                chair.rotation.y = ch.rot;

                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.38, 0.90), velvetCream);
                seat.position.y = 0.19;
                seat.castShadow = true;
                chair.add(seat);

                const back = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.46, 0.20), velvetGold);
                back.position.set(0, 0.56, 0.35);
                back.castShadow = true;
                chair.add(back);

                [-0.36, 0.36].forEach(ax => {
                    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.86), velvetGold);
                    arm.position.set(ax, 0.42, 0);
                    chair.add(arm);
                });

                receptionGroup.add(chair);
            });

            // Small accent tables between the two reception armchairs (Ø51 cm & Ø33 cm)
            const smTbl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.46, 20), brassMat);
            smTbl1.position.set(-1.78, 0.23, -2.55);
            receptionGroup.add(smTbl1);

            const smTbl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.52, 20), marbleTopMat);
            smTbl2.position.set(-1.78, 0.26, -2.22);
            receptionGroup.add(smTbl2);

            furnitureGroup.add(receptionGroup);
            registerInteractiveItem(receptionGroup, 'receptionDaybed', 'receptionLounge');
        }

