/**
 * Villa Hassan | Building-level API for UI, automation, integrations and voice.
 * Floor/room identity is always explicit in persisted device records.
 * The 3D scene is optional: future bridge adapters can use the same commands.
 */
(function(global){
  'use strict';
  const systemCatalog=new Map();
  const validID=id=>typeof id==='string'&&/^[a-z][a-z0-9_-]*$/.test(id);
  function registerSystem(meta){
    if(!meta||!validID(meta.id)||typeof meta.name!=='string'||!Array.isArray(meta.deviceKinds))
      throw new TypeError('System must have id, name, and deviceKinds');
    if(systemCatalog.has(meta.id))throw new Error('System already exists: '+meta.id);
    systemCatalog.set(meta.id,Object.freeze({...meta,deviceKinds:[...meta.deviceKinds]}));
    return systemCatalog.get(meta.id);
  }
  function listSystems(){return [...systemCatalog.values()];}
  function getBuildingSnapshot(){
    return {activeFloorId:global.VillaFloors.activeId,
      floors:global.VillaFloors.list().map(f=>({...f,devices:global.VillaDevices.list({floorId:f.id}).length})),
      registeredSystems:listSystems().map(s=>({id:s.id,name:s.name,deviceKinds:[...s.deviceKinds]})),
      devices:global.VillaDevices.list()};
  }
  function listRooms(floorId=global.VillaFloors.activeId){
    const floor=global.VillaFloors.get(floorId);
    return Object.entries(floor?.rooms||{}).map(([id,room])=>({id,floorId,title:room.title}));
  }
  function listDevices({floorId=global.VillaFloors.activeId,roomId,kind}={}){
    return global.VillaDevices.list({floorId,zoneId:roomId,kind});
  }
  async function execute(id,action,value){
    return global.VillaDevices.execute(id,action,value);
  }
  async function executeGroup({floorId=global.VillaFloors.activeId,roomId,kind,action,value,allFloors=false}){
    if(!kind||!action)throw new TypeError('Missing kind/action for group command');
    if(allFloors!==true && !global.VillaFloors.get(floorId))throw new Error('Unknown floor: '+floorId);
    const filter={kind};
    if(!allFloors)filter.floorId=floorId;
    if(roomId)filter.zoneId=roomId;
    const targets=global.VillaDevices.list(filter);
    if(!targets.length)return {attempted:0,succeeded:0,failed:[],message:'لا توجد أجهزة معتمدة تطابق الاختيار'};
    const results=await Promise.allSettled(targets.map(device=>execute(device.id,action,value)));
    const failed=results.flatMap((result,index)=>result.status==='rejected'?[{deviceId:targets[index].id,error:String(result.reason?.message||result.reason)}]:[]);
    return {attempted:targets.length,succeeded:targets.length-failed.length,failed};
  }
  for(const [id,name,kinds] of [
    ['lighting','الإضاءة',['light']],['shutters','الشتر',['shutter']],
    ['curtains','الستائر',['curtain']],['audio','النظام الصوتي',['speaker']],
    ['climate','التكييف',['climate']],['security','الأمان',['security']]
  ])registerSystem({id,name,deviceKinds:kinds,ready:['lighting','shutters','curtains'].includes(id)});
  global.VillaHome=Object.freeze({registerSystem,listSystems,getBuildingSnapshot,listRooms,listDevices,execute,executeGroup});
})(window);
