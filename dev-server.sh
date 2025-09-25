#!/bin/bash

# Development server startup script with proper process management
# Ensures stable port binding and prevents conflicts

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/dev_pid.txt"
LOG_FILE="$PROJECT_DIR/dev_server.log"

# Function to cleanup existing processes
cleanup_existing() {
    echo "🧹 Cleaning up existing processes..."

    # Kill any existing dev server
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo "Killing existing server (PID: $OLD_PID)"
            kill "$OLD_PID" 2>/dev/null
            sleep 2
        fi
        rm -f "$PID_FILE"
    fi

    # Kill any processes on our target ports
    echo "Checking for processes on ports 8080-8081..."
    lsof -ti:8080 | xargs -r kill -9 2>/dev/null
    lsof -ti:8081 | xargs -r kill -9 2>/dev/null

    sleep 1
}

# Function to start the server
start_server() {
    echo "🚀 Starting development server..."
    echo "📁 Project directory: $PROJECT_DIR"
    echo "📋 Log file: $LOG_FILE"

    cd "$PROJECT_DIR"

    # Start server in background with proper logging
    nohup pnpm dev > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!

    # Save PID for future cleanup
    echo "$SERVER_PID" > "$PID_FILE"

    echo "✅ Server started with PID: $SERVER_PID"
    echo "📝 Logs available at: $LOG_FILE"
}

# Function to wait for server to be ready
wait_for_server() {
    echo "⏳ Waiting for server to be ready..."

    for i in {1..30}; do
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            echo "✅ Server is ready!"
            echo "🌐 URL: http://localhost:8080"
            return 0
        fi

        if ! ps -p "$(cat "$PID_FILE" 2>/dev/null)" > /dev/null 2>&1; then
            echo "❌ Server process died. Check logs:"
            tail -10 "$LOG_FILE"
            return 1
        fi

        echo "   Attempt $i/30..."
        sleep 2
    done

    echo "⚠️  Server didn't respond after 60 seconds. Check logs:"
    tail -10 "$LOG_FILE"
    return 1
}

# Main execution
main() {
    echo "🔧 Development Server Manager"
    echo "================================"

    cleanup_existing
    start_server
    wait_for_server

    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Development server is running!"
        echo "🌐 Access your app at: http://localhost:8080"
        echo "📝 View logs: tail -f $LOG_FILE"
        echo "🛑 Stop server: kill \$(cat $PID_FILE)"
    else
        echo ""
        echo "❌ Failed to start development server"
        exit 1
    fi
}

# Handle script termination
trap 'echo "Script interrupted"; exit 1' INT TERM

# Run main function
main