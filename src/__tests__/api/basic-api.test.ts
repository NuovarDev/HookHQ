/**
 * Basic API Tests
 * 
 * These tests focus on testing the core API functionality without complex mocking.
 * They serve as a foundation for more comprehensive testing.
 */

import { validateSchema } from '@/lib/schemaValidation';
import { createMockRequest, createMockRequestWithApiKey, TestDataFactory, assertApiResponse, assertApiError } from '../utils/testUtils';
import { describe, it, expect } from 'vitest';

describe('Basic API Tests', () => {
  describe('Schema Validation Integration', () => {
    it('should validate JSON schemas correctly', () => {
      // Test that our schema validation is working
      
      const validSchema = {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          email: { type: 'string' }
        },
        required: ['userId']
      };

      const result = validateSchema(validSchema);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid schemas', () => {
      
      const invalidSchema = {
        type: 'invalid-type',
        properties: {
          userId: { type: 'string' }
        }
      };

      const result = validateSchema(invalidSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Request Creation Utilities', () => {
    it('should create mock requests correctly', () => {
      
      const request = createMockRequest('POST', { test: 'data' });
      expect(request.method).toBe('POST');
      expect(request.url).toBe('http://localhost:3000/api/test');
    });

    it('should create authenticated requests', () => {
      
      const request = createMockRequestWithApiKey('test-api-key', 'GET');
      expect(request.method).toBe('GET');
      expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    });
  });

  describe('Test Data Factory', () => {
    it('should create test environment data', async () => {
      
      const environment = await TestDataFactory.createTestEnvironment({
        name: 'Test Environment'
      });
      
      expect(environment).toHaveProperty('id');
      expect(environment).toHaveProperty('name', 'Test Environment');
    });

    it('should create test event type data', async () => {
      
      const eventType = await TestDataFactory.createTestEventType('test-env-id', {
        name: 'test.event'
      });
      
      expect(eventType).toHaveProperty('id');
      expect(eventType).toHaveProperty('name', 'test.event');
      expect(eventType).toHaveProperty('environmentId', 'test-env-id');
    });
  });

  describe('Response Assertions', () => {
    it('should assert API responses correctly', () => {
      
      const mockResponse = new Response(JSON.stringify({ 
        success: true, 
        data: 'test' 
      }), { status: 200 });
      
      // This should not throw
      expect(() => {
        assertApiResponse(mockResponse, 200, ['success', 'data']);
      }).not.toThrow();
    });

    it('should assert API errors correctly', () => {
      
      const mockErrorResponse = new Response(JSON.stringify({ 
        error: 'Not Found' 
      }), { status: 404 });
      
      // This should not throw
      expect(() => {
        assertApiError(mockErrorResponse, 404, 'Not Found');
      }).not.toThrow();
    });
  });
});