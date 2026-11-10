(function(){
  'use strict';
  const data=window.VillaGroundReviewData;
  if(!data) throw new Error('VillaGroundReviewData is required');

  const deepClone=obj=>JSON.parse(JSON.stringify(obj));
  const svgNS='http://www.w3.org/2000/svg';
  const state={
    openings:deepClone(data.openings),
    lights:deepClone(data.lights),
    selectedId:null,
    filter:'all',
    showLabels:true,
    showLights:true,
    showOpenings:true,
    view:{
      x:data.planBounds.minX,
      y:data.planBounds.minZ,
      w:data.planBounds.maxX-data.planBounds.minX,
      h:data.planBounds.maxZ-data.planBounds.minZ
    },
    pan:null,
    addMode:null,
    addStep:null,
    addStart:null,
    storageAvailable:true,
  };

  const statusLabels={existing:'قائم',proposed:'مقترح',add:'إضافة',remove:'إلغاء',verify:'مراجعة'};
  const statusColors={existing:'ok',proposed:'note',add:'note',remove:'warn',verify:'warn'};
  const kindColors={window:'window',door:'door',slidingGlass:'slidingGlass',light:'light'};
  const $=id=>document.getElementById(id);

  const els={
    svg:$('planSvg'), layers:$('planLayers'), status:$('planStatus'),
    list:$('itemsList'), selectedTitle:$('selectedTitle'), selectedMeta:$('selectedMeta'),
    form:$('itemForm'), empty:$('emptyEditor'), editor:$('editorCard'),
    exportWrap:$('exportWrap'), exportText:$('exportText'), saveStatus:$('saveStatus'),
    stats:{all:$('statAll'), openings:$('statOpenings'), lights:$('statLights'), needs:$('statNeeds')},
    reviewImage:$('reviewImage')
  };

  function loadSaved(){
    try{
      const raw=localStorage.getItem(data.storageKey);
      if(!raw) return;
      const saved=JSON.parse(raw);
      if(saved && Array.isArray(saved.openings) && Array.isArray(saved.lights)){
        state.openings=saved.openings; state.lights=saved.lights;
      }
    }catch(err){ state.storageAvailable=false; console.warn(err); }
  }

  function save(){
    try{
      localStorage.setItem(data.storageKey, JSON.stringify({meta:data.exportMeta, openings:state.openings, lights:state.lights}));
      state.storageAvailable=true;
      els.saveStatus.textContent='تم الحفظ محليًا على هذا المتصفح.';
    }catch(err){
      state.storageAvailable=false;
      els.saveStatus.textContent='الحفظ المحلي غير متاح هنا؛ استخدم نسخ JSON.';
    }
    renderStats(); renderList(); renderPlan();
  }

  function allItems(){ return [...state.openings, ...state.lights]; }
  function currentItems(){
    return allItems().filter(item=>{
      if(state.filter==='all') return true;
      if(state.filter==='openings') return item.kind!=='light';
      if(state.filter==='lights') return item.kind==='light';
      if(state.filter==='needs') return item.status==='verify' || item.status==='add' || item.status==='remove' || hasMissing(item);
      return true;
    });
  }
  function findItem(id){ return allItems().find(item=>item.id===id) || null; }
  function hasMissing(item){
    if(item.kind==='light') return !item.roomId;
    return item.widthCm==null || item.heightCm==null || item.sillCm==null || item.headCm==null;
  }
  function centerOf(item){
    if(item.kind==='light') return {x:item.x,y:item.z};
    return {x:(item.x1+item.x2)/2,y:(item.z1+item.z2)/2};
  }
  function widthFromGeometry(item){
    if(item.kind==='light') return null;
    return Math.round(Math.hypot(item.x2-item.x1, item.z2-item.z1)*100);
  }
  function nextId(prefix, pool){
    let i=1;
    while(pool.some(item=>item.id===`${prefix}${String(i).padStart(2,'0')}`)) i++;
    return `${prefix}${String(i).padStart(2,'0')}`;
  }
  function roomName(roomId){ return data.roomOptions.find(r=>r.id===roomId)?.name || 'غير محدد'; }

  function setView(x,y,w,h){ state.view={x,y,w,h}; applyView(); }
  function applyView(){ els.svg.setAttribute('viewBox', `${state.view.x} ${state.view.y} ${state.view.w} ${state.view.h}`); }
  function zoom(factor,cx,cy){
    const v=state.view; const nx=cx ?? (v.x+v.w/2), ny=cy ?? (v.y+v.h/2);
    const nw=Math.max(2.5, Math.min(40, v.w*factor));
    const nh=nw*((data.planBounds.maxZ-data.planBounds.minZ)/(data.planBounds.maxX-data.planBounds.minX));
    const rx=(nx-v.x)/v.w, ry=(ny-v.y)/v.h;
    state.view.w=nw; state.view.h=nh; state.view.x=nx-rx*nw; state.view.y=ny-ry*nh;
    constrainView(); applyView(); renderPlan();
  }
  function constrainView(){
    const b=data.planBounds, v=state.view;
    const maxX=b.maxX-v.w, maxY=b.maxZ-v.h;
    v.x=Math.max(b.minX-1, Math.min(maxX+1, v.x));
    v.y=Math.max(b.minZ-1, Math.min(maxY+1, v.y));
  }
  function resetView(){ setView(data.planBounds.minX, data.planBounds.minZ, data.planBounds.maxX-data.planBounds.minX, data.planBounds.maxZ-data.planBounds.minZ); renderPlan(); }
  function svgPointFromEvent(evt){
    const rect=els.svg.getBoundingClientRect();
    const x=state.view.x + ((evt.clientX-rect.left)/rect.width)*state.view.w;
    const y=state.view.y + ((evt.clientY-rect.top)/rect.height)*state.view.h;
    return {x,y};
  }

  function renderStats(){
    const items=allItems(), openings=state.openings.length, lights=state.lights.length, needs=items.filter(item=>item.status!=='existing' || hasMissing(item)).length;
    els.stats.all.textContent=items.length;
    els.stats.openings.textContent=openings;
    els.stats.lights.textContent=lights;
    els.stats.needs.textContent=needs;
  }

  function renderList(){
    const items=currentItems();
    els.list.innerHTML='';
    items.forEach(item=>{
      const row=document.createElement('button');
      row.type='button';
      row.className='item-row'+(state.selectedId===item.id?' active':'');
      const t=data.types[item.kind] || item.kind;
      row.innerHTML=`<strong>${item.id} · ${item.label||t}</strong><small>${t} — ${roomName(item.roomId)}${item.kind==='light'?'':' · عرض '+(item.widthCm ?? widthFromGeometry(item))+' سم'}</small><div class="badges"><span class="badge ${statusColors[item.status]||''}">${statusLabels[item.status]||item.status}</span>${item.kind!=='light' && item.curtain?'<span class="badge note">ستارة</span>':''}${item.kind!=='light' && item.shutter?'<span class="badge note">شتر</span>':''}${hasMissing(item)?'<span class="badge warn">بيانات ناقصة</span>':''}</div>`;
      row.onclick=()=>selectItem(item.id);
      els.list.appendChild(row);
    });
  }

  function createEl(name, attrs={}){
    const el=document.createElementNS(svgNS, name);
    for(const [k,v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  function renderPlan(){
    els.layers.innerHTML='';
    const defs=createEl('defs');
    defs.appendChild(createEl('filter',{id:'glow',x:'-50%',y:'-50%',width:'200%',height:'200%'}));
    defs.querySelector('filter').appendChild(createEl('feGaussianBlur',{stdDeviation:'.20',result:'blur'}));
    defs.querySelector('filter').appendChild(createEl('feMerge')).innerHTML='<feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/>';
    els.layers.appendChild(defs);

    if(els.reviewImage && els.reviewImage.checked){
      const img=createEl('image',{
        href:'./assets/floors/ground/plan-full.png', x:data.planBounds.minX, y:data.planBounds.minZ,
        width:data.planBounds.maxX-data.planBounds.minX, height:data.planBounds.maxZ-data.planBounds.minZ,
        preserveAspectRatio:'none', class:'ref-image'
      });
      els.layers.appendChild(img);
    }

    const grid=createEl('g',{class:'plan-grid'});
    for(let gx=Math.floor(data.planBounds.minX); gx<=Math.ceil(data.planBounds.maxX); gx++) grid.appendChild(createEl('line',{x1:gx,y1:data.planBounds.minZ,x2:gx,y2:data.planBounds.maxZ}));
    for(let gy=Math.floor(data.planBounds.minZ); gy<=Math.ceil(data.planBounds.maxZ); gy++) grid.appendChild(createEl('line',{x1:data.planBounds.minX,y1:gy,x2:data.planBounds.maxX,y2:gy}));
    els.layers.appendChild(grid);

    const walls=createEl('g');
    data.walls.forEach(w=> walls.appendChild(createEl('line',{x1:w.x1,y1:w.z1,x2:w.x2,y2:w.z2,class:'wall'})));
    els.layers.appendChild(walls);

    const roomLayer=createEl('g');
    const seenNames=new Set();
    data.roomOptions.forEach(r=>{
      const source=(window.VillaGroundFloorData?.rooms||[]).find(room=>room.id===r.id);
      if(!source || seenNames.has(r.id)) return;
      seenNames.add(r.id);
      const p=window.VillaGroundFloorData.coord(...source.center);
      const txt=createEl('text',{x:p.x,y:p.z,class:'room-tag'});
      txt.textContent=source.short || source.title;
      roomLayer.appendChild(txt);
    });
    els.layers.appendChild(roomLayer);

    const itemsGroup=createEl('g');
    allItems().forEach(item=>{
      if(item.kind==='light' && !state.showLights) return;
      if(item.kind!=='light' && !state.showOpenings) return;
      const group=createEl('g',{class:`item-group ${state.selectedId===item.id?'selected':''} status-${item.status}`,'data-id':item.id});
      group.addEventListener('click', evt=>{evt.stopPropagation(); selectItem(item.id);});
      if(item.kind==='light'){
        group.appendChild(createEl('circle',{cx:item.x,cy:item.z,r:.32,class:'item-light ring item-hit'}));
        group.appendChild(createEl('circle',{cx:item.x,cy:item.z,r:.18,class:'item-light item-hit'}));
      }else{
        group.appendChild(createEl('line',{x1:item.x1,y1:item.z1,x2:item.x2,y2:item.z2,class:`item-line ${kindColors[item.kind]||''} item-hit`}));
      }
      if(state.showLabels){
        const c=centerOf(item);
        const label=createEl('text',{x:c.x,y:c.y-.18,class:'item-label'});
        const extras=[];
        if(item.kind!=='light' && item.curtain) extras.push('ستارة');
        if(item.kind!=='light' && item.shutter) extras.push('شتر');
        label.textContent=`${item.id}${extras.length?' · '+extras.join(' + '):''}`;
        group.appendChild(label);
      }
      itemsGroup.appendChild(group);
    });

    if(state.addStart && state.addMode && state.addMode!=='light'){
      const c=state.addStart;
      itemsGroup.appendChild(createEl('circle',{cx:c.x,cy:c.y,r:.12,fill:'#fff'}));
    }
    els.layers.appendChild(itemsGroup);
    applyView();
  }

  function selectItem(id){
    state.selectedId=id;
    const item=findItem(id);
    renderList(); renderPlan();
    if(!item){ els.empty.classList.remove('hidden'); els.editor.classList.add('hidden'); return; }
    els.empty.classList.add('hidden'); els.editor.classList.remove('hidden');
    els.selectedTitle.textContent=`${item.id} · ${item.label || (data.types[item.kind]||item.kind)}`;
    els.selectedMeta.textContent=`${data.types[item.kind]||item.kind} — ${roomName(item.roomId)}`;
    fillForm(item);
  }

  function fillRoomSelect(value){
    const select=$('fieldRoom');
    select.innerHTML='';
    data.roomOptions.forEach(opt=>{
      const option=document.createElement('option'); option.value=opt.id; option.textContent=opt.name; if(opt.id===value) option.selected=true; select.appendChild(option);
    });
  }

  function fillForm(item){
    $('fieldId').value=item.id;
    $('fieldKind').value=item.kind;
    $('fieldLabel').value=item.label || '';
    fillRoomSelect(item.roomId || 'other');
    $('fieldStatus').value=item.status || 'existing';
    $('fieldComment').value=item.comment || '';
    $('fieldCustom').textContent=item.custom ? 'عنصر مضاف يدويًا' : 'عنصر من الموديل الحالي';
    $('openingFields').classList.toggle('hidden', item.kind==='light');
    $('lightFields').classList.toggle('hidden', item.kind!=='light');
    if(item.kind==='light'){
      $('fieldX').value=round(item.x,2); $('fieldZ').value=round(item.z,2);
      $('fieldCount').value=item.count ?? 1; $('fieldDimmable').checked=!!item.dimmable;
    }else{
      $('fieldWidth').value=item.widthCm ?? widthFromGeometry(item) ?? '';
      $('fieldSill').value=item.sillCm ?? '';
      $('fieldHeight').value=item.heightCm ?? '';
      $('fieldHead').value=item.headCm ?? '';
      $('fieldCurtain').checked=!!item.curtain;
      $('fieldShutter').checked=!!item.shutter;
      $('fieldX1').value=round(item.x1,2); $('fieldZ1').value=round(item.z1,2); $('fieldX2').value=round(item.x2,2); $('fieldZ2').value=round(item.z2,2);
    }
    $('deleteBtn').disabled=!item.custom;
  }

  function round(v,p=2){ return Number(v).toFixed(p).replace(/\.00$/,''); }

  function updateFromForm(){
    const item=findItem(state.selectedId); if(!item) return;
    item.label=$('fieldLabel').value.trim(); item.roomId=$('fieldRoom').value; item.roomName=roomName(item.roomId); item.status=$('fieldStatus').value; item.comment=$('fieldComment').value.trim();
    if(item.kind==='light'){
      item.x=Number($('fieldX').value)||0; item.z=Number($('fieldZ').value)||0; item.count=Math.max(1, Number($('fieldCount').value)||1); item.dimmable=$('fieldDimmable').checked;
    }else{
      item.x1=Number($('fieldX1').value)||0; item.z1=Number($('fieldZ1').value)||0; item.x2=Number($('fieldX2').value)||0; item.z2=Number($('fieldZ2').value)||0;
      item.widthCm=Number($('fieldWidth').value)||widthFromGeometry(item);
      item.sillCm=$('fieldSill').value===''?null:Number($('fieldSill').value);
      item.heightCm=$('fieldHeight').value===''?null:Number($('fieldHeight').value);
      item.headCm=$('fieldHead').value===''?null:Number($('fieldHead').value);
      item.curtain=$('fieldCurtain').checked; item.shutter=$('fieldShutter').checked;
    }
    save();
  }

  function startAdd(mode){
    state.addMode=mode; state.addStep=mode==='light' ? 'point' : 'first'; state.addStart=null;
    els.status.textContent=mode==='light' ? 'اضغط على المخطط لإضافة نقطة إضاءة جديدة.' : 'اضغط نقطة البداية ثم النهاية لإضافة '+(data.types[mode]||mode)+'.';
    document.querySelectorAll('[data-add]').forEach(btn=>btn.classList.toggle('active', btn.dataset.add===mode));
  }
  function stopAdd(){
    state.addMode=null; state.addStep=null; state.addStart=null; renderPlan();
    document.querySelectorAll('[data-add]').forEach(btn=>btn.classList.remove('active'));
    els.status.textContent='اضغط على أي باب أو شباك أو نقطة إضاءة لمراجعة بياناته، أو استخدم أزرار الإضافة لإضافة عنصر جديد.';
  }
  function addAtPoint(point){
    if(!state.addMode) return;
    if(state.addMode==='light'){
      const id=nextId('GL', state.lights);
      state.lights.push({id,kind:'light',label:'إضاءة جديدة',roomId:'other',roomName:'أخرى / يحتاج تحديد',x:point.x,z:point.y,status:'add',count:1,dimmable:true,comment:'أضيفت من مخطط المراجعة',custom:true});
      stopAdd(); save(); selectItem(id); return;
    }
    if(state.addStep==='first'){
      state.addStart=point; state.addStep='second';
      els.status.textContent='تم تسجيل نقطة البداية. اضغط نقطة النهاية لإكمال الإضافة.';
      renderPlan(); return;
    }
    const start=state.addStart; const end=point; const pool=state.openings;
    const prefix=state.addMode==='door'?'GD':state.addMode==='window'?'GW':'GS';
    const id=nextId(prefix,pool);
    pool.push({id,kind:state.addMode,label:'فتحة جديدة',roomId:'other',roomName:'أخرى / يحتاج تحديد',x1:start.x,z1:start.y,x2:end.x,z2:end.y,widthCm:Math.round(Math.hypot(end.x-start.x,end.y-start.y)*100),heightCm:null,sillCm:state.addMode==='door'?0:90,headCm:null,status:'add',curtain:false,shutter:false,comment:'أضيفت من مخطط المراجعة',custom:true});
    stopAdd(); save(); selectItem(id);
  }

  function deleteSelected(){
    const item=findItem(state.selectedId);
    if(!item || !item.custom) return;
    if(item.kind==='light') state.lights=state.lights.filter(x=>x.id!==item.id);
    else state.openings=state.openings.filter(x=>x.id!==item.id);
    state.selectedId=null; save(); renderList(); renderPlan(); els.editor.classList.add('hidden'); els.empty.classList.remove('hidden');
  }

  function exportData(){
    const payload={
      ...data.exportMeta,
      floorId:data.floorId,
      exportedAt:new Date().toISOString(),
      openings:state.openings.map(item=>({...item,widthCm:item.widthCm ?? widthFromGeometry(item)})),
      lights:state.lights.map(item=>({...item}))
    };
    return JSON.stringify(payload,null,2);
  }

  function bind(){
    $('filterAll').onclick=()=>{state.filter='all'; renderList(); document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active', b.dataset.filter==='all'));};
    document.querySelectorAll('[data-filter]').forEach(btn=>btn.onclick=()=>{state.filter=btn.dataset.filter; document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active', b===btn)); renderList();});
    $('toggleLabels').onchange=e=>{state.showLabels=e.target.checked; renderPlan();};
    $('toggleOpenings').onchange=e=>{state.showOpenings=e.target.checked; renderPlan();};
    $('toggleLights').onchange=e=>{state.showLights=e.target.checked; renderPlan();};
    $('reviewImage').onchange=renderPlan;
    $('zoomIn').onclick=()=>zoom(.8); $('zoomOut').onclick=()=>zoom(1.25); $('zoomReset').onclick=resetView;
    document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=> state.addMode===btn.dataset.add ? stopAdd() : startAdd(btn.dataset.add));
    $('cancelAdd').onclick=stopAdd;
    $('copyJson').onclick=async()=>{
      const txt=exportData(); els.exportWrap.classList.remove('hidden'); els.exportText.value=txt;
      try{ await navigator.clipboard.writeText(txt); els.saveStatus.textContent='تم نسخ JSON. الصقه في المحادثة أو احتفظ به.'; }catch(_){ els.exportText.focus(); els.exportText.select(); els.saveStatus.textContent='حدد النص الظاهر وانسخه يدويًا.'; }
    };
    $('toggleExport').onclick=()=>{els.exportWrap.classList.toggle('hidden'); if(!els.exportWrap.classList.contains('hidden')) els.exportText.value=exportData();};
    $('deleteBtn').onclick=deleteSelected;
    els.form.addEventListener('input', updateFromForm);

    els.svg.addEventListener('click',evt=>{
      if(evt.target.closest('.item-group')) return;
      const p=svgPointFromEvent(evt);
      if(state.addMode) addAtPoint(p); else state.selectedId=null, renderPlan(), renderList(), els.editor.classList.add('hidden'), els.empty.classList.remove('hidden');
    });
    els.svg.addEventListener('pointerdown',evt=>{
      if(evt.target.closest('.item-group')) return;
      state.pan={id:evt.pointerId,x:evt.clientX,y:evt.clientY,vx:state.view.x,vy:state.view.y}; els.svg.setPointerCapture(evt.pointerId);
    });
    els.svg.addEventListener('pointermove',evt=>{
      if(!state.pan || evt.pointerId!==state.pan.id) return; evt.preventDefault();
      const rect=els.svg.getBoundingClientRect();
      state.view.x=state.pan.vx - ((evt.clientX-state.pan.x)/rect.width)*state.view.w;
      state.view.y=state.pan.vy - ((evt.clientY-state.pan.y)/rect.height)*state.view.h;
      constrainView(); applyView();
    },{passive:false});
    const stopPan=evt=>{ if(state.pan && evt.pointerId===state.pan.id){ try{els.svg.releasePointerCapture(evt.pointerId);}catch(_){} state.pan=null; } };
    els.svg.addEventListener('pointerup',stopPan); els.svg.addEventListener('pointercancel',stopPan); els.svg.addEventListener('lostpointercapture',()=>state.pan=null);
    els.svg.addEventListener('wheel',evt=>{ evt.preventDefault(); const p=svgPointFromEvent(evt); zoom(evt.deltaY<0 ? .85 : 1.18, p.x, p.y); }, {passive:false});
  }

  loadSaved(); bind(); renderStats(); renderList(); renderPlan(); applyView(); els.editor.classList.add('hidden'); els.empty.classList.remove('hidden');
})();
