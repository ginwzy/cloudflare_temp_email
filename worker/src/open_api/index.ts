import { Hono } from 'hono'

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

    // Store key_id in context for ownership checks
    c.set('apiKeyId', row.id);

    await next();
});

// Verify that the given address belongs to the current API key
const verifyAddressOwnership = async (c: any, address: string): Promise<boolean> => {
    const keyId = c.get('apiKeyId');
    if (!keyId || !address) return false;
    const row = await c.env.DB.prepare(
        `SELECT id FROM api_key_addresses WHERE key_id = ? AND address = ?`
    ).bind(keyId, address).first();
    return !!row;
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
        // Link address to this API key
        const keyId = c.get('apiKeyId');
        await c.env.DB.prepare(
            `INSERT INTO api_key_addresses(key_id, address) VALUES(?, ?)`
        ).bind(keyId, res.address).run();
        return c.json({ address: res.address });
    } catch (e) {
        return c.text((e as Error).message, 400);
    }
});

// List addresses for this API key
app.get('/open_api/api/addresses', async (c) => {
    const keyId = c.get('apiKeyId');
    const { limit, offset } = c.req.query();
    return handleListQuery(c,
        `SELECT id, address, created_at FROM api_key_addresses WHERE key_id = ?`,
        `SELECT count(*) as count FROM api_key_addresses WHERE key_id = ?`,
        [String(keyId)], limit || '20', offset || '0'
    );
});

// List mails
app.get('/open_api/api/mails', async (c) => {
    const address = c.req.query('address');
    if (!address) return c.text("Missing address parameter", 400);
    const isOwner = await verifyAddressOwnership(c, address);
    if (!isOwner) return c.text("Address not found or not owned by this API key", 403);
    const { limit, offset } = c.req.query();
    return handleListQuery(c,
        `SELECT id, message_id, source, address, metadata, created_at FROM raw_mails WHERE address = ?`,
        `SELECT count(*) as count FROM raw_mails WHERE address = ?`,
        [address], limit || '20', offset || '0'
    );
});

// Get single mail
app.get('/open_api/api/mail/:id', async (c) => {
    const address = c.req.query('address');
    if (!address) return c.text("Missing address parameter", 400);
    const isOwner = await verifyAddressOwnership(c, address);
    if (!isOwner) return c.text("Address not found or not owned by this API key", 403);
    const { id } = c.req.param();
    const result = await c.env.DB.prepare(
        `SELECT * FROM raw_mails WHERE id = ? AND address = ?`
    ).bind(id, address).first();
    if (!result) return c.text("Mail not found", 404);
    return c.json(result);
});

// Get AI extract result
app.get('/open_api/api/address/extract/:mail_id', async (c) => {
    const address = c.req.query('address');
    if (!address) return c.text("Missing address parameter", 400);
    const isOwner = await verifyAddressOwnership(c, address);
    if (!isOwner) return c.text("Address not found or not owned by this API key", 403);
    const { mail_id } = c.req.param();
    const result = await c.env.DB.prepare(
        `SELECT metadata FROM raw_mails WHERE id = ? AND address = ?`
    ).bind(mail_id, address).first<{ metadata: string }>();
    if (!result) return c.text("Mail not found", 404);
    try {
        const metadata = JSON.parse(result.metadata || '{}');
        return c.json({ ai_extract: metadata.ai_extract || null });
    } catch {
        return c.json({ ai_extract: null });
    }
});

export const api = app;
