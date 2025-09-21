#!/bin/bash

# Blue-Green Deployment Script for VerifyWise
# Provides zero-downtime deployments with automatic rollback on failure

set -e  # Exit on any error

# Configuration
COMPOSE_FILE="docker-compose.blue-green.yml"
NGINX_STATE_DIR="./nginx/state"
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10  # 10 seconds
HEALTH_CHECK_RETRIES=5
ROLLBACK_TIMEOUT=60       # 1 minute

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Ensure required directories exist
initialize_directories() {
    log "Initializing deployment directories..."
    mkdir -p "$NGINX_STATE_DIR"

    # Initialize active environment file if it doesn't exist
    if [ ! -f "$NGINX_STATE_DIR/active_environment.conf" ]; then
        cat > "$NGINX_STATE_DIR/active_environment.conf" << EOF
# Active environment configuration
map \$http_host \$backend_pool {
    default backend_blue;
}
EOF
        log "Initialized active environment to blue"
    fi
}

# Get current active environment
get_active_environment() {
    if grep -q "backend_green" "$NGINX_STATE_DIR/active_environment.conf"; then
        echo "green"
    else
        echo "blue"
    fi
}

# Get inactive environment
get_inactive_environment() {
    local active=$(get_active_environment)
    if [ "$active" = "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Check if required tools are available
check_dependencies() {
    log "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        error "curl is not installed or not in PATH"
        exit 1
    fi

    log "All dependencies are available"
}

# Enhanced health check function
check_environment_health() {
    local env=$1
    local backend_container="verifywise-backend-$env"
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    local attempt=1

    log "Performing comprehensive health check for $env environment..."

    # Check if container is running
    if ! docker ps --format "table {{.Names}}" | grep -q "$backend_container"; then
        error "Backend container $backend_container is not running"
        return 1
    fi

    # Wait for container to be fully ready
    log "Waiting for $backend_container to be ready..."

    while [ $attempt -le $max_attempts ]; do
        local container_health=""
        local endpoint_health=""
        local circuit_breaker_health=""

        # Check container health status
        container_health=$(docker inspect --format='{{.State.Health.Status}}' "$backend_container" 2>/dev/null || echo "unknown")

        # Check health endpoint
        if docker exec "$backend_container" curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
            endpoint_health="healthy"

            # Check detailed health with circuit breakers
            local health_response=$(docker exec "$backend_container" curl -s http://localhost:3000/health?level=circuit-breakers 2>/dev/null || echo "")
            if echo "$health_response" | grep -q '"status":"healthy"'; then
                circuit_breaker_health="healthy"
            else
                circuit_breaker_health="degraded"
            fi
        else
            endpoint_health="unhealthy"
            circuit_breaker_health="unknown"
        fi

        info "Health check attempt $attempt/$max_attempts for $env:"
        info "  Container health: $container_health"
        info "  Endpoint health: $endpoint_health"
        info "  Circuit breakers: $circuit_breaker_health"

        # Check if all health indicators are good
        if [ "$container_health" = "healthy" ] && [ "$endpoint_health" = "healthy" ] && [ "$circuit_breaker_health" = "healthy" ]; then
            log "$env environment is fully healthy and ready"
            return 0
        fi

        if [ $attempt -eq $max_attempts ]; then
            error "$env environment failed health check after $HEALTH_CHECK_TIMEOUT seconds"
            error "Final status - Container: $container_health, Endpoint: $endpoint_health, Circuit breakers: $circuit_breaker_health"
            return 1
        fi

        log "Health check attempt $attempt/$max_attempts for $env environment..."
        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done

    return 1
}

# Switch traffic to new environment
switch_traffic() {
    local new_env=$1
    log "Switching traffic to $new_env environment..."

    # Create new nginx configuration
    cat > "$NGINX_STATE_DIR/active_environment.conf" << EOF
# Active environment configuration
# Updated: $(date)
map \$http_host \$backend_pool {
    default backend_$new_env;
}
EOF

    # Reload nginx configuration
    if docker exec nginx-lb nginx -s reload 2>/dev/null; then
        log "Traffic successfully switched to $new_env"

        # Verify the switch worked
        sleep 5
        local health_check=$(curl -s -f http://localhost:${BACKEND_PORT:-3000}/health 2>/dev/null || echo "failed")
        if [ "$health_check" != "failed" ]; then
            log "Traffic switch verification successful"
            return 0
        else
            error "Traffic switch verification failed"
            return 1
        fi
    else
        error "Failed to reload nginx configuration"
        return 1
    fi
}

# Rollback to previous environment
rollback() {
    local rollback_env=$1
    warn "Initiating rollback to $rollback_env environment..."

    # Switch traffic back
    if switch_traffic "$rollback_env"; then
        log "Rollback successful - traffic restored to $rollback_env"

        # Restart the rollback environment if needed
        log "Ensuring $rollback_env environment is healthy..."
        docker-compose -f "$COMPOSE_FILE" up -d "backend-$rollback_env"

        if check_environment_health "$rollback_env"; then
            log "Rollback completed successfully"
            return 0
        else
            error "Rollback environment is not healthy"
            return 1
        fi
    else
        error "Rollback failed - manual intervention required"
        return 1
    fi
}

# Build new image (optional)
build_image() {
    local tag=${1:-"latest"}
    log "Building new backend image with tag: $tag..."

    if [ -f "Servers/Dockerfile" ]; then
        docker build -t "verifywise-backend:$tag" ./Servers/
        log "Backend image built successfully"
    else
        warn "No Dockerfile found in Servers directory, skipping build"
    fi
}

# Pull latest images
pull_images() {
    log "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull
    log "Images pulled successfully"
}

# Main deployment function
deploy() {
    local image_tag=${1:-"latest"}
    local skip_build=${2:-false}

    log "Starting blue-green deployment with image tag: $image_tag"

    # Initialize directories
    initialize_directories

    # Get current environment state
    local current_env=$(get_active_environment)
    local new_env=$(get_inactive_environment)

    log "Current active environment: $current_env"
    log "Deploying to environment: $new_env"

    # Build or pull images
    if [ "$skip_build" = "false" ]; then
        build_image "$image_tag"
    fi
    pull_images

    # Start infrastructure if not running
    log "Ensuring infrastructure services are running..."
    docker-compose -f "$COMPOSE_FILE" up -d postgresdb redis bias_and_fairness_backend nginx-lb

    # Deploy to inactive environment
    log "Deploying services to $new_env environment..."
    docker-compose -f "$COMPOSE_FILE" up -d "backend-$new_env"

    # Wait for new environment to be ready
    if ! check_environment_health "$new_env"; then
        error "New environment $new_env failed health checks"

        # Stop the failed environment
        log "Stopping failed $new_env environment..."
        docker-compose -f "$COMPOSE_FILE" stop "backend-$new_env"

        exit 1
    fi

    # Switch traffic
    if switch_traffic "$new_env"; then
        log "Deployment successful!"

        # Monitor for a short period
        log "Monitoring new environment for $ROLLBACK_TIMEOUT seconds..."
        sleep $ROLLBACK_TIMEOUT

        # Final health check
        if check_environment_health "$new_env"; then
            log "Post-deployment health check passed"

            # Stop old environment
            log "Stopping old $current_env environment..."
            docker-compose -f "$COMPOSE_FILE" stop "backend-$current_env"

            log "Blue-green deployment completed successfully"
            log "Active environment is now: $new_env"
        else
            error "Post-deployment health check failed"
            rollback "$current_env"
            exit 1
        fi
    else
        error "Failed to switch traffic"
        rollback "$current_env"
        exit 1
    fi
}

# Status function
status() {
    local active_env=$(get_active_environment)
    echo "=== Blue-Green Deployment Status ==="
    echo "Active environment: $active_env"
    echo ""
    echo "=== Docker Compose Services ==="
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "=== Environment Health ==="

    # Check blue environment
    if docker ps --format "table {{.Names}}" | grep -q "verifywise-backend-blue"; then
        echo -n "Blue environment: "
        if check_environment_health "blue" >/dev/null 2>&1; then
            echo -e "${GREEN}HEALTHY${NC}"
        else
            echo -e "${RED}UNHEALTHY${NC}"
        fi
    else
        echo -e "Blue environment: ${YELLOW}STOPPED${NC}"
    fi

    # Check green environment
    if docker ps --format "table {{.Names}}" | grep -q "verifywise-backend-green"; then
        echo -n "Green environment: "
        if check_environment_health "green" >/dev/null 2>&1; then
            echo -e "${GREEN}HEALTHY${NC}"
        else
            echo -e "${RED}UNHEALTHY${NC}"
        fi
    else
        echo -e "Green environment: ${YELLOW}STOPPED${NC}"
    fi
}

# Manual rollback function
manual_rollback() {
    local current_env=$(get_active_environment)
    local rollback_env=$(get_inactive_environment)

    warn "Manual rollback requested"
    warn "Current active: $current_env, rolling back to: $rollback_env"

    if rollback "$rollback_env"; then
        log "Manual rollback completed"
    else
        error "Manual rollback failed"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up stopped containers..."
    docker-compose -f "$COMPOSE_FILE" rm -f
    docker system prune -f
    log "Cleanup completed"
}

# Show help
show_help() {
    cat << EOF
VerifyWise Blue-Green Deployment Script

Usage: $0 <command> [options]

Commands:
    deploy [tag] [--skip-build]  Deploy new version to inactive environment
    status                       Show current deployment status
    rollback                     Rollback to inactive environment
    cleanup                      Clean up stopped containers
    help                         Show this help message

Options:
    tag                         Docker image tag (default: latest)
    --skip-build               Skip building new image

Examples:
    $0 deploy latest            Deploy latest version
    $0 deploy v1.2.3 --skip-build   Deploy specific version without building
    $0 status                   Check deployment status
    $0 rollback                 Rollback to previous environment

Environment Variables:
    BACKEND_PORT               Backend port (default: 3000)
    COMPOSE_FILE              Docker compose file (default: docker-compose.blue-green.yml)
EOF
}

# Main script logic
main() {
    check_dependencies

    case "${1:-help}" in
        deploy)
            local tag="${2:-latest}"
            local skip_build=false
            if [ "$3" = "--skip-build" ] || [ "$2" = "--skip-build" ]; then
                skip_build=true
                tag="${2:-latest}"
            fi
            deploy "$tag" "$skip_build"
            ;;
        status)
            status
            ;;
        rollback)
            manual_rollback
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"