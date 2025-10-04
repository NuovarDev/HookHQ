# hookhq

Developer-friendly & type-safe Python SDK specifically catered to leverage *hookhq* API.

<div align="left">
    <a href="https://www.speakeasy.com/?utm_source=hookhq&utm_campaign=python"><img src="https://www.speakeasy.com/assets/badges/built-by-speakeasy.svg" /></a>
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
  * [IDE Support](#ide-support)
  * [SDK Example Usage](#sdk-example-usage)
  * [Authentication](#authentication)
  * [Available Resources and Operations](#available-resources-and-operations)
  * [Retries](#retries)
  * [Error Handling](#error-handling)
  * [Custom HTTP Client](#custom-http-client)
  * [Resource Management](#resource-management)
  * [Debugging](#debugging)
* [Development](#development)
  * [Maturity](#maturity)
  * [Contributions](#contributions)

<!-- End Table of Contents [toc] -->

<!-- Start SDK Installation [installation] -->
## SDK Installation

> [!TIP]
> To finish publishing your SDK to PyPI you must [run your first generation action](https://www.speakeasy.com/docs/github-setup#step-by-step-guide).


> [!NOTE]
> **Python version upgrade policy**
>
> Once a Python version reaches its [official end of life date](https://devguide.python.org/versions/), a 3-month grace period is provided for users to upgrade. Following this grace period, the minimum python version supported in the SDK will be updated.

The SDK can be installed with *uv*, *pip*, or *poetry* package managers.

### uv

*uv* is a fast Python package installer and resolver, designed as a drop-in replacement for pip and pip-tools. It's recommended for its speed and modern Python tooling capabilities.

```bash
uv add git+<UNSET>.git
```

### PIP

*PIP* is the default package installer for Python, enabling easy installation and management of packages from PyPI via the command line.

```bash
pip install git+<UNSET>.git
```

### Poetry

*Poetry* is a modern tool that simplifies dependency management and package publishing by using a single `pyproject.toml` file to handle project metadata and dependencies.

```bash
poetry add git+<UNSET>.git
```

### Shell and script usage with `uv`

You can use this SDK in a Python shell with [uv](https://docs.astral.sh/uv/) and the `uvx` command that comes with it like so:

```shell
uvx --from hookhq python
```

It's also possible to write a standalone Python script without needing to set up a whole project like so:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "hookhq",
# ]
# ///

from hookhq import HookHQ

sdk = HookHQ(
  # SDK arguments
)

# Rest of script here...
```

Once that is saved to a file, you can run it with `uv run script.py` where
`script.py` can be replaced with the actual file name.
<!-- End SDK Installation [installation] -->

<!-- Start IDE Support [idesupport] -->
## IDE Support

### PyCharm

Generally, the SDK will work well with most IDEs out of the box. However, when using PyCharm, you can enjoy much better integration with Pydantic by installing an additional plugin.

- [PyCharm Pydantic Plugin](https://docs.pydantic.dev/latest/integrations/pycharm/)
<!-- End IDE Support [idesupport] -->

<!-- Start SDK Example Usage [usage] -->
## SDK Example Usage

### Example

```python
# Synchronous Example
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.endpoint_groups.delete(id="grp_a1b2_efgh5678")

    # Use the SDK ...
```

</br>

The same SDK client can also be used to make asynchronous requests by importing asyncio.

```python
# Asynchronous Example
import asyncio
from hookhq import HookHQ, models
import os

async def main():

    async with HookHQ(
        server_url="https://api.example.com",
        security=models.Security(
            bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
        ),
    ) as hook_hq:

        await hook_hq.endpoint_groups.delete_async(id="grp_a1b2_efgh5678")

        # Use the SDK ...

asyncio.run(main())
```
<!-- End SDK Example Usage [usage] -->

<!-- Start Authentication [security] -->
## Authentication

### Per-Client Security Schemes

This SDK supports the following security schemes globally:

| Name             | Type   | Scheme      | Environment Variable    |
| ---------------- | ------ | ----------- | ----------------------- |
| `bearer_auth`    | http   | HTTP Bearer | `HOOKHQ_BEARER_AUTH`    |
| `api_key_cookie` | apiKey | API key     | `HOOKHQ_API_KEY_COOKIE` |

You can set the security parameters through the `security` optional parameter when initializing the SDK client instance. The selected scheme will be used by default to authenticate with the API for all operations that support it. For example:
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.endpoint_groups.delete(id="grp_a1b2_efgh5678")

    # Use the SDK ...

```
<!-- End Authentication [security] -->

<!-- Start Available Resources and Operations [operations] -->
## Available Resources and Operations

<details open>
<summary>Available methods</summary>

### [endpoint_groups](docs/sdks/endpointgroups/README.md)

* [delete](docs/sdks/endpointgroups/README.md#delete) - Delete an endpoint group
* [update](docs/sdks/endpointgroups/README.md#update) - Update an endpoint group
* [list](docs/sdks/endpointgroups/README.md#list) - List endpoint groups for the current environment
* [create](docs/sdks/endpointgroups/README.md#create) - Create new endpoint group

### [endpoints](docs/sdks/endpoints/README.md)

* [delete](docs/sdks/endpoints/README.md#delete) - Delete an endpoint
* [update](docs/sdks/endpoints/README.md#update) - Update an endpoint
* [list](docs/sdks/endpoints/README.md#list) - List endpoints for the current environment
* [create](docs/sdks/endpoints/README.md#create) - Create new endpoint

### [event_types](docs/sdks/eventtypes/README.md)

* [delete](docs/sdks/eventtypes/README.md#delete) - Delete an event type
* [update](docs/sdks/eventtypes/README.md#update) - Update an event type
* [list](docs/sdks/eventtypes/README.md#list) - List event types for the current environment
* [create](docs/sdks/eventtypes/README.md#create) - Create new event type


### [webhooks](docs/sdks/webhooks/README.md)

* [send](docs/sdks/webhooks/README.md#send) - Send a webhook to the specified endpoints.

 Webhooks can be sent to endpoints and/or endpoint groups. 
 In order to send a webhook to an endpoint group, the eventType must be specified, then the webhook will be dispatched to all endpoints in the group that are subscribed to the eventType.


</details>
<!-- End Available Resources and Operations [operations] -->

<!-- Start Retries [retries] -->
## Retries

Some of the endpoints in this SDK support retries. If you use the SDK without any configuration, it will fall back to the default retry strategy provided by the API. However, the default retry strategy can be overridden on a per-operation basis, or across the entire SDK.

To change the default retry strategy for a single API call, simply provide a `RetryConfig` object to the call:
```python
from hookhq import HookHQ, models
from hookhq.utils import BackoffStrategy, RetryConfig
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.endpoint_groups.delete(id="grp_a1b2_efgh5678",
        RetryConfig("backoff", BackoffStrategy(1, 50, 1.1, 100), False))

    # Use the SDK ...

```

If you'd like to override the default retry strategy for all operations that support retries, you can use the `retry_config` optional parameter when initializing the SDK:
```python
from hookhq import HookHQ, models
from hookhq.utils import BackoffStrategy, RetryConfig
import os


with HookHQ(
    server_url="https://api.example.com",
    retry_config=RetryConfig("backoff", BackoffStrategy(1, 50, 1.1, 100), False),
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.endpoint_groups.delete(id="grp_a1b2_efgh5678")

    # Use the SDK ...

```
<!-- End Retries [retries] -->

<!-- Start Error Handling [errors] -->
## Error Handling

[`HookHQError`](./src/hookhq/errors/hookhqerror.py) is the base class for all HTTP error responses. It has the following properties:

| Property           | Type             | Description                                            |
| ------------------ | ---------------- | ------------------------------------------------------ |
| `err.message`      | `str`            | Error message                                          |
| `err.status_code`  | `int`            | HTTP response status code eg `404`                     |
| `err.headers`      | `httpx.Headers`  | HTTP response headers                                  |
| `err.body`         | `str`            | HTTP body. Can be empty string if no body is returned. |
| `err.raw_response` | `httpx.Response` | Raw HTTP response                                      |

### Example
```python
from hookhq import HookHQ, errors, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    try:

        hook_hq.endpoint_groups.delete(id="grp_a1b2_efgh5678")

        # Use the SDK ...


    except errors.HookHQError as e:
        # The base class for HTTP error responses
        print(e.message)
        print(e.status_code)
        print(e.body)
        print(e.headers)
        print(e.raw_response)

```

### Error Classes
**Primary error:**
* [`HookHQError`](./src/hookhq/errors/hookhqerror.py): The base class for HTTP error responses.

<details><summary>Less common errors (5)</summary>

<br />

**Network errors:**
* [`httpx.RequestError`](https://www.python-httpx.org/exceptions/#httpx.RequestError): Base class for request errors.
    * [`httpx.ConnectError`](https://www.python-httpx.org/exceptions/#httpx.ConnectError): HTTP client was unable to make a request to a server.
    * [`httpx.TimeoutException`](https://www.python-httpx.org/exceptions/#httpx.TimeoutException): HTTP request timed out.


**Inherit from [`HookHQError`](./src/hookhq/errors/hookhqerror.py)**:
* [`ResponseValidationError`](./src/hookhq/errors/responsevalidationerror.py): Type mismatch between the response data and the expected Pydantic model. Provides access to the Pydantic validation error via the `cause` attribute.

</details>
<!-- End Error Handling [errors] -->

<!-- Start Custom HTTP Client [http-client] -->
## Custom HTTP Client

The Python SDK makes API calls using the [httpx](https://www.python-httpx.org/) HTTP library.  In order to provide a convenient way to configure timeouts, cookies, proxies, custom headers, and other low-level configuration, you can initialize the SDK client with your own HTTP client instance.
Depending on whether you are using the sync or async version of the SDK, you can pass an instance of `HttpClient` or `AsyncHttpClient` respectively, which are Protocol's ensuring that the client has the necessary methods to make API calls.
This allows you to wrap the client with your own custom logic, such as adding custom headers, logging, or error handling, or you can just pass an instance of `httpx.Client` or `httpx.AsyncClient` directly.

For example, you could specify a header for every request that this sdk makes as follows:
```python
from hookhq import HookHQ
import httpx

http_client = httpx.Client(headers={"x-custom-header": "someValue"})
s = HookHQ(client=http_client)
```

or you could wrap the client with your own custom logic:
```python
from hookhq import HookHQ
from hookhq.httpclient import AsyncHttpClient
import httpx

class CustomClient(AsyncHttpClient):
    client: AsyncHttpClient

    def __init__(self, client: AsyncHttpClient):
        self.client = client

    async def send(
        self,
        request: httpx.Request,
        *,
        stream: bool = False,
        auth: Union[
            httpx._types.AuthTypes, httpx._client.UseClientDefault, None
        ] = httpx.USE_CLIENT_DEFAULT,
        follow_redirects: Union[
            bool, httpx._client.UseClientDefault
        ] = httpx.USE_CLIENT_DEFAULT,
    ) -> httpx.Response:
        request.headers["Client-Level-Header"] = "added by client"

        return await self.client.send(
            request, stream=stream, auth=auth, follow_redirects=follow_redirects
        )

    def build_request(
        self,
        method: str,
        url: httpx._types.URLTypes,
        *,
        content: Optional[httpx._types.RequestContent] = None,
        data: Optional[httpx._types.RequestData] = None,
        files: Optional[httpx._types.RequestFiles] = None,
        json: Optional[Any] = None,
        params: Optional[httpx._types.QueryParamTypes] = None,
        headers: Optional[httpx._types.HeaderTypes] = None,
        cookies: Optional[httpx._types.CookieTypes] = None,
        timeout: Union[
            httpx._types.TimeoutTypes, httpx._client.UseClientDefault
        ] = httpx.USE_CLIENT_DEFAULT,
        extensions: Optional[httpx._types.RequestExtensions] = None,
    ) -> httpx.Request:
        return self.client.build_request(
            method,
            url,
            content=content,
            data=data,
            files=files,
            json=json,
            params=params,
            headers=headers,
            cookies=cookies,
            timeout=timeout,
            extensions=extensions,
        )

s = HookHQ(async_client=CustomClient(httpx.AsyncClient()))
```
<!-- End Custom HTTP Client [http-client] -->

<!-- Start Resource Management [resource-management] -->
## Resource Management

The `HookHQ` class implements the context manager protocol and registers a finalizer function to close the underlying sync and async HTTPX clients it uses under the hood. This will close HTTP connections, release memory and free up other resources held by the SDK. In short-lived Python programs and notebooks that make a few SDK method calls, resource management may not be a concern. However, in longer-lived programs, it is beneficial to create a single SDK instance via a [context manager][context-manager] and reuse it across the application.

[context-manager]: https://docs.python.org/3/reference/datamodel.html#context-managers

```python
from hookhq import HookHQ, models
import os
def main():

    with HookHQ(
        server_url="https://api.example.com",
        security=models.Security(
            bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
        ),
    ) as hook_hq:
        # Rest of application here...


# Or when using async:
async def amain():

    async with HookHQ(
        server_url="https://api.example.com",
        security=models.Security(
            bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
        ),
    ) as hook_hq:
        # Rest of application here...
```
<!-- End Resource Management [resource-management] -->

<!-- Start Debugging [debug] -->
## Debugging

You can setup your SDK to emit debug logs for SDK requests and responses.

You can pass your own logger class directly into your SDK.
```python
from hookhq import HookHQ
import logging

logging.basicConfig(level=logging.DEBUG)
s = HookHQ(server_url="https://example.com", debug_logger=logging.getLogger("hookhq"))
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

### SDK Created by [Speakeasy](https://www.speakeasy.com/?utm_source=hookhq&utm_campaign=python)
