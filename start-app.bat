@echo off
echo Starting InStream Application...

:: Start backend server in a new window
start cmd /k "cd src/python && python -m app.main"

:: Wait for 5 seconds to ensure backend is up
timeout /t 5

:: Start frontend server in a new window
start cmd /k "npm run dev"

echo Both servers are starting...
echo Backend will be available at http://localhost:5000
echo Frontend will be available at http://localhost:9002