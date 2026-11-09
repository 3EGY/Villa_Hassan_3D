/** Covering simulation adapter. No network or real motor control. */
(function(global) {
    'use strict';
    const registry = global.VillaDevices;
    const STORAGE_KEY = 'villa-hassan-coverings-v2-8';
    let persisted = {};
    try {
        const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (state && typeof state === 'object' && !Array.isArray(state)) persisted = state;
    } catch (_) { /* localStorage can be disabled */ }
    const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
    const valid = v => Number.isFinite(v) && v >= 0 && v <= 100;

    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)); } catch (_) {}
    }
    function registerCoverings() {
        for (const spec of VILLA_COVERING_CONFIG) {
            if (registry.get(spec.id)) continue;
            const position = valid(persisted[spec.id]) ? clamp(persisted[spec.id]) : 100;
            registry.register({
                id:spec.id, floorId:'floor1', kind:spec.kind, zoneId:spec.zoneId,
                name:spec.name, capabilities:['open','close','setPosition'],
                initialState:{position, moving:false}, mode:'simulation'
            });
        }
    }
    const createAdapter = () => ({
        async execute(device, action, value, context) {
            if (action === 'setPosition' && !valid(value)) {
                throw new RangeError('Covering position must be a number between 0 and 100');
            }
            const position = action === 'open' ? 100 : action === 'close' ? 0 : clamp(value);
            context.reportState({position});
            persisted[device.id] = position;
            save();
        }
    });
    registry.registerAdapter('shutter', createAdapter());
    registry.registerAdapter('curtain', createAdapter());
    global.VillaCoverings = Object.freeze({registerCoverings, specs:VILLA_COVERING_CONFIG});
})(window);
