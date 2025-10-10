import { ApiReference } from '@scalar/nextjs-api-reference'
import { NextResponse } from 'next/server';

// Combine JSDoc API endpoints with BetterAuth schema
const config = {
  theme: 'deepSpace' as const,
  metaData: {
    title: 'HookHQ API Reference',
    description: 'API Reference for the HookHQ API',
  },
  sources: [
    {
      url: '/api/spec',
      title: 'Webhooks',
    },
    {
      url: '/api/auth/open-api/generate-schema',
      title: 'Auth',
    },
  ]
}

export const GET = process.env.NEXT_PUBLIC_API_DOCS_ENABLED === 'true' ? ApiReference(config) : () => {
  return new NextResponse(null, { status: 404 });
}