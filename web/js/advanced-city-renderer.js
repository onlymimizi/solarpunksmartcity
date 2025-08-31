/**
 * Advanced City Renderer - 高性能3D城市渲染引擎
 * 使用先进的渲染技术：实例化渲染、几何体合并、LOD系统、后处理效果
 */

class AdvancedCityRenderer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.composer = null;
        
        // 性能监控
        this.stats = {
            fps: 0,
            drawCalls: 0,
            triangles: 0,
            geometries: 0,
            textures: 0
        };
        
        // 城市数据
        this.cityData = {
            buildings: [],
            trees: [],
            roads: [],
            lights: []
        };
        
        // 渲染组件
        this.instancedMeshes = new Map();
        this.materials = new Map();
        this.geometries = new Map();
        
        // 性能设置
        this.performanceLevel = this.detectPerformanceLevel();
        this.qualitySettings = this.getQualitySettings();
        
        this.init();
    }
    
    detectPerformanceLevel() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!gl) return 'low';
        
        const renderer = gl.getParameter(gl.RENDERER);
        const vendor = gl.getParameter(gl.VENDOR);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 检测GPU性能
        let score = 0;
        if (renderer.includes('NVIDIA') || renderer.includes('AMD')) score += 3;
        else if (renderer.includes('Intel')) score += 1;
        
        if (gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096) score += 1;
        if (gl.getExtension('EXT_texture_filter_anisotropic')) score += 1;
        if (gl.getExtension('WEBGL_depth_texture')) score += 1;
        
        if (isMobile) score = Math.max(0, score - 2);
        
        if (score >= 5) return 'high';
        if (score >= 3) return 'medium';
        return 'low';
    }
    
    getQualitySettings() {
        const settings = {
            low: {
                shadowMapSize: 512,
                maxBuildings: 200,
                maxTrees: 50,
                antialias: false,
                postProcessing: false,
                particleCount: 100,
                lodLevels: 2
            },
            medium: {
                shadowMapSize: 1024,
                maxBuildings: 500,
                maxTrees: 150,
                antialias: true,
                postProcessing: true,
                particleCount: 300,
                lodLevels: 3
            },
            high: {
                shadowMapSize: 2048,
                maxBuildings: 1000,
                maxTrees: 300,
                antialias: true,
                postProcessing: true,
                particleCount: 500,
                lodLevels: 4
            }
        };
        
        return settings[this.performanceLevel];
    }
    
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLights();
        this.createMaterials();
        this.createGeometries();
        
        if (this.qualitySettings.postProcessing) {
            this.setupPostProcessing();
        }
        
        this.setupEventListeners();
        this.startRenderLoop();
        
        console.log(`🚀 Advanced City Renderer initialized - Performance Level: ${this.performanceLevel}`);
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        
        // 高级雾效
        this.scene.fog = new THREE.FogExp2(0x0a0e27, 0.008);
        
        // 环境贴图
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        this.scene.background = new THREE.Color(0x0a0e27);
    }
    
    createCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
        this.camera.position.set(40, 25, 40);
        this.camera.lookAt(0, 0, 0);
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.qualitySettings.antialias,
            alpha: false,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x0a0e27, 1);
        
        // 高级渲染设置
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // 性能优化
        this.renderer.sortObjects = false;
        this.renderer.autoClear = false;
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    createControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.3;
        this.controls.maxPolarAngle = Math.PI * 0.45;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
    }
    
    createLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // 主方向光（太阳）
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(50, 50, 25);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = this.qualitySettings.shadowMapSize;
        sunLight.shadow.mapSize.height = this.qualitySettings.shadowMapSize;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);
        
        // 补充光源
        const fillLight = new THREE.DirectionalLight(0x4caf50, 0.4);
        fillLight.position.set(-30, 20, -30);
        this.scene.add(fillLight);
        
        // 城市氛围光
        const cityGlow = new THREE.PointLight(0x00e5ff, 0.8, 100);
        cityGlow.position.set(0, 15, 0);
        this.scene.add(cityGlow);
    }
    
    createMaterials() {
        // 建筑材质库
        this.materials.set('building_green', new THREE.MeshLambertMaterial({
            color: 0x4caf50,
            transparent: true,
            opacity: 0.9
        }));
        
        this.materials.set('building_blue', new THREE.MeshLambertMaterial({
            color: 0x2196f3,
            transparent: true,
            opacity: 0.9
        }));
        
        this.materials.set('building_glass', new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.8,
            transparent: true,
            opacity: 0.7
        }));
        
        // 地面材质
        this.materials.set('ground', new THREE.MeshLambertMaterial({
            color: 0x1a237e,
            transparent: true,
            opacity: 0.8
        }));
        
        // 树木材质
        this.materials.set('tree_trunk', new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
        this.materials.set('tree_leaves', new THREE.MeshLambertMaterial({ color: 0x66bb6a }));
    }
    
    createGeometries() {
        // 建筑几何体库
        this.geometries.set('building_small', new THREE.BoxGeometry(1, 3, 1));
        this.geometries.set('building_medium', new THREE.BoxGeometry(1.5, 6, 1.5));
        this.geometries.set('building_large', new THREE.BoxGeometry(2, 12, 2));
        this.geometries.set('building_tower', new THREE.BoxGeometry(1, 20, 1));
        
        // 树木几何体
        this.geometries.set('tree_trunk', new THREE.CylinderGeometry(0.1, 0.15, 2, 8));
        this.geometries.set('tree_leaves', new THREE.SphereGeometry(0.8, 8, 6));
        
        // 地面
        this.geometries.set('ground', new THREE.PlaneGeometry(200, 200, 32, 32));
    }
    
    setupPostProcessing() {
        // 后处理管道
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // 基础渲染通道
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // 辉光效果
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
            0.5, 0.4, 0.85
        );
        this.composer.addPass(bloomPass);
        
        // 抗锯齿
        if (this.qualitySettings.antialias) {
            const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
            fxaaPass.material.uniforms['resolution'].value.x = 1 / this.container.clientWidth;
            fxaaPass.material.uniforms['resolution'].value.y = 1 / this.container.clientHeight;
            this.composer.addPass(fxaaPass);
        }
    }
    
    generateCity(params = {}) {
        const {
            seed = 42,
            gridSize = 8,
            maxHeight = 20,
            density = 0.7
        } = params;
        
        // 清除现有城市
        this.clearCity();
        
        // 生成地面
        this.createGround();
        
        // 生成建筑
        this.generateBuildings(seed, gridSize, maxHeight, density);
        
        // 生成树木
        this.generateTrees(seed, gridSize);
        
        // 生成道路网络
        this.generateRoads(gridSize);
        
        // 创建实例化网格
        this.createInstancedMeshes();
        
        // 更新统计信息
        this.updateStats();
        
        console.log(`🏙️ City generated: ${this.cityData.buildings.length} buildings, ${this.cityData.trees.length} trees`);
    }
    
    clearCity() {
        // 清除实例化网格
        this.instancedMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.dispose();
        });
        this.instancedMeshes.clear();
        
        // 清除城市数据
        this.cityData.buildings = [];
        this.cityData.trees = [];
        this.cityData.roads = [];
    }
    
    createGround() {
        const groundGeometry = this.geometries.get('ground');
        const groundMaterial = this.materials.get('ground');
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    generateBuildings(seed, gridSize, maxHeight, density) {
        const buildingTypes = ['small', 'medium', 'large', 'tower'];
        const materialTypes = ['building_green', 'building_blue', 'building_glass'];
        
        for (let x = -gridSize; x <= gridSize; x += 2) {
            for (let z = -gridSize; z <= gridSize; z += 2) {
                if (this.seededRandom(seed + x * 100 + z) > (1 - density)) {
                    const height = 2 + this.seededRandom(seed + x * 200 + z * 3) * maxHeight;
                    const typeIndex = Math.floor(this.seededRandom(seed + x * 300 + z * 5) * buildingTypes.length);
                    const materialIndex = Math.floor(this.seededRandom(seed + x * 400 + z * 7) * materialTypes.length);
                    
                    this.cityData.buildings.push({
                        position: [
                            x + (this.seededRandom(seed + x * 500 + z * 9) - 0.5) * 0.8,
                            height / 2,
                            z + (this.seededRandom(seed + x * 600 + z * 11) - 0.5) * 0.8
                        ],
                        scale: [1, height / 6, 1], // 标准化高度
                        type: buildingTypes[typeIndex],
                        material: materialTypes[materialIndex],
                        rotation: this.seededRandom(seed + x * 700 + z * 13) * Math.PI * 2
                    });
                }
            }
        }
    }
    
    generateTrees(seed, gridSize) {
        const treeCount = Math.min(this.qualitySettings.maxTrees, gridSize * gridSize / 4);
        
        for (let i = 0; i < treeCount; i++) {
            const x = (this.seededRandom(seed + i * 1000) - 0.5) * gridSize * 2;
            const z = (this.seededRandom(seed + i * 1001) - 0.5) * gridSize * 2;
            const scale = 0.8 + this.seededRandom(seed + i * 1002) * 0.4;
            
            this.cityData.trees.push({
                position: [x, 0, z],
                scale: [scale, scale, scale],
                rotation: this.seededRandom(seed + i * 1003) * Math.PI * 2
            });
        }
    }
    
    generateRoads(gridSize) {
        // 简化的道路网络生成
        for (let x = -gridSize; x <= gridSize; x += 4) {
            this.cityData.roads.push({
                start: [x, 0, -gridSize],
                end: [x, 0, gridSize]
            });
        }
        
        for (let z = -gridSize; z <= gridSize; z += 4) {
            this.cityData.roads.push({
                start: [-gridSize, 0, z],
                end: [gridSize, 0, z]
            });
        }
    }
    
    createInstancedMeshes() {
        // 按类型分组建筑
        const buildingGroups = {};
        this.cityData.buildings.forEach(building => {
            const key = `${building.type}_${building.material}`;
            if (!buildingGroups[key]) {
                buildingGroups[key] = [];
            }
            buildingGroups[key].push(building);
        });
        
        // 创建实例化网格
        Object.entries(buildingGroups).forEach(([key, buildings]) => {
            const [type, materialName] = key.split('_');
            const geometry = this.geometries.get(`building_${type}`);
            const material = this.materials.get(`building_${materialName}`);
            
            const instancedMesh = new THREE.InstancedMesh(geometry, material, buildings.length);
            instancedMesh.castShadow = true;
            instancedMesh.receiveShadow = true;
            
            buildings.forEach((building, index) => {
                const matrix = new THREE.Matrix4();
                matrix.compose(
                    new THREE.Vector3(...building.position),
                    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), building.rotation),
                    new THREE.Vector3(...building.scale)
                );
                instancedMesh.setMatrixAt(index, matrix);
            });
            
            instancedMesh.instanceMatrix.needsUpdate = true;
            this.scene.add(instancedMesh);
            this.instancedMeshes.set(key, instancedMesh);
        });
        
        // 创建树木实例化网格
        if (this.cityData.trees.length > 0) {
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
    }
    
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    updateStats() {
        this.stats.geometries = this.instancedMeshes.size;
        this.stats.triangles = Array.from(this.instancedMeshes.values()).reduce((total, mesh) => {
            return total + (mesh.geometry.attributes.position.count / 3) * mesh.count;
        }, 0);
        this.stats.drawCalls = this.instancedMeshes.size;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }
    
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            this.controls.update();
            
            // 渲染
            if (this.composer) {
                this.composer.render();
            } else {
                this.renderer.clear();
                this.renderer.render(this.scene, this.camera);
            }
            
            // 更新FPS
            this.stats.fps = Math.round(1000 / (performance.now() - (this.lastTime || performance.now())));
            this.lastTime = performance.now();
        };
        
        animate();
    }
    
    // 公共API
    setAutoRotate(enabled) {
        this.controls.autoRotate = enabled;
    }
    
    setCameraPosition(x, y, z) {
        this.camera.position.set(x, y, z);
        this.controls.update();
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    dispose() {
        this.renderer.dispose();
        this.instancedMeshes.forEach(mesh => mesh.dispose());
        this.geometries.forEach(geometry => geometry.dispose());
        this.materials.forEach(material => material.dispose());
    }
}

// 导出全局变量
window.AdvancedCityRenderer = AdvancedCityRenderer;