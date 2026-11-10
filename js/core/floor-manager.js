/**
 * Villa Hassan | Building-wide floor registry and scene-state coordinator.
 * New floors register a descriptor, room catalog, bounds and a view module.
 * This service never knows how a specific floor's geometry was constructed.
 */
(function (global) {
    'use strict';
    const registry=new Map();
    const listeners=new Set();
    let activeId='floor1';
    let initialized=false;
    let firstSceneNodes=[];

    function register(definition) {
        if(!definition || !/^[a-z][a-z0-9_-]*$/.test(definition.id||'')) throw new TypeError('Invalid floor id');
        if(registry.has(definition.id)) throw new Error('Floor already registered: '+definition.id);
        if(!definition.label || !definition.rooms || !definition.overviewBounds) throw new TypeError('Missing floor manifest data');
        const entry={...definition};
        registry.set(entry.id,entry);
        for(const [id,spec] of Object.entries(entry.rooms)) {
            if(id==='overview') continue;
            if(Object.hasOwn(ZONE_SPECS,id) && entry.id!=='floor1') throw new Error('Room id collides with existing floor: '+id);
            if(entry.id!=='floor1') ZONE_SPECS[id]=spec;
        }
        return entry;
    }
    function get(id) { return registry.get(id)||null; }
    function list(){ return [...registry.values()].map(f=>({id:f.id,label:f.label,shortLabel:f.shortLabel||f.label,status:f.status,icon:f.icon,roomCount:Object.keys(f.rooms).filter(id=>id!=='overview').length})); }
    function hasRoom(floorId,roomId){return Boolean(registry.get(floorId)?.rooms[roomId]) && roomId!=='overview';}
    function getOverviewSpec(){return registry.get(activeId)?.overviewSpec||ZONE_SPECS.overview;}
    function getBounds(roomId){const f=registry.get(activeId);return roomId==='overview'?f?.overviewBounds:(f?.roomBounds?.[roomId]||null);}
    function getGroup(){return registry.get(activeId)?.getSceneGroup?.()||null;}
    function onChange(listener){listeners.add(listener);return()=>listeners.delete(listener);}
    function emit(){for(const listener of listeners)try{listener(activeId, get(activeId));}catch(error){console.error(error);}}
    function roomFromSpeech(phrase,floorId=activeId){
        const zones=registry.get(floorId)?.rooms||{};
        const aliases=registry.get(floorId)?.speechAliases||{};
        for(const [zone, words] of Object.entries(aliases)){
            if(!zones[zone])continue;
            if(words.some(word=>phrase.includes(word)))return zone;
        }
        return null;
    }
    function initialize() {
        if(initialized) return;
        if(!scene || !registry.has('floor1') || !registry.has('ground')) throw new Error('Floor system not registered or scene not loaded');
        firstSceneNodes=[structureGroup,furnitureGroup,plantsGroup];
        initialized=true;
        applyVisibility();
    }
    function applyVisibility(){
        const first=activeId==='floor1';
        for(const node of firstSceneNodes)if(node)node.visible=first;
        for(const light of smartLights){
            light.pointLight.visible=first;
            light.pointLight.target.visible=first;
            if(!first)light.fixtureGroup.visible=false;
        }
        global.VillaCoveringVisuals?.setSceneVisible?.(first);
        for(const entry of registry.values())if(entry.id!=='floor1' && entry.getSceneGroup){
            const group=entry.getSceneGroup();if(group) group.visible=entry.id===activeId;
        }
        document.body.dataset.activeFloor=activeId;
        const note=document.getElementById('floor-preview-note');if(note)note.hidden=activeId!=='ground';
        if(selectionBoxHelper)selectionBoxHelper.visible=false;
        if(renderer)renderer.shadowMap.needsUpdate=true;
    }
    function select(id){
        if(!initialized)throw new Error('VillaFloors must be initialized first');
        const next=registry.get(id);
        if(!next || next.status==='planned')return false;
        if(activeId===id)return true;
        if(typeof VillaCoveringControls!=='undefined')VillaCoveringControls.closePanel();
        if(typeof closeLightingModes==='function')closeLightingModes();
        if(typeof closeRadialLightMenu==='function')closeRadialLightMenu();
        if(typeof hideContextCard==='function')hideContextCard();
        if(typeof closeAllPopovers==='function')closeAllPopovers();
        if(global.VillaVoiceUI?.close)global.VillaVoiceUI.close();
        if(typeof hideRoomLabels==='function')hideRoomLabels();
        if(selectionBoxHelper)selectionBoxHelper.visible=false;
        activeId=id;
        if(typeof VillaFloorSwitcher!=='undefined')VillaFloorSwitcher.render();
        applyVisibility();
        focusedZoneKey='overview';
        focusedLightId=null;
        focusedLabelName='';
        selectedZoneKey='overview';
        cameraWasManuallyMoved=false;
        overviewViewMode='top';
        document.querySelectorAll('.dock-btn').forEach(btn=>btn.classList.remove('btn-active'));
        if(typeof VillaFloorSwitcher!=='undefined')VillaFloorSwitcher.renderNavigation();
        if(typeof updateFocusedRoomLabel==='function')updateFocusedRoomLabel();
        if(typeof focusZone==='function')focusZone('overview');
        if(typeof updateHTMLOverlaysPosition==='function')updateHTMLOverlaysPosition();
        if(typeof requestLightingShadowUpdate==='function')requestLightingShadowUpdate();
        emit();
        return true;
    }
    global.VillaFloors=Object.freeze({register,get,list,hasRoom,getBounds,getGroup,getOverviewSpec,roomFromSpeech,onChange,initialize,select,get activeId(){return activeId;}});
})(window);
