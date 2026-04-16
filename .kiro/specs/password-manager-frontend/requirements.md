# 需求文档

## 简介

本文档定义了密码管理器前端的需求，包括 Electron 桌面应用和 Chrome 浏览器扩展两个客户端。前端基于已完成的 Spring Boot 后端 REST API 构建，使用 Electron + React + TypeScript + Vite 技术栈。前端负责提供安全、高效的用户交互界面，并实现剪贴板管理、自动锁定等本地安全功能。

## 术语表

- **Desktop_App（桌面应用）**: 基于 Electron + React + TypeScript 构建的密码管理器桌面客户端
- **Chrome_Extension（浏览器扩展）**: 基于 Chrome Extension Manifest V3 构建的浏览器插件，提供快速搜索和自动填充功能
- **API_Client（API 客户端）**: 封装与后端 REST API 通信的 HTTP 客户端模块
- **Renderer_Process（渲染进程）**: Electron 中运行 React 应用的进程
- **Main_Process（主进程）**: Electron 中负责系统级功能（剪贴板、自动锁定、窗口管理）的进程
- **Preload_Script（预加载脚本）**: Electron 中连接 Main_Process 和 Renderer_Process 的安全桥接脚本
- **IPC（进程间通信）**: Electron 中 Main_Process 与 Renderer_Process 之间的通信机制
- **Clipboard_Manager（剪贴板管理器）**: 负责密码复制和定时清除剪贴板的模块
- **Session_Token（会话令牌）**: 后端解锁 Vault 后返回的认证令牌，前端需在后续请求中携带
- **Strength_Indicator（强度指示器）**: 以可视化方式展示密码强度等级的 UI 组件
- **Content_Script（内容脚本）**: Chrome_Extension 中注入网页的脚本，用于检测登录表单
- **Service_Worker（服务工作线程）**: Chrome_Extension 的后台服务，负责 API 请求代理
- **Popup（弹出窗口）**: Chrome_Extension 点击图标后显示的主界面

## UI 效果图参考

> 请将 UI 效果图文件放置于 `.kiro/specs/password-manager-frontend/ui.jpg`

效果图包含以下 9 个页面设计：

| 编号 | 页面名称 | 对应需求 | 关键 UI 要素 |
|------|---------|---------|-------------|
| 1 | Create Master Password | 需求 2 | 密码输入框 + 确认输入框、密码强度条（weak/medium/strong）、"至少12字符"和"3种字符类型"校验提示、Create 按钮、"MFA setup will follow"提示 |
| 2 | Unlock Vault | 需求 2 | 主密码输入框、MFA Verification Code 输入框、Show/Hide Password 切换、锁定警告（"Locked for 2% after 5 incorrect attempts"）、Unlock 按钮、Use Recovery Code 链接 |
| 3 | Vault Overview | 需求 3 | 顶部搜索栏 + New Item 按钮、标签筛选栏（All/Favorites/Work/Reams/Events/Dons...）、凭证卡片网格（Account Name/Username/URL + 操作图标）、底部分页器 |
| 4 | Password Generator | 需求 6 | Default/Custom 标签切换、Length 滑块（8-128，默认20）、Uppercase/Lowercase/Numbers/Special Characters 勾选框、Generate Password 按钮、生成结果展示 + 强度标签（Strong）、Save Custom Rule 按钮 |
| 5 | Add New Item | 需求 5 | Account Name*/Username*/Password* 必填字段、Generate Password 按钮、URL/Notes/Category 可选字段、Save 按钮、"Created: Just now"时间戳 |
| 6 | Item Details | 需求 4, 7 | 账户图标 + 名称 + 用户名、密码掩码显示 + Show/Copy 按钮 + "Masks in 30s"倒计时、Password History (Last 10) 表格（Masked Password/Changed On/Copy/View 列） |
| 7 | Security Report | 需求 8 | 四个统计卡片（Total Items/Weak Passwords/Reused Passwords/Old Passwords >90 days）、密码列表 + 强度条（颜色编码）+ 90-day alert 标签 |
| 8 | Settings | 需求 10 | Auto-Lock 下拉（15 mins）、MFA 开关（On/Off）、TOTP QR Code 展示 + Recovery Code 链接、Change Master Password 入口、Custom Password Rules 入口、Save 按钮 |
| 9 | Import/Export | 需求 9 | Export Data 区域（Export Encrypted Excel 按钮 + Set Encryption Password 输入框）、Import Data 区域（Upload Excel File 拖拽区 + Format Error 提示 + Conflict Handling 单选：Overwrite/Skip/Keep Both） |

## 需求

### 需求 1：Electron 项目基础设施

**用户故事：** 作为开发者，我希望搭建一个结构清晰的 Electron + React + TypeScript 项目，以便高效开发桌面应用前端。

#### 验收标准

1. THE Desktop_App SHALL 使用 Electron + React + TypeScript + Vite 技术栈构建
2. THE Desktop_App SHALL 将项目目录与后端项目保持平级（同一父目录下）
3. THE Desktop_App SHALL 包含 Main_Process、Renderer_Process 和 Preload_Script 三层架构
4. THE Preload_Script SHALL 通过 Electron contextBridge 安全地暴露 IPC 接口给 Renderer_Process，禁止直接暴露 Node.js API
5. THE API_Client SHALL 封装所有后端 REST API 调用，统一处理 `ApiResponse<T>` 响应格式（code、message、data）
6. WHEN API_Client 收到 code 不为 0 的响应, THE API_Client SHALL 抛出包含 message 信息的错误
7. THE API_Client SHALL 在请求头中携带 Session_Token 用于认证（解锁后的请求）
8. THE Desktop_App SHALL 配置开发环境代理，将 API 请求转发到后端服务（默认 http://localhost:8080）

### 需求 2：认证与解锁界面

**用户故事：** 作为用户，我希望通过直观的界面设置主密码和解锁密码库，以便安全地访问我的凭证数据。

#### 验收标准

1. WHEN 用户首次启动 Desktop_App 且后端未设置 Master_Password, THE Desktop_App SHALL 显示主密码设置页面（SetupPage）
2. THE SetupPage SHALL 包含密码输入框、密码确认输入框和提交按钮
3. WHEN 用户在 SetupPage 输入的两次密码不一致, THE Desktop_App SHALL 在确认输入框下方显示"两次输入的密码不一致"提示
4. WHEN 用户成功设置主密码（调用 `POST /api/auth/setup` 返回成功）, THE Desktop_App SHALL 自动跳转到解锁页面（UnlockPage）
5. THE UnlockPage SHALL 包含主密码输入框和解锁按钮
6. WHEN 用户在 UnlockPage 输入正确的主密码并解锁成功, THE Desktop_App SHALL 保存返回的 Session_Token 并跳转到凭证列表页面（VaultPage）
7. WHEN 后端返回 mfaRequired 为 true, THE Desktop_App SHALL 显示 TOTP 验证码输入框，要求用户输入 6 位验证码
8. WHEN 用户输入有效的 TOTP 验证码（调用 `POST /api/auth/verify-totp` 返回成功）, THE Desktop_App SHALL 保存 Session_Token 并跳转到 VaultPage
9. WHEN 后端返回认证失败错误, THE Desktop_App SHALL 在页面上显示对应的错误提示信息
10. THE Desktop_App SHALL 提供 PasswordInput 组件，支持掩码和明文显示切换（通过眼睛图标切换）

### 需求 3：凭证列表与搜索界面

**用户故事：** 作为用户，我希望在主界面上浏览、搜索和筛选我的凭证列表，以便快速找到需要的账户信息。

#### 验收标准

1. WHILE Vault 处于解锁状态, THE VaultPage SHALL 调用 `GET /api/credentials` 获取并以卡片列表形式展示所有 Credential 摘要信息（账户名称、用户名、关联 URL）
2. THE VaultPage SHALL 在页面顶部提供搜索栏（SearchBar），支持用户输入关键词搜索
3. WHEN 用户在 SearchBar 中输入关键词, THE Desktop_App SHALL 调用 `GET /api/credentials/search?keyword=xxx` 并实时更新列表展示搜索结果
4. THE VaultPage SHALL 提供标签筛选组件（TagFilter），展示所有已使用的标签供用户点击筛选
5. WHEN 用户点击某个标签, THE Desktop_App SHALL 调用 `GET /api/credentials?tag=xxx` 并更新列表仅展示包含该标签的 Credential
6. THE VaultPage SHALL 提供"新建凭证"按钮，点击后跳转到凭证创建页面
7. WHEN 用户点击某条 Credential 卡片, THE Desktop_App SHALL 跳转到该 Credential 的详情页面（CredentialDetailPage）
8. WHEN API_Client 请求失败（网络错误或后端异常）, THE VaultPage SHALL 显示错误提示并提供重试按钮

### 需求 4：凭证详情与编辑界面

**用户故事：** 作为用户，我希望查看和编辑凭证的详细信息，并安全地复制密码，以便在登录各类服务时使用。

#### 验收标准

1. WHEN 用户进入 CredentialDetailPage, THE Desktop_App SHALL 调用 `GET /api/credentials/{id}` 获取凭证详情并展示所有字段
2. THE CredentialDetailPage SHALL 以掩码形式（"••••••"）默认显示密码字段
3. WHEN 用户点击"显示密码"按钮, THE Desktop_App SHALL 调用 `POST /api/credentials/{id}/reveal-password` 获取明文密码并展示，30 秒后自动恢复为掩码显示
4. WHEN 用户点击"复制密码"按钮, THE Desktop_App SHALL 通过 IPC 调用 Main_Process 的 Clipboard_Manager 将密码复制到系统剪贴板，并在 60 秒后自动清除
5. THE CredentialDetailPage SHALL 提供"编辑"按钮，点击后切换为编辑模式，允许用户修改所有字段
6. WHEN 用户在编辑模式下点击"保存", THE Desktop_App SHALL 调用 `PUT /api/credentials/{id}` 提交更新
7. WHEN 用户在编辑模式下修改密码时, THE CredentialDetailPage SHALL 提供"自动生成密码"按钮，调用密码生成器生成新密码
8. THE CredentialDetailPage SHALL 提供"删除"按钮，点击后弹出 ConfirmDialog 要求用户二次确认
9. WHEN 用户在 ConfirmDialog 中确认删除, THE Desktop_App SHALL 调用 `DELETE /api/credentials/{id}` 删除凭证并返回 VaultPage
10. THE CredentialDetailPage SHALL 提供"密码历史"入口，点击后展示该凭证的密码变更历史

### 需求 5：凭证创建界面

**用户故事：** 作为用户，我希望通过表单创建新的凭证记录，并可选择自动生成密码，以便快速安全地保存账户信息。

#### 验收标准

1. THE Desktop_App SHALL 提供凭证创建页面，包含以下必填字段输入框：账户名称、用户名、密码
2. THE 凭证创建页面 SHALL 包含以下可选字段输入框：关联 URL、备注、分类标签
3. THE 凭证创建页面 SHALL 提供"自动生成密码"开关，启用后调用 `POST /api/password-generator/generate` 生成密码并自动填入密码字段
4. WHEN 用户提交创建表单且必填字段为空, THE Desktop_App SHALL 高亮显示缺失字段并在字段下方显示"请填写此字段"提示
5. WHEN 用户提交有效的凭证数据, THE Desktop_App SHALL 调用 `POST /api/credentials` 创建凭证，成功后跳转到 VaultPage
6. IF 后端返回创建失败错误, THEN THE Desktop_App SHALL 在页面顶部显示错误提示信息

### 需求 6：密码生成器界面

**用户故事：** 作为用户，我希望通过可视化界面配置密码生成规则并生成密码，以便获得满足我需求的高强度密码。

#### 验收标准

1. THE Desktop_App SHALL 提供密码生成器页面（PasswordGeneratorPage），包含"默认规则"和"自定义规则"两种模式切换
2. WHEN 用户选择"自定义规则"模式, THE PasswordGeneratorPage SHALL 展示以下配置项：密码长度滑块（8-128）、大写字母开关、小写字母开关、数字开关、特殊字符开关
3. WHEN 用户点击"生成密码"按钮, THE Desktop_App SHALL 调用 `POST /api/password-generator/generate` 并在页面上展示生成的密码
4. THE PasswordGeneratorPage SHALL 使用 Strength_Indicator 组件以颜色和文字展示生成密码的强度等级（弱-红色、中-黄色、强-绿色）
5. THE PasswordGeneratorPage SHALL 提供"复制密码"按钮，将生成的密码复制到剪贴板
6. THE PasswordGeneratorPage SHALL 提供"保存规则"按钮，调用 `POST /api/password-generator/rules` 保存当前自定义规则
7. THE PasswordGeneratorPage SHALL 展示已保存的自定义规则列表，支持用户选择已有规则快速生成密码
8. WHEN 用户选择已保存的规则, THE PasswordGeneratorPage SHALL 自动填充对应的配置参数

### 需求 7：密码历史界面

**用户故事：** 作为用户，我希望查看某条凭证的密码变更历史，以便在需要时回溯之前使用过的密码。

#### 验收标准

1. WHEN 用户查看某条 Credential 的密码历史, THE Desktop_App SHALL 调用 `GET /api/credentials/{credentialId}/password-history` 并以列表形式展示历史记录（按变更时间倒序）
2. THE 密码历史列表 SHALL 为每条记录显示掩码密码和变更时间
3. WHEN 用户点击某条历史记录的"显示密码"按钮, THE Desktop_App SHALL 调用 `POST /api/credentials/{credentialId}/password-history/{historyId}/reveal` 获取明文密码并展示，30 秒后自动恢复为掩码显示
4. WHEN 用户点击某条历史记录的"复制密码"按钮, THE Desktop_App SHALL 通过 Clipboard_Manager 将密码复制到剪贴板，60 秒后自动清除
5. WHEN 某条 Credential 没有密码变更历史, THE Desktop_App SHALL 显示"暂无密码变更记录"提示

### 需求 8：安全报告界面

**用户故事：** 作为用户，我希望通过安全报告了解我的密码安全状况，以便及时处理存在风险的凭证。

#### 验收标准

1. THE Desktop_App SHALL 提供安全报告页面（SecurityReportPage），调用 `GET /api/security-report` 展示统计概览：总凭证数量、弱密码数量、重复密码数量、超期未更新数量
2. THE SecurityReportPage SHALL 以卡片或数字面板形式展示统计数据，弱密码和重复密码数量使用警告色标识
3. THE SecurityReportPage SHALL 提供"弱密码"、"重复密码"、"超期未更新"三个分类标签页
4. WHEN 用户点击"弱密码"标签页, THE Desktop_App SHALL 调用 `GET /api/security-report/weak` 并展示弱密码凭证列表
5. WHEN 用户点击"重复密码"标签页, THE Desktop_App SHALL 调用 `GET /api/security-report/duplicate` 并展示重复密码凭证列表
6. WHEN 用户点击"超期未更新"标签页, THE Desktop_App SHALL 调用 `GET /api/security-report/expired` 并展示超期凭证列表
7. WHEN 用户点击报告中的某条 Credential, THE Desktop_App SHALL 跳转到该 Credential 的 CredentialDetailPage

### 需求 9：数据导入导出界面

**用户故事：** 作为用户，我希望通过界面导入和导出密码数据，以便备份密码库或从其他工具迁移数据。

#### 验收标准

1. THE Desktop_App SHALL 提供导入导出页面（ImportExportPage），包含"导出"和"导入"两个功能区域
2. WHEN 用户点击"导出"按钮, THE Desktop_App SHALL 弹出对话框要求用户输入 Excel 文件加密密码
3. WHEN 用户确认导出, THE Desktop_App SHALL 调用 `POST /api/import-export/export` 下载加密的 Excel 文件，并通过 Electron 的文件保存对话框让用户选择保存位置
4. WHEN 用户点击"导入"按钮, THE Desktop_App SHALL 通过 Electron 的文件选择对话框让用户选择 Excel 文件
5. WHEN 用户选择文件后, THE Desktop_App SHALL 弹出对话框要求用户输入文件密码和选择冲突策略（覆盖、跳过、保留两者）
6. WHEN 用户确认导入, THE Desktop_App SHALL 调用 `POST /api/import-export/import` 上传文件并提交导入请求
7. WHEN 导入完成, THE Desktop_App SHALL 显示导入结果摘要（成功数量、跳过数量、失败数量）
8. IF 导入或导出过程中发生错误, THEN THE Desktop_App SHALL 显示具体的错误提示信息

### 需求 10：设置界面

**用户故事：** 作为用户，我希望通过设置界面管理自动锁定时间和 MFA 配置，以便根据我的安全需求自定义应用行为。

#### 验收标准

1. THE Desktop_App SHALL 提供设置页面（SettingsPage），调用 `GET /api/settings` 获取并展示当前设置
2. THE SettingsPage SHALL 提供自动锁定超时时间配置，使用数字输入框或滑块（范围 1-60 分钟）
3. WHEN 用户修改自动锁定时间并点击保存, THE Desktop_App SHALL 调用 `PUT /api/settings` 更新设置
4. THE SettingsPage SHALL 显示 MFA 当前状态（已启用/未启用）
5. WHEN 用户点击"启用 MFA"按钮, THE Desktop_App SHALL 引导用户完成 TOTP 绑定流程：展示二维码供用户扫描，要求输入验证码确认，成功后展示恢复码
6. WHEN 用户点击"禁用 MFA"按钮, THE Desktop_App SHALL 弹出确认对话框，确认后调用 `POST /api/auth/mfa/disable` 禁用 MFA
7. THE SettingsPage SHALL 提供"锁定密码库"按钮，点击后调用 `POST /api/auth/lock` 立即锁定并跳转到 UnlockPage

### 需求 11：Electron 主进程安全功能

**用户故事：** 作为用户，我希望应用在后台自动管理剪贴板安全和会话锁定，以防止密码数据泄露。

#### 验收标准

1. THE Clipboard_Manager SHALL 在 Main_Process 中运行，通过 IPC 接收 Renderer_Process 的复制请求
2. WHEN Clipboard_Manager 收到复制密码请求, THE Clipboard_Manager SHALL 将密码写入系统剪贴板并启动 60 秒倒计时
3. WHEN 60 秒倒计时结束, THE Clipboard_Manager SHALL 清除系统剪贴板中的密码内容
4. WHEN 新的复制请求到达且上一次倒计时未结束, THE Clipboard_Manager SHALL 取消上一次倒计时并重新开始 60 秒计时
5. THE Main_Process SHALL 监听用户操作事件（鼠标移动、键盘输入），在用户无操作超过设定的自动锁定时间后，通过 IPC 通知 Renderer_Process 执行锁定
6. WHEN Desktop_App 执行锁定, THE Renderer_Process SHALL 清除内存中的 Session_Token 和所有已解密的凭证数据，并跳转到 UnlockPage
7. THE Preload_Script SHALL 仅暴露必要的 IPC 通道（剪贴板操作、自动锁定通知、文件对话框），禁止暴露文件系统或进程操作接口

### 需求 12：应用导航与布局

**用户故事：** 作为用户，我希望应用具有清晰的导航结构，以便在各功能模块之间快速切换。

#### 验收标准

1. THE Desktop_App SHALL 提供侧边栏导航，包含以下入口：密码库（VaultPage）、密码生成器（PasswordGeneratorPage）、安全报告（SecurityReportPage）、导入导出（ImportExportPage）、设置（SettingsPage）
2. THE Desktop_App SHALL 在侧边栏高亮当前所在页面的导航项
3. WHILE Vault 处于锁定状态, THE Desktop_App SHALL 仅显示 UnlockPage，禁止访问其他页面
4. THE Desktop_App SHALL 使用 React Router 管理页面路由，支持浏览器前进/后退导航
5. THE Desktop_App SHALL 在页面加载和 API 请求期间显示加载指示器（Loading Spinner）

### 需求 13：Chrome 浏览器扩展

**用户故事：** 作为用户，我希望通过浏览器扩展快速搜索和自动填充凭证，以便在浏览网页时高效登录各类服务。

#### 验收标准

1. THE Chrome_Extension SHALL 使用 Manifest V3 规范构建，包含 Service_Worker、Content_Script 和 Popup 三个核心模块
2. THE Popup SHALL 提供快速搜索框（QuickSearch），调用 `GET /api/credentials/search?keyword=xxx` 搜索凭证
3. WHEN 用户在 QuickSearch 中选择某条 Credential, THE Chrome_Extension SHALL 将用户名和密码填入当前页面的登录表单
4. THE Content_Script SHALL 检测当前页面是否包含登录表单（检测 input[type="password"] 元素）
5. WHEN Content_Script 检测到登录表单, THE Chrome_Extension SHALL 根据当前页面 URL 自动匹配 Vault 中的 Credential，并显示自动填充提示（AutoFillPrompt）
6. WHEN 用户点击 AutoFillPrompt 中的凭证, THE Chrome_Extension SHALL 将对应的用户名和密码填入表单字段
7. THE Service_Worker SHALL 作为 API 请求代理，负责与后端通信并管理 Session_Token
8. WHILE 后端 Vault 处于锁定状态, THE Popup SHALL 显示提示信息"请先在桌面应用中解锁密码库"

### 需求 14：前后端集成

**用户故事：** 作为开发者，我希望前后端能够正确通信，以确保所有功能端到端正常工作。

#### 验收标准

1. THE 后端 SHALL 配置 CORS 允许 Desktop_App 的开发服务器和 Chrome_Extension 的请求来源
2. THE 后端 SHALL 配置会话拦截器，对除 `/api/auth/setup` 和 `/api/auth/unlock` 外的所有 API 请求验证 Session_Token
3. WHEN Session_Token 无效或过期, THE 后端 SHALL 返回 401 状态码，THE Desktop_App SHALL 自动跳转到 UnlockPage
4. THE Desktop_App SHALL 在所有 API 请求中统一处理网络错误，显示"网络连接失败，请检查后端服务是否启动"提示
