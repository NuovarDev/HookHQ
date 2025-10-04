import { GET, POST } from '@/app/api/event-types/route';
import { PATCH, DELETE } from '@/app/api/event-types/[id]/route';
import { createMockRequest, createMockRequestWithApiKey, TestDataFactory, assertApiResponse, assertApiError } from '../utils/testUtils';
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { authenticateApiRequest } from '@/lib/apiHelpers';
import { NextResponse } from 'next/server';

// Mock the authentication and database modules
vi.mock('@/lib/apiHelpers', () => ({
  authenticateApiRequest: vi.fn()
}));
vi.mock('@/db');
vi.mock('@/auth');
vi.mock('better-auth');
vi.mock('better-auth-cloudflare');
vi.mock('@noble/ciphers');

describe('Event Types API', () => {
  let testEnvironment: any;
  let testApiKey: any;

  beforeAll(async () => {
    // Create test environment and API key
    testEnvironment = await TestDataFactory.createTestEnvironment();
    testApiKey = await TestDataFactory.createTestApiKey('test-user-id', testEnvironment.id);
  });

  afterAll(async () => {
    await TestDataFactory.cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/event-types', () => {
    it('should return list of event types for authenticated user', async () => {
      // Mock successful authentication
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: null
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key);
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json() as { eventTypes: any[] };
      expect(data).toHaveProperty('eventTypes');
      expect(Array.isArray(data.eventTypes)).toBe(true);
    });

    it('should filter event types by enabled status', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: null
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'GET', undefined, {}, 'http://localhost:3000/api/event-types?enabled=true');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const mockAuthResult = {
        success: false as const,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/event-types', () => {
    it('should create a new event type with valid data', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          name: 'user.created',
          description: 'User creation event',
          schema: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              email: { type: 'string', format: 'email' }
            },
            required: ['userId']
          },
          enabled: true
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json() as { id: string, name: string, environmentId: string, schema: any };
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name', 'user.created');
      expect(data).toHaveProperty('environmentId', testEnvironment.id);
      expect(data).toHaveProperty('schema');
    });

    it('should reject event type creation with invalid schema', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          name: 'user.created',
          description: 'User creation event',
          schema: {
            type: 'invalid-type',
            properties: {
              userId: { type: 'string' }
            }
          },
          enabled: true
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Invalid schema');
      expect(data).toHaveProperty('details');
    });

    it('should reject event type creation without required name', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          description: 'User creation event',
          enabled: true
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json() as { error: string };
      expect(data).toHaveProperty('error', 'Name is required');
    });

    it('should create event type without schema', async () => {
      const mockAuthResult = {
        success: true as const,
        environmentId: testEnvironment.id,
        body: {
          name: 'user.created',
          description: 'User creation event',
          enabled: true
        }
      };
      
      vi.mocked(authenticateApiRequest).mockResolvedValue(mockAuthResult);

      const request = createMockRequestWithApiKey(testApiKey.key, 'POST', mockAuthResult.body);
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json() as { id: string, name: string, schema: any };
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name', 'user.created');
      expect(data.schema).toBeNull();
    });
  });

  describe('PATCH /api/event-types/[id]', () => {
    let testEventType: any;

    beforeAll(async () => {
      testEventType = await TestDataFactory.createTestEventType(testEnvironment.id, {
        name: 'test.event',
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          },
          required: ['userId']
        }
      });
    });

    it('should update event type with valid data', async () => {
      const updateData = {
        name: 'updated.event',
        description: 'Updated description',
        enabled: false
      };

      const request = createMockRequest('PATCH', updateData);
      const response = await PATCH(request, { params: { id: testEventType.id } });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('message', 'Event type updated successfully');
      expect(data).toHaveProperty('eventType');
    });

    it('should update event type schema with valid schema', async () => {
      const updateData = {
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string', format: 'email' }
          },
          required: ['userId', 'email']
        }
      };

      const request = createMockRequest('PATCH', updateData);
      const response = await PATCH(request, { params: { id: testEventType.id } });
      
      expect(response.status).toBe(200);
      const data = await response.json() as { eventType: { schema: any } };
      expect(data).toHaveProperty('eventType');
      expect(data.eventType.schema).toEqual(updateData.schema);
    });

    it('should reject update with invalid schema', async () => {
      const updateData = {
        schema: {
          type: 'invalid-type',
          properties: {
            userId: { type: 'string' }
          }
        }
      };

      const request = createMockRequest('PATCH', updateData);
      const response = await PATCH(request, { params: { id: testEventType.id } });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Invalid schema');
      expect(data).toHaveProperty('details');
    });

    it('should return 404 for non-existent event type', async () => {
      const updateData = { name: 'updated.event' };
      const request = createMockRequest('PATCH', updateData);
      const response = await PATCH(request, { params: { id: 'non-existent-id' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Event type not found');
    });
  });

  describe('DELETE /api/event-types/[id]', () => {
    let testEventType: any;

    beforeAll(async () => {
      testEventType = await TestDataFactory.createTestEventType(testEnvironment.id, {
        name: 'delete.test.event'
      });
    });

    it('should delete existing event type', async () => {
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: testEventType.id } });
      
      expect(response.status).toBe(200);
      const data = await response.json() as { message: string, deletedEventType: { id: string } };
      expect(data).toHaveProperty('message', 'Event type deleted successfully');
      expect(data).toHaveProperty('deletedEventType');
      expect(data.deletedEventType.id).toBe(testEventType.id);
    });

    it('should return 404 for non-existent event type', async () => {
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: 'non-existent-id' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Event type not found');
    });

    it('should return 400 for missing event type ID', async () => {
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: '' } });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Event type ID is required');
    });
  });
});
