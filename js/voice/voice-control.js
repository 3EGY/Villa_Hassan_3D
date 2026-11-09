/**
 * Arabic command parser and device dispatcher. Browser microphone, speech
 * synthesis, UI and retry handling are intentionally isolated in voice-ui.js.
 * No generative model and no network calls by this application.
 */
(function(global) {
    'use strict';
    const registry=global.VillaDevices;
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
    function voiceNumber(normalized) {
        const digits=normalized.match(/(?:^|\s)(\d{1,3})(?:\s|%|٪|$)/);
        if(digits)return Number(digits[1]);
        const units={صفر:0,واحد:1,واحده:1,اتنين:2,اثنين:2,تنين:2,تلاته:3,ثلاثه:3,اربعه:4,خمسه:5,سته:6,سبعه:7,تمانيه:8,ثمانيه:8,تسعه:9};
        const tens={عشره:10,عشرين:20,تلاتين:30,ثلاثين:30,اربعين:40,خمسين:50,ستين:60,سبعين:70,تمانين:80,ثمانين:80,تسعين:90,ميه:100,مئه:100};
        const words=normalized.split(/\s+/);
        for(let i=0;i<words.length;i++) {
            let w=words[i].replace(/^و(?=عشرين|تلاتين|اربعين|خمسين|ستين|سبعين|تمانين|تسعين)/,'');
            if(Object.hasOwn(tens,w)) return i>=2 && (words[i-1]==='و'||words[i-1]==='and') && Object.hasOwn(units,words[i-2]) ? tens[w]+units[words[i-2]] : tens[w];
            if(Object.hasOwn(units,w) && (i===words.length-1 || !['و','and'].includes(words[i+1])))return units[w];
        }
        return null;
    }
    function parseCommand(phrase) {
        const normalized=normalize(phrase);
        if(!normalized)return {error:'اكتب أو قل أمرًا أولًا'};
        let kind;
        if(/ستار|ستاير|ستائر/.test(normalized))kind='curtain';
        else if(/شتر|شطر/.test(normalized))kind='shutter';
        else if(/اضا|لمب|نور|انوار|ضو/.test(normalized))kind='light';
        else return {error:'اذكر نوع الجهاز: إضاءة أو شتر أو ستائر'};
        const zone=roomAliases.find(item=>item.words.some(word=>normalized.includes(word)))?.zone||null;
        const number=voiceNumber(normalized);
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
    global.VillaVoiceControl=Object.freeze({parseCommand,executeCommand,normalize});
})(window);
