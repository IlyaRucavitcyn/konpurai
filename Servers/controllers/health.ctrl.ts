import { Request, Response } from "express";
import { healthService } from "../services/health.service";
import { circuitBreaker } from "../services/circuitBreaker.service";

/**
 * Health Controller - Enterprise Standard
 * Single /health endpoint with configurable detail levels
 */

/**
 * GET /health
 * Main health endpoint with configurable detail levels
 * Query parameters:
 * - level=basic (default): Basic health status
 * - level=detailed: Comprehensive system status including components
 * - level=circuit-breakers: Include circuit breaker status
 * - cache=false: Skip cache (default: true)
 */
export const getHealth = async (req: Request, res: Response) => {
  try {
    const level = req.query.level as string || "basic";
    const useCache = req.query.cache !== "false";
    const requestId = `health_${Date.now()}`;

    switch (level) {
      case "detailed":
        return await getDetailedHealth(req, res, useCache, requestId);
      case "circuit-breakers":
        return await getHealthWithCircuitBreakers(req, res, useCache, requestId);
      default:
        return await getBasicHealth(req, res, useCache, requestId);
    }
  } catch (error: any) {
    res.status(503).json({
      status: "down",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * Basic health status - lightweight check
 */
const getBasicHealth = async (req: Request, res: Response, useCache: boolean, requestId: string) => {
  const result = await healthService.getHealthSummary(useCache);

  const basicHealth = {
    status: result.overall,
    timestamp: result.timestamp,
    uptime: result.uptime,
    version: result.version,
    environment: result.environment,
    responseTime: result.metadata.responseTime,
  };

  const statusCode = result.overall === "healthy" ? 200 :
                    result.overall === "degraded" ? 200 : 503;

  res.status(statusCode).json(basicHealth);
};

/**
 * Detailed health status - includes component breakdown
 */
const getDetailedHealth = async (req: Request, res: Response, useCache: boolean, requestId: string) => {
  const result = await healthService.getHealthSummary(useCache);

  const statusCode = result.overall === "healthy" ? 200 :
                    result.overall === "degraded" ? 200 : 503;

  res.status(statusCode).json(result);
};

/**
 * Health status with circuit breaker information
 */
const getHealthWithCircuitBreakers = async (req: Request, res: Response, useCache: boolean, requestId: string) => {
  const healthResult = await healthService.getHealthSummary(useCache);
  const circuitBreakerStatus = circuitBreaker.getCircuitBreakerStatus();
  const overallCircuitHealth = circuitBreaker.getOverallHealth();

  const combinedResult = {
    ...healthResult,
    circuitBreakers: {
      overall: overallCircuitHealth,
      services: circuitBreakerStatus,
    },
  };

  // Determine status based on both health and circuit breakers
  const isCircuitBreakerHealthy = overallCircuitHealth.healthy;
  const overallStatus = healthResult.overall === "healthy" && isCircuitBreakerHealthy ? "healthy" :
                       healthResult.overall === "down" || overallCircuitHealth.down.length > 0 ? "down" : "degraded";

  combinedResult.overall = overallStatus as "healthy" | "degraded" | "down";

  const statusCode = overallStatus === "healthy" ? 200 :
                    overallStatus === "degraded" ? 200 : 503;

  res.status(statusCode).json(combinedResult);
};

/**
 * GET /health/circuit-breakers
 * Circuit breaker status for all services
 * Used for monitoring resilience patterns
 */
export const getCircuitBreakerStatus = async (req: Request, res: Response) => {
  try {
    const status = circuitBreaker.getCircuitBreakerStatus();
    const overallHealth = circuitBreaker.getOverallHealth();

    const response = {
      timestamp: new Date().toISOString(),
      overall: overallHealth,
      services: status,
    };

    const statusCode = overallHealth.healthy ? 200 :
                      overallHealth.down.length > 0 ? 503 : 200;

    res.status(statusCode).json(response);
  } catch (error: any) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * GET /health/circuit-breakers/:serviceName
 * Specific circuit breaker status
 * Used for debugging individual service circuit breakers
 */
export const getServiceCircuitBreakerStatus = async (req: Request, res: Response) => {
  try {
    const serviceName = req.params.serviceName;
    const status = circuitBreaker.getServiceStatus(serviceName);

    if (!status) {
      return res.status(404).json({
        error: `Circuit breaker not found for service: ${serviceName}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json(status);
  } catch (error: any) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * POST /health/circuit-breakers/:serviceName/reset
 * Reset a specific circuit breaker
 * Used for manual intervention
 */
export const resetCircuitBreaker = async (req: Request, res: Response) => {
  try {
    const serviceName = req.params.serviceName;
    const success = circuitBreaker.resetCircuitBreaker(serviceName);

    if (!success) {
      return res.status(404).json({
        error: `Circuit breaker not found for service: ${serviceName}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      message: `Circuit breaker reset successfully for service: ${serviceName}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};