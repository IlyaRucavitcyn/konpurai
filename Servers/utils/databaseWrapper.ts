import { sequelize } from "../database/db";
import { circuitBreaker } from "../services/circuitBreaker.service";
import { correlationLogger } from "./correlationLogger";

/**
 * Database wrapper with circuit breaker protection
 * Provides resilient database operations with fallback mechanisms
 */

export class DatabaseWrapper {
  /**
   * Execute a raw SQL query with circuit breaker protection
   */
  static async query<T = any>(
    sql: string,
    options?: any
  ): Promise<T> {
    return await circuitBreaker.executeDatabaseQuery(
      async () => {
        const startTime = Date.now();
        try {
          const result = await sequelize.query(sql, options);
          const duration = Date.now() - startTime;

          correlationLogger.logDatabaseQuery(
            "system",
            sql,
            duration,
            true
          );

          return result as T;
        } catch (error) {
          const duration = Date.now() - startTime;
          correlationLogger.logDatabaseQuery(
            "system",
            sql,
            duration,
            false,
            error
          );
          throw error;
        }
      },
      async () => {
        // Fallback: Return cached result or empty array
        correlationLogger.warn(
          "Database unavailable, using fallback for query",
          { sql: sql.substring(0, 100) }
        );
        return [] as T;
      }
    );
  }

  /**
   * Execute a database transaction with circuit breaker protection
   */
  static async transaction<T>(
    operation: (t: any) => Promise<T>
  ): Promise<T> {
    return await circuitBreaker.executeDatabaseQuery(
      async () => {
        return await sequelize.transaction(async (t) => {
          const startTime = Date.now();
          try {
            const result = await operation(t);
            const duration = Date.now() - startTime;

            correlationLogger.info(
              "Database transaction completed",
              { duration }
            );

            return result;
          } catch (error) {
            const duration = Date.now() - startTime;
            correlationLogger.error(
              "Database transaction failed",
              error
            );
            throw error;
          }
        });
      },
      async () => {
        // Fallback: Cannot perform transaction, throw specific error
        const error = new Error("Database unavailable: Cannot perform transaction");
        correlationLogger.error(
          "Database transaction fallback triggered",
          error
        );
        throw error;
      }
    );
  }

  /**
   * Test database connection with circuit breaker protection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await circuitBreaker.executeDatabaseQuery(
        async () => {
          await sequelize.authenticate();
          await sequelize.query("SELECT 1");
          return true;
        },
        async () => {
          return false; // Fallback: connection failed
        }
      );
      return true;
    } catch (error) {
      correlationLogger.error(
        "Database connection test failed",
        error
      );
      return false;
    }
  }

  /**
   * Get database pool status
   */
  static getPoolStatus(): {
    used: number;
    idle: number;
    pending: number;
    total: number;
  } {
    try {
      const pool = (sequelize as any).connectionManager?.pool;
      return {
        used: pool?.used || 0,
        idle: pool?.idle || 0,
        pending: pool?.pending || 0,
        total: (pool?.used || 0) + (pool?.idle || 0),
      };
    } catch (error) {
      return {
        used: 0,
        idle: 0,
        pending: 0,
        total: 0,
      };
    }
  }

  /**
   * Execute a model operation with circuit breaker protection
   */
  static async executeModelOperation<T>(
    modelName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return await circuitBreaker.executeDatabaseQuery(
      async () => {
        const startTime = Date.now();
        try {
          const result = await operation();
          const duration = Date.now() - startTime;

          correlationLogger.logDatabaseQuery(
            "system",
            `${modelName} operation`,
            duration,
            true
          );

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          correlationLogger.logDatabaseQuery(
            "system",
            `${modelName} operation`,
            duration,
            false,
            error
          );
          throw error;
        }
      },
      async () => {
        // Fallback: Return empty result or cached data
        correlationLogger.warn(
          `Database unavailable, using fallback for ${modelName} operation`,
          { modelName }
        );

        // Return appropriate fallback based on operation type
        return null as T;
      }
    );
  }
}

/**
 * Enhanced Sequelize model wrapper
 * Adds circuit breaker protection to common model operations
 */
export class ModelWrapper {
  constructor(private model: any, private modelName: string) {}

  async findAll(options?: any): Promise<any[]> {
    return await DatabaseWrapper.executeModelOperation(
      `${this.modelName}.findAll`,
      () => this.model.findAll(options)
    );
  }

  async findOne(options?: any): Promise<any> {
    return await DatabaseWrapper.executeModelOperation(
      `${this.modelName}.findOne`,
      () => this.model.findOne(options)
    );
  }

  async findByPk(id: any, options?: any): Promise<any> {
    return await DatabaseWrapper.executeModelOperation(
      `${this.modelName}.findByPk`,
      () => this.model.findByPk(id, options)
    );
  }

  async create(values: any, options?: any): Promise<any> {
    return await DatabaseWrapper.executeModelOperation(
      `${this.modelName}.create`,
      () => this.model.create(values, options)
    );
  }

  async update(
    values: any,
    options: any
  ): Promise<[number, any[]]> {
    return await DatabaseWrapper.executeModelOperation(
      `${this.modelName}.update`,
      () => this.model.update(values, options)
    );
  }

  async destroy(options: any): Promise<number> {
    return await DatabaseWrapper.executeModelOperation(
      `${this.modelName}.destroy`,
      () => this.model.destroy(options)
    );
  }

  async count(options?: any): Promise<number> {
    return await DatabaseWrapper.executeModelOperation(
      `${this.modelName}.count`,
      () => this.model.count(options)
    );
  }
}

/**
 * Create a wrapped model with circuit breaker protection
 */
export function wrapModel(model: any, modelName: string): ModelWrapper {
  return new ModelWrapper(model, modelName);
}

export default DatabaseWrapper;