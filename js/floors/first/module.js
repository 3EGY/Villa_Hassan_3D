/** The preserved production first floor. All v3.0 light/curtain/shutter state remains intact. */
(function (global){
    'use strict';
    const rooms={};
    for(const [key,value] of Object.entries(ZONE_SPECS))if(key!=='overview')rooms[key]=value;
    global.VillaFloors.register({
        id:'floor1',label:'الدور الأول',shortLabel:'الأول',icon:'fa-building',status:'active',
        rooms,roomBounds:ROOM_VIEW_BOUNDS,overviewBounds:VILLA_VIEW_BOUNDS,
        overviewSpec:ZONE_SPECS.overview,
        getSceneGroup:()=>structureGroup,
        speechAliases:{
            rightBedroom:['الغرفه اليمني','الغرفه اليمين','الاوضه اليمين','غرفه اليمين'],
            leftBedroom:['الغرفه اليسري','الغرفه الشمال','الاوضه الشمال'],
            masterBedroom:['غرفه النوم الرئيسيه','غرفه النوم','الماستر'],
            livingRoom:['الصاله','الليفنج','المعيشه'],
            terraceLounge:['جلسه التراس'],terrace:['التراس','البلكونه'],
            dressing:['غرفه الملابس','الدريسنج'],bathroom:['الحمام الرئيسي'],
            guestBathroom:['حمام الضيوف'],stairs:['الدرج','السلم'],
            lobbyPlanter:['البهو'],washbasins:['المغاسل'],courtyard:['الحوش','التراس الايسر']
        }
    });
})(window);
