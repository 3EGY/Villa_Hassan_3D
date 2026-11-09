/**
 * Villa Hassan | Speech UI / mobile-safe recognition lifecycle (v3.0).
 * - Each button press creates a fresh SpeechRecognition instance.
 * - Recognition runs ONLY inside a user gesture; never continuously listens.
 * - On mobile we do not open a second getUserMedia stream for the visualizer.
 * - Final transcripts execute promptly; interim transcripts ask the engine to
 *   stop after a short silence so the final result is not discarded.
 * - Every attempt has a watchdog: WebKit can hang without onresult/onerror/onend.
 * - Speech synthesis is opt-in on iOS (WebKit audio-session interference).
 */
(function(global) {
    'use strict';
    const $=id=>document.getElementById(id);
    const KEY='villa-hassan-voice-settings-v3-0';
    const OLD_KEY='villa-hassan-voice-settings-v2-9';
    const isAppleMobile=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)
        || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
    const isMobile=()=>isAppleMobile() || /Android|Mobile/i.test(navigator.userAgent);
    const recognitionClass=()=>global.SpeechRecognition||global.webkitSpeechRecognition;
    let initialized=false;
    let settings={manual:false,tts:!isAppleMobile()};
    let active=null, sequence=0, uiEpoch=0, failedAttempts=0, hideTimer=0;
    let speakingUtterance=null;

    function readSettings() {
        try {
            const latest=global.localStorage.getItem(KEY);
            const saved=JSON.parse(latest||global.localStorage.getItem(OLD_KEY)||'{}');
            if(typeof saved.manual==='boolean')settings.manual=saved.manual;
            // The v2.9 default was speech playback ON on every platform. On
            // WebKit that can break subsequent microphone sessions, so do NOT
            // migrate that old implicit default. Respect an explicit v3 choice.
            if(latest && typeof saved.tts==='boolean')settings.tts=saved.tts;
            else if(!isAppleMobile() && typeof saved.tts==='boolean')settings.tts=saved.tts;
        }catch {/* storage can be disabled */}
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
            if(global.speechSynthesis.speaking||global.speechSynthesis.pending)global.speechSynthesis.cancel();
            const u=new global.SpeechSynthesisUtterance(message);
            speakingUtterance=u;
            u.lang='ar-EG';u.rate=1.04;u.pitch=1;
            const ar=global.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('ar'));
            if(ar)u.voice=ar;
            u.onend=u.onerror=()=>{if(speakingUtterance===u)speakingUtterance=null;};
            global.speechSynthesis.speak(u);
        }catch {speakingUtterance=null;}
    }
    function clearHide() {global.clearTimeout(hideTimer);hideTimer=0;}
    function setPhase(phase) {
        $('voice-live').dataset.phase=phase;
        $('voice-orb').setAttribute('aria-label',phase==='listening'?'إيقاف الاستماع':'ابدأ الاستماع من جديد');
    }
    function transcript(text) {$('voice-live-transcript').textContent=text;}
    function feedback(text) {$('voice-live-feedback').textContent=text;}
    function clearSessionTimers(s) {
        for(const key of ['silenceTimer','finishTimer','watchdogTimer','startupTimer']) {
            global.clearTimeout(s[key]);s[key]=0;
        }
    }
    function stopSession(method='abort') {
        const previous=active;
        active=null;
        if(previous) {
            previous.finished=true;
            clearSessionTimers(previous);
            const r=previous.recognition;
            // Detach before stopping: end/error from an old recognizer must
            // never leak into a new tap or increase the retry counter.
            for(const name of ['start','audiostart','speechstart','speechend','soundend',
                'result','error','end','nomatch'])r['on'+name]=null;
            if(!previous.ended) {
                try {
                    if(method==='stop')r.stop();
                    else if(method==='abort')r.abort();
                }catch {/* already disconnected */}
            }
        }
        global.VillaVoiceMeter.stop();
    }
    function close(stopSpeech=false) {
        if(stopSpeech && global.speechSynthesis) {
            try {if(global.speechSynthesis.speaking||global.speechSynthesis.pending)global.speechSynthesis.cancel();}catch {}
        }
        speakingUtterance=null;
        uiEpoch++;
        clearHide();stopSession();
        failedAttempts=0;
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
        $('voice-status').textContent=reason||'اكتب الأمر أو اضغط «بدء الاستماع».';
        $('voice-status').classList.toggle('voice-status-error',Boolean(reason));
        $('voice-input').focus({preventScroll:true});
    }
    function fail(message,fatal=false) {
        clearHide();stopSession();
        if(fatal) {showManual(message+' تقدر تستخدم كتابة الأوامر.');return;}
        failedAttempts++;
        if(failedAttempts>=3) {
            failedAttempts=0;
            showManual('تعذر فهم الأمر بعد 3 محاولات. استخدم الكتابة أو جرّب الاستماع مرة أخرى.');
            return;
        }
        setPhase('error');
        transcript('أعد المحاولة');
        feedback(`${message} · محاولة ${failedAttempts} من 3`);
        $('voice-retry').hidden=false;
        $('voice-live-hint').textContent='اضغط إعادة المحاولة وتكلم بوضوح';
        // Avoid extra TTS playback on mobile between microphone retries.
        if(!isMobile())say('أعد المحاولة');
    }
    async function complete(session) {
        if(!session||session.finished||active!==session)return;
        const heard=(session.finalText||session.text).trim();
        stopSession(heard?'stop':'abort');
        if(!heard){fail('لم أسمع كلامًا واضحًا');return;}
        const epoch=uiEpoch;
        setPhase('processing');
        transcript(heard);
        feedback('بنفّذ الأمر…');
        $('voice-retry').hidden=true;
        try {
            const response=await global.VillaVoiceControl.executeCommand(heard);
            if(uiEpoch!==epoch)return;
            failedAttempts=0;
            setPhase('done');
            feedback(response);
            $('voice-live-hint').textContent='تم التنفيذ · اضغط الميكروفون لأمر جديد';
            // Short feedback reduces playback interruptions on slower phones.
            say('تم التنفيذ');
            clearHide();
            hideTimer=global.setTimeout(()=>{if(uiEpoch===epoch)close();},2700);
        }catch(error) {
            if(uiEpoch===epoch)fail(error?.message||'لم أستطع تنفيذ الأمر');
        }
    }
    function requestStop(session) {
        if(active!==session||session.finished||session.stopRequested)return;
        session.stopRequested=true;
        feedback('تم التقاط الكلام، جاري تأكيد الأمر…');
        try {session.recognition.stop();}catch {/* onend or watchdog will finish */}
        // Some mobile engines never deliver onend or a final result after stop().
        session.finishTimer=global.setTimeout(()=>void complete(session),1250);
    }
    function start() {
        const Recognition=recognitionClass();
        if(!Recognition) {showManual('التعرف الصوتي غير مدعوم في هذا المتصفح. استخدم الكتابة أو متصفحًا داعمًا.');return;}
        clearHide();stopSession();
        // Cancelling TTS on EVERY tap interrupts the iOS audio session even
        // when nothing is speaking; only cancel a genuinely active utterance.
        if((global.speechSynthesis?.speaking||global.speechSynthesis?.pending)) {
            try {global.speechSynthesis.cancel();}catch {}
        }
        speakingUtterance=null;
        uiEpoch++;
        $('voice-panel').hidden=true;
        $('voice-backdrop').hidden=true;
        $('voice-live').hidden=false;
        document.body.classList.add('voice-is-live');
        $('voice-button').setAttribute('aria-expanded','true');
        $('voice-retry').hidden=true;
        $('voice-live-hint').textContent='اتكلم، وبعد السكوت هننفذ الأمر';
        transcript('اتفضل، قول الأمر');
        feedback('جاري تشغيل الميكروفون…');
        setPhase('starting');
        closeRadialLightMenu();
        global.VillaCoveringControls?.closePanel();
        closeLightingModes();
        closeAllPopovers();
        let recognition;
        try {recognition=new Recognition();}
        catch {fail('تعذر إنشاء جلسة الاستماع');return;}
        recognition.lang='ar-EG';
        recognition.continuous=false;
        recognition.interimResults=true;
        recognition.maxAlternatives=1;
        const session={id:++sequence,recognition,text:'',finalText:'',finished:false,
            ended:false,started:false,stopRequested:false,silenceTimer:0,finishTimer:0,watchdogTimer:0,startupTimer:0};
        active=session;
        recognition.onstart=()=>{
            if(active!==session||session.finished)return;
            session.started=true;
            setPhase('listening');
            feedback('بسمعك دلوقتي…');
            // Mobile: this uses animated CSS only. NO second mic request.
            if(!isMobile())void global.VillaVoiceMeter.start();
        };
        recognition.onspeechstart=()=>{
            if(active!==session||session.finished)return;
            global.VillaVoiceMeter.activity?.(true);
            feedback('اتفضل كمل…');
        };
        recognition.onspeechend=()=>{
            if(active!==session||session.finished)return;
            global.VillaVoiceMeter.activity?.(false);
            global.clearTimeout(session.silenceTimer);
            session.silenceTimer=global.setTimeout(()=>requestStop(session),300);
        };
        recognition.onsoundend=()=>{
            if(active===session&&!session.finished)global.VillaVoiceMeter.activity?.(false);
        };
        recognition.onresult=event=>{
            if(active!==session||session.finished)return;
            let text='',finalParts=[];
            for(let i=0;i<event.results.length;i++) {
                const r=event.results[i],part=(r[0]?.transcript||'').trim();
                if(part)text+=(text?' ':'')+part;
                if(r.isFinal&&part)finalParts.push(part);
            }
            if(text)session.text=text;
            if(finalParts.length)session.finalText=finalParts.join(' ');
            if(session.text)transcript(session.text);
            global.VillaVoiceMeter.activity?.(true);
            global.clearTimeout(session.silenceTimer);
            // A confirmed result can execute immediately. For interim text,
            // ask stop() after a brief pause, then await final/onend.
            if(session.finalText) {
                feedback('سمعت الأمر، بنفّذه…');
                session.silenceTimer=global.setTimeout(()=>void complete(session),170);
            } else if(!session.stopRequested) {
                feedback('كمّل كلامك…');
                session.silenceTimer=global.setTimeout(()=>requestStop(session),950);
            }
        };
        recognition.onnomatch=()=>{
            if(active===session&&!session.finished) {
                if(session.text)void complete(session);else fail('مش قادر أفهم الكلام');
            }
        };
        recognition.onerror=event=>{
            if(active!==session||session.finished)return;
            const code=event.error||'unknown';
            if(code==='aborted'&&session.stopRequested)return;
            if(code==='no-speech'&&session.text.trim()){void complete(session);return;}
            if(code==='not-allowed'||code==='service-not-allowed')fail('اسمح باستخدام الميكروفون من إعدادات المتصفح.',true);
            else if(code==='audio-capture')fail('الميكروفون غير متاح على الجهاز.',true);
            else if(code==='network')fail('خدمة التعرف الصوتي متأخرة أو الاتصال غير متاح.');
            else fail(code==='no-speech'?'لم أسمع كلامًا واضحًا':'الصوت غير واضح، حاول مرة ثانية.');
        };
        recognition.onend=()=>{
            if(active!==session||session.finished)return;
            session.ended=true;
            if(session.text.trim())void complete(session);
            else fail('لم يصل كلام من الميكروفون');
        };
        // Must happen synchronously on the button gesture, particularly iOS.
        try {
            recognition.start();
            session.startupTimer=global.setTimeout(()=>{
                if(active===session&&!session.finished&&!session.text&&!session.stopRequested&&!session.ended)
                    fail(session.started ? 'المتصفح لم يلتقط الكلام. جرب إعادة المحاولة.' : 'الميكروفون لم يبدأ الاستماع. حاول مرة ثانية.');
            },8500);
            session.watchdogTimer=global.setTimeout(()=>{
                if(active!==session||session.finished)return;
                if(session.text.trim())void complete(session);
                else fail('المتصفح لم يرسل أي نتيجة صوتية.');
            },13500);
        }catch(error) {fail('المتصفح لم يبدأ الاستماع: '+(error?.message||'خطأ غير معروف'));}
    }
    async function submitTyped(text) {
        $('voice-status').classList.remove('voice-status-error');
        $('voice-status').textContent='جارٍ تنفيذ الأمر…';
        try {
            const result=await global.VillaVoiceControl.executeCommand(text);
            $('voice-status').textContent=result;
            failedAttempts=0;
            say('تم التنفيذ');
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
            if(!$('voice-panel').hidden){close(true);return;}
            if(active) {close(true);return;}
            // When the last spoken command is already done, a second tap must
            // start a NEW recognition, not merely dismiss the old overlay.
            if(settings.manual && $('voice-live').hidden)showManual();
            else start();
        });
        $('voice-orb').addEventListener('click',()=>{
            if(active){stopSession();setPhase('idle');feedback('اتوقف الاستماع. اضغط تاني للتحدث.');}
            else start();
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
            if(event.key==='Escape'&&(!$('voice-live').hidden||!$('voice-panel').hidden))close(true);
        });
        document.addEventListener('visibilitychange',()=>{
            if(document.hidden&&active)close(true);
        });
    }
    global.VillaVoiceUI=Object.freeze({init,start,close,showManual,
        settings:()=>({...settings}),
        state:()=>({listening:Boolean(active),failedAttempts,live:!$('voice-live').hidden,
            manual:!$('voice-panel').hidden,phase:$('voice-live').dataset.phase})});
})(window);
