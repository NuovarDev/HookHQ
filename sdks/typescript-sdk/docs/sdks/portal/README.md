# Portal
(*portal*)

## Overview

### Available Operations

* [create](#create) - Generate a JWT token for end user portal access

## create

Generate a JWT token for end user portal access

### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/api/portal/token" method="post" path="/api/portal/token" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const result = await hookHQ.portal.create({
    endpointGroupId: "grp_a1b2_efgh5678",
    allowedEventTypes: [
      "user.created",
      "user.updated",
    ],
    applicationName: "My Application",
    returnUrl: "https://myapp.com/settings",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { portalCreate } from "hookhq/funcs/portalCreate.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await portalCreate(hookHQ, {
    endpointGroupId: "grp_a1b2_efgh5678",
    allowedEventTypes: [
      "user.created",
      "user.updated",
    ],
    applicationName: "My Application",
    returnUrl: "https://myapp.com/settings",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("portalCreate failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PostApiPortalTokenRequest](../../models/operations/postapiportaltokenrequest.md)                                                                                   | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.PostApiPortalTokenResponse](../../models/operations/postapiportaltokenresponse.md)\>**

### Errors

| Error Type                                    | Status Code                                   | Content Type                                  |
| --------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| errors.PostApiPortalTokenBadRequestError      | 400                                           | application/json                              |
| errors.PostApiPortalTokenUnauthorizedError    | 401                                           | application/json                              |
| errors.PostApiPortalTokenForbiddenError       | 403                                           | application/json                              |
| errors.NotFoundError                          | 404                                           | application/json                              |
| errors.PostApiPortalTokenTooManyRequestsError | 429                                           | application/json                              |
| errors.PostApiPortalTokenInternalServerError  | 500                                           | application/json                              |
| errors.HookHQDefaultError                     | 4XX, 5XX                                      | \*/\*                                         |