# 😄 SteamHappy Spammer

[简体中文](README.zh-CN.md) | **English**

> A **Millennium plugin** that puts a floating panel in the bottom-right of your open Steam friend chat, so one click spams the `steamhappy` emoji 😄 — with configurable count and interval.

> [!WARNING]
> **It repeats into a single chat — it is NOT a mass messenger.** It never iterates your friends list and never sends to many people automatically.
> Automated messaging falls under behavior restricted by the Steam Subscriber Agreement ⚠️ Use it only on your own account and trusted friends, at small scale and low frequency. **At your own risk.**

---

## ✨ What it is

- 🧩 A **Millennium plugin** (TypeScript / React frontend) that injects a React component into Steam's "Friends & Chat" window.
- 🖱️ The panel sits in the chat window's **bottom-right**; set count / interval / text and hit 连发 (fire).
- 🔒 Reuses your already-logged-in session — **no password or token**, and no mouse simulation.

---

## 📦 Install

### One click (recommended)

1. 🔎 Run a dry check first (**changes nothing**):
   ```
   install\install-millennium.bat --check
   ```
2. ⚡ Double-click `install\install-millennium.bat` to install for real
   (it finds Steam → closes Steam → downloads and runs the official Millennium installer → deploys the plugin → starts Steam).
   You can also grab `steamhappy-spammer-installer.zip` from [Releases](https://github.com/lebrontheg0at/steamhappy-spammer/releases) 📥.
3. ✅ Once Steam is up: **Millennium → Settings → Plugins**, make sure `SteamHappy Spammer` is enabled.

### Manual

1. Download `MillenniumInstaller-Windows.exe` from <https://github.com/SteamClientHomebrew/Installer/releases> and run it with Steam closed;
2. Copy `install/com.saber.steamhappy.star` into `<Steam>\millennium\plugins\`;
3. Start Steam and enable the plugin in Millennium's plugin settings.

---

## 🚀 Usage

1. 💬 **Open a friend's chat window** in Steam (key: it targets the currently open chat by default);
2. A "steamhappy 连发" panel appears in the bottom-right;
3. Fill in:
   - **次数 / Count**: how many to send (default 5)
   - **间隔ms / Interval**: delay between messages (default 800)
   - **内容 / Text**: defaults to `:steamhappy:` (emoticon; for a sticker use `/sticker <name>`)
   - **好友id / Friend id**: leave blank = the open chat; set steamid64 = always send to that friend
4. Click 连发 (fire) 😄

---

## 🔧 How it works

The Steam desktop client (since 2023) is a full **CEF / Chromium** app — the chat UI is a web page 🌐. The plugin calls the client's own internal API directly:

```js
// Emoticon (steamhappy is an emoticon — use the :name: shortcode)
g_FriendsUIApp.ChatStore.GetFriendChat(accountId).SendChatMessage(":steamhappy:")
// Sticker
g_FriendsUIApp.ChatStore.GetFriendChat(accountId).SendChatMessage("/sticker <sticker_name>")
```

This is exactly what Steam's own emoji/sticker picker does ✅

- Injection: `Millennium.AddWindowCreateHook` watches new windows; when one exposes `g_FriendsUIApp` (the Friends & Chat window) it mounts the panel with `createRoot`.
- Target resolution: tries `GetActiveChatRoom` / `GetActiveChat` / `m_pActiveChatRoom` / `FriendChatStore.GetActiveChatRoom`, then falls back to `GetRecentChats()[0]`; you can also set an explicit friend id.

---

## 📁 Layout

```
steamhappy-spammer/
├─ 🌐 millennium-plugin/       # Plugin source (TS / React)
│  ├─ millennium.toml          #   plugin manifest
│  ├─ frontend/index.tsx       #   UI + injection + internal chat-store calls
│  └─ README.md
└─ 📦 install/                 # Installer
   ├─ install-millennium.bat   #   one-click install (GBK + CRLF)
   ├─ com.saber.steamhappy.star#   plugin bundle (Millennium format)
   └─ README.md
```

---

## 🛠️ Build from source

Requires **Millennium ≥ 3.4** and **Bun ≥ 1.0**:

```bash
cd millennium-plugin
npm install
npx starlight lsp
npx starlight pack --release     # outputs <Steam>/millennium/plugins/*.star
npx starlight watch              # dev: rebuild on change
```

`[compiler] output_path = "auto"` in `millennium.toml` auto-detects the Millennium install and deploys there.

---

## 🩹 Troubleshooting

| Symptom 😵 | Fix 🛠️ |
|---|---|
| Plugin not listed | Make sure Millennium is installed and `.star` is under `<Steam>\millennium\plugins\`; restart Steam. |
| No panel in the corner | Open a friends/chat window first — the panel only injects into the Friends & Chat window. |
| "Chat not found" on fire | Open a friend's chat in Steam first, or set the friend id (steamid64) explicitly. |
| Breaks after a Steam update | Internal APIs shift between versions — adjust the probe order in `resolveChat`. |
| The .bat window flashes and closes | Run it with `--check` to read the error; make sure `.star` sits next to the .bat. |

---

## 🔒 Safety & compliance

- 🧩 **Millennium** patches the Steam client. It is **reversible** (ships its own uninstaller).
- ⚠️ **Anti-abuse**: automated messaging may trigger Steam restrictions. Keep it small-scale and low-frequency.
