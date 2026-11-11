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
        let activeRadialArcMode = null;
        let isDraggingRadialArc = false;
        let emissiveMaterials = [];
        let ambientLight, hemiLight, dirLight;
        let currentWallHeight = 1.35;
        let isWallXRay = false;
        let showRoomLabelsFlag = true;
        let showDimBadgesFlag = false; // Hidden by default per user preference
        let interactiveObjects = [];
        let cameraAnim = null;
        let isNightMode = true; // Dark mode by default per user preference

        let toolbarHideTimer = null;
        let contextCardProgressInterval = null;
        let contextRemainingMs = 4000;
        let isContextTimerPaused = false;
        let activePopover = null;
        let selectedTargetGroup = null;
        let selectedZoneKey = 'overview';
        let selectionBoxHelper = null;
        let isUserOrbiting = false;

        // Floating HTML Room Labels (Shown in center of rooms during full villa overview)
        const floatingRoomLabels = [
            { id: 'grandMajlis', name: 'المجلس الرئيسي الكبير', sub: '1010 × 450 سم | كنبة 590', x: 2.35, y: 1.4, z: -4.1, color: 'amber' },
            { id: 'receptionLounge', name: 'بهو الاستقبال والمدخل', sub: 'قوس 231 | شيزلونج 173', x: -1.65, y: 1.35, z: -4.1, color: 'amber' },
            { id: 'receptionLounge', name: 'مغاسل وحمام الضيوف العلوي', sub: '200 × 350 سم', x: -5.4, y: 1.3, z: -3.6, color: 'sky' },
            { id: 'diningRoom', name: 'غرفة الطعام الرسمية', sub: '452 × 360 سم | طاولة 250', x: 0.55, y: 1.4, z: -0.05, color: 'amber' },
            { id: 'kitchen', name: 'المطبخ الرئيسي والجزيرة', sub: '450 × 360 سم | جزيرة 182', x: -4.15, y: 1.4, z: -0.05, color: 'sky' },
            { id: 'familyLiving', name: 'صالة المعيشة العائلية', sub: 'كنبة 349×92 | طاولة 160', x: 3.35, y: 1.4, z: 4.65, color: 'amber' },
            { id: 'lobbyPartition', name: 'الموزع وحائط التلفزيون', sub: 'فاصل 200×91 | حوض 70', x: 0.25, y: 1.35, z: 4.25, color: 'emerald' },
            { id: 'stairsWash', name: 'الدرج والمغاسل السفلية', sub: 'مغاسل 210×150 | درج 140', x: -4.15, y: 1.4, z: 4.65, color: 'slate' }
        ];

        // Exact Dimension Badges from the Ground Floor PDF (Hidden by default, toggleable)
        const floatingDimBadges = [
            { text: '← 1010 سم →', x: 1.0, y: 0.2, z: -2.65 },
            { text: 'كنبة 590 × 190 سم', x: 2.35, y: 0.85, z: -5.65 },
            { text: '180×90 سم', x: 1.15, y: 0.55, z: -3.95 },
            { text: '180×90 سم', x: 2.65, y: 0.55, z: -4.35 },
            { text: '70×70 سم', x: 1.75, y: 0.55, z: -4.75 },
            { text: '70×70 سم', x: 2.35, y: 0.55, z: -3.45 },
            { text: 'كنبة 251×95 سم', x: 2.85, y: 0.85, z: -2.40 },
            { text: 'Ø77 سم', x: 4.55, y: 0.6, z: -2.35 },
            { text: 'شيزلونج 173 سم', x: -0.95, y: 0.75, z: -4.35 },
            { text: 'قوس 231 سم', x: -1.65, y: 0.2, z: -4.25 },
            { text: '90×90 سم', x: -2.45, y: 0.8, z: -2.45 },
            { text: '90×90 سم', x: -1.10, y: 0.8, z: -2.45 },
            { text: 'مدخل 200 سم', x: -2.65, y: 0.3, z: -6.20 },
            { text: 'مغاسل 165×160', x: -5.40, y: 0.8, z: -2.75 },
            { text: '← 452 سم →', x: 0.55, y: 0.2, z: -1.10 },
            { text: 'طاولة طعام 250×90', x: 0.55, y: 0.85, z: -0.05 },
            { text: 'باب سحاب 200 سم', x: 0.55, y: 0.3, z: -1.85 },
            { text: 'باب سحاب 200 سم', x: 0.55, y: 0.3, z: 1.75 },
            { text: '← 450 سم →', x: -4.15, y: 0.2, z: 0.95 },
            { text: 'جزيرة 182×92 سم', x: -4.10, y: 0.95, z: -0.05 },
            { text: 'حوض 130 سم', x: -6.05, y: 0.95, z: -0.05 },
            { text: 'بوتاجاز 90 سم', x: -4.25, y: 0.95, z: -1.45 },
            { text: 'فاصل 200×91 سم', x: 0.55, y: 1.15, z: 4.55 },
            { text: 'حوض 70×53 سم', x: 0.05, y: 0.75, z: 3.95 },
            { text: 'ممر 206 سم', x: -0.85, y: 0.2, z: 4.85 },
            { text: 'كنبة 200×75 سم', x: 3.75, y: 0.8, z: 3.05 },
            { text: 'طاولة 160×70 سم', x: 3.45, y: 0.55, z: 4.65 },
            { text: 'كنبة 349×92 سم', x: 2.85, y: 0.85, z: 6.20 },
            { text: 'كرسي 90×98 سم', x: 5.25, y: 0.8, z: 6.15 },
            { text: 'مكتبة 252×48 سم', x: 5.85, y: 0.95, z: 4.55 },
            { text: 'مغاسل 210×150', x: -2.90, y: 0.8, z: 2.55 },
            { text: 'حمام 175×140', x: -5.45, y: 0.8, z: 2.55 },
            { text: 'درج 140 سم', x: -4.15, y: 0.9, z: 5.10 }
        ];

