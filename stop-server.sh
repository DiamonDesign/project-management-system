#!/bin/bash

# Stop development server script
# Safely terminates the development server and cleans up resources

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/dev_pid.txt"

echo "🛑 Stopping development server..."

# Stop server using PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Stopping server (PID: $PID)"
        kill "$PID"

        # Wait for graceful shutdown
        for i in {1..10}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                echo "✅ Server stopped gracefully"
                break
            fi
            sleep 1
        done

        # Force kill if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Force killing server..."
            kill -9 "$PID"
        fi
    else
        echo "No running server found with PID: $PID"
    fi
    rm -f "$PID_FILE"
else
    echo "No PID file found"
fi

# Clean up any remaining processes on ports
echo "🧹 Cleaning up ports 8080-8081..."
lsof -ti:8080 | xargs -r kill -9 2>/dev/null
lsof -ti:8081 | xargs -r kill -9 2>/dev/null

echo "✅ Development server stopped"