#!/bin/bash
# Django Server Startup Script with URL Verification

cd "$(dirname "$0")"

echo "======================================================"
echo "🚀 Starting Django Server"
echo "======================================================"

# Kill any existing server on port 8000
echo "Checking for existing server on port 8000..."
PID=$(netstat -ano | grep ":8000" | grep "LISTENING" | awk '{print $5}' | head -1)
if [ ! -z "$PID" ]; then
    echo "Found existing server (PID: $PID), stopping it..."
    taskkill //PID $PID //F 2>/dev/null || kill -9 $PID 2>/dev/null || echo "Could not kill process"
    sleep 2
fi

echo ""
echo "Verifying URL configuration..."
python test_url_routing.py

echo ""
echo "======================================================"
echo "Starting Django development server..."
echo "======================================================"
echo ""
echo "📍 Server will be available at:"
echo "   - http://127.0.0.1:8000"
echo "   - http://localhost:8000"
echo ""
echo "🔍 Watch this terminal for request logs and errors"
echo "Press CTRL+C to stop the server"
echo ""
echo "======================================================"
echo ""

# Start the server
python manage.py runserver 0.0.0.0:8000
