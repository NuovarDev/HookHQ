import { POST } from '@/app/api/endpoint-groups/[id]/token/route';
import { createMockRequest } from '../utils/testUtils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getDb } from '@/db';
import { authenticateApiRequest } from '@/lib/apiHelpers';
import jwt from 'jsonwebtoken';

// Mock the database and authentication modules
vi.mock('@/db');
vi.mock('@/lib/apiHelpers', () => ({
  authenticateApiRequest: vi.fn()
}));
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-jwt-token')
  }
}));
vi.mock('better-auth');
vi.mock('better-auth-cloudflare');
vi.mock('@noble/ciphers');

describe('Portal Token API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate portal token with required fields', async () => {
    // Mock authentication
    vi.mocked(authenticateApiRequest).mockResolvedValue({
      success: true as const,
      environmentId: 'env_test_456',
      body: null
    });

    // Mock database response
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'grp_test_123',
                name: 'Test Endpoint Group',
                environmentId: 'env_test_456'
              }
            ])
          })
        })
      })
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const request = createMockRequest('POST', {
      allowedEventTypes: ['user.created'],
      applicationName: 'Test App'
    });

    const response = await POST(request, { params: { id: 'grp_test_123' } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('token', 'mock-jwt-token');
    expect(data).toHaveProperty('portalUrl');
    expect(data).toHaveProperty('expiresIn', 86400);
    expect(data).toHaveProperty('endpointGroup');
  });

  it('should generate portal token with optional fields', async () => {
    // Mock authentication
    vi.mocked(authenticateApiRequest).mockResolvedValue({
      success: true as const,
      environmentId: 'env_test_456',
      body: null
    });

    // Mock database response
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'grp_test_123',
                name: 'Test Endpoint Group',
                environmentId: 'env_test_456'
              }
            ])
          })
        })
      })
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const request = createMockRequest('POST', {
      allowedEventTypes: ['user.created', 'user.updated'],
      applicationName: 'Test App',
      returnUrl: 'https://testapp.com/settings'
    });

    const response = await POST(request, { params: { id: 'grp_test_123' } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('token', 'mock-jwt-token');
    expect(data).toHaveProperty('endpointGroup');
  });

  it('should return 404 for missing endpoint group', async () => {
    // Mock authentication
    vi.mocked(authenticateApiRequest).mockResolvedValue({
      success: true as const,
      environmentId: 'env_test_456',
      body: null
    });

    // Mock database response with empty result
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      })
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const request = createMockRequest('POST', {});
    const response = await POST(request, { params: { id: 'non_existent_group' } });
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Endpoint group not found');
  });

});
