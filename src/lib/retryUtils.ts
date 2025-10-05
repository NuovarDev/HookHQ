import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";

export type RetryPolicy = "none" | "retry";
export type BackoffStrategy = "linear" | "exponential" | "fixed";

export interface RetryConfig {
  maxAttempts: number;
  retryPolicy: RetryPolicy;
  backoffStrategy: BackoffStrategy;
  baseDelaySeconds: number;
}

export interface GlobalRetryConfig {
  defaultMaxRetries: number;
  defaultRetryPolicy: RetryPolicy;
  defaultBackoffStrategy: BackoffStrategy;
  defaultBaseDelaySeconds: number;
}

/**
 * Calculate exponential backoff delay
 */
export function calculateExponentialBackoff(
  attempts: number,
  baseDelaySeconds: number
): number {
  return Math.min(baseDelaySeconds * Math.pow(2, attempts - 1), 300); // Cap at 5 minutes
}

/**
 * Calculate linear backoff delay
 */
export function calculateLinearBackoff(
  attempts: number,
  baseDelaySeconds: number
): number {
  return Math.min(baseDelaySeconds * attempts, 300); // Cap at 5 minutes
}

/**
 * Calculate fixed backoff delay
 */
export function calculateFixedBackoff(
  attempts: number,
  baseDelaySeconds: number
): number {
  return Math.min(baseDelaySeconds, 300); // Cap at 5 minutes, ignore attempts
}

/**
 * Calculate backoff delay based on strategy
 */
export function calculateBackoffDelay(
  attempts: number,
  baseDelaySeconds: number,
  strategy: BackoffStrategy
): number {
  switch (strategy) {
    case "exponential":
      return calculateExponentialBackoff(attempts, baseDelaySeconds);
    case "linear":
      return calculateLinearBackoff(attempts, baseDelaySeconds);
    case "fixed":
      return calculateFixedBackoff(attempts, baseDelaySeconds);
    default:
      return baseDelaySeconds;
  }
}

/**
 * Get global retry configuration from database with KV caching
 */
export async function getGlobalRetryConfig(): Promise<GlobalRetryConfig> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    
    // Try to get from cache first
    const cacheKey = "global:retry:config";
    const cachedConfig = await env.KV.get(cacheKey);
    
    if (cachedConfig) {
      return JSON.parse(cachedConfig) as GlobalRetryConfig;
    }

    // Cache miss - get from database
    const db = await getDb();
    
    // For now, return default config since we don't have a config table yet
    // TODO: Implement actual database table for global config
    const defaultConfig: GlobalRetryConfig = {
      defaultMaxRetries: 3,
      defaultRetryPolicy: "retry",
      defaultBackoffStrategy: "exponential",
      defaultBaseDelaySeconds: 1,
    };

    // Cache the result
    await env.KV.put(cacheKey, JSON.stringify(defaultConfig), { 
      expirationTtl: 60 * 60 * 24 // 24 hours
    });

    return defaultConfig;
  } catch (error) {
    console.error('Error getting global retry config:', error);
    
    // Return safe defaults on error
    return {
      defaultMaxRetries: 3,
      defaultRetryPolicy: "retry",
      defaultBackoffStrategy: "exponential",
      defaultBaseDelaySeconds: 1,
    };
  }
}

/**
 * Invalidate global retry configuration cache
 */
export async function invalidateGlobalRetryConfigCache(): Promise<void> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    await env.KV.delete("global:retry:config");
  } catch (error) {
    console.error('Error invalidating global retry config cache:', error);
  }
}

/**
 * Create retry configuration for an endpoint
 */
export async function createRetryConfig(
  endpointRetryPolicy?: string,
  endpointMaxRetries?: number,
  endpointBackoffStrategy?: string,
  endpointBaseDelaySeconds?: number
): Promise<RetryConfig> {
  const globalConfig = await getGlobalRetryConfig();

  return {
    maxAttempts: endpointMaxRetries ?? globalConfig.defaultMaxRetries,
    retryPolicy: (endpointRetryPolicy as RetryPolicy) ?? globalConfig.defaultRetryPolicy,
    backoffStrategy: (endpointBackoffStrategy as BackoffStrategy) ?? globalConfig.defaultBackoffStrategy,
    baseDelaySeconds: endpointBaseDelaySeconds ?? globalConfig.defaultBaseDelaySeconds,
  };
}

/**
 * Determine if a message should be retried based on retry policy and attempts
 */
export function shouldRetry(
  success: boolean,
  attempts: number,
  retryConfig: RetryConfig
): boolean {
  // If successful, don't retry
  if (success) {
    return false;
  }

  // If retry policy is "none", don't retry
  if (retryConfig.retryPolicy === "none") {
    return false;
  }

  // If we've exceeded max attempts, don't retry
  if (attempts >= retryConfig.maxAttempts) {
    return false;
  }

  // Otherwise, retry
  return true;
}

/**
 * Calculate retry delay for a message
 */
export function calculateRetryDelay(
  attempts: number,
  retryConfig: RetryConfig
): number {
  return calculateBackoffDelay(
    attempts,
    retryConfig.baseDelaySeconds,
    retryConfig.backoffStrategy
  );
}
