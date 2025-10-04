import { POST } from '@/app/api/portal/token/route';
import { createMockRequest } from '../utils/testUtils';

// Mock the database and authentication modules
jest.mock('@/db');
jest.mock('jsonwebtoken');

describe('Portal Token API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate portal token with required fields', async () => {
    // Mock database response
    const { getDb } = require('@/db');
    const mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
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
    getDb.mockResolvedValue(mockDb);

    // Mock JWT signing
    const jwt = require('jsonwebtoken');
    jwt.sign.mockReturnValue('mock-jwt-token');

    const request = createMockRequest('POST', {
      endpointGroupId: 'grp_test_123'
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('token', 'mock-jwt-token');
    expect(data).toHaveProperty('portalUrl');
    expect(data).toHaveProperty('expiresIn', 3600);
    expect(data).toHaveProperty('endpointGroup');
  });

  it('should generate portal token with optional fields', async () => {
    // Mock database response
    const { getDb } = require('@/db');
    const mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
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
    getDb.mockResolvedValue(mockDb);

    // Mock JWT signing
    const jwt = require('jsonwebtoken');
    jwt.sign.mockReturnValue('mock-jwt-token');

    const request = createMockRequest('POST', {
      endpointGroupId: 'grp_test_123',
      allowedEventTypes: ['user.created', 'user.updated'],
      applicationName: 'Test App',
      returnUrl: 'https://testapp.com/settings'
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('token', 'mock-jwt-token');
    expect(data).toHaveProperty('endpointGroup');
  });

  it('should return 400 for missing endpointGroupId', async () => {
    const request = createMockRequest('POST', {});

    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'endpointGroupId is required');
  });

  it('should return 404 for non-existent endpoint group', async () => {
    // Mock database response with empty result
    const { getDb } = require('@/db');
    const mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      })
    };
    getDb.mockResolvedValue(mockDb);

    const request = createMockRequest('POST', {
      endpointGroupId: 'non_existent_group'
    });

    const response = await POST(request);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Endpoint group not found');
  });
});
