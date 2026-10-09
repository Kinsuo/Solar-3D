// 工具函数

// 天文单位转换（1 AU = 149,597,870.7 km）
const AU = 1;

// 场景：1 单位 = 1 AU（轨道半长轴）；行星 mesh 半径按赤道半径相对地球比例。
// 真实太阳半径约 109× 地球，在 AU 尺度下会吞没内侧轨道，故太阳取 min(109×R_earth_scene, k×a_水星) 作可视折中（参考 NASA Planetary Fact Sheet）。
const R_KM_EARTH = 6378.137;
const SCENE_RADIUS_EARTH = 0.02;
const MERCURY_ORBIT_AU = 0.387;
const SUN_RADIUS_CAP_K = 0.25;

function planetRadiusFromKm(equatorialKm) {
    return SCENE_RADIUS_EARTH * (equatorialKm / R_KM_EARTH);
}

const SUN_RADIUS_SCENE = Math.min(
    SCENE_RADIUS_EARTH * 109,
    MERCURY_ORBIT_AU * SUN_RADIUS_CAP_K
);

// 行星数据配置（distance：平均轨道半长轴 AU；赤道半径 km：水星 2439.7、金星 6051.8、地球 6378.137、火星 3396.2、木星 71492、土星 60268、天王星 25559、海王星 24764）
const PLANET_DATA = {
    sun: {
        name: '太阳',
        nameEn: 'Sun',
        radius: SUN_RADIUS_SCENE,
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 1.5,
        info: '太阳是太阳系的中心恒星，占据了整个系统总质量的99.86%。它的核心发生着剧烈的核聚变，不仅发光发热，其强大的引力还维持着八大行星的运行轨道。太阳表面拥有黑子和耀斑活动。',
        diameter: '1,392,700 km',
        mass: '1.989 × 10³⁰ kg',
        rotationPeriod: '25-35 天',
        rotationPeriodDays: 25.38,
        axialTilt: 7.25,
        temperature: '5,500 °C'
    },
    mercury: {
        name: '水星',
        nameEn: 'Mercury',
        radius: planetRadiusFromKm(2439.7),
        distance: MERCURY_ORBIT_AU,
        eccentricity: 0.2056,
        period: 88,
        inclination: 7.005,
        ascendingNode: 48.331,
        color: 0x8c7853,
        speed: 1 / 88,
        initialAngle: 4.1,
        info: '水星是太阳系中最小且最靠近核心的行星。由于缺乏能保留热量的大气层，它的昼夜温差极大：白天高达430°C，夜晚骤降至-180°C。水星表面布满了如同月球般荒凉的撞击坑。',
        diameter: '4,879 km',
        mass: '3.301 × 10²³ kg',
        rotationPeriod: '58.6 天',
        rotationPeriodDays: 58.646,
        axialTilt: 0.034,
        orbitalSpeed: '47.87 km/s',
        temperature: '-180 ~ 430 °C'
    },
    venus: {
        name: '金星',
        nameEn: 'Venus',
        radius: planetRadiusFromKm(6051.8),
        distance: 0.723,
        eccentricity: 0.0067,
        period: 225,
        inclination: 3.394,
        ascendingNode: 76.68,
        color: 0xffc649,
        speed: 1 / 225,
        initialAngle: 3.4,
        info: '金星大小与地球相仿，被浓厚的二氧化碳云层包围。它的“失控温室效应”使地表温度达到了炼狱般的465°C，是太阳系中最热的行星，天空中不时还降下腐蚀性极强的硫酸雨。',
        diameter: '12,104 km',
        mass: '4.867 × 10²⁴ kg',
        rotationPeriod: '243 天',
        rotationPeriodDays: -243.02,
        axialTilt: 177.36,
        orbitalSpeed: '35.02 km/s',
        temperature: '465 °C'
    },
    earth: {
        name: '地球',
        nameEn: 'Earth',
        radius: SCENE_RADIUS_EARTH,
        distance: 1.0,
        eccentricity: 0.0167,
        period: 365.25,
        inclination: 0.0,
        ascendingNode: 0.0,
        color: 0x6b93d6,
        speed: 1 / 365.25,
        initialAngle: 6.2,
        info: '地球是我们唯一的家园，目前唯一已知存在生命的星球。距离太阳第三远的它，拥有丰富的液态水、适宜的温度和保护大气带。71% 的表面被蓝色的海洋所覆盖，内部存在活跃地质运动。',
        diameter: '12,742 km',
        mass: '5.972 × 10²⁴ kg',
        rotationPeriod: '23.9 小时',
        rotationPeriodDays: 0.997269,
        axialTilt: 23.44,
        orbitalSpeed: '29.78 km/s',
        temperature: '-88 ~ 58 °C',
        moons: [
            {
                name: '月球',
                nameEn: 'Moon',
                radius: SCENE_RADIUS_EARTH * 0.27,
                distance: 0.1, // scene distance
                eccentricity: 0.0549,
                period: 27.3,
                inclination: 5.145,
                ascendingNode: 125.08,
                color: 0xaaaaaa,
                speed: 1 / 27.3,
                initialAngle: 0,
                info: '月球是地球唯一的天然卫星，它总是以同一面朝向地球。月球引力塑造了地球海洋的潮汐现象。',
                diameter: '3,474 km',
                mass: '7.342 × 10²² kg',
                rotationPeriod: '27.3 天',
                rotationPeriodDays: 27.321,
                axialTilt: 6.68,
                orbitalSpeed: '1.022 km/s',
                temperature: '-173 ~ 127 °C'
            }
        ]
    },
    mars: {
        name: '火星',
        nameEn: 'Mars',
        radius: planetRadiusFromKm(3396.2),
        distance: 1.524,
        eccentricity: 0.0934,
        period: 687,
        inclination: 1.850,
        ascendingNode: 49.562,
        color: 0xc1440e,
        speed: 1 / 687,
        initialAngle: 0.9,
        info: '火星因表面富含红色氧化铁(铁锈)沙尘而被被称为“红色星球”。它拥有整个太阳系最高的火山“奥林帕斯山”，和最深的峡谷。曾一度拥有液态水，是人类探测外星生命的热门目标。',
        diameter: '6,779 km',
        mass: '6.417 × 10²³ kg',
        rotationPeriod: '24.6 小时',
        rotationPeriodDays: 1.025957,
        axialTilt: 25.19,
        orbitalSpeed: '24.07 km/s',
        temperature: '-153 ~ 20 °C'
    },
    jupiter: {
        name: '木星',
        nameEn: 'Jupiter',
        radius: planetRadiusFromKm(71492),
        distance: 5.204,
        eccentricity: 0.0489,
        period: 4333,
        inclination: 1.303,
        ascendingNode: 100.464,
        color: 0xd8ca9d,
        speed: 1 / 4333,
        initialAngle: 0.3,
        info: '木星是太阳系体积与质量最大的气态巨行星。它的经典地标是南半球被称为“大红斑”的巨型反气旋风暴。它有着极其庞大的卫星系统，就像一个迷进行星系。',
        diameter: '139,820 km',
        mass: '1.898 × 10²⁷ kg',
        rotationPeriod: '9.93 小时',
        rotationPeriodDays: 0.41354,
        axialTilt: 3.13,
        orbitalSpeed: '13.07 km/s',
        temperature: '-110 °C',
        moons: [
            {
                name: '木卫一', nameEn: 'Io',
                radius: SCENE_RADIUS_EARTH * 0.28, distance: 0.25, eccentricity: 0.0041,
                period: 1.77, inclination: 0.04, ascendingNode: 0.0, color: 0xddcc66, speed: 1 / 1.77,
                info: '木卫一（伊奥）是太阳系中火山活动最剧烈的天体。它的表面布满了数百座活跃火山，不断喷发的硫磺将其染成了独特的黄色。木星强大的潮汐力是其火山活动的核心驱动力。',
                diameter: '3,643 km', mass: '8.93 × 10²² kg',
                rotationPeriod: '1.77 天', rotationPeriodDays: 1.769, axialTilt: 0.0, orbitalSpeed: '17.33 km/s',
                temperature: '-143 °C'
            },
            {
                name: '木卫二', nameEn: 'Europa',
                radius: SCENE_RADIUS_EARTH * 0.24, distance: 0.35, eccentricity: 0.0094,
                period: 3.55, inclination: 0.47, ascendingNode: 0.0, color: 0xbbbbff, speed: 1 / 3.55,
                info: '木卫二（欧罗巴）表面覆盖着一层光滑的冰壳，冰层下方极可能隐藏着一片液态海洋。科学家认为它是太阳系中最有可能存在地外生命的天体之一，是NASA未来探测的重点目标。',
                diameter: '3,122 km', mass: '4.80 × 10²² kg',
                rotationPeriod: '3.55 天', rotationPeriodDays: 3.551, axialTilt: 0.1, orbitalSpeed: '13.74 km/s',
                temperature: '-160 °C'
            },
            {
                name: '木卫三', nameEn: 'Ganymede',
                radius: SCENE_RADIUS_EARTH * 0.41, distance: 0.50, eccentricity: 0.0013,
                period: 7.15, inclination: 0.20, ascendingNode: 0.0, color: 0xcccccc, speed: 1 / 7.15,
                info: '木卫三（盖尼米德）是太阳系中最大的卫星，直径甚至超过了水星。它是唯一已知拥有自身磁场的卫星，表面由古老的暗色撞击坑区域和明亮的槽纹地形交替组成。',
                diameter: '5,268 km', mass: '1.48 × 10²³ kg',
                rotationPeriod: '7.15 天', rotationPeriodDays: 7.155, axialTilt: 0.2, orbitalSpeed: '10.88 km/s',
                temperature: '-163 °C'
            },
            {
                name: '木卫四', nameEn: 'Callisto',
                radius: SCENE_RADIUS_EARTH * 0.38, distance: 0.70, eccentricity: 0.0074,
                period: 16.69, inclination: 0.28, ascendingNode: 0.0, color: 0x999999, speed: 1 / 16.69,
                info: '木卫四（卡里斯托）是伽利略卫星中最外层的一颗，表面布满了古老的撞击坑，是太阳系中撞击坑密度最高的天体之一。它距离木星较远，受辐射影响较小，是未来人类建立木星系基地的候选地。',
                diameter: '4,821 km', mass: '1.08 × 10²³ kg',
                rotationPeriod: '16.69 天', rotationPeriodDays: 16.689, axialTilt: 0.4, orbitalSpeed: '8.20 km/s',
                temperature: '-139 °C'
            }
        ]
    },
    saturn: {
        name: '土星',
        nameEn: 'Saturn',
        radius: planetRadiusFromKm(60268),
        distance: 9.583,
        eccentricity: 0.0565,
        period: 10759,
        inclination: 2.489,
        ascendingNode: 113.665,
        color: 0xfad5a5,
        speed: 1 / 10759,
        initialAngle: 5.5,
        info: '土星以极其壮美的星环系统闻名于世，主要由无数闪耀的冰块和岩石碎片组成。它的密度是八大行星中最低的，由于比水还轻，如果能有足够大的海洋，土星甚至可以漂浮起来。',
        diameter: '116,460 km',
        mass: '5.683 × 10²⁶ kg',
        rotationPeriod: '10.7 小时',
        rotationPeriodDays: 0.444,
        axialTilt: 26.73,
        orbitalSpeed: '9.68 km/s',
        temperature: '-140 °C',
        // 主环约 1.2～2.3 倍土星赤道半径（示意）
        rings: {
            innerRatio: 1.25,
            outerRatio: 2.25,
            color: 0xc9b89e,
            opacity: 0.9,
        },
    },
    uranus: {
        name: '天王星',
        nameEn: 'Uranus',
        radius: planetRadiusFromKm(25559),
        distance: 19.19,
        eccentricity: 0.0457,
        period: 30689,
        inclination: 0.773,
        ascendingNode: 74.006,
        color: 0x4fd0e7,
        speed: 1 / 30689,
        initialAngle: 4.7,
        info: '天王星是一颗美丽淡蓝色的冰巨星，表面极端寒冷。它的自转轴严重倾斜到了98度，几乎是“躺在轨道上打滚”般地绕太阳运行。在其漫长的公转周期中，南北两极将经历长达42年的极昼夜。',
        diameter: '50,724 km',
        mass: '8.681 × 10²⁵ kg',
        rotationPeriod: '17.2 小时',
        rotationPeriodDays: -0.718,
        axialTilt: 97.77,
        orbitalSpeed: '6.80 km/s',
        temperature: '-195 °C'
    },
    neptune: {
        name: '海王星',
        nameEn: 'Neptune',
        radius: planetRadiusFromKm(24764),
        distance: 30.07,
        eccentricity: 0.0113,
        period: 60182,
        inclination: 1.770,
        ascendingNode: 131.784,
        color: 0x4b70dd,
        speed: 1 / 60182,
        initialAngle: 5.9,
        info: '海王星是太阳系最边缘的也是最猛烈的冰巨星，表面刮着风速超过音速的恐怖风暴。它是历史上第一颗人类通过数学算计出其轨道，进而用望远镜验证其存在的行星。',
        diameter: '49,244 km',
        mass: '1.024 × 10²⁶ kg',
        rotationPeriod: '16.1 小时',
        rotationPeriodDays: 0.671,
        axialTilt: 28.32,
        orbitalSpeed: '5.43 km/s',
        temperature: '-201 °C'
    },
};

// 星点用软圆形贴图（无贴图时 Points 在 WebGL 里多为方块）
function createStarPointTexture() {
    const n = 64;
    const canvas = document.createElement('canvas');
    canvas.width = n;
    canvas.height = n;
    const ctx = canvas.getContext('2d');
    const cx = n / 2;
    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, n, n);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

// 创建星空背景 (银河系)
function createStarField(scene, count = 10000) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    // 原点附近不布星
    const minDistSq = 220 * 220;
    const span = 3500;

    const color1 = new THREE.Color(0xffffff);
    const color2 = new THREE.Color(0x88bbff);
    const color3 = new THREE.Color(0xffcc88);
    const colorTemp = new THREE.Color();

    for (let i = 0; i < count; i++) {
        let x, y, z;
        do {
            // Milky Way band bias
            if (Math.random() > 0.3) {
                // Disk distribution
                const radius = (Math.random() * span / 2) + 200;
                const angle = Math.random() * Math.PI * 2;
                // Add some thickness (y) and inclination
                const thickness = (Math.random() - 0.5) * 400 * Math.pow(Math.random(), 2);
                x = Math.cos(angle) * radius;
                z = Math.sin(angle) * radius;
                y = thickness;
                
                // Tilt the galaxy slightly
                const tilt = 0.4;
                const ty = y * Math.cos(tilt) - z * Math.sin(tilt);
                const tz = y * Math.sin(tilt) + z * Math.cos(tilt);
                y = ty; z = tz;
            } else {
                // Random sphere distribution
                x = (Math.random() - 0.5) * span;
                y = (Math.random() - 0.5) * span;
                z = (Math.random() - 0.5) * span;
            }
        } while (x * x + y * y + z * z < minDistSq);
        positions.push(x, y, z);
        
        // Random star color
        const rand = Math.random();
        if (rand < 0.3) colorTemp.copy(color2);
        else if (rand < 0.6) colorTemp.copy(color3);
        else colorTemp.copy(color1);
        
        const bright = 0.5 + Math.random() * 0.5;
        colors.push(colorTemp.r * bright, colorTemp.g * bright, colorTemp.b * bright);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        map: createStarPointTexture(),
        size: 3.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    return stars;
}

// 创建轨道线 (支持极坐标方程的椭圆)
function createOrbitLine(a, e = 0, segments = 128) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        points.push(new THREE.Vector3(x, 0, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.3
    });
    
    return new THREE.Line(geometry, material);
}

// 创建文本标签（使用CSS2DRenderer的简化版本）
function createPlanetLabel(planet, name) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = '#ffffff';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5, 0.125, 1);
    sprite.position.set(0, planet.radius * 2, 0);
    
    return sprite;
}

// 辅助函数：限制数值范围
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// 辅助函数：线性插值
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// 日期工具函数
// 计算从基准日期到目标日期的天数差
function daysSinceEpoch(date) {
    // 使用2000年1月1日作为基准日期（J2000.0历元）
    const epoch = new Date('2000-01-01T00:00:00Z');
    const diff = date - epoch;
    return diff / (1000 * 60 * 60 * 24);
}

// 解开普勒方程 M = E - e*sin(E) 获取偏近点角 E (Newton-Raphson 法)
function solveKepler(M, e) {
    let E = M;
    for (let i = 0; i < 5; i++) {
        E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    return E;
}

// 根据日期计算行星当前的真近点角(极角 theta)
function calculatePlanetAngle(date, period, initialAngle = 0, e = 0) {
    const days = daysSinceEpoch(date);
    // 平近点角 M
    const M = (days / period * Math.PI * 2) + initialAngle;
    
    if (e === 0) return M % (Math.PI * 2);
    
    // 偏近点角 E
    const E = solveKepler(M, e);
    // 真近点角 theta
    const theta = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2));
    
    return theta % (Math.PI * 2);
}

// 格式化日期时间显示
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return {
        date: `${year}/${month}/${day}`,
        time: `${hours}:${minutes}:${seconds}`
    };
}

// === 新增视觉贴图工具函数 ===
// 创建太阳日冕贴图
function createCoronaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 230, 200, 1.0)');
    grad.addColorStop(0.3, 'rgba(255, 200, 100, 0.8)');
    grad.addColorStop(0.6, 'rgba(255, 100, 20, 0.4)');
    grad.addColorStop(1, 'rgba(255, 50, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
}

// 创建太阳光球表面纹理
function createSunSurfaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff8c00';
    ctx.fillRect(0, 0, 512, 512);
    
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 8 + 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() > 0.8 ? 'rgba(50, 20, 0, 0.6)' : 'rgba(255, 255, 100, 0.3)';
        ctx.filter = 'blur(3px)';
        ctx.fill();
    }
    ctx.filter = 'none';
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

// 创建土星环贴图 (带细节间隙)
function createRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 2;
    const ctx = canvas.getContext('2d');
    for (let x = 0; x < 512; x++) {
        const nx = x / 512;
        let alpha = Math.sin(nx * Math.PI) * 0.8 + 0.2;
        if (nx > 0.65 && nx < 0.72) alpha *= 0.1;
        if (nx > 0.4 && nx < 0.45) alpha *= 0.3;
        ctx.fillStyle = `rgba(210, 190, 160, ${alpha})`;
        ctx.fillRect(x, 0, 1, 2);
    }
    return new THREE.CanvasTexture(canvas);
}

// 格式化倍速为带时间单位的字符串
function formatSpeed(timeScale) {
    const secondsPerDay = 24 * 3600;
    const simSecondsPerSec = timeScale * secondsPerDay;
    
    if (simSecondsPerSec < 60) {
        return `${Math.round(simSecondsPerSec)} 秒/秒`;
    } else if (simSecondsPerSec < 3600) {
        const mins = Math.floor(simSecondsPerSec / 60);
        const secs = Math.round(simSecondsPerSec % 60);
        return secs > 0 ? `${mins}分${secs}秒/秒` : `${mins} 分钟/秒`;
    } else if (simSecondsPerSec < secondsPerDay) {
        const hours = Math.floor(simSecondsPerSec / 3600);
        const mins = Math.round((simSecondsPerSec % 3600) / 60);
        return mins > 0 ? `${hours}小时${mins}分/秒` : `${hours} 小时/秒`;
    } else {
        const days = Math.round(timeScale * 10) / 10;
        if (days >= 365) {
            const years = (days / 365.25).toFixed(1);
            return `${days} 天/秒 (约 ${years} 年/秒)`;
        }
        return `${days} 天/秒`;
    }
}

// 格式化公转周期
function formatPeriod(days) {
    if (days >= 365.25) {
        const years = (days / 365.25).toFixed(1);
        return `${days} 天 (约 ${years} 年)`;
    }
    return `${days} 天`;
}
