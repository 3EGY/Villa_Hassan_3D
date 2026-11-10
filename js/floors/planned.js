/** Reserved floor ids; no placeholder 3D geometry or dummy devices. */
(function(global){
  'use strict';
  for(const [id,label,icon] of [['annex','الملحق','fa-building'],['roof','السطح','fa-sun'],['exterior','خارج الفيلا','fa-house-chimney']]){
    global.VillaFloors.register({id,label,shortLabel:label,icon,status:'planned',rooms:{},
      overviewBounds:VILLA_VIEW_BOUNDS,getSceneGroup:()=>null,
      overviewSpec:{title:label,desc:'هذه المرحلة لم يبدأ تصميمها بعد.'}});
  }
})(window);
