import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { publicApiApp } from "./app";

const app = new Hono();
app.use(cors());
app.use(logger());

if (process.env.NEXT_PUBLIC_API_DOCS_ENABLED === 'true') {
  app.get('/', (c) => {
    return c.redirect(`/api/v1/ui`, 301);
  });

  app.get('/api/v1', (c) => {
    return c.redirect(`/api/v1/ui`, 301);
  });
}

app.route('/api/v1', publicApiApp);

app.get('*', (c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default app;
