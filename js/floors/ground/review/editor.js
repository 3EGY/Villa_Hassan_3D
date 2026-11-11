/*
 * In-scene architectural review for the USER'S actual ground.html renderer.
 * This file deliberately does not recreate the floor from scratch.
 * Existing Three.js meshes and 8 original lights remain the source of truth.
 */
(function(global){
'use strict';
const M=global.GroundReviewModel;
if(!M) throw new Error('GroundReviewModel is required');
const el=id=>document.getElementById(id);
const state={active:false,selected:null,filter:'all',addMode:null,priorHeight:1.35,priorXRay:false,frames:new Map(),pins:new Map(),ready:false};
const labels={window:'شباك',door:'باب',slidingGlass:'باب سحاب / زجاج',light:'إضاءة'};
const colors={window:'#50d5d7',door:'#ffc178',slidingGlass:'#c5a4ff',light:'#f4d46b'};
const originalMeshById=new Map();
let reviewWallGroup=null;
let originalWallLines=null;
let wallSignature=null;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
const finite=(v)=>typeof v==='number' && Number.isFinite(v);
const num=(id)=>el(id).value===''?null:Number(el(id).value);
const textValue=(id)=>el(id).value.trim();
const isOpening=item=>item&&item.kind!=='light';
let forceCounter=0;

function srcOpeningHeight(item){
    const sill=finite(item.sillCm)?item.sillCm/100:(item.kind==='window'?.45:item.kind==='slidingGlass'?.05:0);
    const h=finite(item.heightCm)?item.heightCm/100:(item.kind==='door'?Math.max(.45,currentWallHeight*.95):Math.max(.2,currentWallHeight-sill));
    return {sill,h,head:sill+h};
}
function labelRoom(roomId){return ZONE_SPECS[roomId]?.title||roomId||'غير محدد';}
function center(item){
    if(item.kind==='light')return new THREE.Vector3(item.x,item.y,item.z);
    const v=srcOpeningHeight(item);
    return new THREE.Vector3((item.x1+item.x2)/2,clamp(v.head*.7,.3,3.1),(item.z1+item.z2)/2);
}
function description(item){return `${item.id} · ${item.label||labels[item.kind]}`;}

function createPin(item){
    const btn=document.createElement('button');btn.type='button';btn.className='gr-pin';btn.dataset.kind=item.kind;
    btn.dataset.id=item.id;
    btn.innerHTML=`<span>${item.kind==='light'?'💡':item.kind==='window'?'▣':item.kind==='door'?'🚪':'◫'}</span><span></span>`;
    btn.lastElementChild.textContent=item.kind==='light'?(item.sourceIndex!=null?'L'+(item.sourceIndex+1):item.id):item.id;
    btn.title=description(item);
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();select(item.id);});
    el('ground-review-layer').appendChild(btn);
    state.pins.set(item.id,btn);
    return btn;
}
function refreshPins(){
    if(!state.ready||!state.active||!camera)return;
    const halfW=global.innerWidth*.5,halfH=global.innerHeight*.5;
    const inMenu=el('ground-review-panel').getBoundingClientRect();
    const eligible=new Set(M.items.filter(x=>state.filter==='all'||x.kind===state.filter).map(x=>x.id));
    for(const item of M.items){
        let btn=state.pins.get(item.id);
        if(!btn)btn=createPin(item);
        btn.dataset.status=item.status;
        btn.setAttribute('aria-pressed',String(item.id===state.selected));
        const p=center(item).project(camera);
        const xx=p.x*halfW+halfW,yy=-p.y*halfH+halfH;
        // Do not permit pins to block the editor or live behind the camera.
        const behind=p.z>1||p.z< -1 || !eligible.has(item.id);
        const occluded=inMenu.width>0 && xx>=inMenu.left-8 && xx<=inMenu.right+8 && yy>=inMenu.top-10 && yy<=inMenu.bottom+10;
        btn.hidden=behind||occluded||xx<12||xx>global.innerWidth-12||yy<25||yy>global.innerHeight-25;
        if(!btn.hidden){btn.style.left=xx+'px';btn.style.top=yy+'px';}
    }
}

function createRectMaterial(color,opacity=.83){
    return new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthTest:false,depthWrite:false,side:THREE.DoubleSide});
}
function shape(){
    const group=new THREE.Group();
    group.name='Review_Opening_Overlay';
    const baseMat=createRectMaterial('#4adbd5',.87);
    const curtainMat=createRectMaterial('#a98bd7',.75);
    const shutterMat=createRectMaterial('#aeb7c3',.83);
    const box=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m.clone());
    const frame={group};
    frame.left=box(.035,1,.07,baseMat);frame.right=box(.035,1,.07,baseMat);
    frame.top=box(1,.035,.07,baseMat);frame.bottom=box(1,.035,.07,baseMat);
    frame.curtainLeft=box(1,1,.025,curtainMat);frame.curtainRight=box(1,1,.025,curtainMat);
    frame.shutter=box(1,1,.035,shutterMat);
    group.add(frame.left,frame.right,frame.top,frame.bottom,frame.curtainLeft,frame.curtainRight,frame.shutter);
    structureGroup.add(group);
    return frame;
}
function recordSourceMeshes(){
    doorWindowMeshes.forEach(dw=>{if(dw.reviewId)originalMeshById.set(dw.reviewId,dw);});
    for(const item of M.items){
        if(isOpening(item)&&!originalMeshById.has(item.id)&&item.custom) createCustomOpening(item);
    }
}
function createCustomOpening(item){
    const geo=new THREE.BoxGeometry(1,1,.05);geo.translate(0,.5,0);
    const glass=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({color:0x77dbe9,transparent:true,opacity:.36,roughness:.09}));
    structureGroup.add(glass);
    const dw={mesh:glass,sill:0,sourceIndex:null,sourceWidthCm:item.widthCm||100,reviewId:item.id,custom:true};
    doorWindowMeshes.push(dw);originalMeshById.set(item.id,dw);
    return dw;
}
function drawOpening(item){
    const dw=originalMeshById.get(item.id);
    if(!dw)return;
    const w=clamp(item.widthCm,30,1000)/100;
    const hInfo=srcOpeningHeight(item);const {sill,h,head}=hInfo;
    const cx=(item.x1+item.x2)/2, cz=(item.z1+item.z2)/2;
    const angle=Math.atan2(item.z2-item.z1,item.x2-item.x1);
    const visualHeight=state.active? h: (finite(item.heightCm)?h:Math.max(.15,currentWallHeight-sill));
    dw.mesh.position.set(cx,sill,cz);
    dw.mesh.rotation.y=-angle+(item.kind==='door'?.50:0);
    dw.mesh.scale.x= w / ((dw.sourceWidthCm || w*100)/100);
    dw.mesh.scale.y=Math.max(.07, visualHeight)*(item.kind==='door'?.95:1);
    dw.mesh.visible=!(state.active&&item.status==='remove');
    if(item.status==='remove'&&!state.active&&item.custom) dw.mesh.visible=false;
    // Review overlay previews real dimensions, while original walls remain intact.
    let f=state.frames.get(item.id);
    if(!f){f=shape();state.frames.set(item.id,f);}
    f.group.visible=state.active;
    f.group.position.set(cx,0,cz);f.group.rotation.y=-angle;
    const tint=item.status==='remove'?'#f98181':item.status==='approved'?'#63e9a9':colors[item.kind]||'#50d5d7';
    for(const m of [f.left,f.right,f.top,f.bottom])m.material.color.set(tint);
    f.left.position.set(-w/2,sill+h/2,0);f.right.position.set(w/2,sill+h/2,0);
    f.left.scale.y=h;f.right.scale.y=h;
    f.top.position.set(0,head,0);f.bottom.position.set(0,sill,0);
    f.top.scale.x=w;f.bottom.scale.x=w;
    const t=clamp(item.openPercent,0,100)/100;
    const curW=Math.max(.002,w*.5*(1-t));
    const displayC=state.active && item.curtain && item.status!=='remove';
    f.curtainLeft.visible=f.curtainRight.visible=displayC;
    f.curtainLeft.scale.set(curW, h,1);f.curtainRight.scale.set(curW,h,1);
    f.curtainLeft.position.set(-w*.5+curW*.5,sill+h*.5, .21*(item.curtainSide||1));
    f.curtainRight.position.set(w*.5-curW*.5,sill+h*.5,.21*(item.curtainSide||1));
    f.shutter.visible=state.active && !!item.shutter && t<.995 && item.status!=='remove';
    f.shutter.scale.set(w, Math.max(.001,h*(1-t)),1);
    f.shutter.position.set(0,head-h*(1-t)*.5,.13*(item.shutterSide||-1));
}
function syncLight(item){
    const sl=smartLights.find(light=>light.id===item.id);
    if(!sl)return;
    const x=finite(item.x)?item.x:sl.pos.x;
    const y=finite(item.y)?item.y:sl.pos.y;
    const z=finite(item.z)?item.z:sl.pos.z;
    sl.pos.set(x,y,z);sl.pointLight.position.set(x,y,z);sl.fixtureGroup.position.set(x,y,z);
    sl.name=item.label||sl.name;sl.zone=item.roomId||sl.zone;
    sl.brightness=clamp(item.brightness??sl.brightness,0,100);sl.isOn=item.enabled!==false && sl.brightness>0;
    if(item.status==='remove'){
        sl.pointLight.intensity=0;sl.pointLight.visible=false;sl.fixtureGroup.visible=state.active;
        sl.haloMat.opacity=.03;
    }else{
        sl.pointLight.visible=true;sl.fixtureGroup.visible=true;
        applySmartLightState(sl);
    }
}
function ensureWallSegments(){
    if(originalWallLines)return originalWallLines;
    originalWallLines=[];
    for(const {body} of wallMeshes){
        const len=body.geometry.parameters.width;
        const a=-body.rotation.y;
        const dx=Math.cos(a)*len,dz=Math.sin(a)*len;
        const horizontal=Math.abs(dx)>=Math.abs(dz);
        const start=horizontal?body.position.x-dx*.5:body.position.z-dz*.5;
        const end=horizontal?body.position.x+dx*.5:body.position.z+dz*.5;
        const fixed=horizontal?body.position.z:body.position.x;
        originalWallLines.push({axis:horizontal?'h':'v',fixed,start:Math.min(start,end),end:Math.max(start,end),thickness:body.geometry.parameters.depth});
    }
    return originalWallLines;
}
function wallLineFor(item){
    const horizontal=Math.abs(item.x2-item.x1)>=Math.abs(item.z2-item.z1);
    const fixed=horizontal?(item.z1+item.z2)*.5:(item.x1+item.x2)*.5;
    const center=horizontal?(item.x1+item.x2)*.5:(item.z1+item.z2)*.5;
    const half=clamp(item.widthCm,30,1000)/200;
    return {axis:horizontal?'h':'v',fixed,start:center-half,end:center+half,item};
}
function intervalUnion(intervals){
    if(!intervals.length)return [];
    const sorted=intervals.slice().sort((a,b)=>a.start-b.start);
    const result=[];
    for(const it of sorted){
        const last=result[result.length-1];
        if(last&&it.start<=last.end+.025){last.end=Math.max(last.end,it.end);last.thickness=Math.max(last.thickness,it.thickness||.18);}
        else result.push({start:it.start,end:it.end,thickness:it.thickness||.18});
    }
    return result;
}
function wallPiece(group,axis,fixed,a,b,y0,y1,thickness,cap){
    const length=b-a,height=y1-y0;
    if(length<.015||height<.015)return;
    const body=new THREE.Mesh(new THREE.BoxGeometry(length,height,thickness),wallMat);
    body.rotation.y=axis==='h'?0:-Math.PI/2;
    if(axis==='h')body.position.set((a+b)/2,(y0+y1)/2,fixed);
    else body.position.set(fixed,(y0+y1)/2,(a+b)/2);
    body.receiveShadow=true;group.add(body);
    if(cap){
        const top=new THREE.Mesh(new THREE.BoxGeometry(length+.007,.025,thickness+.008),wallCapMat);
        top.position.copy(body.position);top.position.y=y1+.013;top.rotation.y=body.rotation.y;group.add(top);
    }
}
function rebuildReviewWalls(){
    const signature=state.active
        ? 'on:'+currentWallHeight+':'+JSON.stringify(M.items.filter(isOpening).map(x=>[x.id,x.status,x.x1,x.z1,x.x2,x.z2,x.widthCm,x.sillCm,x.heightCm]))
        : 'off';
    if(signature===wallSignature)return;
    wallSignature=signature;
    // Modify actual wall holes in the REVIEW rendering, not a separate SVG plan.
    if(!reviewWallGroup){reviewWallGroup=new THREE.Group();reviewWallGroup.name='Ground_Review_Dynamic_Walls';structureGroup.add(reviewWallGroup);}
    for(const child of [...reviewWallGroup.children]){reviewWallGroup.remove(child);child.geometry?.dispose?.();}
    reviewWallGroup.visible=state.active;
    for(const w of wallMeshes){w.body.visible=!state.active;w.cap.visible=!state.active;}
    if(!state.active)return;
    const lines=new Map();
    const key=(axis,fixed)=>axis+':'+Math.round(fixed*100)/100;
    const register=(line,category)=>{
        const id=key(line.axis,line.fixed);
        if(!lines.has(id))lines.set(id,{axis:line.axis,fixed:line.fixed,walls:[],source:[],changes:[]});
        lines.get(id)[category].push(line);
    };
    ensureWallSegments().forEach(x=>register(x,'walls'));
    M.getSourceOpenings().forEach(x=>register(wallLineFor(x),'source'));
    M.items.filter(x=>isOpening(x)&&x.status!=='remove').forEach(x=>register(wallLineFor(x),'changes'));
    const H=currentWallHeight;
    for(const line of lines.values()){
        const base=intervalUnion([...line.walls,...line.source,...line.changes]);
        const gaps=line.changes.slice().sort((a,b)=>a.start-b.start);
        for(const run of base){
            let cursor=run.start;
            for(const gap of gaps){
                if(gap.end<=run.start+.001||gap.start>=run.end-.001)continue;
                const a=Math.max(gap.start,run.start),b=Math.min(gap.end,run.end);
                if(a>cursor+.01)wallPiece(reviewWallGroup,line.axis,line.fixed,cursor,a,0,H,run.thickness,true);
                const data=gap.item;
                const sill=finite(data.sillCm)?data.sillCm/100:null;
                const head=finite(data.heightCm)&&sill!=null?(data.sillCm+data.heightCm)/100:null;
                if(sill!=null && sill>.01)wallPiece(reviewWallGroup,line.axis,line.fixed,a,b,0,Math.min(H,sill),run.thickness,false);
                if(head!=null && head<H-.01)wallPiece(reviewWallGroup,line.axis,line.fixed,a,b,Math.max(0,head),H,run.thickness,true);
                cursor=Math.max(cursor,b);
            }
            if(cursor<run.end-.01)wallPiece(reviewWallGroup,line.axis,line.fixed,cursor,run.end,0,H,run.thickness,true);
        }
    }
}

function refresh3D(){
    if(!state.ready)return;
    for(const item of M.items){if(isOpening(item))drawOpening(item);else syncLight(item);}
    rebuildReviewWalls();
    refreshPins();
}
function list(){
    const prev=state.selected;
    const selectEl=el('gr-select');
    selectEl.replaceChildren();
    selectEl.append(new Option('اختر بابًا / شباكًا / إضاءة',''));
    const available=M.items.filter(x=>state.filter==='all'||x.kind===state.filter);
    for(const item of available){
        const suffix=item.status==='remove'?' · إلغاء':item.status==='approved'?' · معتمد':item.status==='add'?' · جديد':'';
        selectEl.add(new Option(`${item.id} · ${item.label||labels[item.kind]}${suffix}`,item.id));
    }
    selectEl.value=available.some(x=>x.id===prev)?prev:'';
    el('gr-stats').innerHTML=[
        ['الشبابيك',M.items.filter(x=>x.kind==='window').length],
        ['الأبواب',M.items.filter(x=>x.kind==='door'||x.kind==='slidingGlass').length],
        ['الإضاءة',M.items.filter(x=>x.kind==='light').length],
        ['المعتمد',M.items.filter(x=>x.status==='approved').length],
    ].map(([k,n])=>`<span class="gr-stat">${k} <b>${n}</b></span>`).join('');
}
function renderElevation(item){
    const svg=el('gr-elevation');
    if(!svg || !isOpening(item))return;
    const sill=finite(item.sillCm)?item.sillCm:0;
    const height=finite(item.heightCm)?item.heightCm:180;
    const head=sill+height;
    const unit=110/Math.max(310,head+30);
    const floorY=136, topY=floorY-head*unit, sillY=floorY-sill*unit;
    const color=item.kind==='door'?'#ffc178':item.kind==='slidingGlass'?'#c5a4ff':'#61d7de';
    const unknown=!finite(item.heightCm)||!finite(item.sillCm);
    const text=(x,y,t,align='middle')=>`<text x="${x}" y="${y}" fill="#c5e0ec" font-size="10" text-anchor="${align}" font-family="Cairo,Arial">${t}</text>`;
    svg.innerHTML=`
        <path d="M35 12 H267 V136 H35Z" fill="rgba(39,62,74,.29)" stroke="#476578" stroke-width="1"/>
        <rect x="102" y="${topY}" width="104" height="${Math.max(1,sillY-topY)}" fill="${unknown?'rgba(99,141,151,.13)':'rgba(76,189,207,.22)'}" stroke="${color}" stroke-width="2" ${unknown?'stroke-dasharray="5 4"':''}/>
        <line x1="102" y1="${topY}" x2="206" y2="${sillY}" stroke="${color}" stroke-opacity=".35"/>
        <line x1="23" y1="136" x2="275" y2="136" stroke="#d6e5eb" stroke-width="2"/>
        <path d="M81 ${sillY} H71 V136 H81 M223 ${topY} H233 V${sillY} H223" fill="none" stroke="#e1bf85" stroke-width="1.5"/>
        ${text(60, (sillY+136)/2+3,finite(item.sillCm)?sill+' سم':'؟')}
        ${text(249,(topY+sillY)/2+3,finite(item.heightCm)?height+' سم':'؟')}
        ${text(155,153,'منسوب الأرض ±0.00')}
        ${text(155,20,finite(item.sillCm)&&finite(item.heightCm)?'قمة الفتحة '+head+' سم':'الارتفاع غير معتمد')}`;
}

function select(id){
    if(!state.active)toggle(true);
    const item=M.get(id);if(!item)return;
    state.selected=id;
    if(state.filter!=='all'&&state.filter!==item.kind){state.filter='all';el('gr-filter').value='all';}
    list(); el('gr-select').value=id;
    el('gr-review-empty').hidden=true;el('gr-review-form').hidden=false;
    el('gr-item-title').textContent=description(item);
    el('gr-approval').textContent=item.status==='approved'?'معتمد':item.status==='remove'?'مقترح للإلغاء':item.status==='add'?'إضافة مقترحة':'غير معتمد';
    el('gr-name').value=item.label||'';el('gr-status').value=item.status==='pending'?'pending':item.status;
    const roomList=el('gr-room');roomList.replaceChildren();
    for(const [rid,rspec] of Object.entries(ZONE_SPECS))if(rid!=='overview')roomList.add(new Option(rspec.title,rid));
    roomList.value=item.roomId||'overview';
    el('gr-note').value=item.note||'';
    el('gr-opening-fields').hidden=!isOpening(item);el('gr-opening-section').hidden=!isOpening(item);
    el('gr-light-fields').hidden=isOpening(item);
    el('gr-delete-item').hidden=!item.custom;
    if(isOpening(item)){
        el('gr-width').value=item.widthCm??'';
        el('gr-sill').value=finite(item.sillCm)?item.sillCm:'';
        el('gr-height').value=finite(item.heightCm)?item.heightCm:'';
        el('gr-head').value=finite(item.sillCm)&&finite(item.heightCm)?item.sillCm+item.heightCm:'';
        el('gr-curtain').checked=!!item.curtain;el('gr-shutter').checked=!!item.shutter;
        el('gr-curtain-side').value=String(item.curtainSide||1);el('gr-shutter-side').value=String(item.shutterSide||-1);
        el('gr-open-slider').value=item.openPercent??50;el('gr-open-label').textContent=(item.openPercent??50)+'%';
        for(const coord of ['x1','z1','x2','z2'])el('gr-'+coord).value=Number(item[coord]).toFixed(2);
        const original=originalMeshById.get(item.id);
        const gapCm=Math.round(original?.sourceWidthCm||item.widthCm||0);
        let warning=`عرض ${gapCm} سم من هندسة مجسمك الأصلي؛ منسوب الشباك وارتفاعه يحتاجان اعتمادًا منك.`;
        if(item.id==='GW06')warning+=' تنبيه: وصف الكود يقول 328 سم بينما المسافة الهندسية 260 سم.';
        if(Math.abs((item.widthCm||0)-gapCm)>3)warning+=' العرض المعدّل معاينة على المجسم؛ قص الجدار نفسه يتم بعد اعتماد الفتحات.';
        el('gr-source-warning').textContent=warning;
        renderElevation(item);
    }else{
        el('gr-light-x').value=Number(item.x).toFixed(2);el('gr-light-z').value=Number(item.z).toFixed(2);
        el('gr-light-y').value=Number(item.y).toFixed(2);el('gr-brightness').value=item.brightness??90;
    }
    refresh3D();
}
function readCurrentForm(){
    const item=M.get(state.selected);if(!item)return;
    item.label=textValue('gr-name')||item.label;item.roomId=el('gr-room').value;item.status=el('gr-status').value;item.note=textValue('gr-note');
    if(isOpening(item)){
        if(num('gr-width')!=null)item.widthCm=clamp(num('gr-width'),30,1000);
        item.sillCm=num('gr-sill')!=null?clamp(num('gr-sill'),0,450):null;
        item.heightCm=num('gr-height')!=null?clamp(num('gr-height'),30,450):null;
        item.curtain=el('gr-curtain').checked;item.shutter=el('gr-shutter').checked;
        item.curtainSide=Number(el('gr-curtain-side').value)||1;item.shutterSide=Number(el('gr-shutter-side').value)||-1;
        item.openPercent=clamp(num('gr-open-slider'),0,100);
        for(const coord of ['x1','z1','x2','z2'])if(num('gr-'+coord)!=null)item[coord]=num('gr-'+coord);
        const head=finite(item.sillCm)&&finite(item.heightCm)?item.sillCm+item.heightCm:null;
        el('gr-head').value=head??'';
        el('gr-open-label').textContent=item.openPercent+'%';
        renderElevation(item);
        if(finite(head)&&head>310){el('gr-source-warning').textContent='تنبيه: قمة الفتحة أعلى من 310 سم، راجع ارتفاع الجدار الفعلي قبل الاعتماد.';}
    }else{
        item.x=num('gr-light-x')??item.x;item.z=num('gr-light-z')??item.z;item.y=clamp(num('gr-light-y')??item.y,.1,6);
        item.brightness=clamp(num('gr-brightness')??item.brightness,0,100);
        item.enabled=item.brightness>0;
    }
    const ok=M.save();el('gr-saved').textContent=ok?'✓ محفوظ محليًا':'انسخ JSON (تعذر الحفظ)';
    el('gr-approval').textContent=item.status==='approved'?'معتمد':item.status==='remove'?'مقترح للإلغاء':item.status==='add'?'إضافة مقترحة':'غير معتمد';
    refresh3D();
    // Keep the user's in-progress input focus; do not rerender the whole form.
    list();el('gr-select').value=item.id;
}
function focusSelected(){
    const item=M.get(state.selected);if(!item)return;
    const c=center(item);
    const target=new THREE.Vector3(c.x,Math.min(1.4,c.y),c.z);
    const endPos=new THREE.Vector3(c.x+2.0,Math.max(4.5,c.y+2.5),c.z+3.1);
    cameraAnim={startPos:camera.position.clone(),endPos,startTarget:controls.target.clone(),endTarget:target,progress:0};
}
function initAddButton(mode){
    state.addMode=mode;
    for(const b of document.querySelectorAll('[data-gr-add]'))b.classList.toggle('gr-add-active',b.dataset.grAdd===mode);
    el('gr-cancel-add').hidden=false;
    el('gr-add-tip').textContent=mode==='light'?'اضغط على الأرضية في المشهد لتحديد مكان لمبة جديدة.':'اضغط قرب الجدار المطلوب من أعلى؛ سنضع فتحة مقترحة ونفتحها لتعديل عرضها.';
    el('gr-info-tip').textContent=el('gr-add-tip').textContent;
}
function cancelAdd(){
    state.addMode=null;
    for(const b of document.querySelectorAll('[data-gr-add]'))b.classList.remove('gr-add-active');
    el('gr-cancel-add').hidden=true;
    el('gr-add-tip').textContent='اختر نوع الإضافة ثم اضغط موقعها على المجسم. الأبواب والشبابيك الجديدة تنجذب لأقرب جدار.';
    el('gr-info-tip').textContent='اضغط على علامة شباك أو باب أو لمبة داخل المجسم. المعاينة قابلة للتعديل وليست اعتمادًا نهائيًا.';
}
function closestWallPoint(position){
    scene.updateMatrixWorld(true);
    let best=null,dist=Infinity;
    for(const w of wallMeshes){
        const m=w.body;
        const length=m.geometry.parameters.width;
        const A=m.localToWorld(new THREE.Vector3(-length/2,0,0));
        const B=m.localToWorld(new THREE.Vector3(length/2,0,0));
        const dx=B.x-A.x,dz=B.z-A.z,len2=dx*dx+dz*dz;
        if(len2<.0001)continue;
        const t=clamp(((position.x-A.x)*dx+(position.z-A.z)*dz)/len2,0,1);
        const px=A.x+t*dx,pz=A.z+t*dz;
        const d=Math.hypot(position.x-px,position.z-pz);
        if(d<dist){dist=d;best={x:px,z:pz,dx,dz,length, t};}
    }
    return dist<=1.75?best:null;
}
function placeNewFromRay(raycaster){
    const floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const point=new THREE.Vector3();
    if(!raycaster.ray.intersectPlane(floorPlane,point))return false;
    if(state.addMode==='light'){
        const id=M.nextId('light');
        const item={id,kind:'light',label:'إضاءة جديدة',roomId:'grandMajlis',x:+point.x.toFixed(2),y:1.85,z:+point.z.toFixed(2),brightness:90,enabled:true,status:'add',approved:false,note:'نقطة مضافة من المجسم للمراجعة',custom:true};
        M.add(item);addGroundSmartLight({id,name:item.label,zone:item.roomId,x:item.x,y:item.y,z:item.z,color:'#ffb454',maxI:2,dist:8});
        addGroundReviewLightPin(smartLights[smartLights.length-1]);
        createPin(item);cancelAdd();list();select(id);return true;
    }
    const wp=closestWallPoint(point);
    if(!wp){el('gr-add-tip').textContent='اضغط أقرب إلى خط جدار واضح لإضافة الباب أو الشباك.';return true;}
    const proposedWidth=Math.min(1.0,Math.max(.4,wp.length*.7));
    const hx=wp.dx/wp.length*proposedWidth*.5,hz=wp.dz/wp.length*proposedWidth*.5;
    const id=M.nextId(state.addMode);
    const item={id,kind:state.addMode,label:'فتحة جديدة للمراجعة',roomId:'receptionLounge',x1:+(wp.x-hx).toFixed(2),z1:+(wp.z-hz).toFixed(2),x2:+(wp.x+hx).toFixed(2),z2:+(wp.z+hz).toFixed(2),widthCm:Math.round(proposedWidth*100),sillCm:state.addMode==='door'?0:null,heightCm:null,status:'add',approved:false,curtain:false,shutter:false,curtainSide:1,shutterSide:-1,openPercent:50,note:'موضع مقترح فوق جدار قائم؛ يلزم قص الجدار بعد الاعتماد',custom:true};
    M.add(item);createCustomOpening(item);createPin(item);cancelAdd();list();select(id);return true;
}
function handleSceneTap(evt,raycaster,pointer,hits){
    if(!state.active)return false;
    if(state.addMode)return placeNewFromRay(raycaster);
    const rayHits=raycaster.intersectObjects([...originalMeshById.values()].map(v=>v.mesh),false);
    if(rayHits.length){
        const nearest=rayHits[0].object;
        const dw=[...originalMeshById.values()].find(x=>x.mesh===nearest);
        if(dw?.reviewId){select(dw.reviewId);return true;}
    }
    const lightHit=hits.find(h=>h.object.userData?.isSmartBulb);
    if(lightHit?.object.userData?.smartLight){select(lightHit.object.userData.smartLight.id);return true;}
    // Swallow old furniture popovers while architectural review is enabled.
    return true;
}
function updatePins(){refreshPins();}
function toggle(value){
    if(!state.ready)return;
    const next=typeof value==='boolean'?value:!state.active;
    if(next===state.active)return;
    if(next){
        state.priorHeight=currentWallHeight;state.priorXRay=isWallXRay;
        state.active=true;
        document.body.classList.add('gr-review-active');
        el('ground-review-panel').hidden=false;el('ground-review-layer').hidden=false;el('gr-info-tip').hidden=false;
        el('ground-review-toggle').setAttribute('aria-pressed','true');
        el('ground-review-toggle').textContent='✓ وضع المراجعة ثلاثية الأبعاد';
        hideContextCard();closeAllPopovers();closeRadialLightMenu();
        setWallHeightPreset(3.1);toggleWallXRay(true);
        if(!state.selected)select('GW01');
    }else{
        state.active=false;cancelAdd();
        document.body.classList.remove('gr-review-active');
        el('ground-review-panel').hidden=true;el('ground-review-layer').hidden=true;el('gr-info-tip').hidden=true;
        el('ground-review-toggle').setAttribute('aria-pressed','false');
        el('ground-review-toggle').textContent='◫ مراجعة 3D · الفتحات والإضاءة';
        setWallHeightPreset(state.priorHeight);toggleWallXRay(state.priorXRay);
    }
    refresh3D();
}
function download(){
    const payload=M.export(), blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Villa_Hassan_Ground_Floor_Review.json';a.click();URL.revokeObjectURL(url);
}
function importFile(file){
    if(!file)return;
    file.text().then(txt=>{
        const loaded=JSON.parse(txt);
        if(loaded.schema!=='villa-ground-review-v2'||loaded.floorId!=='ground'||!Array.isArray(loaded.items))throw new Error('ملف مراجعة غير متوافق');
        if(loaded.items.length>400)throw new Error('ملف كبير وغير متوقع');
        // Retain the exact source order & kind; only import values with matching source ids.
        const originalIds=M.items.filter(x=>!x.custom).map(x=>x.id);
        const byId=new Map(loaded.items.map(x=>[x.id,x]));
        if(originalIds.some(id=>!byId.has(id)))throw new Error('الملف لا يحتوي جميع عناصر المجسم الأصلي');
        const imported=M.items.filter(x=>!x.custom).map(x=>({ ...x,...byId.get(x.id),id:x.id,kind:x.kind,custom:undefined }));
        const customs=loaded.items.filter(x=>x.custom&&['door','window','slidingGlass','light'].includes(x.kind)&&typeof x.id==='string');
        M.items.splice(0,M.items.length,...imported,...customs);
        M.save();location.reload();
    }).catch(error=>alert('تعذر الاستيراد: '+error.message));
}
function resetOne(){
    const target=M.get(state.selected);if(!target)return;
    if(target.custom){deleteCustom();return;}
    M.resetItem(target.id);refresh3D();select(target.id);
}
function deleteCustom(){
    const item=M.get(state.selected);if(!item?.custom)return;
    const dw=originalMeshById.get(item.id);
    if(dw){structureGroup.remove(dw.mesh);originalMeshById.delete(item.id);doorWindowMeshes.splice(doorWindowMeshes.indexOf(dw),1);}
    const f=state.frames.get(item.id);if(f){structureGroup.remove(f.group);state.frames.delete(item.id);}
    const pin=state.pins.get(item.id);if(pin){pin.remove();state.pins.delete(item.id);}
    if(item.kind==='light'){
        const idx=smartLights.findIndex(x=>x.id===item.id);
        if(idx>=0){const sl=smartLights[idx];scene.remove(sl.pointLight,sl.fixtureGroup);sl.pinEl?.remove();smartLights.splice(idx,1);bulbPinElements.splice(bulbPinElements.indexOf(sl),1);}
    }
    M.remove(item.id);state.selected=null;el('gr-review-form').hidden=true;el('gr-review-empty').hidden=false;list();refresh3D();
}
function bind(){
    el('ground-review-toggle').addEventListener('click',()=>toggle());
    el('gr-close').addEventListener('click',()=>toggle(false));
    el('gr-filter').addEventListener('change',e=>{state.filter=e.target.value;list();refreshPins();});
    el('gr-select').addEventListener('change',e=>{if(e.target.value)select(e.target.value);});
    for(const [btn,offset] of [['gr-prev',-1],['gr-next',1]])el(btn).addEventListener('click',()=>{
        const options=[...el('gr-select').options].map(o=>o.value).filter(Boolean);
        if(!options.length)return;
        const idx=options.indexOf(state.selected);select(options[(idx+offset+options.length)%options.length]);
    });
    el('gr-top-view').addEventListener('click',()=>setCameraView('top'));
    el('gr-overview').addEventListener('click',()=>focusZone('overview'));
    el('gr-focus').addEventListener('click',focusSelected);
    for(const target of el('gr-review-form').querySelectorAll('input,select,textarea')){
        if(target.readOnly)continue;
        target.addEventListener(target.type==='checkbox'||target.tagName==='SELECT'?'change':'input',readCurrentForm);
    }
    el('gr-reset-item').addEventListener('click',resetOne);
    el('gr-delete-item').addEventListener('click',deleteCustom);
    for(const btn of document.querySelectorAll('[data-gr-add]'))btn.addEventListener('click',()=>{
        const mode=btn.dataset.grAdd;
        if(state.addMode===mode)cancelAdd();else initAddButton(mode);
    });
    el('gr-cancel-add').addEventListener('click',cancelAdd);
    el('gr-download').addEventListener('click',download);
    el('gr-import').addEventListener('click',()=>el('gr-import-file').click());
    el('gr-import-file').addEventListener('change',e=>importFile(e.target.files[0]));
    el('gr-reset-all').addEventListener('click',()=>{
        if(confirm('إلغاء كل تعديلات المراجعة على هذا المتصفح والرجوع للموديل الأصلي؟')){
            M.restoreDefaults();location.reload();
        }
    });
}
function init(){
    if(state.ready)return;
    state.ready=true;
    recordSourceMeshes();
    ensureWallSegments();
    for(const item of M.items)createPin(item);
    bind();list();refresh3D();
    if(new URLSearchParams(location.search).get('review')==='1')toggle(true);
}
global.VillaGroundReview=Object.freeze({init,toggle,select,refresh3D,updatePins,handleSceneTap,
    get isActive(){return state.active;},
    get selectedId(){return state.selected;}});
})(window);
