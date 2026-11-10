/**
 * Villa Hassan | Architectural walls, slab layout and placement
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */

        function addReviewedWindow(spec, thickness=.22) {
            const group=new THREE.Group(); group.name='Window_'+spec.id;
            group.position.set(planX(spec.px),0,planZ(spec.py)); group.rotation.y=spec.axis==='z'?-Math.PI/2:0;
            const width=spec.width/100, parts={};
            function part(key,w,d,mat) { const g=new THREE.BoxGeometry(w,1,d); g.translate(0,.5,0); const m=new THREE.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;group.add(m);parts[key]=m;return m; }
            part('sillWall',width,thickness,wallMat); part('lintel',width,thickness,wallMat);
            part('glass',width-.08,.04,glassMat).castShadow=false;
            const frameMat=new THREE.MeshStandardMaterial({color:0x607885,roughness:.5,metalness:.6});
            ['left','right','center'].forEach(k=>part(k,.035,.08,frameMat));
            ['bottom','top'].forEach(k=>part(k,width,.08,frameMat));
            part('cap',width+.01,thickness+.01,wallCapMat);
            structureGroup.add(group); windowAssemblies.push({spec,group,parts,width});
        }
        function updateReviewedWindows() {
            for(const a of windowAssemblies) {
                const {sill,height,confirmed}=windowSize(a.spec),head=sill+height,cut=currentWallHeight;
                a.group.userData={windowId:a.spec.id,zone:a.spec.zone,sill,height,confirmed};
                function span(key,bottom,top) {const m=a.parts[key];m.visible=top>bottom+.001;m.position.y=bottom;m.scale.y=Math.max(.001,top-bottom);}
                span('sillWall',0,Math.min(sill,cut)); span('lintel',head,cut);
                span('glass',sill+.025,Math.min(head-.025,cut));
                ['left','right','center'].forEach(k=>span(k,sill,Math.min(head,cut)));
                a.parts.left.position.x=-a.width/2+.02;a.parts.right.position.x=a.width/2-.02;
                span('bottom',sill,Math.min(sill+.035,cut));span('top',head-.035,Math.min(head,cut));
                const capHeight=cut<=sill?cut:(cut>head?cut:sill);
                span('cap',capHeight,capHeight+.025);a.parts.cap.visible=capHeight>0;
            }
            if (window.VillaCoveringVisuals && window.VillaDevices?.list({kind:'shutter'}).length) VillaCoveringVisuals.refreshMounts();
            if(renderer) requestLightingShadowUpdate();
        }
        function addPlanWall(x1,y1,x2,y2,openings=[],thickness=.22) {
            const alongX=y1===y2, start=alongX?planX(x1):planZ(y1), end=alongX?planX(x2):planZ(y2), fixed=alongX?planZ(y1):planX(x1);
            if(end<start) throw new Error('Reference wall endpoints must be ordered');
            let cursor=start;
            const entries=openings.map(o=>{const center=alongX?planX(o.px):planZ(o.py);return {...o,start:center-o.width/200,end:center+o.width/200}}).sort((a,b)=>a.start-b.start);
            function wall(a,b) {if(b-a<.02)return; if(alongX)addWallSegment(a,fixed,b,fixed,thickness);else addWallSegment(fixed,a,fixed,b,thickness);}
            for(const o of entries) {
                wall(cursor,o.start);
                if(o.id&&o.id[0]==='W') addReviewedWindow(o,thickness);
                else if(o.kind==='sliding') {
                    if(alongX)addWindowOrDoor(o.start,fixed,o.end,fixed,'slidingGlass');else addWindowOrDoor(fixed,o.start,fixed,o.end,'slidingGlass');
                } else {
                    addHingedBedroomDoor(o.zone,alongX?o.start:fixed,alongX?fixed:o.start,o.width/100,o.angle??(alongX?Math.PI*4/9:-Math.PI/18));
                }
                cursor=o.end;
            }
            wall(cursor,end);
        }
        function buildAllWallsAndOpenings() {
            const W=id=>PLAN_WINDOWS.find(w=>w.id===id);
            // Traced wall centre lines; furniture-only dimension arrows are not treated as room extents.
            addPlanWall(58,59,152,59);addPlanWall(58,59,58,316);addPlanWall(152,59,152,178);
            addPlanWall(58,200,163,200);addPlanWall(152,178,333,178);
            addPlanWall(333,138,333,178);addPlanWall(333,138,583,138,[W('W1-W2')]);
            addPlanWall(583,48,583,138);addPlanWall(583,48,742,48);addPlanWall(742,48,742,403);addPlanWall(599,403,742,403);
            addPlanWall(583,138,583,178);addPlanWall(583,178,599,178);
            addPlanWall(599,178,599,403,[{kind:'sliding',px:599,py:301,width:211}]);
            addPlanWall(41,316,58,316);addPlanWall(41,316,41,403);addPlanWall(41,403,285,403);
            addPlanWall(163,178,163,403,[{zone:'bathroom',px:163,py:348,width:80,angle:Math.PI*10/9}],.18);
            addPlanWall(285,178,285,403,[{zone:'dressing',px:285,py:371,width:100,angle:-Math.PI/18}],.18);
            addPlanWall(285,403,599,403,[{kind:'sliding',px:432,py:403,width:210}],.20);
            // Left bedroom, guest facilities and open stair edge.
            addPlanWall(58,403,58,815,[W('W3'),W('W5')]);
            addPlanWall(263,403,263,617,[],.20);
            addPlanWall(58,587,263,587,[{zone:'leftBedroom',px:224,py:587,width:100}],.18);
            addPlanWall(163,587,163,665,[{zone:'guestBathroom',px:163,py:621,width:100,angle:Math.PI*10/9}],.15);
            addPlanWall(58,665,263,665,[],.18);
            // The approved stair-to-lobby side remains entirely open.
            addPlanWall(488,403,488,815,[W('W4'),{zone:'rightBedroom',px:488,py:635,width:90,angle:-Math.PI/18}]);
            addPlanWall(58,815,674,815,[],.24);
            addPlanWall(488,591,674,591,[W('W6'),W('W7')]);addPlanWall(674,591,674,815);
            // 250 × 45 cm partition, using the labelled furniture footprint.
            const cx=planX(375),cz=planZ(620);
            addWallSegment(cx-1.25,cz,cx+1.25,cz,.45,true);
            const tv=new THREE.Mesh(new THREE.BoxGeometry(1.75,.95,.05),new THREE.MeshStandardMaterial({color:0x090d16,metalness:.8,roughness:.1}));
            tv.position.set(cx,.85,cz-.25);structureGroup.add(tv);registerInteractiveItem(tv,'tvPartitionWall','livingRoom');
            updateReviewedWindows();
        }
        function buildFloorsAndSlabs() {
            const main=new THREE.MeshStandardMaterial({map:createMarbleTexture('#f5f2eb','#dfd8c8'),roughness:.3});
            const bath=new THREE.MeshStandardMaterial({color:0xdde4e9,roughness:.4});
            const wood=new THREE.MeshStandardMaterial({map:createWoodTexture('#7c4d2b','#5c371c'),roughness:.5});
            const terrace=new THREE.MeshStandardMaterial({color:0xd6d3d1,roughness:.65});
            const base=new THREE.Mesh(new THREE.BoxGeometry(17,.35,18.6),new THREE.MeshStandardMaterial({color:0x1e293b,roughness:.8}));base.position.set(planX(392),-.21,planZ(430));base.userData.isPresentationBase=true;structureGroup.add(base);
            function slab(zone,points,mat=main) {
                const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(planX(x),-planZ(y)):shape.moveTo(planX(x),-planZ(y)));shape.closePath();
                const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=.03;mesh.receiveShadow=true;mesh.userData.zone=zone;structureGroup.add(mesh);interactiveObjects.push(mesh);
            }
            slab('courtyard',[[58,59],[152,59],[152,200],[58,200]],terrace);
            slab('bathroom',[[58,200],[163,200],[163,403],[41,403],[41,316],[58,316]],bath);
            slab('dressing',[[163,178],[285,178],[285,403],[163,403]],wood);
            slab('masterBedroom',[[285,178],[333,178],[333,138],[583,138],[583,178],[599,178],[599,403],[285,403]]);
            slab('terraceLounge',[[583,48],[742,48],[742,220],[599,220],[599,178],[583,178]],terrace);
            slab('terrace',[[599,220],[742,220],[742,403],[599,403]],terrace);
            slab('leftBedroom',[[58,403],[263,403],[263,587],[58,587]]);
            slab('guestBathroom',[[58,587],[163,587],[163,665],[58,665]],bath);
            slab('washbasins',[[163,587],[263,587],[263,665],[163,665]],bath);
            slab('livingRoom',[[263,403],[488,403],[488,620],[263,620]]);
            slab('lobbyPlanter',[[263,620],[488,620],[488,815],[263,815]]);
            slab('stairs',[[58,665],[263,665],[263,815],[58,815]]);
            slab('rightBedroom',[[488,591],[674,591],[674,815],[488,815]]);
            const cadTexture=new THREE.TextureLoader().load('./assets/reference-plan.png');
            const cadMat=new THREE.MeshBasicMaterial({map:cadTexture,transparent:true,opacity:0,depthWrite:false});
            cadOverlayMesh=new THREE.Mesh(new THREE.PlaneGeometry(774*PLAN_SCALE,829*PLAN_SCALE),cadMat);cadOverlayMesh.rotation.x=-Math.PI/2;cadOverlayMesh.position.set(planX(387),.036,planZ(414.5));structureGroup.add(cadOverlayMesh);
        }
        function alignFurnitureToReference() {
            scene.updateMatrixWorld(true);
            function item(key) {let found;scene.traverse(o=>{if(o.userData.targetGroup===o&&o.userData.itemKey===key)found=o});return found;}
            function move(key,px,py) {const o=item(key);if(!o)return;scene.updateMatrixWorld(true);const c=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());const dx=planX(px)-c.x,dz=planZ(py)-c.z;o.position.x+=dx;o.position.z+=dz;
                const zones={masterBed:'masterBedroom',wardrobeCloset:'dressing',bathroomVanity:'bathroom'};
                if(zones[key]) furnitureGroup.children.forEach(m=>{if(m.isMesh&&m.material?.userData.zone===zones[key]&&m.material&&m.material.emissive){m.position.x+=dx;m.position.z+=dz;}});
            }
            move('masterBed',338,278);move('bedFootChaise',400,278);move('upperCurvedSofa',450,180);move('bedroomVanity',540,371);
            move('masterBathtub',64,357);move('bathroomPlanter',120,388);move('bathroomVanity',108,258);move('courtyardGarden',106,128);
            move('wardrobeCloset',224,277);move('livingCurvedSofa',333,498);move('ovalCoffeeTable',371,519);move('livingArmchairs',450,512);
            move('centralCircularPlanter',359,719);move('lobbyPoufs',456,729);move('guestWashbasins',215,651);move('guestBathroomFixtures',96,629);
            move('terraceLounge',671,118);move('terraceGardenBeds',670,296);
            const stairs=item('mainStaircase');stairs.scale.z=.83;move('mainStaircase',160,740);
            // Earlier approved bed/TV orientations are preserved; reposition them at the actual walls.
            const leftBed=item('leftBedroomBed');leftBed.position.set(planX(158),0,planZ(409)+1.10);
            const leftTV=item('leftBedroomTV');leftTV.position.set(planX(158),0,planZ(587)-.14);
            const rightBed=item('rightBedroomBed');rightBed.position.set(planX(488)+1.19,0,planZ(744));
            const rightTV=item('rightBedroomTV');rightTV.position.set(planX(674)-.14,0,planZ(744));
            // Move independent terrace border planters from the earlier approximate envelope.
            const borders=plantsGroup.children.filter(o=>o.type==='Group'&&!o.userData.itemKey);
            const targets=[[670,61],[597,109],[670,391]];
            borders.forEach((o,i)=>{if(targets[i]){o.position.x=planX(targets[i][0]);o.position.z=planZ(targets[i][1]);}});
            // The reference shows the master WC, previously omitted.
            const wc=new THREE.Group(),ceramic=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.15});
            const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.22,.18,.42,24),ceramic);bowl.scale.z=1.35;bowl.position.y=.21;wc.add(bowl);
            wc.position.set(planX(83),0,planZ(225));wc.rotation.y=Math.PI/2;furnitureGroup.add(wc);registerInteractiveItem(wc,'bathroomVanity','bathroom');
        }
