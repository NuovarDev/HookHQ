# nuovar/hookhq

Developer-friendly & type-safe Php SDK specifically catered to leverage *nuovar/hookhq* API.

<div align="left">
    <a href="https://www.speakeasy.com/?utm_source=nuovar/hookhq&utm_campaign=php"><img src="https://www.speakeasy.com/assets/badges/built-by-speakeasy.svg" /></a>
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
* [nuovar/hookhq](#nuovarhookhq)
  * [SDK Installation](#sdk-installation)
  * [SDK Example Usage](#sdk-example-usage)
  * [Authentication](#authentication)
  * [Available Resources and Operations](#available-resources-and-operations)
  * [Retries](#retries)
  * [Error Handling](#error-handling)
* [Development](#development)
  * [Maturity](#maturity)
  * [Contributions](#contributions)

<!-- End Table of Contents [toc] -->

<!-- Start SDK Installation [installation] -->
## SDK Installation

> [!TIP]
> To finish publishing your SDK you must [run your first generation action](https://www.speakeasy.com/docs/github-setup#step-by-step-guide).


The SDK relies on [Composer](https://getcomposer.org/) to manage its dependencies.

To install the SDK first add the below to your `composer.json` file:

```json
{
    "repositories": [
        {
            "type": "github",
            "url": "<UNSET>.git"
        }
    ],
    "require": {
        "nuovar/hookhq": "*"
    }
}
```

Then run the following command:

```bash
composer update
```
<!-- End SDK Installation [installation] -->

<!-- Start SDK Example Usage [usage] -->
## SDK Example Usage

### Example

```php
declare(strict_types=1);

require 'vendor/autoload.php';

use Nuovar\HookHQ;
use Nuovar\HookHQ\Models\Components;

$sdk = HookHQ\HookHQ::builder()
    ->setSecurity(
        new Components\Security(
            bearerAuth: '<YOUR_BEARER_TOKEN_HERE>',
        )
    )
    ->build();



$response = $sdk->endpointGroups->delete(
    id: 'grp_a1b2_efgh5678'
);

if ($response->statusCode === 200) {
    // handle response
}
```
<!-- End SDK Example Usage [usage] -->

<!-- Start Authentication [security] -->
## Authentication

### Per-Client Security Schemes

This SDK supports the following security schemes globally:

| Name           | Type   | Scheme      |
| -------------- | ------ | ----------- |
| `bearerAuth`   | http   | HTTP Bearer |
| `apiKeyCookie` | apiKey | API key     |

You can set the security parameters through the `setSecurity` function on the `SDKBuilder` when initializing the SDK. The selected scheme will be used by default to authenticate with the API for all operations that support it. For example:
```php
declare(strict_types=1);

require 'vendor/autoload.php';

use Nuovar\HookHQ;
use Nuovar\HookHQ\Models\Components;

$sdk = HookHQ\HookHQ::builder()
    ->setSecurity(
        new Components\Security(
            bearerAuth: '<YOUR_BEARER_TOKEN_HERE>',
        )
    )
    ->build();



$response = $sdk->endpointGroups->delete(
    id: 'grp_a1b2_efgh5678'
);

if ($response->statusCode === 200) {
    // handle response
}
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


### [webhooks](docs/sdks/webhooks/README.md)

* [send](docs/sdks/webhooks/README.md#send) - Send a webhook to the specified endpoints.

 Webhooks can be sent to endpoints and/or endpoint groups. 
 In order to send a webhook to an endpoint group, the eventType must be specified, then the webhook will be dispatched to all endpoints in the group that are subscribed to the eventType.


</details>
<!-- End Available Resources and Operations [operations] -->

<!-- Start Retries [retries] -->
## Retries

Some of the endpoints in this SDK support retries. If you use the SDK without any configuration, it will fall back to the default retry strategy provided by the API. However, the default retry strategy can be overridden on a per-operation basis, or across the entire SDK.

To change the default retry strategy for a single API call, simply provide an `Options` object built with a `RetryConfig` object to the call:
```php
declare(strict_types=1);

require 'vendor/autoload.php';

use Nuovar\HookHQ;
use Nuovar\HookHQ\Models\Components;
use Nuovar\HookHQ\Utils\Retry;

$sdk = HookHQ\HookHQ::builder()
    ->setSecurity(
        new Components\Security(
            bearerAuth: '<YOUR_BEARER_TOKEN_HERE>',
        )
    )
    ->build();



$response = $sdk->endpointGroups->delete(
    id: 'grp_a1b2_efgh5678',
    options: Utils\Options->builder()->setRetryConfig(
        new Retry\RetryConfigBackoff(
            initialInterval: 1,
            maxInterval:     50,
            exponent:        1.1,
            maxElapsedTime:  100,
            retryConnectionErrors: false,
        ))->build()

);

if ($response->statusCode === 200) {
    // handle response
}
```

If you'd like to override the default retry strategy for all operations that support retries, you can pass a `RetryConfig` object to the `SDKBuilder->setRetryConfig` function when initializing the SDK:
```php
declare(strict_types=1);

require 'vendor/autoload.php';

use Nuovar\HookHQ;
use Nuovar\HookHQ\Models\Components;
use Nuovar\HookHQ\Utils\Retry;

$sdk = HookHQ\HookHQ::builder()
    ->setRetryConfig(
        new Retry\RetryConfigBackoff(
            initialInterval: 1,
            maxInterval:     50,
            exponent:        1.1,
            maxElapsedTime:  100,
            retryConnectionErrors: false,
        )
  )
    ->setSecurity(
        new Components\Security(
            bearerAuth: '<YOUR_BEARER_TOKEN_HERE>',
        )
    )
    ->build();



$response = $sdk->endpointGroups->delete(
    id: 'grp_a1b2_efgh5678'
);

if ($response->statusCode === 200) {
    // handle response
}
```
<!-- End Retries [retries] -->

<!-- Start Error Handling [errors] -->
## Error Handling

Handling errors in this SDK should largely match your expectations. All operations return a response object or throw an exception.

By default an API error will raise a `Errors\APIException` exception, which has the following properties:

| Property       | Type                                    | Description           |
|----------------|-----------------------------------------|-----------------------|
| `$message`     | *string*                                | The error message     |
| `$statusCode`  | *int*                                   | The HTTP status code  |
| `$rawResponse` | *?\Psr\Http\Message\ResponseInterface*  | The raw HTTP response |
| `$body`        | *string*                                | The response content  |

When custom error responses are specified for an operation, the SDK may also throw their associated exception. You can refer to respective *Errors* tables in SDK docs for more details on possible exception types for each operation. For example, the `delete` method throws the following exceptions:

| Error Type          | Status Code | Content Type |
| ------------------- | ----------- | ------------ |
| Errors\APIException | 4XX, 5XX    | \*/\*        |

### Example

```php
declare(strict_types=1);

require 'vendor/autoload.php';

use Nuovar\HookHQ;
use Nuovar\HookHQ\Models\Components;

$sdk = HookHQ\HookHQ::builder()
    ->setSecurity(
        new Components\Security(
            bearerAuth: '<YOUR_BEARER_TOKEN_HERE>',
        )
    )
    ->build();

try {
    $response = $sdk->endpointGroups->delete(
        id: 'grp_a1b2_efgh5678'
    );

    if ($response->statusCode === 200) {
        // handle response
    }
} catch (Errors\APIException $e) {
    // handle default exception
    throw $e;
}
```
<!-- End Error Handling [errors] -->

<!-- Placeholder for Future Speakeasy SDK Sections -->

# Development

## Maturity

This SDK is in beta, and there may be breaking changes between versions without a major version update. Therefore, we recommend pinning usage
to a specific package version. This way, you can install the same version each time without breaking changes unless you are intentionally
looking for the latest version.

## Contributions

While we value open-source contributions to this SDK, this library is generated programmatically. Any manual changes added to internal files will be overwritten on the next generation. 
We look forward to hearing your feedback. Feel free to open a PR or an issue with a proof of concept and we'll do our best to include it in a future release. 

### SDK Created by [Speakeasy](https://www.speakeasy.com/?utm_source=nuovar/hookhq&utm_campaign=php)
