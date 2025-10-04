# Endpoints
(*endpoints*)

## Overview

Endpoints API

### Available Operations

* [delete](#delete) - Delete an endpoint
* [update](#update) - Update an endpoint
* [list](#list) - List endpoints for the current environment
* [create](#create) - Create new endpoint

## delete

Delete an endpoint

### Example Usage

<!-- UsageSnippet language="typescript" operationID="delete_/endpoints/{id}" method="delete" path="/endpoints/{id}" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.endpoints.delete({
    id: "ep_a1b2_abcd1234",
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { endpointsDelete } from "hookhq/funcs/endpointsDelete.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await endpointsDelete(hookHQ, {
    id: "ep_a1b2_abcd1234",
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("endpointsDelete failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DeleteEndpointsIdRequest](../../models/operations/deleteendpointsidrequest.md)                                                                                     | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<void\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |

## update

Update an endpoint

### Example Usage

<!-- UsageSnippet language="typescript" operationID="patch_/endpoints/{id}" method="patch" path="/endpoints/{id}" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.endpoints.update({
    id: "ep_a1b2_abcd1234",
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { endpointsUpdate } from "hookhq/funcs/endpointsUpdate.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await endpointsUpdate(hookHQ, {
    id: "ep_a1b2_abcd1234",
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("endpointsUpdate failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PatchEndpointsIdRequest](../../models/operations/patchendpointsidrequest.md)                                                                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<void\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |

## list

List endpoints for the current environment

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/endpoints" method="get" path="/endpoints" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.endpoints.list();


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { endpointsList } from "hookhq/funcs/endpointsList.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await endpointsList(hookHQ);
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("endpointsList failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.GetEndpointsRequest](../../models/operations/getendpointsrequest.md)                                                                                               | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<void\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |

## create

Create new endpoint

### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/endpoints" method="post" path="/endpoints" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.endpoints.create({
    name: "My Webhook Endpoint",
    description: "My Webhook Endpoint description",
    url: "https://example.com/webhook",
    customHeaders: {},
    proxyGroupId: "proxygrp_a1b2_efgh5678",
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { endpointsCreate } from "hookhq/funcs/endpointsCreate.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await endpointsCreate(hookHQ, {
    name: "My Webhook Endpoint",
    description: "My Webhook Endpoint description",
    url: "https://example.com/webhook",
    customHeaders: {},
    proxyGroupId: "proxygrp_a1b2_efgh5678",
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("endpointsCreate failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PostEndpointsRequest](../../models/operations/postendpointsrequest.md)                                                                                             | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<void\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |