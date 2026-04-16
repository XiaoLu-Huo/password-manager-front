# Password Manager Frontend

基于 Electron + React + TypeScript + Vite 构建的密码管理器桌面客户端，配套 Chrome 浏览器扩展。

## 技术栈

- **桌面应用**: Electron 33 + React 18 + TypeScript 5
- **构建工具**: Vite 6
- **路由**: React Router v6
- **测试**: Vitest + React Testing Library + fast-check（属性测试）

## 项目结构

```
src/
├── main/           # Electron 主进程（窗口管理、剪贴板、自动锁定）
├── preload/        # Preload 安全桥接脚本（contextBridge）
└── renderer/       # React 渲染进程（UI、路由、状态管理、API 调用）
```

## 前置条件

- Node.js >= 18
- 后端服务运行在 `http://localhost:8080`（[password-manager](https://github.com/XiaoLu-Huo/password-manager)）

## 快速开始

```bash
# 安装依赖
npm install

# 启动 Vite 开发服务器（仅 Renderer，浏览器访问 http://localhost:5173）
npm run dev

# 启动 Electron 开发模式（Vite + Electron 同时启动）
npm run dev:electron
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run dev:electron` | 启动 Electron + Vite 联合开发 |
| `npm run build` | 构建全部（Renderer + Main + Preload） |
| `npm test` | 运行测试 |
| `npm run test:watch` | 测试监听模式 |

## 开发代理

开发环境下，所有 `/api` 请求自动代理到 `http://localhost:8080`，无需处理跨域。

## 关联项目

- 后端: [password-manager](https://github.com/XiaoLu-Huo/password-manager)
