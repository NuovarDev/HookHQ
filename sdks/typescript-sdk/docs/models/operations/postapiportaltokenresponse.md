# PostApiPortalTokenResponse

JWT token generated successfully

## Example Usage

```typescript
import { PostApiPortalTokenResponse } from "hookhq/models/operations";

let value: PostApiPortalTokenResponse = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  portalUrl: "http://localhost:3000/portal?token=...",
  expiresIn: 86400,
  endpointGroup: {
    id: "grp_a1b2_efgh5678",
    name: "My Endpoint Group",
    environmentId: "a12b",
  },
};
```

## Fields

| Field                                                                | Type                                                                 | Required                                                             | Description                                                          |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `token`                                                              | *string*                                                             | :heavy_minus_sign:                                                   | JWT token for portal access                                          |
| `portalUrl`                                                          | *string*                                                             | :heavy_minus_sign:                                                   | URL to the portal with token                                         |
| `expiresIn`                                                          | *number*                                                             | :heavy_minus_sign:                                                   | Token expiration time in seconds                                     |
| `endpointGroup`                                                      | [operations.EndpointGroup](../../models/operations/endpointgroup.md) | :heavy_minus_sign:                                                   | Endpoint group information                                           |