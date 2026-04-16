# 实施计划：密码管理器前端

## 概述

基于需求文档和技术设计文档，将前端实现拆分为 Electron 桌面应用和 Chrome 浏览器扩展两部分。任务结构与后端 spec 的 Task 13-15 对齐，确保前后端任务可追溯。技术栈：Electron + React + TypeScript + Vite，测试框架：Vitest + fast-check + React Testing Library。

## 任务

- [ ] 1. 初始化 Electron + React + TypeScript 项目（对应后端 Task 13.1）
  - [x] 1.1 创建项目目录结构与基础配置
    - 在工作区根目录（与 password-manager/ 平级）创建前端项目目录
    - 初始化 package.json，安装 Electron、React、TypeScript、Vite 依赖
    - 配置 Vite 打包（renderer 进程）和 TypeScript tsconfig
    - 创建 Electron 三层目录结构：`src/main/`、`src/renderer/`、`src/preload/`
    - 配置开发环境代理，将 API 请求转发到 `http://localhost:8080`
    - _需求: 1.1, 1.2, 1.8_

  - [x] 1.2 实现 Preload 安全桥接脚本
    - 创建 `src/preload/preload.ts`，通过 `contextBridge` 暴露 `ElectronBridge` 接口
    - 暴露 `clipboard.copyPassword`、`autoLock.onLockTriggered`、`autoLock.reportActivity`、`dialog.showSaveDialog`、`dialog.showOpenDialog` 通道
    - 禁止暴露 Node.js API 或文件系统接口
    - _需求: 1.3, 1.4, 11.7_

  - [x] 1.3 实现 API Client 统一封装
    - 创建 `src/renderer/api/api-client.ts`，实现 `ApiClient` 接口
    - 实现统一的 `request<T>` 方法：解析 `ApiResponse<T>` 格式，code=0 返回 data，code≠0 抛出 `ApiError`
    - 实现 401 响应拦截：清除 Session Token，触发锁定
    - 实现网络错误处理：抛出 `NetworkError`
    - 实现请求头自动携带 Session Token
    - _需求: 1.5, 1.6, 1.7_

  - [x] 1.4 定义 TypeScript 数据模型
    - 创建 `src/renderer/types/` 目录，定义所有 TypeScript 接口（映射后端 DTO）
    - 包含：`ApiResponse<T>`、认证相关、凭证相关、密码生成器、密码历史、安全报告、导入导出、设置
    - 定义自定义错误类型：`ApiError`、`NetworkError`、`AuthExpiredError`
    - _需求: 1.5, 1.6_

  - [ ]* 1.5 编写 API Client 响应解析属性测试
    - **Property 1: API 客户端响应解析正确性**
    - 使用 fast-check 生成随机 `{code, message, data}` 对象，验证 code=0 时正确返回 data，code≠0 时抛出包含 message 的 ApiError
    - **验证需求: 1.5, 1.6**

  - [ ]* 1.6 编写 Session Token 携带属性测试
    - **Property 2: 请求携带 Session Token**
    - 验证已解锁状态下请求头包含有效 Session Token，未解锁状态下不携带 Token
    - **验证需求: 1.7**

  - [x] 1.7 实现 Electron 主进程入口
    - 创建 `src/main/main.ts`，配置 BrowserWindow、加载 preload 脚本
    - 配置安全选项：`nodeIntegration: false`、`contextIsolation: true`
    - _需求: 1.1, 1.3_

- [ ] 2. 实现状态管理与路由框架
  - [x] 2.1 实现认证状态管理（AuthContext）
    - 创建 `src/renderer/context/AuthContext.tsx`
    - 实现 `AuthState`（isUnlocked、sessionToken、mfaRequired）和 `AuthAction` reducer
    - 提供 `useAuth` Hook 供组件使用
    - _需求: 2.6, 12.3_

  - [x] 2.2 实现路由配置与路由守卫
    - 创建 `src/renderer/App.tsx`，配置 React Router 路由表
    - 实现 `AppLayout` 组件（侧边栏 + 内容区 Outlet）
    - 实现路由守卫：锁定状态重定向到 `/unlock`（或 `/setup`），401 响应自动跳转
    - _需求: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 2.3 编写路由守卫属性测试
    - **Property 16: 锁定状态路由守卫**
    - 生成随机路由路径，验证锁定状态下重定向到 UnlockPage，禁止访问其他页面
    - **验证需求: 12.3, 14.3**

  - [x] 2.4 实现 Sidebar 导航组件
    - 创建 `src/renderer/components/Sidebar.tsx`
    - 包含导航入口：密码库、密码生成器、安全报告、导入导出、设置、锁定按钮
    - 高亮当前页面导航项
    - _需求: 12.1, 12.2_

  - [x] 2.5 实现 LoadingSpinner 组件
    - 创建全局加载指示器组件，在页面加载和 API 请求期间显示
    - _需求: 12.5_

- [x] 3. 检查点 - 确保基础框架测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 4. 实现认证相关页面（对应后端 Task 13.2）
  - [x] 4.1 实现 PasswordInput 组件
    - 创建 `src/renderer/components/PasswordInput.tsx`
    - 支持掩码/明文切换（眼睛图标）
    - 接收 `PasswordInputProps` 接口属性
    - _需求: 2.10_

  - [ ]* 4.2 编写 PasswordInput 掩码/明文切换属性测试
    - **Property 4: PasswordInput 掩码/明文切换**
    - 生成随机密码字符串，验证掩码模式不显示原始字符，明文模式显示原始字符串，再次切换恢复掩码
    - **验证需求: 2.10**

  - [x] 4.3 实现 SetupPage（首次设置主密码）
    - 创建 `src/renderer/pages/SetupPage.tsx`
    - 包含密码输入框、确认输入框、提交按钮
    - 实现密码确认不一致验证，在确认框下方显示错误提示
    - 调用 `POST /api/auth/setup`，成功后跳转到 UnlockPage
    - _需求: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 4.4 编写密码确认不一致验证属性测试
    - **Property 3: 密码确认不一致验证**
    - 生成随机字符串对，验证不同时返回失败提示，相同时验证通过
    - **验证需求: 2.3**

  - [x] 4.5 实现 UnlockPage（解锁页面）
    - 创建 `src/renderer/pages/UnlockPage.tsx`
    - 包含主密码输入框和解锁按钮
    - 调用 `POST /api/auth/unlock`，成功后保存 Session Token 并跳转到 VaultPage
    - 处理 `mfaRequired=true`：显示 TOTP 验证码输入框
    - 调用 `POST /api/auth/verify-totp` 验证 TOTP
    - 显示认证失败错误提示
    - _需求: 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ]* 4.6 编写错误响应统一展示属性测试
    - **Property 5: 错误响应统一展示**
    - 生成随机错误响应（code≠0）和网络错误，验证 UI 展示对应错误信息
    - **验证需求: 2.9, 3.8, 5.6, 9.8, 14.4**

- [x] 5. 实现凭证管理页面（对应后端 Task 13.3）
  - [x] 5.1 实现 SearchBar 和 TagFilter 组件
    - 创建 `src/renderer/components/SearchBar.tsx` 和 `src/renderer/components/TagFilter.tsx`
    - SearchBar 支持关键词输入触发搜索
    - TagFilter 展示标签列表，支持点击筛选
    - _需求: 3.2, 3.4_

  - [x] 5.2 实现 CredentialCard 和 ConfirmDialog 组件
    - 创建 `src/renderer/components/CredentialCard.tsx`，展示凭证摘要（账户名、用户名、URL）
    - 创建 `src/renderer/components/ConfirmDialog.tsx`，支持确认/取消操作
    - _需求: 3.1, 4.8_

  - [x] 5.3 实现 VaultPage（凭证列表主页）
    - 创建 `src/renderer/pages/VaultPage.tsx`
    - 调用 `GET /api/credentials` 获取凭证列表，以卡片形式展示
    - 集成 SearchBar（调用搜索 API）和 TagFilter（调用标签筛选 API）
    - 提供"新建凭证"按钮，点击跳转到创建页面
    - 点击卡片跳转到详情页面
    - 请求失败时显示错误提示和重试按钮
    - _需求: 3.1, 3.3, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 5.4 编写搜索和标签筛选属性测试
    - **Property 6: 搜索关键词触发 API 调用**
    - 生成随机非空关键词，验证触发搜索 API 调用并更新列表
    - **验证需求: 3.3**
    - **Property 7: 标签筛选结果正确性**
    - 生成随机标签选择，验证列表仅包含对应标签凭证
    - **验证需求: 3.5**

  - [x] 5.5 实现 PasswordField 组件（密码显示 + 30 秒自动掩码）
    - 创建 `src/renderer/components/PasswordField.tsx`
    - 默认掩码显示，点击"显示"调用 reveal API 获取明文
    - 30 秒后自动恢复掩码
    - 提供"复制"按钮，通过 IPC 调用 Clipboard Manager
    - _需求: 4.2, 4.3, 4.4_

  - [ ]* 5.6 编写密码 30 秒自动掩码属性测试
    - **Property 8: 密码 30 秒自动掩码**
    - 生成随机密码，验证显示后 30 秒自动恢复掩码
    - **验证需求: 4.3, 7.3**

  - [x] 5.7 实现 CredentialDetailPage（凭证详情/编辑）
    - 创建 `src/renderer/pages/CredentialDetailPage.tsx`
    - 调用 `GET /api/credentials/{id}` 获取详情
    - 集成 PasswordField 组件
    - 实现编辑模式切换，支持修改所有字段
    - 编辑模式提供"自动生成密码"按钮
    - 保存调用 `PUT /api/credentials/{id}`
    - 删除按钮 + ConfirmDialog 二次确认，调用 `DELETE /api/credentials/{id}`
    - 提供"密码历史"入口
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [x] 5.8 实现 CreateCredentialPage（凭证创建）
    - 创建 `src/renderer/pages/CreateCredentialPage.tsx`
    - 包含必填字段（账户名称、用户名、密码）和可选字段（URL、备注、标签）
    - 提供"自动生成密码"开关
    - 必填字段为空时显示验证错误提示
    - 调用 `POST /api/credentials` 创建，成功后跳转 VaultPage
    - _需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 5.9 编写凭证创建必填字段验证属性测试
    - **Property 10: 凭证创建必填字段验证**
    - 生成随机表单数据，验证必填字段为空时阻止提交并显示错误，非空时通过
    - **验证需求: 5.4**

- [x] 6. 检查点 - 确保凭证管理模块测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 7. 实现密码生成器页面（对应后端 Task 13.4）
  - [x] 7.1 实现 StrengthIndicator 组件
    - 创建 `src/renderer/components/StrengthIndicator.tsx`
    - 根据强度等级（WEAK/MEDIUM/STRONG）显示对应颜色（红/黄/绿）和文字标签
    - _需求: 6.4_

  - [ ]* 7.2 编写密码强度指示器映射属性测试
    - **Property 11: 密码强度指示器映射**
    - 生成随机强度等级，验证颜色和文字标签正确映射
    - **验证需求: 6.4**

  - [x] 7.3 实现 PasswordGeneratorPage
    - 创建 `src/renderer/pages/PasswordGeneratorPage.tsx`
    - 实现"默认规则"/"自定义规则"模式切换
    - 自定义模式：密码长度滑块（8-128）、大写/小写/数字/特殊字符开关
    - 点击"生成密码"调用 `POST /api/password-generator/generate`
    - 集成 StrengthIndicator 展示强度
    - 提供"复制密码"按钮
    - 提供"保存规则"按钮，调用 `POST /api/password-generator/rules`
    - 展示已保存规则列表，选择后自动填充配置参数
    - _需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 7.4 编写已保存规则选择自动填充属性测试
    - **Property 12: 已保存规则选择自动填充**
    - 生成随机密码规则，验证选择后表单自动填充所有参数
    - **验证需求: 6.8**

- [x] 8. 实现密码历史、安全报告、导入导出、设置页面（对应后端 Task 13.5）
  - [x] 8.1 实现 PasswordHistoryPanel（密码历史面板）
    - 创建 `src/renderer/components/PasswordHistoryPanel.tsx`
    - 调用 `GET /api/credentials/{id}/password-history` 获取历史列表
    - 按变更时间倒序展示，每条显示掩码密码和变更时间
    - 支持"显示密码"（30 秒自动掩码）和"复制密码"
    - 无历史记录时显示"暂无密码变更记录"
    - _需求: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.2 编写密码历史排序与完整性属性测试
    - **Property 13: 密码历史排序与完整性**
    - 生成随机历史记录列表，验证按变更时间降序排列，每条包含掩码密码和变更时间
    - **验证需求: 7.1, 7.2**

  - [x] 8.3 实现 SecurityReportPage（安全报告）
    - 创建 `src/renderer/pages/SecurityReportPage.tsx`
    - 调用 `GET /api/security-report` 展示统计概览（卡片形式）
    - 实现"弱密码"、"重复密码"、"超期未更新"三个分类标签页
    - 各标签页调用对应 API 展示凭证列表
    - 点击凭证跳转到详情页
    - _需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 8.4 实现 ImportExportPage（导入导出）
    - 创建 `src/renderer/pages/ImportExportPage.tsx`
    - 导出区域：输入加密密码 → 调用导出 API → Electron 文件保存对话框
    - 导入区域：Electron 文件选择对话框 → 输入文件密码 + 冲突策略 → 调用导入 API
    - 展示导入结果摘要（成功/跳过/失败数量）
    - 错误处理与提示
    - _需求: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 8.5 编写导入结果摘要完整性属性测试
    - **Property 14: 导入结果摘要完整性**
    - 生成随机导入结果，验证各数量之和与总数量一致
    - **验证需求: 9.7**

  - [x] 8.6 实现 SettingsPage（设置）
    - 创建 `src/renderer/pages/SettingsPage.tsx`
    - 调用 `GET /api/settings` 获取当前设置
    - 自动锁定超时配置（1-60 分钟输入框）
    - MFA 状态显示与启用/禁用流程（二维码展示、验证码确认、恢复码展示）
    - "锁定密码库"按钮
    - _需求: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 8.7 编写自动锁定超时范围验证属性测试
    - **Property 15: 自动锁定超时范围验证**
    - 生成随机数值，验证 1-60 分钟范围内接受，超出范围拒绝
    - **验证需求: 10.2**

- [x] 9. 实现 Electron 主进程功能（对应后端 Task 13.6）
  - [x] 9.1 实现 ClipboardManager（剪贴板管理）
    - 创建 `src/main/clipboard-manager.ts`
    - 通过 IPC 接收复制请求，写入系统剪贴板
    - 启动 60 秒倒计时，到期清除剪贴板
    - 新请求到达时取消上一次倒计时并重新计时
    - _需求: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 9.2 编写剪贴板 60 秒自动清除属性测试
    - **Property 9: 剪贴板 60 秒自动清除**
    - 生成随机密码，验证写入剪贴板后 60 秒清除，新请求重置计时
    - **验证需求: 4.4, 7.4, 11.2, 11.3, 11.4**

  - [x] 9.3 实现 AutoLockManager（自动锁定检测）
    - 创建 `src/main/auto-lock.ts`
    - 监听用户操作事件（鼠标移动、键盘输入）
    - 无操作超过设定时间后通过 IPC 通知 Renderer 执行锁定
    - _需求: 11.5_

  - [x] 9.4 实现 IPC Handlers 和 Renderer Hooks
    - 创建 `src/main/ipc-handlers.ts`，注册所有 IPC 通道处理器
    - 创建 `src/renderer/hooks/useAutoLock.ts`，监听锁定事件并清除状态
    - 创建 `src/renderer/hooks/useClipboard.ts`，封装剪贴板复制调用
    - _需求: 11.1, 11.5, 11.6_

  - [ ]* 9.5 编写锁定后状态清除属性测试
    - **Property 17: 锁定后状态清除**
    - 验证锁定事件后 Renderer 清除 Session Token 和已解密凭证数据，导航到 UnlockPage
    - **验证需求: 11.5, 11.6**

- [ ] 10. 检查点 - 确保 Electron 桌面应用所有模块测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [ ] 11. 搭建 Chrome Extension 浏览器插件（对应后端 Task 14.1）
  - [ ] 11.1 初始化 Chrome Extension Manifest V3 项目
    - 在工作区根目录创建 Chrome Extension 项目目录
    - 创建 `manifest.json`（Manifest V3 配置）
    - 创建 `service-worker.ts`（后台服务，API 请求代理，管理 Session Token）
    - 创建 `api-client.ts`（与后端通信的 HTTP 客户端）
    - _需求: 13.1, 13.7_

  - [ ] 11.2 实现 Content Script（登录表单检测）
    - 创建 `content-script.ts`
    - 检测页面 `input[type="password"]` 元素，提取页面 URL
    - 检测到登录表单时发送消息给 Service Worker
    - _需求: 13.4, 13.5_

  - [ ]* 11.3 编写登录表单检测属性测试
    - **Property 18: 登录表单检测**
    - 生成随机 HTML 片段，验证包含 password input 时检测到，不包含时不触发
    - **验证需求: 13.4**

- [ ] 12. 实现 Chrome Extension 核心功能（对应后端 Task 14.2）
  - [ ] 12.1 实现 Popup 和 QuickSearch 组件
    - 创建 `Popup.tsx`（弹出窗口主界面）
    - 创建 `QuickSearch.tsx`（快速搜索框，调用搜索 API）
    - Vault 锁定时显示"请先在桌面应用中解锁密码库"提示
    - _需求: 13.2, 13.8_

  - [ ] 12.2 实现 AutoFillPrompt 和自动填充功能
    - 创建 `AutoFillPrompt.tsx`（自动填充提示组件）
    - 根据页面 URL 匹配凭证，显示填充提示
    - 用户选择凭证后将用户名和密码填入表单字段
    - 实现 Content Script → Service Worker → Backend API 完整通信链路
    - _需求: 13.3, 13.5, 13.6_

  - [ ]* 12.3 编写自动填充凭证正确性属性测试
    - **Property 19: 自动填充凭证正确性**
    - 生成随机凭证和表单，验证用户名填入 username 字段，密码填入 password 字段
    - **验证需求: 13.3, 13.5, 13.6**

- [ ] 13. 检查点 - 确保 Chrome Extension 测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [ ] 14. 前后端集成联调（对应后端 Task 15.1）
  - [ ] 14.1 配置后端 CORS 和会话拦截器
    - 创建或更新 `CorsConfig.java`，允许 Desktop App 和 Chrome Extension 请求来源
    - 配置 `SecurityConfig.java` 会话拦截器，对除 setup/unlock 外的 API 验证 Session Token
    - _需求: 14.1, 14.2_

  - [ ] 14.2 验证 Electron 应用与后端 API 通信
    - 确保所有 API Client 方法与后端端点正确对接
    - 验证 Session Token 认证流程端到端正常
    - 验证 401 响应自动跳转到 UnlockPage
    - _需求: 14.3, 14.4_

  - [ ] 14.3 验证 Chrome Extension 与后端 API 通信
    - 确保 Service Worker API 代理正常工作
    - 验证 Content Script → Service Worker → Backend 通信链路
    - _需求: 14.1_

- [ ] 15. 最终检查点 - 确保所有前端测试通过
  - 确保所有测试通过，如有问题请向用户确认。

## 备注

- 标记 `*` 的子任务为可选任务，可跳过以加速 MVP 开发
- 每个任务引用了具体的需求编号以确保可追溯性
- 任务编号与后端 spec 的 Task 13-15 对齐，便于前后端协作
- 属性测试覆盖设计文档中定义的全部 19 个正确性属性
- 检查点任务用于阶段性验证，确保增量开发的正确性
- 前端项目目录与后端 password-manager/ 保持平级
