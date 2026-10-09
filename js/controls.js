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
        this.timeScale = 1 / 24; // 默认速度为 1小时/秒
        this.showOrbits = true;
        this.fullLighting = false;
        this.planetSizeScale = 1.0; // 默认天体比例 1.0x
        
        // 镜头锁定与影院伴飞状态
        this.trackedPlanet = null;
        this.isTransitioningCamera = false;
        this.transitionProgress = 0;
        this.transitionDuration = 1.0; // 1秒过渡时间
        this.transitionStartTarget = new THREE.Vector3();
        this.transitionStartPos = new THREE.Vector3();
        this.transitionIdealOffset = new THREE.Vector3();
        this.transitionHomePos = null;
        this.transitionEndTarget = null; // 预设视角/事件跳转用的显式过渡终点（target）
        this.transitionEndPos = null;    // 预设视角/事件跳转用的显式过渡终点（相机位置）
        
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
        this.plateHoverPlanet = null; // 鼠标悬停在顶部名称牌上的行星
        this.hoveredComet = null;
        this.selectedComet = null;
        
        // 绑定事件
        this.setupEventListeners();
        
        // 初始化时间显示
        this.updateTimeDisplay();
        
        // 初始化速度滑动轴
        this.updateSpeedSlider();
        
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
        
        // 速度滑动轴事件
        const speedSlider = document.getElementById('speed-slider');
        const speedDisplayValue = document.getElementById('speed-display-value');
        
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                const minVal = 1 / 86400; // 1秒/秒
                const k = 0.182745;
                this.timeScale = minVal * Math.exp(k * val);
                
                // 更新显示
                if (speedDisplayValue) {
                    speedDisplayValue.textContent = formatSpeed(this.timeScale);
                }
            });
        }
        
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
        
        
        
        // 全亮模式复选框
        const fullLightingCheck = document.getElementById('full-lighting');
        if (fullLightingCheck) {
            fullLightingCheck.addEventListener('change', (e) => {
                this.fullLighting = e.target.checked;
                this.solarSystem.setFullLighting(this.fullLighting);
            });
        }
        
        // 天体大小比例滑动条
        const sizeSlider = document.getElementById('size-slider');
        const sizeDisplayValue = document.getElementById('size-display-value');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.planetSizeScale = scale;
                this.solarSystem.setPlanetSizeScale(scale);
                if (sizeDisplayValue) {
                    sizeDisplayValue.textContent = `${scale.toFixed(1)}x`;
                }
                
                // 如果当前锁定了天体，动态调整镜头偏移，防止镜头扎入放大后的星体内部
                if (this.selectedPlanet) {
                    this.updateIdealOffset(this.selectedPlanet);
                } else if (this.selectedComet) {
                    this.updateIdealOffset(this.selectedComet);
                }
            });
        }

        // 重置视角按钮
        const resetViewBtn = document.getElementById('reset-view-btn');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.resetView();
            });
        }
        
        // 鼠标移动事件（用于悬停检测）
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            this.onMouseMove(e);
        });

        // 记录指针按下位置，用于区分"点击"与"拖拽"。
        // 注意：拖拽旋转视角后松开鼠标同样会触发 click 事件，必须排除，
        // 否则每次手动调整视角后都会误触发选中/镜头飞跃/复位逻辑。
        // 必须用 pointerdown 而非 mousedown：OrbitControls 使用 Pointer Events
        // 并在 pointerdown 中调用 setPointerCapture，导致兼容性的 mousedown 不再触发。
        this._pointerDownX = 0;
        this._pointerDownY = 0;
        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            this._pointerDownX = e.clientX;
            this._pointerDownY = e.clientY;
        });

        // 鼠标点击事件（选中/取消选中）
        this.renderer.domElement.addEventListener('click', (e) => {
            // 拖拽阈值：按下与松开位置距离超过 6px 视为拖拽视角，不触发选中与镜头逻辑
            const dragDist = Math.hypot(e.clientX - this._pointerDownX, e.clientY - this._pointerDownY);
            if (dragDist > 6) return;

            if (this.hoveredPlanet) {
                this.selectBody(this.hoveredPlanet, true);
            } else if (this.hoveredComet) {
                this.selectBody(this.hoveredComet, true);
            } else {
                // 点击空白区域：取消选中，取消高亮，解绑镜头，回到默认视图并显示行星名称牌
                this.deselectBody();
                this.focusCameraOn(null); // 视角复位
            }
        });
        
        // 卡片上的明确关闭按钮
        const closeCardBtn = document.getElementById('close-card-btn');
        if (closeCardBtn) {
            closeCardBtn.addEventListener('click', () => {
                this.deselectBody();
                this.focusCameraOn(null); // 视角复位
            });
        }

        // 行星名称牌 / 天文事件 / 预设视角与快捷键
        this.setupPlanetBar();
        this.setupAstroEvents();
        this.setupViewShortcuts();
    }

    syncOrbitHighlight() {
        // 统一同步轨道亮暗状态：
        // - hoveredPlanet：高亮（3D 悬停优先）
        // - selectedPlanet：高亮（选中锁定）
        // - plateHoverPlanet：高亮（顶部名称牌悬停）
        // - 其他：变暗
        const roots = this.solarSystem.getPlanets();

        const visit = (planet) => {
            const shouldHighlight = planet === this.hoveredPlanet || planet === this.selectedPlanet || planet === this.plateHoverPlanet;
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
    
    updateSpeedSlider() {
        const speedSlider = document.getElementById('speed-slider');
        const speedDisplayValue = document.getElementById('speed-display-value');
        if (speedSlider) {
            const secondsPerDay = 86400;
            const v = Math.log(this.timeScale * secondsPerDay) / 0.182745;
            speedSlider.value = Math.max(0, Math.min(100, Math.round(v)));
        }
        if (speedDisplayValue) {
            speedDisplayValue.textContent = formatSpeed(this.timeScale);
        }
    }
    
    resetView() {
        // 平滑回到默认全景机位（同时取消选中、显示行星名称牌）
        this.applyPresetView('overview');
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
            
            // 公转周期
            if (planet.name !== '太阳' && planet.period) {
                paramsList.innerHTML += `<li><span>公转周期：</span>${formatPeriod(planet.period)}</li>`;
            }
            
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
    
    // ============ 行星名称牌 ============

    setupPlanetBar() {
        const bar = document.getElementById('planet-bar');
        if (!bar) return;
        bar.innerHTML = '';
        const planets = this.solarSystem.getPlanets();
        planets.forEach((planet, idx) => {
            const btn = document.createElement('button');
            btn.className = 'planet-plate';
            btn.textContent = planet.name;
            btn.title = `查看${planet.name}（快捷键 ${idx + 1}）`;
            btn.addEventListener('click', () => this.selectBody(planet, true));
            // 悬停名称牌时高亮对应行星的轨道
            btn.addEventListener('mouseenter', () => {
                this.plateHoverPlanet = planet;
                this.syncOrbitHighlight();
            });
            btn.addEventListener('mouseleave', () => {
                if (this.plateHoverPlanet === planet) {
                    this.plateHoverPlanet = null;
                }
                this.syncOrbitHighlight();
            });
            bar.appendChild(btn);
        });
        this.updatePlanetBar();
    }

    updatePlanetBar() {
        const bar = document.getElementById('planet-bar');
        if (!bar) return;
        // 仅在默认视图（无选中天体）时显示名称牌
        const show = !this.selectedPlanet && !this.selectedComet;
        bar.classList.toggle('hidden', !show);
    }

    // ============ 选中 / 取消选中 ============

    // 选中天体：弹卡片 + 高亮；flyCamera=true 时镜头平滑飞跃锁定
    selectBody(body, flyCamera = true) {
        if (!body) return;
        const alreadySelected = (body === this.selectedPlanet) || (body === this.selectedComet);
        const comets = this.solarSystem.getComets ? this.solarSystem.getComets() : [];
        const isComet = comets.includes(body);

        if (isComet) {
            if (this.selectedPlanet) this.selectedPlanet = null;
            if (this.selectedComet && this.selectedComet !== body) this.selectedComet.unhighlight();
            this.selectedComet = body;
            this.selectedComet.highlight();
        } else {
            if (this.selectedComet) {
                this.selectedComet.unhighlight();
                this.selectedComet = null;
            }
            if (this.selectedPlanet && this.selectedPlanet !== body) {
                this.selectedPlanet.unhighlightOrbit();
            }
            this.selectedPlanet = body;
        }
        this.showPlanetCard(body);
        // 选中后名称牌隐藏，悬停状态清零（避免隐藏时 mouseleave 未触发导致轨道常亮）
        this.plateHoverPlanet = null;
        this.syncOrbitHighlight();
        this.updatePlanetBar();
        if (flyCamera && !alreadySelected) this.focusCameraOn(body);
    }

    deselectBody() {
        this.selectedPlanet = null;
        if (this.selectedComet) {
            this.selectedComet.unhighlight();
            this.selectedComet = null;
        }
        this.hidePlanetCard();
        this.syncOrbitHighlight();
        this.updatePlanetBar();
    }

    findPlanetByName(name) {
        return this.solarSystem.getPlanets().find(p => p.name === name) || null;
    }

    findCometByName(name) {
        const comets = this.solarSystem.getComets ? this.solarSystem.getComets() : [];
        return comets.find(c => c.name === name) || null;
    }

    // ============ 天文事件 ============

    setupAstroEvents() {
        // 日期均为核实过的真实天象日期；跳转后行星位置按日期天文计算
        this.astroEvents = [
            { name: '天王星冲日', date: '2026-11-25', planet: '天王星', view: 'top',
              desc: '2026年11月25日天王星冲日：太阳—地球—天王星排成一线，整夜可见，是观测天王星的最佳时机。' },
            { name: '木星冲日', date: '2027-02-11', planet: '木星', view: 'top',
              desc: '2027年2月11日木星冲日：木星与太阳分居地球两侧，整夜可见，适合观赏大红斑与伽利略卫星。' },
            { name: '火星冲日', date: '2027-02-19', planet: '火星', view: 'top',
              desc: '2027年2月19日火星冲日：火星距地球最近、视直径最大、亮度最高，是观测这颗红色星球的黄金窗口。' },
            { name: '日全食（西班牙·埃及）', date: '2027-08-02', planet: '地球', view: 'earth',
              desc: '2027年8月2日日全食：全食带扫过西班牙南部、北非与埃及卢克索，全食持续超6分钟，有“世纪日食”之称。模拟中月球位置为示意。' },
            { name: '水星凌日', date: '2032-11-13', planet: '水星', view: 'planet',
              desc: '2032年11月13日水星凌日：水星从日面缓缓经过，如一颗小黑痣划过太阳。实际观测必须使用专业太阳滤镜，切勿直视太阳。' },
            { name: '日全食（中国·北京）', date: '2035-09-02', planet: '地球', view: 'earth',
              desc: '2035年9月2日日全食：全食带经过北京，京城可见约1分36秒的全食。模拟中月球位置为示意。' },
            { name: '哈雷彗星回归', date: '2061-07-28', comet: '哈雷彗星', view: 'comet',
              desc: '2061年7月28日哈雷彗星过近日点：76年一遇（上次1986年），近日点附近将拖出壮观的彗尾。' },
        ];
        const sel = document.getElementById('event-select');
        const descEl = document.getElementById('event-desc');
        if (!sel) return;
        this.astroEvents.forEach((ev, i) => {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `${ev.date} · ${ev.name}`;
            sel.appendChild(opt);
        });
        const showDesc = () => {
            const ev = this.astroEvents[parseInt(sel.value, 10)];
            if (descEl && ev) descEl.textContent = ev.desc;
        };
        sel.addEventListener('change', showDesc);
        showDesc();
        const goBtn = document.getElementById('event-go-btn');
        if (goBtn) {
            goBtn.addEventListener('click', () => {
                this.jumpToEvent(this.astroEvents[parseInt(sel.value, 10)]);
            });
        }
    }

    jumpToEvent(ev) {
        if (!ev) return;
        const d = new Date(ev.date + 'T12:00:00');
        this.setDate(d);
        // 同步日期选择器的显示
        const dateInput = document.getElementById('date-picker');
        if (dateInput) {
            dateInput.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                .toISOString().slice(0, 16);
        }
        // 哈雷彗星按日期精确定位（开普勒方程求解真近点角）
        if (ev.comet) this.solarSystem.setCometDate(d, ev.comet);
        const target = ev.planet ? this.findPlanetByName(ev.planet)
            : ev.comet ? this.findCometByName(ev.comet) : null;
        if (ev.view === 'top') {
            // 冲日：俯视全景看“太阳—地球—行星”一线，卡片介绍目标行星
            this.flyToView(new THREE.Vector3(0, 95, 0.01), new THREE.Vector3(0, 0, 0));
            if (target) this.selectBody(target, false);
        } else if (target) {
            this.selectBody(target, true);
        }
    }

    // ============ 预设视角与快捷键 ============

    setupViewShortcuts() {
        this.presetViews = {
            overview: { pos: [0, 20, 50], target: [0, 0, 0] },  // 全景（默认）
            top:      { pos: [0, 95, 0.01], target: [0, 0, 0] }, // 俯视
            side:     { pos: [0, 8, 95], target: [0, 0, 0] },    // 侧视
            inner:    { pos: [0, 14, 30], target: [0, 0, 0] },  // 内太阳系
        };
        const bind = (id, key) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => this.applyPresetView(key));
        };
        bind('view-overview-btn', 'overview');
        bind('view-top-btn', 'top');
        bind('view-side-btn', 'side');
        bind('view-inner-btn', 'inner');

        window.addEventListener('keydown', (e) => {
            const el = e.target;
            const tag = (el && el.tagName) || '';
            // 仅在真正的文本编辑场景下禁用快捷键（日期选择、文本框等）；
            // 按钮/滑块聚焦时快捷键仍可用，避免“按了没反应”的困惑
            const isTextEditing = tag === 'TEXTAREA' || tag === 'SELECT' ||
                (tag === 'INPUT' && /^(text|password|search|email|url|tel|number|date|datetime-local|month|week|time)$/.test(el.type || ''));
            if (e.code === 'Space') {
                if (isTextEditing) return;
                e.preventDefault();
                // 移开按钮焦点：防止空格同时触发聚焦按钮的原生点击，
                // 导致“暂停”被调用两次相互抵消（看起来像没反应）
                if (document.activeElement && document.activeElement.blur &&
                    document.activeElement !== document.body) {
                    document.activeElement.blur();
                }
                this.togglePlayPause();
                return;
            }
            if (isTextEditing) return;
            if (e.key === 'r' || e.key === 'R') {
                this.resetView();
            } else if (e.key === 'Escape') {
                this.deselectBody();
                this.focusCameraOn(null);
            } else if (e.key === 't' || e.key === 'T') {
                this.applyPresetView('top');
            } else if (/^[1-8]$/.test(e.key)) {
                const p = this.solarSystem.getPlanets()[parseInt(e.key, 10) - 1];
                if (p) this.selectBody(p, true);
            }
        });
    }

    applyPresetView(key) {
        const v = this.presetViews && this.presetViews[key];
        if (!v) return;
        this.flyToView(new THREE.Vector3(...v.pos), new THREE.Vector3(...v.target));
    }

    // 平滑飞到指定机位：先解除锁定/选中，再做过渡动画
    flyToView(camPos, targetPos) {
        this.deselectBody();
        this.trackedPlanet = null;
        this.isTransitioningCamera = true;
        this.transitionProgress = 0;
        this.transitionStartTarget.copy(this.orbitControls.target);
        this.transitionStartPos.copy(this.camera.position);
        this.transitionEndTarget = targetPos.clone();
        this.transitionEndPos = camPos.clone();
        this.transitionHomePos = null;
    }
    
    update(deltaTime) {
        // 更新镜头平滑聚焦与锁定伴飞
        this.updateCameraFocus(deltaTime);
        
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
    
    // ============ 新增镜头锁定与影院伴飞系统 ============
    
    // Easing 缓冲函数
    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    
    // 聚焦某一星体
    focusCameraOn(body) {
        if (!body) {
            // 解锁镜头，以插值动画回到太阳系中心，但保留用户当前用鼠标调整过的旋转视距和倾角
            this.trackedPlanet = null;
            this.isTransitioningCamera = true;
            this.transitionProgress = 0;
            this.transitionStartTarget.copy(this.orbitControls.target);
            this.transitionStartPos.copy(this.camera.position);
            
            // 计算当前相机相对于目标的局部三维偏移量
            const currentOffset = this.camera.position.clone().sub(this.orbitControls.target);
            // 限制防扎入：如果视角太近，拉远到至少合理视角距离（25），避免撞进太阳内部
            if (currentOffset.length() < 20) {
                currentOffset.normalize().multiplyScalar(25);
            }
            
            this.transitionIdealOffset.copy(currentOffset);
            this.transitionHomePos = null; // 不强行复原到硬编码的 (0,20,50)，完美保留用户视角！
            this.transitionEndTarget = null;
            this.transitionEndPos = null;
            return;
        }
        
        this.trackedPlanet = body;
        this.isTransitioningCamera = true;
        this.transitionProgress = 0;
        
        this.transitionStartTarget.copy(this.orbitControls.target);
        this.transitionStartPos.copy(this.camera.position);
        
        // 计算理想镜头偏置
        this.updateIdealOffset(body);
        
        this.transitionHomePos = null;
        this.transitionEndTarget = null;
        this.transitionEndPos = null;
    }
    
    // 根据天体的大小及特征计算理想的三维斜上方黄金偏置量
    updateIdealOffset(body) {
        if (!body || !body.data) return;
        const scale = this.planetSizeScale || 1.0;
        
        // 彗星或部分无基础半径属性的天体，提供 0.4 的合理默认视距半径，避免 NaN 导致全黑屏
        const baseRadius = body.data.radius !== undefined ? body.data.radius : 0.4;
        const radius = baseRadius * scale;
        
        // 如果天体带光环，适当增大视距以完整呈现星环
        const multiplier = body.ringMesh ? 7.5 : 4.0;
        this.transitionIdealOffset.set(
            radius * multiplier,
            radius * multiplier * 0.75,
            radius * multiplier * 1.25
        );
    }
    
    // 在 update 线程中每帧调用，更新镜头插值与强锁定伴飞
    updateCameraFocus(deltaTime) {
        if (this.isTransitioningCamera) {
            this.transitionProgress += deltaTime / this.transitionDuration;
            const finished = this.transitionProgress >= 1.0;
            if (finished) {
                this.transitionProgress = 1.0;
            }
            
            const t = this.easeInOutCubic(this.transitionProgress);
            
            // 获取目标的当前绝对坐标
            const targetWorldPos = new THREE.Vector3();
            if (this.trackedPlanet) {
                // 彗星优先命中带坐标的 nucleusMesh (彗核)，行星则为 mesh
                const targetMesh = this.trackedPlanet.nucleusMesh || this.trackedPlanet.mesh;
                if (targetMesh) targetMesh.getWorldPosition(targetWorldPos);
            }
            
            // 顺滑插值镜头焦点 target（显式终点优先，用于预设视角/事件跳转）
            const endTarget = this.transitionEndTarget || targetWorldPos;
            this.orbitControls.target.lerpVectors(this.transitionStartTarget, endTarget, t);
            
            // 顺滑插值相机位置 position（显式终点优先）
            let idealCamPos;
            if (this.transitionEndPos) {
                idealCamPos = this.transitionEndPos;
            } else if (this.transitionHomePos) {
                idealCamPos = this.transitionHomePos;
            } else {
                idealCamPos = targetWorldPos.clone().add(this.transitionIdealOffset);
            }
            this.camera.position.lerpVectors(this.transitionStartPos, idealCamPos, t);
            
            // 过渡完成后再清理状态（必须放在落点计算之后，否则最后一帧会用错终点）
            if (finished) {
                this.isTransitioningCamera = false;
                this.transitionEndTarget = null;
                this.transitionEndPos = null;
            }
        } else if (this.trackedPlanet) {
            // 完成平滑过渡飞越后，锁定伴飞：每帧同步目标坐标为 OrbitControls 焦点
            const targetWorldPos = new THREE.Vector3();
            const targetMesh = this.trackedPlanet.nucleusMesh || this.trackedPlanet.mesh;
            if (targetMesh) {
                targetMesh.getWorldPosition(targetWorldPos);
                this.orbitControls.target.copy(targetWorldPos);
            }
        }
    }
}
