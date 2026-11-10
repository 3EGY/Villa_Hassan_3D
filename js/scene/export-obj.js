/**
 * Villa Hassan | OBJ export of the architectural model
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        function exportSceneToOBJ() {
            scene.updateMatrixWorld(true);
            const activeFloor=window.VillaFloors?.activeId||'floor1';
            let objContent = `# Villa Hassan ${activeFloor} 3D Model - Exported from Three.js\n`;
            let vertexOffset = 1;

            scene.traverse(node => {
                if (node.isMesh && isEffectivelyVisible(node) && node !== cadOverlayMesh && !node.userData.isReferencePlan) {
                    const geo = node.geometry;
                    if (!geo || !geo.attributes || !geo.attributes.position) return;

                    objContent += `o ${node.name || 'Mesh_' + node.id}\n`;
                    const posAttr = geo.attributes.position;
                    const v = new THREE.Vector3();

                    for (let i = 0; i < posAttr.count; i++) {
                        v.fromBufferAttribute(posAttr, i);
                        v.applyMatrix4(node.matrixWorld);
                        objContent += `v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`;
                    }

                    if (geo.index) {
                        const idx = geo.index;
                        for (let i = 0; i < idx.count; i += 3) {
                            const a = idx.getX(i) + vertexOffset;
                            const b = idx.getX(i + 1) + vertexOffset;
                            const c = idx.getX(i + 2) + vertexOffset;
                            objContent += `f ${a} ${b} ${c}\n`;
                        }
                    } else {
                        for (let i = 0; i < posAttr.count; i += 3) {
                            const a = i + vertexOffset;
                            const b = i + 1 + vertexOffset;
                            const c = i + 2 + vertexOffset;
                            objContent += `f ${a} ${b} ${c}\n`;
                        }
                    }
                    vertexOffset += posAttr.count;
                }
            });

            const blob = new Blob([objContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Villa_Hassan_${activeFloor}_3D.obj`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(`تم تصدير مجسم ${activeFloor} بنجاح`);
        }
