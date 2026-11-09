/**
 * Villa Hassan | 3D wall, glass and door materials
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        // ============================================================================
        // 6. FLOORS, SLABS & CAD BLUEPRINT UNDERLAY
        // ============================================================================


        // ============================================================================
        // 7. ARCHITECTURAL WALLS, WINDOWS & DOORS (Reference-image reconstruction)
        // ============================================================================
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xfafaf9,
            roughness: 0.55,
            metalness: 0.05
        });
        const wallCapMat = new THREE.MeshStandardMaterial({
            color: 0xd97706, // Warm golden-ochre architectural hatch top matching the PDF's yellow walls
            roughness: 0.4
        });
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xbae6fd,
            transparent: true,
            opacity: 0.38,
            roughness: 0.05,
            metalness: 0.1,
            transmission: 0.6
        });
        const woodDoorMat = new THREE.MeshStandardMaterial({
            color: 0x9a5b32,
            roughness: 0.45
        });
