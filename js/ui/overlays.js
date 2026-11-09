/**
 * Villa Hassan | Projected room labels, dimensions and light pins
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        // ============================================================================
        // 15. FLOATING 3D HTML LABELS, DIMENSION BADGES & SMART BULB PINS
        // ============================================================================
        let labelDOMElements = [];
        let dimDOMElements = [];
        let bulbPinElements = [];

        function createHTMLOverlays() {
            const container = document.getElementById('labels-container');
            container.innerHTML = '';
            labelDOMElements = [];
            dimDOMElements = [];
            bulbPinElements = [];

            const colorClasses = {
                amber: 'border-amber-400/60 bg-slate-900/85 text-amber-300',
                sky: 'border-sky-400/60 bg-slate-900/85 text-sky-300',
                emerald: 'border-emerald-400/60 bg-slate-900/85 text-emerald-300',
                slate: 'border-slate-400/60 bg-slate-900/85 text-slate-200'
            };

            // 1. Room Labels
            floatingRoomLabels.forEach(lbl => {
                const el = document.createElement('button');
                el.type = 'button';
                el.className = `room-label border backdrop-blur-md shadow-lg ${colorClasses[lbl.color] || colorClasses.amber}`;
                const compactNames = {
                    'غرفة النوم الرئيسية': 'غرفة النوم',
                    'جلسة قوسية علوية': 'الجلسة القوسية',
                    'جلسة التراس العلوية': 'جلسة التراس',
                    'حديقة التراس اليمنى': 'حديقة التراس',
                    'الصالة العائلية (الكنبة القوسية)': 'الصالة العائلية',
                    'بهو الدرج والحوض الدائري': 'بهو الحوض'
                };
                el.title = lbl.name;
                el.setAttribute('aria-label', lbl.name);
                el.innerHTML = `
                    <div class="lbl-title">${compactNames[lbl.name] || lbl.name}</div>
                    <div class="lbl-sub text-slate-300 font-mono">${lbl.sub}</div>
                `;
                el.addEventListener('pointerdown', () => revealRoomLabels());
                el.addEventListener('pointerenter', () => { if (roomLabelsAwake) revealRoomLabels(); });
                el.addEventListener('focusin', () => revealRoomLabels());
                el.onclick = (e) => {
                    e.stopPropagation();
                    closeRadialLightMenu();
                    selectZoneFromDock(lbl.id, false, lbl.name, new THREE.Vector3(lbl.x, lbl.y, lbl.z));
                };
                container.appendChild(el);
                labelDOMElements.push({ el, zone: lbl.id, pos: new THREE.Vector3(lbl.x, lbl.y, lbl.z) });
            });

            // 2. Dimension Badges
            floatingDimBadges.forEach(dim => {
                const el = document.createElement('div');
                el.className = 'dim-badge';
                el.textContent = dim.text;
                container.appendChild(el);
                dimDOMElements.push({ el, pos: new THREE.Vector3(dim.x, dim.y, dim.z) });
            });

            // 3. Interactive Smart Bulb Pins in Every Room
            smartLights.forEach(lightObj => {
                const pin = document.createElement('button');
                pin.type = 'button';
                pin.style.display = 'none';
                pin.className = 'bulb-pin rounded-full px-2 py-1 flex items-center gap-1 border shadow-lg backdrop-blur-md';
                pin.title = `${lightObj.name} - انقر للتحكم بالإضاءة`;
                pin.onclick = (e) => {
                    e.stopPropagation();
                    const rect = pin.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    openRadialLightMenu(lightObj, cx, cy);
                };
                container.appendChild(pin);
                lightObj.pinEl = pin;
                bulbPinElements.push(lightObj);
                updateSmartBulbPinUI(lightObj);
            });
        }

        function updateSmartBulbPinUI(lightObj) {
            if (!lightObj || !lightObj.pinEl) return;
            const pin = lightObj.pinEl;
            const on = lightObj.isOn && lightObj.brightness > 0;
            const percent = on ? lightObj.brightness : 0;
            const label = `${lightObj.name} — شدة الإضاءة ${percent}% — اللون ${lightObj.colorHex}`;
            pin.title = label;
            pin.setAttribute('aria-label', label);
            pin.style.backgroundColor = 'rgba(10, 17, 29, 0.94)';
            pin.style.borderColor = on ? lightObj.colorHex : '#64748b';
            pin.style.boxShadow = on ? `0 0 12px ${lightObj.colorHex}55` : '0 3px 12px #0006';
            pin.innerHTML = `<i class="${on ? 'fa-solid' : 'fa-regular'} fa-lightbulb" aria-hidden="true" style="font-size:14px;color:${on ? lightObj.colorHex : '#94a3b8'}"></i>
                <span class="bulb-percent">${percent}%</span>
                <span class="bulb-color-swatch" style="background:${lightObj.colorHex};color:${lightObj.colorHex}" title="اللون ${lightObj.colorHex}" aria-hidden="true"></span>
                ${lightObj.timerRemainingSec > 0 ? `<span class="bulb-timer">${Math.ceil(lightObj.timerRemainingSec / 60)}د</span>` : ''}`;
        }

        function updateHTMLOverlaysPosition() {
            const halfW = window.innerWidth / 2;
            const halfH = window.innerHeight / 2;

            // Room labels
            labelDOMElements.forEach(item => {
                if (!showRoomLabelsFlag || focusedZoneKey !== 'overview' || cameraAnim) {
                    item.el.style.display = 'none';
                    return;
                }
                const v = item.pos.clone().project(camera);
                if (v.z < -1 || v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) {
                    item.el.style.display = 'none';
                } else {
                    item.el.style.display = 'block';
                    item.el.style.left = `${(v.x * halfW) + halfW}px`;
                    item.el.style.top = `${-(v.y * halfH) + halfH}px`;
                }
            });

            // Dimension badges
            dimDOMElements.forEach(item => {
                if (!showDimBadgesFlag) {
                    item.el.style.display = 'none';
                    return;
                }
                const v = item.pos.clone().project(camera);
                if (v.z > 1) {
                    item.el.style.display = 'none';
                } else {
                    item.el.style.display = 'block';
                    item.el.style.left = `${(v.x * halfW) + halfW}px`;
                    item.el.style.top = `${-(v.y * halfH) + halfH}px`;
                }
            });

            bulbPinElements.forEach(lightObj => {
                if (!lightObj.pinEl) return;
                const show = showSmartBulbPinsFlag && focusedZoneKey !== 'overview'
                    && lightObj.zone === focusedZoneKey && !cameraAnim;
                lightObj.fixtureGroup.visible = show;
                if (!show) {
                    lightObj.pinEl.style.display = 'none';
                    return;
                }
                const v = lightObj.fixtureGroup.getWorldPosition(new THREE.Vector3()).project(camera);
                // Reject positions behind the camera or outside the viewport; never clamp to a false location.
                const px = (v.x + 1) * halfW;
                const py = (1 - v.y) * halfH;
                if (v.z < -1 || v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) {
                    lightObj.pinEl.style.display = 'none';
                } else {
                    lightObj.pinEl.style.display = 'flex';
                    lightObj.pinEl.style.left = `${px}px`;
                    lightObj.pinEl.style.top = `${py}px`;
                }
            });
        }
