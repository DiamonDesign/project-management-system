# Development Server Management

## Quick Start

**Start server**: `./dev-server.sh`
**Stop server**: `./stop-server.sh`
**URL**: http://localhost:8080

## What Was Fixed

### Root Cause Issues Resolved:
1. **Port Conflicts**: Server auto-switching ports caused confusion
2. **Process Management**: No proper cleanup of existing processes
3. **Timeout Failures**: Command timeouts killed server processes

### Solutions Implemented:

#### 1. Vite Configuration Enhanced
- Added `strictPort: true` - Forces server to use port 8080 or fail
- Configured HMR port to 8081 to prevent conflicts
- No more automatic port switching confusion

#### 2. Process Management Scripts
- **`dev-server.sh`**: Intelligent startup with cleanup and monitoring
- **`stop-server.sh`**: Safe server termination and port cleanup
- Proper PID tracking and process lifecycle management

#### 3. Stability Features
- Pre-startup cleanup of conflicting processes
- Health checks to verify server readiness
- Comprehensive logging for troubleshooting
- Graceful shutdown with force-kill fallback

## Usage

### Starting Development Server
```bash
./dev-server.sh
```
This script will:
1. Clean up any existing processes on ports 8080-8081
2. Start the server in background mode
3. Wait for server to be ready
4. Provide status confirmation and logs location

### Stopping Development Server
```bash
./stop-server.sh
```
This script will:
1. Gracefully terminate the server process
2. Clean up port bindings
3. Remove PID files

### Manual Operations
```bash
# Check server status
ps -p $(cat dev_pid.txt)

# View logs
tail -f dev_server.log

# Manual cleanup if needed
lsof -ti:8080 | xargs kill -9
```

## Prevention Measures

1. **Always use scripts**: Use `./dev-server.sh` instead of direct `pnpm dev`
2. **Proper shutdown**: Always use `./stop-server.sh` when done
3. **Port reservation**: Server strictly uses port 8080 (no more switching)
4. **Process tracking**: PID files prevent orphaned processes

## Troubleshooting

### Server Won't Start
1. Check if port is occupied: `lsof -i :8080`
2. Run cleanup: `./stop-server.sh`
3. Try starting again: `./dev-server.sh`

### Connection Refused
1. Verify server is running: `ps -p $(cat dev_pid.txt)`
2. Check logs: `tail dev_server.log`
3. Test connection: `curl http://localhost:8080`

### Logs Location
- **Server logs**: `dev_server.log`
- **PID tracking**: `dev_pid.txt`