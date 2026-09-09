@echo off
setlocal enabledelayedexpansion
title Scaler Encrypted Chat - Quick Updater

echo ======================================================
echo    Scaler Academy Encrypted Chat - Quick Updater
echo ======================================================
echo.

cd /d "%~dp0"

:: 1. Check for Git repository (either here or in parent directory)
if exist ".git" (
    echo [*] Git repository detected. Pulling latest code...
    git pull
    if !errorlevel! equ 0 goto :success
)
if exist "..\.git" (
    echo [*] Git repository detected in parent. Pulling latest code...
    pushd ..
    git pull
    popd
    if !errorlevel! equ 0 goto :success
)

:: 2. Direct download latest release from GitHub
echo [*] Fetching latest release from GitHub...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$repo = 'Aninda7479/ScalerLiveClassEncryptedChat';" ^
    "$apiUrl = 'https://api.github.com/repos/' + $repo + '/releases/latest';" ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;" ^
    "try {" ^
    "  $release = Invoke-RestMethod -Uri $apiUrl -Headers @{ 'User-Agent' = 'Scaler-Updater' };" ^
    "  $tag = $release.tag_name;" ^
    "  Write-Host ('[*] Latest release: ' + $tag) -ForegroundColor Cyan;" ^
    "  $zipAsset = $release.assets | Where-Object { $_.name -like '*.zip' } | Select-Object -First 1;" ^
    "  if ($zipAsset) { $url = $zipAsset.browser_download_url } else { $url = 'https://github.com/' + $repo + '/archive/refs/heads/main.zip' };" ^
    "  Write-Host ('[*] Downloading update from: ' + $url);" ^
    "  $tmpZip = Join-Path $env:TEMP 'scaler_extension_update.zip';" ^
    "  Invoke-WebRequest -Uri $url -OutFile $tmpZip;" ^
    "  $dest = '%~dp0';" ^
    "  if (Test-Path (Join-Path $dest 'chrome-extension\manifest.json')) { $dest = Join-Path $dest 'chrome-extension' };" ^
    "  Write-Host ('[*] Updating files in: ' + $dest);" ^
    "  Expand-Archive -Path $tmpZip -DestinationPath $dest -Force;" ^
    "  Remove-Item $tmpZip -Force -ErrorAction SilentlyContinue;" ^
    "  Write-Host '[OK] All files updated successfully!' -ForegroundColor Green;" ^
    "} catch {" ^
    "  Write-Host ('[!] Update failed: ' + $_.Exception.Message) -ForegroundColor Red;" ^
    "  exit 1;" ^
    "}"

if %errorlevel% neq 0 (
    echo.
    echo [!] Automatic download encountered an issue.
    echo You can download the latest release manually from:
    echo https://github.com/Aninda7479/ScalerLiveClassEncryptedChat/releases/latest
    echo.
    pause
    exit /b 1
)

:success
echo.
echo ======================================================
echo [OK] Update complete!
echo 1. Open chrome://extensions in your browser.
echo 2. Click the circular reload icon on
echo    "Scaler Academy Encrypted Private Chat".
echo ======================================================
echo.
pause
