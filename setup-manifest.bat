@echo off
REM TON Connect Manifest Setup Script for Windows
REM This script helps set up the manifest.json file and configure it for GitHub

echo.
echo 🚀 TON Connect Manifest Setup
echo ================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo ⚠️  Git repository not found. Initializing...
    git init
    echo ✅ Git repository initialized
    echo.
)

REM Get GitHub repository info
set /p GITHUB_USERNAME="Enter your GitHub username: "
set /p REPO_NAME="Enter your repository name: "
set /p BRANCH="Enter your branch name (default: main): "
if "%BRANCH%"=="" set BRANCH=main

REM Create manifest.json
echo.
echo 📝 Creating manifest.json...

(
echo {
echo   "url": "https://tmd-markets.vercel.app",
echo   "name": "TMD Markets",
echo   "iconUrl": "https://raw.githubusercontent.com/%GITHUB_USERNAME%/%REPO_NAME%/%BRANCH%/public/logo.jpg",
echo   "termsOfUseUrl": "https://tmd-markets.vercel.app/terms",
echo   "privacyPolicyUrl": "https://tmd-markets.vercel.app/privacy"
echo }
) > public\manifest.json

echo ✅ manifest.json created

REM Update TonConnectProvider.tsx
echo.
echo 📝 Updating TonConnectProvider.tsx...

set MANIFEST_URL=https://raw.githubusercontent.com/%GITHUB_USERNAME%/%REPO_NAME%/%BRANCH%/public/manifest.json

powershell -Command "(Get-Content components\TonConnectProvider.tsx) -replace 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/public/manifest.json', '%MANIFEST_URL%' | Set-Content components\TonConnectProvider.tsx"

echo ✅ TonConnectProvider.tsx updated

REM Create .env.local if it doesn't exist
if not exist ".env.local" (
    echo.
    echo 📝 Creating .env.local...
    echo NEXT_PUBLIC_MANIFEST_URL=%MANIFEST_URL% > .env.local
    echo ✅ .env.local created
) else (
    echo.
    echo 📝 Updating .env.local...
    findstr /C:"NEXT_PUBLIC_MANIFEST_URL" .env.local >nul
    if errorlevel 1 (
        echo NEXT_PUBLIC_MANIFEST_URL=%MANIFEST_URL% >> .env.local
    ) else (
        powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_MANIFEST_URL=.*', 'NEXT_PUBLIC_MANIFEST_URL=%MANIFEST_URL%' | Set-Content .env.local"
    )
    echo ✅ .env.local updated
)

echo.
echo 📦 Staging files for commit...
git add public\manifest.json components\TonConnectProvider.tsx .env.local

echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Review the changes:
echo    git status
echo.
echo 2. Commit the changes:
echo    git commit -m "Add TON Connect manifest configuration"
echo.
echo 3. Push to GitHub:
echo    git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
echo    git push -u origin %BRANCH%
echo.
echo 4. Verify the manifest is accessible at:
echo    %MANIFEST_URL%
echo.
echo 🎉 Your TON Connect manifest is ready!
pause
