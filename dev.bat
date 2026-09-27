@echo off
REM Start this project on its own port so another Vite app cannot be opened.
REM Window opens minimized (/MIN); restore from taskbar to see Vite logs.

start /MIN "LABEL-PRINTER - Vite" /D "%~dp0" cmd /k npm run dev -- --host 127.0.0.1 --port 41731 --strictPort --open
