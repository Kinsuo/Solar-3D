# 太阳系运动模拟 Solar-3D

交互式太阳系运动模拟网页：太阳 + 八大行星（含月球）的 3D 可视化，各行星按相对真实的轨道周期运行。

🌐 **在线体验**：<https://kinsuo.github.io/Solar-3D/Solar%203D%20Model.html>

## 功能

- **3D 太阳系**：发光太阳 + 八大行星 + 月球，2K 贴图，星空背景
- **时间控制**：播放 / 暂停、1x–1000x 倍速（可自定义）、跳转到任意日期、重置到当前时间
- **视角控制**：鼠标拖拽旋转、滚轮缩放、一键重置视角
- **信息展示**：悬停行星查看名称与科普介绍，可开关轨道线 / 行星标签
- **动画导出**：一键录制并导出 MP4

## 本地运行

直接用浏览器打开 `Solar 3D Model.html` 即可，无需服务器、无需构建。

## 文件结构

```
├── Solar 3D Model.html   # 主页面
├── css/style.css          # 样式
├── js/
│   ├── main.js            # 程序入口
│   ├── solarSystem.js     # 太阳系核心逻辑
│   ├── planet.js          # 行星类
│   ├── controls.js        # 交互控制
│   ├── utils.js           # 工具函数
│   ├── recorder.js        # 动画录制导出
│   ├── texturesBase64.js  # 内嵌行星贴图（base64）
│   ├── three.min.js       # Three.js 库
│   └── OrbitControls.js   # 视角控制器
├── build_b64.js           # 贴图转 base64 工具（node）
├── download.ps1           # 贴图下载脚本
└── dl_mercury.ps1         # 单独下载水星贴图
```

## 技术栈

- [Three.js](https://threejs.org/)（3D 渲染）
- 原生 JavaScript + CSS，无构建步骤

## 贴图来源

行星贴图来自 [Solar System Scope](https://www.solarsystemscope.com/textures/)（2K），已内嵌为 base64，离线可用。
