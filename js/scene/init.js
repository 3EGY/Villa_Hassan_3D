/**
 * Villa Hassan | Three.js scene initialization
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        // ============================================================================
        // 4. INITIALIZE 3D SCENE & BUILD VILLA HASSAN FIRST FLOOR
        // ============================================================================
        function initScene() {
            const container = document.getElementById('canvas-container');

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0b1120);
            scene.fog = new THREE.FogExp2(0x0b1120, 0.015);

            camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 150);
            camera.position.set(0.5, 15.5, 13.5);

            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // Architecture is static: rebuild shadow maps only after scene geometry changes.
            renderer.shadowMap.autoUpdate = false;
            renderer.shadowMap.needsUpdate = true;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.toneMappingExposure = 0.98;
            container.appendChild(renderer.domElement);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.06;
            controls.maxPolarAngle = Math.PI / 2 - 0.02;
            controls.minDistance = 2.0;
            controls.maxDistance = 35.0;
            controls.target.set(0.5, 0.4, -0.6);

            // Detect orbit/pan/zoom start to immediately clear menus & contextual cards out of the way
            controls.addEventListener('start', () => {
                closeLightingModes();
                roomLabelsWereVisibleAtGestureStart = roomLabelsAwake;
                cameraWasManualAtGestureStart = cameraWasManuallyMoved;
                hideRoomLabels();
                isUserOrbiting = true;
                cameraWasManuallyMoved = true;
                document.getElementById('labels-container').style.opacity = '0.45';
                closeAllPopovers();
                hideContextCard();
                closeRadialLightMenu();
                hideToolbarImmediately();
            });
            controls.addEventListener('end', () => {
                isUserOrbiting = false;
                document.getElementById('labels-container').style.opacity = '1';
                revealRoomLabels();
            });

            // Selection Highlight BoxHelper
            selectionBoxHelper = new THREE.BoxHelper(new THREE.Mesh(), 0xfbbf24);
            selectionBoxHelper.material.depthTest = false;
            selectionBoxHelper.material.transparent = true;
            selectionBoxHelper.material.opacity = 0.85;
            selectionBoxHelper.visible = false;
            scene.add(selectionBoxHelper);

            // Scene hierarchy groups
            structureGroup = new THREE.Group();
            structureGroup.name = "Architecture_Structure";
            furnitureGroup = new THREE.Group();
            furnitureGroup.name = "Villa_Furniture";
            plantsGroup = new THREE.Group();
            plantsGroup.name = "Landscaping_Plants";

            scene.add(structureGroup);
            scene.add(furnitureGroup);
            scene.add(plantsGroup);

            setupLighting();
            buildFloorsAndSlabs();
            buildAllWallsAndOpenings();
            buildMasterBedroomSuite();
            buildSecondaryBedrooms();
            buildDressingRoom();
            buildMasterBathroomAndCourtyard();
            buildRightOutdoorTerrace();
            buildCentralLivingRoom();
            buildStairLobbyAndCircularPlanter();
            buildMainStaircaseAndPowderRoom();
            alignFurnitureToReference();

            createHTMLOverlays();
            toggleDimensionBadges(false);
            setLightingMode('night');
            updateFocusedRoomLabel();
            setupRadialArcInteraction();
            setupRaycasterInteraction();
            syncLightingPresetUI();
            requestLightingShadowUpdate();

            // Start initial auto-hide timer for the top pill bar (3.5 seconds)
            scheduleToolbarAutoHide(3800);


            window.addEventListener('resize', onWindowResize);
            animate();
        }

        // Helper to tag any 3D object or group with specific item metadata for Raycasting
        function registerInteractiveItem(obj3D, itemKey, zoneKey) {
            obj3D.userData = { itemKey, zone: zoneKey, targetGroup: obj3D };
            obj3D.traverse(child => {
                if (child.isMesh) {
                    child.userData = { itemKey, zone: zoneKey, targetGroup: obj3D };
                    interactiveObjects.push(child);
                }
            });
        }
