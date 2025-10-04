# PostEventTypesRequest

## Example Usage

```typescript
import { PostEventTypesRequest } from "hookhq/models/operations";

let value: PostEventTypesRequest = {
  name: "User Created",
  description: "User created event",
  schema: {},
  enabled: true,
};
```

## Fields

| Field                                                                                                                 | Type                                                                                                                  | Required                                                                                                              | Description                                                                                                           | Example                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `name`                                                                                                                | *string*                                                                                                              | :heavy_check_mark:                                                                                                    | Name of the event type                                                                                                | User Created                                                                                                          |
| `description`                                                                                                         | *string*                                                                                                              | :heavy_minus_sign:                                                                                                    | Description of the event type                                                                                         | User created event                                                                                                    |
| `schema`                                                                                                              | [operations.PostEventTypesSchema](../../models/operations/posteventtypesschema.md)                                    | :heavy_minus_sign:                                                                                                    | JSON Schema for event payload validation (must be valid JSON Schema)                                                  | {<br/>  "type": "object",<br/>  "properties": {<br/>    "userId": {<br/>      "type": "string"<br/>    }<br/>  },<br/>  "required": ["userId"]<br/>}<br/> |
| `enabled`                                                                                                             | *boolean*                                                                                                             | :heavy_minus_sign:                                                                                                    | Whether the event type is enabled                                                                                     | true                                                                                                                  |