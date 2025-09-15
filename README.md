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

### Manual Deployment

To deploy `workers-webhooks` manually, follow the steps below.

1. Clone the repository
2. Install dependencies
    - `npm install`
3. Create the D1 database
    - `npx wrangler d1 create webhooks-db`
4. Create the R2 bucket
    - `npx wrangler r2 create webhooks-r2`
5. Create the Queues
    - `npx wrangler queues create webhooks-queue`
    - `npx wrangler queues create webhooks-dlq`
6. Build the project
    - `npm run build`
7. Deploy the project
    - `npm run deploy`