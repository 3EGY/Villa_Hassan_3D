/**
 * Zero-dependency checks for the static multi-file Villa Hassan application.
 * Run with: node scripts/check-project.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
let checks = 0;
function checked(message, action) {
  action();
  console.log(`✔ ${message}`);
  checks++;
}
const index = read('index.html');
const editor = read('windows-review.html');
function localFiles(html, attribute) {
  const rx = new RegExp(`<${attribute}\\b[^>]*?(?:src|href)=["']\\.?\\/?([^"']+)["'][^>]*>`, 'gi');
  return [...html.matchAll(rx)].map(m => m[1]).filter(s => !s.includes('://') && !s.startsWith('data:')).map(s=>s.split(/[?#]/,1)[0]);
}
const scripts = localFiles(index, 'script');
const styles = [...index.matchAll(/<link\s+rel=["']stylesheet["']\s+href=["']\.\/([^"']+)["']/gi)].map(m => m[1].split(/[?#]/,1)[0]);
const scriptsInEditor = localFiles(editor, 'script');
const stylesInEditor = [...editor.matchAll(/<link\s+rel=["']stylesheet["']\s+href=["']\.\/([^"']+)["']/gi)].map(m => m[1].split(/[?#]/,1)[0]);

checked('all referenced local JS, CSS and SVG/PNG files exist', () => {
  for (const f of [...scripts, ...styles, ...scriptsInEditor, ...stylesInEditor,'assets/reference-plan.png']) {
    assert(fs.existsSync(path.join(root, f)), `Missing ${f}`);
  }
});
checked('JavaScript files parse independently', () => {
  for (const f of new Set([...scripts, ...scriptsInEditor])) {
    new vm.Script(read(f), {filename: f});
  }
});
checked('main page and review page use the shared window editor', () => {
  assert(scripts.includes('js/windows/editor.js'));
  assert(scriptsInEditor.includes('js/windows/editor.js'));
  assert(scripts.includes('js/windows/viewer-bridge.js'));
  assert(!scriptsInEditor.includes('js/windows/viewer-bridge.js'));
  assert(scripts.indexOf('js/data/window-config.js') < scripts.indexOf('js/model/plan.js'));
  assert(scripts.indexOf('js/data/window-config.js') < scripts.indexOf('js/windows/editor.js'));
  assert(scriptsInEditor.indexOf('js/data/window-config.js') < scriptsInEditor.indexOf('js/windows/editor.js'));
});
checked('unified device registry and lighting adapter load in correct order', () => {
  const pos = file => scripts.indexOf(file);
  assert(pos('js/core/state.js') < pos('js/devices/registry.js'));
  assert(pos('js/devices/registry.js') < pos('js/devices/lighting/fixtures.js'));
  assert(pos('js/devices/lighting/fixtures.js') < pos('js/devices/lighting/adapter.js'));
  assert(pos('js/devices/lighting/adapter.js') < pos('js/core/bootstrap.js'));
  assert(read('js/devices/lighting/fixtures.js').includes('VillaLightingAdapter.registerLights()'));
  assert(read('js/devices/lighting/fixtures.js').includes('VillaLightingAdapter.publish(lightObj)'));
});
checked('curtain, shutter and Arabic voice modules load in dependency order', () => {
  const at=file=>scripts.indexOf(file);
  const seq=['js/data/coverings-config.js','js/devices/registry.js',
    'js/devices/coverings/adapter.js','js/devices/coverings/automation.js',
    'js/devices/coverings/visuals.js','js/devices/coverings/controls.js',
    'js/voice/voice-control.js','js/core/bootstrap.js'];
  for(const file of seq) assert(at(file)>-1,`Missing script: ${file}`);
  for(let i=1;i<seq.length;i++)assert(at(seq[i-1])<at(seq[i]),`Wrong order: ${seq[i]}`);
  for(const id of ['covering-button-shutter','covering-button-curtain','covering-markers-layer',
    'covering-modes-panel','covering-radial','voice-button','voice-panel','voice-form']) {
    assert(index.includes(`id="${id}"`),`Missing UI: ${id}`);
  }
  for(const file of ['styles/coverings.css','styles/voice.css'])assert(styles.includes(file));
});
checked('voice-first modules are separate from parser and loaded in order', () => {
  const order=['js/voice/voice-control.js','js/voice/voice-meter.js','js/voice/voice-ui.js','js/core/bootstrap.js'];
  for(let i=0;i<order.length;i++)assert(scripts.includes(order[i]),`Missing ${order[i]}`);
  for(let i=1;i<order.length;i++)assert(scripts.indexOf(order[i-1])<scripts.indexOf(order[i]));
  assert(read('js/scene/init.js').includes('VillaVoiceUI.init()'));
  assert(!read('js/voice/voice-control.js').includes('SpeechRecognition'));
  for(const id of ['voice-live','voice-live-center','voice-live-transcript','voice-orb','voice-live-feedback','voice-retry','voice-manual-mode','voice-tts-enabled']) {
    assert(index.includes(`id="${id}"`),`Missing voice-first element ${id}`);
  }
  assert(styles.includes('styles/transparency.css'));
  assert(read('styles/transparency.css').includes('#covering-modes-panel'));
});
checked('covering markers follow room selection just like lighting pins', () => {
  const js=read('js/devices/coverings/visuals.js');
  assert(js.includes("focusedZoneKey!=='overview'"));
  assert(js.includes('focusedZoneKey===item.spec.zoneId'));
  assert(js.includes('showCoveringPins'));
  assert(index.includes('id="covering-pins-toggle"'));
});
checked('all 3D viewer scripts load after local Three.js', () => {
  const threeIndex = scripts.indexOf('vendor/three.js');
  const orbitIndex = scripts.indexOf('vendor/OrbitControls.js');
  const initIndex = scripts.indexOf('js/scene/init.js');
  const bootIndex = scripts.indexOf('js/core/bootstrap.js');
  assert(threeIndex >= 0 && orbitIndex > threeIndex && initIndex > orbitIndex && bootIndex > initIndex);
});
checked('HTML pages no longer embed large inline scripts, CSS or base64 plans', () => {
  for (const html of [index,editor]) {
    assert(!/<script(?:\s[^>]*)?>(?!\s*<\/script>)[\s\S]*?<\/script>/i.test(html));
    assert(!/<style\b/i.test(html));
    assert(!html.includes('data:image/png;base64,'));
    assert(html.includes('href="./assets/reference-plan.png"'));
  }
  assert(read('js/model/architecture.js').includes("new THREE.TextureLoader().load('./assets/reference-plan.png')"));
  assert(!read('js/model/architecture.js').includes('data:image/png;base64,'));
  // Keep the image as a single asset rather than embedding another duplicate.
});
checked('every inline UI function has a matching function declaration', () => {
  const combined = scripts.filter(f => f.startsWith('js/')).map(read).join('\n');
  for (const m of index.matchAll(/\son(?:click|change|input|pointerdown|pointerenter|pointerleave)="([^"]+)"/g)) {
    const expr=m[1].replaceAll(/\b(?:document|window|this|console)\.[a-zA-Z_$][\w$]*\([^)]*\)/g,'');
    for(const call of expr.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
      assert(new RegExp(`\\bfunction\\s+${call[1]}\\s*\\(`).test(combined), `UI handler ${call[1]} is not defined`);
    }
  }
});
checked('approved windows match the exported architectural schedule', () => {
  const ctx=vm.createContext({});
  vm.runInContext(read('js/data/window-config.js'),ctx);
  const config=vm.runInContext('VILLA_WINDOW_CONFIG',ctx);
  const schedule=JSON.parse(read('docs/WINDOW_SCHEDULE.json'));
  assert.equal(config.reference,schedule.reference);
  assert.equal(config.revision,schedule.revision);
  assert.equal(config.specs.length,schedule.windows.length);
  for(const spec of config.specs) {
    const d=schedule.windows.find(w=>w.id===spec.id);
    assert(d, `Missing schedule row ${spec.id}`);
    assert.equal(spec.width,d.widthCm,`${spec.id} width`);
    assert.equal(spec.px,d.plan.x,`${spec.id} x`);
    assert.equal(spec.py,d.plan.y,`${spec.id} y`);
    assert.equal(config.approved[spec.id].sillCm,d.sillCm,`${spec.id} sill`);
    assert.equal(config.approved[spec.id].heightCm,d.heightCm,`${spec.id} height`);
  }
});
console.log(`\n${checks} checks passed. UI/WebGL must still be tested in a browser.`);
