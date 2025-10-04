# PatchEventTypesIdRequestBody

## Example Usage

```typescript
import { PatchEventTypesIdRequestBody } from "hookhq/models/operations";

let value: PatchEventTypesIdRequestBody = {
  name: "User Created",
  description: "User created event",
  schema: {},
  enabled: true,
};
```

## Fields

| Field                                                                                    | Type                                                                                     | Required                                                                                 | Description                                                                              | Example                                                                                  |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `name`                                                                                   | *string*                                                                                 | :heavy_minus_sign:                                                                       | Event type name                                                                          | User Created                                                                             |
| `description`                                                                            | *string*                                                                                 | :heavy_minus_sign:                                                                       | Event type description                                                                   | User created event                                                                       |
| `schema`                                                                                 | [operations.PatchEventTypesIdSchema](../../models/operations/patcheventtypesidschema.md) | :heavy_minus_sign:                                                                       | Event type schema                                                                        | {<br/>"type": "object",<br/>"properties": {<br/>"userId": {<br/>"type": "string"<br/>}<br/>}<br/>} |
| `enabled`                                                                                | *boolean*                                                                                | :heavy_minus_sign:                                                                       | Event type enabled status                                                                | true                                                                                     |