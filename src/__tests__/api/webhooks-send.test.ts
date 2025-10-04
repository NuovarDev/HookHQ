import { POST } from '@/app/api/send/route';
import { createMockRequestWithApiKey, TestDataFactory, assertApiResponse, assertApiError } from '../utils/testUtils';
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { authenticateApiRequest } from '@/lib/apiHelpers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';

// Mock the authentication and database modules
vi.mock('@/lib/apiHelpers', () => ({
  authenticateApiRequest: vi.fn()
}));
vi.mock('@/db', () => ({
  getDb: vi.fn()
}));
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn()
}));
vi.mock('better-auth');
vi.mock('better-auth-cloudflare');
vi.mock('@noble/ciphers');

describe('Webhook Send API', () => {
  let testEnvironment: any;
  let testApiKey: any;
  let testEndpoint: any;
  let testEventType: any;

  beforeAll(async () => {
    // Create test data
    testEnvironment = await TestDataFactory.createTestEnvironment();
    testApiKey = await TestDataFactory.createTestApiKey('test-user-id', testEnvironment.id);
    testEndpoint = await TestDataFactory.createTestEndpoint(testEnvironment.id, {
      name: 'Test Webhook Endpoint',
      url: 'https://example.com/webhook'
    });
    testEventType = await TestDataFactory.createTestEventType(testEnvironment.id, {
      name: 'user.created',
      schema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          email: { type: 'string', format: 'email' }
        },
        required: ['userId']
      }
    });
  });

  afterAll(async () => {
    await TestDataFactory.cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Cloudflare context
    vi.mocked(getCloudflareContext).mockResolvedValue({
      // @ts-ignore-next-line
      env: {
        WEBHOOKS: {
          send: vi.fn().mockResolvedValue({}),
          sendBatch: vi.fn().mockResolvedValue({})
        }
      }
    });
    
    // Mock database
    vi.mocked(getDb).mockResolvedValue({
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
      select: vi.fn().mockReturnValue({ 
        from: vi.fn().mockReturnValue({ 
          where: vi.fn().mockReturnValue({ 
            limit: vi.fn().mockResolvedValue([]) 
          }) 
        }) 
      }),
      delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) })
    } as any);
  });

  describe('POST /api/webhooks/send', () => {
    it('should send webhook to endpoint successfully', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          destinations: [testEndpoint.id],
          payload: {
            userId: 'user123',
            email: 'test@example.com'
          }
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json() as { id: string, payload: any, channels: string[] };
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('payload');
      expect(data).toHaveProperty('channels');
      expect(data.channels).toContain(testEndpoint.id);
    });

    it('should validate payload against event type schema', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          destinations: [testEndpoint.id],
          eventType: 'user.created',
          payload: {
            userId: 'user123',
            email: 'test@example.com'
          }
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('eventType', 'user.created');
    });

    it('should reject payload that violates event type schema', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          destinations: [testEndpoint.id],
          eventType: 'user.created',
          payload: {
            userId: 'user123',
            email: 'invalid-email-format' // Invalid email format
          }
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      // Mock database to return event type schema for validation
      vi.mocked(getDb).mockResolvedValue({
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
        select: vi.fn().mockReturnValue({ 
          from: vi.fn().mockReturnValue({ 
            where: vi.fn().mockReturnValue({ 
              limit: vi.fn().mockResolvedValue([{
                schema: JSON.stringify({
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    email: { type: 'string', format: 'email' }
                  },
                  required: ['userId']
                })
              }]) 
            }) 
          }) 
        }),
        delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) })
      } as any);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Payload validation failed');
      expect(data).toHaveProperty('details');
    });

    it('should reject payload missing required fields', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          destinations: [testEndpoint.id],
          eventType: 'user.created',
          payload: {
            email: 'test@example.com'
            // Missing required userId
          }
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      // Mock database to return event type schema for validation
      vi.mocked(getDb).mockResolvedValue({
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
        select: vi.fn().mockReturnValue({ 
          from: vi.fn().mockReturnValue({ 
            where: vi.fn().mockReturnValue({ 
              limit: vi.fn().mockResolvedValue([{
                schema: JSON.stringify({
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    email: { type: 'string', format: 'email' }
                  },
                  required: ['userId']
                })
              }]) 
            }) 
          }) 
        }),
        delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) })
      } as any);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json() as { error: string, details: string[] };
      expect(data).toHaveProperty('error', 'Payload validation failed');
      expect(data.details.some((detail: string) => detail.includes('userId'))).toBe(true);
    });

    it('should skip validation when no event type is provided', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          destinations: [testEndpoint.id],
          payload: {
            anyData: 'any value',
            invalidStructure: true
          }
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('payload');
    });

    it('should reject request without destinations', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          payload: {
            userId: 'user123'
          }
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Destinations are required');
    });

    it('should reject request without payload', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          destinations: [testEndpoint.id]
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Payload is required');
    });

    it('should require eventType when endpoint groups are provided', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          destinations: ['grp_test_group'],
          payload: {
            userId: 'user123'
          }
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'eventType must be specified when endpointGroups are provided');
    });

    it('should reject endpoints from different environment', async () => {
      const otherEnvironment = await TestDataFactory.createTestEnvironment({ name: 'Other Environment' });
      const otherEndpoint = await TestDataFactory.createTestEndpoint(otherEnvironment.id, {
        name: 'Other Endpoint',
        url: 'https://other.com/webhook'
      });

      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          destinations: [otherEndpoint.id], // Endpoint from different environment
          payload: {
            userId: 'user123'
          }
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Forbidden');
      expect(data).toHaveProperty('message', 'API key does not have permissions on all endpoints');
    });

    it('should handle idempotency key', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          destinations: [testEndpoint.id],
          payload: {
            userId: 'user123'
          }
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(
        testApiKey.key, 
        'POST', 
        mockAuthResult.body,
        { 'Idempotency-Key': 'test-idempotency-key' }
      );
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const mockAuthResult = {
        success: false as const,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey('invalid-key', 'POST', {
        destinations: [testEndpoint.id],
        payload: { userId: 'user123' }
      });
      const response = await POST(request);
      
      expect(response.status).toBe(401);
    });
  });
});
