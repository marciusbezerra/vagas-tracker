@echo off
rem cd /d "%~dp0"
cd /d D:\Projects\NextJs\vagas-tracker
start chrome --app=http://localhost:3001
npm run dev

@REM start "" /min cmd /c npm run dev
@REM timeout /t 3 > nul
@REM rem start msedge --app=http://localhost:3001
@REM start chrome --app=http://localhost:3001
@REM rem start http://localhost:3001