# API Testing Suite

This directory contains comprehensive unit tests for the webhooks API routes and related functionality.

## Test Structure

```
src/__tests__/
├── utils/
│   └── testUtils.ts          # Test utilities and helpers
├── lib/
│   └── schemaValidation.test.ts  # Schema validation tests
├── api/
│   ├── event-types.test.ts   # Event types API tests
│   ├── webhooks-send.test.ts # Webhook send API tests
│   └── environments.test.ts  # Environment API tests
└── README.md                  # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD (no watch, with coverage)
npm run test:ci
```

### Running Specific Tests

```bash
# Run tests for a specific file
npm test -- event-types.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="schema validation"

# Run tests in a specific directory
npm test -- src/__tests__/api/
```

## Test Utilities

The `testUtils.ts` file provides several helpful utilities:

### Request Creation
- `createMockRequest()` - Creates mock NextRequest objects
- `createMockRequestWithApiKey()` - Creates authenticated requests with API keys
- `createMockRequestWithSession()` - Creates authenticated requests with sessions

### Test Data Factory
- `TestDataFactory.createTestEnvironment()` - Creates test environments
- `TestDataFactory.createTestEventType()` - Creates test event types
- `TestDataFactory.createTestEndpoint()` - Creates test endpoints
- `TestDataFactory.createTestApiKey()` - Creates test API keys
- `TestDataFactory.cleanup()` - Cleans up test data

### Assertion Helpers
- `assertApiResponse()` - Asserts response status and structure
- `assertApiError()` - Asserts error responses

## Test Coverage

The test suite covers:

### Schema Validation (`schemaValidation.test.ts`)
- ✅ Valid JSON schema validation
- ✅ Invalid schema rejection
- ✅ Data validation against schemas
- ✅ Event payload validation
- ✅ Complex nested schema handling
- ✅ Error handling for malformed schemas

### Event Types API (`event-types.test.ts`)
- ✅ GET /api/event-types (list with filters)
- ✅ POST /api/event-types (create with schema validation)
- ✅ PATCH /api/event-types/[id] (update with validation)
- ✅ DELETE /api/event-types/[id] (delete)
- ✅ Authentication and authorization
- ✅ Error handling

### Webhook Send API (`webhooks-send.test.ts`)
- ✅ Successful webhook sending
- ✅ Payload validation against event type schemas
- ✅ Schema violation rejection
- ✅ Required field validation
- ✅ Endpoint group handling
- ✅ Environment isolation
- ✅ Idempotency key support
- ✅ Authentication and authorization

### Environment API (`environments.test.ts`)
- ✅ Environment deletion with cascade cleanup
- ✅ Default environment protection
- ✅ API key metadata handling
- ✅ Resource cleanup verification
- ✅ Error handling
- ✅ Authentication

## Mocking Strategy

The tests use Jest mocks for:

- **Authentication**: Mocked `@/lib/apiHelpers` for consistent auth responses
- **Database**: Mocked `@/db` for isolated test data
- **Cloudflare**: Mocked `@opennextjs/cloudflare` for webhook queue
- **Next.js**: Mocked `next/headers` for request handling

## Test Data Management

Each test suite:
1. Creates isolated test data using `TestDataFactory`
2. Runs tests against this data
3. Cleans up data after completion
4. Uses unique identifiers to avoid conflicts

## Best Practices

### Writing Tests
1. **Isolation**: Each test should be independent
2. **Clear Names**: Use descriptive test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Don't rely on external services
5. **Clean Up**: Always clean up test data

### Test Organization
1. **Group Related Tests**: Use `describe` blocks
2. **Setup/Teardown**: Use `beforeAll`/`afterAll` for expensive operations
3. **Clear Assertions**: Use specific assertions with helpful messages
4. **Error Cases**: Test both success and failure scenarios

## Adding New Tests

When adding new API routes or functionality:

1. **Create Test File**: Follow the naming pattern `[feature].test.ts`
2. **Import Utilities**: Use `testUtils.ts` for common operations
3. **Mock Dependencies**: Mock external dependencies appropriately
4. **Test Coverage**: Include both success and error cases
5. **Documentation**: Update this README if adding new utilities

## CI/CD Integration

The test suite is designed to run in CI/CD environments:

- Uses `npm run test:ci` for CI runs
- Includes coverage reporting
- Runs without interactive mode
- Provides clear pass/fail status

## Troubleshooting

### Common Issues

1. **Mock Not Working**: Ensure mocks are set up before imports
2. **Database Errors**: Check that test data cleanup is working
3. **Authentication Failures**: Verify mock auth responses
4. **TypeScript Errors**: Ensure proper typing in test files

### Debug Mode

Run tests with debug output:
```bash
npm test -- --verbose
```

### Coverage Issues

If coverage is low:
1. Check that all code paths are tested
2. Add tests for error conditions
3. Verify edge cases are covered
4. Review uncovered lines in coverage report
