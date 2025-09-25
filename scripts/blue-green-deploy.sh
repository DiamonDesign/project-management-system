#!/bin/bash

# =============================================================================
# Blue-Green Deployment Script with Automatic Rollback
# Zero-downtime deployment strategy with comprehensive validation and rollback
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${PROJECT_ROOT}/deployment-config.yml"

# Default configuration (can be overridden by environment variables)
APP_NAME="${APP_NAME:-visionday}"
ENVIRONMENT="${ENVIRONMENT:-production}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
ROLLBACK_TIMEOUT="${ROLLBACK_TIMEOUT:-60}"
TRAFFIC_SHIFT_DELAY="${TRAFFIC_SHIFT_DELAY:-30}"
VALIDATION_ROUNDS="${VALIDATION_ROUNDS:-3}"
MONITORING_DELAY="${MONITORING_DELAY:-180}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_step() {
    echo -e "\n${BLUE}▶ $1${NC}" >&2
    echo "======================================" >&2
}

# Global variables
CURRENT_SLOT=""
NEW_SLOT=""
DEPLOYMENT_ID=""
ROLLBACK_INITIATED=false
DEPLOYMENT_START_TIME=""

# Cleanup function for emergency situations
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ] && [ "$ROLLBACK_INITIATED" = false ]; then
        log_error "Deployment failed, initiating emergency rollback..."
        emergency_rollback
    fi
}

trap cleanup EXIT

# =============================================================================
# CORE DEPLOYMENT FUNCTIONS
# =============================================================================

# Initialize deployment
initialize_deployment() {
    log_step "Initializing Blue-Green Deployment"

    DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 4)"
    DEPLOYMENT_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Environment: $ENVIRONMENT"
    log_info "Application: $APP_NAME"
    log_info "Start Time: $DEPLOYMENT_START_TIME"

    # Create deployment directory
    mkdir -p "/tmp/deployment-$DEPLOYMENT_ID"

    # Initialize deployment metadata
    cat > "/tmp/deployment-$DEPLOYMENT_ID/metadata.json" <<EOF
{
    "deploymentId": "$DEPLOYMENT_ID",
    "appName": "$APP_NAME",
    "environment": "$ENVIRONMENT",
    "startTime": "$DEPLOYMENT_START_TIME",
    "status": "initializing",
    "currentSlot": null,
    "newSlot": null
}
EOF
}

# Determine current and new slots
determine_slots() {
    log_step "Determining Current and New Deployment Slots"

    # Get current active slot from load balancer or service discovery
    CURRENT_SLOT=$(get_active_slot)

    if [ "$CURRENT_SLOT" = "blue" ]; then
        NEW_SLOT="green"
    elif [ "$CURRENT_SLOT" = "green" ]; then
        NEW_SLOT="blue"
    else
        # First deployment - default to blue
        CURRENT_SLOT="none"
        NEW_SLOT="blue"
    fi

    log_info "Current active slot: $CURRENT_SLOT"
    log_info "New deployment slot: $NEW_SLOT"

    # Update metadata
    update_deployment_metadata "currentSlot" "$CURRENT_SLOT"
    update_deployment_metadata "newSlot" "$NEW_SLOT"
}

# Get active slot from load balancer
get_active_slot() {
    # This would integrate with your specific load balancer/orchestration system
    # Examples for different platforms:

    if command -v kubectl &> /dev/null; then
        # Kubernetes example
        kubectl get service "$APP_NAME-active" -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo "none"
    elif command -v docker &> /dev/null; then
        # Docker Swarm example
        docker service inspect "$APP_NAME-active" --format '{{.Spec.TaskTemplate.ContainerSpec.Labels.slot}}' 2>/dev/null || echo "none"
    elif [ -f "/etc/nginx/conf.d/upstream.conf" ]; then
        # Nginx upstream example
        grep -o "server.*-\(blue\|green\)" /etc/nginx/conf.d/upstream.conf | head -1 | grep -o '\(blue\|green\)' || echo "none"
    else
        # Default fallback - check via health endpoint
        if curl -s "https://$APP_NAME.com/api/deployment-info" | grep -q "blue"; then
            echo "blue"
        elif curl -s "https://$APP_NAME.com/api/deployment-info" | grep -q "green"; then
            echo "green"
        else
            echo "none"
        fi
    fi
}

# Build and deploy to new slot
deploy_to_new_slot() {
    log_step "Deploying to New Slot: $NEW_SLOT"

    update_deployment_metadata "status" "building"

    # Build new container image
    log_info "Building container image for $NEW_SLOT slot..."
    docker build \
        --tag "$APP_NAME:$NEW_SLOT-$DEPLOYMENT_ID" \
        --tag "$APP_NAME:$NEW_SLOT-latest" \
        --label "deployment.id=$DEPLOYMENT_ID" \
        --label "deployment.slot=$NEW_SLOT" \
        --label "deployment.timestamp=$DEPLOYMENT_START_TIME" \
        "$PROJECT_ROOT"

    # Security scan
    log_info "Running security scan on new image..."
    if command -v trivy &> /dev/null; then
        trivy image --severity HIGH,CRITICAL --exit-code 1 "$APP_NAME:$NEW_SLOT-$DEPLOYMENT_ID"
    fi

    # Deploy to new slot
    log_info "Deploying to $NEW_SLOT slot..."
    deploy_container_to_slot "$NEW_SLOT" "$DEPLOYMENT_ID"

    update_deployment_metadata "status" "deployed"
}

# Deploy container to specific slot
deploy_container_to_slot() {
    local slot=$1
    local deploy_id=$2
    local container_name="$APP_NAME-$slot"
    local port_base=8000
    local port=$((port_base + (slot == "blue" ? 1 : 2)))

    # Stop existing container in slot if exists
    if docker ps -q -f name="$container_name" | grep -q .; then
        log_info "Stopping existing container in $slot slot..."
        docker stop "$container_name" || true
        docker rm "$container_name" || true
    fi

    # Run new container
    log_info "Starting new container in $slot slot on port $port..."
    docker run -d \
        --name "$container_name" \
        --label "deployment.id=$deploy_id" \
        --label "deployment.slot=$slot" \
        --publish "$port:80" \
        --restart unless-stopped \
        --env "NODE_ENV=$ENVIRONMENT" \
        --env "DEPLOYMENT_SLOT=$slot" \
        --env "DEPLOYMENT_ID=$deploy_id" \
        --health-cmd="curl -f http://localhost/health || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        "$APP_NAME:$slot-$deploy_id"

    # Wait for container to be healthy
    log_info "Waiting for container health check..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker inspect "$container_name" --format='{{.State.Health.Status}}' | grep -q "healthy"; then
            log_success "Container is healthy"
            return 0
        fi

        log_info "Health check attempt $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done

    log_error "Container failed to become healthy within timeout"
    return 1
}

# Validate new deployment
validate_deployment() {
    log_step "Validating New Deployment"

    local slot_port=$((8000 + (NEW_SLOT == "blue" ? 1 : 2)))
    local base_url="http://localhost:$slot_port"

    update_deployment_metadata "status" "validating"

    # Run validation rounds
    for round in $(seq 1 $VALIDATION_ROUNDS); do
        log_info "Validation round $round/$VALIDATION_ROUNDS"

        # Health check
        if ! validate_health_check "$base_url"; then
            log_error "Health check failed in round $round"
            return 1
        fi

        # Functional tests
        if ! validate_functional_tests "$base_url"; then
            log_error "Functional tests failed in round $round"
            return 1
        fi

        # Performance tests
        if ! validate_performance_tests "$base_url"; then
            log_error "Performance tests failed in round $round"
            return 1
        fi

        # Security tests
        if ! validate_security_tests "$base_url"; then
            log_error "Security tests failed in round $round"
            return 1
        fi

        log_success "Validation round $round passed"

        # Wait between rounds
        if [ $round -lt $VALIDATION_ROUNDS ]; then
            sleep 30
        fi
    done

    log_success "All validation rounds passed"
    update_deployment_metadata "status" "validated"
}

# Health check validation
validate_health_check() {
    local base_url=$1

    log_info "Running health check validation..."

    # Basic health endpoint
    if ! curl -s -f --max-time 30 "$base_url/health" > /dev/null; then
        log_error "Basic health check failed"
        return 1
    fi

    # API health endpoint
    if ! curl -s -f --max-time 30 "$base_url/api/health" > /dev/null; then
        log_error "API health check failed"
        return 1
    fi

    # Database connectivity check
    if ! curl -s -f --max-time 30 "$base_url/api/health/database" > /dev/null; then
        log_error "Database health check failed"
        return 1
    fi

    return 0
}

# Functional tests validation
validate_functional_tests() {
    local base_url=$1

    log_info "Running functional tests..."

    # Test critical user journeys
    if ! test_user_authentication "$base_url"; then
        return 1
    fi

    if ! test_api_endpoints "$base_url"; then
        return 1
    fi

    if ! test_data_persistence "$base_url"; then
        return 1
    fi

    return 0
}

# Performance tests validation
validate_performance_tests() {
    local base_url=$1

    log_info "Running performance tests..."

    # Load time test
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 30 "$base_url/")
    local response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)

    if [ "$response_time_ms" -gt 3000 ]; then
        log_error "Response time too slow: ${response_time_ms}ms"
        return 1
    fi

    log_info "Response time: ${response_time_ms}ms"

    # API performance test
    local api_response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 10 "$base_url/api/health")
    local api_response_time_ms=$(echo "$api_response_time * 1000" | bc -l | cut -d. -f1)

    if [ "$api_response_time_ms" -gt 1000 ]; then
        log_error "API response time too slow: ${api_response_time_ms}ms"
        return 1
    fi

    log_info "API response time: ${api_response_time_ms}ms"

    return 0
}

# Security tests validation
validate_security_tests() {
    local base_url=$1

    log_info "Running security tests..."

    # Security headers check
    local headers=$(curl -I -s --max-time 30 "$base_url/")

    if ! echo "$headers" | grep -q "X-Frame-Options"; then
        log_error "Missing X-Frame-Options header"
        return 1
    fi

    if ! echo "$headers" | grep -q "X-Content-Type-Options"; then
        log_error "Missing X-Content-Type-Options header"
        return 1
    fi

    if ! echo "$headers" | grep -q "Content-Security-Policy"; then
        log_error "Missing Content-Security-Policy header"
        return 1
    fi

    return 0
}

# Switch traffic to new deployment
switch_traffic() {
    log_step "Switching Traffic to New Deployment"

    update_deployment_metadata "status" "switching-traffic"

    # Gradual traffic shift: 10% -> 50% -> 100%
    local traffic_stages=(10 50 100)

    for stage in "${traffic_stages[@]}"; do
        log_info "Shifting ${stage}% traffic to $NEW_SLOT slot..."

        # Update load balancer configuration
        update_traffic_routing "$NEW_SLOT" "$stage"

        # Wait and monitor
        sleep "$TRAFFIC_SHIFT_DELAY"

        # Validate traffic shift
        if ! validate_traffic_shift "$stage"; then
            log_error "Traffic shift validation failed at ${stage}%"
            return 1
        fi

        log_success "${stage}% traffic shift completed and validated"
    done

    # Update active slot designation
    update_active_slot_designation "$NEW_SLOT"

    log_success "Traffic switch completed successfully"
    update_deployment_metadata "status" "active"
}

# Update traffic routing configuration
update_traffic_routing() {
    local target_slot=$1
    local percentage=$2

    # This function would integrate with your specific load balancer
    # Examples for different platforms:

    if command -v kubectl &> /dev/null; then
        # Kubernetes with Istio example
        update_istio_traffic_routing "$target_slot" "$percentage"
    elif [ -f "/etc/nginx/conf.d/upstream.conf" ]; then
        # Nginx example
        update_nginx_traffic_routing "$target_slot" "$percentage"
    elif command -v docker &> /dev/null; then
        # Docker Swarm example
        update_docker_swarm_routing "$target_slot" "$percentage"
    else
        # Generic load balancer API example
        update_generic_load_balancer "$target_slot" "$percentage"
    fi
}

# Monitor deployment for issues
monitor_deployment() {
    log_step "Monitoring New Deployment"

    update_deployment_metadata "status" "monitoring"

    local monitoring_start=$(date +%s)
    local monitoring_end=$((monitoring_start + MONITORING_DELAY))

    while [ "$(date +%s)" -lt "$monitoring_end" ]; do
        log_info "Monitoring deployment health..."

        # Check error rates
        if ! check_error_rates; then
            log_error "Error rates exceeded threshold"
            return 1
        fi

        # Check response times
        if ! check_response_times; then
            log_error "Response times exceeded threshold"
            return 1
        fi

        # Check resource utilization
        if ! check_resource_utilization; then
            log_error "Resource utilization exceeded threshold"
            return 1
        fi

        # Check business metrics
        if ! check_business_metrics; then
            log_warning "Business metrics showing degradation"
        fi

        # Wait before next check
        sleep 30
    done

    log_success "Deployment monitoring completed successfully"
    update_deployment_metadata "status" "stable"
}

# Automatic rollback function
automatic_rollback() {
    log_step "Initiating Automatic Rollback"

    ROLLBACK_INITIATED=true
    update_deployment_metadata "status" "rolling-back"

    log_warning "Rolling back to $CURRENT_SLOT slot..."

    # Switch traffic back to current slot
    if [ "$CURRENT_SLOT" != "none" ]; then
        update_traffic_routing "$CURRENT_SLOT" "100"
        update_active_slot_designation "$CURRENT_SLOT"
    else
        log_error "No previous deployment to rollback to"
        return 1
    fi

    # Stop and remove new slot container
    if docker ps -q -f name="$APP_NAME-$NEW_SLOT" | grep -q .; then
        docker stop "$APP_NAME-$NEW_SLOT"
        docker rm "$APP_NAME-$NEW_SLOT"
    fi

    # Send rollback notification
    send_rollback_notification

    update_deployment_metadata "status" "rolled-back"
    log_success "Rollback completed"
}

# Emergency rollback (fastest possible rollback)
emergency_rollback() {
    log_step "Emergency Rollback Initiated"

    ROLLBACK_INITIATED=true

    if [ "$CURRENT_SLOT" != "none" ]; then
        # Immediate traffic switch
        update_traffic_routing "$CURRENT_SLOT" "100"
        update_active_slot_designation "$CURRENT_SLOT"

        # Stop new slot container
        docker stop "$APP_NAME-$NEW_SLOT" 2>/dev/null || true
    fi

    # Send emergency notification
    send_emergency_notification

    log_error "Emergency rollback completed"
}

# Cleanup old deployment
cleanup_old_deployment() {
    log_step "Cleaning Up Old Deployment"

    if [ "$CURRENT_SLOT" != "none" ]; then
        log_info "Removing old $CURRENT_SLOT slot deployment..."

        # Give some time for connections to drain
        sleep 60

        # Stop and remove old container
        if docker ps -q -f name="$APP_NAME-$CURRENT_SLOT" | grep -q .; then
            docker stop "$APP_NAME-$CURRENT_SLOT"
            docker rm "$APP_NAME-$CURRENT_SLOT"
        fi

        # Remove old images (keep last 3 versions)
        docker images "$APP_NAME" --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" | \
        grep "$CURRENT_SLOT" | \
        tail -n +4 | \
        awk '{print $2}' | \
        xargs -r docker rmi
    fi

    log_success "Old deployment cleanup completed"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Update deployment metadata
update_deployment_metadata() {
    local key=$1
    local value=$2
    local metadata_file="/tmp/deployment-$DEPLOYMENT_ID/metadata.json"

    # Update JSON file
    jq --arg key "$key" --arg value "$value" '.[$key] = $value' "$metadata_file" > "$metadata_file.tmp"
    mv "$metadata_file.tmp" "$metadata_file"
}

# Send notifications
send_deployment_notification() {
    local status=$1
    local message="🚀 Deployment $DEPLOYMENT_ID: $status"

    # Send to Slack
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi

    # Send to webhook
    if [ -n "${DEPLOYMENT_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"deploymentId\":\"$DEPLOYMENT_ID\",\"status\":\"$status\",\"message\":\"$message\"}" \
            "$DEPLOYMENT_WEBHOOK_URL"
    fi
}

send_rollback_notification() {
    local message="⚠️ Automatic rollback initiated for deployment $DEPLOYMENT_ID"

    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

send_emergency_notification() {
    local message="🚨 EMERGENCY ROLLBACK: Deployment $DEPLOYMENT_ID failed critically"

    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# =============================================================================
# MAIN DEPLOYMENT FLOW
# =============================================================================

main() {
    log_step "Starting Blue-Green Deployment Process"

    # Check prerequisites
    check_prerequisites

    # Initialize deployment
    initialize_deployment

    # Determine deployment slots
    determine_slots

    # Deploy to new slot
    if ! deploy_to_new_slot; then
        log_error "Deployment to new slot failed"
        exit 1
    fi

    # Validate deployment
    if ! validate_deployment; then
        log_error "Deployment validation failed"
        automatic_rollback
        exit 1
    fi

    # Switch traffic
    if ! switch_traffic; then
        log_error "Traffic switch failed"
        automatic_rollback
        exit 1
    fi

    # Monitor deployment
    if ! monitor_deployment; then
        log_error "Deployment monitoring detected issues"
        automatic_rollback
        exit 1
    fi

    # Cleanup old deployment
    cleanup_old_deployment

    # Send success notification
    send_deployment_notification "SUCCESSFUL"

    log_success "Blue-Green Deployment Completed Successfully!"
    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Active Slot: $NEW_SLOT"
    log_info "Duration: $(($(date +%s) - $(date -d "$DEPLOYMENT_START_TIME" +%s))) seconds"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check required commands
    for cmd in docker curl jq bc; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon not running or accessible"
        exit 1
    fi

    # Check environment variables
    if [ "$ENVIRONMENT" = "production" ]; then
        for var in SLACK_WEBHOOK_URL; do
            if [ -z "${!var:-}" ]; then
                log_warning "Environment variable not set: $var"
            fi
        done
    fi

    log_success "Prerequisites check passed"
}

# Test functions (simplified implementations)
test_user_authentication() {
    local base_url=$1
    # Add your specific authentication tests here
    curl -s -f "$base_url/login" > /dev/null
}

test_api_endpoints() {
    local base_url=$1
    # Add your specific API endpoint tests here
    curl -s -f "$base_url/api/projects" > /dev/null
}

test_data_persistence() {
    local base_url=$1
    # Add your specific data persistence tests here
    return 0
}

check_error_rates() {
    # Implement error rate checking logic
    return 0
}

check_response_times() {
    # Implement response time checking logic
    return 0
}

check_resource_utilization() {
    # Implement resource utilization checking logic
    return 0
}

check_business_metrics() {
    # Implement business metrics checking logic
    return 0
}

validate_traffic_shift() {
    local percentage=$1
    # Implement traffic shift validation logic
    return 0
}

update_istio_traffic_routing() {
    local slot=$1
    local percentage=$2
    # Implement Istio traffic routing update
    return 0
}

update_nginx_traffic_routing() {
    local slot=$1
    local percentage=$2
    # Implement Nginx traffic routing update
    return 0
}

update_docker_swarm_routing() {
    local slot=$1
    local percentage=$2
    # Implement Docker Swarm routing update
    return 0
}

update_generic_load_balancer() {
    local slot=$1
    local percentage=$2
    # Implement generic load balancer update
    return 0
}

update_active_slot_designation() {
    local slot=$1
    # Update service discovery or load balancer active slot designation
    return 0
}

# Execute main function if script is run directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi