import { createServer } from "node:http";
import { createProxyRelayHandler } from "hookhq-relay";

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const handler = createProxyRelayHandler();

createServer((request, response) => {
  void handler(request, response);
}).listen(PORT, () => {
  console.log(`HookHQ relay listening on ${PORT}`);
});
