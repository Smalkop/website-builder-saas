import { Hono } from 'hono';
import { Env } from './types';
import router from './router';

const app = new Hono<{ Bindings: Env }>();

app.route('/', router);

export default app;
