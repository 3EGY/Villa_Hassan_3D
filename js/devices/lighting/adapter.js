/**
 * Villa Hassan | Existing lighting -> unified device registry bridge
 * The original smartLights objects remain the rendering/UI source of truth.
 * No changes to the radial controls, presets, geometry or CSS are required.
 */
(function (global) {
    'use strict';
    const registry = global.VillaDevices;

    function stateFor(light) {
        return {
            on: Boolean(light.isOn && light.brightness > 0),
            brightness: light.brightness,
            color: light.colorHex,
            timerMinutes: light.timerMinutes
        };
    }

    function publish(light) {
        if (registry.get(light.id)) registry.updateState(light.id, stateFor(light));
    }

    function registerLights() {
        for (const light of smartLights) {
            if (registry.get(light.id)) {
                publish(light);
                continue;
            }
            registry.register({
                id: light.id,
                kind: 'light',
                floorId: 'floor1',
                zoneId: light.zone,
                name: light.name,
                capabilities: ['turnOn', 'turnOff', 'toggle', 'setBrightness', 'setColor', 'setTimer'],
                initialState: stateFor(light)
            });
        }
    }

    registry.registerAdapter('light', {
        async execute(device, action, value) {
            const light = smartLights.find(item => item.id === device.id);
            if (!light) throw new Error(`3D light not found: ${device.id}`);
            // Validate before touching the original rendering state.
            if (action === 'setBrightness' && (!Number.isFinite(value) || value < 0 || value > 100)) {
                throw new RangeError('Brightness must be 0..100');
            }
            if (action === 'setColor' && (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value))) {
                throw new TypeError('Color must be #RRGGBB');
            }
            if (action === 'setTimer' && (!Number.isInteger(value) || value < 0 || value > 120)) {
                throw new RangeError('Timer must be an integer from 0 to 120 minutes');
            }

            // Keep existing lighting mode and scene behavior.
            markLightingCustom();
            switch (action) {
                case 'turnOn':
                    light.isOn = true;
                    if (light.brightness <= 0) light.brightness = 85;
                    break;
                case 'turnOff': light.isOn = false; break;
                case 'toggle':
                    light.isOn = !light.isOn;
                    if (light.isOn && light.brightness <= 0) light.brightness = 85;
                    break;
                case 'setBrightness':
                    light.brightness = Math.round(value);
                    light.isOn = light.brightness > 0;
                    break;
                case 'setColor':
                    light.colorHex = value.toLowerCase();
                    // The old radial picker stores ratio separately from hex.
                    const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
                    const target = rgb(light.colorHex);
                    const distance = stop => rgb(stop.hex).reduce((sum, v, i) => sum + (v - target[i]) ** 2, 0);
                    light.colorRatio = COLOR_SPECTRUM_STOPS.reduce(
                        (best, stop) => distance(stop) < distance(best) ? stop : best,
                        COLOR_SPECTRUM_STOPS[0]
                    ).t;
                    break;
                case 'setTimer':
                    startBulbTimer(light, value);
                    break;
            }
            applySmartLightState(light);
            if (activeSmartLight === light) syncRadialMenuDisplay();
        }
    });

    global.VillaLightingAdapter = Object.freeze({ registerLights, publish });
})(window);
