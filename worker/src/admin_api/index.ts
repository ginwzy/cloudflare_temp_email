import { Hono } from 'hono'
import { Jwt } from 'hono/utils/jwt'

import i18n from '../i18n'
import { sendAdminInternalMail, getJsonSetting, saveSetting, getUserRoles, getBooleanValue, hashPassword } from '../utils'
import { newAddress, handleListQuery } from '../common'
import { CONSTANTS } from '../constants'
import cleanup_api from './cleanup_api'
import admin_user_api from './admin_user_api'
import webhook_settings from './webhook_settings'
import mail_webhook_settings from './mail_webhook_settings'
import oauth2_settings from './oauth2_settings'
import worker_config from './worker_config'
import admin_mail_api from './admin_mail_api'
import { sendMailbyAdmin } from './send_mail'
import db_api from './db_api'
import ip_blacklist_settings from './ip_blacklist_settings'
import ai_extract_settings from './ai_extract_settings'
import api_key_api from './api_key_api'
import { EmailRuleSettings } from '../models'

export const api = new Hono<HonoCustomType>()

api.get('/admin/address', async (c) => {
    const { limit, offset, query, tag, source_meta, date_from, date_to } = c.req.query();

    const conditions: string[] = [];
    const params: string[] = [];

    if (query) {
        conditions.push(`a.name like ?`);
        params.push(`%${query}%`);
    }
    if (tag) {
        conditions.push(`EXISTS (SELECT 1 FROM json_each(a.tags) WHERE json_each.value = ?)`);
        params.push(tag);
    }
    if (source_meta) {
        conditions.push(`a.source_meta = ?`);
        params.push(source_meta);
    }
    if (date_from) {
        conditions.push(`a.created_at >= ?`);
        params.push(date_from);
    }
    if (date_to) {
        conditions.push(`a.created_at <= ?`);
        params.push(date_to + ' 23:59:59');
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const selectBase = `SELECT a.*,`
        + ` (SELECT COUNT(*) FROM raw_mails WHERE address = a.name) AS mail_count,`
        + ` (SELECT COUNT(*) FROM sendbox WHERE address = a.name) AS send_count`
        + ` FROM address a`;
    const countBase = `SELECT count(*) as count FROM address a`;

    return await handleListQuery(c,
        selectBase + whereClause,
        countBase + whereClause,
        params, limit, offset
    );
})

api.post('/admin/new_address', async (c) => {
    const { name, domain, enablePrefix, tags } = await c.req.json();
    const msgs = i18n.getMessagesbyContext(c);
    if (!name) {
        return c.text(msgs.RequiredFieldMsg, 400)
    }
    try {
        const res = await newAddress(c, {
            name, domain, enablePrefix,
            checkLengthByConfig: false,
            addressPrefix: null,
            checkAllowDomains: false,
            enableCheckNameRegex: false,
            sourceMeta: 'admin',
            tags: tags || null,
        });

        return c.json(res);
    } catch (e) {
        return c.text(`${msgs.FailedCreateAddressMsg}: ${(e as Error).message}`, 400)
    }
})

api.delete('/admin/delete_address/:id', async (c) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    // Fetch address name before deleting so cleanup queries can use it
    const addr = await c.env.DB.prepare(
        `SELECT name FROM address WHERE id = ?`
    ).bind(id).first<{ name: string }>();
    if (!addr) {
        return c.text(msgs.OperationFailedMsg, 404)
    }
    const { success } = await c.env.DB.prepare(
        `DELETE FROM address WHERE id = ?`
    ).bind(id).run();
    if (!success) {
        return c.text(msgs.OperationFailedMsg, 500)
    }
    const { success: mailSuccess } = await c.env.DB.prepare(
        `DELETE FROM raw_mails WHERE address = ?`
    ).bind(addr.name).run();
    if (!mailSuccess) {
        return c.text(msgs.OperationFailedMsg, 500)
    }
    const { success: sendAccess } = await c.env.DB.prepare(
        `DELETE FROM address_sender WHERE address = ?`
    ).bind(addr.name).run();
    const { success: usersAddressSuccess } = await c.env.DB.prepare(
        `DELETE FROM users_address WHERE address_id = ?`
    ).bind(id).run();
    const { success: apiKeyAddrSuccess } = await c.env.DB.prepare(
        `DELETE FROM api_key_addresses WHERE address = ?`
    ).bind(addr.name).run();
    return c.json({
        success: success && mailSuccess && sendAccess && usersAddressSuccess && apiKeyAddrSuccess
    })
})

api.delete('/admin/clear_inbox/:id', async (c) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    const { success: mailSuccess } = await c.env.DB.prepare(
        `DELETE FROM raw_mails WHERE address IN`
        + ` (select name from address where id = ?) `
    ).bind(id).run();
    if (!mailSuccess) {
        return c.text(msgs.OperationFailedMsg, 500)
    }
    return c.json({
        success: mailSuccess
    })
})

api.delete('/admin/clear_sent_items/:id', async (c) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    const { success: sendboxSuccess } = await c.env.DB.prepare(
        `DELETE FROM sendbox WHERE address IN`
        + ` (select name from address where id = ?) `
    ).bind(id).run();
    if (!sendboxSuccess) {
        return c.text(msgs.OperationFailedMsg, 500)
    }
    return c.json({
        success: sendboxSuccess
    })
})

api.get('/admin/show_password/:id', async (c) => {
    const { id } = c.req.param();
    const name = await c.env.DB.prepare(
        `SELECT name FROM address WHERE id = ? `
    ).bind(id).first("name");
    const jwt = await Jwt.sign({
        address: name,
        address_id: id
    }, c.env.JWT_SECRET, "HS256")
    return c.json({
        jwt: jwt
    })
})

api.post('/admin/address/:id/reset_password', async (c) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    const { password } = await c.req.json();
    // 检查功能是否启用
    if (!getBooleanValue(c.env.ENABLE_ADDRESS_PASSWORD)) {
        return c.text(msgs.PasswordChangeDisabledMsg, 403);
    }

    if (!password) {
        return c.text(msgs.NewPasswordRequiredMsg, 400);
    }

    const hashedPassword = await hashPassword(password);
    const { success } = await c.env.DB.prepare(
        `UPDATE address SET password = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(hashedPassword, id).run();

    if (!success) {
        return c.text(msgs.FailedUpdatePasswordMsg, 500);
    }

    return c.json({ success: true });
})

// Set tags for a single address
api.post('/admin/address/:id/tags', async (c) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    const { tags } = await c.req.json();

    if (!Array.isArray(tags)) {
        return c.text("Tags must be an array", 400);
    }
    if (tags.some((t: any) => typeof t !== 'string' || t.trim().length === 0)) {
        return c.text("Tags must be non-empty strings", 400);
    }

    const tagsJson = JSON.stringify(tags.map((t: string) => t.trim()));
    const { success } = await c.env.DB.prepare(
        `UPDATE address SET tags = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(tagsJson, id).run();

    if (!success) {
        return c.text(msgs.OperationFailedMsg, 500);
    }
    return c.json({ success: true });
})

// Batch tag management
api.post('/admin/batch_tags', async (c) => {
    const { ids, action, tags } = await c.req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
        return c.text("ids must be a non-empty array", 400);
    }
    if (!['add', 'remove', 'set'].includes(action)) {
        return c.text("action must be 'add', 'remove', or 'set'", 400);
    }
    if (!Array.isArray(tags)) {
        return c.text("tags must be an array", 400);
    }

    const results = { success: 0, failed: 0 };

    for (const id of ids) {
        try {
            if (action === 'set') {
                await c.env.DB.prepare(
                    `UPDATE address SET tags = ?, updated_at = datetime('now') WHERE id = ?`
                ).bind(JSON.stringify(tags), id).run();
            } else {
                const row = await c.env.DB.prepare(
                    `SELECT tags FROM address WHERE id = ?`
                ).bind(id).first<{ tags: string }>();

                let currentTags: string[] = [];
                try {
                    currentTags = JSON.parse(row?.tags || '[]');
                } catch { currentTags = []; }

                let newTags: string[];
                if (action === 'add') {
                    const tagSet = new Set([...currentTags, ...tags]);
                    newTags = Array.from(tagSet);
                } else {
                    newTags = currentTags.filter(t => !tags.includes(t));
                }

                await c.env.DB.prepare(
                    `UPDATE address SET tags = ?, updated_at = datetime('now') WHERE id = ?`
                ).bind(JSON.stringify(newTags), id).run();
            }
            results.success++;
        } catch (e) {
            console.error(`batch_tags failed for id ${id}:`, e);
            results.failed++;
        }
    }

    return c.json(results);
})

// Tag statistics
api.get('/admin/tag_statistics', async (c) => {
    const { results: tagCounts } = await c.env.DB.prepare(
        `SELECT je.value as tag, COUNT(DISTINCT a.id) as address_count`
        + ` FROM address a, json_each(a.tags) je`
        + ` GROUP BY je.value`
        + ` ORDER BY address_count DESC`
        + ` LIMIT 100`
    ).all();

    const { results: tagMailCounts } = await c.env.DB.prepare(
        `SELECT je.value as tag, COUNT(rm.id) as mail_count`
        + ` FROM address a, json_each(a.tags) je`
        + ` LEFT JOIN raw_mails rm ON rm.address = a.name`
        + ` GROUP BY je.value`
        + ` ORDER BY mail_count DESC`
        + ` LIMIT 100`
    ).all();

    const { results: sourceMetas } = await c.env.DB.prepare(
        `SELECT DISTINCT source_meta FROM address WHERE source_meta IS NOT NULL ORDER BY source_meta`
    ).all();

    const { results: allTags } = await c.env.DB.prepare(
        `SELECT DISTINCT je.value as tag FROM address a, json_each(a.tags) je ORDER BY tag`
    ).all();

    return c.json({
        tagCounts: tagCounts || [],
        tagMailCounts: tagMailCounts || [],
        sourceMetas: (sourceMetas || []).map((r: any) => r.source_meta),
        allTags: (allTags || []).map((r: any) => r.tag),
    });
})

// mail api
api.get('/admin/mails', admin_mail_api.getMails);
api.get('/admin/mails_unknow', admin_mail_api.getUnknowMails);
api.delete('/admin/mails/:id', admin_mail_api.deleteMail)

api.get('/admin/address_sender', async (c) => {
    const { address, limit, offset } = c.req.query();
    if (address) {
        return await handleListQuery(c,
            `SELECT * FROM address_sender where address = ? `,
            `SELECT count(*) as count FROM address_sender where address = ? `,
            [address], limit, offset
        );
    }
    return await handleListQuery(c,
        `SELECT * FROM address_sender `,
        `SELECT count(*) as count FROM address_sender `,
        [], limit, offset
    );
})

api.post('/admin/address_sender', async (c) => {
    const msgs = i18n.getMessagesbyContext(c);
    /* eslint-disable prefer-const */
    let { address, address_id, balance, enabled } = await c.req.json();
    /* eslint-enable prefer-const */
    if (!address_id) {
        return c.text(msgs.InvalidAddressIdMsg, 400)
    }
    enabled = enabled ? 1 : 0;
    const { success } = await c.env.DB.prepare(
        `UPDATE address_sender SET enabled = ?, balance = ? WHERE id = ? `
    ).bind(enabled, balance, address_id).run();
    if (!success) {
        return c.text(msgs.OperationFailedMsg, 500)
    }
    await sendAdminInternalMail(
        c, address, "Account Send Access Updated",
        `Your send access has been ${enabled ? "enabled" : "disabled"}, balance: ${balance}`
    );
    return c.json({
        success: success
    })
})

api.delete('/admin/address_sender/:id', async (c) => {
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(
        `DELETE FROM address_sender WHERE id = ? `
    ).bind(id).run();
    return c.json({
        success: success
    })
})

api.get('/admin/sendbox', async (c) => {
    const { address, limit, offset } = c.req.query();
    if (address) {
        return await handleListQuery(c,
            `SELECT * FROM sendbox where address = ? `,
            `SELECT count(*) as count FROM sendbox where address = ? `,
            [address], limit, offset
        );
    }
    return await handleListQuery(c,
        `SELECT * FROM sendbox `,
        `SELECT count(*) as count FROM sendbox `,
        [], limit, offset
    );
})

api.delete('/admin/sendbox/:id', async (c) => {
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(
        `DELETE FROM sendbox WHERE id = ? `
    ).bind(id).run();
    return c.json({
        success: success
    })
})

api.get('/admin/statistics', async (c) => {
    const { count: mailCount } = await c.env.DB.prepare(
        `SELECT count(*) as count FROM raw_mails`
    ).first<{ count: number }>() || {};
    const { count: addressCount } = await c.env.DB.prepare(
        `SELECT count(*) as count FROM address`
    ).first<{ count: number }>() || {};
    const { count: activeAddressCount7days } = await c.env.DB.prepare(
        `SELECT count(*) as count FROM address where updated_at > datetime('now', '-7 day')`
    ).first<{ count: number }>() || {};
    const { count: activeAddressCount30days } = await c.env.DB.prepare(
        `SELECT count(*) as count FROM address where updated_at > datetime('now', '-30 day')`
    ).first<{ count: number }>() || {};
    const { count: sendMailCount } = await c.env.DB.prepare(
        `SELECT count(*) as count FROM sendbox`
    ).first<{ count: number }>() || {};
    const { count: userCount } = await c.env.DB.prepare(
        `SELECT count(*) as count FROM users`
    ).first<{ count: number }>() || {};
    return c.json({
        mailCount: mailCount,
        addressCount: addressCount,
        activeAddressCount7days: activeAddressCount7days,
        activeAddressCount30days: activeAddressCount30days,
        userCount: userCount,
        sendMailCount: sendMailCount
    })
});

api.get('/admin/statistics/daily', async (c) => {
    const days = 7;
    const results = [];
    for (let i = days - 1; i >= 0; i--) {
        const { count: received } = await c.env.DB.prepare(
            `SELECT count(*) as count FROM raw_mails where created_at > datetime('now', '-${i + 1} day') and created_at <= datetime('now', '-${i} day')`
        ).first<{ count: number }>() || { count: 0 };
        const { count: sent } = await c.env.DB.prepare(
            `SELECT count(*) as count FROM sendbox where created_at > datetime('now', '-${i + 1} day') and created_at <= datetime('now', '-${i} day')`
        ).first<{ count: number }>() || { count: 0 };
        const date = new Date();
        date.setDate(date.getDate() - i);
        results.push({
            date: date.toISOString().slice(5, 10),
            received: received || 0,
            sent: sent || 0,
        });
    }
    return c.json(results);
});

api.get('/admin/account_settings', async (c) => {
    try {
        const blockList = await getJsonSetting(c, CONSTANTS.ADDRESS_BLOCK_LIST_KEY);
        const sendBlockList = await getJsonSetting(c, CONSTANTS.SEND_BLOCK_LIST_KEY);
        const verifiedAddressList = await getJsonSetting(c, CONSTANTS.VERIFIED_ADDRESS_LIST_KEY);
        const fromBlockList = c.env.KV ? await c.env.KV.get<string[]>(CONSTANTS.EMAIL_KV_BLACK_LIST, 'json') : [];
        const emailRuleSettings = await getJsonSetting<EmailRuleSettings>(c, CONSTANTS.EMAIL_RULE_SETTINGS_KEY);
        const noLimitSendAddressList = await getJsonSetting(c, CONSTANTS.NO_LIMIT_SEND_ADDRESS_LIST_KEY);
        return c.json({
            blockList: blockList || [],
            sendBlockList: sendBlockList || [],
            verifiedAddressList: verifiedAddressList || [],
            fromBlockList: fromBlockList || [],
            noLimitSendAddressList: noLimitSendAddressList || [],
            emailRuleSettings: emailRuleSettings || {}
        })
    } catch (error) {
        console.error(error);
        return c.json({})
    }
})

api.post('/admin/account_settings', async (c) => {
    const msgs = i18n.getMessagesbyContext(c);
    /** @type {{ blockList: Array<string>, sendBlockList: Array<string> }} */
    const {
        blockList, sendBlockList, noLimitSendAddressList,
        verifiedAddressList, fromBlockList, emailRuleSettings
    } = await c.req.json();
    if (!blockList || !sendBlockList || !verifiedAddressList) {
        return c.text(msgs.InvalidInputMsg, 400)
    }
    if (!c.env.SEND_MAIL && verifiedAddressList.length > 0) {
        return c.text(msgs.EnableSendMailMsg, 400)
    }
    await saveSetting(
        c, CONSTANTS.ADDRESS_BLOCK_LIST_KEY,
        JSON.stringify(blockList)
    );
    await saveSetting(
        c, CONSTANTS.SEND_BLOCK_LIST_KEY,
        JSON.stringify(sendBlockList)
    );
    await saveSetting(
        c, CONSTANTS.VERIFIED_ADDRESS_LIST_KEY,
        JSON.stringify(verifiedAddressList)
    )
    if (fromBlockList?.length > 0 && !c.env.KV) {
        return c.text(msgs.EnableKVMsg, 400)
    }
    if (fromBlockList) {
        await c.env.KV.put(CONSTANTS.EMAIL_KV_BLACK_LIST, JSON.stringify(fromBlockList || []))
    }
    await saveSetting(
        c, CONSTANTS.NO_LIMIT_SEND_ADDRESS_LIST_KEY,
        JSON.stringify(noLimitSendAddressList || [])
    )
    await saveSetting(
        c, CONSTANTS.EMAIL_RULE_SETTINGS_KEY,
        JSON.stringify(emailRuleSettings || {})
    )
    return c.json({
        success: true
    })
})

// cleanup
api.post('/admin/cleanup', cleanup_api.cleanup)
api.get('/admin/auto_cleanup', cleanup_api.getCleanup)
api.post('/admin/auto_cleanup', cleanup_api.saveCleanup)

// user settings
api.get('/admin/user_settings', admin_user_api.getSetting)
api.post('/admin/user_settings', admin_user_api.saveSetting)
api.get('/admin/users', admin_user_api.getUsers)
api.delete('/admin/users/:user_id', admin_user_api.deleteUser)
api.post('/admin/users', admin_user_api.createUser)
api.post('/admin/users/:user_id/reset_password', admin_user_api.resetPassword)
api.get('/admin/user_roles', async (c) => c.json(getUserRoles(c)))
api.post('/admin/user_roles', admin_user_api.updateUserRoles)
api.get('/admin/role_address_config', admin_user_api.getRoleAddressConfig)
api.post('/admin/role_address_config', admin_user_api.saveRoleAddressConfig)
api.get('/admin/users/bind_address/:user_id', admin_user_api.getBindedAddresses)
api.post('/admin/users/bind_address', admin_user_api.bindAddress)

// user oauth2 settings
api.get('/admin/user_oauth2_settings', oauth2_settings.getUserOauth2Settings)
api.post('/admin/user_oauth2_settings', oauth2_settings.saveUserOauth2Settings)

// webhook settings
api.get("/admin/webhook/settings", webhook_settings.getWebhookSettings);
api.post("/admin/webhook/settings", webhook_settings.saveWebhookSettings);

// mail webhook settings
api.get("/admin/mail_webhook/settings", mail_webhook_settings.getWebhookSettings);
api.post("/admin/mail_webhook/settings", mail_webhook_settings.saveWebhookSettings);
api.post("/admin/mail_webhook/test", mail_webhook_settings.testWebhookSettings);

// worker config
api.get("/admin/worker/configs", worker_config.getConfig);

// send mail by admin
api.post("/admin/send_mail", sendMailbyAdmin);

// db api
api.get('admin/db_version', db_api.getVersion);
api.post('admin/db_initialize', db_api.initialize);
api.post('admin/db_migration', db_api.migrate);

// IP blacklist settings
api.get("/admin/ip_blacklist/settings", ip_blacklist_settings.getIpBlacklistSettings);
api.post("/admin/ip_blacklist/settings", ip_blacklist_settings.saveIpBlacklistSettings);

// AI extract settings
api.get("/admin/ai_extract/settings", ai_extract_settings.getAiExtractSettings);
api.post("/admin/ai_extract/settings", ai_extract_settings.saveAiExtractSettings);

// API key management
api.get("/admin/api_keys", api_key_api.list);
api.post("/admin/api_keys", api_key_api.create);
api.delete("/admin/api_keys/:id", api_key_api.remove);
api.post("/admin/api_keys/:id/reset_usage", api_key_api.resetUsage);
