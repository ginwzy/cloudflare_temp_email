import { Context } from "hono";
import { handleListQuery } from "../common";

function generateApiKey(): string {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
    return `sk-${token}`;
}

async function list(c: Context<HonoCustomType>) {
    const { limit, offset } = c.req.query();
    return handleListQuery(c,
        `SELECT id, name, substr(api_key, 1, 10) || '...' || substr(api_key, -4) as api_key, max_calls, used_calls, is_active, last_used_at, last_used_ip, created_at, updated_at FROM api_keys`,
        `SELECT count(*) as count FROM api_keys`,
        [], limit, offset
    );
}

async function create(c: Context<HonoCustomType>) {
    const { name, max_calls, unlimited } = await c.req.json<{
        name?: string;
        max_calls?: number | null;
        unlimited?: boolean;
    }>();
    if (!name) return c.text("Name is required", 400);
    const normalizedName = name.trim();
    if (!normalizedName) return c.text("Name is required", 400);

    let normalizedMaxCalls = 1000;
    if (unlimited === true) {
        normalizedMaxCalls = -1;
    } else if (typeof max_calls === "number") {
        if (!Number.isInteger(max_calls) || max_calls < 1) {
            return c.text("max_calls must be a positive integer", 400);
        }
        normalizedMaxCalls = max_calls;
    }

    const api_key = generateApiKey();
    const { success } = await c.env.DB.prepare(
        `INSERT INTO api_keys(name, api_key, max_calls) VALUES(?, ?, ?)`
    ).bind(normalizedName, api_key, normalizedMaxCalls).run();
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
