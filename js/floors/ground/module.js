/** Ground floor registers geometry and rooms but no unconfirmed smart devices. */
(function(global){
    'use strict';
    const data=global.VillaGroundFloorData;
    const rooms={},roomBounds={},speechAliases={};
    for(const room of data.rooms){
        const [x,z]=[data.coord(...room.center).x,data.coord(...room.center).z];
        rooms[room.id]={
            title:room.title,tag:'الدور الأرضي · تصور أولي',desc:room.description+' · الموقع والاسم قابلان للمراجعة من المخطط.',
            dim1:'مرجع PDF',dim2:'بدون أجهزة معتمدة',
            camPos:{x:x+3,y:5,z:z+4},target:{x,y:.3,z},
            icon:room.icon,short:room.short
        };
        roomBounds[room.id]=data.bounds(room.area);
        speechAliases[room.id]=room.aliases||[];
    }
    global.VillaFloors.register({
        id:'ground',label:'الدور الأرضي',shortLabel:'الأرضي',icon:'fa-house',status:'draft',
        rooms,roomBounds,overviewBounds:data.overviewBounds,
        overviewSpec:{title:'الدور الأرضي — مخطط تأسيسي',tag:'مراجعة معمارية',desc:data.note,
          dim1:'مخطط أثاث مرجعي',dim2:`${data.rooms.length} مناطق مبدئية`},
        speechAliases,
        getSceneGroup:()=>global.VillaGroundFloorScene?.group||null
    });
})(window);
