/**
 * Villa Hassan | Procedural textures and CAD drawing
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


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

            // Subtle tile grid & marble veins
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
            // Tile joints
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

        // Create a crisp 2D CAD Blueprint Overlay matching the PDF's orange/green/yellow CAD lines
        function createCADBlueprintTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 2048;
            const ctx = canvas.getContext('2d');

            // Coordinate mapper: world X in [-9, +9], world Z in [-9, +9] -> [0, 2048]
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

            // Draw CAD Orange Furniture Outlines & Dimension Lines
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 3;

            // Master Bed & Chaise CAD outline
            ctx.strokeRect(toPxX(-1.45), toPxY(-4.60), toPxLen(2.0), toPxLen(2.0));
            ctx.strokeRect(toPxX(0.55), toPxY(-4.60), toPxLen(0.75), toPxLen(2.0));

            // Dimension line 411 cm
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(toPxX(1.30), toPxY(-3.60));
            ctx.lineTo(toPxX(5.45), toPxY(-3.60));
            ctx.stroke();

            // Living Room Curved Sofa CAD Arc
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(toPxX(0.95), toPxY(0.45), toPxLen(2.35), Math.PI * 0.65, Math.PI * 1.48);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(toPxX(0.95), toPxY(0.45), toPxLen(1.39), Math.PI * 0.65, Math.PI * 1.48);
            ctx.stroke();

            // Central Lobby Circular Planter CAD circle (Ø160 cm)
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(toPxX(0.59), toPxY(4.60), toPxLen(0.80), 0, Math.PI * 2);
            ctx.stroke();

            // Terrace Planters CAD rectangles
            ctx.strokeRect(toPxX(6.60), toPxY(-4.90), toPxLen(0.90), toPxLen(2.60));

            const tex = new THREE.CanvasTexture(canvas);
            return tex;
        }
