/**
 * View-only Three.js models for shutters & curtains; location catalog and registry
 * are the only sources of truth. No network, schedules, or UI command logic here.
 */
(function(global) {
    'use strict';
    const nodes = new Map();
    const markers = new Map();
    const cleanable = [];
    let group = null, lastFrame = 0;
    let connected = false;
    // Like the light pins: covering markers only appear in the selected room.
    let showCoveringPins = true;
    function mountFor(spec) {
        if (spec.windowId) {
            const windowSpec = PLAN_WINDOWS.find(w => w.id === spec.windowId);
            if (!windowSpec) throw new Error('Missing opening ' + spec.windowId);
            const {sill,height} = windowSize(windowSpec);
            return {...windowSpec, sill, height};
        }
        const opening = VILLA_SPECIAL_OPENINGS[spec.openingId];
        if (!opening) throw new Error('Missing special opening ' + spec.openingId);
        return {...opening, sill:opening.sillCm/100, height:opening.heightCm/100};
    }
    function mesh(geometry, material) {
        const m = new THREE.Mesh(geometry, material);
        m.castShadow = false; m.receiveShadow = false;
        return m;
    }
    function curtainGeometry(left) {
        const verts=[],uvs=[],indices=[];
        const segments = 20, levels = 6;
        for(let yi=0; yi<=levels; yi++) for(let xi=0;xi<=segments;xi++) {
            const u=xi/segments, v=yi/levels;
            const x=(left ? -0.5 + u*0.5 : u*0.5);
            const ripple=Math.sin(u*Math.PI*10)*.035*(.85+.15*v);
            verts.push(x,-v, .21+ripple);
            uvs.push(u,v);
        }
        for(let yi=0;yi<levels;yi++)for(let xi=0;xi<segments;xi++) {
            const a=yi*(segments+1)+xi, b=a+segments+1;
            indices.push(a,b,a+1,b,b+1,a+1);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
        geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
        geometry.setIndex(indices);geometry.computeVertexNormals();
        return geometry;
    }
    function makeShutter(node) {
        const slats = new THREE.Group();
        slats.position.z=-.24;
        const light=new THREE.MeshStandardMaterial({color:0x9aaaba,metalness:.67,roughness:.45,side:THREE.DoubleSide});
        const dark=new THREE.MeshStandardMaterial({color:0x5b7186,metalness:.65,roughness:.4});
        for(let i=0;i<18;i++) {
            const slat=mesh(new THREE.BoxGeometry(.975,.048,.037),i%3===0?dark:light);
            slat.position.y=-(i+.5)/18;
            slats.add(slat);
        }
        const head=mesh(new THREE.BoxGeometry(1.04,.085,.135),dark);
        head.position.set(0,.025,-.24);
        node.add(slats,head);
        return value => {slats.scale.y=Math.max(.004,1-value/100);};
    }
    function makeCurtain(node) {
        const fabric=new THREE.MeshStandardMaterial({color:0xdecdb8,roughness:.91,metalness:0,side:THREE.DoubleSide});
        const rodMat=new THREE.MeshStandardMaterial({color:0xb5a080,metalness:.65,roughness:.38});
        const rod=mesh(new THREE.BoxGeometry(1.06,.022,.06),rodMat);
        rod.position.set(0,.028,.22);
        const left=mesh(curtainGeometry(true),fabric);
        const right=mesh(curtainGeometry(false),fabric);
        node.add(rod,left,right);
        return value => {
            const scale = Math.max(.14,1-(value/100)*.86);
            // Anchored at the window's outer edges, two independently folded leaves.
            left.scale.x=scale;
            right.scale.x=scale;
            left.position.x=-.5*(1-scale);
            right.position.x=+.5*(1-scale);
        };
    }
    function clear() {
        if (group && group.parent) group.parent.remove(group);
        if (group) group.traverse(obj=>{
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material && !cleanable.includes(obj.material)) cleanable.push(obj.material);
        });
        for(const mat of cleanable) mat.dispose();
        cleanable.length=0;
        group=null;nodes.clear();
    }
    function rebuild() {
        if (typeof scene === 'undefined' || !scene) return;
        clear();
        group=new THREE.Group(); group.name='Villa_Coverings_3D';
        group.visible = !global.VillaFloors || global.VillaFloors.activeId === 'floor1';
        scene.add(group);
        for (const spec of VILLA_COVERING_CONFIG) {
            const opening=mountFor(spec);
            // In cutaway mode, only the exposed portion of the opening is shown.
            // This keeps the new materials aligned to the user's wall-height control.
            const exposed=Math.max(.22,Math.min(opening.height,currentWallHeight-opening.sill));
            const top=opening.sill+exposed;
            const node=new THREE.Group();
            node.name=spec.id;
            node.position.set(planX(opening.px),top,planZ(opening.py));
            // W3 sits on the OUTER left wall (x=58): its room lies east (+x).
            // Rotate both its coverings so fabric (+local z) faces indoors (+x)
            // and shutter slats (-local z) face outdoors (-x). Other openings
            // keep their verified facing (W4 fabric faces the living room, -x).
            node.rotation.y=(opening.axis==='z' ? -Math.PI/2:0)
                +(spec.windowId==='W3' ? Math.PI:0);
            node.scale.set(opening.width/100,exposed,1);
            const setVisual=spec.kind==='shutter' ? makeShutter(node):makeCurtain(node);
            group.add(node);
            const state=global.VillaDevices.get(spec.id);
            const current=state ? state.state.position : 100;
            setVisual(current);
            nodes.set(spec.id, {node, setVisual, displayed:current, target:current, kind:spec.kind, spec, opening, top});
        }
        updateMarkers();
    }
    function connect() {
        if (connected) return;
        connected=true;
        global.VillaDevices.subscribe(({type,device})=>{
            const item=nodes.get(device.id);
            if (item && (type==='state'||type==='registered')) {
                item.target=device.state.position;
                const marker=markers.get(device.id);
                if(marker)marker.querySelector('span').textContent=`${device.state.position}%`;
            }
        });
    }
    function createMarkers() {
        const layer=document.getElementById('covering-markers-layer');
        if(!layer)return;
        layer.replaceChildren();markers.clear();
        for (const spec of VILLA_COVERING_CONFIG) {
            const button=document.createElement('button');
            button.type='button';button.className=`covering-pin covering-pin-${spec.kind}`;
            button.setAttribute('aria-label',`${spec.name}: تحكم في نسبة الفتح`);
            button.title=`${spec.name} — اضغط للتحكم`;
            const symbol=document.createElement('i');
            symbol.className=spec.kind==='shutter'?'fa-solid fa-window-maximize':'fa-solid fa-bars-staggered';
            symbol.setAttribute('aria-hidden','true');
            const value=document.createElement('span');
            value.textContent=`${global.VillaDevices.get(spec.id)?.state.position ?? 100}%`;
            button.append(symbol,value);
            button.addEventListener('pointerdown',event=>event.stopPropagation());
            button.addEventListener('click',event=>{
                event.stopPropagation();
                const rect=button.getBoundingClientRect();
                global.VillaCoveringControls.openRadial(spec.id,rect.left+rect.width/2,rect.top+rect.height/2);
            });
            layer.appendChild(button);
            markers.set(spec.id,button);
        }
        updateMarkers();
    }
    function updateMarkers() {
        if (typeof camera==='undefined'||!camera)return;
        const isWelcomeOpen=!document.getElementById('client-welcome').hidden;
        const w=window.innerWidth, h=window.innerHeight;
        for(const [id,item] of nodes) {
            const marker=markers.get(id);
            if(!marker)continue;
            const visible=(!global.VillaFloors || global.VillaFloors.activeId === 'floor1') && !isWelcomeOpen && !cameraAnim && showCoveringPins
                && focusedZoneKey!=='overview' && focusedZoneKey===item.spec.zoneId;
            if(!visible){marker.style.display='none';continue;}
            // Offset paired markers left/right along the opening, not at random screen positions.
            const side=item.kind==='shutter' ? -.28 : .28;
            const p=new THREE.Vector3(side, .17/Math.max(.22,item.node.scale.y),0);
            const v=item.node.localToWorld(p).project(camera);
            if(v.z<-1||v.z>1||Math.abs(v.x)>1||Math.abs(v.y)>1) {marker.style.display='none';continue;}
            marker.style.display='flex';
            marker.style.left=`${(v.x+1)*w/2}px`;
            marker.style.top=`${(1-v.y)*h/2}px`;
        }
    }
    function frame(timestamp) {
        if(!nodes.size)return;
        const dt=lastFrame?Math.min(.08,(timestamp-lastFrame)/1000):.016;
        lastFrame=timestamp;
        const mix=1-Math.exp(-3.5*dt);
        for(const item of nodes.values()) {
            if(Math.abs(item.displayed-item.target)<.08) item.displayed=item.target;
            else item.displayed+=(item.target-item.displayed)*mix;
            item.setVisual(item.displayed);
        }
        updateMarkers();
    }
    function setPinsVisible(value) {
        showCoveringPins = Boolean(value);
        updateMarkers();
    }
    function setSceneVisible(value){
        if(group)group.visible=Boolean(value);
        updateMarkers();
    }
    global.VillaCoveringVisuals=Object.freeze({rebuild,connect,createMarkers,frame,refreshMounts:rebuild,setPinsVisible,setSceneVisible});
})(window);
