/**
 * Single source of truth for the window review and the 3D viewer.
 * Positions are calibrated from the first-floor reference plan. Dimensions are cm.
 * Keep docs/WINDOW_SCHEDULE.json synchronized when approved dimensions change.
 */
const VILLA_WINDOW_CONFIG = {
  reference: 'villa-cad-nov8-774x829',
  revision: 'approved-2026-11-08-merged-200',
  storageKey: 'villa-hassan-windows-v2-approved',
  specs: [
      {id:'W1-W2',replaces:['W1','W2'],name:'الرئيسية · الشباك الموحّد',zone:'masterBedroom',px:448.5,py:138,axis:'x',width:200,evidence:'user',label:[448.5,88]},
      {id:'W3',name:'الغرفة اليسرى',zone:'leftBedroom',px:58,py:495,axis:'z',width:100,evidence:'estimated',label:[100,495]},
      {id:'W4',name:'الصالة العائلية',zone:'livingRoom',px:488,py:501,axis:'z',width:247,evidence:'dimension',label:[560,460]},
      {id:'W5',name:'حمام الضيوف',zone:'guestBathroom',px:58,py:627,axis:'z',width:60,evidence:'estimated',label:[100,627]},
      {id:'W6',name:'الغرفة اليمنى · الشباك الأيسر',zone:'rightBedroom',px:549,py:591,axis:'x',width:90,evidence:'estimated',label:[550,575]},
      {id:'W7',name:'الغرفة اليمنى · الشباك الأيمن',zone:'rightBedroom',px:624,py:591,axis:'x',width:90,evidence:'estimated',label:[670,645]}
    ],
  approved: {"W1-W2": {"sillCm": 90, "heightCm": 150, "note": "دمج W1 وW2 في شباك واحد بعرض 200 سم"}, "W3": {"sillCm": 90, "heightCm": 150, "note": ""}, "W4": {"sillCm": 40, "heightCm": 200, "note": ""}, "W5": {"sillCm": 170, "heightCm": 70, "note": ""}, "W6": {"sillCm": 40, "heightCm": 200, "note": ""}, "W7": {"sillCm": 40, "heightCm": 200, "note": ""}}
};
