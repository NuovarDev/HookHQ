import { validateSchema, validateData, validateEventPayload } from '@/lib/schemaValidation';
import { describe, it, expect } from 'vitest';

describe('Schema Validation', () => {
  describe('validateSchema', () => {
    it('should validate a correct JSON schema', () => {
      const validSchema = {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          email: { type: 'string', format: 'email' }
        },
        required: ['userId']
      };

      const result = validateSchema(validSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject an invalid JSON schema', () => {
      const invalidSchema = {
        type: 'invalid-type',
        properties: {
          userId: { type: 'string' }
        }
      };

      const result = validateSchema(invalidSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should reject a schema with invalid property types', () => {
      const invalidSchema = {
        type: 'object',
        properties: {
          userId: { type: 'invalid-type' }
        }
      };

      const result = validateSchema(invalidSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle null/undefined schemas gracefully', () => {
      expect(validateSchema(null).valid).toBe(false);
      expect(validateSchema(undefined).valid).toBe(false);
      // Empty object is actually a valid JSON schema (it accepts any data)
      expect(validateSchema({}).valid).toBe(true);
    });
  });

  describe('validateData', () => {
    const validSchema = {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        email: { type: 'string', format: 'email' },
        age: { type: 'number', minimum: 0 }
      },
      required: ['userId']
    };

    it('should validate data against a correct schema', () => {
      const validData = {
        userId: 'user123',
        email: 'test@example.com',
        age: 25
      };

      const result = validateData(validSchema, validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject data that violates schema constraints', () => {
      const invalidData = {
        email: 'invalid-email',
        age: -5
      };

      const result = validateData(validSchema, invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should reject data missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
        age: 25
        // Missing required userId
      };

      const result = validateData(validSchema, invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(error => error.includes('userId'))).toBe(true);
    });

    it('should handle invalid schema gracefully', () => {
      const invalidSchema = { type: 'invalid' };
      const data = { userId: 'test' };

      const result = validateData(invalidSchema, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateEventPayload', () => {
    it('should return valid when no schema is provided', () => {
      const result = validateEventPayload(null, { userId: 'test' });
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate payload against valid schema', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          userId: { type: 'string' },
          action: { type: 'string', enum: ['create', 'update', 'delete'] }
        },
        required: ['userId', 'action']
      });

      const validPayload = {
        userId: 'user123',
        action: 'create'
      };

      const result = validateEventPayload(schema, validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject payload that violates schema', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          userId: { type: 'string' },
          action: { type: 'string', enum: ['create', 'update', 'delete'] }
        },
        required: ['userId', 'action']
      });

      const invalidPayload = {
        userId: 'user123',
        action: 'invalid-action'
      };

      const result = validateEventPayload(schema, invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle malformed schema JSON gracefully', () => {
      const malformedSchema = '{ invalid json }';
      const payload = { userId: 'test' };

      const result = validateEventPayload(malformedSchema, payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Invalid event type schema');
    });

    it('should handle complex nested schemas', () => {
      const complexSchema = JSON.stringify({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              profile: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  age: { type: 'number', minimum: 0, maximum: 120 }
                },
                required: ['name']
              }
            },
            required: ['id']
          },
          metadata: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['user']
      });

      const validPayload = {
        user: {
          id: 'user123',
          profile: {
            name: 'John Doe',
            age: 30
          }
        },
        metadata: ['tag1', 'tag2']
      };

      const result = validateEventPayload(complexSchema, validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject payload with invalid nested data', () => {
      const complexSchema = JSON.stringify({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              age: { type: 'number', minimum: 0 }
            },
            required: ['id']
          }
        },
        required: ['user']
      });

      const invalidPayload = {
        user: {
          id: 'user123',
          age: -5 // Invalid: negative age
        }
      };

      const result = validateEventPayload(complexSchema, invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
