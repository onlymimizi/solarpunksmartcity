/**
 * Visual Enhanced City Renderer - 视觉增强版3D城市渲染引擎
 * 专注于改善材质、光照、后处理效果的视觉体验
 */

class VisualEnhancedRenderer extends EnhancedCityRenderer {
    constructor(container) {
        super(container);
        
        // 视觉增强设置
        this.visualSettings = {
            enableHDR: true,
            enableBloom: true,
            enableSSAO: false, // 屏幕空间环境光遮蔽
            enableReflections: true,
            enableVolumetricLighting: true,
            enableParticles: true,
            materialComplexity: 'high', // low, medium, high
            lightingQuality: 'high'
        };
        
        // 粒子系统
        this.particleSystems = new Map();
        
        // 动态光照
        this.dynamicLights = [];
        
        // 材质变体
        this.enhancedMaterials = new Map();
        
        this.initVisualEnhancements();
    }
    
    initVisualEnhancements() {
        // 升级渲染器设置
        this.upgradeRenderer();
        
        // 创建增强材质
        this.createEnhancedMaterials();
        
        // 设置高级光照
        this.setupAdvancedLighting();
        
        // 创建粒子效果
        this.createParticleEffects();
        
        // 升级后处理管道
        this.setupAdvancedPostProcessing();
        
        console.log('✨ Visual enhancements initialized: Advanced materials, lighting, and effects');
    }
    
    upgradeRenderer() {
        // 启用高级渲染特性
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 启用物理正确的光照
        this.renderer.physicallyCorrectLights = true;
        
        // 设置更高质量的阴影
        this.renderer.shadowMap.autoUpdate = true;
        
        console.log('🎨 Renderer upgraded with advanced visual settings');
    }
    
    createEnhancedMaterials() {
        // 高级建筑材质 - 玻璃幕墙
        this.enhancedMaterials.set('building_glass_advanced', new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.9,
            thickness: 0.5,
            transparent: true,
            opacity: 0.8,
            envMapIntensity: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        }));
        
        // 高级建筑材质 - 金属外墙
        this.enhancedMaterials.set('building_metal', new THREE.MeshPhysicalMaterial({
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.2,
            envMapIntensity: 1.0,
            clearcoat: 0.5,
            clearcoatRoughness: 0.3
        }));
        
        // 高级建筑材质 - 混凝土
        this.enhancedMaterials.set('building_concrete', new THREE.MeshLambertMaterial({
            color: 0x888888,
            roughness: 0.8,
            envMapIntensity: 0.3
        }));
        
        // 发光建筑材质
        this.enhancedMaterials.set('building_emissive', new THREE.MeshStandardMaterial({
            color: 0x4caf50,
            emissive: 0x004d00,
            emissiveIntensity: 0.3,
            metalness: 0.1,
            roughness: 0.4
        }));
        
        // 太阳能板材质
        this.enhancedMaterials.set('solar_panel', new THREE.MeshPhysicalMaterial({
            color: 0x1a1a2e,
            metalness: 0.8,
            roughness: 0.1,
            envMapIntensity: 1.2,
            clearcoat: 0.8,
            clearcoatRoughness: 0.05
        }));
        
        // 绿化屋顶材质
        this.enhancedMaterials.set('green_roof', new THREE.MeshLambertMaterial({
            color: 0x2e7d32,
            roughness: 0.9,
            envMapIntensity: 0.2
        }));
        
        // 高级地面材质
        this.enhancedMaterials.set('ground_advanced', new THREE.MeshStandardMaterial({
            color: 0x1a237e,
            metalness: 0.1,
            roughness: 0.8,
            envMapIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        }));
        
        // 水面材质
        this.enhancedMaterials.set('water', new THREE.MeshPhysicalMaterial({
            color: 0x006064,
            metalness: 0.0,
            roughness: 0.1,
            transmission: 0.8,
            thickness: 2.0,
            transparent: true,
            opacity: 0.8,
            envMapIntensity: 1.5
        }));
        
        console.log('🎨 Enhanced materials created with PBR properties');
    }
    
    setupAdvancedLighting() {
        // 清除现有光源
        const lightsToRemove = [];
        this.scene.traverse((object) => {
            if (object.isLight) {
                lightsToRemove.push(object);
            }
        });
        lightsToRemove.forEach(light => this.scene.remove(light));
        
        // 环境光 - 模拟天空光
        const ambientLight = new THREE.AmbientLight(0x87ceeb, 0.4);
        this.scene.add(ambientLight);
        
        // 主太阳光 - 方向光
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(100, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = this.qualitySettings.shadowMapSize;
        sunLight.shadow.mapSize.height = this.qualitySettings.shadowMapSize;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 300;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.bias = -0.0001;
        sunLight.shadow.normalBias = 0.02;
        this.scene.add(sunLight);
        
        // 补充光源 - 模拟天空反射
        const skyLight = new THREE.DirectionalLight(0x87ceeb, 0.6);
        skyLight.position.set(-50, 30, -50);
        this.scene.add(skyLight);
        
        // 城市氛围光 - 点光源
        const cityGlow = new THREE.PointLight(0x00e5ff, 1.0, 150);
        cityGlow.position.set(0, 20, 0);
        this.scene.add(cityGlow);
        
        // 动态光源 - 建筑顶部灯光
        this.createDynamicLights();
        
        console.log('💡 Advanced lighting system setup complete');
    }
    
    createDynamicLights() {
        // 创建多个动态点光源
        const lightColors = [0x4caf50, 0x2196f3, 0xff9800, 0x9c27b0, 0x00e5ff];
        
        for (let i = 0; i < 8; i++) {
            const light = new THREE.PointLight(
                lightColors[i % lightColors.length], 
                0.8, 
                25
            );
            
            // 随机位置
            light.position.set(
                (Math.random() - 0.5) * 40,
                5 + Math.random() * 15,
                (Math.random() - 0.5) * 40
            );
            
            light.castShadow = false; // 性能考虑
            this.scene.add(light);
            this.dynamicLights.push(light);
        }
        
        // 启动光源动画
        this.animateDynamicLights();
    }
    
    animateDynamicLights() {
        const animateLight = () => {
            this.dynamicLights.forEach((light, index) => {
                const time = Date.now() * 0.001;
                light.intensity = 0.5 + Math.sin(time + index) * 0.3;
                
                // 轻微的位置变化
                light.position.y += Math.sin(time * 2 + index) * 0.1;
            });
            
            requestAnimationFrame(animateLight);
        };
        
        animateLight();
    }
    
    createParticleEffects() {
        if (!this.visualSettings.enableParticles) return;
        
        // 创建飘浮粒子效果
        this.createFloatingParticles();
        
        // 创建能量流效果
        this.createEnergyStreams();
        
        console.log('✨ Particle effects created');
    }
    
    createFloatingParticles() {
        const particleCount = this.qualitySettings.particleCount;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 位置
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = Math.random() * 50;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;
            
            // 颜色 - 绿色系
            colors[i3] = 0.3 + Math.random() * 0.4;     // R
            colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G
            colors[i3 + 2] = 0.3 + Math.random() * 0.4; // B
            
            // 大小
            sizes[i] = Math.random() * 2 + 1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // 添加飘动效果
                    mvPosition.x += sin(time + position.y * 0.01) * 2.0;
                    mvPosition.z += cos(time + position.x * 0.01) * 2.0;
                    
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distance = length(gl_PointCoord - vec2(0.5));
                    if (distance > 0.5) discard;
                    
                    float alpha = 1.0 - distance * 2.0;
                    gl_FragColor = vec4(vColor, alpha * 0.6);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.particleSystems.set('floating', { mesh: particles, material });
        
        // 动画粒子
        const animateParticles = () => {
            material.uniforms.time.value = Date.now() * 0.001;
            requestAnimationFrame(animateParticles);
        };
        animateParticles();
    }
    
    createEnergyStreams() {
        // 创建能量流线效果
        const streamCount = 5;
        
        for (let i = 0; i < streamCount; i++) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-20 + i * 10, 0, -20),
                new THREE.Vector3(-10 + i * 8, 15, 0),
                new THREE.Vector3(0 + i * 6, 25, 20),
                new THREE.Vector3(10 + i * 4, 10, 40)
            ]);
            
            const geometry = new THREE.TubeGeometry(curve, 50, 0.2, 8, false);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.6,
                emissive: 0x004422,
                emissiveIntensity: 0.5
            });
            
            const stream = new THREE.Mesh(geometry, material);
            this.scene.add(stream);
            this.particleSystems.set(`stream_${i}`, { mesh: stream, material });
        }
    }
    
    setupAdvancedPostProcessing() {
        if (!this.qualitySettings.postProcessing) return;
        
        // 重新创建后处理管道
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // 基础渲染通道
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // 辉光效果 - 增强版
        if (this.visualSettings.enableBloom) {
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
                0.8,  // 强度
                0.6,  // 半径
                0.1   // 阈值
            );
            this.composer.addPass(bloomPass);
        }
        
        // 色调映射通道
        const toneMappingPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                exposure: { value: 1.2 },
                whitePoint: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float exposure;
                uniform float whitePoint;
                varying vec2 vUv;
                
                vec3 ACESFilmicToneMapping(vec3 color) {
                    color *= exposure;
                    color = (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
                    return clamp(color, 0.0, 1.0);
                }
                
                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec3 color = ACESFilmicToneMapping(texel.rgb);
                    gl_FragColor = vec4(color, texel.a);
                }
            `
        });
        this.composer.addPass(toneMappingPass);
        
        // 颜色校正通道
        const colorCorrectionPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                brightness: { value: 0.1 },
                contrast: { value: 1.1 },
                saturation: { value: 1.2 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float brightness;
                uniform float contrast;
                uniform float saturation;
                varying vec2 vUv;
                
                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec3 color = texel.rgb;
                    
                    // 亮度
                    color += brightness;
                    
                    // 对比度
                    color = (color - 0.5) * contrast + 0.5;
                    
                    // 饱和度
                    float gray = dot(color, vec3(0.299, 0.587, 0.114));
                    color = mix(vec3(gray), color, saturation);
                    
                    gl_FragColor = vec4(color, texel.a);
                }
            `
        });
        this.composer.addPass(colorCorrectionPass);
        
        // 抗锯齿通道
        if (this.qualitySettings.antialias) {
            const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
            fxaaPass.material.uniforms['resolution'].value.x = 1 / this.container.clientWidth;
            fxaaPass.material.uniforms['resolution'].value.y = 1 / this.container.clientHeight;
            this.composer.addPass(fxaaPass);
        }
        
        console.log('🎬 Advanced post-processing pipeline setup complete');
    }
    
    // 重写城市生成以使用增强材质
    generateCity(params = {}) {
        const {
            seed = 42,
            gridSize = 8,
            maxHeight = 20,
            density = 0.7,
            useLOD = true,
            useMerging = true,
            visualEnhancement = true
        } = params;
        
        console.log('🏗️ Generating visually enhanced city...');
        
        // 调用父类方法
        super.generateCity({
            ...params,
            visualEnhancement: false // 避免重复处理
        });
        
        if (visualEnhancement) {
            // 应用视觉增强
            this.applyVisualEnhancements();
        }
        
        console.log('✨ Visually enhanced city generation complete');
    }
    
    applyVisualEnhancements() {
        // 替换建筑材质为增强版本
        this.scene.traverse((object) => {
            if (object.isMesh && object.userData.type !== 'ground') {
                const materialKey = this.selectEnhancedMaterial(object);
                const enhancedMaterial = this.enhancedMaterials.get(materialKey);
                
                if (enhancedMaterial) {
                    object.material = enhancedMaterial;
                }
                
                // 添加太阳能板到部分建筑顶部
                if (Math.random() > 0.7) {
                    this.addSolarPanels(object);
                }
                
                // 添加绿化屋顶到部分建筑
                if (Math.random() > 0.6) {
                    this.addGreenRoof(object);
                }
            }
        });
        
        // 升级地面材质
        this.upgradeGroundMaterial();
        
        // 添加水面效果
        this.addWaterFeatures();
    }
    
    selectEnhancedMaterial(object) {
        const random = Math.random();
        
        if (random < 0.3) return 'building_glass_advanced';
        if (random < 0.5) return 'building_metal';
        if (random < 0.7) return 'building_concrete';
        if (random < 0.9) return 'building_emissive';
        return 'building_glass_advanced';
    }
    
    addSolarPanels(building) {
        const solarGeometry = new THREE.PlaneGeometry(
            building.scale.x * 0.8,
            building.scale.z * 0.8
        );
        const solarMaterial = this.enhancedMaterials.get('solar_panel');
        const solarPanel = new THREE.Mesh(solarGeometry, solarMaterial);
        
        solarPanel.position.copy(building.position);
        solarPanel.position.y += building.scale.y / 2 + 0.1;
        solarPanel.rotation.x = -Math.PI / 2;
        
        this.scene.add(solarPanel);
    }
    
    addGreenRoof(building) {
        const greenGeometry = new THREE.PlaneGeometry(
            building.scale.x * 0.9,
            building.scale.z * 0.9
        );
        const greenMaterial = this.enhancedMaterials.get('green_roof');
        const greenRoof = new THREE.Mesh(greenGeometry, greenMaterial);
        
        greenRoof.position.copy(building.position);
        greenRoof.position.y += building.scale.y / 2 + 0.05;
        greenRoof.rotation.x = -Math.PI / 2;
        
        this.scene.add(greenRoof);
    }
    
    upgradeGroundMaterial() {
        this.scene.traverse((object) => {
            if (object.isMesh && object.material && object.material.color && 
                object.material.color.getHex() === 0x1a237e) {
                object.material = this.enhancedMaterials.get('ground_advanced');
            }
        });
    }
    
    addWaterFeatures() {
        // 添加小型水景
        const waterGeometry = new THREE.PlaneGeometry(15, 15);
        const waterMaterial = this.enhancedMaterials.get('water');
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        
        water.position.set(20, 0.1, 20);
        water.rotation.x = -Math.PI / 2;
        water.receiveShadow = true;
        
        this.scene.add(water);
        
        // 添加水面动画
        const animateWater = () => {
            const time = Date.now() * 0.001;
            water.position.y = 0.1 + Math.sin(time) * 0.05;
            requestAnimationFrame(animateWater);
        };
        animateWater();
    }
    
    // 重写渲染循环以支持视觉效果
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
    
    // 获取视觉增强统计信息
    getVisualStats() {
        return {
            ...this.getEnhancedStats(),
            visual: {
                enhancedMaterials: this.enhancedMaterials.size,
                particleSystems: this.particleSystems.size,
                dynamicLights: this.dynamicLights.length,
                postProcessingEnabled: !!this.composer,
                visualSettings: { ...this.visualSettings }
            }
        };
    }
    
    // 清理视觉增强资源
    dispose() {
        super.dispose();
        
        // 清理增强材质
        this.enhancedMaterials.forEach(material => material.dispose());
        this.enhancedMaterials.clear();
        
        // 清理粒子系统
        this.particleSystems.forEach(system => {
            if (system.mesh.geometry) system.mesh.geometry.dispose();
            if (system.material) system.material.dispose();
        });
        this.particleSystems.clear();
        
        console.log('✨ Visual enhanced renderer resources disposed');
    }
}

// 导出视觉增强版渲染器
window.VisualEnhancedRenderer = VisualEnhancedRenderer;