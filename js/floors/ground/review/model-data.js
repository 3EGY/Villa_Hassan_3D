/*
 * Opening and lighting records extracted from the user's ORIGINAL ground.html.
 * Width and plan coordinates are from the JS model, NOT construction approvals.
 * Vertical heights are intentionally null until measured and approved.
 */
(function(global){
  'use strict';
  const rawOpenings=[
    ['GD01','door','باب خدمات الضيوف / الاستقبال','receptionLounge',-3.90,-2.75,-3.90,-1.95],
    ['GS01','slidingGlass','مدخل زجاجي علوي (200 سم)','receptionLounge',-3.45,-6.20,-1.45,-6.20],
    ['GW01','window','شباك المجلس العلوي الأول','grandMajlis',0.90,-6.20,2.75,-6.20],
    ['GW02','window','شباك المجلس العلوي الثاني','grandMajlis',4.10,-6.20,5.45,-6.20],
    ['GW03','window','شباك المجلس الجانبي الأيمن','grandMajlis',6.25,-4.40,6.25,-2.65],
    ['GS02','slidingGlass','باب سحاب بين المجلس والسفرة','diningRoom',-0.45,-1.80,1.55,-1.80],
    ['GW04','window','شباك المطبخ فوق الحوض','kitchen',-6.50,-0.65,-6.50,0.65],
    ['GW05','window','شباك السفرة الجانبي','diningRoom',2.90,-0.95,2.90,1.15],
    ['GD02','door','باب المطبخ السفلي','kitchen',-3.15,1.80,-2.00,1.80],
    ['GS03','slidingGlass','باب سحاب بين السفرة والبهو','diningRoom',-0.45,1.80,1.55,1.80],
    ['GW06','window','شباك المعيشة العلوية','familyLiving',3.25,2.45,5.85,2.45],
    ['GW07','window','شباك المعيشة خلف الكنبة','familyLiving',1.15,6.85,4.55,6.85],
    ['GD03','door','باب المغاسل / حمام الضيوف','stairsWash',-5.35,3.35,-4.65,3.35]
  ];
  const openingDefaults=rawOpenings.map(([id,kind,label,roomId,x1,z1,x2,z2],index)=>({
    id,kind,label,roomId,x1,z1,x2,z2,
    widthCm:Math.round(Math.hypot(x2-x1,z2-z1)*100),
    heightCm:null,sillCm:kind==='door'?0:null,
    status:'pending', curtain:false, shutter:false,
    curtainSide:1,shutterSide:-1,openPercent:50,
    note:id==='GW06'?'ملاحظة مراجعة: الوصف في الكود يقول 328 سم، لكن هندسة المجسم تعرض 260 سم. يرجى التأكيد.':'',
    sourceIndex:index,source:'ground.html / buildAllWallsAndOpenings',approved:false,
  }));
  const initialLights=[
    ['bulb_grandMajlis','ثريا المجلس الكبير','grandMajlis',2.35,1.85,-4.10],
    ['bulb_reception','لمبة بهو الاستقبال','receptionLounge',-1.65,1.80,-4.10],
    ['bulb_topWash','لمبة المغاسل العلوية','receptionLounge',-5.40,1.75,-3.60],
    ['bulb_dining','ثريا طاولة الطعام','diningRoom',0.55,1.80,-0.05],
    ['bulb_kitchen','إضاءة جزيرة المطبخ','kitchen',-4.15,1.80,-0.05],
    ['bulb_familyLiving','ثريا المعيشة العائلية','familyLiving',3.35,1.85,4.65],
    ['bulb_lobbyPartition','إضاءة الموزع والحوض','lobbyPartition',0.25,1.75,4.25],
    ['bulb_stairsWash','لمبة الدرج والمغاسل','stairsWash',-4.15,1.85,4.65]
  ].map(([id,label,roomId,x,y,z],index)=>({
    id,kind:'light',label,roomId,x,y,z,brightness:90,enabled:true,
    status:'pending',approved:false,note:'',sourceIndex:index,source:'ground.html / setupLighting'
  }));
  const key='villa-hassan-ground-original-review-v2';
  const clone=o=>JSON.parse(JSON.stringify(o));
  const pristine=clone([...openingDefaults,...initialLights]);
  const items=[...openingDefaults,...initialLights];
  let loaded=false;
  function load(){
    if(loaded) return;
    loaded=true;
    try{
      const raw=localStorage.getItem(key);if(!raw)return;
      const saved=JSON.parse(raw);
      if(saved.version!==2 || !Array.isArray(saved.items))return;
      const byId=new Map(saved.items.map(v=>[v.id,v]));
      for(const item of items){
        const prev=byId.get(item.id);if(prev && prev.kind===item.kind){
          const original=clone(item);Object.assign(item,prev,{sourceIndex:original.sourceIndex,source:original.source,kind:original.kind,id:original.id});
        }
      }
      for(const v of saved.items){
        if(v?.custom===true && !items.some(t=>t.id===v.id) && ['door','window','slidingGlass','light'].includes(v.kind)) items.push(v);
      }
    }catch(e){ console.warn('تعذر قراءة نسخة المراجعة المحلية',e); }
  }
  function save(){
    try{localStorage.setItem(key,JSON.stringify({version:2,items}));return true;}catch(e){console.warn('تعذر الحفظ المحلي',e);return false;}
  }
  function get(id){return items.find(v=>v.id===id)||null;}
  function getByIndex(index){return items.find(v=>v.kind!=='light' && v.sourceIndex===index)||null;}
  function getLight(id){return items.find(v=>v.kind==='light'&&v.id===id)||null;}
  function nextId(kind){
    const prefix=kind==='window'?'GW':kind==='door'?'GD':kind==='slidingGlass'?'GS':'GL';
    let i=1;while(items.some(v=>v.id===prefix+String(i).padStart(2,'0')))i++;
    return prefix+String(i).padStart(2,'0');
  }
  function add(item){
    if(get(item.id))throw new Error('Duplicate item');
    items.push(item);save();return item;
  }
  function remove(id){
    const index=items.findIndex(x=>x.id===id && x.custom);
    if(index<0)return false;
    items.splice(index,1);save();return true;
  }
  function resetItem(id){
    const item=get(id),original=pristine.find(v=>v.id===id);
    if(!item||!original)return false;
    for(const k of Object.keys(item))delete item[k];
    Object.assign(item,clone(original));save();return true;
  }
  function restoreDefaults(){
    localStorage.removeItem(key);
    items.splice(0,items.length,...clone(pristine));
    save();
  }
  load();
  global.GroundReviewModel={items,get,getByIndex,getLight,getSourceOpenings:()=>clone(pristine.filter(x=>x.kind!=='light')),nextId,add,remove,save,resetItem,restoreDefaults,storageKey:key,export(){return {schema:'villa-ground-review-v2',floorId:'ground',source:'user-ground.html',version:2,units:'m, cm, %',exportedAt:new Date().toISOString(),items:clone(items)};}};
})(window);
