/** User-facing panels, individual commands, and touch-friendly radial position arc. */
(function(global) {
    'use strict';
    const registry=global.VillaDevices;
    const schedules=global.VillaCoveringSchedules;
    const label={shutter:'الشتر',curtain:'الستائر'};
    let activeKind=null, activeId=null, radialLevel=false, dragging=false, pointerId=null;
    let ready=false;
    const $=id=>document.getElementById(id);
    const clamp=v=>Math.max(0,Math.min(100,Math.round(v)));
    function announce(message){if(typeof showToast==='function')showToast(message);}
    const polar=(cx,cy,r,d)=>({x:cx+r*Math.cos(d*Math.PI/180), y:cy+r*Math.sin(d*Math.PI/180)});
    function arc(start,end) {
        const a=polar(130,130,103,start), b=polar(130,130,103,end);
        return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A 103 103 0 ${end-start>180?1:0} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
    }
    function closeRadial() {
        $('covering-radial').hidden=true;
        $('covering-radial-scrim').hidden=true;
        activeId=null;dragging=false;pointerId=null;
    }
    function closePanel() {
        $('covering-modes-panel').hidden=true;
        $('covering-modes-backdrop').hidden=true;
        for(const kind of ['shutter','curtain']) {
            const button=$(`covering-button-${kind}`);
            button.setAttribute('aria-expanded','false');
        }
        activeKind=null;
        closeRadial();
    }
    function renderList(kind) {
        const list=$('covering-device-list');
        list.replaceChildren();
        let previousGroup=null;
        for (const device of registry.list({kind})) {
            const spec=VILLA_COVERING_CONFIG.find(s=>s.id===device.id);
            if(kind==='curtain' && spec?.groupId==='rightBedroom' && previousGroup!=='rightBedroom') {
                const group=document.createElement('div');
                group.className='covering-coupled-group';
                const caption=document.createElement('span');caption.textContent='الغرفة اليمنى · الشباكان معًا';
                group.append(caption);
                for(const [action,name] of [['open','فتح الاثنين'],['close','إغلاق الاثنين']]) {
                    const button=document.createElement('button');button.type='button';button.textContent=name;
                    button.dataset.coveringGroup='rightBedroom';button.dataset.coveringGroupAction=action;
                    group.append(button);
                }
                list.append(group);
            }
            previousGroup=spec?.groupId;
            const row=document.createElement('div');
            row.className='covering-device-row';
            const name=document.createElement('div');name.className='covering-device-name';
            name.textContent=device.name;
            const rowActions=document.createElement('div');rowActions.className='covering-device-actions';
            const value=document.createElement('b');value.textContent=`${device.state.position}%`;
            value.dataset.statusFor=device.id;
            for(const [action,title] of [['open','فتح'],['close','إغلاق'],['level','مستوى']]) {
                const button=document.createElement('button');button.type='button';button.textContent=title;
                button.dataset.coveringAction=action;button.dataset.deviceId=device.id;
                button.setAttribute('aria-label',`${title} ${device.name}`);
                rowActions.appendChild(button);
            }
            rowActions.prepend(value);
            row.append(name,rowActions);
            list.append(row);
        }
    }
    function updateScheduleView(kind) {
        if (!kind || kind!==activeKind)return;
        const config=schedules.get(kind);
        $('covering-schedule-status').textContent=config.enabled
            ? `تلقائي مفعّل: فتح ${config.openTime} · إغلاق ${config.closeTime}`
            : 'جدولة غير مفعلة';
        $('covering-auto-trigger').setAttribute('aria-pressed',String(config.enabled));
    }
    function openPanel(kind) {
        if (!['shutter','curtain'].includes(kind))return;
        if(activeKind===kind && !$('covering-modes-panel').hidden){closePanel();return;}
        closeRadial();
        closeRadialLightMenu();
        closeLightingModes();
        closeAllPopovers();
        activeKind=kind;
        $('covering-modes-title').textContent=kind==='shutter'?'التحكم بالشتر':'التحكم بالستائر';
        $('covering-modes-sub').textContent=`${registry.list({kind}).length} أجهزة · تحكم مستقل أو جماعي`;
        const config=schedules.get(kind);
        $('covering-open-time').value=config.openTime;
        $('covering-close-time').value=config.closeTime;
        $('covering-auto-form').hidden=true;
        $('covering-auto-form-note').textContent='';
        renderList(kind);
        $('covering-modes-panel').hidden=false;
        $('covering-modes-backdrop').hidden=false;
        $('covering-button-'+kind).setAttribute('aria-expanded','true');
        updateScheduleView(kind);
    }
    function drawArc(position) {
        const amount=clamp(position);
        $('covering-radial-number').textContent=`${amount}%`;
        $('covering-radial-badge').textContent=`مستوى الفتح ${amount}%`;
        $('covering-arc-active').setAttribute('d',arc(140,140+Math.max(.15,amount/100*260)));
        const point=polar(130,130,103,140+amount/100*260);
        $('covering-arc-thumb').setAttribute('cx',point.x);
        $('covering-arc-thumb').setAttribute('cy',point.y);
    }
    function openRadial(id,x,y) {
        const device=registry.get(id);
        if(!device || !['shutter','curtain'].includes(device.kind))return;
        closeRadialLightMenu();
        closeLightingModes();
        if(!$('covering-modes-panel').hidden) { /* keep the panel behind radial backdrop */ }
        activeId=id; radialLevel=false;
        $('covering-radial-title').textContent=device.name;
        $('covering-radial-icon').className=device.kind==='shutter'?'fa-solid fa-window-maximize':'fa-solid fa-bars-staggered';
        $('covering-arc-group').setAttribute('hidden','');
        $('covering-arc-track').setAttribute('d',arc(140,400));
        $('covering-arc-hit').setAttribute('d',arc(140,400));
        const r=Math.min(128,Math.max(86,(window.innerHeight-getBottomOverlayHeight()-22)/2));
        const cx=Math.max(r+8,Math.min(window.innerWidth-r-8,x||window.innerWidth/2));
        const cy=Math.max(r+8,Math.min(window.innerHeight-getBottomOverlayHeight()-r-8,y||window.innerHeight/2));
        const radial=$('covering-radial');
        const scale=Math.min(1,r/130);
        radial.style.setProperty('--covering-scale',String(scale));
        radial.style.left=`${cx}px`;radial.style.top=`${cy}px`;
        drawArc(device.state.position);
        radial.hidden=false;
        $('covering-radial-scrim').hidden=false;
    }
    async function send(id,action,value) {
        try {await registry.execute(id,action,value);}
        catch(error) {console.error(error);announce('تعذر تنفيذ الأمر: '+error.message);}
    }
    function updateRadialFromPointer(event) {
        if(!radialLevel||!activeId)return;
        const svg=$('covering-arc-svg');
        const rect=svg.getBoundingClientRect();
        const dx=(event.clientX-rect.left)/rect.width*260-130;
        const dy=(event.clientY-rect.top)/rect.height*260-130;
        let angle=Math.atan2(dy,dx)*180/Math.PI;
        if(angle<140)angle+=360;
        angle=Math.max(140,Math.min(400,angle));
        const next=clamp((angle-140)/260*100);
        if(registry.get(activeId)?.state.position!==next)void send(activeId,'setPosition',next);
        drawArc(next);
    }
    function updateObservedState(device) {
        const value=document.querySelector(`[data-status-for="${device.id}"]`);
        if(value)value.textContent=`${device.state.position}%`;
        if(activeId===device.id && !dragging)drawArc(device.state.position);
    }
    function init() {
        if(ready)return;ready=true;
        for(const kind of ['shutter','curtain']) $('covering-button-'+kind).addEventListener('click',()=>openPanel(kind));
        $('covering-modes-backdrop').addEventListener('click',closePanel);
        $('covering-close-panel').addEventListener('click',closePanel);
        $('covering-modes-panel').addEventListener('click',async event=>{
            const mode=event.target.closest('[data-covering-mode]');
            if(mode) {
                const m=mode.dataset.coveringMode;
                if(m==='auto') { $('covering-auto-form').hidden=!$('covering-auto-form').hidden;return; }
                try {await schedules.mode(activeKind,m);announce(`${label[activeKind]}: ${mode.textContent.trim()}`);}catch(e){announce(e.message)}
                updateScheduleView(activeKind);
                return;
            }
            const pair=event.target.closest('[data-covering-group-action]');
            if(pair) {
                const devices=VILLA_COVERING_CONFIG.filter(s=>s.kind===activeKind && s.groupId===pair.dataset.coveringGroup);
                const result=await Promise.allSettled(devices.map(s=>registry.execute(s.id,pair.dataset.coveringGroupAction)));
                if(result.some(r=>r.status==='rejected'))announce('تعذر التحكم في بعض الأجهزة');
                else announce(`${pair.textContent.trim()} · تم التنفيذ`);
                return;
            }
            const button=event.target.closest('[data-covering-action]');
            if(!button)return;
            const {deviceId,coveringAction:action}=button.dataset;
            if(action==='level') {
                const rect=button.getBoundingClientRect();
                openRadial(deviceId,rect.left+rect.width/2,rect.top+rect.height/2);
            } else {await send(deviceId,action);}
        });
        $('covering-auto-form').addEventListener('submit',async event=>{
            event.preventDefault();
            try {
                await schedules.setSchedule(activeKind,{
                    enabled:true,openTime:$('covering-open-time').value,closeTime:$('covering-close-time').value
                });
                $('covering-auto-form').hidden=true;
                announce('تم تفعيل الجدول في المتصفح');
                updateScheduleView(activeKind);
            }catch(e) {$('covering-auto-form-note').textContent=e.message;}
        });
        $('covering-disable-auto').addEventListener('click',async()=>{
            await schedules.setSchedule(activeKind,{enabled:false});
            updateScheduleView(activeKind);
            announce('تم إيقاف الجدولة');
        });
        $('covering-radial-scrim').addEventListener('click',closeRadial);
        $('covering-radial-close').addEventListener('click',closeRadial);
        $('covering-radial-open').addEventListener('click',()=>{if(activeId)void send(activeId,'open');});
        $('covering-radial-shut').addEventListener('click',()=>{if(activeId)void send(activeId,'close');});
        $('covering-radial-level').addEventListener('click',()=>{
            if(!activeId)return;
            radialLevel=true;
            $('covering-arc-group').removeAttribute('hidden');
            drawArc(registry.get(activeId).state.position);
        });
        const svg=$('covering-arc-svg');
        svg.addEventListener('pointerdown',event=>{
            if(!radialLevel)return;
            dragging=true;pointerId=event.pointerId;
            svg.setPointerCapture(event.pointerId);
            updateRadialFromPointer(event);
            event.preventDefault();
        });
        svg.addEventListener('pointermove',event=>{
            if(dragging&&event.pointerId===pointerId)updateRadialFromPointer(event);
        });
        function stopDrag() {dragging=false;pointerId=null;}
        svg.addEventListener('pointerup',stopDrag);svg.addEventListener('pointercancel',stopDrag);
        document.addEventListener('keydown',event=>{
            if(event.key==='Escape'){closeRadial();closePanel();}
        });
        registry.subscribe(({type,device})=>{
            if((type==='state'||type==='registered') && ['curtain','shutter'].includes(device.kind))updateObservedState(device);
        });
        schedules.subscribe(updateScheduleView);
    }
    global.VillaCoveringControls=Object.freeze({init,openPanel,closePanel,openRadial,closeRadial,drawArc});
})(window);
