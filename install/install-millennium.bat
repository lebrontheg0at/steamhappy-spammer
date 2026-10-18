@echo off
setlocal EnableDelayedExpansion
title SteamHappy Spammer 安装器

REM ============================================================
REM  SteamHappy Spammer - Millennium 插件一键安装器
REM  1) 找 Steam 路径
REM  2) 没装 Millennium 就从 GitHub 下载官方安装器并运行
REM  3) 把 com.saber.steamhappy.star 放进 millennium\plugins
REM
REM  用法:  install-millennium.bat           正常安装
REM         install-millennium.bat --check   只检测, 不改动任何东西
REM ============================================================

set "PLUGIN_ID=com.saber.steamhappy"
set "STAR_NAME=%PLUGIN_ID%.star"
set "MW_URL=https://github.com/SteamClientHomebrew/Installer/releases/latest/download/MillenniumInstaller-Windows.exe"

set "CHECK_ONLY=0"
if /i "%~1"=="--check" set "CHECK_ONLY=1"
if /i "%~1"=="-c" set "CHECK_ONLY=1"

echo ============================================================
echo   SteamHappy Spammer - Millennium 插件安装器
echo ============================================================
if "%CHECK_ONLY%"=="1" echo   [检测模式] 不下载 / 不安装 / 不改动任何文件
echo.

REM ---------- 管理员权限 ----------
net session >nul 2>&1
if errorlevel 1 (
    if "%CHECK_ONLY%"=="1" (
        echo   提示: 当前非管理员。检测模式无影响; 正式安装会申请管理员权限。
    ) else (
        echo   需要管理员权限, 正在申请 ...
        powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs" >nul 2>&1
        exit /b
    )
)
echo.

REM ---------- 1) Steam 路径 ----------
set "STEAM="
for /f "tokens=2,*" %%A in ('reg query "HKCU\Software\Valve\Steam" /v SteamPath 2^>nul ^| findstr /i "SteamPath"') do set "STEAM=%%B"
if defined STEAM set "STEAM=%STEAM:/=\%"
if not defined STEAM if exist "C:\Program Files (x86)\Steam\steam.exe" set "STEAM=C:\Program Files (x86)\Steam"
if not defined STEAM if exist "C:\steam\steam.exe" set "STEAM=C:\steam"
if not defined STEAM if exist "D:\Steam\steam.exe" set "STEAM=D:\Steam"

if not defined STEAM (
    echo   [X] 找不到 Steam 安装路径。
    echo       请确认已安装 Steam, 或手动编辑本脚本里的 STEAM 变量。
    if "%CHECK_ONLY%"=="0" pause
    exit /b 1
)
echo   [1/5] Steam 路径  : %STEAM%

set "MILL=%STEAM%\millennium"
set "PLUGDIR=%MILL%\plugins"

REM ---------- 2) 插件包 ----------
set "STAR="
if exist "%~dp0%STAR_NAME%" set "STAR=%~dp0%STAR_NAME%"
if not defined STAR if exist "%~dp0..\millennium-plugin\%STAR_NAME%" set "STAR=%~dp0..\millennium-plugin\%STAR_NAME%"
if not defined STAR if exist "%PLUGDIR%\%STAR_NAME%" set "STAR=%PLUGDIR%\%STAR_NAME%"

if defined STAR (
    echo   [2/5] 插件包      : %STAR%
) else (
    echo   [2/5] 插件包      : 未找到 %STAR_NAME%
    echo         请把 %STAR_NAME% 与本脚本放同一目录后再运行。
    if "%CHECK_ONLY%"=="0" pause
    exit /b 1
)

REM ---------- 3) Millennium 是否已装 ----------
set "MW_OK=0"
if exist "%MILL%\bin" set "MW_OK=1"
if exist "%MILL%\config" set "MW_OK=1"
if "%MW_OK%"=="1" (
    echo   [3/5] Millennium  : 已安装
) else (
    echo   [3/5] Millennium  : 未安装
)

REM ---------- 4) 下载并安装 Millennium ----------
if "%MW_OK%"=="1" goto skip_mw

echo   [4/5] 准备安装 Millennium ...
echo.
echo     将下载第三方安装器 (会修改 Steam 客户端):
echo       %MW_URL%
echo.

if "%CHECK_ONLY%"=="1" (
    echo     [检测模式] 跳过下载与安装。到此一切就绪。
    goto done_check
)

choice /c YN /n /m "     继续下载并安装 Millennium 吗? [Y/N] "
if errorlevel 2 (
    echo     已取消。插件包仍在 %STAR%, 可稍后重跑本脚本。
    pause
    exit /b 0
)

set "DL_FILE=%TEMP%\MillenniumInstaller-Windows.exe"
echo     正在下载 ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; try { Invoke-WebRequest -Uri '%MW_URL%' -OutFile '%DL_FILE%' -UseBasicParsing } catch { exit 1 }"
if not exist "%DL_FILE%" (
    echo   [X] 下载失败 (网络受限?)。请手动到以下地址下载安装器:
    echo       https://github.com/SteamClientHomebrew/Installer/releases
    pause
    exit /b 1
)
echo     下载完成: %DL_FILE%

echo     正在关闭 Steam ...
if exist "%STEAM%\steam.exe" "%STEAM%\steam.exe" -shutdown >nul 2>&1
call :wait_steam_exit 40

echo     启动 Millennium 安装器, 请按提示完成安装 ...
start /wait "" "%DL_FILE%"
echo     安装器已退出, 继续 ...

:skip_mw
if "%MW_OK%"=="1" echo   [4/5] Millennium  : 已存在, 跳过下载

REM ---------- 5) 放置插件 ----------
echo   [5/5] 安装插件 ...
if not exist "%PLUGDIR%" mkdir "%PLUGDIR%" >nul 2>&1
copy /y "%STAR%" "%PLUGDIR%\%STAR_NAME%" >nul
if errorlevel 1 (
    echo   [X] 复制插件失败: %PLUGDIR%
    pause
    exit /b 1
)
echo         已放入: %PLUGDIR%\%STAR_NAME%

echo.
echo     正在启动 Steam ...
if exist "%STEAM%\steam.exe" start "" "%STEAM%\steam.exe"

echo.
echo ============================================================
echo   安装完成
echo.
echo   接下来:
echo     1. 等 Steam 起来并登录
echo     2. 打开 Millennium - 设置 - 插件, 确认 SteamHappy Spammer 已启用
echo     3. 打开某位好友的聊天窗口, 右下角会出现 [steamhappy 连发] 面板
echo ============================================================
pause
exit /b 0

REM ---------- 子过程: 等 Steam 退出 ----------
:wait_steam_exit
set /a _n=0
:wait_loop
tasklist /fi "IMAGENAME eq steam.exe" 2>nul | find /i "steam.exe" >nul
if errorlevel 1 exit /b 0
set /a _n+=1
if !_n! GEQ %~1 exit /b 0
timeout /t 1 /nobreak >nul
goto wait_loop

:done_check
echo.
echo ============================================================
echo   检测通过: Steam 路径 / 插件包 / 安装步骤 均正常。
echo   去掉 --check 重新运行即可真正安装。
echo ============================================================
pause
exit /b 0
