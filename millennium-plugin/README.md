# SteamHappy Spammer —— Millennium 插件

在 Steam 客户端的**聊天界面**里放一个悬浮面板：填次数 / 间隔 / 内容，点「连发」就往**你当前打开的聊天**连发 `steamhappy`。

> Millennium 是给 Steam 客户端打补丁的插件框架（<https://steambrew.app>）。本插件是它的一个前端插件（TypeScript/React），**没有后端、不改游戏文件**。

---

## 产物

打包结果（已生成）：

```
C:\steam\millennium\plugins\com.saber.steamhappy.star     # 12.6 KB，含元数据 + 前端 bundle
```

`.star` 是 Millennium 的插件包格式，`starlight` 会把它直接放进 Steam 的 `millennium/plugins/` 目录。

---

## 前置：先装 Millennium

1. 到 <https://github.com/SteamClientHomebrew/Millennium/releases> 下载 `MillenniumInstaller-Windows.exe`（也有官网一键脚本）。
2. 完全退出 Steam，运行安装器，按提示安装（它会往 Steam 目录写入加载器）。
3. 重启 Steam。

装好后应能看到 `C:\steam\millennium\` 下有 `plugins/`、`config/`、`logs/`、`bin/` 等。

## 安装本插件

本插件的 `.star` 已经放在 `C:\steam\millennium\plugins\` 里了，装好 Millennium 后：

1. 打开 Steam → **Millennium → 设置 → 插件**；
2. 找到 **SteamHappy Spammer**，确认启用；
3. 重启 Steam（或按 Millennium 提示重载 UI）。

## 使用

1. 在 Steam 里**打开某个好友的聊天窗口**（关键：默认发给"当前打开的聊天"）；
2. 好友窗口**右下角**会出现悬浮面板「steamhappy 连发」；
   （也可在 Millennium → 设置 → 插件 → SteamHappy Spammer 里用同一套控件）
3. 填：
   - **次数**：连发几条（默认 5）
   - **间隔ms**：每条间隔（默认 800）
   - **内容**：默认 `:steamhappy:`（表情；贴纸写 `/sticker <名字>`）
   - **好友id**：留空 = 当前打开的聊天；填 steamid64 = 固定发给该好友
4. 点「连发」。

---

## 从源码构建

需要 **Bun ≥ 1.0**（或直接用已装好的 starlight），以及 Millennium ≥ 3.4。

```bash
cd millennium-plugin
npm install              # 安装 @steambrew/starlight 等
npx starlight lsp        # 生成 millennium 模块的类型
npx starlight pack --release   # 打包 → 自动写入 <Steam>/millennium/plugins/*.star
npx starlight watch      # 开发模式：改动自动重编译
```

`millennium.toml` 里 `[compiler] output_path = "auto"` 表示自动探测 Millennium 安装位置并安装；改成固定路径则输出到该路径。

---

## 结构

```
millennium-plugin/
  millennium.toml          # 插件清单（id/name/version + frontend 入口 + 编译配置）
  package.json             # 构建脚本 + starlight 依赖
  tsconfig.json
  frontend/index.tsx       # 全部逻辑：界面 + 注入 + 调 Steam 内部聊天 store
  .millennium/lsp/         # starlight 生成的类型（勿手改）
```

## 关键实现（frontend/index.tsx）

- 发送：`window.g_FriendsUIApp.ChatStore.GetFriendChat(accountId).SendChatMessage(":steamhappy:")`；
  贴纸是 `SendChatMessage("/sticker <名字>")`（与 Steam 自带表情面板同款做法）。
- 定位"当前打开的聊天"：依次尝试 `GetActiveChatRoom` / `GetActiveChat` / `m_pActiveChatRoom` / `FriendChatStore.GetActiveChatRoom`，最后兜底 `GetRecentChats()[0]`；也可用「好友id」显式指定。
- 界面注入：`Millennium.AddWindowCreateHook` 监听新窗口，在含 `g_FriendsUIApp` 的"好友与聊天"窗口里用 `createRoot` 挂载悬浮面板。

## 排错

| 现象 | 处理 |
|---|---|
| 插件列表里没有 | 确认 Millennium 已装且 `.star` 在 `millennium/plugins/` 下；重启 Steam。 |
| 右下角没有面板 | 先打开一次好友/聊天窗口；面板只注入到"好友与聊天"窗口。 |
| 连发报"找不到聊天" | 先在 Steam 里打开一个好友的聊天，或用「好友id」指定。 |
| 更新 Steam 后失效 | 内部接口随版本变化属正常，按需调整 `resolveChat` 的探测顺序。 |

## 风险提醒

自动化发送消息属 Steam 订阅协议里受限的行为。请只对单个好友、小规模、低频率使用，风险自负。
