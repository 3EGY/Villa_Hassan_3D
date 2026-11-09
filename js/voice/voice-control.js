/**
 * Optional, user-initiated Arabic voice commands. On-device simulation only.
 * SpeechRecognition is browser-dependent, and browser vendors may process audio
 * remotely. Never record until the user presses the microphone button.
 * Text-command fallback always available.
 */
(function(global) {
    'use strict';
    const registry=global.VillaDevices;
    let recognition=null, listening=false, initialized=false;
    const $=id=>document.getElementById(id);
    const normalize=text=>String(text||'')
        .replace(/[\u064b-\u065f\u0670\u0640]/g,'')
        .replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
        .replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))
        .replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
        .replace(/\s+/g,' ').trim().toLowerCase();

    const roomAliases=[
        {zone:'rightBedroom',words:['الغرفه اليمني','الغرفه اليمين','الاوضه اليمين','اوضه اليمين','غرفه اليمين']},
        {zone:'leftBedroom',words:['الغرفه اليسري','الغرفه الشمال','الاوضه الشمال','اوضه الشمال','غرفه الشمال']},
        {zone:'masterBedroom',words:['غرفه النوم الرئيسيه','غرفه النوم','اوضه النوم','الماستر','الماستر بد روم']},
        {zone:'livingRoom',words:['الصاله','الريسبشن','الليفنج','المعيشه']},
        {zone:'terraceLounge',words:['جلسه التراس','قعده التراس']},
        {zone:'terrace',words:['التراس','البلكونه']},
        {zone:'dressing',words:['غرفه الملابس','الدريسنج']},
        {zone:'bathroom',words:['الحمام الرئيسي']},
        {zone:'guestBathroom',words:['حمام الضيوف']},
        {zone:'stairs',words:['الدرج','السلم']},
        {zone:'lobbyPlanter',words:['البهو']},
        {zone:'washbasins',words:['المغاسل']},
        {zone:'courtyard',words:['الحوش','التراس الايسر']}
    ];
    function parseCommand(phrase) {
        const normalized=normalize(phrase);
        if(!normalized)return {error:'اكتب أو قل أمرًا أولًا'};
        let kind;
        if(/ستار|ستاير|ستائر/.test(normalized))kind='curtain';
        else if(/شتر|شطر/.test(normalized))kind='shutter';
        else if(/اضا|لمب|نور|انوار|ضو/.test(normalized))kind='light';
        else return {error:'اذكر نوع الجهاز: إضاءة أو شتر أو ستائر'};
        const zone=roomAliases.find(item=>item.words.some(word=>normalized.includes(word)))?.zone||null;
        const num=normalized.match(/\b\d{1,3}\b/);
        const number=num?Number(num[0]):null;
        let action, value;
        if(/وضع النهار|الصباح|نهاري/.test(normalized)&&kind!=='light')action='day';
        else if(/وضع الليل|ليلي/.test(normalized)&&kind!=='light')action='night';
        else if(number!==null && /شده|سطوع|مستوي|نسبه|خلي|اجعل|اضبط|علي|%|في الميه/.test(normalized)) {
            if(number>100)return {error:'المستوى لازم يكون من 0 إلى 100%'};
            action=kind==='light'?'setBrightness':'setPosition';value=number;
        }
        else if(/اغلق|اقفل|قفل|اطفي|اطفئ|طفي|سكر|نزل/.test(normalized)) action=kind==='light'?'turnOff':'close';
        else if(/افتح|فتح|شغل|ولع|ارفع/.test(normalized)) action=kind==='light'?'turnOn':'open';
        else if(number!==null) {
            if(number>100)return {error:'المستوى لازم يكون من 0 إلى 100%'};
            action=kind==='light'?'setBrightness':'setPosition';value=number;
        }
        else return {error:'لم أتعرف على الإجراء. جرّب افتح أو اقفل أو حدد نسبة'};
        // A command without a room deliberately targets all devices of that type.
        return {kind,zoneId:zone,action,value,normalized};
    }
    async function executeCommand(phrase) {
        const parsed=parseCommand(phrase);
        if(parsed.error)throw new Error(parsed.error);
        const {kind,zoneId,action,value}=parsed;
        if(action==='day'||action==='night') {
            if(zoneId)throw new Error('وضع النهار والليل للجميع؛ للتحكم في غرفة قل افتح أو اقفل');
            await global.VillaCoveringSchedules.mode(kind,action);
            return `تم تطبيق وضع ${action==='day'?'النهار':'الليل'} على ${kind==='curtain'?'الستائر':'الشتر'}`;
        }
        const devices=registry.list(zoneId?{kind,zoneId}:{kind});
        if(!devices.length)throw new Error('لا توجد أجهزة مطابقة للغرفة ونوع الجهاز');
        const results=await Promise.allSettled(devices.map(d=>registry.execute(d.id,action,value)));
        const failures=results.filter(r=>r.status==='rejected');
        if(failures.length)throw new Error(`فشل تنفيذ الأمر على ${failures.length} جهاز`);
        const label=kind==='light'?'الإضاءة':kind==='shutter'?'الشتر':'الستائر';
        return `تم تنفيذ الأمر على ${devices.length} من أجهزة ${label}${value!==undefined?' · '+value+'%':''}`;
    }
    function setStatus(text,error=false) {
        if(!$('voice-status'))return;
        $('voice-status').textContent=text;
        $('voice-status').classList.toggle('voice-status-error',error);
    }
    async function handle(text) {
        $('voice-input').value=text;
        setStatus('جارٍ تنفيذ الأمر...');
        try {setStatus(await executeCommand(text));}
        catch(error){setStatus(error.message,true);}
    }
    function stop() {
        if(recognition && listening) {recognition.stop();}
    }
    function close() {
        stop();$('voice-panel').hidden=true;$('voice-backdrop').hidden=true;
        $('voice-button').setAttribute('aria-expanded','false');
    }
    function start() {
        const Recognition=global.SpeechRecognition||global.webkitSpeechRecognition;
        if(!Recognition) {
            setStatus('التعرف الصوتي غير متاح في هذا المتصفح. استخدم مربع كتابة الأوامر.',true);
            return;
        }
        if(listening){stop();return;}
        recognition=new Recognition();
        recognition.lang='ar-EG';
        recognition.continuous=false;
        recognition.interimResults=false;
        recognition.maxAlternatives=1;
        recognition.onstart=()=>{
            listening=true;
            $('voice-start').textContent='إيقاف الاستماع';
            setStatus('أستمع الآن… قل الأمر بالعربية');
        };
        recognition.onresult=event=>{
            const transcript=event.results[0]?.[0]?.transcript||'';
            if(transcript)void handle(transcript);
        };
        recognition.onerror=event=>{
            const reason=event.error==='not-allowed'?'الميكروفون غير مسموح. اسمح له من إعدادات المتصفح.'
                :event.error==='no-speech'?'لم أسمع كلامًا واضحًا. جرّب مرة ثانية.'
                :`فشل التعرف الصوتي (${event.error}). جرّب الكتابة.`;
            setStatus(reason,true);
        };
        recognition.onend=()=>{listening=false;$('voice-start').textContent='بدء الاستماع';};
        try {recognition.start();}catch(error){setStatus(error.message,true);}
    }
    function init() {
        if(initialized)return;initialized=true;
        $('voice-button').addEventListener('click',()=>{
            closeRadialLightMenu();
            global.VillaCoveringControls.closePanel();
            const show=$('voice-panel').hidden;
            $('voice-panel').hidden=!show;
            $('voice-backdrop').hidden=!show;
            $('voice-button').setAttribute('aria-expanded',String(show));
            if(show)$('voice-input').focus({preventScroll:true});else stop();
        });
        $('voice-backdrop').addEventListener('click',close);
        $('voice-close').addEventListener('click',close);
        $('voice-start').addEventListener('click',start);
        $('voice-form').addEventListener('submit',event=>{
            event.preventDefault();void handle($('voice-input').value);
        });
        document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
        if(!global.SpeechRecognition&&!global.webkitSpeechRecognition) {
            setStatus('يمكنك كتابة الأوامر. التحدث يحتاج متصفحًا يدعم التعرف الصوتي.');
        }
    }
    global.VillaVoiceControl=Object.freeze({init,parseCommand,executeCommand,normalize});
})(window);
