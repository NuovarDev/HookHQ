# PostApiPortalTokenRequest

## Example Usage

```typescript
import { PostApiPortalTokenRequest } from "hookhq/models/operations";

let value: PostApiPortalTokenRequest = {
  endpointGroupId: "grp_a1b2_efgh5678",
  allowedEventTypes: [
    "user.created",
    "user.updated",
  ],
  applicationName: "My Application",
  returnUrl: "https://myapp.com/settings",
};
```

## Fields

| Field                                         | Type                                          | Required                                      | Description                                   | Example                                       |
| --------------------------------------------- | --------------------------------------------- | --------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| `endpointGroupId`                             | *string*                                      | :heavy_check_mark:                            | ID of the endpoint group to manage            | grp_a1b2_efgh5678                             |
| `allowedEventTypes`                           | *string*[]                                    | :heavy_minus_sign:                            | List of event types the user can subscribe to | [<br/>"user.created",<br/>"user.updated"<br/>] |
| `applicationName`                             | *string*                                      | :heavy_minus_sign:                            | Name of the application for the back button   | My Application                                |
| `returnUrl`                                   | *string*                                      | :heavy_minus_sign:                            | URL to return to when user clicks back button | https://myapp.com/settings                    |