# <img src="assets/steamhappy.png" width="34" alt="steamhappy"> SteamHappy Spammer

**简体中文** | [English](README.md)

> 一个 **Millennium 插件**：在你打开的 Steam 好友聊天窗口右下角放一个悬浮面板，一键连续发送 `steamhappy` 表情 😄 —— 次数与间隔可调。

> [!WARNING]
> **只对单个聊天连刷，不是群发。** 不遍历好友列表、不会自动发给很多人。
> 自动化发送消息属于 Steam 订阅协议里受限的行为 ⚠️ 请只对自己的账号与信任的好友、小规模低频率使用，**风险自负**。

---

## ✨ 它是什么

- 🧩 一个 **Millennium 插件**（TypeScript / React 前端），把 React 组件注入到 Steam 客户端的「好友与聊天」窗口。
- 🖱️ 面板出现在聊天窗口**右下角**，填好次数 / 间隔 / 内容点「连发」即可。
- 🔒 复用你已登录的会话，**不需要密码或令牌**，也不模拟鼠标点击。

---

## 📦 安装

### 一键（推荐）

1. 🔎 先跑一次检测（**不改动任何东西**）：
   ```
   install\install-millennium.bat --check
   ```
2. ⚡ 双击 `install\install-millennium.bat` 正式安装
   （流程：找 Steam 路径 → 关 Steam → 下载官方 Millennium 安装器并安装 → 部署插件 → 重启 Steam）。
   也可直接从 [Releases](https://github.com/lebrontheg0at/steamhappy-spammer/releases) 下载 `steamhappy-spammer-installer.zip` 📥。
3. ✅ Steam 起来后：**Millennium → 设置 → 插件**，确认 `SteamHappy Spammer` 已启用。

### 手动

1. 从 <https://github.com/SteamClientHomebrew/Installer/releases> 下载 `MillenniumInstaller-Windows.exe`，退出 Steam 后运行；
2. 把 `install/com.saber.steamhappy.star` 复制到 `<Steam>\millennium\plugins\`；
3. 启动 Steam，在 Millennium 插件设置里启用。

---

## 🚀 使用

1. 💬 在 Steam 里**打开某个好友的聊天窗口**（关键：默认发给"当前打开的聊天"）；
2. 右下角会出现「steamhappy 连发」面板；
3. 填写：
   - **次数**：连发几条（默认 5）
   - **间隔ms**：每条间隔（默认 800）
   - **内容**：默认 `:steamhappy:`（表情；贴纸写 `/sticker <名字>`）
   - **好友id**：留空 = 当前打开的聊天；填 steamid64 = 固定发给该好友
4. 点「连发」<img src="assets/steamhappy.png" width="18" alt="steamhappy">

---

## 🔧 原理

Steam 桌面客户端（2023 起）是完整的 **CEF / Chromium** 应用，聊天界面就是网页 🌐。插件直接调用客户端自己的内部接口：

```js
// 表情（steamhappy 属于表情，用 :名字: 短代码）
g_FriendsUIApp.ChatStore.GetFriendChat(accountId).SendChatMessage(":steamhappy:")
// 贴纸
g_FriendsUIApp.ChatStore.GetFriendChat(accountId).SendChatMessage("/sticker <贴纸名>")
```

这正是 Steam 自带表情面板点一下背后的实现 ✅

- 注入方式：`Millennium.AddWindowCreateHook` 监听新窗口，在含 `g_FriendsUIApp` 的「好友与聊天」窗口里用 `createRoot` 挂载面板。
- 定位"当前聊天"：依次尝试 `GetActiveChatRoom` / `GetActiveChat` / `m_pActiveChatRoom` / `FriendChatStore.GetActiveChatRoom`，最后兜底 `GetRecentChats()[0]`；也可用「好友id」显式指定。

---

## 📁 目录结构

```
steamhappy-spammer/
├─ 🌐 millennium-plugin/       # 插件源码（TS / React）
│  ├─ millennium.toml          #   插件清单
│  ├─ frontend/index.tsx       #   界面 + 注入 + 调内部聊天 store
│  └─ README.md
└─ 📦 install/                 # 安装器
   ├─ install-millennium.bat   #   一键安装（GBK + CRLF）
   ├─ com.saber.steamhappy.star#   插件包（Millennium 格式）
   └─ README.md
```

---

## 🛠️ 从源码构建

需要 **Millennium ≥ 3.4** 与 **Bun ≥ 1.0**：

```bash
cd millennium-plugin
npm install
npx starlight lsp
npx starlight pack --release     # 产出 <Steam>/millennium/plugins/*.star
npx starlight watch              # 开发模式：改动自动重编译
```

`millennium.toml` 里 `[compiler] output_path = "auto"` 表示自动探测 Millennium 安装位置并安装。

---

## 🩹 排错

| 现象 😵 | 处理 🛠️ |
|---|---|
| 插件列表里没有 | 确认 Millennium 已装、`.star` 在 `<Steam>\millennium\plugins\`；重启 Steam。 |
| 右下角没有面板 | 先打开一次好友 / 聊天窗口，面板只注入到「好友与聊天」窗口。 |
| 连发报「找不到聊天」 | 先在 Steam 里打开一个好友的聊天，或用「好友id」填对方 steamid64。 |
| 更新 Steam 后失效 | 内部接口随版本变化属正常，按需调整 `resolveChat` 的探测顺序。 |
| bat 双击一闪而过 | 用 `--check` 看清报错；确认 `.star` 与 bat 在同一目录。 |

---

## 🔒 安全与合规

- 🧩 **Millennium** 会给 Steam 客户端打补丁，**可逆**（自带卸载器）。
- ⚠️ **风控**：自动化发消息可能触发 Steam 限制，请小范围、低频率使用。

---

<sub>`steamhappy` 表情版权归 Valve Corporation 所有，取自 Steam 公开 CDN，此处仅作为小尺寸装饰图使用。本项目与 Valve 无关联、也未获其背书。</sub>
