# HookHQ Relay

This package exports `createProxyRelayHandler()` so you can wrap it in the runtime you want.

## Google Cloud Functions

```js
import { http } from "@google-cloud/functions-framework";
import { createProxyRelayHandler } from "hookhq-relay";

http("relay", createProxyRelayHandler());
```

## Long-Lived Node Server

```js
import { createServer } from "node:http";
import { createProxyRelayHandler } from "hookhq-relay";

const handler = createProxyRelayHandler();

createServer((request, response) => {
  void handler(request, response);
}).listen(process.env.PORT || 3000);
```

Reference wrappers are also included in `examples/`.

## Endpoints

- `GET /health`
- `POST /proxy`

## Environment

- `PROXY_SECRET`
- `PORT` for the long-lived server variant

## Cloud Run

Use the included Dockerfile and set `PROXY_SECRET`.

## Published Image

The relay image is intended to be published as:

- `nuovar/hookhq-relay`

GitHub Actions builds multi-arch images for:

- `linux/amd64`
- `linux/arm64`

The publish workflow lives at `.github/workflows/publish-relay-image.yml`.

## Cloud Run Functions

Deploy a tiny wrapper that imports `createProxyRelayHandler()` and registers it with your function platform.
