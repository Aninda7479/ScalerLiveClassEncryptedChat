@echo off
setlocal enabledelayedexpansion
title Scaler Encrypted Chat - Updater

echo ======================================================
echo    Scaler Academy Encrypted Chat - Quick Updater
echo ======================================================
echo.

:: 1. Check if git is available and repo has .git
if exist ".git" (
    echo [*] Git repository detected. Pulling latest updates from GitHub...
    git pull
    if !errorlevel! equ 0 (
        echo.
        echo [OK] Successfully updated via git!
        echo [*] Open chrome://extensions in Chrome and click the reload icon.
        echo ======================================================
        pause
        exit /b 0
    ) else (
        echo [!] git pull failed or has conflicts, falling back to direct download...
    )
)

:: 2. Direct download latest release zip via PowerShell
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
    "  $url = if ($zipAsset) { $zipAsset.browser_download_url } else { 'https://github.com/' + $repo + '/archive/refs/heads/main.zip' };" ^
    "  Write-Host ('[*] Downloading: ' + $url);" ^
    "  $tmp = Join-Path $env:TEMP 'scaler_extension_update.zip';" ^
    "  Invoke-WebRequest -Uri $url -OutFile $tmp;" ^
    "  Write-Host '[*] Applying update to chrome-extension folder...';" ^
    "  $dest = if (Test-Path '.\chrome-extension') { '.\chrome-extension' } else { '.' };" ^
    "  Expand-Archive -Path $tmp -DestinationPath $dest -Force;" ^
    "  Remove-Item $tmp -Force;" ^
    "  Write-Host '[OK] Update files replaced successfully!' -ForegroundColor Green;" ^
    "} catch {" ^
    "  Write-Host ('[!] Error downloading update: ' + $_.Exception.Message) -ForegroundColor Red;" ^
    "}"

echo.
echo ======================================================
echo [OK] Update process finished!
echo Open chrome://extensions in Chrome and click the
echo reload icon on "Scaler Academy Encrypted Private Chat".
echo ======================================================
pause
