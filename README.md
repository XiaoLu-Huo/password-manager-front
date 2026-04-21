# Password Manager Frontend 🖥️

基于 Electron + React + TypeScript + Vite 构建的密码管理器桌面客户端。

## 功能特性

- 主密码设置与密码库解锁
- MFA（TOTP）双因素验证
- 凭证列表浏览、搜索与标签筛选
- 凭证新增、编辑、删除与密码明文查看
- 密码生成器（自定义规则、强度评估）
- 密码变更历史查看
- 安全报告（弱密码 / 重复密码 / 超期未更新）
- 加密 Excel 导入导出
- 剪贴板安全复制（自动清除）
- 自动锁定（可配置超时时间）
- 用户设置管理

## 技术栈

| 类别 | 技术 |
|------|------|
| 桌面框架 | Electron 33 |
| UI 框架 | React 18 |
| 语言 | TypeScript 5.6 |
| 构建工具 | Vite 6 |
| 路由 | React Router v6 |
| HTTP 客户端 | Axios |
| 测试 | Vitest + React Testing Library + fast-check (PBT) |

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

# 构建全部（Renderer + Main + Preload）
npm run build

# 运行测试
npm test
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run dev:electron` | 启动 Electron + Vite 联合开发 |
| `npm run build` | 构建全部（Renderer + Main + Preload） |
| `npm test` | 运行测试（单次执行） |
| `npm run test:watch` | 测试监听模式 |

## 开发代理

开发环境下，所有 `/api` 请求自动代理到 `http://localhost:8080`，无需处理跨域。

## 项目结构

```
src/
├── main/                          # Electron 主进程
│   ├── main.ts                    #   窗口创建与生命周期管理
│   ├── auto-lock.ts               #   自动锁定定时器
│   ├── clipboard-manager.ts       #   剪贴板安全管理（定时清除）
│   ├── ipc-handlers.ts            #   IPC 通信处理
│   └── __tests__/                 #   主进程单元测试
│
├── preload/                       # Preload 安全桥接
│   ├── preload.ts                 #   contextBridge 暴露安全 API
│   └── preload.d.ts               #   类型声明
│
└── renderer/                      # React 渲染进程
    ├── App.tsx                    #   根组件与路由配置
    ├── main.tsx                   #   React 入口
    ├── theme.ts                   #   主题配置
    ├── api/
    │   └── api-client.ts          #   Axios HTTP 客户端封装
    ├── context/
    │   ├── AuthContext.tsx         #   认证状态上下文
    │   └── LoadingContext.tsx      #   全局加载状态
    ├── hooks/
    │   ├── useAutoLock.ts         #   自动锁定 Hook
    │   └── useClipboard.ts        #   剪贴板操作 Hook
    ├── components/
    │   ├── AppLayout.tsx          #   应用布局（侧边栏 + 内容区）
    │   ├── Sidebar.tsx            #   侧边导航栏
    │   ├── SearchBar.tsx          #   搜索栏
    │   ├── CredentialCard.tsx     #   凭证卡片
    │   ├── PasswordField.tsx      #   密码显示/隐藏字段
    │   ├── PasswordInput.tsx      #   密码输入组件
    │   ├── PasswordHistoryPanel.tsx  # 密码历史面板
    │   ├── StrengthIndicator.tsx  #   密码强度指示器
    │   ├── TagFilter.tsx          #   标签筛选器
    │   ├── CopyableText.tsx       #   可复制文本
    │   ├── ConfirmDialog.tsx      #   确认对话框
    │   └── LoadingSpinner.tsx     #   加载动画
    ├── pages/
    │   ├── SetupPage.tsx          #   首次设置主密码
    │   ├── UnlockPage.tsx         #   解锁密码库
    │   ├── VaultPage.tsx          #   凭证列表主页
    │   ├── CredentialDetailPage.tsx  # 凭证详情
    │   ├── CreateCredentialPage.tsx  # 新增凭证
    │   ├── PasswordGeneratorPage.tsx # 密码生成器
    │   ├── SecurityReportPage.tsx #   安全报告
    │   ├── ImportExportPage.tsx   #   导入导出
    │   └── SettingsPage.tsx       #   用户设置
    └── types/                     #   TypeScript 类型定义
        ├── api.ts
        ├── auth.ts
        ├── credential.ts
        ├── password-generator.ts
        ├── password-history.ts
        ├── security-report.ts
        ├── settings.ts
        ├── import-export.ts
        └── electron-bridge.d.ts
```

## 架构说明

```
┌──────────────────────────────────────────────────┐
│                  Electron Main Process            │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ 窗口管理  │  │  自动锁定     │  │ 剪贴板管理  │ │
│  └──────────┘  └──────────────┘  └────────────┘ │
│                       │ IPC                       │
│              ┌────────┴────────┐                  │
│              │    Preload      │                  │
│              │ (contextBridge) │                  │
│              └────────┬────────┘                  │
│                       │                           │
│  ┌────────────────────┴──────────────────────┐   │
│  │           Renderer Process (React)         │   │
│  │  AuthContext → Pages → Components          │   │
│  │       │                                    │   │
│  │  api-client ──── HTTP ────► Backend :8080  │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

- 主进程负责窗口管理、自动锁定计时、剪贴板安全清除
- Preload 通过 `contextBridge` 暴露安全 API，隔离主进程与渲染进程
- 渲染进程使用 React + React Router 构建 SPA，通过 Axios 与后端通信

## 关联项目

- [password-manager](https://github.com/XiaoLu-Huo/password-manager) — 后端 (Spring Boot)
- [password-manager-extension](https://github.com/XiaoLu-Huo/password-manager-extension) — 浏览器扩展 (Chrome Extension MV3)

## License

Private
