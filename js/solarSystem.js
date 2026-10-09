// 太阳系类

class SolarSystem {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        this.sun = null;
        
        this.createSun();
        this.createPlanets();
        this.createAsteroids();
        this.createComets();
    }
    
    createSun() {
        const sunData = PLANET_DATA.sun;
        const geometry = new THREE.SphereGeometry(sunData.radius, 32, 32);
        const textureLoader = new THREE.TextureLoader();
        const sunTex = textureLoader.load(TEXTURES_B64['2k_sun.jpg']);
        
        // 使用光球表面纹理
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: sunTex
        });
        
        this.sun = new THREE.Mesh(geometry, material);
        this.scene.add(this.sun);
        
        // 添加日冕精灵
        const coronaSpriteMat = new THREE.SpriteMaterial({
            map: createCoronaTexture(),
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const coronaSprite = new THREE.Sprite(coronaSpriteMat);
        coronaSprite.scale.set(sunData.radius * 4, sunData.radius * 4, 1);
        this.sun.add(coronaSprite);

        // 添加耀斑层（稍大的半透明发光球体）
        const glowGeom = new THREE.SphereGeometry(sunData.radius * 1.05, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: sunTex
        });
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        // 反向自转让表面看起来动态
        glowMesh.name = 'sunGlow';
        this.sun.add(glowMesh);
        
        // 添加太阳光
        this.sunLight = new THREE.PointLight(0xffffff, 2, 150);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.bias = -0.001;
        this.scene.add(this.sunLight);
        
        // 环境光
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.scene.add(this.ambientLight);
    }

    createAsteroids() {
        const count = 2500;
        const geom = new THREE.DodecahedronGeometry(0.015, 0);
        const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
        this.asteroidsMesh = new THREE.InstancedMesh(geom, mat, count);
        
        const dummy = new THREE.Object3D();
        const innerAu = 2.2;
        const outerAu = 3.2;
        
        this.asteroidsData = [];
        
        for (let i = 0; i < count; i++) {
            const distance = innerAu + Math.random() * (outerAu - innerAu);
            const angle = Math.random() * Math.PI * 2;
            const speed = (1 / Math.pow(distance, 1.5)) * (1/365) * (0.8 + Math.random()*0.4);
            const yOffset = (Math.random() - 0.5) * 0.15 * (1 - Math.abs((distance - 2.7)/0.5));
            
            this.asteroidsData.push({ distance, angle, speed, yOffset });
            
            dummy.position.set(Math.cos(angle)*distance, yOffset, Math.sin(angle)*distance);
            dummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
            const scale = 0.3 + Math.random();
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            this.asteroidsMesh.setMatrixAt(i, dummy.matrix);
        }
        this.scene.add(this.asteroidsMesh);
    }

    createComets() {
        this.comets = [];
        const createComet = (name, displayNameZh, a, e, period, color, info) => {
            const particleCount = 200;
            const geom = new THREE.BufferGeometry();
            const pos = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const cColor = new THREE.Color(color);
            
            for(let i=0; i<particleCount; i++) {
                const fade = Math.pow(1 - i/particleCount, 2);
                colors[i*3] = cColor.r * fade;
                colors[i*3+1] = cColor.g * fade;
                colors[i*3+2] = cColor.b * fade;
            }
            geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            const mat = new THREE.PointsMaterial({
                size: 0.2,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false,
                map: createStarPointTexture()
            });
            const mesh = new THREE.Points(geom, mat);
            this.scene.add(mesh);

            // 彗核拾取球：用于更容易的悬停/点击命中（不可见，但可被 Raycaster 命中）
            const nucleusGeom = new THREE.SphereGeometry(0.9, 12, 12);
            const nucleusMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.0,
                depthWrite: false
            });
            const nucleusMesh = new THREE.Mesh(nucleusGeom, nucleusMat);
            this.scene.add(nucleusMesh);

            const comet = {
                mesh,
                nucleusMesh,
                pos,
                a,
                e,
                period,
                color,
                angle: Math.random() * Math.PI * 2,
                history: [],
                len: particleCount,
                name: displayNameZh,
                data: {
                    nameEn: name,
                    info,
                    // 这里沿用卡片字段的语义（非严格物理单位，便于科普展示）
                    orbitalSpeed: '变化较大（近日点更快，远日点更慢）',
                },
                _visual: {
                    baseSize: mat.size,
                    baseOpacity: mat.opacity,
                },
                highlight() {
                    const m = this.mesh.material;
                    m.size = this._visual.baseSize * 1.8;
                    m.opacity = 1.0;
                    m.needsUpdate = true;
                },
                unhighlight() {
                    const m = this.mesh.material;
                    m.size = this._visual.baseSize;
                    m.opacity = this._visual.baseOpacity;
                    m.needsUpdate = true;
                },
                setNucleusPosition(x, y, z) {
                    this.nucleusMesh.position.set(x, y, z);
                },
            };

            mesh.userData.comet = comet;
            nucleusMesh.userData.comet = comet;
            return comet;
        };
        
        this.comets.push(createComet(
            'Halley',
            '哈雷彗星',
            17.8,
            0.967,
            75.3 * 365,
            0x00ffff,
            '哈雷彗星是最著名的周期彗星之一，平均约每 75–76 年回归一次。它在近日点附近会出现明亮彗发与彗尾，是人类历史上最早被确认“周期回归”的彗星。'
        ));
        this.comets.push(createComet(
            'Encke',
            '恩克彗星',
            2.2,
            0.847,
            3.3 * 365,
            0x88ffaa,
            '恩克彗星是一颗短周期彗星，公转周期约 3.3 年，是已知周期最短的一批周期彗星之一。它的轨道位于内太阳系附近，常被用来研究彗星物质随多次回归的演化。'
        ));
    }
    
    createPlanets() {
        const planetNames = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
        
        planetNames.forEach(name => {
            const planetData = PLANET_DATA[name];
            const planet = new Planet(planetData, this.scene);
            this.planets.push(planet);
        });
    }
    
    update(deltaTime, timeScale = 1) {
        // 更新所有行星
        this.planets.forEach(planet => {
            planet.update(deltaTime, timeScale);
        });
        
        // 太阳自转跟特效动画
        if (this.sun) {
            this.sun.rotation.y += deltaTime * 0.005;
            const glow = this.sun.getObjectByName('sunGlow');
            if (glow) glow.rotation.y -= deltaTime * 0.008; // 差速自转
        }

        // 更新小行星
        if (this.asteroidsMesh && this.asteroidsData) {
            const dummy = new THREE.Object3D();
            for (let i = 0; i < this.asteroidsData.length; i++) {
                const data = this.asteroidsData[i];
                data.angle += data.speed * deltaTime * timeScale;
                dummy.position.set(Math.cos(data.angle)*data.distance, data.yOffset, Math.sin(data.angle)*data.distance);
                // just update position
                this.asteroidsMesh.getMatrixAt(i, dummy.matrix);
                dummy.matrix.setPosition(dummy.position);
                this.asteroidsMesh.setMatrixAt(i, dummy.matrix);
            }
            this.asteroidsMesh.instanceMatrix.needsUpdate = true;
        }

        // 更新彗星
        if (this.comets) {
            this.comets.forEach(comet => {
                const r_current = comet.a * (1 - comet.e * comet.e) / (1 + comet.e * Math.cos(comet.angle));
                const dTheta = (1/comet.period) * (comet.a * comet.a / Math.max(0.1, r_current * r_current)) * deltaTime * timeScale;
                comet.angle += dTheta;
                
                const r = comet.a * (1 - comet.e * comet.e) / (1 + comet.e * Math.cos(comet.angle));
                const x = r * Math.cos(comet.angle);
                const z = r * Math.sin(comet.angle);

                // 同步彗核拾取球位置
                if (comet.setNucleusPosition) comet.setNucleusPosition(x, 0, z);
                
                comet.history.unshift(new THREE.Vector3(x, 0, z));
                if (comet.history.length > comet.len) comet.history.pop();
                
                for(let i=0; i<comet.len; i++) {
                    const pt = comet.history[i] || comet.history[comet.history.length-1] || new THREE.Vector3();
                    let offset = new THREE.Vector3();
                    if (pt.length() > 0) {
                       offset.copy(pt).normalize().multiplyScalar(i * 0.03); // 太阳风将尾巴吹向背离太阳的方向
                    }
                    comet.pos[i*3] = pt.x + offset.x;
                    comet.pos[i*3+1] = pt.y + offset.y;
                    comet.pos[i*3+2] = pt.z + offset.z;
                }
                comet.mesh.geometry.attributes.position.needsUpdate = true;
            });
        }
    }
    
    reset() {
        // 重置所有行星到当前时间的位置
        const now = new Date();
        this.setDate(now);
    }
    
    // 根据日期设置所有行星位置
    setDate(date) {
        this.planets.forEach(planet => {
            planet.setAngleFromDate(date);
        });
    }

    // 根据日期设置指定彗星位置（以 2061-07-28 哈雷彗星本次过近日点为基准，开普勒方程求解真近点角）
    setCometDate(date, cometName = '哈雷彗星') {
        const comets = this.getComets();
        const comet = comets.find(c => c.name === cometName);
        if (!comet || typeof solveKepler !== 'function') return;
        const perihelion = new Date('2061-07-28T00:00:00Z');
        const days = (date - perihelion) / 86400000;
        const M = (days / comet.period) * Math.PI * 2;
        const E = solveKepler(M % (Math.PI * 2), comet.e);
        const nu = 2 * Math.atan(Math.sqrt((1 + comet.e) / (1 - comet.e)) * Math.tan(E / 2));
        comet.angle = nu;
        comet.history = []; // 清空尾迹，避免日期跳变时拖出长尾
    }
    
    setOrbitsVisible(visible) {
        this.planets.forEach(planet => {
            planet.setOrbitVisible(visible);
        });
    }
    
    setLabelsVisible(visible) {
        this.planets.forEach(planet => {
            planet.setLabelVisible(visible);
        });
    }
    
    setFullLighting(enabled) {
        if (this.ambientLight) {
            this.ambientLight.intensity = enabled ? 0.95 : 0.05;
        }
        if (this.sunLight) {
            this.sunLight.intensity = enabled ? 1.2 : 2.0;
        }
    }
    
    setPlanetSizeScale(scale) {
        this.planets.forEach(planet => {
            planet.setSizeScale(scale);
        });
    }
    
    getPlanets() {
        return this.planets;
    }

    getComets() {
        return this.comets || [];
    }
}
