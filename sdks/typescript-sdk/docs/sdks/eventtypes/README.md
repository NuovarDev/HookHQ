# EventTypes
(*eventTypes*)

## Overview

### Available Operations

* [delete](#delete) - Delete an event type
* [update](#update) - Update an event type
* [list](#list) - List event types for the current environment
* [create](#create) - Create new event type

## delete

Delete an event type

### Example Usage

<!-- UsageSnippet language="typescript" operationID="delete_/event-types/{id}" method="delete" path="/event-types/{id}" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.eventTypes.delete({
    id: "user.created",
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { eventTypesDelete } from "hookhq/funcs/eventTypesDelete.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await eventTypesDelete(hookHQ, {
    id: "user.created",
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("eventTypesDelete failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DeleteEventTypesIdRequest](../../models/operations/deleteeventtypesidrequest.md)                                                                                   | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
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

Update an event type

### Example Usage

<!-- UsageSnippet language="typescript" operationID="patch_/event-types/{id}" method="patch" path="/event-types/{id}" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.eventTypes.update({
    id: "user.created",
    requestBody: {
      name: "User Created",
      description: "User created event",
      schema: {},
      enabled: true,
    },
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { eventTypesUpdate } from "hookhq/funcs/eventTypesUpdate.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await eventTypesUpdate(hookHQ, {
    id: "user.created",
    requestBody: {
      name: "User Created",
      description: "User created event",
      schema: {},
      enabled: true,
    },
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("eventTypesUpdate failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PatchEventTypesIdRequest](../../models/operations/patcheventtypesidrequest.md)                                                                                     | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
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

List event types for the current environment

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/event-types" method="get" path="/event-types" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.eventTypes.list();


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { eventTypesList } from "hookhq/funcs/eventTypesList.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await eventTypesList(hookHQ);
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("eventTypesList failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
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

Create new event type

### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/event-types" method="post" path="/event-types" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.eventTypes.create({
    name: "User Created",
    description: "User created event",
    schema: {},
    enabled: true,
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { eventTypesCreate } from "hookhq/funcs/eventTypesCreate.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await eventTypesCreate(hookHQ, {
    name: "User Created",
    description: "User created event",
    schema: {},
    enabled: true,
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("eventTypesCreate failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PostEventTypesRequest](../../models/operations/posteventtypesrequest.md)                                                                                           | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<void\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |