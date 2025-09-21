import { Router } from "express";
import {
  getHealth,
  getCircuitBreakerStatus,
  getServiceCircuitBreakerStatus,
  resetCircuitBreaker,
} from "../controllers/health.ctrl";

const router = Router();

/**
 * Health Check Routes - Enterprise Standard
 * Single /health endpoint with configurable detail levels
 */

// Main health endpoint - supports query parameters for detail level
// ?level=basic (default) - basic health status
// ?level=detailed - comprehensive system status including components
// ?level=circuit-breakers - include circuit breaker status
router.get("/", getHealth);

// Circuit breaker monitoring endpoints (admin only)
// Circuit breaker status for all services
router.get("/circuit-breakers", getCircuitBreakerStatus);

// Specific circuit breaker status
router.get("/circuit-breakers/:serviceName", getServiceCircuitBreakerStatus);

// Reset a specific circuit breaker (manual intervention)
router.post("/circuit-breakers/:serviceName/reset", resetCircuitBreaker);

export default router;