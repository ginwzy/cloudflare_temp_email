import { Context } from "hono";
import { handleListQuery } from "../common";

function generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sk-';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function list(c: Context<HonoCustomType>) {
    const { limit, offset } = c.req.query();
    return handleListQuery(c,
        `SELECT * FROM api_keys`,
        `SELECT count(*) as count FROM api_keys`,
        [], limit, offset
    );
}

async function create(c: Context<HonoCustomType>) {
    const { name, max_calls } = await c.req.json();
    if (!name) return c.text("Name is required", 400);
    const api_key = generateApiKey();
    const { success } = await c.env.DB.prepare(
        `INSERT INTO api_keys(name, api_key, max_calls) VALUES(?, ?, ?)`
    ).bind(name, api_key, max_calls || 1000).run();
    if (!success) return c.text("Failed to create API key", 500);
    return c.json({ success: true, api_key });
}

async function remove(c: Context<HonoCustomType>) {
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(
        `DELETE FROM api_keys WHERE id = ?`
    ).bind(id).run();
    return c.json({ success });
}

async function resetUsage(c: Context<HonoCustomType>) {
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(
        `UPDATE api_keys SET used_calls = 0, updated_at = datetime('now') WHERE id = ?`
    ).bind(id).run();
    return c.json({ success });
}

export default { list, create, remove, resetUsage };
