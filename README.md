# `workers-webhooks` Cloudflare Workers Webhooks-as-a-service

## About `workers-webhooks`

`workers-webhooks` is a Webhooks-as-a-service application built with Cloudflare Workers, allowing you to easily send webhooks from your application to your end users.

- Web based dashboard and API endpoints for managing webhooks
- API key based authentication for sending webhooks
- Webhook endpoint groups for batch operations
- Endpoint groups and event types for dispatching bulk webhooks
- External proxy support for static IP delivery
- Rate limiting, throttling, and retry policies

`workers-webhooks` is built on top of Cloudflare Workers, D1, R2, and Queues running entirely on a single Cloudflare worker in Cloudflare's global network.

It utilizes Queues to dispatch webhooks, D1 for storing logs and application/authentication data, and R2 for large webhook payloads.

Because of it's dependency on Cloudflare Queues, `workers-webhooks` can only run on accounts with the Workers Paid plan.

## Getting Started

### One Click Deploy

To deploy `workers-webhooks` to Cloudflare, click the button below.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cdgco/workers-webhooks)

This will automatically setup the worker, D1 database, R2 bucket, and Queues for you.

When prompted, enter a `AUTH_SECRET` value. You can generate one using `openssl rand -base64 32`.

### Manual Deployment

To deploy `workers-webhooks` manually, follow the steps below.

1. Clone the repository
2. Install dependencies
    - `npm install`
3. Copy the `.env.example` file to `.env`
    - `cp .env.example .env`
4. Set the `AUTH_SECRET` environment variable
    - `AUTH_SECRET=YOUR_AUTH_SECRET`
5. Create the D1 database
    - `npx wrangler d1 create webhooks-db`
6. Create the KV namespace
    - `npx wrangler kv namespace create webhooks-kv`
7. Create the Queues
    - `npx wrangler queues create webhooks-queue`
    - `npx wrangler queues create webhooks-dlq`
8. Build the project
    - `npm run build`
9. Deploy the project
    - `npm run deploy`

## API Documentation

The API documentation is available at `/api` and has tabs for both the webhooks and auth APIs.

To disable the API documentation, set the `NEXT_PUBLIC_API_DOCS_ENABLED` environment variable to `false`.

The webhooks docs are generated based on the JSDoc comments in the `src/app/api` folder. To update the docs, run `npm run docs:generate`.