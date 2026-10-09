// 主程序入口

let scene, camera, renderer, solarSystem, controls, animationRecorder;
let lastTime = 0;

function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 20, 50);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);
    
    // 创建星空背景
    createStarField(scene, 2000);
    
    // 创建太阳系
    solarSystem = new SolarSystem(scene);
    
    // 创建控制器
    controls = new SolarSystemControls(camera, renderer, solarSystem);

    if (typeof AnimationRecorder !== 'undefined') {
        animationRecorder = new AnimationRecorder(renderer);
    }
    
    // 处理窗口大小变化
    window.addEventListener('resize', onWindowResize);
    
    // 隐藏加载提示
    document.getElementById('loading').classList.remove('show');
    
    // 开始动画循环
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    // 计算时间差
    const currentTime = performance.now();
    const deltaTime = lastTime === 0 ? 0 : currentTime - lastTime;
    lastTime = currentTime;
    
    // 转换为秒（如果时间差太大，限制最大值为0.1秒，避免跳帧）
    const deltaSeconds = Math.min(deltaTime / 1000, 0.1);
    
    // 更新控制器和太阳系
    if (controls) {
        controls.update(deltaSeconds);
    }
    
    // 渲染场景
    renderer.render(scene, camera);

    if (animationRecorder) {
        animationRecorder.tick();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    // 检查Three.js是否加载
    if (typeof THREE === 'undefined') {
        console.error('Three.js未加载！请检查网络连接。');
        document.getElementById('loading').textContent = '加载失败：Three.js库未加载';
        return;
    }
    
    init();
    
    // 初始化隐藏/显示面板逻辑
    const toggleBtn = document.getElementById('toggle-panel-btn');
    const controlPanel = document.getElementById('control-panel');
    if (toggleBtn && controlPanel) {
        toggleBtn.addEventListener('click', () => {
            controlPanel.classList.toggle('hidden');
            if (controlPanel.classList.contains('hidden')) {
                toggleBtn.textContent = '👁️ 显示面板';
            } else {
                toggleBtn.textContent = '👁️ 隐藏面板';
            }
        });
    }
});
