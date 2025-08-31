// 3D城市渲染引擎
class City3DRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.buildings = [];
        this.lights = [];
        this.animationId = null;
        this.isRendering = false;
        
        // 渲染参数
        this.config = {
            cameraDistance: 50,
            cameraHeight: 30,
            buildingSpacing: 2,
            animationSpeed: 0.01,
            fogDensity: 0.02,
            shadowMapSize: 2048
        };
        
        this.init();
    }
    
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLights();
        this.createControls();
        this.createEnvironment();
        this.startRenderLoop();
        
        // 响应式处理
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        
        // 设置背景渐变
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;
        
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(0.5, '#003366');
        gradient.addColorStop(1, '#0066cc');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        
        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;
        
        // 添加雾效
        this.scene.fog = new THREE.Fog(0x001122, 10, 100);
    }
    
    createCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(
            this.config.cameraDistance, 
            this.config.cameraHeight, 
            this.config.cameraDistance
        );
        this.camera.lookAt(0, 0, 0);
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // 启用阴影
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // 色调映射
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // 物理正确的光照
        this.renderer.physicallyCorrectLights = true;
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    createLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // 主方向光（太阳光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // 优化阴影质量
        directionalLight.shadow.mapSize.width = this.config.shadowMapSize;
        directionalLight.shadow.mapSize.height = this.config.shadowMapSize;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.bias = -0.0001;
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // 补充光源
        const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.5);
        fillLight.position.set(-30, 20, -30);
        this.scene.add(fillLight);
        
        // 点光源（城市灯光效果）
        for (let i = 0; i < 5; i++) {
            const pointLight = new THREE.PointLight(0xffaa00, 0.8, 20);
            pointLight.position.set(
                (Math.random() - 0.5) * 40,
                5 + Math.random() * 10,
                (Math.random() - 0.5) * 40
            );
            this.scene.add(pointLight);
            this.lights.push(pointLight);
        }
    }
    
    createControls() {
        // 轨道控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
    }
    
    createEnvironment() {
        // 创建地面
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // 添加网格线
        const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x222222);
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        this.scene.add(gridHelper);
        
        // 添加粒子效果
        this.createParticleSystem();
    }
    
    createParticleSystem() {
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            
            colors[i * 3] = 0.5 + Math.random() * 0.5;
            colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 2] = 1.0;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
        this.particleSystem = particleSystem;
    }
    
    generateCity(seed = 42, gridSize = 6, maxHeight = 16) {
        // 清除现有建筑
        this.clearBuildings();
        
        // 设置随机种子
        Math.seedrandom = function(seed) {
            const m = 0x80000000;
            const a = 1103515245;
            const c = 12345;
            let state = seed ? seed : Math.floor(Math.random() * (m - 1));
            
            return function() {
                state = (a * state + c) % m;
                return state / (m - 1);
            };
        };
        
        const random = Math.seedrandom(seed);
        
        // 建筑材质库
        const materials = this.createBuildingMaterials();
        
        // 生成建筑
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                const height = 2 + random() * (maxHeight - 2);
                const buildingType = this.getBuildingType(random());
                const building = this.createBuilding(x, z, height, buildingType, materials);
                
                this.scene.add(building);
                this.buildings.push(building);
            }
        }
        
        // 添加城市特效
        this.addCityEffects();
        
        console.log(`生成了 ${this.buildings.length} 栋建筑`);
    }
    
    createBuildingMaterials() {
        return {
            residential: new THREE.MeshPhongMaterial({ 
                color: 0x4a90e2,
                shininess: 30,
                transparent: true,
                opacity: 0.9
            }),
            commercial: new THREE.MeshPhongMaterial({ 
                color: 0x50c878,
                shininess: 50,
                transparent: true,
                opacity: 0.9
            }),
            industrial: new THREE.MeshPhongMaterial({ 
                color: 0xff6b6b,
                shininess: 20,
                transparent: true,
                opacity: 0.9
            }),
            green: new THREE.MeshPhongMaterial({ 
                color: 0x32cd32,
                shininess: 10,
                transparent: true,
                opacity: 0.8
            })
        };
    }
    
    getBuildingType(random) {
        if (random < 0.4) return 'residential';
        if (random < 0.7) return 'commercial';
        if (random < 0.9) return 'industrial';
        return 'green';
    }
    
    createBuilding(x, z, height, type, materials) {
        const group = new THREE.Group();
        
        // 主建筑体
        const geometry = new THREE.BoxGeometry(1.8, height, 1.8);
        const building = new THREE.Mesh(geometry, materials[type]);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        
        group.add(building);
        
        // 添加细节
        this.addBuildingDetails(group, height, type);
        
        // 设置位置
        group.position.set(
            (x - 2.5) * this.config.buildingSpacing,
            0,
            (z - 2.5) * this.config.buildingSpacing
        );
        
        // 添加动画属性
        group.userData = {
            originalY: group.position.y,
            animationOffset: Math.random() * Math.PI * 2,
            type: type
        };
        
        return group;
    }
    
    addBuildingDetails(group, height, type) {
        // 添加太阳能板
        if (type !== 'green' && Math.random() > 0.3) {
            const solarGeometry = new THREE.PlaneGeometry(1.6, 1.6);
            const solarMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x1a1a2e,
                shininess: 100
            });
            const solarPanel = new THREE.Mesh(solarGeometry, solarMaterial);
            solarPanel.rotation.x = -Math.PI / 2;
            solarPanel.position.y = height + 0.01;
            group.add(solarPanel);
        }
        
        // 添加窗户效果
        if (type !== 'green') {
            for (let i = 1; i < height; i += 2) {
                const windowGeometry = new THREE.PlaneGeometry(0.3, 0.3);
                const windowMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffff88,
                    transparent: true,
                    opacity: Math.random() > 0.5 ? 0.8 : 0.2
                });
                
                // 前面窗户
                const windowFront = new THREE.Mesh(windowGeometry, windowMaterial);
                windowFront.position.set(0, i, 0.91);
                group.add(windowFront);
                
                // 侧面窗户
                const windowSide = new THREE.Mesh(windowGeometry, windowMaterial);
                windowSide.position.set(0.91, i, 0);
                windowSide.rotation.y = Math.PI / 2;
                group.add(windowSide);
            }
        }
        
        // 绿色建筑特效
        if (type === 'green') {
            const treeGeometry = new THREE.ConeGeometry(0.3, 1, 8);
            const treeMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
            
            for (let i = 0; i < 3; i++) {
                const tree = new THREE.Mesh(treeGeometry, treeMaterial);
                tree.position.set(
                    (Math.random() - 0.5) * 1.5,
                    height + 0.5,
                    (Math.random() - 0.5) * 1.5
                );
                group.add(tree);
            }
        }
    }
    
    addCityEffects() {
        // 添加飞行器
        const vehicleGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const vehicleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            emissive: 0x004444
        });
        
        for (let i = 0; i < 5; i++) {
            const vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
            vehicle.position.set(
                (Math.random() - 0.5) * 20,
                10 + Math.random() * 10,
                (Math.random() - 0.5) * 20
            );
            
            vehicle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    0,
                    (Math.random() - 0.5) * 0.1
                ),
                bounds: 15
            };
            
            this.scene.add(vehicle);
            this.vehicles = this.vehicles || [];
            this.vehicles.push(vehicle);
        }
    }
    
    clearBuildings() {
        this.buildings.forEach(building => {
            this.scene.remove(building);
            this.disposeMesh(building);
        });
        this.buildings = [];
        
        // 清除飞行器
        if (this.vehicles) {
            this.vehicles.forEach(vehicle => {
                this.scene.remove(vehicle);
                this.disposeMesh(vehicle);
            });
            this.vehicles = [];
        }
    }
    
    disposeMesh(mesh) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(material => material.dispose());
            } else {
                mesh.material.dispose();
            }
        }
        
        if (mesh.children) {
            mesh.children.forEach(child => this.disposeMesh(child));
        }
    }
    
    startRenderLoop() {
        if (this.isRendering) return;
        this.isRendering = true;
        this.animate();
    }
    
    stopRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isRendering = false;
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // 更新控制器
        this.controls.update();
        
        // 建筑动画
        this.buildings.forEach(building => {
            const userData = building.userData;
            building.position.y = userData.originalY + 
                Math.sin(time * this.config.animationSpeed + userData.animationOffset) * 0.1;
        });
        
        // 粒子动画
        if (this.particleSystem) {
            this.particleSystem.rotation.y += 0.001;
            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] += Math.sin(time + i) * 0.01;
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
        
        // 飞行器动画
        if (this.vehicles) {
            this.vehicles.forEach(vehicle => {
                vehicle.position.add(vehicle.userData.velocity);
                
                // 边界检查
                const bounds = vehicle.userData.bounds;
                if (Math.abs(vehicle.position.x) > bounds) {
                    vehicle.userData.velocity.x *= -1;
                }
                if (Math.abs(vehicle.position.z) > bounds) {
                    vehicle.userData.velocity.z *= -1;
                }
            });
        }
        
        // 光源动画
        this.lights.forEach((light, index) => {
            if (light.type === 'PointLight') {
                light.intensity = 0.5 + Math.sin(time + index) * 0.3;
            }
        });
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    // 公共方法
    setAutoRotate(enabled) {
        this.controls.autoRotate = enabled;
    }
    
    setCameraPosition(x, y, z) {
        this.camera.position.set(x, y, z);
    }
    
    focusOnBuilding(index) {
        if (this.buildings[index]) {
            const building = this.buildings[index];
            this.controls.target.copy(building.position);
        }
    }
    
    exportCityData() {
        return {
            buildingCount: this.buildings.length,
            buildingTypes: this.buildings.map(b => b.userData.type),
            cameraPosition: this.camera.position.toArray(),
            timestamp: new Date().toISOString()
        };
    }
    
    destroy() {
        this.stopRenderLoop();
        this.clearBuildings();
        
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        window.removeEventListener('resize', this.onWindowResize);
    }
}

// 全局城市渲染器实例
let cityRenderer = null;

// 初始化3D城市
function initCity3D() {
    if (cityRenderer) {
        cityRenderer.destroy();
    }
    
    cityRenderer = new City3DRenderer('city-viewport');
    
    // 生成初始城市
    const seed = parseInt(document.getElementById('seed')?.value || 42);
    const grid = parseInt(document.getElementById('grid')?.value || 6);
    const maxH = parseInt(document.getElementById('maxH')?.value || 16);
    
    cityRenderer.generateCity(seed, grid, maxH);
}

// 重新生成城市
function regenerateCity() {
    if (!cityRenderer) {
        initCity3D();
        return;
    }
    
    const seed = parseInt(document.getElementById('seed')?.value || 42);
    const grid = parseInt(document.getElementById('grid')?.value || 6);
    const maxH = parseInt(document.getElementById('maxH')?.value || 16);
    
    cityRenderer.generateCity(seed, grid, maxH);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在城市页面
    if (document.getElementById('city-viewport')) {
        // 加载Three.js库
        if (typeof THREE === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = function() {
                // 加载轨道控制器
                const controlsScript = document.createElement('script');
                controlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
                controlsScript.onload = function() {
                    initCity3D();
                };
                document.head.appendChild(controlsScript);
            };
            document.head.appendChild(script);
        } else {
            initCity3D();
        }
    }
});

// 导出给全局使用
window.cityRenderer = cityRenderer;
window.regenerateCity = regenerateCity;