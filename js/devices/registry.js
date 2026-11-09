/**
 * Villa Hassan | Device Registry (v2.7)
 * One catalog for every simulated/physical device, independent of the 3D scene.
 * Loaded as a classic script before device-specific adapters (no bundler).
 *
 * Commands do not mutate state optimistically. An adapter reports confirmed
 * state through context.reportState(), allowing a real adapter to be added later.
 */
(function (global) {
    'use strict';

    const devices = new Map();
    const adapters = new Map();
    const subscribers = new Set();
    const ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

    function copy(value) {
        // Device state is intentionally limited to JSON-compatible data.
        return JSON.parse(JSON.stringify(value));
    }

    function snapshot(record) {
        if (!record) return null;
        return {
            id: record.id,
            kind: record.kind,
            zoneId: record.zoneId,
            floorId: record.floorId,
            name: record.name,
            capabilities: [...record.capabilities],
            state: copy(record.state),
            mode: record.mode
        };
    }

    function notify(type, record) {
        const event = { type, device: snapshot(record) };
        for (const listener of subscribers) {
            try { listener(event); }
            catch (error) { console.error('[VillaDevices] subscriber error:', error); }
        }
    }

    function register(definition) {
        if (!definition || !ID_PATTERN.test(definition.id || '')) {
            throw new TypeError('Device id must be a stable ASCII identifier (letters, digits, - or _).');
        }
        if (devices.has(definition.id)) throw new Error(`Device id already registered: ${definition.id}`);
        if (typeof definition.kind !== 'string' || !ID_PATTERN.test(definition.kind)) {
            throw new TypeError(`Invalid device kind for ${definition.id}`);
        }
        if (typeof definition.name !== 'string' || !definition.name.trim()) {
            throw new TypeError(`Missing device name: ${definition.id}`);
        }
        if (typeof definition.zoneId !== 'string' || definition.zoneId === 'overview'
            || (typeof ZONE_SPECS !== 'undefined' && !Object.hasOwn(ZONE_SPECS, definition.zoneId))) {
            throw new TypeError(`Unknown zoneId for ${definition.id}: ${definition.zoneId}`);
        }
        if (!Array.isArray(definition.capabilities) || !definition.capabilities.length
            || definition.capabilities.some(cap => typeof cap !== 'string' || !ID_PATTERN.test(cap))
            || new Set(definition.capabilities).size !== definition.capabilities.length) {
            throw new TypeError(`Invalid capabilities for ${definition.id}`);
        }
        const initialState = definition.initialState || {};
        if (typeof initialState !== 'object' || initialState === null || Array.isArray(initialState)) {
            throw new TypeError(`Invalid initialState for ${definition.id}`);
        }
        const record = {
            id: definition.id,
            kind: definition.kind,
            zoneId: definition.zoneId,
            floorId: definition.floorId || 'floor1',
            name: definition.name.trim(),
            capabilities: [...definition.capabilities],
            state: copy(initialState),
            mode: definition.mode || 'simulation'
        };
        devices.set(record.id, record);
        notify('registered', record);
        return snapshot(record);
    }

    function get(id) { return snapshot(devices.get(id)); }

    function list(filter = {}) {
        return [...devices.values()]
            .filter(d => (!filter.kind || d.kind === filter.kind)
                && (!filter.zoneId || d.zoneId === filter.zoneId)
                && (!filter.floorId || d.floorId === filter.floorId))
            .map(snapshot);
    }

    function updateState(id, patch) {
        const record = devices.get(id);
        if (!record) throw new Error(`Unknown device: ${id}`);
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
            throw new TypeError(`Invalid state patch for ${id}`);
        }
        // Only publish a change when a value differs, to avoid 3D render noise.
        const next = { ...record.state, ...copy(patch) };
        const changed = Object.keys(next).some(key => record.state[key] !== next[key]);
        if (changed) {
            record.state = next;
            notify('state', record);
        }
        return snapshot(record);
    }

    function registerAdapter(kind, adapter) {
        if (!ID_PATTERN.test(kind || '') || !adapter || typeof adapter.execute !== 'function') {
            throw new TypeError('Adapters require a kind and an execute(device, action, value, context) function.');
        }
        if (adapters.has(kind)) throw new Error(`Adapter already registered for kind: ${kind}`);
        adapters.set(kind, adapter);
    }

    async function execute(id, action, value) {
        const record = devices.get(id);
        if (!record) throw new Error(`Unknown device: ${id}`);
        if (!record.capabilities.includes(action)) {
            throw new Error(`Unsupported action ${action} for device ${id}`);
        }
        const adapter = adapters.get(record.kind);
        if (!adapter) throw new Error(`No ${record.kind} adapter available for ${id}`);
        const context = {
            reportState: patch => updateState(id, patch),
            getState: () => copy(devices.get(id).state)
        };
        await adapter.execute(snapshot(record), action, value, context);
        return get(id);
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') throw new TypeError('subscribe(listener) requires a function.');
        subscribers.add(listener);
        return () => subscribers.delete(listener);
    }

    global.VillaDevices = Object.freeze({ register, get, list, updateState, registerAdapter, execute, subscribe });
})(window);
