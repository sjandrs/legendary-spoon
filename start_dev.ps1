# start_dev.ps1
# This script starts the development servers for both the Django backend and the React frontend.
# It will open two separate PowerShell windows for each process.

Write-Host "Starting Django backend server in a new window..."
# Start the Django server in a new PowerShell window.
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Django backend server on http://127.0.0.1:8000'; .\venv\Scripts\python.exe manage.py runserver"

Write-Host "Starting React frontend server in a new window..."
# Navigate to the frontend directory and start the Vite dev server in another new PowerShell window.
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Vite frontend server...'; cd frontend; npm run dev"

Write-Host "Development servers are starting in new windows."
