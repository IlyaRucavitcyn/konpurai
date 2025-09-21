# Blue-Green Deployment Scripts

This directory contains scripts for managing blue-green deployments of VerifyWise.

## Quick Start

```bash
# Check current deployment status
./scripts/blue-green-deploy.sh status

# Deploy latest version
./scripts/blue-green-deploy.sh deploy

# Deploy specific version
./scripts/blue-green-deploy.sh deploy v1.2.3

# Rollback to previous environment
./scripts/blue-green-deploy.sh rollback
```

## Files

- `blue-green-deploy.sh` - Main deployment script with zero-downtime switching
- `README.md` - This documentation

## Environment Variables

Set these in your `.env` file or environment:

```bash
BACKEND_PORT=3000           # Port for the load balancer
DB_USER=your_db_user       # Database user
DB_PASSWORD=your_password  # Database password
DB_NAME=verifywise         # Database name
JWT_SECRET=your_jwt_secret # JWT secret key
NODE_ENV=production        # Environment (production/development)
```

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured with required variables
- Images built or available in registry

## Deployment Process

1. **Health Check**: Validates current environment health
2. **Deploy**: Starts new version in inactive environment
3. **Validate**: Performs comprehensive health checks
4. **Switch**: Routes traffic to new environment
5. **Monitor**: Watches for issues and auto-rollback if needed
6. **Cleanup**: Stops old environment after successful deployment

## Troubleshooting

### Deployment Fails

```bash
# Check logs
docker-compose -f docker-compose.blue-green.yml logs backend-blue
docker-compose -f docker-compose.blue-green.yml logs backend-green

# Check nginx logs
docker logs nginx-lb

# Manual rollback
./scripts/blue-green-deploy.sh rollback
```

### Health Checks Failing

```bash
# Test health endpoint directly
curl http://localhost:3000/health

# Check circuit breaker status
curl http://localhost:3000/health?level=circuit-breakers

# Check container health
docker inspect verifywise-backend-blue --format='{{.State.Health.Status}}'
```

### Network Issues

```bash
# Check nginx configuration
docker exec nginx-lb nginx -t

# Reload nginx
docker exec nginx-lb nginx -s reload

# Check active environment
cat nginx/state/active_environment.conf
```

## Manual Operations

### Force Environment Switch

```bash
# Manually edit active environment
vim nginx/state/active_environment.conf

# Change to desired environment:
map $http_host $backend_pool {
    default backend_green;  # or backend_blue
}

# Reload nginx
docker exec nginx-lb nginx -s reload
```

### Emergency Stop

```bash
# Stop specific environment
docker-compose -f docker-compose.blue-green.yml stop backend-blue

# Stop all services
docker-compose -f docker-compose.blue-green.yml down
```

## Monitoring

The deployment script provides comprehensive logging and monitoring:

- Health check results for each environment
- Circuit breaker status validation
- Automatic rollback on failure
- Traffic switching verification
- Container health monitoring

## Security Notes

- Circuit breaker endpoints are exposed for monitoring
- Consider adding IP restrictions for admin endpoints
- All traffic goes through nginx with security headers
- Rate limiting is enabled for API endpoints