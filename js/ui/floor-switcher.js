/** Shared, touch-friendly floor and room navigation. No floor-specific geometry. */
(function(global){
    'use strict';
    let initialized=false;
    let originalDock='',originalMenu='';
    const icon=(className)=>{const i=document.createElement('i');i.className='fa-solid '+(className||'fa-house');i.setAttribute('aria-hidden','true');return i;};
    function makeZoneButton(id,room,dock){
        const b=document.createElement('button');b.type='button';
        b.className=dock?'dock-btn px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800/80 flex items-center gap-1.5 shrink-0':'floor-room-option';
        if(dock)b.id='dock-'+id;
        b.append(icon(room.icon||'fa-door-open'));
        const label=document.createElement('span');label.textContent=room.short||room.title;b.append(label);
        b.addEventListener('click',()=>dock?selectZoneFromDock(id):selectZoneAndClose(id));
        return b;
    }
    function renderNavigation(){
        if(!initialized)return;
        const active=global.VillaFloors.activeId;
        const dock=document.querySelector('#bottom-places-dock > div');
        const menu=document.getElementById('room-teleport-grid');
        if(!dock||!menu)return;
        if(active==='floor1'){
            dock.innerHTML=originalDock;
            menu.innerHTML=originalMenu;
            const overview=document.getElementById('dock-overview');
            if(overview)overview.classList.add('btn-active');
        } else {
            dock.replaceChildren();menu.replaceChildren();
            const current=global.VillaFloors.get(active);
            if(!current)return;
            const overviewSpec={title:'كامل '+current.label,short:'كامل '+current.shortLabel,icon:'fa-house'};
            dock.appendChild(makeZoneButton('overview',overviewSpec,true));
            menu.appendChild(makeZoneButton('overview',overviewSpec,false));
            for(const [id,room] of Object.entries(current.rooms)){
                dock.appendChild(makeZoneButton(id,room,true));
                menu.appendChild(makeZoneButton(id,room,false));
            }
            document.getElementById('dock-overview')?.classList.add('btn-active');
        }
        document.getElementById('floor-preview-note').hidden=active!=='ground';
        // Each floor remembers its reference overlay percentage separately.
        const slider=document.getElementById('cad-opacity-slider');
        if(slider){
            slider.value=active==='ground'?70:0;
            const value=document.getElementById('cad-opacity-val');if(value)value.textContent=slider.value+'%';
        }
        const toolbarLabel=document.getElementById('floor-current-label');
        if(toolbarLabel)toolbarLabel.textContent=global.VillaFloors.get(active).label;
    }
    function render(){
        const wrapper=document.getElementById('floor-switcher-buttons');
        if(!wrapper)return;
        wrapper.replaceChildren();
        for(const floor of global.VillaFloors.list()){
            const b=document.createElement('button');
            b.type='button';b.className='floor-choice';b.dataset.floorId=floor.id;
            b.setAttribute('aria-pressed',String(global.VillaFloors.activeId===floor.id));
            b.disabled=floor.status==='planned';
            b.title=floor.status==='planned'?`${floor.label} — قيد التحضير`:floor.label;
            b.append(icon(floor.icon));
            const label=document.createElement('span');label.textContent=floor.shortLabel;b.append(label);
            if(floor.status==='planned'){
                const pending=document.createElement('small');pending.textContent='لاحقًا';b.append(pending);
            }
            b.addEventListener('click',()=>{
                if(floor.id==='ground'){window.location.href='./ground.html?review=1';return;}
                global.VillaFloors.select(floor.id);
            });
            wrapper.append(b);
        }
        const status=document.getElementById('floor-switcher-status');
        if(status){const floor=global.VillaFloors.get(global.VillaFloors.activeId);
            status.textContent=floor.label+(floor.status==='draft'?' · للمراجعة':' · أجهزة قابلة للتحكم');}
    }
    function init(){
        if(initialized)return;
        const dock=document.querySelector('#bottom-places-dock > div');
        const menu=document.getElementById('room-teleport-grid');
        if(!dock||!menu)throw new Error('Floor navigation host not found');
        originalDock=dock.innerHTML;originalMenu=menu.innerHTML;
        initialized=true;
        document.getElementById('floor-switcher').hidden=false;
        const label=document.createElement('span');label.id='floor-current-label';
        label.textContent='الدور الأول';label.className='floor-header-label';
        const brand=document.querySelector('#main-toolbar .glass-panel .flex.items-center');
        if(brand)brand.append(label);
        render();renderNavigation();
    }
    global.VillaFloorSwitcher=Object.freeze({init,render,renderNavigation});
})(window);
