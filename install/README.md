# 一键安装器

这个目录里是给 SteamHappy Spammer 用的 Windows 批处理安装器。

```
install/
  install-millennium.bat          安装器（GBK 编码，双击即可）
  com.saber.steamhappy.star       插件包（Millennium 的插件格式）
```

## 它做什么

1. 从注册表找到你的 Steam 安装路径；
2. 如果还没装 **Millennium**，从 GitHub 下载官方安装器并运行（会先自动关掉 Steam）；
3. 把 `com.saber.steamhappy.star` 放进 `<Steam>\millennium\plugins\`；
4. 重新启动 Steam。

装好后：Steam → **Millennium → 设置 → 插件**，确认 **SteamHappy Spammer** 已启用；然后打开任意好友的聊天窗口，**右下角**会出现「steamhappy 连发」面板。

## 用法

- **正常安装**：双击 `install-millennium.bat`（会申请管理员权限）。
- **只检测不改动**（推荐先跑一次）：
  ```
  install-millennium.bat --check
  ```
  只报告 Steam 路径 / 插件包 / 安装步骤是否就绪，不下载、不安装、不改任何文件。

## 注意

- 安装器会**从 GitHub 下载第三方程序并给 Steam 客户端打补丁**。Millennium 自带卸载器，可逆。
- 需要联网；若 GitHub 被墙导致下载失败，脚本会给出手动下载地址。
- 若你的 Steam 装在非默认位置且注册表读不到，编辑脚本顶部的 `STEAM=` 一行填绝对路径。

## 手动安装（不想跑 bat 时）

1. 到 <https://github.com/SteamClientHomebrew/Installer/releases> 下载 `MillenniumInstaller-Windows.exe`，退出 Steam 后运行；
2. 把 `com.saber.steamhappy.star` 复制到 `<Steam>\millennium\plugins\`；
3. 启动 Steam，在 Millennium 插件设置里启用。
