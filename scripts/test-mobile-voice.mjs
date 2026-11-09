/**
 * Deterministic Web Speech lifecycle tests. NO real audio or browser assumed.
 * Run: node scripts/test-mobile-voice.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'js/voice/voice-ui.js'),'utf8');
let passed=0;
async function test(name,fn){await fn(); console.log('✔ '+name);passed++;}

function environment(ua,{legacySettings=null}={}) {
    const listeners=new Map(), elems=new Map(), executed=[], spoken=[], sessions=[], meter=[];
    let now=0,nextTimer=0;
    const tasks=new Map(), storage=new Map();
    if(legacySettings)storage.set('villa-hassan-voice-settings-v2-9',JSON.stringify(legacySettings));
    function clock(ms) {
        const target=now+ms;
        for(;;) {
            const due=[...tasks].filter(([,x])=>x.when<=target).sort((a,b)=>a[1].when-b[1].when)[0];
            if(!due)break;
            tasks.delete(due[0]);now=due[1].when;due[1].fn();
        }
        now=target;
    }
    function element(id){
        if(!elems.has(id)){
            const handlers={};const classes=new Set();
            elems.set(id,{
                id,hidden:['voice-live','voice-panel','voice-backdrop','voice-retry'].includes(id),
                textContent:'',value:'',checked:false,dataset:{},
                style:{setProperty(){}},
                classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)},
                setAttribute(k,v){this[k]=v;},focus(){},addEventListener(k,fn){handlers[k]=fn;},
                fire(k,args={}) {handlers[k]?.({...args,preventDefault(){}});}
            });
        }
        return elems.get(id);
    }
    class Recognition {
        constructor(){this.stops=0;this.aborts=0;sessions.push(this);}
        start(){this.started=true;this.onstart?.();}
        stop(){this.stops++;this.onend?.();}
        abort(){this.aborts++;}
        result(text,final=true) {
            const r=[{transcript:text}];r.isFinal=final;
            this.onresult?.({results:[r]});
        }
        error(type){this.onerror?.({error:type});}
        end(){this.onend?.();}
        speechEnd(){this.onspeechend?.();}
    }
    const ctx=vm.createContext({console,Promise,Math,Number,JSON,Date,Object,Array,Map,
        navigator:{userAgent:ua,platform:ua.includes('iPhone')?'iPhone':'Linux',maxTouchPoints:ua.includes('iPhone')?5:1},
        localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,val)=>storage.set(key,val)},
        SpeechRecognition:Recognition,webkitSpeechRecognition:Recognition,
        SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},
        speechSynthesis:{speaking:false,pending:false,getVoices:()=>[],cancel(){},speak(u){spoken.push(u.text);}},
        setTimeout(fn,ms){const id=++nextTimer;tasks.set(id,{when:now+ms,fn});return id;},
        clearTimeout(id){tasks.delete(id);},
        document:{hidden:false,body:{classList:{add(){},remove(){}}},getElementById:element,
            addEventListener(k,fn){listeners.set(k,fn);}},
        closeRadialLightMenu(){},closeLightingModes(){},closeAllPopovers(){},
        VillaCoveringControls:{closePanel(){}},
        VillaVoiceControl:{async executeCommand(t){executed.push(t);return 'تم التنفيذ';}},
        VillaVoiceMeter:{stop(){meter.push('stop');},async start(){meter.push('start');},activity(v){meter.push(v?'talk':'quiet');}},
    });
    ctx.window=ctx;
    vm.runInContext(source,ctx,{filename:'voice-ui.js'});
    ctx.VillaVoiceUI.init();
    return {ctx,element,sessions,executed,spoken,clock,storage,meter,listeners};
}
const desktop='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156';
const android='Mozilla/5.0 (Linux; Android 16; Pixel 8) AppleWebKit/537.36 Chrome/156 Mobile Safari/537.36';
const ios='Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 Version/26.6 Mobile Safari/604.1';
const flush=async()=>{await Promise.resolve();await Promise.resolve();};

await test('desktop: confirmed transcript executes, UI can start another command without reload',async()=>{
    const h=environment(desktop);
    h.element('voice-button').fire('click');
    h.sessions.at(-1).result('افتح شتر غرفة النوم');
    h.clock(171);await flush();
    assert.deepEqual(h.executed,['افتح شتر غرفة النوم']);
    assert.equal(h.ctx.VillaVoiceUI.state().phase,'done');
    // New tap while the success overlay is STILL visible must start, not close.
    h.element('voice-button').fire('click');
    assert.equal(h.sessions.length,2);
    h.sessions.at(-1).result('اقفل ستارة الغرفة اليسرى');
    h.clock(171);await flush();
    assert.deepEqual(h.executed,['افتح شتر غرفة النوم','اقفل ستارة الغرفة اليسرى']);
});
await test('Android: two commands, no secondary microphone meter opened',async()=>{
    const h=environment(android);
    h.element('voice-button').fire('click');
    h.sessions.at(-1).result('خلي شدة الاضاءة اربعين',true);
    h.clock(180);await flush();
    h.element('voice-button').fire('click');
    h.sessions.at(-1).result('اقفل الشتر',true);
    h.clock(180);await flush();
    assert.equal(h.executed.length,2);
    assert(!h.meter.includes('start'));
    assert.equal(h.ctx.VillaVoiceUI.state().phase,'done');
});
await test('Android: silence after interim text requests stop and executes',async()=>{
    const h=environment(android);
    h.element('voice-button').fire('click');
    h.sessions.at(-1).result('افتح ستائر الصالة',false);
    h.clock(951);await flush();
    assert.equal(h.sessions[0].stops,1);
    assert.deepEqual(h.executed,['افتح ستائر الصالة']);
});
await test('iOS: old TTS=true default is NOT migrated; multiple new recognizers work',async()=>{
    const h=environment(ios,{legacySettings:{tts:true,manual:false}});
    assert.equal(h.ctx.VillaVoiceUI.settings().tts,false);
    for(const command of ['اقفل إضاءة غرفة النوم','افتح ستارة الصالة','افتح الشتر']){
        h.element('voice-button').fire('click');
        h.sessions.at(-1).result(command);
        h.clock(180);await flush();
    }
    assert.equal(h.sessions.length,3);
    assert.deepEqual(h.executed,['اقفل إضاءة غرفة النوم','افتح ستارة الصالة','افتح الشتر']);
    assert.equal(h.spoken.length,0);
    assert(!h.meter.includes('start'));
});
await test('iOS: silent hung session times out and a fresh button tap retries',async()=>{
    const h=environment(ios);
    h.element('voice-button').fire('click');
    h.clock(8510);await flush();
    assert.equal(h.ctx.VillaVoiceUI.state().phase,'error');
    assert.equal(h.ctx.VillaVoiceUI.state().failedAttempts,1);
    h.element('voice-button').fire('click');
    assert.equal(h.sessions.length,2);
    h.sessions.at(-1).result('اقفل الستائر');h.clock(180);await flush();
    assert.equal(h.ctx.VillaVoiceUI.state().failedAttempts,0);
    assert.deepEqual(h.executed,['اقفل الستائر']);
});
await test('three unclear attempts display the existing manual fallback',async()=>{
    const h=environment(android);
    h.element('voice-button').fire('click');
    h.sessions.at(-1).error('no-speech');
    for(let i=0;i<2;i++){
        h.element('voice-retry').fire('click');h.sessions.at(-1).error('no-speech');
    }
    assert.equal(h.element('voice-panel').hidden,false);
    assert.equal(h.element('voice-live').hidden,true);
    assert.equal(h.ctx.VillaVoiceUI.state().manual,true);
});
await test('denied microphone immediately opens typed fallback, not 3 retries',async()=>{
    const h=environment(ios);
    h.element('voice-button').fire('click');
    h.sessions.at(-1).error('not-allowed');
    assert.equal(h.ctx.VillaVoiceUI.state().manual,true);
    assert.equal(h.ctx.VillaVoiceUI.state().failedAttempts,0);
});
await test('invisible page terminates mic attempt and ignores stale results',async()=>{
    const h=environment(android);
    h.element('voice-button').fire('click');
    const old=h.sessions.at(-1);
    h.ctx.document.hidden=true;
    h.listeners.get('visibilitychange')();
    old.result('اغلق إضاءة غرفة النوم');
    h.clock(14500);await flush();
    assert.equal(h.executed.length,0);
    assert.equal(h.ctx.VillaVoiceUI.state().live,false);
});
await test('mobile meter never starts a second getUserMedia capture',async()=>{
    for(const ua of [android,ios]) {
        const meterSource=fs.readFileSync(path.join(root,'js/voice/voice-meter.js'),'utf8');
        let captures=0;
        const ctx=vm.createContext({navigator:{userAgent:ua,platform:ua.includes('iPhone')?'iPhone':'Linux',maxTouchPoints:1,
            mediaDevices:{async getUserMedia(){captures++;return {getTracks:()=>[]};}}},
            document:{getElementById:()=>({dataset:{},style:{setProperty(){}}})},requestAnimationFrame(){},cancelAnimationFrame(){}});
        ctx.window=ctx;
        vm.runInContext(meterSource,ctx);
        assert.equal(await ctx.VillaVoiceMeter.start(),false);
        assert.equal(captures,0);
    }
});
console.log(`\n${passed} mobile voice lifecycle tests passed.`);
