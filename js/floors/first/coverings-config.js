/**
 * Villa Hassan | First-floor motor locations (v3.0)
 * 5 shutters: every reviewed room window except guest bathroom W5.
 * 6 curtain motors in 5 location groups: master window, terrace entrance,
 * right-bedroom pair (2 independent motors), left-bedroom window and living-room window.
 * The terrace entrance is a SLIDING DOOR, not an extra reviewed window.
 * To correct a location, update ONLY this catalog.
 * Position convention: 0 = completely closed, 100 = completely open.
 */
const VILLA_COVERING_CONFIG = Object.freeze([
    {id:'shutter_master', kind:'shutter', zoneId:'masterBedroom', windowId:'W1-W2', name:'شتر شباك غرفة النوم'},
    {id:'shutter_left', kind:'shutter', zoneId:'leftBedroom', windowId:'W3', name:'شتر الغرفة اليسرى'},
    {id:'shutter_living', kind:'shutter', zoneId:'livingRoom', windowId:'W4', name:'شتر الصالة العائلية'},
    {id:'shutter_right_left', kind:'shutter', zoneId:'rightBedroom', windowId:'W6', name:'شتر الغرفة اليمنى · الشباك الأيسر'},
    {id:'shutter_right_right', kind:'shutter', zoneId:'rightBedroom', windowId:'W7', name:'شتر الغرفة اليمنى · الشباك الأيمن'},
    {id:'curtain_master', kind:'curtain', zoneId:'masterBedroom', windowId:'W1-W2', groupId:'masterWindow', name:'ستارة شباك غرفة النوم'},
    {id:'curtain_terrace', kind:'curtain', zoneId:'masterBedroom', openingId:'terraceEntry', groupId:'terraceEntry', name:'ستارة دخول التراس'},
    {id:'curtain_right_left', kind:'curtain', zoneId:'rightBedroom', windowId:'W6', groupId:'rightBedroom', name:'ستارة الغرفة اليمنى · الشباك الأيسر'},
    {id:'curtain_right_right', kind:'curtain', zoneId:'rightBedroom', windowId:'W7', groupId:'rightBedroom', name:'ستارة الغرفة اليمنى · الشباك الأيمن'},
    {id:'curtain_left', kind:'curtain', zoneId:'leftBedroom', windowId:'W3', groupId:'leftBedroom', name:'ستارة الغرفة اليسرى'},
    {id:'curtain_living', kind:'curtain', zoneId:'livingRoom', windowId:'W4', groupId:'livingRoom', name:'ستارة شباك صالة المعيشة'}
]);
const VILLA_SPECIAL_OPENINGS = Object.freeze({
    // Exact same sliding-door dimensions and position as buildAllWallsAndOpenings().
    terraceEntry: { id:'terraceEntry', zone:'masterBedroom', px:599, py:301, axis:'z', width:211, sillCm:5, heightCm:230 }
});
