/**
 * Villa Hassan | Ground floor draft traced against the furnished PDF (one page).
 * PDF coordinates are source drawing points (not measured survey coordinates).
 * All names/room boundary lines below are preliminary interpretations; the source
 * has dimensions and furniture symbols but does not explicitly label every space.
 * Source rectangle: x=38..637, y=186..913, estimated scale 0.024m / PDF point.
 * Please confirm openings and any room names before fitting actual devices.
 */
(function (global) {
    'use strict';
    const SCALE = 0.024;
    const CENTER_X = 337.5, CENTER_Y = 549.5;
    const x = point => (point - CENTER_X) * SCALE;
    const z = point => (point - CENTER_Y) * SCALE;
    const coord = (px, py) => ({ x: x(px), z: z(py) });
    const bounds = ([x1,y1,x2,y2]) => [x(x1),z(y1),x(x2),z(y2)];
    const rooms = [
        {id:'groundNorthLounge',title:'صالة الجلوس الأمامية',short:'الصالة الأمامية',icon:'fa-couch',kind:'living',description:'جلسة رئيسية أعلى المخطط، والأثاث ظاهر في المرجع',area:[142,293,566,510],center:[363,408],color:0x897660,aliases:['الصاله الاماميه','صاله الجلوس','مجلس الضيوف']},
        {id:'groundKitchen',title:'المطبخ',short:'المطبخ',icon:'fa-utensils',kind:'kitchen',description:'كونتر ومطبخ على الجانب الأيسر، وفق أثاث الرسم',area:[43,511,241,665],center:[135,590],color:0x587a83,aliases:['المطبخ','المطبخ الارضي']},
        {id:'groundDining',title:'غرفة السفرة',short:'السفرة',icon:'fa-utensils',kind:'dining',description:'طاولة سفرة وسط المخطط',area:[246,513,454,666],center:[351,590],color:0xb38b55,aliases:['السفره','غرفه السفره','غرفه الطعام']},
        {id:'groundFamilyLiving',title:'صالة المعيشة الخلفية',short:'الصالة الخلفية',icon:'fa-couch',kind:'living',description:'جلسات متعددة بالجانب السفلي الأيمن',area:[243,683,634,906],center:[442,802],color:0xb29163,aliases:['الصاله الخلفيه','صاله المعيشه','المعيشه','الليفنج','الصاله']},
        {id:'groundStairs',title:'الدرج',short:'الدرج',icon:'fa-stairs',kind:'stairs',description:'قلبات الدرج ظاهرة أسفل يسار المخطط',area:[43,766,243,905],center:[137,837],color:0x5a7780,aliases:['السلم','الدرج','السلالم']},
        {id:'groundGuestWC',title:'حمام الضيوف',short:'حمام الضيوف',icon:'fa-bath',kind:'bath',description:'مرفق صغير بجوار الممر والدرج',area:[43,667,131,764],center:[88,716],color:0x6a93a2,aliases:['حمام الضيوف','الحمام']},
        {id:'groundWash',title:'مغاسل / مرفق',short:'المغاسل',icon:'fa-sink',kind:'wash',description:'منطقة خدمة قرب حمام الضيوف، تسمية قابلة للتعديل',area:[131,667,240,766],center:[182,719],color:0x608895,aliases:['المغاسل','حوض الغسيل']},
        {id:'groundHall',title:'بهو التوزيع',short:'البهو',icon:'fa-door-open',kind:'hall',description:'منطقة الربط بين السفرة والصالة والدرج',area:[242,667,454,767],center:[305,708],color:0x768e72,aliases:['البهو','المدخل','الممر']},
        {id:'groundSideService',title:'منطقة خدمة جانبية (مبدئي)',short:'منطقة جانبية',icon:'fa-leaf',kind:'service',description:'فراغات صغيرة أعلى الجانب الأيسر؛ استعمالها يحتاج تأكيد',area:[42,191,142,294],center:[92,244],color:0x6f8076,aliases:['الخدمه','الخدمات']},
        {id:'groundSideYard',title:'جانب خارجي / خدمات (مبدئي)',short:'الجانب الخارجي',icon:'fa-seedling',kind:'yard',description:'الجزء الممتد يسار الجلسة الأمامية، يحتاج مراجعة',area:[42,295,142,509],center:[93,415],color:0x4e8065,aliases:['الحوش','الجانب']}
    ];
    const perimeter = [
        [42,191],[142,191],[142,293],[566,293],[566,511],[454,511],
        [454,683],[634,683],[634,906],[43,906],[43,191]
    ];
    const walls = [
        // Traced external boundaries. The PDF does not confirm sill/head height.
        [[42,191],[142,191]], [[142,191],[142,293]], [[142,293],[566,293]],
        [[566,293],[566,511]], [[566,511],[454,511]], [[454,511],[454,683]],
        [[454,683],[634,683]], [[634,683],[634,906]], [[634,906],[43,906]],
        [[43,906],[43,191]],
        // Major visually legible internal dividing lines; door gaps are left open.
        [[142,293],[142,350]], [[142,460],[142,510]],
        [[43,511],[178,511]], [[203,511],[242,511]],
        [[242,511],[242,584]], [[242,616],[242,665]],
        [[43,665],[148,665]], [[181,665],[242,665]],
        [[43,766],[130,766]], [[161,766],[242,766]],
        [[242,665],[282,665]], [[309,665],[454,665]],
        [[242,766],[242,906]],
        [[43,667],[43,766]], [[131,667],[131,706]], [[131,742],[131,766]]
    ];
    const info = Object.freeze({
        id: 'ground', label:'الدور الأرضي', shortLabel:'الأرضي', icon:'fa-house',
        status:'draft', source:'مخطط الأثاث الملوّن للدور الأرضي، صفحة 1',
        referenceImage:'./assets/floors/ground/plan-trace.png',
        sourceRect:[38,186,637,913], scaleMetersPerPoint:SCALE,
        rooms, perimeter, walls, coord, bounds,
        overviewBounds:bounds([39,186,638,913]),
        // Floor-specific data only. No speculative connected devices.
        devices:[], openings:[],
        note:'تصور ثلاثي الأبعاد أولي. يحتاج مراجعة المسميات والفتحات والأبعاد قبل تركيب أجهزة فعلية.'
    });
    global.VillaGroundFloorData = info;
})(window);
