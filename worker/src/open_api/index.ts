import { Hono } from 'hono'

import { newAddress, RAW_MAIL_SUBJECT_SQL } from '../common'

const app = new Hono<HonoCustomType>()

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type ApiKeyRow = {
    id: number;
    is_active: number;
    max_calls: number;
    used_calls: number;
};

type IdempotencyRow = {
    request_hash: string;
    response_body: string;
    status_code: number;
};

const ensureRequestId = (c: any): string => {
    const existing = c.get('requestId') as string | undefined;
    if (existing) return existing;
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);
    return requestId;
};

const setRateLimitHeaders = (
    c: any,
    maxCalls: number,
    usedCalls: number
): void => {
    if (maxCalls === -1) {
        c.header('x-ratelimit-limit', 'unlimited');
        c.header('x-ratelimit-remaining', 'unlimited');
        c.header('x-ratelimit-reset', '-1');
        return;
    }
    const remaining = Math.max(maxCalls - usedCalls, 0);
    c.header('x-ratelimit-limit', String(maxCalls));
    c.header('x-ratelimit-remaining', String(remaining));
    c.header('x-ratelimit-reset', '-1');
};

const jsonError = (
    c: any,
    status: number,
    code: string,
    message: string
): Response => {
    const requestId = ensureRequestId(c);
    c.header('x-request-id', requestId);
    return c.json({
        error: {
            code,
            message,
            request_id: requestId,
        }
    }, status);
};

const parsePagination = (c: any): { limit: number, offset: number } | { error: Response } => {
    const limitRaw = c.req.query('limit') ?? String(DEFAULT_LIMIT);
    const offsetRaw = c.req.query('offset') ?? '0';

    const limit = Number(limitRaw);
    const offset = Number(offsetRaw);

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
        return { error: jsonError(c, 400, 'invalid_limit', `limit must be an integer between 1 and ${MAX_LIMIT}`) };
    }
    if (!Number.isInteger(offset) || offset < 0) {
        return { error: jsonError(c, 400, 'invalid_offset', 'offset must be an integer >= 0') };
    }

    return { limit, offset };
};

const verifyAddressOwnership = async (c: any, address: string): Promise<boolean> => {
    const keyId = c.get('apiKeyId');
    if (!keyId || !address) return false;
    const row = await c.env.DB.prepare(
        `SELECT id FROM api_key_addresses WHERE key_id = ? AND address = ?`
    ).bind(keyId, address).first();
    return !!row;
};

const sha256Hex = async (input: string): Promise<string> => {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

app.use('/v1/*', async (c, next) => {
    const requestId = ensureRequestId(c);
    c.header('x-request-id', requestId);

    const apiKey = c.req.header('x-api-key');
    if (!apiKey) {
        return jsonError(c, 401, 'missing_api_key', 'Missing x-api-key header');
    }

    const row = await c.env.DB.prepare(
        `SELECT id, is_active, max_calls, used_calls FROM api_keys WHERE api_key = ?`
    ).bind(apiKey).first<ApiKeyRow>();

    if (!row) return jsonError(c, 401, 'invalid_api_key', 'Invalid API key');
    if (!row.is_active) return jsonError(c, 403, 'api_key_disabled', 'API key is disabled');

    const maxCalls = typeof row.max_calls === 'number' ? row.max_calls : -1;
    if (maxCalls !== -1 && row.used_calls >= maxCalls) {
        setRateLimitHeaders(c, maxCalls, row.used_calls);
        return jsonError(c, 429, 'quota_exceeded', 'API key usage limit exceeded');
    }

    const reqIp = c.req.raw.headers.get('cf-connecting-ip');
    const updateResult: any = await c.env.DB.prepare(
        `UPDATE api_keys
         SET used_calls = used_calls + 1,
             last_used_at = datetime('now'),
             last_used_ip = ?,
             updated_at = datetime('now')
         WHERE id = ? AND (max_calls = -1 OR used_calls < max_calls)`
    ).bind(reqIp, row.id).run();

    const latest = await c.env.DB.prepare(
        `SELECT used_calls, max_calls FROM api_keys WHERE id = ?`
    ).bind(row.id).first<{ used_calls: number, max_calls: number }>();

    const latestUsedCalls = latest?.used_calls ?? row.used_calls;
    const latestMaxCalls = latest?.max_calls ?? maxCalls;

    setRateLimitHeaders(c, latestMaxCalls, latestUsedCalls);

    const didConsumeQuota = Number(updateResult?.meta?.changes || 0) > 0;
    if (latestMaxCalls !== -1 && !didConsumeQuota) {
        return jsonError(c, 429, 'quota_exceeded', 'API key usage limit exceeded');
    }

    c.set('apiKeyId', row.id);

    await next();
});

app.post('/v1/addresses', async (c) => {
    const { name, domain, tags } = await c.req.json<{
        name?: string;
        domain?: string;
        tags?: string[];
    }>();

    if (!name || typeof name !== 'string') {
        return jsonError(c, 400, 'invalid_name', 'name is required');
    }
    if (tags !== undefined && !Array.isArray(tags)) {
        return jsonError(c, 400, 'invalid_tags', 'tags must be an array of strings');
    }
    if (tags && tags.some((t) => typeof t !== 'string')) {
        return jsonError(c, 400, 'invalid_tags', 'tags must be an array of strings');
    }

    const idempotencyKey = c.req.header('Idempotency-Key')?.trim() || null;
    if (idempotencyKey && idempotencyKey.length > 128) {
        return jsonError(c, 400, 'invalid_idempotency_key', 'Idempotency-Key must be <= 128 characters');
    }

    const requestHash = await sha256Hex(JSON.stringify({
        name,
        domain: domain || null,
        tags: tags || null,
    }));

    const keyId = c.get('apiKeyId');

    if (idempotencyKey) {
        const existed = await c.env.DB.prepare(
            `SELECT request_hash, response_body, status_code
             FROM api_idempotency
             WHERE key_id = ? AND idem_key = ? AND method = 'POST' AND path = '/v1/addresses'`
        ).bind(keyId, idempotencyKey).first<IdempotencyRow>();

        if (existed) {
            if (existed.request_hash !== requestHash) {
                return jsonError(c, 409, 'idempotency_conflict', 'Idempotency-Key already used with a different request payload');
            }
            c.header('idempotent-replayed', 'true');
            return c.json(JSON.parse(existed.response_body), existed.status_code || 201);
        }
    }

    try {
        const res = await newAddress(c, {
            name,
            domain,
            enablePrefix: false,
            checkLengthByConfig: false,
            addressPrefix: null,
            checkAllowDomains: true,
            enableCheckNameRegex: false,
            sourceMeta: 'api_key',
            tags: tags || null,
        });

        await c.env.DB.prepare(
            `INSERT INTO api_key_addresses(key_id, address) VALUES(?, ?)`
        ).bind(keyId, res.address).run();

        const responseBody = { address: res.address };

        if (idempotencyKey) {
            try {
                await c.env.DB.prepare(
                    `INSERT INTO api_idempotency(key_id, idem_key, method, path, request_hash, response_body, status_code)
                     VALUES(?, ?, 'POST', '/v1/addresses', ?, ?, ?)`
                ).bind(keyId, idempotencyKey, requestHash, JSON.stringify(responseBody), 201).run();
            } catch {
                const existed = await c.env.DB.prepare(
                    `SELECT request_hash, response_body, status_code
                     FROM api_idempotency
                     WHERE key_id = ? AND idem_key = ? AND method = 'POST' AND path = '/v1/addresses'`
                ).bind(keyId, idempotencyKey).first<IdempotencyRow>();
                if (existed) {
                    if (existed.request_hash !== requestHash) {
                        return jsonError(c, 409, 'idempotency_conflict', 'Idempotency-Key already used with a different request payload');
                    }
                    c.header('idempotent-replayed', 'true');
                    return c.json(JSON.parse(existed.response_body), existed.status_code || 201);
                }
            }
        }

        return c.json(responseBody, 201);
    } catch (e) {
        return jsonError(c, 400, 'address_create_failed', (e as Error).message);
    }
});

app.get('/v1/addresses', async (c) => {
    const keyId = c.get('apiKeyId');
    const paging = parsePagination(c);
    if ('error' in paging) return paging.error;

    const { results } = await c.env.DB.prepare(
        `SELECT id, address, created_at
         FROM api_key_addresses
         WHERE key_id = ?
         ORDER BY id DESC
         LIMIT ? OFFSET ?`
    ).bind(keyId, paging.limit, paging.offset).all();

    const count = paging.offset === 0
        ? await c.env.DB.prepare(
            `SELECT count(*) as count FROM api_key_addresses WHERE key_id = ?`
        ).bind(keyId).first<number>('count')
        : 0;

    return c.json({
        results: results || [],
        count: count || 0,
    });
});

app.get('/v1/addresses/:address/mails', async (c) => {
    const address = decodeURIComponent(c.req.param('address'));
    if (!address) return jsonError(c, 400, 'missing_address', 'Address is required');

    const isOwner = await verifyAddressOwnership(c, address);
    if (!isOwner) return jsonError(c, 403, 'address_not_owned', 'Address not found or not owned by this API key');

    const paging = parsePagination(c);
    if ('error' in paging) return paging.error;

    try {
        const { results } = await c.env.DB.prepare(
            `SELECT id, message_id, source, COALESCE(NULLIF(subject, ''), (${RAW_MAIL_SUBJECT_SQL})) as subject, address, metadata, created_at
             FROM raw_mails
             WHERE address = ?
             ORDER BY id DESC
             LIMIT ? OFFSET ?`
        ).bind(address, paging.limit, paging.offset).all();

        const count = paging.offset === 0
            ? await c.env.DB.prepare(
                `SELECT count(*) as count FROM raw_mails WHERE address = ?`
            ).bind(address).first<number>('count')
            : 0;

        return c.json({
            results: results || [],
            count: count || 0,
        });
    } catch (error) {
        const errorMessage = `${error}`;
        if (!errorMessage.includes('no such column: subject')) {
            throw error;
        }

        const { results } = await c.env.DB.prepare(
            `SELECT id, message_id, source, (${RAW_MAIL_SUBJECT_SQL}) as subject, address, metadata, created_at
             FROM raw_mails
             WHERE address = ?
             ORDER BY id DESC
             LIMIT ? OFFSET ?`
        ).bind(address, paging.limit, paging.offset).all();

        const count = paging.offset === 0
            ? await c.env.DB.prepare(
                `SELECT count(*) as count FROM raw_mails WHERE address = ?`
            ).bind(address).first<number>('count')
            : 0;

        return c.json({
            results: results || [],
            count: count || 0,
        });
    }
});

app.get('/v1/mails/:id', async (c) => {
    const { id } = c.req.param();
    const mailId = Number(id);
    if (!Number.isInteger(mailId) || mailId < 1) {
        return jsonError(c, 400, 'invalid_mail_id', 'mail id must be a positive integer');
    }

    const keyId = c.get('apiKeyId');
    const result = await c.env.DB.prepare(
        `SELECT raw_mails.*
         FROM raw_mails
         INNER JOIN api_key_addresses ON api_key_addresses.address = raw_mails.address
         WHERE raw_mails.id = ? AND api_key_addresses.key_id = ?`
    ).bind(mailId, keyId).first();

    if (!result) return jsonError(c, 404, 'mail_not_found', 'Mail not found');
    return c.json(result);
});

app.get('/v1/mails/:id/extract', async (c) => {
    const { id } = c.req.param();
    const mailId = Number(id);
    if (!Number.isInteger(mailId) || mailId < 1) {
        return jsonError(c, 400, 'invalid_mail_id', 'mail id must be a positive integer');
    }

    const keyId = c.get('apiKeyId');
    const result = await c.env.DB.prepare(
        `SELECT raw_mails.metadata
         FROM raw_mails
         INNER JOIN api_key_addresses ON api_key_addresses.address = raw_mails.address
         WHERE raw_mails.id = ? AND api_key_addresses.key_id = ?`
    ).bind(mailId, keyId).first<{ metadata: string }>();

    if (!result) return jsonError(c, 404, 'mail_not_found', 'Mail not found');

    try {
        const metadata = JSON.parse(result.metadata || '{}');
        return c.json({ ai_extract: metadata.ai_extract || null });
    } catch {
        return c.json({ ai_extract: null });
    }
});

app.delete('/v1/addresses/:address', async (c) => {
    const address = decodeURIComponent(c.req.param('address'));
    if (!address) return jsonError(c, 400, 'missing_address', 'Address is required');

    const isOwner = await verifyAddressOwnership(c, address);
    if (!isOwner) return jsonError(c, 403, 'address_not_owned', 'Address not found or not owned by this API key');

    const addr = await c.env.DB.prepare(
        `SELECT id FROM address WHERE name = ?`
    ).bind(address).first<{ id: number }>();

    if (!addr) return jsonError(c, 404, 'address_not_found', 'Address not found');

    await c.env.DB.prepare(`DELETE FROM raw_mails WHERE address = ?`).bind(address).run();
    await c.env.DB.prepare(`DELETE FROM sendbox WHERE address = ?`).bind(address).run();
    await c.env.DB.prepare(`DELETE FROM address_sender WHERE address = ?`).bind(address).run();
    await c.env.DB.prepare(`DELETE FROM auto_reply_mails WHERE address = ?`).bind(address).run();
    await c.env.DB.prepare(`DELETE FROM users_address WHERE address_id = ?`).bind(addr.id).run();
    await c.env.DB.prepare(`DELETE FROM api_key_addresses WHERE address = ?`).bind(address).run();

    const { success } = await c.env.DB.prepare(
        `DELETE FROM address WHERE name = ?`
    ).bind(address).run();

    if (!success) return jsonError(c, 500, 'delete_failed', 'Failed to delete address');
    return c.json({ success: true });
});

export const api = app;
