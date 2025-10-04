// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.AUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NODE_ENV = 'test'

// Mock Cloudflare context
global.getCloudflareContext = jest.fn().mockResolvedValue({
  env: {
    WEBHOOKS: {
      send: jest.fn().mockResolvedValue({})
    }
  }
})

// Mock crypto for consistent UUIDs in tests
global.crypto = {
  randomUUID: jest.fn(() => 'test-uuid-1234-5678-9012')
}

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue(new Headers())
}))

// Suppress console.log during tests unless explicitly testing logging
const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})
