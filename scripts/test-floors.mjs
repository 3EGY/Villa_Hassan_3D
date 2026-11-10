/** Villa Hassan v4.0: floor isolation and building API tests (node scripts/test-floors.mjs). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=f=>fs.readFileSync(path.join(root,f),'utf8');
const window={},ctx=vm.createContext({window,console,ZONE_SPECS:{overview:{title:'overview'},livingRoom:{title:'livingRoom'}},
  ROOM_VIEW_BOUNDS:{livingRoom:[0,0,2,2]},VILLA_VIEW_BOUNDS:[-8,-9,8,9],
  structureGroup:{},smartLights:[]});
let checks=0;
function check(msg,fn){fn();console.log('✔ '+msg);checks++;}
vm.runInContext(source('js/floors/ground/data.js'),ctx);
check('source mapping and floor geometry are explicit and independently stored',()=>{
 const data=window.VillaGroundFloorData;
 assert.equal(data.rooms.length,10);
 assert.equal(data.devices.length,0);
 assert.equal(data.openings.length,0);
 assert.equal(data.perimeter.length,11);
 assert.equal(data.sourceRect[0],38);
 assert(fs.existsSync(path.join(root,'assets/floors/ground/plan-trace.png')));
 assert(fs.existsSync(path.join(root,'docs/ground-floor-source.pdf')));
 for(const room of data.rooms){assert(room.id.startsWith('ground'));assert(room.area[2]>room.area[0]);assert(room.area[3]>room.area[1]);}
});
vm.runInContext(source('js/core/floor-manager.js'),ctx);
// This miniature first-floor module skips the real room catalog; firstFloor lights/coverings
// use the full real catalog in the browser integration test.
window.VillaFloors.register({id:'floor1',label:'الأول',rooms:{livingRoom:{title:'صالة'}},overviewBounds:[-8,-9,8,9],status:'active'});
vm.runInContext(source('js/floors/ground/module.js'),ctx);
vm.runInContext(source('js/floors/planned.js'),ctx);
check('floor registry contains two switchable floors and three planned stages',()=>{
 const floors=window.VillaFloors.list();assert.equal(floors.length,5);
 assert.equal(floors.filter(f=>f.status==='planned').length,3);
 assert(window.VillaFloors.hasRoom('ground','groundDining'));
 assert(!window.VillaFloors.hasRoom('floor1','groundDining'));
 assert(!window.VillaFloors.hasRoom('ground','livingRoom'));
});
vm.runInContext(source('js/devices/registry.js'),ctx);
const D=window.VillaDevices;
D.register({id:'existing_light',floorId:'floor1',zoneId:'livingRoom',kind:'light',name:'Existing light',capabilities:['turnOff'],initialState:{on:true}});
D.register({id:'future_kitchen',floorId:'ground',zoneId:'groundKitchen',kind:'light',name:'Kitchen reference',capabilities:['turnOff'],initialState:{on:true}});
check('device id cannot accidentally reference a room on a different floor',()=>{
 assert.throws(()=>D.register({id:'mismatch',floorId:'floor1',zoneId:'groundKitchen',kind:'light',name:'Mismatch',capabilities:['turnOff']}),/Unknown zoneId/);
 assert.equal(D.list({floorId:'floor1'}).length,1);
 assert.equal(D.list({floorId:'ground'}).length,1);
});
vm.runInContext(source('js/core/home-system.js'),ctx);
D.registerAdapter('light',{execute(device,action,value,context){context.reportState({on:false});}});
await (async()=>{
 await window.VillaHome.executeGroup({floorId:'ground',kind:'light',action:'turnOff'});
 check('building-wide commands are scoped to selected floor by default',()=>{
   assert.equal(D.get('future_kitchen').state.on,false);
   assert.equal(D.get('existing_light').state.on,true);
 });
 await window.VillaHome.executeGroup({allFloors:true,kind:'light',action:'turnOff'});
 check('explicit all-floors command crosses floor boundaries only when requested',()=>{
   assert.equal(D.get('existing_light').state.on,false);
 });
})();
check('future systems registered without fabricating any devices',()=>{
 const snap=window.VillaHome.getBuildingSnapshot();
 assert(snap.registeredSystems.some(x=>x.id==='audio'));
 assert(snap.registeredSystems.some(x=>x.id==='security'));
 assert.equal(window.VillaHome.listRooms('ground').length,10);
});
console.log(`\n${checks} multi-floor checks passed.`);
