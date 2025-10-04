<!-- Start SDK Example Usage [usage] -->
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