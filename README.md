# 体素世界 · MiniCraft

一个用 [Three.js](https://threejs.org/) 从零打造的「我的世界」(Minecraft) 风格浏览器沙盒游戏。无需任何构建步骤、无第三方运行时依赖，打开即玩。

> 🎮 在线试玩：https://winrainy.github.io/AutoPiano/ （由 GitHub Actions 自动部署到 GitHub Pages）

## 功能

- 程序化生成的体素地形（起伏地表、泥土/石头分层、随机树木）
- 程序化生成的像素风纹理图集（无需任何贴图素材）
- 第一人称控制：指针锁定鼠标视角、WASD 移动、空格跳跃
- 重力与 AABB 碰撞检测
- 体素射线检测（DDA）实现精准的方块**挖掘**（左键）与**放置**（右键）
- 8 格物品栏，支持数字键 1–8 与鼠标滚轮切换方块
- 仅渲染可见面的合并网格，性能良好

## 运行

需要 Node.js（任意版本均可，服务器零依赖）：

```bash
npm run dev
# 打开 http://localhost:5000
```

或直接用任意静态服务器托管本目录（例如 `python3 -m http.server 5000`）。

> 注意：本项目使用 ES Module + importmap，必须通过 HTTP 访问，不能用 `file://` 直接打开。

## 操作

| 操作 | 按键 |
| --- | --- |
| 锁定鼠标 / 进入游戏 | 点击屏幕 |
| 移动 | W A S D |
| 跳跃 | 空格 |
| 转视角 | 鼠标 |
| 挖掉方块 | 鼠标左键 |
| 放置方块 | 鼠标右键 |
| 切换方块 | 数字键 1–8 / 滚轮 |
| 释放鼠标 | Esc |

## 目录结构

```
index.html          入口页面（含 importmap）
server.js           零依赖静态服务器
css/style.css       UI 样式（准星、物品栏、起始遮罩）
js/lib/three.module.js   vendored 的 Three.js (r160)
js/game/
  blocks.js         方块定义 + 程序化纹理图集
  world.js          体素数据、地形生成、网格构建、射线检测
  player.js         玩家物理与碰撞
  controls.js       指针锁定 + 键鼠输入
  main.js           入口：场景/渲染循环/挖放/物品栏
```
