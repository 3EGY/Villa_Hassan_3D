/**
 * Villa Hassan | Touch-friendly light power, timer, brightness and color controls
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        // ============================================================================
        // 16. RADIAL SMART LIGHT MENU AROUND FINGER (Power, Timer Arc, Brightness Arc, Color Arc)
        // ============================================================================
        const ARC_CX = 134;
        const ARC_CY = 134;
        const ARC_RADIUS = 110;
        const ARC_START_DEG = 140; // Bottom-left
        const ARC_SWEEP_DEG = 260; // Sweeps 260° over top to bottom-right (400°)

        function polarToCartesian(cx, cy, r, angleDeg) {
            const rad = (angleDeg * Math.PI) / 180;
            return {
                x: cx + r * Math.cos(rad),
                y: cy + r * Math.sin(rad)
            };
        }

        function describeSvgArc(cx, cy, r, startAngleDeg, endAngleDeg) {
            const start = polarToCartesian(cx, cy, r, startAngleDeg);
            const end = polarToCartesian(cx, cy, r, endAngleDeg);
            const sweep = Math.max(0.1, endAngleDeg - startAngleDeg);
            const largeArcFlag = sweep <= 180 ? '0' : '1';
            return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
        }

        function openRadialLightMenu(lightObj, screenX, screenY) {
            closeLightingModes();
            if (!lightObj) return;
            activeSmartLight = lightObj;
            activeRadialArcMode = null;

            hideContextCard();
            closeAllPopovers();

            const menu = document.getElementById('radial-light-menu');
            // Clamp coordinates so the 268x268 radial wheel stays fully inside mobile/small screens
            const diameter = Math.min(268, window.innerWidth - 20, window.innerHeight - getBottomOverlayHeight() - 52);
            const scale = Math.max(0.45, diameter / 268);
            menu.style.width = `${268 * scale}px`;
            menu.style.height = `${268 * scale}px`;
            menu.style.setProperty('--radial-scale', scale);
            const margin = 134 * scale + 10;
            const clampedX = Math.max(margin, Math.min(window.innerWidth - margin, screenX));
            const maxY = window.innerHeight - getBottomOverlayHeight() - margin - 6;
            const clampedY = Math.max(margin + 24, Math.min(maxY, screenY));

            menu.style.left = `${clampedX}px`;
            menu.style.top = `${clampedY}px`;
            menu.classList.remove('radial-hidden');

            // Hide outer arc until user clicks Timer (2), Brightness (3), or Color (4)
            document.getElementById('radial-arc-svg').classList.add('opacity-0', 'pointer-events-none');
            document.getElementById('radial-arc-badge').classList.add('opacity-0');

            // Clear active states on satellite buttons
            ['radial-btn-timer', 'radial-btn-brightness', 'radial-btn-color'].forEach(id => {
                document.getElementById(id).classList.remove('radial-node-active');
            });

            syncRadialMenuDisplay();
        }

        function closeRadialLightMenu(event) {
            if (event) event.stopPropagation();
            const menu = document.getElementById('radial-light-menu');
            if (menu) menu.classList.add('radial-hidden');
            finishRadialArcDrag();
            activeSmartLight = null;
            activeRadialArcMode = null;
        }

        function syncRadialMenuDisplay() {
            if (!activeSmartLight) return;

            // Update Center Finger Hub
            const centerTitle = document.getElementById('radial-center-title');
            const centerSub = document.getElementById('radial-center-sub');
            const centerIcon = document.getElementById('radial-center-icon');

            centerTitle.textContent = activeSmartLight.name.replace('لمبة ', '').replace('ثريا ', '').replace('إضاءة ', '');
            if (activeSmartLight.isOn && activeSmartLight.brightness > 0) {
                centerSub.textContent = activeSmartLight.timerRemainingSec > 0
                    ? `${activeSmartLight.brightness}% | ${Math.ceil(activeSmartLight.timerRemainingSec / 60)}د`
                    : `${activeSmartLight.brightness}%`;
                centerIcon.style.color = activeSmartLight.colorHex;
            } else {
                centerSub.textContent = 'مطفأ';
                centerIcon.style.color = '#94a3b8';
            }

            // 1. Update Power Button ("إطفاء" when ON, "تشغيل" when OFF)
            const pwrIcon = document.getElementById('radial-power-icon');
            const pwrText = document.getElementById('radial-power-text');
            const pwrBtn = document.getElementById('radial-btn-power');

            if (activeSmartLight.isOn && activeSmartLight.brightness > 0) {
                pwrText.textContent = 'إطفاء';
                pwrIcon.className = 'fa-solid fa-power-off text-rose-400 text-xs';
                pwrBtn.style.borderColor = 'rgba(244, 63, 94, 0.55)';
            } else {
                pwrText.textContent = 'تشغيل';
                pwrIcon.className = 'fa-solid fa-bolt text-emerald-400 text-xs';
                pwrBtn.style.borderColor = 'rgba(16, 185, 129, 0.65)';
            }
        }

        // Option 1: Power Toggle ("إطفاء" عندما تكون الإضاءة تعمل والعكس صحيح)
        function handleRadialPowerClick(event) {
            if (event) event.stopPropagation();
            if (!activeSmartLight) return;

            markLightingCustom();
            activeSmartLight.isOn = !activeSmartLight.isOn;
            if (activeSmartLight.isOn && activeSmartLight.brightness === 0) {
                activeSmartLight.brightness = 85;
            }
            applySmartLightState(activeSmartLight);
            syncRadialMenuDisplay();

            if (activeRadialArcMode === 'brightness') {
                renderRadialArcGeometry(activeSmartLight.isOn ? activeSmartLight.brightness / 100 : 0, 'brightness');
            }

            showToast(activeSmartLight.isOn ? `تم تشغيل ${activeSmartLight.name}` : `تم إطفاء ${activeSmartLight.name}`);
        }

        // Options 2, 3, 4: Activate Interactive Arc for Timer, Brightness, or Color
        function activateRadialArcMode(mode, event) {
            if (event) event.stopPropagation();
            if (!activeSmartLight) return;

            activeRadialArcMode = mode;

            // Highlight selected satellite button
            ['radial-btn-timer', 'radial-btn-brightness', 'radial-btn-color'].forEach(id => {
                document.getElementById(id).classList.remove('radial-node-active');
            });
            document.getElementById(`radial-btn-${mode}`).classList.add('radial-node-active');

            // Reveal SVG Interactive Arc & Badge
            const svg = document.getElementById('radial-arc-svg');
            const badge = document.getElementById('radial-arc-badge');
            svg.classList.remove('opacity-0', 'pointer-events-none');
            badge.classList.remove('opacity-0');

            // Draw base track arc
            const fullTrackD = describeSvgArc(ARC_CX, ARC_CY, ARC_RADIUS, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG);
            document.getElementById('radial-arc-bg').setAttribute('d', fullTrackD);
            document.getElementById('radial-arc-track').setAttribute('d', fullTrackD);
            document.getElementById('radial-arc-hit').setAttribute('d', fullTrackD);

            // Set initial ratio based on current light property
            let ratio = 0.5;
            if (mode === 'brightness') {
                ratio = activeSmartLight.isOn ? (activeSmartLight.brightness / 100) : 0;
            } else if (mode === 'timer') {
                ratio = activeSmartLight.timerMinutes / 120;
            } else if (mode === 'color') {
                ratio = activeSmartLight.colorRatio ?? 0.16;
            }

            renderRadialArcGeometry(ratio, mode);
        }

        function renderRadialArcGeometry(ratio, mode) {
            ratio = Math.max(0, Math.min(1, ratio));
            const currentAngleDeg = ARC_START_DEG + ratio * ARC_SWEEP_DEG;

            const activePath = document.getElementById('radial-arc-active');
            const trackPath = document.getElementById('radial-arc-track');
            const thumb = document.getElementById('radial-arc-thumb');
            const thumbDot = document.getElementById('radial-thumb-dot');
            const badgeIcon = document.getElementById('radial-badge-icon');
            const badgeText = document.getElementById('radial-badge-text');

            // Position thumb knob along the arc
            const thumbPt = polarToCartesian(ARC_CX, ARC_CY, ARC_RADIUS, currentAngleDeg);
            thumb.setAttribute('transform', `translate(${thumbPt.x.toFixed(1)}, ${thumbPt.y.toFixed(1)})`);

            if (mode === 'color') {
                // Full spectrum visible on track
                const fullArcD = describeSvgArc(ARC_CX, ARC_CY, ARC_RADIUS, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG);
                activePath.setAttribute('d', fullArcD);
                activePath.setAttribute('stroke', 'url(#grad-color)');
                trackPath.setAttribute('stroke', 'transparent');

                const colorInfo = sampleColorSpectrum(ratio);
                thumbDot.setAttribute('fill', colorInfo.hex);
                badgeIcon.className = 'fa-solid fa-palette';
                badgeIcon.style.color = colorInfo.hex;
                badgeText.textContent = `اللون: ${colorInfo.name}`;
            } else if (mode === 'brightness') {
                const subArcD = describeSvgArc(ARC_CX, ARC_CY, ARC_RADIUS, ARC_START_DEG, Math.max(ARC_START_DEG + 1, currentAngleDeg));
                activePath.setAttribute('d', subArcD);
                activePath.setAttribute('stroke', 'url(#grad-brightness)');
                trackPath.setAttribute('stroke', 'rgba(255, 255, 255, 0.18)');

                const pct = Math.round(ratio * 100);
                thumbDot.setAttribute('fill', '#fbbf24');
                badgeIcon.className = 'fa-solid fa-sun text-amber-400';
                badgeIcon.style.color = '#fbbf24';
                badgeText.textContent = `شدة الإضاءة: ${pct}%`;
            } else if (mode === 'timer') {
                const subArcD = describeSvgArc(ARC_CX, ARC_CY, ARC_RADIUS, ARC_START_DEG, Math.max(ARC_START_DEG + 1, currentAngleDeg));
                activePath.setAttribute('d', subArcD);
                activePath.setAttribute('stroke', 'url(#grad-timer)');
                trackPath.setAttribute('stroke', 'rgba(255, 255, 255, 0.18)');

                const mins = Math.round((ratio * 120) / 5) * 5;
                thumbDot.setAttribute('fill', '#38bdf8');
                badgeIcon.className = 'fa-solid fa-stopwatch text-sky-400';
                badgeIcon.style.color = '#38bdf8';
                badgeText.textContent = mins > 0 ? `المؤقت: ${mins} دقيقة` : 'المؤقت: إيقاف (0 د)';
            }
        }

        function sampleColorSpectrum(ratio) {
            ratio = Math.max(0, Math.min(1, ratio));
            let closest = COLOR_SPECTRUM_STOPS[0];
            let minDiff = 999;
            for (let i = 0; i < COLOR_SPECTRUM_STOPS.length - 1; i++) {
                const s0 = COLOR_SPECTRUM_STOPS[i];
                const s1 = COLOR_SPECTRUM_STOPS[i + 1];
                if (ratio >= s0.t && ratio <= s1.t) {
                    const localT = (ratio - s0.t) / (s1.t - s0.t);
                    const c0 = new THREE.Color(s0.hex);
                    const c1 = new THREE.Color(s1.hex);
                    c0.lerp(c1, localT);
                    return {
                        hex: '#' + c0.getHexString(),
                        name: localT < 0.5 ? s0.name : s1.name
                    };
                }
                const d = Math.abs(ratio - s0.t);
                if (d < minDiff) {
                    minDiff = d;
                    closest = s0;
                }
            }
            return { hex: closest.hex, name: closest.name };
        }

        function finishRadialArcDrag() {
            const pointerId = radialDragPointerId;
            radialDragPointerId = null;
            isDraggingRadialArc = false;
            const svg = document.getElementById('radial-arc-svg');
            if (pointerId !== null && svg && svg.hasPointerCapture(pointerId)) {
                svg.releasePointerCapture(pointerId);
            }
        }

        function setupRadialArcInteraction() {
            const svg = document.getElementById('radial-arc-svg');
            if (!svg) return;

            const onPointerDown = (e) => {
                if (!activeSmartLight || !activeRadialArcMode || radialDragPointerId !== null
                    || e.isPrimary === false || (e.pointerType === 'mouse' && e.button !== 0)) return;
                e.stopPropagation();
                if (e.cancelable) e.preventDefault();
                radialDragPointerId = e.pointerId;
                isDraggingRadialArc = true;
                svg.setPointerCapture(e.pointerId);
                updateRadialArcValueFromPoint(e.clientX, e.clientY);
            };

            const onPointerMove = (e) => {
                if (e.pointerId !== radialDragPointerId || !isDraggingRadialArc
                    || !activeSmartLight || !activeRadialArcMode) return;
                e.stopPropagation();
                if (e.cancelable) e.preventDefault();
                updateRadialArcValueFromPoint(e.clientX, e.clientY);
            };

            const onPointerEnd = (e) => {
                if (e.pointerId !== radialDragPointerId) return;
                if (e.type === 'pointerup' && activeSmartLight && activeRadialArcMode) {
                    updateRadialArcValueFromPoint(e.clientX, e.clientY);
                }
                finishRadialArcDrag();
            };

            svg.addEventListener('pointerdown', onPointerDown, { passive: false });
            window.addEventListener('pointermove', onPointerMove, { passive: false });
            window.addEventListener('pointerup', onPointerEnd);
            window.addEventListener('pointercancel', onPointerEnd);
            svg.addEventListener('lostpointercapture', onPointerEnd);
            window.addEventListener('blur', finishRadialArcDrag);
        }

        function updateRadialArcValueFromPoint(clientX, clientY) {
            if (!activeSmartLight || !activeRadialArcMode) return;
            const svg = document.getElementById('radial-arc-svg');
            const rect = svg.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            const dx = clientX - cx;
            const dy = clientY - cy;
            let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
            if (deg < 0) deg += 360;

            // Normalize angle relative to ARC_START_DEG (140° -> 400°)
            let relAngle = deg - ARC_START_DEG;
            if (relAngle < 0) relAngle += 360;

            // Clamp dead-zone at the bottom (between 260° and 360° relative)
            if (relAngle > ARC_SWEEP_DEG) {
                relAngle = (relAngle - ARC_SWEEP_DEG < (360 - ARC_SWEEP_DEG) / 2) ? ARC_SWEEP_DEG : 0;
            }

            const ratio = Math.max(0, Math.min(1, relAngle / ARC_SWEEP_DEG));
            markLightingCustom();
            renderRadialArcGeometry(ratio, activeRadialArcMode);

            if (activeRadialArcMode === 'brightness') {
                const pct = Math.round(ratio * 100);
                activeSmartLight.brightness = pct;
                activeSmartLight.isOn = pct > 0;
                applySmartLightState(activeSmartLight);
                syncRadialMenuDisplay();
            } else if (activeRadialArcMode === 'color') {
                const colorInfo = sampleColorSpectrum(ratio);
                activeSmartLight.colorHex = colorInfo.hex;
                activeSmartLight.colorRatio = ratio;
                if (!activeSmartLight.isOn) {
                    activeSmartLight.isOn = true;
                    if (activeSmartLight.brightness === 0) activeSmartLight.brightness = 85;
                }
                applySmartLightState(activeSmartLight);
                syncRadialMenuDisplay();
            } else if (activeRadialArcMode === 'timer') {
                const mins = Math.round((ratio * 120) / 5) * 5;
                startBulbTimer(activeSmartLight, mins);
                syncRadialMenuDisplay();
            }
        }

        function startBulbTimer(lightObj, minutes) {
            if (!lightObj) return;
            if (lightObj.timerInterval) {
                clearInterval(lightObj.timerInterval);
                lightObj.timerInterval = null;
            }
            lightObj.timerMinutes = minutes;
            lightObj.timerRemainingSec = minutes * 60;

            if (minutes > 0) {
                if (!lightObj.isOn) {
                    lightObj.isOn = true;
                    if (lightObj.brightness === 0) lightObj.brightness = 85;
                }
                applySmartLightState(lightObj);
                lightObj.timerInterval = setInterval(() => {
                    lightObj.timerRemainingSec = Math.max(0, lightObj.timerRemainingSec - 1);
                    if (lightObj.timerRemainingSec <= 0) {
                        clearInterval(lightObj.timerInterval);
                        lightObj.timerInterval = null;
                        lightObj.timerMinutes = 0;
                        lightObj.isOn = false;
                        markLightingCustom();
                        applySmartLightState(lightObj);
                        if (activeSmartLight === lightObj) syncRadialMenuDisplay();
                        showToast(`انتهى المؤقت: تم إطفاء ${lightObj.name} تلقائياً`);
                    } else {
                        updateSmartBulbPinUI(lightObj);
                        if (activeSmartLight === lightObj) syncRadialMenuDisplay();
                    }
                }, 1000);
            } else {
                updateSmartBulbPinUI(lightObj);
            }
        }
