# EndpointGroups
(*endpointGroups*)

## Overview

### Available Operations

* [delete](#delete) - Delete an endpoint group
* [update](#update) - Update an endpoint group
* [list](#list) - List endpoint groups for the current environment
* [create](#create) - Create new endpoint group

## delete

Delete an endpoint group

### Example Usage

<!-- UsageSnippet language="typescript" operationID="delete_/endpoint-groups/{id}" method="delete" path="/endpoint-groups/{id}" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.endpointGroups.delete({
    id: "grp_a1b2_efgh5678",
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { endpointGroupsDelete } from "hookhq/funcs/endpointGroupsDelete.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await endpointGroupsDelete(hookHQ, {
    id: "grp_a1b2_efgh5678",
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("endpointGroupsDelete failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DeleteEndpointGroupsIdRequest](../../models/operations/deleteendpointgroupsidrequest.md)                                                                           | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
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

Update an endpoint group

### Example Usage

<!-- UsageSnippet language="typescript" operationID="patch_/endpoint-groups/{id}" method="patch" path="/endpoint-groups/{id}" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.endpointGroups.update({
    id: "grp_a1b2_efgh5678",
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { endpointGroupsUpdate } from "hookhq/funcs/endpointGroupsUpdate.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await endpointGroupsUpdate(hookHQ, {
    id: "grp_a1b2_efgh5678",
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("endpointGroupsUpdate failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PatchEndpointGroupsIdRequest](../../models/operations/patchendpointgroupsidrequest.md)                                                                             | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
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

List endpoint groups for the current environment

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/endpoint-groups" method="get" path="/endpoint-groups" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.endpointGroups.list();


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { endpointGroupsList } from "hookhq/funcs/endpointGroupsList.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await endpointGroupsList(hookHQ);
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("endpointGroupsList failed:", res.error);
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

Create new endpoint group

### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/endpoint-groups" method="post" path="/endpoint-groups" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  await hookHQ.endpointGroups.create({
    name: "My Endpoint Group",
    description: "My Endpoint Group description",
    endpointIds: [
      "ep_a1b2_efgh5678",
    ],
    enabled: true,
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { endpointGroupsCreate } from "hookhq/funcs/endpointGroupsCreate.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await endpointGroupsCreate(hookHQ, {
    name: "My Endpoint Group",
    description: "My Endpoint Group description",
    endpointIds: [
      "ep_a1b2_efgh5678",
    ],
    enabled: true,
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("endpointGroupsCreate failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PostEndpointGroupsRequest](../../models/operations/postendpointgroupsrequest.md)                                                                                   | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<void\>**

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |