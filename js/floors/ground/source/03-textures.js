        // ============================================================================
        // 3. PROCEDURAL TEXTURES & MATERIALS
        // ============================================================================
        function createMarbleTexture(baseHex, veinHex) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = baseHex;
            ctx.fillRect(0, 0, 512, 512);

            ctx.strokeStyle = veinHex;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 14; i++) {
                ctx.beginPath();
                let x = Math.random() * 512;
                let y = 0;
                ctx.moveTo(x, y);
                for (let step = 0; step < 8; step++) {
                    x += (Math.random() - 0.5) * 90;
                    y += 64;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.06)';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 256, 256);
            ctx.strokeRect(256, 0, 256, 256);
            ctx.strokeRect(0, 256, 256, 256);
            ctx.strokeRect(256, 256, 256, 256);

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(6, 6);
            return tex;
        }

        function createWoodTexture(baseColor = '#8c5832', grainColor = '#6e4221') {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = grainColor;
            for (let i = 0; i < 45; i++) {
                ctx.fillRect(0, Math.random() * 256, 256, 1 + Math.random() * 2);
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        function createCADBlueprintTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 2048;
            const ctx = canvas.getContext('2d');

            const toPxX = (x) => ((x + 9.0) / 18.0) * 2048;
            const toPxY = (z) => ((z + 9.0) / 18.0) * 2048;
            const toPxLen = (m) => (m / 18.0) * 2048;

            ctx.clearRect(0, 0, 2048, 2048);

            // Subtle architectural grid
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
            ctx.lineWidth = 1;
            for (let m = -8; m <= 8; m++) {
                ctx.beginPath();
                ctx.moveTo(toPxX(m), 0);
                ctx.lineTo(toPxX(m), 2048);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, toPxY(m));
                ctx.lineTo(2048, toPxY(m));
                ctx.stroke();
            }

            // Draw CAD Orange Furniture Outlines & Dimension Lines matching the Ground Floor PDF
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 3;

            // Grand Majlis L-Sofa (590 x 190 cm) & Coffee Tables (180 x 90 cm)
            ctx.strokeRect(toPxX(-0.55), toPxY(-5.90), toPxLen(5.90), toPxLen(0.95));
            ctx.strokeRect(toPxX(0.25), toPxY(-4.40), toPxLen(1.80), toPxLen(0.90));
            ctx.strokeRect(toPxX(1.75), toPxY(-4.80), toPxLen(1.80), toPxLen(0.90));
            ctx.strokeRect(toPxX(1.60), toPxY(-2.85), toPxLen(2.51), toPxLen(0.95));

            // Reception Curved Partition Line (R = 231 cm)
            ctx.beginPath();
            ctx.arc(toPxX(-3.85), toPxY(-4.35), toPxLen(2.31), -0.35, 0.85);
            ctx.stroke();

            // Dining Table (250 x 90 cm)
            ctx.strokeRect(toPxX(-0.70), toPxY(-0.50), toPxLen(2.50), toPxLen(0.90));

            // Kitchen Island (182 x 92 cm)
            ctx.strokeRect(toPxX(-5.01), toPxY(-0.51), toPxLen(1.82), toPxLen(0.92));

            // Family Living Sofas (349 x 92 cm & 200 x 75 cm) & Table (160 x 70 cm)
            ctx.strokeRect(toPxX(1.10), toPxY(5.72), toPxLen(3.49), toPxLen(0.92));
            ctx.strokeRect(toPxX(2.75), toPxY(2.68), toPxLen(2.00), toPxLen(0.75));
            ctx.strokeRect(toPxX(2.65), toPxY(4.30), toPxLen(1.60), toPxLen(0.70));

            const tex = new THREE.CanvasTexture(canvas);
            return tex;
        }

