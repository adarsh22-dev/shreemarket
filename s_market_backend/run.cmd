@echo off
REM SreeMarket backend launcher (Windows cmd)
cd /d "%~dp0"

REM Set MySQL root password (edit if different)
if "%DB_PASSWORD%"=="" set DB_PASSWORD=dinkan@36

echo Starting SreeMarket backend on http://localhost:8082 ...
call mvn spring-boot:run
if errorlevel 1 (
  echo.
  echo Failed to start. Make sure Java 17, Maven and MySQL are installed.
  pause
)