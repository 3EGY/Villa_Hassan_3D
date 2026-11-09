/** Validate the REAL Three.js model orientation without a WebGL renderer. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const script=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx=vm.createContext({console,Math,Map,Set,Array,Object,Number,Boolean,
    document:{getElementById:id=>id==='client-welcome'?{hidden:true}:null},
    innerWidth:1280,innerHeight:800,
});
ctx.window=ctx;
for(const file of ['vendor/three.js','js/data/window-config.js','js/data/coverings-config.js']) vm.runInContext(script(file),ctx);
ctx.PLAN_WINDOWS=vm.runInContext('VILLA_WINDOW_CONFIG.specs',ctx);
ctx.windowSize=spec=>({sill:vm.runInContext('VILLA_WINDOW_CONFIG.approved',ctx)[spec.id].sillCm/100,
    height:vm.runInContext('VILLA_WINDOW_CONFIG.approved',ctx)[spec.id].heightCm/100});
ctx.planX=p=>p/100;ctx.planZ=p=>p/100;
ctx.currentWallHeight=3.2;
ctx.scene=new ctx.THREE.Scene();
ctx.camera=new ctx.THREE.PerspectiveCamera(45,16/9,.1,100);
ctx.camera.position.set(2,14,8);ctx.camera.lookAt(2,0,5);
ctx.cameraAnim=null;ctx.focusedZoneKey='overview';
ctx.VillaDevices={get:()=>({state:{position:0}}),subscribe(){}};
vm.runInContext(script('js/devices/coverings/visuals.js'),ctx,{filename:'visuals.js'});
ctx.VillaCoveringVisuals.rebuild();
ctx.scene.updateMatrixWorld(true);
const group=ctx.scene.getObjectByName('Villa_Coverings_3D');
assert.equal(group.children.length,11,'five shutters + six curtains');
const node=name=>{const g=group.getObjectByName(name);assert(g,`Missing ${name}`);return g;};
const worldX=(name,localZ)=>node(name).localToWorld(new ctx.THREE.Vector3(0,0,localZ)).x;
const leftX=58/100;
assert(worldX('curtain_left',.21)>leftX,'W3 curtain must be INSIDE the room (+x)');
assert(worldX('shutter_left',-.24)<leftX,'W3 shutter must be OUTSIDE the room (-x)');
console.log('✔ W3 left-bedroom curtain inside, shutter outside (actual world space)');
const livingX=488/100;
assert(worldX('curtain_living',.21)<livingX,'W4 curtain must face living room (-x)');
assert(worldX('shutter_living',-.24)>livingX,'W4 shutter must be opposite face');
console.log('✔ W4 living-room curtain added on interior face, shutter on opposite face');
for(const n of group.children){
    assert(n.children.length>=2,`No covering submeshes for ${n.name}`);
    assert(Number.isFinite(n.rotation.y),`Bad facing ${n.name}`);
}
console.log('✔ all 11 coverings build actual Three.js meshes without a renderer');
