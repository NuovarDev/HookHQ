import { NextResponse } from 'next/server';
import ApiDocs from '@/lib/openapi.json'

export const GET = process.env.NEXT_PUBLIC_API_DOCS_ENABLED === 'true' ? () => {
  return new NextResponse(JSON.stringify(ApiDocs), { status: 200 });
} : () => {
  return new NextResponse(null, { status: 404 });
}