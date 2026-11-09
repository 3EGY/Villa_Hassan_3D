/** CLI regression tests for new devices, schedules and Arabic voice commands. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const store=new Map();
const ctx=vm.createContext({console,Date,Promise,Math,Number,Map,Set,JSON,Object,Array,
    setInterval:()=>1,clearInterval:()=>{},
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
    document:{addEventListener(){}},
});
ctx.window=ctx;
for(const f of ['js/data/window-config.js','js/data/coverings-config.js',
    'js/devices/registry.js','js/devices/coverings/adapter.js',
    'js/devices/coverings/automation.js','js/voice/voice-control.js']) {
    vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
}
let passes=0;
function test(name,cb) {return Promise.resolve().then(cb).then(()=>{passes++;console.log('✔ '+name);});}
const registry=ctx.VillaDevices, schedules=ctx.VillaCoveringSchedules;
const specs=vm.runInContext('VILLA_COVERING_CONFIG',ctx);
await test('five shutters exclude bathroom, six curtains map to five location groups',()=>{
    assert.equal(specs.filter(s=>s.kind==='shutter').length,5);
    assert.equal(specs.filter(s=>s.kind==='curtain').length,6);
    assert.equal(new Set(specs.filter(s=>s.kind==='curtain').map(s=>s.groupId)).size,5);
    assert(!specs.some(s=>s.windowId==='W5'));
    assert.deepEqual([...specs.filter(s=>s.kind==='shutter').map(s=>s.windowId)].sort(),['W1-W2','W3','W4','W6','W7'].sort());
    assert.equal(specs.find(s=>s.id==='curtain_terrace').openingId,'terraceEntry');
    assert.equal(specs.find(s=>s.id==='curtain_living').windowId,'W4');
    assert.equal(specs.find(s=>s.id==='curtain_living').zoneId,'livingRoom');
});
await test('coverings register with valid zones and unique IDs',()=>{
    ctx.VillaCoverings.registerCoverings();
    assert.equal(registry.list({kind:'shutter'}).length,5);
    assert.equal(registry.list({kind:'curtain'}).length,6);
    assert.equal(new Set(registry.list().map(d=>d.id)).size,11);
    assert(registry.list().every(d=>d.floorId==='floor1' && d.state.position===100));
});
await test('individual positions validate 0–100 and persist to storage',async()=>{
    await registry.execute('shutter_master','setPosition',37.5);
    assert.equal(registry.get('shutter_master').state.position,38);
    await registry.execute('shutter_master','close');
    assert.equal(registry.get('shutter_master').state.position,0);
    await registry.execute('shutter_master','open');
    assert.equal(registry.get('shutter_master').state.position,100);
    await assert.rejects(registry.execute('shutter_master','setPosition',101),/0 and 100/);
    await assert.rejects(registry.execute('shutter_master','setPosition','23'),/0 and 100/);
    assert.equal(JSON.parse(store.get('villa-hassan-coverings-v2-8')).shutter_master,100);
});
await test('independent bulk shutter and curtain operations',async()=>{
    await schedules.applyAll('shutter',0);
    assert(registry.list({kind:'shutter'}).every(d=>d.state.position===0));
    assert(registry.list({kind:'curtain'}).every(d=>d.state.position===100));
    await schedules.applyAll('curtain',55);
    assert(registry.list({kind:'curtain'}).every(d=>d.state.position===55));
});
await test('daily schedule supports before/after and overnight hours',()=>{
    const at=(h,m)=>new Date(2026,10,9,h,m);
    const config={enabled:true,openTime:'07:00',closeTime:'20:00'};
    assert.equal(schedules.targetForClock(config,at(6,59)),0);
    assert.equal(schedules.targetForClock(config,at(7,0)),100);
    assert.equal(schedules.targetForClock(config,at(19,59)),100);
    assert.equal(schedules.targetForClock(config,at(20,0)),0);
    const overnight={enabled:true,openTime:'21:00',closeTime:'06:00'};
    assert.equal(schedules.targetForClock(overnight,at(0,0)),100);
    assert.equal(schedules.targetForClock(overnight,at(19,0)),0);
    assert.equal(schedules.targetForClock(overnight,at(21,0)),100);
});
await test('auto settings are local and manual day mode disables auto',async()=>{
    await assert.rejects(schedules.setSchedule('shutter',{enabled:true,openTime:'08:00',closeTime:'08:00'}),/مختلفين/);
    await schedules.setSchedule('shutter',{enabled:true,openTime:'07:15',closeTime:'20:30'});
    assert.equal(schedules.get('shutter').enabled,true);
    assert.equal(schedules.get('curtain').enabled,false);
    schedules.init();
    await schedules.mode('shutter','day');
    assert.equal(schedules.get('shutter').enabled,false);
    assert(registry.list({kind:'shutter'}).every(d=>d.state.position===100));
});
await test('Arabic parser normalizes dialect, digits and bedroom names',()=>{
    const parse=ctx.VillaVoiceControl.parseCommand;
    const p1=parse('اغلق إضاءة غرفة النوم');
    assert.equal(p1.kind,'light');assert.equal(p1.zoneId,'masterBedroom');assert.equal(p1.action,'turnOff');
    const p2=parse('خلي شدة الإضاءة في غرفة النوم ٤٠٪');
    assert.equal(p2.action,'setBrightness');assert.equal(p2.value,40);
    const p3=parse('افتح الشطر في الغرفة اليمنى');
    assert.equal(p3.kind,'shutter');assert.equal(p3.zoneId,'rightBedroom');assert.equal(p3.action,'open');
    const p4=parse('خلي مستوى الستاير ٦٥%');
    assert.equal(p4.kind,'curtain');assert.equal(p4.action,'setPosition');assert.equal(p4.value,65);
    assert.equal(parse('خلي شدة النور 101%').error,'المستوى لازم يكون من 0 إلى 100%');
    assert.equal(parse('خلي شدة اضاءة غرفة النوم اربعين في الميه').value,40);
    assert.equal(parse('خلي مستوي الستائر خمسه و تلاتين في الميه').value,35);
});
await test('spoken commands actually dispatch to the registry adapters',async()=>{
    for(const id of ['testLightOne','testLightTwo']) {
        registry.register({id,kind:'light',name:'اختبار',zoneId:'masterBedroom',
            capabilities:['setBrightness','turnOn','turnOff'],initialState:{brightness:90,on:true}});
    }
    registry.registerAdapter('light',{async execute(device,action,value,context){
        if(action==='setBrightness')context.reportState({brightness:value,on:value>0});
        if(action==='turnOff')context.reportState({on:false});
        if(action==='turnOn')context.reportState({on:true});
    }});
    await ctx.VillaVoiceControl.executeCommand('خلي شدة اضاءة غرفة النوم 40%');
    assert(registry.list({kind:'light'}).every(d=>d.state.brightness===40));
    await ctx.VillaVoiceControl.executeCommand('اقفل ستاير الغرفة اليمنى');
    assert.equal(registry.get('curtain_right_left').state.position,0);
    assert.equal(registry.get('curtain_right_right').state.position,0);
    assert.equal(registry.get('curtain_left').state.position,55);
    await ctx.VillaVoiceControl.executeCommand('اقفل ستارة الصالة');
    assert.equal(registry.get('curtain_living').state.position,0);
});
console.log(`\n${passes} covering/voice checks passed.`);
