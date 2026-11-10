(function(global){
  'use strict';
  const roomOptions=[
    {id:'groundNorthLounge', name:'الصالة الأمامية / المجلس'},
    {id:'groundKitchen', name:'المطبخ'},
    {id:'groundDining', name:'السفرة'},
    {id:'groundFamilyLiving', name:'صالة المعيشة الخلفية'},
    {id:'groundStairs', name:'الدرج'},
    {id:'groundGuestWC', name:'حمام الضيوف'},
    {id:'groundWash', name:'المغاسل'},
    {id:'groundHall', name:'البهو'},
    {id:'groundSideService', name:'الخدمة الجانبية'},
    {id:'groundSideYard', name:'الجانب الخارجي'},
    {id:'other', name:'أخرى / يحتاج تحديد'}
  ];

  const walls=[
    {x1:-6.50,z1:-8.65,x2:-4.30,z2:-8.65,thickness:0.22},{x1:-6.50,z1:-8.65,x2:-6.50,z2:-1.80,thickness:0.22},
    {x1:-4.30,z1:-8.65,x2:-4.30,z2:-6.20,thickness:0.22},{x1:-6.50,z1:-7.25,x2:-4.30,z2:-7.25,thickness:0.18},
    {x1:-6.50,z1:-5.65,x2:-4.30,z2:-5.65,thickness:0.18},{x1:-6.50,z1:-3.65,x2:-4.75,z2:-3.65,thickness:0.16},
    {x1:-3.90,z1:-6.20,x2:-3.90,z2:-2.75,thickness:0.20},{x1:-3.90,z1:-6.20,x2:-3.45,z2:-6.20,thickness:0.22},
    {x1:-1.45,z1:-6.20,x2:0.90,z2:-6.20,thickness:0.22},{x1:2.75,z1:-6.20,x2:4.10,z2:-6.20,thickness:0.22},
    {x1:5.45,z1:-6.20,x2:6.25,z2:-6.20,thickness:0.22},{x1:6.25,z1:-6.20,x2:6.25,z2:-4.40,thickness:0.22},
    {x1:6.25,z1:-2.65,x2:6.25,z2:-1.80,thickness:0.22},{x1:-6.50,z1:-1.80,x2:-0.45,z2:-1.80,thickness:0.20},
    {x1:1.55,z1:-1.80,x2:6.25,z2:-1.80,thickness:0.22},{x1:-6.50,z1:-1.80,x2:-6.50,z2:-0.65,thickness:0.22},
    {x1:-6.50,z1:0.65,x2:-6.50,z2:1.80,thickness:0.22},{x1:-1.80,z1:-1.80,x2:-1.80,z2:1.80,thickness:0.22},
    {x1:2.90,z1:-1.80,x2:2.90,z2:-0.95,thickness:0.22},{x1:2.90,z1:1.15,x2:2.90,z2:2.45,thickness:0.22},
    {x1:-6.50,z1:1.80,x2:-3.15,z2:1.80,thickness:0.20},{x1:-2.00,z1:1.80,x2:-0.45,z2:1.80,thickness:0.20},
    {x1:1.55,z1:1.80,x2:2.90,z2:1.80,thickness:0.20},{x1:2.90,z1:2.45,x2:3.25,z2:2.45,thickness:0.22},
    {x1:5.85,z1:2.45,x2:6.25,z2:2.45,thickness:0.22},{x1:6.25,z1:2.45,x2:6.25,z2:6.85,thickness:0.22},
    {x1:-6.50,z1:6.85,x2:1.15,z2:6.85,thickness:0.24},{x1:4.55,z1:6.85,x2:6.25,z2:6.85,thickness:0.24},
    {x1:-6.50,z1:1.80,x2:-6.50,z2:6.85,thickness:0.22},{x1:-1.80,z1:1.80,x2:-1.80,z2:3.40,thickness:0.18},
    {x1:-6.50,z1:3.35,x2:-1.80,z2:3.35,thickness:0.18},{x1:-4.55,z1:1.80,x2:-4.55,z2:3.35,thickness:0.16}
  ];

  const openings=[
    {id:'GD01',kind:'door',label:'باب بين الخدمة الجانبية والاستقبال',roomId:'groundSideService',roomName:'الخدمة الجانبية',x1:-3.90,z1:-2.75,x2:-3.90,z2:-1.95,widthCm:80,heightCm:null,sillCm:0,headCm:null,status:'existing',curtain:false,shutter:false,comment:'باب داخلي يحتاج مراجعة المقاس والاتجاه'},
    {id:'GS01',kind:'slidingGlass',label:'باب زجاجي علوي 200 سم',roomId:'groundNorthLounge',roomName:'الصالة الأمامية / المجلس',x1:-3.45,z1:-6.20,x2:-1.45,z2:-6.20,widthCm:200,heightCm:null,sillCm:5,headCm:null,status:'existing',curtain:false,shutter:false,comment:'مدخل/فتحة زجاجية علوية'},
    {id:'GW01',kind:'window',label:'شباك علوي 1',roomId:'groundNorthLounge',roomName:'الصالة الأمامية / المجلس',x1:0.90,z1:-6.20,x2:2.75,z2:-6.20,widthCm:185,heightCm:null,sillCm:90,headCm:null,status:'existing',curtain:false,shutter:false,comment:'يحتاج تحديد إذا عليه ستارة أو شتر'},
    {id:'GW02',kind:'window',label:'شباك علوي 2',roomId:'groundNorthLounge',roomName:'الصالة الأمامية / المجلس',x1:4.10,z1:-6.20,x2:5.45,z2:-6.20,widthCm:135,heightCm:null,sillCm:90,headCm:null,status:'existing',curtain:false,shutter:false,comment:'يحتاج تحديد إذا عليه ستارة أو شتر'},
    {id:'GW03',kind:'window',label:'شباك يمين الصالة الأمامية',roomId:'groundNorthLounge',roomName:'الصالة الأمامية / المجلس',x1:6.25,z1:-4.40,x2:6.25,z2:-2.65,widthCm:175,heightCm:null,sillCm:90,headCm:null,status:'existing',curtain:false,shutter:false,comment:'شباك خارجي جانبي'},
    {id:'GS02',kind:'slidingGlass',label:'باب سحاب للسفرة من الأعلى',roomId:'groundDining',roomName:'السفرة',x1:-0.45,z1:-1.80,x2:1.55,z2:-1.80,widthCm:200,heightCm:null,sillCm:5,headCm:null,status:'existing',curtain:false,shutter:false,comment:'باب سحاب بين الصالة الأمامية والسفرة'},
    {id:'GW04',kind:'window',label:'شباك المطبخ',roomId:'groundKitchen',roomName:'المطبخ',x1:-6.50,z1:-0.65,x2:-6.50,z2:0.65,widthCm:130,heightCm:null,sillCm:110,headCm:null,status:'existing',curtain:false,shutter:false,comment:'فوق الحوض حسب الموديل الحالي'},
    {id:'GW05',kind:'window',label:'شباك السفرة',roomId:'groundDining',roomName:'السفرة',x1:2.90,z1:-0.95,x2:2.90,z2:1.15,widthCm:210,heightCm:null,sillCm:90,headCm:null,status:'existing',curtain:false,shutter:false,comment:'شباك جانبي كبير'},
    {id:'GD02',kind:'door',label:'باب المطبخ السفلي',roomId:'groundKitchen',roomName:'المطبخ',x1:-3.15,z1:1.80,x2:-2.00,z2:1.80,widthCm:115,heightCm:null,sillCm:0,headCm:null,status:'existing',curtain:false,shutter:false,comment:'باب مطبخ داخلي'},
    {id:'GS03',kind:'slidingGlass',label:'باب سحاب للسفرة من الأسفل',roomId:'groundDining',roomName:'السفرة',x1:-0.45,z1:1.80,x2:1.55,z2:1.80,widthCm:200,heightCm:null,sillCm:5,headCm:null,status:'existing',curtain:false,shutter:false,comment:'باب سحاب بين السفرة والبهو'},
    {id:'GW06',kind:'window',label:'شباك علوي للمعيشة الخلفية',roomId:'groundFamilyLiving',roomName:'صالة المعيشة الخلفية',x1:3.25,z1:2.45,x2:5.85,z2:2.45,widthCm:260,heightCm:null,sillCm:70,headCm:null,status:'existing',curtain:false,shutter:false,comment:'شباك طويل أعلى الصالة الخلفية'},
    {id:'GW07',kind:'window',label:'شباك سفلي للمعيشة الخلفية',roomId:'groundFamilyLiving',roomName:'صالة المعيشة الخلفية',x1:1.15,z1:6.85,x2:4.55,z2:6.85,widthCm:340,heightCm:null,sillCm:50,headCm:null,status:'existing',curtain:false,shutter:false,comment:'خلف الكنبة السفلية حسب الموديل'},
    {id:'GD03',kind:'door',label:'باب حمام/مغاسل الضيوف',roomId:'groundGuestWC',roomName:'حمام الضيوف',x1:-5.35,z1:3.35,x2:-4.65,z2:3.35,widthCm:70,heightCm:null,sillCm:0,headCm:null,status:'existing',curtain:false,shutter:false,comment:'يحتاج مراجعة نهائية للمكان والوظيفة'}
  ];

  const lights=[
    {id:'GL01',kind:'light',label:'إضاءة الصالة الأمامية',roomId:'groundNorthLounge',roomName:'الصالة الأمامية / المجلس',x:1.80,z:-4.25,status:'proposed',count:1,dimmable:true,comment:'نقطة مركزية مبدئية'},
    {id:'GL02',kind:'light',label:'إضاءة بهو الاستقبال العلوي',roomId:'groundNorthLounge',roomName:'الصالة الأمامية / المجلس',x:-1.70,z:-4.20,status:'proposed',count:1,dimmable:true,comment:'قرب المدخل العلوي'},
    {id:'GL03',kind:'light',label:'إضاءة الخدمة/المغاسل العلوية',roomId:'groundSideService',roomName:'الخدمة الجانبية',x:-5.25,z:-4.10,status:'proposed',count:1,dimmable:false,comment:'خدمة'},
    {id:'GL04',kind:'light',label:'إضاءة السفرة',roomId:'groundDining',roomName:'السفرة',x:0.55,z:0.00,status:'proposed',count:1,dimmable:true,comment:'فوق طاولة الطعام'},
    {id:'GL05',kind:'light',label:'إضاءة المطبخ العامة',roomId:'groundKitchen',roomName:'المطبخ',x:-4.20,z:0.00,status:'proposed',count:1,dimmable:false,comment:'إضاءة عامة'},
    {id:'GL06',kind:'light',label:'إضاءة جزيرة المطبخ',roomId:'groundKitchen',roomName:'المطبخ',x:-4.20,z:0.70,status:'proposed',count:1,dimmable:true,comment:'معلقة/سبوت فوق الجزيرة'},
    {id:'GL07',kind:'light',label:'إضاءة البهو',roomId:'groundHall',roomName:'البهو',x:0.25,z:4.25,status:'proposed',count:1,dimmable:true,comment:'منطقة التوزيع'},
    {id:'GL08',kind:'light',label:'إضاءة المعيشة الخلفية الرئيسية',roomId:'groundFamilyLiving',roomName:'صالة المعيشة الخلفية',x:3.40,z:4.65,status:'proposed',count:1,dimmable:true,comment:'مركزية'},
    {id:'GL09',kind:'light',label:'إضاءة المعيشة الخلفية السفلية',roomId:'groundFamilyLiving',roomName:'صالة المعيشة الخلفية',x:3.40,z:6.10,status:'proposed',count:1,dimmable:true,comment:'قرب الكنبة السفلية'},
    {id:'GL10',kind:'light',label:'إضاءة الدرج',roomId:'groundStairs',roomName:'الدرج',x:-4.10,z:5.10,status:'proposed',count:1,dimmable:false,comment:'للسلم'},
    {id:'GL11',kind:'light',label:'إضاءة المغاسل',roomId:'groundWash',roomName:'المغاسل',x:-3.15,z:3.05,status:'proposed',count:1,dimmable:false,comment:'فوق الكاونتر'},
    {id:'GL12',kind:'light',label:'إضاءة حمام الضيوف',roomId:'groundGuestWC',roomName:'حمام الضيوف',x:-5.70,z:3.00,status:'proposed',count:1,dimmable:false,comment:'خدمة'}
  ];

  const planBounds={minX:-7.15,maxX:6.75,minZ:-8.95,maxZ:7.20};
  const types={window:'شباك',door:'باب',slidingGlass:'باب/واجهة زجاجية',light:'إضاءة'};
  global.VillaGroundReviewData={
    floorId:'ground',
    title:'مراجعة فتحات وإضاءة الدور الأرضي',
    planBounds,
    roomOptions,
    types,
    walls,
    openings,
    lights,
    storageKey:'villa-hassan-ground-review-v1',
    exportMeta:{version:'v4.1-ground-review',units:'m/cm'}
  };
})(window);
