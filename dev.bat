@echo off
REM Light design - start Vite dev server and open the default browser when ready.
REM Window opens minimized (/MIN); restore from taskbar to see Vite logs.

start /MIN "LABEL-PRINTER - Vite" /D "%~dp0" cmd /k npm run dev -- --open
