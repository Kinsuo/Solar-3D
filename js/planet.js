// 行星类

class Planet {
    constructor(data, scene) {
        this.data = data;
        this.name = data.name;
        this.distance = data.distance || 0;
        this.period = data.period || 365;
        this.speed = data.speed || 1 / 365;
        this.initialAngle = data.initialAngle || 0; // 初始角度（相对于J2000.0历元）
        this.eccentricity = data.eccentricity || 0;
        this.angle = this.initialAngle; // 当前角度
        
        // 创建行星几何体和材质
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        let material;
        const textureLoader = new THREE.TextureLoader();
        
        const textureUrls = {
            '水星': TEXTURES_B64['2k_mercury.jpg'],
            '金星': TEXTURES_B64['2k_venus_surface.jpg'],
            '地球': TEXTURES_B64['2k_earth_daymap.jpg'],
            '火星': TEXTURES_B64['2k_mars.jpg'],
            '木星': TEXTURES_B64['2k_jupiter.jpg'],
            '土星': TEXTURES_B64['2k_saturn.jpg'],
            '天王星': TEXTURES_B64['2k_uranus.jpg'],
            '海王星': TEXTURES_B64['2k_neptune.jpg'],
            '月球': TEXTURES_B64['2k_moon.jpg']
        };
        
        if (textureUrls[this.name]) {
            material = new THREE.MeshStandardMaterial({
                map: textureLoader.load(textureUrls[this.name]),
                metalness: 0.1,
                roughness: 0.8
            });
        } else {
            material = new THREE.MeshStandardMaterial({
                color: data.color,
                metalness: 0.3,
                roughness: 0.7
            });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.radius = data.radius;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // 我们可以在地球节点再添一个云层mesh
        if (this.name === '地球') {
            const cloudMap = textureLoader.load(TEXTURES_B64['2k_earth_clouds.jpg']);
            const cloudGeometry = new THREE.SphereGeometry(data.radius * 1.015, 32, 32);
            const cloudMaterial = new THREE.MeshPhongMaterial({
                map: cloudMap,
                transparent: true,
                opacity: 0.8,
                blending: THREE.NormalBlending,
                depthWrite: false
            });
            this.clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
            this.mesh.add(this.clouds);
        }

        this.ringMesh = null;
        if (data.rings) {
            const rr = data.radius;
            const inner = rr * data.rings.innerRatio;
            const outer = rr * data.rings.outerRatio;
            const ringGeom = new THREE.RingGeometry(inner, outer, 96);
            
            // Ensure proper UV mapping for rings
            const pos = ringGeom.attributes.position;
            const v3 = new THREE.Vector3();
            for (let i = 0; i < pos.count; i++) {
                v3.fromBufferAttribute(pos, i);
                const r = v3.length();
                // Map radius between inner and outer to U (0 to 1)
                const u = (r - inner) / (outer - inner);
                ringGeom.attributes.uv.setXY(i, u, 0.5);
            }
            
            const ringMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: createRingTexture(),
                transparent: true,
                opacity: data.rings.opacity != null ? data.rings.opacity : 0.88,
                side: THREE.DoubleSide,
                metalness: 0.12,
                roughness: 0.88,
            });
            this.ringMesh = new THREE.Mesh(ringGeom, ringMat);
            this.ringMesh.rotation.x = -Math.PI / 2;
            this.mesh.add(this.ringMesh);
        }
        
        // 创建轨道平面（实现三维轨道倾角和升交点黄经）
        this.orbitPlane = new THREE.Group();
        this.orbitPlane.rotation.z = THREE.MathUtils.degToRad(data.inclination || 0);
        this.orbitPlane.rotation.y = THREE.MathUtils.degToRad(data.ascendingNode || 0);
        
        // 创建自转轴倾角组（实现自转倾角）
        this.tiltGroup = new THREE.Group();
        this.tiltGroup.rotation.z = THREE.MathUtils.degToRad(data.axialTilt || 0);
        this.tiltGroup.add(this.mesh);
        
        // 创建轨道组
        this.orbitGroup = new THREE.Group();
        this.orbitGroup.add(this.tiltGroup);
        
        // 创建轨道线
        if (this.distance > 0) {
            this.orbitLine = createOrbitLine(this.distance, this.eccentricity);
            this.orbitPlane.add(this.orbitLine); // 轨道线放在三维倾斜平面上
        }
        
        
        
        this.orbitPlane.add(this.orbitGroup);
        scene.add(this.orbitPlane);
        
        // Moons
        this.moons = [];
        if (data.moons) {
            data.moons.forEach(moonData => {
                const moon = new Planet(moonData, this.orbitGroup);
                this.moons.push(moon);
            });
        }
        
        // 更新初始位置
        this.updatePosition();
    }
    
    updatePosition() {
        if (this.distance > 0) {
            const r = this.distance * (1 - this.eccentricity * this.eccentricity) / (1 + this.eccentricity * Math.cos(this.angle));
            const x = Math.cos(this.angle) * r;
            const z = Math.sin(this.angle) * r;
            this.orbitGroup.position.set(x, 0, z);
        }
    }
    
    update(deltaTime, timeScale = 1) {
        // 注意：公转位置的角度更新已移交给 setAngleFromDate 统一管理（由绝对时间驱动，以支持非匀速即时速）

        // 行星自转
        if (this.data.rotationPeriodDays) {
            const daysPassed = deltaTime * timeScale;
            // 真实物理自转角位移（弧度）
            const rotationAngle = (daysPassed / this.data.rotationPeriodDays) * 2 * Math.PI;
            this.mesh.rotation.y += rotationAngle;
            
            // 地球云层比地表自转稍快一些
            if (this.clouds) {
                this.clouds.rotation.y += rotationAngle * 1.08;
            }
        } else {
            this.mesh.rotation.y += deltaTime * 0.01;
            if (this.clouds) {
                this.clouds.rotation.y += deltaTime * 0.012;
            }
        }
        
        // 更新卫星
        if (this.moons) {
            this.moons.forEach(moon => moon.update(deltaTime, timeScale));
        }
    }
    
    // 根据日期设置角度 (从真实的开普勒积分求得)
    setAngleFromDate(date) {
        this.angle = calculatePlanetAngle(date, this.period, this.initialAngle, this.eccentricity);
        this.updatePosition();
        if (this.moons) {
            this.moons.forEach(moon => moon.setAngleFromDate(date));
        }
    }
    
    setOrbitVisible(visible) {
        if (this.orbitLine) {
            this.orbitLine.visible = visible;
        }
        if (this.moons) {
            this.moons.forEach(moon => moon.setOrbitVisible(visible));
        }
    }
    
    setLabelVisible(visible) {
        if (this.label) {
            this.label.visible = visible;
        }
        if (this.moons) {
            this.moons.forEach(moon => moon.setLabelVisible(visible));
        }
    }
    
    getPosition() {
        return this.orbitGroup.position.clone();
    }
    
    // 检查鼠标是否命中该天体（含土星环和轨道线），返回最近交点信息
    // 之所以返回 distance：用于在多天体/多轨道重叠时，选择射线最近命中，避免“遍历顺序”导致的覆盖问题（如月球轨道被地球轨道抢占）。
    intersects(raycaster) {
        const objs = [this.mesh];
        if (this.ringMesh) objs.push(this.ringMesh);
        if (this.orbitLine && this.orbitLine.visible) objs.push(this.orbitLine);

        let best = null;
        const hits = raycaster.intersectObjects(objs, false);
        if (hits.length > 0) {
            // intersectObjects 返回结果默认按 distance 升序
            best = { planet: this, distance: hits[0].distance };
        }

        // 继续检测它的卫星，取最近交点
        if (this.moons) {
            for (let moon of this.moons) {
                const hit = moon.intersects(raycaster);
                if (!hit) continue;
                if (!best || hit.distance < best.distance) best = hit;
            }
        }

        return best;
    }
    
    highlightOrbit() {
        if (this.orbitLine) {
            this.orbitLine.material.color.set(0x4fc3f7);
            this.orbitLine.material.opacity = 0.9;
            this.orbitLine.material.needsUpdate = true;
        }
    }
    
    unhighlightOrbit() {
        if (this.orbitLine) {
            this.orbitLine.material.color.set(0x444444);
            this.orbitLine.material.opacity = 0.3;
            this.orbitLine.material.needsUpdate = true;
        }
    }
    
    setSizeScale(scale) {
        this.mesh.scale.set(scale, scale, scale);
        
        // 提升行星上方的科普文字标签高度，防止和放大的球体穿插
        if (this.label) {
            const baseRadius = this.data.radius;
            this.label.position.y = baseRadius * scale * 2.0 + 0.15;
        }
        
        // 递归处理子天体/卫星
        if (this.moons) {
            this.moons.forEach(moon => moon.setSizeScale(scale));
        }
    }
}
