# PostEndpointGroupsRequest


## Fields

| Field                                 | Type                                  | Required                              | Description                           | Example                               |
| ------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------- |
| `name`                                | *string*                              | :heavy_check_mark:                    | Name of the endpoint group            | My Endpoint Group                     |
| `description`                         | *?string*                             | :heavy_minus_sign:                    | Description of the endpoint group     | My Endpoint Group description         |
| `endpointIds`                         | array<*string*>                       | :heavy_minus_sign:                    | List of endpoint IDs                  | [<br/>"ep_a1b2_efgh5678"<br/>]        |
| `enabled`                             | *?bool*                               | :heavy_minus_sign:                    | Whether the endpoint group is enabled | true                                  |