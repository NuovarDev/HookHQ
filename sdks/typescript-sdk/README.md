# hookhq

Developer-friendly & type-safe Typescript SDK specifically catered to leverage *hookhq* API.

<div align="left">
    <a href="https://www.speakeasy.com/?utm_source=hookhq&utm_campaign=typescript"><img src="https://www.speakeasy.com/assets/badges/built-by-speakeasy.svg" /></a>
    <a href="https://opensource.org/licenses/MIT">
        <img src="https://img.shields.io/badge/License-MIT-blue.svg" style="width: 100px; height: 28px;" />
    </a>
</div>


<br /><br />
> [!IMPORTANT]
> This SDK is not yet ready for production use. To complete setup please follow the steps outlined in your [workspace](https://app.speakeasy.com/org/nuovar/hookhq). Delete this section before > publishing to a package manager.

<!-- Start Summary [summary] -->
## Summary


<!-- End Summary [summary] -->

<!-- Start Table of Contents [toc] -->
## Table of Contents
<!-- $toc-max-depth=2 -->
* [hookhq](#hookhq)
  * [SDK Installation](#sdk-installation)
  * [Requirements](#requirements)
  * [SDK Example Usage](#sdk-example-usage)
  * [Authentication](#authentication)
  * [Available Resources and Operations](#available-resources-and-operations)
  * [Standalone functions](#standalone-functions)
  * [Retries](#retries)
  * [Error Handling](#error-handling)
  * [Custom HTTP Client](#custom-http-client)
  * [Debugging](#debugging)
* [Development](#development)
  * [Maturity](#maturity)
  * [Contributions](#contributions)

<!-- End Table of Contents [toc] -->

<!-- Start SDK Installation [installation] -->
## SDK Installation

> [!TIP]
> To finish publishing your SDK to npm and others you must [run your first generation action](https://www.speakeasy.com/docs/github-setup#step-by-step-guide).


The SDK can be installed with either [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), [bun](https://bun.sh/) or [yarn](https://classic.yarnpkg.com/en/) package managers.

### NPM

```bash
npm add <UNSET>
```

### PNPM

```bash
pnpm add <UNSET>
```

### Bun

```bash
bun add <UNSET>
```

### Yarn

```bash
yarn add <UNSET>
```

> [!NOTE]
> This package is published with CommonJS and ES Modules (ESM) support.
<!-- End SDK Installation [installation] -->

<!-- Start Requirements [requirements] -->
## Requirements

For supported JavaScript runtimes, please consult [RUNTIMES.md](RUNTIMES.md).
<!-- End Requirements [requirements] -->

<!-- Start SDK Example Usage [usage] -->
## SDK Example Usage

### Example

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
<!-- End SDK Example Usage [usage] -->

<!-- Start Authentication [security] -->
## Authentication

### Per-Client Security Schemes

This SDK supports the following security schemes globally:

| Name           | Type   | Scheme      | Environment Variable    |
| -------------- | ------ | ----------- | ----------------------- |
| `bearerAuth`   | http   | HTTP Bearer | `HOOKHQ_BEARER_AUTH`    |
| `apiKeyCookie` | apiKey | API key     | `HOOKHQ_API_KEY_COOKIE` |

You can set the security parameters through the `security` optional parameter when initializing the SDK client instance. The selected scheme will be used by default to authenticate with the API for all operations that support it. For example:
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
<!-- End Authentication [security] -->

<!-- Start Available Resources and Operations [operations] -->
## Available Resources and Operations

<details open>
<summary>Available methods</summary>

### [endpointGroups](docs/sdks/endpointgroups/README.md)

* [delete](docs/sdks/endpointgroups/README.md#delete) - Delete an endpoint group
* [update](docs/sdks/endpointgroups/README.md#update) - Update an endpoint group
* [list](docs/sdks/endpointgroups/README.md#list) - List endpoint groups for the current environment
* [create](docs/sdks/endpointgroups/README.md#create) - Create new endpoint group

### [endpoints](docs/sdks/endpoints/README.md)

* [delete](docs/sdks/endpoints/README.md#delete) - Delete an endpoint
* [update](docs/sdks/endpoints/README.md#update) - Update an endpoint
* [list](docs/sdks/endpoints/README.md#list) - List endpoints for the current environment
* [create](docs/sdks/endpoints/README.md#create) - Create new endpoint

### [eventTypes](docs/sdks/eventtypes/README.md)

* [delete](docs/sdks/eventtypes/README.md#delete) - Delete an event type
* [update](docs/sdks/eventtypes/README.md#update) - Update an event type
* [list](docs/sdks/eventtypes/README.md#list) - List event types for the current environment
* [create](docs/sdks/eventtypes/README.md#create) - Create new event type


### [portal](docs/sdks/portal/README.md)

* [create](docs/sdks/portal/README.md#create) - Generate a JWT token for end user portal access

### [webhooks](docs/sdks/webhooks/README.md)

* [send](docs/sdks/webhooks/README.md#send) - Send a webhook to the specified endpoints.

 Webhooks can be sent to endpoints and/or endpoint groups. 
 In order to send a webhook to an endpoint group, the eventType must be specified, then the webhook will be dispatched to all endpoints in the group that are subscribed to the eventType.


</details>
<!-- End Available Resources and Operations [operations] -->

<!-- Start Standalone functions [standalone-funcs] -->
## Standalone functions

All the methods listed above are available as standalone functions. These
functions are ideal for use in applications running in the browser, serverless
runtimes or other environments where application bundle size is a primary
concern. When using a bundler to build your application, all unused
functionality will be either excluded from the final bundle or tree-shaken away.

To read more about standalone functions, check [FUNCTIONS.md](./FUNCTIONS.md).

<details>

<summary>Available standalone functions</summary>

- [`endpointGroupsCreate`](docs/sdks/endpointgroups/README.md#create) - Create new endpoint group
- [`endpointGroupsDelete`](docs/sdks/endpointgroups/README.md#delete) - Delete an endpoint group
- [`endpointGroupsList`](docs/sdks/endpointgroups/README.md#list) - List endpoint groups for the current environment
- [`endpointGroupsUpdate`](docs/sdks/endpointgroups/README.md#update) - Update an endpoint group
- [`endpointsCreate`](docs/sdks/endpoints/README.md#create) - Create new endpoint
- [`endpointsDelete`](docs/sdks/endpoints/README.md#delete) - Delete an endpoint
- [`endpointsList`](docs/sdks/endpoints/README.md#list) - List endpoints for the current environment
- [`endpointsUpdate`](docs/sdks/endpoints/README.md#update) - Update an endpoint
- [`eventTypesCreate`](docs/sdks/eventtypes/README.md#create) - Create new event type
- [`eventTypesDelete`](docs/sdks/eventtypes/README.md#delete) - Delete an event type
- [`eventTypesList`](docs/sdks/eventtypes/README.md#list) - List event types for the current environment
- [`eventTypesUpdate`](docs/sdks/eventtypes/README.md#update) - Update an event type
- [`portalCreate`](docs/sdks/portal/README.md#create) - Generate a JWT token for end user portal access
- [`webhooksSend`](docs/sdks/webhooks/README.md#send) - Send a webhook to the specified endpoints.

 Webhooks can be sent to endpoints and/or endpoint groups. 
 In order to send a webhook to an endpoint group, the eventType must be specified, then the webhook will be dispatched to all endpoints in the group that are subscribed to the eventType.


</details>
<!-- End Standalone functions [standalone-funcs] -->

<!-- Start Retries [retries] -->
## Retries

Some of the endpoints in this SDK support retries.  If you use the SDK without any configuration, it will fall back to the default retry strategy provided by the API.  However, the default retry strategy can be overridden on a per-operation basis, or across the entire SDK.

To change the default retry strategy for a single API call, simply provide a retryConfig object to the call:
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
  }, {
    retries: {
      strategy: "backoff",
      backoff: {
        initialInterval: 1,
        maxInterval: 50,
        exponent: 1.1,
        maxElapsedTime: 100,
      },
      retryConnectionErrors: false,
    },
  });
}

run();

```

If you'd like to override the default retry strategy for all operations that support retries, you can provide a retryConfig at SDK initialization:
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  retryConfig: {
    strategy: "backoff",
    backoff: {
      initialInterval: 1,
      maxInterval: 50,
      exponent: 1.1,
      maxElapsedTime: 100,
    },
    retryConnectionErrors: false,
  },
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
<!-- End Retries [retries] -->

<!-- Start Error Handling [errors] -->
## Error Handling

[`HookHQError`](./src/models/errors/hookhqerror.ts) is the base class for all HTTP error responses. It has the following properties:

| Property            | Type       | Description                                                                             |
| ------------------- | ---------- | --------------------------------------------------------------------------------------- |
| `error.message`     | `string`   | Error message                                                                           |
| `error.statusCode`  | `number`   | HTTP response status code eg `404`                                                      |
| `error.headers`     | `Headers`  | HTTP response headers                                                                   |
| `error.body`        | `string`   | HTTP body. Can be empty string if no body is returned.                                  |
| `error.rawResponse` | `Response` | Raw HTTP response                                                                       |
| `error.data$`       |            | Optional. Some errors may contain structured data. [See Error Classes](#error-classes). |

### Example
```typescript
import { HookHQ } from "hookhq";
import * as errors from "hookhq/models/errors";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  try {
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
  } catch (error) {
    // The base class for HTTP error responses
    if (error instanceof errors.HookHQError) {
      console.log(error.message);
      console.log(error.statusCode);
      console.log(error.body);
      console.log(error.headers);

      // Depending on the method different errors may be thrown
      if (error instanceof errors.PostApiPortalTokenBadRequestError) {
        console.log(error.data$.error); // string
      }
    }
  }
}

run();

```

### Error Classes
**Primary error:**
* [`HookHQError`](./src/models/errors/hookhqerror.ts): The base class for HTTP error responses.

<details><summary>Less common errors (17)</summary>

<br />

**Network errors:**
* [`ConnectionError`](./src/models/errors/httpclienterrors.ts): HTTP client was unable to make a request to a server.
* [`RequestTimeoutError`](./src/models/errors/httpclienterrors.ts): HTTP request timed out due to an AbortSignal signal.
* [`RequestAbortedError`](./src/models/errors/httpclienterrors.ts): HTTP request was aborted by the client.
* [`InvalidRequestError`](./src/models/errors/httpclienterrors.ts): Any input used to create a request is invalid.
* [`UnexpectedClientError`](./src/models/errors/httpclienterrors.ts): Unrecognised or unexpected error.


**Inherit from [`HookHQError`](./src/models/errors/hookhqerror.ts)**:
* [`PostApiPortalTokenBadRequestError`](./src/models/errors/postapiportaltokenbadrequesterror.ts): Bad request. Status code `400`. Applicable to 1 of 14 methods.*
* [`PostWebhooksSendBadRequestError`](./src/models/errors/postwebhookssendbadrequesterror.ts): Bad request (invalid payload, missing required fields, or payload validation failed). Status code `400`. Applicable to 1 of 14 methods.*
* [`PostApiPortalTokenUnauthorizedError`](./src/models/errors/postapiportaltokenunauthorizederror.ts): Unauthorized. Status code `401`. Applicable to 1 of 14 methods.*
* [`PostWebhooksSendUnauthorizedError`](./src/models/errors/postwebhookssendunauthorizederror.ts): Unauthorized. Status code `401`. Applicable to 1 of 14 methods.*
* [`PostApiPortalTokenForbiddenError`](./src/models/errors/postapiportaltokenforbiddenerror.ts): Forbidden. Status code `403`. Applicable to 1 of 14 methods.*
* [`PostWebhooksSendForbiddenError`](./src/models/errors/postwebhookssendforbiddenerror.ts): Forbidden. Status code `403`. Applicable to 1 of 14 methods.*
* [`NotFoundError`](./src/models/errors/notfounderror.ts): Endpoint group not found. Status code `404`. Applicable to 1 of 14 methods.*
* [`PostApiPortalTokenTooManyRequestsError`](./src/models/errors/postapiportaltokentoomanyrequestserror.ts): Rate limit exceeded. Status code `429`. Applicable to 1 of 14 methods.*
* [`PostWebhooksSendTooManyRequestsError`](./src/models/errors/postwebhookssendtoomanyrequestserror.ts): Rate limit exceeded. Status code `429`. Applicable to 1 of 14 methods.*
* [`PostApiPortalTokenInternalServerError`](./src/models/errors/postapiportaltokeninternalservererror.ts): Internal server error. Status code `500`. Applicable to 1 of 14 methods.*
* [`PostWebhooksSendInternalServerError`](./src/models/errors/postwebhookssendinternalservererror.ts): Internal server error. Status code `500`. Applicable to 1 of 14 methods.*
* [`ResponseValidationError`](./src/models/errors/responsevalidationerror.ts): Type mismatch between the data returned from the server and the structure expected by the SDK. See `error.rawValue` for the raw value and `error.pretty()` for a nicely formatted multi-line string.

</details>

\* Check [the method documentation](#available-resources-and-operations) to see if the error is applicable.
<!-- End Error Handling [errors] -->

<!-- Start Custom HTTP Client [http-client] -->
## Custom HTTP Client

The TypeScript SDK makes API calls using an `HTTPClient` that wraps the native
[Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). This
client is a thin wrapper around `fetch` and provides the ability to attach hooks
around the request lifecycle that can be used to modify the request or handle
errors and response.

The `HTTPClient` constructor takes an optional `fetcher` argument that can be
used to integrate a third-party HTTP client or when writing tests to mock out
the HTTP client and feed in fixtures.

The following example shows how to use the `"beforeRequest"` hook to to add a
custom header and a timeout to requests and how to use the `"requestError"` hook
to log errors:

```typescript
import { HookHQ } from "hookhq";
import { HTTPClient } from "hookhq/lib/http";

const httpClient = new HTTPClient({
  // fetcher takes a function that has the same signature as native `fetch`.
  fetcher: (request) => {
    return fetch(request);
  }
});

httpClient.addHook("beforeRequest", (request) => {
  const nextRequest = new Request(request, {
    signal: request.signal || AbortSignal.timeout(5000)
  });

  nextRequest.headers.set("x-custom-header", "custom value");

  return nextRequest;
});

httpClient.addHook("requestError", (error, request) => {
  console.group("Request Error");
  console.log("Reason:", `${error}`);
  console.log("Endpoint:", `${request.method} ${request.url}`);
  console.groupEnd();
});

const sdk = new HookHQ({ httpClient: httpClient });
```
<!-- End Custom HTTP Client [http-client] -->

<!-- Start Debugging [debug] -->
## Debugging

You can setup your SDK to emit debug logs for SDK requests and responses.

You can pass a logger that matches `console`'s interface as an SDK option.

> [!WARNING]
> Beware that debug logging will reveal secrets, like API tokens in headers, in log messages printed to a console or files. It's recommended to use this feature only during local development and not in production.

```typescript
import { HookHQ } from "hookhq";

const sdk = new HookHQ({ debugLogger: console });
```

You can also enable a default debug logger by setting an environment variable `HOOKHQ_DEBUG` to true.
<!-- End Debugging [debug] -->

<!-- Placeholder for Future Speakeasy SDK Sections -->

# Development

## Maturity

This SDK is in beta, and there may be breaking changes between versions without a major version update. Therefore, we recommend pinning usage
to a specific package version. This way, you can install the same version each time without breaking changes unless you are intentionally
looking for the latest version.

## Contributions

While we value open-source contributions to this SDK, this library is generated programmatically. Any manual changes added to internal files will be overwritten on the next generation. 
We look forward to hearing your feedback. Feel free to open a PR or an issue with a proof of concept and we'll do our best to include it in a future release. 

### SDK Created by [Speakeasy](https://www.speakeasy.com/?utm_source=hookhq&utm_campaign=typescript)
