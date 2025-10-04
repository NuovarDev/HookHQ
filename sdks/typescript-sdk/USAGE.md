<!-- Start SDK Example Usage [usage] -->
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