import { cloudflareClient } from "better-auth-cloudflare/client";
import { createAuthClient } from "better-auth/react";
import { apiKeyClient, adminClient } from "better-auth/client/plugins"

const client = createAuthClient({
    plugins: [cloudflareClient(), apiKeyClient(), adminClient()],
});

export default client;
