/** Static traceability and module checks for the revised original ground model. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('ground.html');
const old=read('docs/ground-source-original.html');
const files=[...html.matchAll(/<script\s+src="\.\/([^"]+)"/g)].map(m=>m[1]);
for(const f of files){assert(fs.existsSync(path.join(root,f)),f); if(f.startsWith('js/'))new vm.Script(read(f),{filename:f});}
for(const m of html.matchAll(/<link\s+rel="stylesheet"\s+href="\.\/([^"]+)"/g))assert(fs.existsSync(path.join(root,m[1])),m[1]);
assert(old.includes('function buildGrandMajlisAndReception()'));
const architecture=read('js/floors/ground/source/07-architecture.js');
assert.equal((architecture.match(/addWindowOrDoor\([-0-9.]+,\s*[-0-9.]+,\s*[-0-9.]+,\s*[-0-9.]+,\s*'(?:door|window|slidingGlass)'\)/g)||[]).length,13);
const lighting=read('js/floors/ground/source/05-lighting.js');
assert.equal((lighting.match(/\{ id: 'bulb_[^']+'/g)||[]).length,8);
for(const name of ['08-furniture-majlis','09-furniture-guest','10-furniture-dining','11-furniture-kitchen','12-furniture-living','13-furniture-stairs']){
    const js=read('js/floors/ground/source/'+name+'.js');
    assert(js.length>1500 && old.includes(js.trim()), `Original 3D furnishings changed: ${name}`);
}
const editor=read('js/floors/ground/review/editor.js');
for(const prop of ['rebuildReviewWalls','drawOpening','syncLight','download','importFile','placeNewFromRay'])assert(editor.includes(prop));
assert(html.includes('id="gr-elevation"'));
assert(html.includes('id="gr-sill"'));
assert(html.includes('id="gr-shutter"'));
assert(html.includes('id="gr-curtain"'));
console.log('✔ original source preserved, 13 doors/windows, 8 lights, all six furniture sections byte-aligned');
console.log('✔ in-scene review components and file dependencies validate');
