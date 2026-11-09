/**
 * Villa Hassan | Shared scene, view, UI and lighting state
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        // ============================================================================
        // 2. THREE.JS SCENE GLOBALS
        // ============================================================================
        let scene, camera, renderer, controls;
        let wallMeshes = [];
        let doorWindowMeshes = [];
        let furnitureGroup, plantsGroup, structureGroup, cadOverlayMesh;
        let nightLights = [];
        let smartLights = [];
        let showSmartBulbPinsFlag = true;
        let activeSmartLight = null;
        let activeRadialArcMode = null; // 'timer' | 'brightness' | 'color'
        let isDraggingRadialArc = false;
        let radialDragPointerId = null;
        let emissiveMaterials = [];
        let ambientLight, hemiLight, dirLight;
        let currentWallHeight = 1.35;
        let isWallXRay = false;
        let showRoomLabelsFlag = true;
        const ROOM_LABEL_IDLE_MS = 3500;
        let roomLabelsHideTimer = null;
        let roomLabelsAwake = false;
        let roomLabelsWereVisibleAtGestureStart = false;
        let overviewViewMode = 'top';
        let showDimBadgesFlag = false;
        let interactiveObjects = [];
        let cameraAnim = null;
        let isNightMode = true;
        let activeLightingPreset = 'custom';
        let isApplyingLightingPreset = false;
        const LIGHTING_PRESETS = {
            sleep: { label: 'وضع النوم', roomBrightness: 10, livingBrightness: 10 },
            living: { label: 'وضع المعيشة', roomBrightness: 0, livingBrightness: 100 },
            away: { label: 'وضع عدم التواجد', roomBrightness: 15, livingBrightness: 50 }
        };

        // UI Auto-Hide & Contextual Selection State
        let toolbarHideTimer = null;
        let contextCardTimer = null;
        let contextCardProgressInterval = null;
        let contextRemainingMs = 4000;
        let isContextTimerPaused = false;
        let activePopover = null;
        let selectedTargetGroup = null;
        let selectedZoneKey = 'overview';
        let focusedZoneKey = 'overview';
        let focusedLabelName = '';
        let focusedLightId = null;
        let cameraWasManuallyMoved = false;
        let cameraWasManualAtGestureStart = false;
        const VILLA_VIEW_BOUNDS = [-7.190463, -10.079074, 9.299074, 7.919907];
        const ROOM_VIEW_BOUNDS = {"leftBedroom": [-6.801667, -1.914352, -1.655833, 2.659722], "rightBedroom": [3.032593, 2.339537, 7.743889, 7.919907], "terraceLounge": [5.205278, -10.079074, 9.299074, -5.802315], "guestBathroom": [-6.801667, 2.248056, -3.94287, 4.489352], "washbasins": [-4.400278, 2.248056, -1.655833, 4.489352], "courtyard": [-6.801667, -9.8275, -4.194444, -6.14537], "masterBedroom": [-1.610093, -8.020741, 6.028611, -1.502685], "dressing": [-4.400278, -7.105926, -1.152685, -1.502685], "bathroom": [-7.190463, -6.602778, -3.94287, -1.502685], "terrace": [5.571204, -6.14537, 9.299074, -1.502685], "livingRoom": [-2.113241, -1.960093, 3.49, 3.505926], "lobbyPlanter": [-2.113241, 3.002778, 3.49, 7.919907], "stairs": [-6.801667, 4.031944, -1.655833, 7.919907]};

        let selectionBoxHelper = null;
        let isUserOrbiting = false;

        // Floating HTML label definitions
        const floatingRoomLabels = [
            { id: 'masterBedroom', name: 'غرفة النوم الرئيسية', sub: 'سرير 200×200 سم', x: 2.23213, y: 1.4, z: -4.430093, color: 'amber' },
            { id: 'masterBedroom', name: 'جلسة قوسية علوية', sub: '362 × 91 سم', x: 2.23213, y: 1.2, z: -4.430093, color: 'amber' },
            { id: 'dressing', name: 'غرفة الملابس', sub: 'خزائن 260 / 370 سم', x: -2.753611, y: 1.4, z: -4.315741, color: 'sky' },
            { id: 'bathroom', name: 'الحمام الرئيسي', sub: 'بانيو 180×81 سم', x: -5.337963, y: 1.4, z: -4.430093, color: 'sky' },
            { id: 'courtyard', name: 'التراس الأيسر', sub: 'عرض الحوض 75 سم', x: -5.475185, y: 1.2, z: -8.020741, color: 'emerald' },
            { id: 'terraceLounge', name: 'جلسة التراس العلوية', sub: 'طاولة Ø70 سم', x: 7.423704, y: 1.2, z: -7.975, color: 'emerald' },
            { id: 'terrace', name: 'حديقة التراس اليمنى', sub: 'أحواض 90×260 سم', x: 7.423704, y: 1.2, z: -4.109907, color: 'emerald' },
            { id: 'livingRoom', name: 'الصالة العائلية (الكنبة القوسية)', sub: 'قوس 448 × 96 سم', x: 0.676944, y: 1.4, z: 0.830093, color: 'amber' },
            { id: 'lobbyPlanter', name: 'بهو الدرج والحوض الدائري', sub: 'قطر Ø160 سم', x: 0.288148, y: 1.3, z: 5.495648, color: 'emerald' },
            { id: 'stairs', name: 'الدرج الرئيسي', sub: '3 قلبات', x: -4.240185, y: 1.4, z: 5.930185, color: 'slate' },
            { id: 'washbasins', name: 'المغاسل', sub: 'كونتر 210×45 سم', x: -2.982315, y: 1.1, z: 3.345833, color: 'sky' },
            { id: 'guestBathroom', name: 'حمام الضيوف', sub: 'إضاءة مستقلة', x: -5.337963, y: 1.1, z: 3.414444, color: 'sky' },
            { id: 'leftBedroom', name: 'الغرفة اليسرى', sub: 'سرير + تلفزيون', x: -4.240185, y: 1.2, z: 0.487037, color: 'amber' },
            { id: 'rightBedroom', name: 'الغرفة اليمنى', sub: 'سرير + تلفزيون', x: 5.36537, y: 1.2, z: 6.090278, color: 'amber' }
        ];

        // Readable dimensions from the reference image
        const floatingDimBadges = [
            {text:"200×200 سم",x:planX(338),y:.8,z:planZ(278)},
            {text:"75×200 سم",x:planX(400),y:.8,z:planZ(278)},
            {text:"باب سحاب 210 سم",x:planX(432),y:.8,z:planZ(403)},
            {text:"باب سحاب 211 سم",x:planX(599),y:.8,z:planZ(301)},
            {text:"خزائن 65 سم",x:planX(273),y:.8,z:planZ(270)},
            {text:"بانيو 180×81",x:planX(64),y:.8,z:planZ(357)},
            {text:"حوض 169×40",x:planX(120),y:.8,z:planZ(388)},
            {text:"مغسلة 177×50",x:planX(70),y:.8,z:planZ(286)},
            {text:"شاور 168×40",x:planX(149),y:.8,z:planZ(240)},
            {text:"طاولة 150×75",x:planX(371),y:.8,z:planZ(519)},
            {text:"حائط تلفزيون 250×45",x:planX(375),y:.8,z:planZ(620)},
            {text:"Ø160 سم",x:planX(359),y:.8,z:planZ(719)},
            {text:"شباك 247 سم",x:planX(488),y:.8,z:planZ(501)}
        ];
