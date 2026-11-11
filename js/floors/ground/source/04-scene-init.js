        // ============================================================================
        // 4. INITIALIZE 3D SCENE & BUILD VILLA HASSAN GROUND FLOOR
        // ============================================================================
        function initScene() {
            const container = document.getElementById('canvas-container');

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x050811);
            scene.fog = new THREE.FogExp2(0x050811, 0.015);

            camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 150);
            camera.position.set(0.4, 15.8, 13.8);

            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1;
            container.appendChild(renderer.domElement);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.06;
            controls.maxPolarAngle = Math.PI / 2 - 0.02;
            controls.minDistance = 2.0;
            controls.maxDistance = 35.0;
            controls.target.set(0.4, 0.4, -0.2);

            controls.addEventListener('start', () => {
                isUserOrbiting = true;
                document.getElementById('labels-container').style.opacity = '0.45';
                closeAllPopovers();
                hideContextCard();
                closeRadialLightMenu();
                hideToolbarImmediately();
            });
            controls.addEventListener('end', () => {
                isUserOrbiting = false;
                document.getElementById('labels-container').style.opacity = '1';
            });

            selectionBoxHelper = new THREE.BoxHelper(new THREE.Mesh(), 0xfbbf24);
            selectionBoxHelper.material.depthTest = false;
            selectionBoxHelper.material.transparent = true;
            selectionBoxHelper.material.opacity = 0.85;
            selectionBoxHelper.visible = false;
            scene.add(selectionBoxHelper);

            structureGroup = new THREE.Group();
            structureGroup.name = "Ground_Architecture_Structure";
            furnitureGroup = new THREE.Group();
            furnitureGroup.name = "Ground_Villa_Furniture";
            plantsGroup = new THREE.Group();
            plantsGroup.name = "Ground_Landscaping_Plants";

            scene.add(structureGroup);
            scene.add(furnitureGroup);
            scene.add(plantsGroup);

            setupLighting();
            buildFloorsAndSlabs();
            buildAllWallsAndOpenings();
            buildGrandMajlisAndReception();
            buildTopLeftGuestWashroom();
            buildCentralDiningRoom();
            buildMainKitchenAndIsland();
            buildFamilyLivingAndLobbyPartition();
            buildMainStaircaseAndGuestWash();

            createHTMLOverlays();
            setupRadialArcInteraction();
            setupRaycasterInteraction();
            window.VillaGroundReview?.init?.();

            scheduleToolbarAutoHide(3800);
            setTimeout(() => {
                showToast("الدور الأرضي جاهز! انقر على أي غرفة من الشريط السفلي أو المس أي لمبة 💡 للتحكم بالإضاءة");
            }, 600);

            window.addEventListener('resize', onWindowResize);
            animate();
        }

        function registerInteractiveItem(obj3D, itemKey, zoneKey) {
            obj3D.userData = { itemKey, zone: zoneKey, targetGroup: obj3D };
            obj3D.traverse(child => {
                if (child.isMesh) {
                    child.userData = { itemKey, zone: zoneKey, targetGroup: obj3D };
                    interactiveObjects.push(child);
                }
            });
        }

