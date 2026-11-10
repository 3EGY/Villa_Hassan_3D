/**
 * No third-party dependencies: node scripts/test-devices.mjs
 * Verifies catalog semantics, adapter isolation and the existing lighting bridge.
 * WebGL rendering / physical controls require a real-browser check separately.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const zoneNames = [
    'leftBedroom', 'rightBedroom', 'terraceLounge', 'guestBathroom', 'washbasins',
    'courtyard', 'masterBedroom', 'livingRoom', 'lobbyPlanter', 'dressing',
    'bathroom', 'terrace', 'stairs'
];
const zones = Object.fromEntries(zoneNames.map(x => [x, {}]));
zones.overview = {};
const window = {};
const context = vm.createContext({ window, ZONE_SPECS: zones, console });
vm.runInContext(read('js/devices/registry.js'), context);
const devices = window.VillaDevices;
let count = 0;
async function check(label, fn) {
    await fn();
    console.log(`✔ ${label}`);
    count++;
}
const sample = overrides => ({
    id: 'bulb_living', kind: 'light', zoneId: 'livingRoom', name: 'ضوء الصالة',
    capabilities: ['turnOn', 'turnOff', 'toggle', 'setBrightness', 'setColor', 'setTimer'],
    initialState: { on: true, brightness: 90, color: '#ffb454', timerMinutes: 0 },
    ...overrides
});
await check('reject missing zones, duplicate IDs, unsupported state/action schemas', async () => {
    assert.throws(() => devices.register(sample({zoneId:'overview'})), /Unknown zoneId/);
    assert.throws(() => devices.register(sample({zoneId:'nonexistent'})), /Unknown zoneId/);
    assert.throws(() => devices.register(sample({capabilities:['toggle','toggle']})), /Invalid capabilities/);
    devices.register(sample());
    assert.throws(() => devices.register(sample()), /already registered/);
    await assert.rejects(devices.execute('bulb_living', 'setPosition', 50), /Unsupported action/);
    await assert.rejects(devices.execute('missing', 'turnOn'), /Unknown device/);
});

await check('immutable snapshots, kind/room filtering, subscriptions and updates', async () => {
    const events = [];
    const stop = devices.subscribe(event => events.push(event));
    devices.register({
        id: 'curtain_test', kind: 'curtain', zoneId: 'masterBedroom', name: 'اختبار ستارة',
        capabilities: ['setPosition'], initialState: {position: 0}
    });
    const snap = devices.get('curtain_test');
    snap.state.position = 95;
    snap.capabilities.push('turnOn');
    assert.equal(devices.get('curtain_test').state.position, 0);
    assert.equal(devices.get('curtain_test').capabilities.length, 1);
    devices.updateState('curtain_test', {position: 50});
    assert.equal(devices.list({kind:'curtain',zoneId:'masterBedroom'}).length, 1);
    assert.equal(devices.list({kind:'light',zoneId:'masterBedroom'}).length, 0);
    const observed = events.length;
    devices.updateState('curtain_test', {position: 50});
    assert.equal(events.length, observed, 'no redundant updates for unchanged state');
    stop();
    devices.updateState('curtain_test', {position: 60});
    assert.equal(events.length, observed);
});

await check('adapter command awaits acknowledgement and does not mutate state ahead of it', async () => {
    let resolveCommand;
    devices.registerAdapter('curtain', {
        execute(device, action, value, ctx) {
            assert.equal(device.id, 'curtain_test');
            assert.equal(action, 'setPosition');
            return new Promise(resolve => {
                resolveCommand = () => { ctx.reportState({position: value}); resolve(); };
            });
        }
    });
    const promise = devices.execute('curtain_test', 'setPosition', 80);
    assert.equal(devices.get('curtain_test').state.position, 60);
    resolveCommand();
    const result = await promise;
    assert.equal(result.state.position, 80);
});

// Exercise the real light bridge with a tiny fake Three.js light; no rendering involved.
const sampleLight = {
    id: 'bulb_living', zone: 'livingRoom', name: 'ضوء الصالة',
    isOn: true, brightness: 90, colorHex: '#ffb454', colorRatio: 0.16, timerMinutes: 0
};
context.smartLights = [sampleLight];
context.COLOR_SPECTRUM_STOPS = [
    {t:0,hex:'#ff8c1a'}, {t:0.16,hex:'#ffb454'},
    {t:0.5,hex:'#38bdf8'}, {t:1,hex:'#10b981'}
];
context.activeSmartLight = null;
context.markLightingCustom = () => {};
context.applySmartLightState = light => window.VillaLightingAdapter.publish(light);
context.syncRadialMenuDisplay = () => {};
context.startBulbTimer = (light, minutes) => {
    light.timerMinutes = minutes;
    if (minutes > 0) light.isOn = true;
};
vm.runInContext(read('js/devices/lighting/adapter.js'), context);
await check('14 existing unique light IDs and valid zones in source specs', async () => {
    const fixtureCode = read('js/floors/first/lights.js');
    const specs = fixtureCode.match(/const FIRST_FLOOR_LIGHT_SPECS\s*=\s*(\[[\s\S]*?\n\s*\]);/);
    assert(specs, 'Light fixture source is missing its metadata array');
    const metadata = vm.runInNewContext(specs[1]);
    assert.equal(metadata.length, 14);
    assert.equal(new Set(metadata.map(l => l.id)).size, 14);
    for (const light of metadata) assert(zoneNames.includes(light.zone), `Unknown zone: ${light.zone}`);
});
await check('existing 3D light state appears in the registry', async () => {
    window.VillaLightingAdapter.registerLights();
    const item = devices.get('bulb_living');
    assert.equal(item.kind,'light');
    assert.equal(item.floorId,'floor1');
    assert.equal(item.state.brightness,90);
    assert.equal(devices.list({floorId:'floor1'}).length,2); // test curtain + existing light
});
await check('commands update existing 3D lights and snapshot, and reject invalid values', async () => {
    await devices.execute('bulb_living', 'turnOff');
    assert.equal(sampleLight.isOn, false);
    assert.equal(devices.get('bulb_living').state.on, false);
    await devices.execute('bulb_living', 'setBrightness', 35);
    assert.equal(sampleLight.brightness,35);
    assert.equal(devices.get('bulb_living').state.on,true);
    await devices.execute('bulb_living', 'setColor', '#38BDF8');
    assert.equal(sampleLight.colorHex,'#38bdf8');
    assert.equal(devices.get('bulb_living').state.color,'#38bdf8');
    await devices.execute('bulb_living', 'setTimer', 5);
    assert.equal(devices.get('bulb_living').state.timerMinutes,5);
    await assert.rejects(devices.execute('bulb_living','setBrightness',150),/Brightness/);
    await assert.rejects(devices.execute('bulb_living','setColor','unsafe'),/Color/);
    await assert.rejects(devices.execute('bulb_living','setTimer',-1),/Timer/);
});
await check('legacy UI or a lighting preset automatically publishes changes', async () => {
    sampleLight.brightness = 10;
    sampleLight.isOn = true;
    context.applySmartLightState(sampleLight);
    assert.equal(devices.get('bulb_living').state.brightness,10);
    sampleLight.isOn = false;
    context.applySmartLightState(sampleLight);
    assert.equal(devices.get('bulb_living').state.on,false);
});

console.log(`\n${count} device architecture checks passed.`);
