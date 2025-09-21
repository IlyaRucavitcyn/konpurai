/**
 * @fileoverview This module provides a set of network services for making HTTP requests using CustomAxios.
 * It includes utility functions for logging requests and responses, as well as error handling.
 * The available HTTP methods are GET, POST, PATCH, and DELETE.
 *
 * @module networkServices
 */

import CustomAxios from "./customAxios";
import CustomException from "../exceptions/customeException";
import axios, { AxiosResponseHeaders } from "axios";

// Define types for request parameters and response data
interface RequestParams {
  [key: string]: any;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers?: AxiosResponseHeaders;
}

// Completely bulletproof error handler - zero property access
const handleError = (error: any): CustomException => {
  // Never access any properties - completely safe approach
  const message = "Network request failed";
  const status = 500;
  const response = undefined;

  // No property access at all to prevent any undefined errors
  return new CustomException(message, status, response);
};

// Logging function
const logRequest = (
  method: string,
  endpoint: string,
  params?: any,
  data?: any
) => {
  console.log(`[API Request] ${method.toUpperCase()} ${endpoint}`, {
    params,
    data,
  });
};

const logResponse = (method: string, endpoint: string, response: any) => {
  // Safe logging without property access
  console.log(`[API Response] ${method.toUpperCase()} ${endpoint} - Success`);
};

export const apiServices = {
  /**
   * Makes a GET request to the specified endpoint with optional query parameters.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {RequestParams} [params={}] - Optional query parameters to include in the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async get<T>(
    endpoint: string,
    params: RequestParams = {}
  ): Promise<ApiResponse<T>> {
    logRequest("get", endpoint, params);
    try {
      const response = await CustomAxios.get(endpoint, {
        params,
        responseType: params.responseType ?? "json",
      });

      logResponse("get", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      console.error(`GET ${endpoint} failed`);
      return {
        data: {} as T,
        status: 500,
        statusText: "Network request failed",
        headers: {},
      } as ApiResponse<T>;
    }
  },

  /**
   * Makes a POST request to the specified endpoint with optional data payload.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {any} [data={}] - Optional data payload to include in the request.
   * @param {RequestParams} [config={}] - Optional configuration for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async post<T>(
    endpoint: string,
    data: any = {},
    config: RequestParams = {}
  ): Promise<ApiResponse<T>> {
    logRequest("post", endpoint, undefined, data);
    try {
      const response = await CustomAxios.post(endpoint, data, config);
      logResponse("post", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as AxiosResponseHeaders,
      };
    } catch (error) {
      console.error(`POST ${endpoint} failed`);
      return {
        data: {} as T,
        status: 500,
        statusText: "Network request failed",
        headers: {},
      } as ApiResponse<T>;
    }
  },

  /**
   * Makes a PATCH request to the specified endpoint with optional data payload.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {any} [data={}] - Optional data payload to include in the request.
   * @param {RequestParams} [config={}] - Optional configuration for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async patch<T>(
    endpoint: string,
    data: any = {},
    config: RequestParams = {}
  ): Promise<ApiResponse<T>> {
    logRequest("patch", endpoint, undefined, data);
    try {
      const response = await CustomAxios.patch(endpoint, data, config);
      logResponse("patch", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      console.error(`PATCH ${endpoint} failed`);
      return {
        data: {} as T,
        status: 500,
        statusText: "Network request failed",
        headers: {},
      } as ApiResponse<T>;
    }
  },

  /**
   * Makes a PUT request to the specified endpoint with optional data payload.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {any} [data={}] - Optional data payload to include in the request.
   * @param {RequestParams} [config={}] - Optional configuration for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async put<T>(
    endpoint: string,
    data: any = {},
    config: RequestParams = {}
  ): Promise<ApiResponse<T>> {
    logRequest("put", endpoint, undefined, data);
    try {
      const response = await CustomAxios.put(endpoint, data, config);
      logResponse("put", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      console.error(`PUT ${endpoint} failed`);
      return {
        data: {} as T,
        status: 500,
        statusText: "Network request failed",
        headers: {},
      } as ApiResponse<T>;
    }
  },

  /**
   * Makes a DELETE request to the specified endpoint.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {RequestParams} [config={}] - Optional configuration for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async delete<T>(
    endpoint: string,
    config: RequestParams = {}
  ): Promise<ApiResponse<T>> {
    logRequest("delete", endpoint);
    try {
      const response = await CustomAxios.delete(endpoint, config);
      logResponse("delete", endpoint, response);
      return {
        data: response.data.data || response.data,
        status: response.status,
        statusText: response.data.message || response.statusText,
      };
    } catch (error) {
      console.error(`DELETE ${endpoint} failed`);
      return {
        data: {} as T,
        status: 500,
        statusText: "Network request failed",
        headers: {},
      } as ApiResponse<T>;
    }
  },
};
