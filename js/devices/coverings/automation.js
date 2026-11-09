/**
 * Local-only opening/closing schedules. Works while this webpage is open.
 * A real unattended scheduler belongs on a local home-automation gateway, not GitHub Pages.
 */
(function(global) {
    'use strict';
    const STORAGE_KEY = 'villa-hassan-covering-schedules-v2-8';
    const KINDS = ['shutter','curtain'];
    const defaults = () => ({enabled:false, openTime:'07:00', closeTime:'20:00'});
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) {}
    const validTime = t => typeof t === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t);
    const configs = Object.fromEntries(KINDS.map(kind => {
        const s = saved[kind] || {};
        return [kind, {
            enabled: s.enabled === true,
            openTime:validTime(s.openTime) ? s.openTime : '07:00',
            closeTime:validTime(s.closeTime) ? s.closeTime : '20:00'
        }];
    }));
    const appliedSlot = new Map();
    const subscribers = new Set();
    const clone = value => JSON.parse(JSON.stringify(value));
    let ready = false;
    let timer = null;
    const emit = kind => { for (const listener of subscribers) {
        try { listener(kind, clone(configs[kind])); } catch (e) { console.error('[CoveringSchedules]', e); }
    }};
    const persist = () => { try {localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));} catch (_) {} };
    const minute = t => Number(t.slice(0,2))*60 + Number(t.slice(3,5));
    function targetForClock(config, date = new Date()) {
        const now = date.getHours()*60 + date.getMinutes();
        const start = minute(config.openTime), end = minute(config.closeTime);
        const open = start < end ? (now>=start && now<end) : (now>=start || now<end);
        return open ? 100 : 0;
    }
    async function applyAll(kind, position) {
        if (!KINDS.includes(kind)) throw new Error('Unknown covering kind');
        const ids = global.VillaDevices.list({kind}).map(d => d.id);
        const settled = await Promise.allSettled(ids.map(id => global.VillaDevices.execute(id, 'setPosition', position)));
        const failed = settled.filter(result => result.status === 'rejected');
        if (failed.length) throw new Error(`${failed.length} ${kind} devices failed`);
        return ids.length;
    }
    async function check(kind, force = false, date = new Date()) {
        const config = configs[kind];
        if (!config || !config.enabled || !ready) return;
        const target = targetForClock(config, date);
        if (!force && appliedSlot.get(kind) === target) return;
        appliedSlot.set(kind,target);
        await applyAll(kind,target);
        emit(kind);
    }
    async function setSchedule(kind, input) {
        if (!KINDS.includes(kind)) throw new Error('Unknown covering kind');
        const next = {...configs[kind], ...input};
        if (!validTime(next.openTime) || !validTime(next.closeTime) || next.openTime === next.closeTime) {
            throw new Error('حدد وقتين مختلفين بصيغة HH:mm');
        }
        if (typeof next.enabled !== 'boolean') throw new Error('enabled must be boolean');
        configs[kind] = next;
        appliedSlot.delete(kind);
        persist();
        emit(kind);
        if (next.enabled) await check(kind,true);
        return get(kind);
    }
    async function mode(kind, modeName) {
        if (!KINDS.includes(kind)) throw new Error('Unknown covering kind');
        if (modeName === 'auto') return setSchedule(kind,{enabled:true});
        const position = modeName === 'day' || modeName === 'open' ? 100
            : modeName === 'night' || modeName === 'close' ? 0 : null;
        if (position === null) throw new Error('Unknown mode');
        if (configs[kind].enabled) {
            configs[kind].enabled = false;
            appliedSlot.delete(kind);
            persist();
        }
        emit(kind);
        return applyAll(kind,position);
    }
    function get(kind) { return clone(configs[kind]); }
    function subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); }
    function init() {
        if (ready) return;
        ready = true;
        for (const kind of KINDS) void check(kind,true).catch(console.error);
        timer = setInterval(() => {
            for (const kind of KINDS) void check(kind).catch(console.error);
        },15000);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) for (const kind of KINDS) void check(kind).catch(console.error);
        });
    }
    global.VillaCoveringSchedules = Object.freeze({get,init,mode,setSchedule,applyAll,check,subscribe,targetForClock});
})(window);
