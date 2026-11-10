/**
 * Villa Hassan | Ground-floor preliminary 3D scene.
 * Isolated geometry, reference tracing and furniture previews. The PDF image
 * provides the authoritative visual details until doors/windows are verified.
 * No lights, shutters, curtains or speakers are fabricated here.
 */
(function(global){
    'use strict';
    const data=global.VillaGroundFloorData;
    let group=null,plan=null,wallSegments=[],built=false;
    const materials={};
    function pos(px,py){return data.coord(px,py);}
    function mat(hex,roughness=.76){return new THREE.MeshStandardMaterial({color:hex,roughness,metalness:0.045});}
    function makeMaterials(){
        materials.base=mat(0x1e293b);materials.floor=mat(0xdee0da,.53);
        materials.wall=mat(0xb3b8b1,.88);materials.cap=mat(0xf1f0eb,.69);
        materials.sofa=mat(0xd4bc9b,.9);materials.accent=mat(0x877d6a,.9);
        materials.wood=mat(0x775c42,.75);materials.white=mat(0xe9e3d9,.8);
        materials.glass=new THREE.MeshStandardMaterial({color:0x9ad8e1,transparent:true,opacity:.45,roughness:.19,metalness:.1});
        materials.plant=mat(0x3b765d);
    }
    function addObject(mesh,px,py,h=0.1){const p=pos(px,py);mesh.position.set(p.x,h,p.z);mesh.receiveShadow=true;group.add(mesh);return mesh;}
    function addBox(w,h,d,px,py,material,level=h/2,angle=0){
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
        mesh.rotation.y=angle;mesh.castShadow=h>.35;
        return addObject(mesh,px,py,level);
    }
    function floorPolygon(points,material,zone){
        const shape=new THREE.Shape();
        points.forEach(([xx,yy],i)=>{const p=pos(xx,yy);if(i===0)shape.moveTo(p.x,-p.z);else shape.lineTo(p.x,-p.z);});
        shape.closePath();
        const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material);
        mesh.rotation.x=-Math.PI/2;mesh.position.y=.022;mesh.receiveShadow=true;
        mesh.userData={isGroundSlab:true,zone:zone||'overview',floorId:'ground'};
        group.add(mesh);
        if(zone)interactiveObjects.push(mesh);
        return mesh;
    }
    function wall(a,b,height=currentWallHeight,width=.18){
        const p=pos(...a),q=pos(...b);
        const dx=q.x-p.x,dz=q.z-p.z,length=Math.hypot(dx,dz);
        if(length<.02)return;
        const body=new THREE.Mesh(new THREE.BoxGeometry(length,1,width),materials.wall);
        body.rotation.y=-Math.atan2(dz,dx);
        body.scale.y=height;
        body.position.set((p.x+q.x)/2,height/2,(p.z+q.z)/2);
        body.castShadow=true;body.receiveShadow=true;
        const cap=new THREE.Mesh(new THREE.BoxGeometry(length+.012,.027,width+.026),materials.cap);
        cap.rotation.y=body.rotation.y;cap.position.set(body.position.x,height+.012,body.position.z);
        group.add(body,cap);
        wallSegments.push({body,cap});
    }
    function furniture(){
        // Indicative block-out from visible furniture symbols, not a furniture shop drawing.
        // North lounge sofas and coffee tables.
        addBox(3.3,.36,.86,360,343,materials.sofa,.21);
        addBox(1.7,.36,.78,483,468,materials.sofa,.21);
        addBox(.82,.38,.83,270,463,materials.accent,.21,.32);
        addBox(.82,.38,.83,319,465,materials.accent,.21,-.30);
        addBox(1.35,.38,.76,386,403,materials.wood,.25);
        addBox(1.12,.38,.72,457,409,materials.wood,.25);
        // Dining table and visible chairs (central middle room).
        addBox(2.45,.11,1.00,347,592,materials.wood,.72);
        for(const xx of [290,348,403])for(const yy of [543,645]){
            addBox(.44,.40,.44,xx,yy,materials.sofa,.25);
        }
        // Kitchen block-out: left-side counter, sink zone and central island.
        addBox(.67,.86,3.1,67,580,materials.white,.43);
        addBox(3.7,.86,.66,140,531,materials.white,.43);
        addBox(1.86,.86,.84,143,590,materials.wood,.43);
        // Back living room (bottom right) arranged around a low table.
        addBox(3.25,.38,.78,428,867,materials.sofa,.23);
        addBox(.80,.39,1.58,274,802,materials.accent,.23);
        addBox(.81,.40,.81,587,847,materials.sofa,.23,Math.PI/5);
        addBox(1.72,.34,.88,487,735,materials.sofa,.20);
        addBox(1.30,.33,.66,482,808,materials.wood,.24);
        // Main stairs: two flights are visible in the supplied plan.
        const stairMat=mat(0x9c9d9c,.72);
        for(let i=0;i<10;i++){
            const h=.09+i*.105;
            addBox(2.12,h,.32,99,896-i*11,stairMat,h/2);
            addBox(2.12,h,.32,195,777+i*11,stairMat,h/2);
        }
        // A few small plants as shown in the side courts/entry.
        for(const [xx,yy] of [[70,370],[77,470],[97,715],[274,770]]){
            const pot=new THREE.Mesh(new THREE.CylinderGeometry(.15,.12,.25,12),materials.wood);
            addObject(pot,xx,yy,.14);
            const crown=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),materials.plant);
            addObject(crown,xx,yy,.40);
        }
    }
    function build(activeScene){
        if(built)return group;
        if(!activeScene)throw new Error('Cannot build ground floor without a scene');
        built=true;
        makeMaterials();
        group=new THREE.Group();group.name='Floor_Ground_Draft';
        group.visible=false;
        activeScene.add(group);
        // Opaque support base, selectively shaped to the source footprint.
        const foundationMaterial=materials.base;
        floorPolygon(data.perimeter,foundationMaterial);
        floorPolygon(data.perimeter,materials.floor);
        // Room slabs use transparent tints to retain the PDF trace as the source of truth.
        for(const room of data.rooms){
            const [x1,y1,x2,y2]=room.area;
            const overlay=new THREE.MeshBasicMaterial({color:room.color,transparent:true,opacity:.065,side:THREE.DoubleSide,depthWrite:false});
            const mesh=floorPolygon([[x1,y1],[x2,y1],[x2,y2],[x1,y2]],overlay,room.id);
            mesh.position.y=.026;
        }
        for(const [a,b] of data.walls)wall(a,b);
        furniture();
        const texture=new THREE.TextureLoader().load(data.referenceImage,()=>{
            if(renderer)renderer.shadowMap.needsUpdate=true;
        });
        texture.anisotropy=4;
        const layer=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
        const w=(data.sourceRect[2]-data.sourceRect[0])*data.scaleMetersPerPoint;
        const d=(data.sourceRect[3]-data.sourceRect[1])*data.scaleMetersPerPoint;
        plan=new THREE.Mesh(new THREE.PlaneGeometry(w,d),layer);
        plan.rotation.x=-Math.PI/2;
        const center=pos((data.sourceRect[0]+data.sourceRect[2])/2,(data.sourceRect[1]+data.sourceRect[3])/2);
        plan.position.set(center.x,.061,center.z);
        plan.name='Ground_PDF_Reference_Overlay';
        plan.userData={isReferencePlan:true,floorId:'ground'};
        group.add(plan);
        return group;
    }
    function setWallHeight(value){
        const height=Number(value);
        if(!Number.isFinite(height))return;
        wallSegments.forEach(({body,cap})=>{
            body.scale.y=height;body.position.y=height/2;cap.position.y=height+.012;
        });
    }
    function setPlanOpacity(percent){
        if(!plan)return;
        const opacity=Math.max(0,Math.min(100,Number(percent)||0))/100;
        plan.material.opacity=opacity;plan.visible=opacity>0;
    }
    global.VillaGroundFloorScene={build,setWallHeight,setPlanOpacity,get group(){return group;},get plan(){return plan;}};
})(window);
