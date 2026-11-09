/**
 * Voice-first UI, optional Arabic speech synthesis, and progressive fallback.
 * Microphone is started ONLY by an explicit user click. No persistent listening.
 * SpeechRecognition may send audio to the browser vendor; no app-owned backend.
 */
(function(global) {
    'use strict';
    const $=id=>document.getElementById(id);
    const KEY='villa-hassan-voice-settings-v2-9';
    let initialized=false;
    let settings={manual:false,tts:true};
    let active=null, sequence=0, uiEpoch=0, failedAttempts=0, hideTimer=0;
    const recognitionClass=()=>global.SpeechRecognition||global.webkitSpeechRecognition;
    function readSettings() {
        try {
            const saved=JSON.parse(global.localStorage.getItem(KEY)||'{}');
            if(typeof saved.manual==='boolean')settings.manual=saved.manual;
            if(typeof saved.tts==='boolean')settings.tts=saved.tts;
        }catch {/* private mode / blocked storage */}
        $('voice-manual-mode').checked=settings.manual;
        $('voice-tts-enabled').checked=settings.tts;
    }
    function saveSettings() {
        settings.manual=$('voice-manual-mode').checked;
        settings.tts=$('voice-tts-enabled').checked;
        try {global.localStorage.setItem(KEY,JSON.stringify(settings));}catch {/* optional */}
    }
    function say(message) {
        if(!settings.tts||!global.speechSynthesis||!global.SpeechSynthesisUtterance)return;
        try {
            global.speechSynthesis.cancel();
            const utterance=new SpeechSynthesisUtterance(message);
            utterance.lang='ar-EG';utterance.rate=1.04;utterance.pitch=1;
            const ar=global.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('ar'));
            if(ar)utterance.voice=ar;
            global.speechSynthesis.speak(utterance);
        }catch {/* speech output unavailable; keep visual feedback */}
    }
    function clearHide() {global.clearTimeout(hideTimer);hideTimer=0;}
    function setPhase(phase) {
        $('voice-live').dataset.phase=phase;
        $('voice-orb').setAttribute('aria-label',phase==='listening'?'إيقاف الاستماع':'إعادة الاستماع');
    }
    function transcript(text) {$('voice-live-transcript').textContent=text;}
    function feedback(text) {$('voice-live-feedback').textContent=text;}
    function stopSession() {
        const previous=active;
        active=null;
        if(previous) {
            previous.finished=true;
            global.clearTimeout(previous.silenceTimer);
            previous.recognition.onresult=null;
            previous.recognition.onerror=null;
            previous.recognition.onend=null;
            previous.recognition.onstart=null;
            try {previous.recognition.abort();}catch {/* some browsers already stopped */}
        }
        global.VillaVoiceMeter.stop();
    }
    function close(stopSpeech=false) {
        if(stopSpeech)try {global.speechSynthesis?.cancel();}catch {/* optional */}
        uiEpoch++;
        clearHide();stopSession();
        document.body.classList.remove('voice-is-live');
        $('voice-live').hidden=true;
        $('voice-panel').hidden=true;
        $('voice-backdrop').hidden=true;
        $('voice-button').setAttribute('aria-expanded','false');
    }
    function showManual(reason='') {
        uiEpoch++;
        clearHide();stopSession();
        document.body.classList.remove('voice-is-live');
        $('voice-live').hidden=true;
        $('voice-panel').hidden=false;
        $('voice-backdrop').hidden=false;
        $('voice-button').setAttribute('aria-expanded','true');
        if(reason) {
            $('voice-status').textContent=reason;
            $('voice-status').classList.add('voice-status-error');
        } else {
            $('voice-status').textContent='اكتب الأمر أو اضغط «بدء الاستماع».';
            $('voice-status').classList.remove('voice-status-error');
        }
        $('voice-input').focus({preventScroll:true});
    }
    function fail(message,fatal=false) {
        clearHide();stopSession();
        if(fatal) {showManual(message+' يمكنك استخدام كتابة الأوامر.');return;}
        failedAttempts++;
        if(failedAttempts>=3) {
            failedAttempts=0;
            showManual('لم أتعرف على الأمر بعد 3 محاولات. استخدم كتابة الأوامر أو زر الاستماع.');
            say('ممكن تكتب الأمر من القائمة.');
            return;
        }
        setPhase('error');
        transcript('أعد المحاولة');
        feedback(`${message} · محاولة ${failedAttempts} من 3`);
        $('voice-retry').hidden=false;
        $('voice-live-hint').textContent='اضغط إعادة المحاولة وتكلم بوضوح';
        say('أعد المحاولة');
    }
    async function complete(session) {
        if(!session||session.finished||active!==session)return;
        session.finished=true;
        const heard=session.text.trim();
        clearTimeout(session.silenceTimer);
        // End microphone capture before TTS; never listen to our own voice.
        stopSession();
        if(!heard){fail('لم أسمع كلامًا واضحًا');return;}
        const epoch=uiEpoch;
        setPhase('processing');
        transcript(heard);
        feedback('بنفذ الأمر دلوقتي…');
        $('voice-retry').hidden=true;
        try {
            const response=await global.VillaVoiceControl.executeCommand(heard);
            if(uiEpoch!==epoch)return; // dismissed while the device adapter executed
            failedAttempts=0;
            setPhase('done');
            feedback(response);
            $('voice-live-hint').textContent='تم التنفيذ · اضغط على الميكروفون لأمر جديد';
            say(response);
            clearHide();
            hideTimer=global.setTimeout(()=>{if(uiEpoch===epoch)close();},3700);
        }catch(error) {
            if(uiEpoch===epoch)fail(error?.message||'لم أستطع تنفيذ الأمر');
        }
    }
    function start() {
        const Recognition=recognitionClass();
        if(!Recognition) {
            showManual('التعرف الصوتي غير متاح في هذا المتصفح. جرّب Chrome على HTTPS أو اكتب الأمر.');
            return;
        }
        clearHide();
        stopSession();
        try {global.speechSynthesis?.cancel();}catch {/* optional */}
        // Preserve the current multi-attempt sequence unless there was a success.
        uiEpoch++;
        $('voice-panel').hidden=true;
        $('voice-backdrop').hidden=true;
        $('voice-live').hidden=false;
        document.body.classList.add('voice-is-live');
        $('voice-button').setAttribute('aria-expanded','true');
        $('voice-retry').hidden=true;
        $('voice-live-hint').textContent='تكلّم بشكل طبيعي، الأمر يتنفذ بعد السكوت';
        transcript('اتفضل، قول الأمر');
        feedback('بسمعك دلوقتي…');
        setPhase('listening');
        closeRadialLightMenu();
        global.VillaCoveringControls?.closePanel();
        closeLightingModes();
        closeAllPopovers();
        let recognition;
        try {recognition=new Recognition();}
        catch {showManual('تعذر بدء التعرف الصوتي. يمكنك الكتابة بدل التحدث.');return;}
        recognition.lang='ar-EG';
        recognition.continuous=false;
        recognition.interimResults=true;
        recognition.maxAlternatives=1;
        const session={id:++sequence,recognition,text:'',silenceTimer:0,finished:false};
        active=session;
        recognition.onstart=()=>{
            if(active!==session||session.finished)return;
            void global.VillaVoiceMeter.start();
        };
        recognition.onresult=event=>{
            if(active!==session||session.finished)return;
            let text=''; let final=false;
            for(let i=0;i<event.results.length;i++) {
                const result=event.results[i];
                text+=' '+(result[0]?.transcript||'');
                final=final||Boolean(result.isFinal);
            }
            session.text=text.trim();
            if(session.text)transcript(session.text);
            feedback(final?'سمعت الأمر، بنفذه بعد السكوت…':'كمّل كلامك…');
            clearTimeout(session.silenceTimer);
            // The recognition engine also ends automatically after silence;
            // this watchdog handles browsers that keep interim text indefinitely.
            session.silenceTimer=global.setTimeout(()=>void complete(session),final?700:1650);
        };
        recognition.onerror=event=>{
            if(active!==session||session.finished)return;
            const code=event.error||'unknown';
            // A manually aborted session must not count as an unclear command.
            if(code==='aborted')return;
            if(code==='no-speech' && session.text.trim()) {void complete(session);return;}
            session.finished=true;
            if(code==='not-allowed'||code==='service-not-allowed')fail('الميكروفون غير مسموح. اسمح له من إعدادات المتصفح.',true);
            else if(code==='network')fail('تعذر الوصول إلى خدمة التعرف الصوتي في المتصفح.',true);
            else if(code==='audio-capture')fail('تعذر الوصول إلى الميكروفون.',true);
            else fail(code==='no-speech'?'لم أسمع كلامًا واضحًا':'الصوت غير واضح');
        };
        recognition.onend=()=>{
            if(active!==session||session.finished)return;
            void complete(session);
        };
        // This line is invoked in the originating button's user gesture.
        try {recognition.start();}
        catch(error) {session.finished=true;showManual('المتصفح لم يبدأ الاستماع: '+error.message);}
    }
    async function submitTyped(text) {
        $('voice-status').classList.remove('voice-status-error');
        $('voice-status').textContent='جارٍ تنفيذ الأمر…';
        try {
            const result=await global.VillaVoiceControl.executeCommand(text);
            $('voice-status').textContent=result;
            failedAttempts=0;
            say('تم تنفيذ الأمر');
        }catch(error) {
            $('voice-status').textContent=error?.message||'تعذر تنفيذ الأمر';
            $('voice-status').classList.add('voice-status-error');
        }
    }
    function init() {
        if(initialized)return;initialized=true;
        readSettings();
        $('voice-manual-mode').addEventListener('change',saveSettings);
        $('voice-tts-enabled').addEventListener('change',saveSettings);
        $('voice-button').addEventListener('click',()=>{
            if(!$('voice-live').hidden||!$('voice-panel').hidden){close();return;}
            failedAttempts=0;
            if(settings.manual)showManual();else start();
        });
        $('voice-orb').addEventListener('click',()=>{
            if(active){ // a deliberate tap stops the attempt without counting a failure
                stopSession();setPhase('idle');
                feedback('تم إيقاف الاستماع. اضغط مرة أخرى للتحدث.');
            }else start();
        });
        $('voice-live-close').addEventListener('click',()=>close(true));
        $('voice-retry').addEventListener('click',start);
        $('voice-close').addEventListener('click',()=>close(true));
        $('voice-backdrop').addEventListener('click',()=>close(true));
        $('voice-start').addEventListener('click',start);
        $('voice-form').addEventListener('submit',event=>{
            event.preventDefault();void submitTyped($('voice-input').value);
        });
        document.addEventListener('keydown',event=>{
            if(event.key==='Escape' && (!$('voice-live').hidden||!$('voice-panel').hidden))close(true);
        });
    }
    global.VillaVoiceUI=Object.freeze({init,start,close,showManual,settings:()=>({...settings}),state:()=>({listening:Boolean(active),failedAttempts,live:!$('voice-live').hidden,manual:!$('voice-panel').hidden})});
})(window);
