        // ============================================================================
        // 14. FLOATING 3D HTML LABELS, DIMENSION BADGES & SMART BULB PINS
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
                const el = document.createElement('div');
                el.className = `room-label px-2.5 py-1 rounded-xl border backdrop-blur-md shadow-lg ${colorClasses[lbl.color] || colorClasses.amber}`;
                el.innerHTML = `
                    <div class="lbl-title text-[11px] font-extrabold leading-tight">${lbl.name}</div>
                    <div class="lbl-sub text-[9px] text-slate-300 font-mono leading-tight">${lbl.sub}</div>
                `;
                el.onclick = (e) => {
                    e.stopPropagation();
                    closeRadialLightMenu();
                    selectZoneFromDock(lbl.id, true);
                };
                container.appendChild(el);
                labelDOMElements.push({ el, pos: new THREE.Vector3(lbl.x, lbl.y, lbl.z) });
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
                pin.className = 'bulb-pin rounded-full px-2 py-1 flex items-center gap-1 border shadow-lg backdrop-blur-md';
                pin.title = `${lightObj.name} - انقر للتحكم بالإضاءة`;
                pin.onclick = (e) => {
                    e.stopPropagation();
                    const rect = pin.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    if(window.VillaGroundReview?.isActive){window.VillaGroundReview.select(lightObj.id);return;}
                    openRadialLightMenu(lightObj, cx, cy);
                };
                container.appendChild(pin);
                lightObj.pinEl = pin;
                bulbPinElements.push(lightObj);
                updateSmartBulbPinUI(lightObj);
            });
        }

        function addGroundReviewLightPin(lightObj){
            if(!document.getElementById('labels-container'))return;
            const pin=document.createElement('button');
            pin.type='button';pin.className='bulb-pin rounded-full px-2 py-1 flex items-center gap-1 border shadow-lg backdrop-blur-md';
            pin.title=lightObj.name+' - مراجعة إضاءة';
            pin.onclick=e=>{e.stopPropagation();const rect=pin.getBoundingClientRect();if(window.VillaGroundReview?.isActive)window.VillaGroundReview.select(lightObj.id);else openRadialLightMenu(lightObj,rect.left+rect.width/2,rect.top+rect.height/2);};
            document.getElementById('labels-container').appendChild(pin);
            lightObj.pinEl=pin;bulbPinElements.push(lightObj);updateSmartBulbPinUI(lightObj);
        }

        function updateSmartBulbPinUI(lightObj) {
            if (!lightObj || !lightObj.pinEl) return;
            const pin = lightObj.pinEl;
            const timerText = lightObj.timerRemainingSec > 0
                ? `<span class="text-[8.5px] font-mono text-sky-300">${Math.ceil(lightObj.timerRemainingSec / 60)}د</span>`
                : `<span class="text-[8.5px] font-mono opacity-90">${lightObj.isOn ? lightObj.brightness + '%' : 'مطفأ'}</span>`;

            if (lightObj.isOn && lightObj.brightness > 0) {
                pin.style.backgroundColor = 'rgba(15, 23, 42, 0.88)';
                pin.style.borderColor = lightObj.colorHex;
                pin.style.boxShadow = `0 0 14px ${lightObj.colorHex}80`;
                pin.innerHTML = `
                    <i class="fa-solid fa-lightbulb text-xs" style="color: ${lightObj.colorHex}; filter: drop-shadow(0 0 5px ${lightObj.colorHex});"></i>
                    ${timerText}
                `;
            } else {
                pin.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
                pin.style.borderColor = 'rgba(148, 163, 184, 0.35)';
                pin.style.boxShadow = '0 4px 10px rgba(0,0,0,0.4)';
                pin.innerHTML = `
                    <i class="fa-regular fa-lightbulb text-xs text-slate-400"></i>
                    <span class="text-[8.5px] font-mono text-slate-400">مطفأ</span>
                `;
            }
        }

        function updateHTMLOverlaysPosition() {
            const halfW = window.innerWidth / 2;
            const halfH = window.innerHeight / 2;

            // Room labels (Hidden for the active focused room so its center bulb is 100% clear)
            labelDOMElements.forEach((item, index) => {
                if (!showRoomLabelsFlag) {
                    item.el.style.display = 'none';
                    return;
                }
                const lblSpec = floatingRoomLabels[index];
                if (selectedZoneKey !== 'overview' && lblSpec && lblSpec.id === selectedZoneKey) {
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

            // Smart Bulb 3D Pins
            bulbPinElements.forEach(lightObj => {
                if (!lightObj.pinEl) return;
                if (!showSmartBulbPinsFlag) {
                    lightObj.pinEl.style.display = 'none';
                    return;
                }
                const v = lightObj.pos.clone().project(camera);
                if (v.z > 1) {
                    lightObj.pinEl.style.display = 'none';
                } else {
                    lightObj.pinEl.style.display = 'flex';
                    lightObj.pinEl.style.left = `${(v.x * halfW) + halfW}px`;
                    lightObj.pinEl.style.top = `${-(v.y * halfH) + halfH}px`;
                }
            });
        }

