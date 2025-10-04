# PatchEventTypesIdRequest

## Example Usage

```typescript
import { PatchEventTypesIdRequest } from "hookhq/models/operations";

let value: PatchEventTypesIdRequest = {
  id: "user.created",
  requestBody: {
    name: "User Created",
    description: "User created event",
    schema: {},
    enabled: true,
  },
};
```

## Fields

| Field                                                                                              | Type                                                                                               | Required                                                                                           | Description                                                                                        | Example                                                                                            |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `id`                                                                                               | *string*                                                                                           | :heavy_check_mark:                                                                                 | Event type ID                                                                                      | user.created                                                                                       |
| `requestBody`                                                                                      | [operations.PatchEventTypesIdRequestBody](../../models/operations/patcheventtypesidrequestbody.md) | :heavy_check_mark:                                                                                 | N/A                                                                                                |                                                                                                    |