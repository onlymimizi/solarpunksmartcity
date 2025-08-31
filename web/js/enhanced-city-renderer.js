/**
 * Enhanced City Renderer - 增强版3D城市渲染引擎
 * 新增功能：几何体合并、LOD系统、性能监控、动态优化
 */

class EnhancedCityRenderer extends AdvancedCityRenderer {
    constructor(container) {
        super(container);
        
        // LOD系统
        this.lodLevels = {
            high: { distance: 30, detail: 1.0 },
            medium: { distance: 60, detail: 0.6 },
            low: { distance: 100, detail: 0.3 },
            culled: { distance: 150, detail: 0 }
        };
        
        // 几何体合并系统
        this.mergedGeometries = new Map();
        this.geometryBatches = new Map();
        
        // 性能监控系统
        this.performanceMonitor = {
            frameTime: 0,
            drawCalls: 0,
            vertices: 0,
            faces: 0,
            memoryUsage: 0,
            gpuMemory: 0,
            culledObjects: 0,
            visibleObjects: 0,
            lodLevel: 'high',
            adaptiveQuality: true,
            history: []
        };
        
        // 动态优化参数
        this.adaptiveSettings = {
            targetFPS: 60,
            minFPS: 30,
            qualityStep: 0.1,
            currentQuality: 1.0,
            autoOptimize: true
        };
        
        // 视锥剔除
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        
        this.initEnhancedFeatures();
    }
    
    initEnhancedFeatures() {
        // 启动性能监控
        this.startPerformanceMonitoring();
        
        // 启动自适应优化
        if (this.adaptiveSettings.autoOptimize) {
            this.startAdaptiveOptimization();
        }
        
        console.log('🔧 Enhanced features initialized: LOD, Geometry Merging, Performance Monitoring');
    }
    
    // 几何体合并系统
    mergeGeometries(buildingGroups) {
        const mergedMeshes = new Map();
        
        Object.entries(buildingGroups).forEach(([key, buildings]) => {
            if (buildings.length < 5) return; // 少于5个不合并
            
            const [type, materialName] = key.split('_');
            const baseGeometry = this.geometries.get(`building_${type}`);
            const material = this.materials.get(`building_${materialName}`);
            
            // 创建合并几何体
            const mergedGeometry = new THREE.BufferGeometry();
            const positions = [];
            const normals = [];
            const uvs = [];
            const indices = [];
            
            let vertexOffset = 0;
            
            buildings.forEach(building => {
                const tempGeometry = baseGeometry.clone();
                
                // 应用变换
                const matrix = new THREE.Matrix4();
                matrix.compose(
                    new THREE.Vector3(...building.position),
                    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), building.rotation),
                    new THREE.Vector3(...building.scale)
                );
                
                tempGeometry.applyMatrix4(matrix);
                
                // 合并顶点数据
                const posArray = tempGeometry.attributes.position.array;
                const normArray = tempGeometry.attributes.normal.array;
                const uvArray = tempGeometry.attributes.uv ? tempGeometry.attributes.uv.array : null;
                
                positions.push(...posArray);
                normals.push(...normArray);
                if (uvArray) uvs.push(...uvArray);
                
                // 合并索引
                if (tempGeometry.index) {
                    const indexArray = tempGeometry.index.array;
                    for (let i = 0; i < indexArray.length; i++) {
                        indices.push(indexArray[i] + vertexOffset);
                    }
                    vertexOffset += posArray.length / 3;
                }
                
                tempGeometry.dispose();
            });
            
            // 设置合并后的几何体属性
            mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            if (uvs.length > 0) {
                mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            }
            if (indices.length > 0) {
                mergedGeometry.setIndex(indices);
            }
            
            mergedGeometry.computeBoundingSphere();
            
            // 创建网格
            const mergedMesh = new THREE.Mesh(mergedGeometry, material);
            mergedMesh.castShadow = true;
            mergedMesh.receiveShadow = true;
            mergedMesh.userData = { 
                type: 'merged',
                originalCount: buildings.length,
                key: key
            };
            
            mergedMeshes.set(key, mergedMesh);
            this.mergedGeometries.set(key, mergedGeometry);
            
            console.log(`🔗 Merged ${buildings.length} ${key} buildings into single mesh`);
        });
        
        return mergedMeshes;
    }
    
    // LOD系统实现
    createLODSystem(buildings) {
        const lodGroups = new Map();
        
        buildings.forEach(building => {
            const lodGroup = new THREE.LOD();
            const position = new THREE.Vector3(...building.position);
            
            // 高细节模型
            const highDetailGeo = this.geometries.get(`building_${building.type}`);
            const highDetailMat = this.materials.get(`building_${building.material}`);
            const highDetailMesh = new THREE.Mesh(highDetailGeo, highDetailMat);
            this.applyBuildingTransform(highDetailMesh, building);
            lodGroup.addLevel(highDetailMesh, 0);
            
            // 中等细节模型（简化版）
            const mediumDetailGeo = this.createSimplifiedGeometry(highDetailGeo, 0.6);
            const mediumDetailMesh = new THREE.Mesh(mediumDetailGeo, highDetailMat);
            this.applyBuildingTransform(mediumDetailMesh, building);
            lodGroup.addLevel(mediumDetailMesh, this.lodLevels.medium.distance);
            
            // 低细节模型（盒子）
            const lowDetailGeo = new THREE.BoxGeometry(1, 1, 1);
            const lowDetailMesh = new THREE.Mesh(lowDetailGeo, highDetailMat);
            this.applyBuildingTransform(lowDetailMesh, building);
            lodGroup.addLevel(lowDetailMesh, this.lodLevels.low.distance);
            
            lodGroup.position.copy(position);
            lodGroups.set(`lod_${building.position.join('_')}`, lodGroup);
        });
        
        return lodGroups;
    }
    
    // 创建简化几何体
    createSimplifiedGeometry(originalGeometry, factor) {
        // 简单的顶点减少算法
        const positions = originalGeometry.attributes.position.array;
        const normals = originalGeometry.attributes.normal.array;
        
        const step = Math.max(1, Math.floor(1 / factor));
        const newPositions = [];
        const newNormals = [];
        
        for (let i = 0; i < positions.length; i += step * 3) {
            newPositions.push(positions[i], positions[i + 1], positions[i + 2]);
            newNormals.push(normals[i], normals[i + 1], normals[i + 2]);
        }
        
        const simplifiedGeometry = new THREE.BufferGeometry();
        simplifiedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
        simplifiedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
        simplifiedGeometry.computeBoundingSphere();
        
        return simplifiedGeometry;
    }
    
    // 应用建筑变换
    applyBuildingTransform(mesh, building) {
        mesh.position.set(...building.position);
        mesh.scale.set(...building.scale);
        mesh.rotation.y = building.rotation;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }
    
    // 视锥剔除
    performFrustumCulling() {
        this.cameraMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);
        
        let culledCount = 0;
        let visibleCount = 0;
        
        this.scene.traverse((object) => {
            if (object.isMesh && object.userData.type !== 'ground') {
                if (object.geometry.boundingSphere) {
                    const sphere = object.geometry.boundingSphere.clone();
                    sphere.applyMatrix4(object.matrixWorld);
                    
                    if (this.frustum.intersectsSphere(sphere)) {
                        object.visible = true;
                        visibleCount++;
                    } else {
                        object.visible = false;
                        culledCount++;
                    }
                } else {
                    object.visible = true;
                    visibleCount++;
                }
            }
        });
        
        this.performanceMonitor.culledObjects = culledCount;
        this.performanceMonitor.visibleObjects = visibleCount;
    }
    
    // 性能监控系统
    startPerformanceMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const monitor = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            frameCount++;
            
            if (deltaTime >= 1000) { // 每秒更新一次
                const fps = Math.round((frameCount * 1000) / deltaTime);
                this.performanceMonitor.frameTime = deltaTime / frameCount;
                this.performanceMonitor.fps = fps;
                
                // 更新其他性能指标
                this.updatePerformanceMetrics();
                
                // 记录历史数据
                this.performanceMonitor.history.push({
                    timestamp: currentTime,
                    fps: fps,
                    frameTime: this.performanceMonitor.frameTime,
                    memoryUsage: this.performanceMonitor.memoryUsage
                });
                
                // 保持历史记录在合理范围内
                if (this.performanceMonitor.history.length > 60) {
                    this.performanceMonitor.history.shift();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitor);
        };
        
        monitor();
    }
    
    // 更新性能指标
    updatePerformanceMetrics() {
        // 计算绘制调用数
        this.performanceMonitor.drawCalls = this.scene.children.filter(child => 
            child.isMesh && child.visible
        ).length;
        
        // 计算顶点和面数
        let vertices = 0;
        let faces = 0;
        
        this.scene.traverse((object) => {
            if (object.isMesh && object.visible && object.geometry) {
                const geometry = object.geometry;
                if (geometry.attributes.position) {
                    vertices += geometry.attributes.position.count;
                }
                if (geometry.index) {
                    faces += geometry.index.count / 3;
                } else if (geometry.attributes.position) {
                    faces += geometry.attributes.position.count / 3;
                }
            }
        });
        
        this.performanceMonitor.vertices = vertices;
        this.performanceMonitor.faces = Math.floor(faces);
        
        // 估算内存使用
        this.performanceMonitor.memoryUsage = this.estimateMemoryUsage();
    }
    
    // 估算内存使用
    estimateMemoryUsage() {
        let memoryUsage = 0;
        
        // 几何体内存
        this.geometries.forEach(geometry => {
            if (geometry.attributes.position) {
                memoryUsage += geometry.attributes.position.array.byteLength;
            }
            if (geometry.attributes.normal) {
                memoryUsage += geometry.attributes.normal.array.byteLength;
            }
            if (geometry.attributes.uv) {
                memoryUsage += geometry.attributes.uv.array.byteLength;
            }
            if (geometry.index) {
                memoryUsage += geometry.index.array.byteLength;
            }
        });
        
        // 合并几何体内存
        this.mergedGeometries.forEach(geometry => {
            if (geometry.attributes.position) {
                memoryUsage += geometry.attributes.position.array.byteLength;
            }
            if (geometry.attributes.normal) {
                memoryUsage += geometry.attributes.normal.array.byteLength;
            }
        });
        
        return Math.round(memoryUsage / 1024 / 1024 * 100) / 100; // MB
    }
    
    // 自适应优化系统
    startAdaptiveOptimization() {
        setInterval(() => {
            const currentFPS = this.performanceMonitor.fps || 60;
            
            if (currentFPS < this.adaptiveSettings.minFPS) {
                // 性能不足，降低质量
                this.adaptiveSettings.currentQuality = Math.max(0.3, 
                    this.adaptiveSettings.currentQuality - this.adaptiveSettings.qualityStep);
                this.applyQualitySettings();
                console.log(`📉 Performance low (${currentFPS}fps), reducing quality to ${this.adaptiveSettings.currentQuality}`);
            } else if (currentFPS > this.adaptiveSettings.targetFPS + 10) {
                // 性能充足，提高质量
                this.adaptiveSettings.currentQuality = Math.min(1.0, 
                    this.adaptiveSettings.currentQuality + this.adaptiveSettings.qualityStep);
                this.applyQualitySettings();
                console.log(`📈 Performance good (${currentFPS}fps), increasing quality to ${this.adaptiveSettings.currentQuality}`);
            }
        }, 2000); // 每2秒检查一次
    }
    
    // 应用质量设置
    applyQualitySettings() {
        const quality = this.adaptiveSettings.currentQuality;
        
        // 调整阴影质量
        if (this.renderer.shadowMap.enabled) {
            const shadowMapSize = Math.floor(1024 * quality);
            this.scene.traverse((object) => {
                if (object.isDirectionalLight && object.shadow) {
                    object.shadow.mapSize.width = shadowMapSize;
                    object.shadow.mapSize.height = shadowMapSize;
                    object.shadow.needsUpdate = true;
                }
            });
        }
        
        // 调整渲染分辨率
        const pixelRatio = Math.min(window.devicePixelRatio, 1 + quality);
        this.renderer.setPixelRatio(pixelRatio);
        
        // 调整LOD距离
        Object.keys(this.lodLevels).forEach(level => {
            this.lodLevels[level].distance *= (1 / quality);
        });
    }
    
    // 重写城市生成方法以支持新功能
    generateCity(params = {}) {
        const {
            seed = 42,
            gridSize = 8,
            maxHeight = 20,
            density = 0.7,
            useLOD = true,
            useMerging = true
        } = params;
        
        console.log('🏗️ Generating enhanced city with LOD and geometry merging...');
        
        // 清除现有城市
        this.clearCity();
        
        // 生成地面
        this.createGround();
        
        // 生成建筑数据
        this.generateBuildings(seed, gridSize, maxHeight, density);
        
        // 按类型分组建筑
        const buildingGroups = {};
        this.cityData.buildings.forEach(building => {
            const key = `${building.type}_${building.material}`;
            if (!buildingGroups[key]) {
                buildingGroups[key] = [];
            }
            buildingGroups[key].push(building);
        });
        
        // 根据设置选择渲染方式
        if (useMerging && this.cityData.buildings.length > 100) {
            // 使用几何体合并
            const mergedMeshes = this.mergeGeometries(buildingGroups);
            mergedMeshes.forEach(mesh => {
                this.scene.add(mesh);
                this.instancedMeshes.set(mesh.userData.key, mesh);
            });
            console.log('🔗 Using geometry merging for better performance');
        } else if (useLOD) {
            // 使用LOD系统
            const lodGroups = this.createLODSystem(this.cityData.buildings);
            lodGroups.forEach(lodGroup => {
                this.scene.add(lodGroup);
            });
            console.log('🎯 Using LOD system for distance-based optimization');
        } else {
            // 使用标准实例化渲染
            this.createInstancedMeshes();
            console.log('⚡ Using standard instanced rendering');
        }
        
        // 生成树木
        this.generateTrees(seed, gridSize);
        this.createTreeMeshes();
        
        // 更新统计信息
        this.updateStats();
        
        console.log(`🏙️ Enhanced city generated: ${this.cityData.buildings.length} buildings with advanced optimizations`);
    }
    
    // 创建树木网格
    createTreeMeshes() {
        if (this.cityData.trees.length === 0) return;
        
        const trunkMesh = new THREE.InstancedMesh(
            this.geometries.get('tree_trunk'),
            this.materials.get('tree_trunk'),
            this.cityData.trees.length
        );
        
        const leavesMesh = new THREE.InstancedMesh(
            this.geometries.get('tree_leaves'),
            this.materials.get('tree_leaves'),
            this.cityData.trees.length
        );
        
        this.cityData.trees.forEach((tree, index) => {
            const matrix = new THREE.Matrix4();
            matrix.compose(
                new THREE.Vector3(...tree.position),
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), tree.rotation),
                new THREE.Vector3(...tree.scale)
            );
            trunkMesh.setMatrixAt(index, matrix);
            
            const leavesMatrix = matrix.clone();
            leavesMatrix.setPosition(tree.position[0], tree.position[1] + 1.5, tree.position[2]);
            leavesMesh.setMatrixAt(index, leavesMatrix);
        });
        
        trunkMesh.instanceMatrix.needsUpdate = true;
        leavesMesh.instanceMatrix.needsUpdate = true;
        trunkMesh.castShadow = true;
        leavesMesh.castShadow = true;
        
        this.scene.add(trunkMesh);
        this.scene.add(leavesMesh);
        this.instancedMeshes.set('trees_trunk', trunkMesh);
        this.instancedMeshes.set('trees_leaves', leavesMesh);
    }
    
    // 重写渲染循环以包含新的优化
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            // 执行视锥剔除
            this.performFrustumCulling();
            
            // 更新LOD
            this.scene.traverse((object) => {
                if (object.isLOD) {
                    object.update(this.camera);
                }
            });
            
            this.controls.update();
            
            // 渲染
            if (this.composer) {
                this.composer.render();
            } else {
                this.renderer.clear();
                this.renderer.render(this.scene, this.camera);
            }
        };
        
        animate();
    }
    
    // 获取增强的统计信息
    getEnhancedStats() {
        return {
            ...this.getStats(),
            performance: { ...this.performanceMonitor },
            adaptive: { ...this.adaptiveSettings },
            optimization: {
                lodEnabled: true,
                geometryMerging: this.mergedGeometries.size > 0,
                frustumCulling: true,
                adaptiveQuality: this.adaptiveSettings.autoOptimize
            }
        };
    }
    
    // 清理增强功能的资源
    dispose() {
        super.dispose();
        
        // 清理合并的几何体
        this.mergedGeometries.forEach(geometry => geometry.dispose());
        this.mergedGeometries.clear();
        
        console.log('🧹 Enhanced renderer resources disposed');
    }
}

// 导出增强版渲染器
window.EnhancedCityRenderer = EnhancedCityRenderer;