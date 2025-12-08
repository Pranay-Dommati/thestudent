#!/usr/bin/env bash
# Start script for Render deployment
# Runs both FastAPI server and AI Teacher Agent

set -e

echo "Starting Code Visualizer Backend Services..."

# Start uvicorn in the background
echo "Starting FastAPI server on port $PORT..."
uvicorn server:app --host 0.0.0.0 --port $PORT &
UVICORN_PID=$!

# Wait a moment for the server to start
sleep 3

# Start the AI Teacher Agent
echo "Starting AI Teacher Agent..."
python ai_teacher_agent.py start &
AGENT_PID=$!

echo "Both services started!"
echo "  - FastAPI PID: $UVICORN_PID"
echo "  - AI Agent PID: $AGENT_PID"

# Wait for any process to exit
wait -n

# Exit with status of first process that exits
exit $?
