// 控制类

class SolarSystemControls {
    constructor(camera, renderer, solarSystem) {
        this.camera = camera;
        this.renderer = renderer;
        this.solarSystem = solarSystem;
        
        // 使用OrbitControls控制相机
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
            this.orbitControls.enableDamping = true;
            this.orbitControls.dampingFactor = 0.05;
            // 滚轮缩放范围：更近可看清行星细节，更远可俯瞰整系（海王星约 30 AU）
            this.orbitControls.minDistance = 0.35;
            this.orbitControls.maxDistance = 280;
            this.orbitControls.autoRotate = false;
        } else {
            console.warn('OrbitControls未加载，将使用基本鼠标控制');
            this.orbitControls = null;
            this.setupBasicControls();
        }
        
        // 状态
        this.isPlaying = true;
        this.timeScale = 10; // 默认10倍速
        this.showOrbits = true;
        this.showLabels = true;
        
        // 时间管理
        this.currentDate = new Date();
        this.startDate = new Date(); // 模拟开始时的日期
        this.lastDisplayUpdate = 0;
        
        // 初始化时使用当前日期设置行星位置
        this.solarSystem.setDate(this.currentDate);
        
        // 射线检测器（用于鼠标悬停和点击）
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Line.threshold = 0.15; // 轨道容差0.15足够，过大导致内外错乱
        this.raycaster.params.Points.threshold = 0.8; // 彗星尾迹为Points，适当阈值便于悬停
        this.mouse = new THREE.Vector2();
        this.hoveredPlanet = null;
        this.selectedPlanet = null;
        this.hoveredComet = null;
        this.selectedComet = null;
        
        // 绑定事件
        this.setupEventListeners();
        
        // 初始化时间显示
        this.updateTimeDisplay();
        
        // 初始化日期选择器为当前时间
        const dateInput = document.getElementById('date-picker');
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16);
        dateInput.value = localDateTime;
    }
    
    setupEventListeners() {
        // 播放/暂停按钮
        const playPauseBtn = document.getElementById('play-pause-btn');
        playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        // 重置按钮
        const resetBtn = document.getElementById('reset-btn');
        resetBtn.addEventListener('click', () => {
            this.reset();
        });
        
        // 速度控制按钮
        const speedButtons = document.querySelectorAll('.speed-btn');
        speedButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                speedButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.timeScale = parseFloat(btn.dataset.speed);
                this.updateCustomSpeedInput();
            });
        });
        
        // 自定义倍速输入
        const customSpeedInput = document.getElementById('custom-speed');
        customSpeedInput.addEventListener('change', (e) => {
            const speed = parseFloat(e.target.value) || 10;
            this.timeScale = Math.max(1, Math.min(1000, speed));
            e.target.value = this.timeScale;
            // 取消所有按钮的激活状态
            speedButtons.forEach(b => b.classList.remove('active'));
        });
        
        // 设置日期按钮
        const setDateBtn = document.getElementById('set-date-btn');
        setDateBtn.addEventListener('click', () => {
            const dateInput = document.getElementById('date-picker');
            const dateValue = dateInput.value;
            if (dateValue) {
                const selectedDate = new Date(dateValue);
                this.setDate(selectedDate);
            }
        });
        
        // 显示轨道复选框
        const showOrbitsCheck = document.getElementById('show-orbits');
        showOrbitsCheck.addEventListener('change', (e) => {
            this.showOrbits = e.target.checked;
            this.solarSystem.setOrbitsVisible(this.showOrbits);
        });
        
        // 显示标签复选框
        const showLabelsCheck = document.getElementById('show-labels');
        showLabelsCheck.addEventListener('change', (e) => {
            this.showLabels = e.target.checked;
            this.solarSystem.setLabelsVisible(this.showLabels);
        });
        
        // 重置视角按钮
        const resetViewBtn = document.getElementById('reset-view-btn');
        resetViewBtn.addEventListener('click', () => {
            this.resetView();
        });
        
        // 鼠标移动事件（用于悬停检测）
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            this.onMouseMove(e);
        });

        // 鼠标点击事件（选中/取消选中）
        this.renderer.domElement.addEventListener('click', (e) => {
            if (this.hoveredPlanet) {
                // 点击行星/轨道：清掉彗星选中
                if (this.selectedComet) {
                    this.selectedComet.unhighlight();
                    this.selectedComet = null;
                }
                if (this.selectedPlanet !== this.hoveredPlanet) {
                    // 取消旧选中（若旧选中不是当前悬停，则需要恢复暗色；若是当前悬停则保持高亮）
                    if (this.selectedPlanet && this.selectedPlanet !== this.hoveredPlanet) {
                        this.selectedPlanet.unhighlightOrbit();
                    }
                    this.selectedPlanet = this.hoveredPlanet;
                    // 此时 hoveredPlanet 已经是高亮的，不需要再调用 highlightOrbit
                    this.showPlanetCard(this.selectedPlanet);
                    this.syncOrbitHighlight();
                } else {
                    // 再次点击已选中的星球：保持选中锁定（确保卡片显示与高亮状态正确）
                    this.showPlanetCard(this.selectedPlanet);
                    this.syncOrbitHighlight();
                }
            } else if (this.hoveredComet) {
                // 点击彗星：弹卡片并锁定高亮（不影响行星轨道高亮逻辑）
                if (this.selectedPlanet) this.selectedPlanet = null;
                this.syncOrbitHighlight();

                if (this.selectedComet && this.selectedComet !== this.hoveredComet) {
                    this.selectedComet.unhighlight();
                }
                this.selectedComet = this.hoveredComet;
                this.selectedComet.highlight();
                this.showPlanetCard(this.selectedComet);
            } else {
                // 点击空白区域：取消选中，取消高亮
                this.selectedPlanet = null;
                if (this.selectedComet) {
                    this.selectedComet.unhighlight();
                    this.selectedComet = null;
                }
                this.hidePlanetCard();
                this.syncOrbitHighlight();
            }
        });
        
        // 卡片上的明确关闭按钮
        const closeCardBtn = document.getElementById('close-card-btn');
        if (closeCardBtn) {
            closeCardBtn.addEventListener('click', () => {
                this.selectedPlanet = null;
                if (this.selectedComet) {
                    this.selectedComet.unhighlight();
                    this.selectedComet = null;
                }
                this.hidePlanetCard();
                this.syncOrbitHighlight();
            });
        }
    }

    syncOrbitHighlight() {
        // 统一同步轨道亮暗状态：
        // - hoveredPlanet：高亮（悬停优先）
        // - selectedPlanet：高亮（选中锁定）
        // - 其他：变暗
        const roots = this.solarSystem.getPlanets();

        const visit = (planet) => {
            const shouldHighlight = planet === this.hoveredPlanet || planet === this.selectedPlanet;
            if (shouldHighlight) planet.highlightOrbit();
            else planet.unhighlightOrbit();

            if (planet.moons) {
                for (let moon of planet.moons) visit(moon);
            }
        };

        for (let planet of roots) visit(planet);

        // 彗星的高亮同步（不参与轨道线高亮，只处理粒子可视状态）
        const comets = this.solarSystem.getComets ? this.solarSystem.getComets() : [];
        for (let comet of comets) {
            const shouldHighlight = comet === this.hoveredComet || comet === this.selectedComet;
            if (shouldHighlight) comet.highlight();
            else comet.unhighlight();
        }
    }
    
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('play-pause-btn');
        btn.textContent = this.isPlaying ? '暂停' : '播放';
        
        if (this.selectedPlanet) {
            this.updateDistanceDisplay();
        }
    }
    
    reset() {
        // 重置到当前真实时间
        const now = new Date();
        this.setDate(now);
        this.startDate = new Date(now);
    }
    
    setDate(date) {
        this.currentDate = new Date(date);
        this.startDate = new Date(date);
        this.solarSystem.setDate(date);
        this.updateTimeDisplay();
    }
    
    updateTimeDisplay() {
        const timeDiv = document.getElementById('current-time');
        const dateDiv = document.getElementById('current-date');
        
        if (timeDiv && dateDiv) {
            const formatted = formatDateTime(this.currentDate);
            timeDiv.textContent = formatted.time;
            dateDiv.textContent = formatted.date;
        }
    }
    
    updateCustomSpeedInput() {
        const customSpeedInput = document.getElementById('custom-speed');
        if (customSpeedInput) {
            customSpeedInput.value = this.timeScale;
        }
    }
    
    resetView() {
        // 重置相机位置
        this.camera.position.set(0, 20, 50);
        this.camera.lookAt(0, 0, 0);
        if (this.orbitControls && this.orbitControls.reset) {
            this.orbitControls.reset();
        }
    }
    
    setupBasicControls() {
        // 基本的鼠标控制（如果OrbitControls不可用）
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;
                
                // 旋转相机
                const spherical = new THREE.Spherical();
                spherical.setFromVector3(this.camera.position);
                spherical.theta -= deltaX * 0.01;
                spherical.phi += deltaY * 0.01;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
                
                this.camera.position.setFromSpherical(spherical);
                this.camera.lookAt(0, 0, 0);
            }
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.renderer.domElement.addEventListener('wheel', (e) => {
            const delta = e.deltaY * 0.01;
            const distance = this.camera.position.length();
            const newDistance = Math.max(0.35, Math.min(280, distance + delta));
            this.camera.position.normalize().multiplyScalar(newDistance);
        });
    }
    
    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 检测与行星的交集
        const planets = this.solarSystem.getPlanets();
        let bestHit = null;

        for (let planet of planets) {
            const hit = planet.intersects(this.raycaster);
            if (!hit) continue;
            if (!bestHit || hit.distance < bestHit.distance) bestHit = hit;
        }

        const hitPlanet = bestHit ? bestHit.planet : null;

        // 检测与彗星的交集（优先命中彗核拾取球，其次才是 Points）
        const comets = this.solarSystem.getComets ? this.solarSystem.getComets() : [];
        let bestCometHit = null;
        for (let comet of comets) {
            const target = comet.nucleusMesh || comet.mesh;
            const hits = this.raycaster.intersectObject(target, false);
            if (!hits || hits.length === 0) continue;
            const d = hits[0].distance;
            if (!bestCometHit || d < bestCometHit.distance) bestCometHit = { comet, distance: d };
        }

        // 取最近命中（行星/卫星 vs 彗星）
        let nextHoveredPlanet = null;
        let nextHoveredComet = null;
        if (bestHit && bestCometHit) {
            if (bestCometHit.distance < bestHit.distance) nextHoveredComet = bestCometHit.comet;
            else nextHoveredPlanet = bestHit.planet;
        } else if (bestCometHit) {
            nextHoveredComet = bestCometHit.comet;
        } else {
            nextHoveredPlanet = hitPlanet;
        }
        
        const hoveredChanged = nextHoveredPlanet !== this.hoveredPlanet || nextHoveredComet !== this.hoveredComet;
        if (hoveredChanged) {
            // 离开旧悬停对象：如果不是选中状态则恢复暗色
            if (this.hoveredPlanet && this.hoveredPlanet !== this.selectedPlanet) {
                this.hoveredPlanet.unhighlightOrbit();
            }
            if (this.hoveredComet && this.hoveredComet !== this.selectedComet) {
                this.hoveredComet.unhighlight();
            }
            
            this.hoveredPlanet = nextHoveredPlanet;
            this.hoveredComet = nextHoveredComet;
            
            // 进入新悬停对象：高亮轨道/彗星，更新鼠标样式
            if (this.hoveredPlanet) {
                this.hoveredPlanet.highlightOrbit();
                this.renderer.domElement.style.cursor = 'pointer';
                this.updatePlanetInfo(this.hoveredPlanet);
            } else if (this.hoveredComet) {
                this.hoveredComet.highlight();
                this.renderer.domElement.style.cursor = 'pointer';
                this.updatePlanetInfo(this.hoveredComet);
            } else {
                this.renderer.domElement.style.cursor = 'default';
                this.updatePlanetInfo(null);
            }
        }
    }
    
    updatePlanetInfo(planet) {
        const infoDiv = document.getElementById('planet-info');
        if (!infoDiv) return;
        if (planet) {
            // 行星/卫星：distance(AU) + period(天)
            if (typeof planet.distance === 'number') {
                const distance = planet.distance.toFixed(2);
                const period = planet.period;
                infoDiv.innerHTML = `
                    <strong>${planet.name}</strong><br>
                    距离: ${distance} AU<br>
                    周期: ${period} 天
                `;
                return;
            }

            // 彗星：a(半长轴, AU) + period(天)
            if (typeof planet.a === 'number') {
                const a = planet.a.toFixed(2);
                const periodDays = planet.period;
                const periodYears = (periodDays / 365).toFixed(1);
                infoDiv.innerHTML = `
                    <strong>${planet.name}</strong><br>
                    半长轴: ${a} AU<br>
                    周期: ${periodYears} 年（约 ${Math.round(periodDays)} 天）
                `;
                return;
            }

            infoDiv.innerHTML = `<strong>${planet.name}</strong>`;
        } else {
            infoDiv.textContent = '鼠标悬停在行星/轨道/彗星上查看信息';
        }
    }
    
    showPlanetCard(planet) {
        const card = document.getElementById('planet-card');
        if (!card) return;
        
        const title = document.getElementById('planet-card-title');
        const desc = document.getElementById('planet-card-desc');
        
        const pData = planet.data;
        const enName = pData.nameEn ? ` (${pData.nameEn})` : '';
        if (title) title.textContent = planet.name + enName;
        if (desc) desc.textContent = pData.info || '暂无详细介绍。';
        
        const paramsList = document.getElementById('planet-card-params');
        if (paramsList) {
            paramsList.innerHTML = '';
            if (pData.diameter) paramsList.innerHTML += `<li><span>直径：</span>${pData.diameter}</li>`;
            if (pData.mass) paramsList.innerHTML += `<li><span>质量：</span>${pData.mass}</li>`;
            if (pData.rotationPeriod) paramsList.innerHTML += `<li><span>自转周期：</span>${pData.rotationPeriod}</li>`;
            if (pData.orbitalSpeed) paramsList.innerHTML += `<li><span>轨道速度：</span>${pData.orbitalSpeed}</li>`;
            if (pData.temperature) paramsList.innerHTML += `<li><span>表面温差：</span>${pData.temperature}</li>`;
        }
        
        card.classList.add('show');
        this.updateDistanceDisplay();
    }
    
    hidePlanetCard() {
        const card = document.getElementById('planet-card');
        if (card) {
            card.classList.remove('show');
            card.classList.add('hidden');
        }
    }
    
    updateDistanceDisplay() {
        const distEl = document.getElementById('planet-card-distance');
        if (!distEl || !this.selectedPlanet) return;
        
        if (!this.isPlaying) {
            const pos = new THREE.Vector3();
            this.selectedPlanet.mesh.getWorldPosition(pos);
            const distance = pos.length();
            
            distEl.textContent = `📡 当前距太阳中心：${distance.toFixed(4)} AU`;
            distEl.classList.remove('hidden');
        } else {
            distEl.classList.add('hidden');
        }
    }
    
    update(deltaTime) {
        // 更新轨道控制器
        if (this.orbitControls) {
            this.orbitControls.update();
        }
        
        // 更新太阳系（如果正在播放）
        if (this.isPlaying) {
            // 以“天”为单位推进模拟时间（与轨道周期 period 的单位一致）
            const MS_PER_DAY = 24 * 60 * 60 * 1000;
            const simDaysPassed = deltaTime * this.timeScale;
            this.currentDate = new Date(this.currentDate.getTime() + simDaysPassed * MS_PER_DAY);
            
            // 依据绝对时间对所有天体设置严谨轨道位置
            this.solarSystem.setDate(this.currentDate);
            
            // 更新太阳系（这处理自转及附加动画）
            this.solarSystem.update(deltaTime, this.timeScale);
        }
        
        // 定期更新时间显示（每0.1秒更新一次）
        const now = performance.now();
        if (!this.lastDisplayUpdate || now - this.lastDisplayUpdate > 100) {
            this.updateTimeDisplay();
            this.lastDisplayUpdate = now;
        }
    }
}
