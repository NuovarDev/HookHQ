import { validateSchema, validateData, validateEventPayload } from '@/lib/schemaValidation';
import { describe, it, expect } from 'vitest';

describe('Schema Validation - Simple Tests', () => {
  describe('validateSchema', () => {
    it('should validate a correct JSON schema', () => {
      const validSchema = {
        type: 'object',
        properties: {
          userId: { type: 'string' }
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
        age: { type: 'number', minimum: 0 }
      },
      required: ['userId']
    };

    it('should validate data against a correct schema', () => {
      const validData = {
        userId: 'user123',
        age: 25
      };

      const result = validateData(validSchema, validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject data that violates schema constraints', () => {
      const invalidData = {
        userId: 'user123',
        age: -5 // Invalid: negative age
      };

      const result = validateData(validSchema, invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should reject data missing required fields', () => {
      const invalidData = {
        age: 25
        // Missing required userId
      };

      const result = validateData(validSchema, invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(error => error.includes('userId'))).toBe(true);
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
  });
});
