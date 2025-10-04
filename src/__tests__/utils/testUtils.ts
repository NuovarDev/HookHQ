import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { vi, expect } from 'vitest';

export interface TestEnvironment {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface TestEventType {
  id: string;
  environmentId: string;
  name: string;
  description?: string;
  schema?: any;
  enabled?: boolean;
}

export interface TestEndpoint {
  id: string;
  environmentId: string;
  name: string;
  url: string;
  description?: string;
  isActive?: boolean;
}

export interface TestApiKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  metadata?: string;
  enabled?: boolean;
}

/**
 * Creates a mock NextRequest for testing API routes
 */
export function createMockRequest(
  method: string = 'GET',
  body?: any,
  headers: Record<string, string> = {},
  url: string = 'http://localhost:3000/api/test'
): NextRequest {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(url, requestInit);
}

/**
 * Creates a mock NextRequest with API key authentication
 */
export function createMockRequestWithApiKey(
  apiKey: string,
  method: string = 'GET',
  body?: any,
  additionalHeaders: Record<string, string> = {},
  url: string = 'http://localhost:3000/api/test'
): NextRequest {
  return createMockRequest(method, body, {
    'Authorization': `Bearer ${apiKey}`,
    ...additionalHeaders,
  }, url);
}

/**
 * Creates a mock NextRequest with session authentication
 */
export function createMockRequestWithSession(
  method: string = 'GET',
  body?: any,
  additionalHeaders: Record<string, string> = {},
  url: string = 'http://localhost:3000/api/test'
): NextRequest {
  return createMockRequest(method, body, {
    'Cookie': 'better-auth.session_token=test-session-token',
    ...additionalHeaders,
  }, url);
}

/**
 * Creates test data in the database
 */
export class TestDataFactory {
  private static async getDb() {
    // Mock database for testing
    return {
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
      select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) }),
      delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) })
    };
  }

  static async createTestEnvironment(data?: Partial<TestEnvironment>): Promise<TestEnvironment> {
    const environment = {
      id: data?.id || `test_${Date.now()}`,
      name: data?.name || 'Test Environment',
      description: data?.description || 'Test environment for unit tests',
      isDefault: data?.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real test, you would insert into the database
    // For now, we'll just return the environment object
    return environment;
  }

  static async createTestEventType(
    environmentId: string,
    data?: Partial<TestEventType>
  ): Promise<TestEventType> {
    const eventType = {
      id: data?.id || `${environmentId}_test_event_${Date.now()}`,
      environmentId,
      name: data?.name || 'test.event',
      description: data?.description || 'Test event type',
      schema: data?.schema ? JSON.stringify(data.schema) : null,
      enabled: data?.enabled !== undefined ? data.enabled : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real test, you would insert into the database
    // For now, we'll just return the event type object
    return {
      ...eventType,
      schema: data?.schema,
    };
  }

  static async createTestEndpoint(
    environmentId: string,
    data?: Partial<TestEndpoint>
  ): Promise<TestEndpoint> {
    const endpoint = {
      id: data?.id || `ep_${environmentId}_test_endpoint_${Date.now()}`,
      environmentId,
      name: data?.name || 'Test Endpoint',
      url: data?.url || 'https://example.com/webhook',
      description: data?.description || 'Test endpoint',
      isActive: data?.isActive !== undefined ? data.isActive : true,
      retryPolicy: 'exponential',
      maxRetries: 3,
      timeoutMs: 30000,
      headers: null,
      proxyGroupId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real test, you would insert into the database
    return endpoint;
  }

  static async createTestApiKey(
    userId: string,
    environmentId: string,
    data?: Partial<TestApiKey>
  ): Promise<TestApiKey> {
    const apiKey = {
      id: data?.id || `test_api_key_${Date.now()}`,
      name: data?.name || 'Test API Key',
      key: data?.key || `wh_test_key_${Date.now()}`,
      userId,
      metadata: data?.metadata || JSON.stringify({ environment: environmentId }),
      enabled: data?.enabled !== undefined ? data.enabled : true,
      refillInterval: null,
      refillAmount: null,
      lastRefillAt: null,
      rateLimitEnabled: true,
      rateLimitTimeWindow: 86400000,
      rateLimitMax: 10,
      requestCount: 0,
      remaining: null,
      lastRequest: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: null,
    };

    // In a real test, you would insert into the database
    return apiKey;
  }

  /**
   * Cleans up test data from the database
   */
  static async cleanup(): Promise<void> {
    // In a real test environment, you would clean up the database
    // For now, this is a no-op
    return Promise.resolve();
  }
}

/**
 * Asserts that a response has the expected status and structure
 */
export function assertApiResponse(
  response: Response,
  expectedStatus: number,
  expectedKeys?: string[]
): void {
  expect(response.status).toBe(expectedStatus);
  
  if (expectedKeys) {
    return response.json().then((data) => {
      expectedKeys.forEach(key => {
        expect(data).toHaveProperty(key);
      });
    });
  }
}

/**
 * Asserts that a response contains an error message
 */
export function assertApiError(
  response: Response,
  expectedStatus: number,
  expectedError?: string
): Promise<void> {
  expect(response.status).toBe(expectedStatus);
  
  return response.json().then((data) => {
    expect(data).toHaveProperty('error');
    if (expectedError) {
      expect(data.error).toBe(expectedError);
    }
  });
}

/**
 * Waits for a specified amount of time (useful for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
