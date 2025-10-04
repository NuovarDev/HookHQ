<!-- Start SDK Example Usage [usage] -->
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