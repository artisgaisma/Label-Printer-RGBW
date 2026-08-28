@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo  Label Printer - Release Builder
echo  ================================
echo.
echo  Current folder: %cd%
echo.
echo  Choose version bump:
echo    1 = patch  (1.0.0 -^> 1.0.1)   [default]
echo    2 = minor  (1.0.0 -^> 1.1.0)
echo    3 = major  (1.0.0 -^> 2.0.0)
echo    4 = type exact version (e.g. 1.2.3)
echo.

set /p CHOICE="Enter 1-4 [1]: "
if "%CHOICE%"=="" set CHOICE=1

if "%CHOICE%"=="1" (
  node scripts\build-release.mjs patch
) else if "%CHOICE%"=="2" (
  node scripts\build-release.mjs minor
) else if "%CHOICE%"=="3" (
  node scripts\build-release.mjs major
) else if "%CHOICE%"=="4" (
  set /p VER="Exact version (x.y.z): "
  node scripts\build-release.mjs !VER!
) else (
  echo Invalid choice.
  pause
  exit /b 1
)

set ERR=!ERRORLEVEL!
echo.
if not "!ERR!"=="0" (
  echo Build failed.
) else (
  echo Open the release folder to share the files.
  explorer "%cd%\release"
)
pause
