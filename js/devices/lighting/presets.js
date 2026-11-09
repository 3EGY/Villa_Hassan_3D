/**
 * Villa Hassan | Day/night modes and house-wide lighting presets
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        function setLightingMode(mode) {
            isNightMode = (mode === 'night');
            const dayBtn = document.getElementById('light-day');
            const nightBtn = document.getElementById('light-night');
            const qIcon = document.getElementById('quick-light-icon');
            const qText = document.getElementById('quick-light-text');

            if (isNightMode) {
                if (dayBtn) dayBtn.classList.remove('btn-active');
                if (nightBtn) nightBtn.classList.add('btn-active');
                if (qIcon) qIcon.className = 'fa-solid fa-moon text-sky-300';
                if (qText) qText.textContent = 'ليلي 3000K';
                scene.background.setHex(0x050811);
                scene.fog.color.setHex(0x050811);
                ambientLight.intensity = 0.035;
                hemiLight.intensity = 0.045;
                dirLight.intensity = 0.045;
                renderer.toneMappingExposure = 1.05;
            } else {
                if (nightBtn) nightBtn.classList.remove('btn-active');
                if (dayBtn) dayBtn.classList.add('btn-active');
                if (qIcon) qIcon.className = 'fa-solid fa-sun text-amber-300';
                if (qText) qText.textContent = 'نهاري';
                scene.background.setHex(0x0b1120);
                scene.fog.color.setHex(0x0b1120);
                ambientLight.intensity = 0.35;
                hemiLight.intensity = 0.35;
                dirLight.intensity = 0.75;
                renderer.toneMappingExposure = 0.78;
            }

            smartLights.forEach(sl => applySmartLightState(sl));
            syncLightingDecor();
        }

        function syncLightingDecor() {
            emissiveMaterials.forEach(material => {
                const lights = smartLights.filter(light => light.zone === material.userData.zone && light.isOn && light.brightness > 0);
                const strongest = lights.sort((a, b) => b.brightness - a.brightness)[0];
                material.emissiveIntensity = strongest ? (isNightMode ? 1.25 : 0.45) * strongest.brightness / 100 : 0;
                if (strongest) material.emissive.set(strongest.colorHex);
            });
        }

        function requestLightingShadowUpdate() {
            if (renderer) renderer.shadowMap.needsUpdate = true;
        }

        function markLightingCustom() {
            activeLightingPreset = 'custom';
        }

        function syncLightingPresetUI() {
            const allOff = smartLights.length > 0 && smartLights.every(light => !light.isOn || light.brightness <= 0);
            for (const name of Object.keys(LIGHTING_PRESETS)) {
                const button = document.getElementById(`preset-${name}`);
                if (button) button.setAttribute('aria-pressed', String(!allOff && activeLightingPreset === name));
            }
            const allButton = document.getElementById('preset-all');
            if (!allButton) return;
            allButton.setAttribute('aria-pressed', String(allOff));
            document.getElementById('preset-all-label').textContent = allOff ? 'تشغيل الكل' : 'إغلاق الكل';
            document.getElementById('preset-all-description').textContent = allOff ? 'تشغيل كل اللمبات على شدة 90%' : 'إطفاء كل اللمبات والإضاءة المخفية';
            document.getElementById('preset-all-icon').className = allOff ? 'fa-solid fa-lightbulb' : 'fa-solid fa-power-off';
            document.getElementById('lighting-mode-current').textContent = allOff ? 'كل الإضاءة مطفأة'
                : LIGHTING_PRESETS[activeLightingPreset]?.label || (activeLightingPreset === 'all-on' ? 'كل الإضاءة تعمل · 90%' : 'إعدادات مخصصة');
            document.querySelector('#lighting-modes-button i').className = allOff ? 'fa-regular fa-lightbulb' : 'fa-solid fa-lightbulb';
        }

        function updateLightingModesLayout() {
            const bottom = getBottomOverlayHeight();
            document.documentElement.style.setProperty('--lighting-button-bottom', `${bottom + 12}px`);
            document.documentElement.style.setProperty('--lighting-panel-bottom', `${bottom + (window.innerHeight < 520 ? 8 : 72)}px`);
        }

        function toggleLightingModes(event) {
            if (event) event.stopPropagation();
            const panel = document.getElementById('lighting-modes-panel');
            if (!panel.hidden) { closeLightingModes(true); return; }
            closeAllPopovers();
            closeRadialLightMenu();
            hideContextCard();
            updateLightingModesLayout();
            syncLightingPresetUI();
            panel.hidden = false;
            document.getElementById('lighting-modes-backdrop').hidden = false;
            document.getElementById('lighting-modes-button').setAttribute('aria-expanded', 'true');
        }

        function closeLightingModes(returnFocus = false) {
            document.getElementById('lighting-modes-panel').hidden = true;
            document.getElementById('lighting-modes-backdrop').hidden = true;
            document.getElementById('lighting-modes-button').setAttribute('aria-expanded', 'false');
            if (returnFocus) document.getElementById('lighting-modes-button').focus({ preventScroll: true });
        }

        function applyLightingPreset(name) {
            if (!LIGHTING_PRESETS[name] && name !== 'all-off' && name !== 'all-on') return;
            isApplyingLightingPreset = true;
            setLightingMode('night');
            for (const light of smartLights) {
                if (light.timerInterval) clearInterval(light.timerInterval);
                light.timerInterval = null;
                light.timerMinutes = 0;
                light.timerRemainingSec = 0;
                const preset = LIGHTING_PRESETS[name];
                const brightness = preset ? (light.zone === 'livingRoom' ? preset.livingBrightness : preset.roomBrightness)
                    : (name === 'all-on' ? 90 : 0);
                light.brightness = brightness;
                light.isOn = brightness > 0;
                applySmartLightState(light);
            }
            activeLightingPreset = name;
            isApplyingLightingPreset = false;
            syncLightingDecor();
            syncLightingPresetUI();
            selectZoneFromDock('overview');
            hideRoomLabels();
            closeLightingModes(true);
            showToast(LIGHTING_PRESETS[name]?.label || (name === 'all-on' ? 'تم تشغيل كل الإضاءة' : 'تم إغلاق كل الإضاءة'));
        }

        function toggleAllLights() {
            const allOff = smartLights.every(light => !light.isOn || light.brightness <= 0);
            applyLightingPreset(allOff ? 'all-on' : 'all-off');
        }

        function toggleDayNightQuick(event) {
            if (event) event.stopPropagation();
            setLightingMode(isNightMode ? 'day' : 'night');
        }
