# PostEndpointGroupsRequest

## Example Usage

```typescript
import { PostEndpointGroupsRequest } from "hookhq/models/operations";

let value: PostEndpointGroupsRequest = {
  name: "My Endpoint Group",
  description: "My Endpoint Group description",
  endpointIds: [
    "ep_a1b2_efgh5678",
  ],
  enabled: true,
};
```

## Fields

| Field                                 | Type                                  | Required                              | Description                           | Example                               |
| ------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------- |
| `name`                                | *string*                              | :heavy_check_mark:                    | Name of the endpoint group            | My Endpoint Group                     |
| `description`                         | *string*                              | :heavy_minus_sign:                    | Description of the endpoint group     | My Endpoint Group description         |
| `endpointIds`                         | *string*[]                            | :heavy_minus_sign:                    | List of endpoint IDs                  | [<br/>"ep_a1b2_efgh5678"<br/>]        |
| `enabled`                             | *boolean*                             | :heavy_minus_sign:                    | Whether the endpoint group is enabled | true                                  |