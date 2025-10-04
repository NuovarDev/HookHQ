import { DELETE } from '@/app/api/environments/[id]/route';
import { createMockRequest, TestDataFactory, assertApiResponse, assertApiError } from '../utils/testUtils';

// Mock the authentication and database modules
jest.mock('@/auth');
jest.mock('@/db');

describe('Environment API', () => {
  let testEnvironment: any;
  let testEventType: any;
  let testEndpoint: any;
  let testApiKey: any;

  beforeAll(async () => {
    // Create test environment with associated resources
    testEnvironment = await TestDataFactory.createTestEnvironment({
      name: 'Test Environment for Deletion',
      isDefault: false
    });
    
    testEventType = await TestDataFactory.createTestEventType(testEnvironment.id, {
      name: 'test.event'
    });
    
    testEndpoint = await TestDataFactory.createTestEndpoint(testEnvironment.id, {
      name: 'Test Endpoint'
    });
    
    testApiKey = await TestDataFactory.createTestApiKey('test-user-id', testEnvironment.id);
  });

  afterAll(async () => {
    await TestDataFactory.cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/environments/[id]', () => {
    it('should delete environment and all associated resources', async () => {
      // Create a new environment specifically for this test
      const environmentToDelete = await TestDataFactory.createTestEnvironment({
        name: 'Environment to Delete',
        isDefault: false
      });

      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: environmentToDelete.id } });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('message', 'Environment and all associated resources deleted successfully');
      expect(data).toHaveProperty('deletedEnvironment');
      expect(data).toHaveProperty('deletedResources');
      expect(data.deletedEnvironment.id).toBe(environmentToDelete.id);
      expect(data.deletedEnvironment.name).toBe(environmentToDelete.name);
      
      // Verify all resource types are mentioned in the response
      expect(data.deletedResources).toHaveProperty('webhookMessages');
      expect(data.deletedResources).toHaveProperty('endpoints');
      expect(data.deletedResources).toHaveProperty('endpointGroups');
      expect(data.deletedResources).toHaveProperty('eventTypes');
      expect(data.deletedResources).toHaveProperty('proxyServers');
      expect(data.deletedResources).toHaveProperty('proxyGroups');
      expect(data.deletedResources).toHaveProperty('apiKeys');
    });

    it('should prevent deletion of default environment', async () => {
      // Create a default environment
      const defaultEnvironment = await TestDataFactory.createTestEnvironment({
        name: 'Default Environment',
        isDefault: true
      });

      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: defaultEnvironment.id } });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Cannot delete default environment');
    });

    it('should return 404 for non-existent environment', async () => {
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: 'non-existent-id' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Environment not found');
    });

    it('should return 400 for missing environment ID', async () => {
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: '' } });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Environment ID is required');
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Mock authentication failure
      jest.doMock('@/auth', () => ({
        initAuth: jest.fn().mockResolvedValue({
          api: {
            getSession: jest.fn().mockResolvedValue({ user: null })
          }
        })
      }));

      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: testEnvironment.id } });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle cascade deletion of API keys with metadata', async () => {
      // Create environment with API keys
      const envWithApiKeys = await TestDataFactory.createTestEnvironment({
        name: 'Environment with API Keys',
        isDefault: false
      });

      // Create API keys with different metadata formats
      await TestDataFactory.createTestApiKey('user1', envWithApiKeys.id, {
        name: 'API Key 1',
        metadata: JSON.stringify({ environment: envWithApiKeys.id })
      });

      await TestDataFactory.createTestApiKey('user2', envWithApiKeys.id, {
        name: 'API Key 2',
        metadata: JSON.stringify({ environment: envWithApiKeys.id, permissions: ['read'] })
      });

      // Create API key for different environment (should not be deleted)
      const otherEnv = await TestDataFactory.createTestEnvironment({
        name: 'Other Environment',
        isDefault: false
      });
      await TestDataFactory.createTestApiKey('user3', otherEnv.id, {
        name: 'Other API Key',
        metadata: JSON.stringify({ environment: otherEnv.id })
      });

      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: envWithApiKeys.id } });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.deletedResources.apiKeys).toContain('2 API keys');
    });

    it('should handle environment with no associated resources', async () => {
      // Create empty environment
      const emptyEnvironment = await TestDataFactory.createTestEnvironment({
        name: 'Empty Environment',
        isDefault: false
      });

      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: emptyEnvironment.id } });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('message', 'Environment and all associated resources deleted successfully');
      expect(data.deletedResources.apiKeys).toBe('0 API keys');
    });

    it('should handle malformed API key metadata gracefully', async () => {
      // Create environment with API key having malformed metadata
      const envWithMalformedMetadata = await TestDataFactory.createTestEnvironment({
        name: 'Environment with Malformed Metadata',
        isDefault: false
      });

      await TestDataFactory.createTestApiKey('user1', envWithMalformedMetadata.id, {
        name: 'API Key with Malformed Metadata',
        metadata: 'invalid json' // Malformed JSON
      });

      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: envWithMalformedMetadata.id } });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.deletedResources.apiKeys).toBe('0 API keys'); // Malformed metadata should be ignored
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.doMock('@/db', () => ({
        getDb: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      }));

      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { id: testEnvironment.id } });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Internal server error');
    });
  });
});
