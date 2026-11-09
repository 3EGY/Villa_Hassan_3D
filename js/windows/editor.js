/** Window review UI. Runs on both pages after its markup exists. */

  (()=>{
    const root=document.getElementById('villa-window-review');
    const $=key=>root.querySelector('[data-wr="'+key+'"]');
    const specs=VILLA_WINDOW_CONFIG.specs;
    const {reference,revision,storageKey:key}=VILLA_WINDOW_CONFIG;
    const approved=VILLA_WINDOW_CONFIG.approved;
    let values=JSON.parse(JSON.stringify(approved)),selected=0,view={x:0,y:0,w:774,h:829},storageAvailable=true,drag=null;
    const valid=v=>v&&Number.isFinite(v.sillCm)&&v.sillCm>=0&&v.sillCm<=400&&Number.isFinite(v.heightCm)&&v.heightCm>=20&&v.heightCm<=400&&v.sillCm+v.heightCm<=500;
    try{const old=JSON.parse(localStorage.getItem(key)||'{}');if(old.reference===reference&&old.revision===revision&&old.windows&&typeof old.windows==='object')specs.forEach(w=>{const v=old.windows[w.id];if(v&&typeof v==='object')values[w.id]={...approved[w.id],...v};});}catch(_){storageAvailable=false;}
    const buttons=[];
    specs.forEach((w,i)=>{
      const opt=document.createElement('option');opt.value=i;opt.textContent=w.id+' · '+w.name;$('choice').append(opt);
      const b=document.createElement('button');b.type='button';b.className='wr-pin cursor-interaction';b.textContent=w.replaces?'W1+W2':w.id;if(w.replaces){b.style.width='70px';b.style.borderRadius='22px';}b.setAttribute('aria-label',w.id+' '+w.name);b.onclick=()=>select(i);$('pins').append(b);buttons.push(b);
    });
    function drawMap(){
      $('plan').setAttribute('viewBox',[view.x,view.y,view.w,view.h].join(' '));
      $('marks').innerHTML='<rect x="388" y="130" width="122" height="16" fill="#fff"/><path d="M388 132H405 M492 132H510 M388 144H405 M492 144H510" stroke="#8a9255" stroke-width="1.5"/>' + specs.map((w,i)=>{const half=w.width/(2*100*(2.47/108)),horizontal=w.axis==='x';return '<line x1="'+w.px+'" y1="'+w.py+'" x2="'+w.label[0]+'" y2="'+w.label[1]+'" stroke="#287e80" stroke-width="1.5"/><rect x="'+(horizontal?w.px-half:w.px-6)+'" y="'+(horizontal?w.py-6:w.py-half)+'" width="'+(horizontal?half*2:12)+'" height="'+(horizontal?12:half*2)+'" fill="'+(i===selected?'#136f7240':'#4ca7aa20')+'" stroke="#136f72" stroke-width="'+(i===selected?3:1.5)+'"/>';}).join('');
      specs.forEach((w,i)=>{const bx=(w.label[0]-view.x)/view.w,by=(w.label[1]-view.y)/view.h;buttons[i].style.left=bx*100+'%';buttons[i].style.top=by*100+'%';buttons[i].hidden=bx<0||bx>1||by<0||by>1;buttons[i].setAttribute('aria-pressed',i===selected);buttons[i].dataset.filled=!!valid(values[w.id]);});
      $('out').disabled=view.w>=774;
    }
    function drawElevation(){
      const spec=specs[selected],v=values[spec.id]||{},complete=valid(v),s=complete?v.sillCm:90,h=complete?v.heightCm:120;
      const svg=$('elevation'),width=Math.max(244,svg.clientWidth||280),height=220,left=48,right=width-70,ground=186,scale=148/Math.max(310,s+h+30),bottom=ground-s*scale,top=ground-(s+h)*scale;
      const text=(x,y,str,anchor='middle')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'">'+str+'</text>';
      svg.setAttribute('viewBox','0 0 '+width+' '+height);
      svg.innerHTML='<path class="wall" d="M'+(left-12)+' 24H'+(right+12)+'V'+ground+'H'+(left-12)+'Z"/><rect class="glass '+(complete?'':'unknown')+'" x="'+left+'" y="'+top+'" width="'+(right-left)+'" height="'+(bottom-top)+'"/><line class="guide" x1="'+(left+(right-left)/2)+'" x2="'+(left+(right-left)/2)+'" y1="'+top+'" y2="'+bottom+'"/><line class="guide" x1="15" x2="'+(width-12)+'" y1="'+ground+'" y2="'+ground+'"/><path class="guide" d="M'+(right+16)+' '+top+'h8v'+(bottom-top)+'h-8M'+(left-18)+' '+bottom+'h-8v'+(ground-bottom)+'h8"/>'+text(right+28,(top+bottom)/2+5,complete?h+'':'—','start')+text(left-31,(bottom+ground)/2+5,complete?s+'':'—','end')+text((left+right)/2,ground+23,'منسوب الأرض ±0.00')+text((left+right)/2,17,complete?'أعلى الفتحة: '+(s+h)+' سم':'الارتفاعات لم تُحدد');
      $('elevation-label').textContent=complete?'مقطع الشباك · الأبعاد الرأسية بالسم':'مقطع توضيحي · الارتفاعات لم تُحدد';
    }
    function sync(){
      $('count').textContent='تم تحديد '+specs.filter(w=>valid(values[w.id])).length+' من '+specs.length;drawMap();drawElevation();
    }
    function select(i){
      selected=Math.max(0,Math.min(specs.length-1,Number(i)));const w=specs[selected],v=values[w.id]||{};
      $('choice').value=selected;$('sill').value=Number.isFinite(v.sillCm)?v.sillCm:'';$('height').value=Number.isFinite(v.heightCm)?v.heightCm:'';$('note').value=typeof v.note==='string'?v.note:'';
      $('width').textContent='عرض الفتحة: '+(w.evidence==='estimated'?'≈ ':'')+w.width+' سم';$('evidence').textContent=w.evidence==='user'?'المقاس المعتمد منك':w.evidence==='dimension'?'مقاس مكتوب بالصورة':'تقدير من مقياس الصورة';
      $('error').textContent='';$('export').hidden=true;$('next').textContent=selected===specs.length-1?'الأول':'التالي';sync();
    }
    function save(){
      const sill=$('sill').value===''?null:Number($('sill').value),height=$('height').value===''?null:Number($('height').value),w=specs[selected];
      const v={sillCm:sill,heightCm:height,note:$('note').value.trim()};values[w.id]=v;
      const partial=sill===null||height===null;
      const bad=(sill!==null&&(!Number.isFinite(sill)||sill<0||sill>400))||(height!==null&&(!Number.isFinite(height)||height<20||height>400))||(!partial&&sill+height>500);
      $('error').textContent=bad?'أدخل جلسة من 0–400 سم، وارتفاعًا من 20–400 سم؛ المجموع لا يتجاوز 500 سم.':'';
      $('sill').setAttribute('aria-invalid',bad);$('height').setAttribute('aria-invalid',bad);
      try{localStorage.setItem(key,JSON.stringify({reference,revision,windows:values}));storageAvailable=true;}catch(_){storageAvailable=false;}
      $('status').textContent=storageAvailable?'محفوظ على هذا المتصفح. انسخ المقاسات لإرسالها.':'الحفظ المحلي غير متاح هنا؛ انسخ المقاسات قبل إغلاق النموذج.';
      if(window.VillaWindowModel)window.VillaWindowModel.apply(values);
      $('export').hidden=true;sync();
    }
    function exportText(){
      const data={reference,revision,units:'cm',windows:specs.map(w=>({id:w.id,replaces:w.replaces||[],room:w.name,plan:{x:w.px,y:w.py},widthCm:w.width,widthSource:w.evidence,sillCm:values[w.id]?.sillCm??null,heightCm:values[w.id]?.heightCm??null,note:values[w.id]?.note||'',ready:!!valid(values[w.id])}))};
      const summary=data.windows.map(w=>w.id+' — '+w.room+': جلسة '+(w.sillCm??'غير محدد')+' سم، ارتفاع '+(w.heightCm??'غير محدد')+' سم'+(w.note?' — '+w.note:'')).join('\n');
      return 'مقاسات شبابيك فيلا حسن — '+reference+'\n'+summary+'\n\n'+JSON.stringify(data,null,2);
    }
    $('copy').onclick=async()=>{
      const str=exportText();$('export').hidden=false;$('export-text').value=str;
      try{await navigator.clipboard.writeText(str);$('status').textContent='تم النسخ. الصق المقاسات في المحادثة.';}catch(_){$('export-text').focus();$('export-text').select();$('status').textContent='حدد النص الظاهر وانسخه، ثم الصقه في المحادثة.';}
    };
    $('choice').onchange=e=>select(e.target.value);$('next').onclick=()=>select((selected+1)%specs.length);['sill','height','note'].forEach(k=>$(k).addEventListener('input',save));
    function constrain(){view.x=Math.max(0,Math.min(774-view.w,view.x));view.y=Math.max(0,Math.min(829-view.h,view.y));drawMap();}
    function zoom(factor){const w=specs[selected],nw=Math.max(230,Math.min(774,view.w*factor));view={x:w.px-nw/2,y:w.py-nw*829/774/2,w:nw,h:nw*829/774};constrain();}
    $('in').onclick=()=>zoom(.7);$('out').onclick=()=>zoom(1/.7);$('fit').onclick=()=>{view={x:0,y:0,w:774,h:829};drawMap();};
    const map=$('plan');map.addEventListener('pointerdown',e=>{if(!e.isPrimary)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};map.setPointerCapture(e.pointerId);});
    map.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();const r=map.getBoundingClientRect();view.x=drag.vx-(e.clientX-drag.x)*view.w/r.width;view.y=drag.vy-(e.clientY-drag.y)*view.h/r.height;constrain();},{passive:false});
    function release(e){if(drag&&e.pointerId===drag.id){if(map.hasPointerCapture(e.pointerId))map.releasePointerCapture(e.pointerId);drag=null;}}
    ['pointerup','pointercancel','lostpointercapture'].forEach(k=>map.addEventListener(k,release));window.addEventListener('blur',()=>{drag=null;});
    $('model-row').hidden=!window.VillaWindowModel;$('model').onclick=()=>window.VillaWindowModel?.show(specs[selected].id);
    new ResizeObserver(()=>drawElevation()).observe($('elevation'));
    $('status').textContent=storageAvailable?'المقاسات المعتمدة مثبتة في هذه النسخة، ويمكن تعديلها هنا.':'انسخ المقاسات قبل إغلاق النموذج.';
    select(0);
  })();
  