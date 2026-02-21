import { Hono } from 'hono'
import { Jwt } from 'hono/utils/jwt'

import { newAddress, handleListQuery } from '../common'

const app = new Hono<HonoCustomType>()

// API Key auth middleware
app.use('/open_api/api/*', async (c, next) => {
    const apiKey = c.req.header('x-api-key');
    if (!apiKey) return c.text("Missing x-api-key header", 401);

    const row = await c.env.DB.prepare(
        `SELECT id, is_active, max_calls, used_calls FROM api_keys WHERE api_key = ?`
    ).bind(apiKey).first<{ id: number, is_active: number, max_calls: number, used_calls: number }>();

    if (!row) return c.text("Invalid API key", 401);
    if (!row.is_active) return c.text("API key is disabled", 403);
    if (row.used_calls >= row.max_calls) return c.text("API key usage limit exceeded", 429);

    // atomic increment
    await c.env.DB.prepare(
        `UPDATE api_keys SET used_calls = used_calls + 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(row.id).run();

    await next();
});

// JWT verification helper
const verifyJwt = async (c: any) => {
    const token = c.req.query('jwt');
    if (!token) return null;
    try {
        return await Jwt.verify(token, c.env.JWT_SECRET, "HS256");
    } catch {
        return null;
    }
};

// Create temp address
app.post('/open_api/api/address/create', async (c) => {
    const { name, domain } = await c.req.json();
    if (!name) return c.text("Name is required", 400);
    try {
        const res = await newAddress(c, {
            name, domain, enablePrefix: false,
            checkLengthByConfig: false, addressPrefix: null,
            checkAllowDomains: true, enableCheckNameRegex: false,
            sourceMeta: 'api_key'
        });
        return c.json({ address: res.address, jwt: res.jwt });
    } catch (e) {
        return c.text((e as Error).message, 400);
    }
});

// List mails
app.get('/open_api/api/mails', async (c) => {
    const payload = await verifyJwt(c);
    if (!payload?.address) return c.text("Invalid JWT", 401);
    const { limit, offset } = c.req.query();
    return handleListQuery(c,
        `SELECT id, message_id, source, address, metadata, created_at FROM raw_mails WHERE address = ?`,
        `SELECT count(*) as count FROM raw_mails WHERE address = ?`,
        [payload.address as string], limit || '20', offset || '0'
    );
});

// Get single mail
app.get('/open_api/api/mail/:id', async (c) => {
    const payload = await verifyJwt(c);
    if (!payload?.address) return c.text("Invalid JWT", 401);
    const { id } = c.req.param();
    const result = await c.env.DB.prepare(
        `SELECT * FROM raw_mails WHERE id = ? AND address = ?`
    ).bind(id, payload.address).first();
    if (!result) return c.text("Mail not found", 404);
    return c.json(result);
});

// Get AI extract result
app.get('/open_api/api/address/extract/:mail_id', async (c) => {
    const payload = await verifyJwt(c);
    if (!payload?.address) return c.text("Invalid JWT", 401);
    const { mail_id } = c.req.param();
    const result = await c.env.DB.prepare(
        `SELECT metadata FROM raw_mails WHERE id = ? AND address = ?`
    ).bind(mail_id, payload.address).first<{ metadata: string }>();
    if (!result) return c.text("Mail not found", 404);
    try {
        const metadata = JSON.parse(result.metadata || '{}');
        return c.json({ ai_extract: metadata.ai_extract || null });
    } catch {
        return c.json({ ai_extract: null });
    }
});

export const api = app;
