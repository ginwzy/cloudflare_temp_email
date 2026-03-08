import { Context } from "hono";
import { handleListQuery } from "../common";

export default {
    getMails: async (c: Context<HonoCustomType>) => {
        const { address, limit, offset, summary } = c.req.query();
        const isSummary = summary === '1' || summary === 'true';
        const selectFields = isSummary
            ? `id, message_id, source, address, metadata, created_at`
            : `*`;
        const addressQuery = address ? `address = ?` : "";
        const addressParams = address ? [address] : [];
        const filterQuerys = [addressQuery].filter((item) => item).join(" and ");
        const finalQuery = filterQuerys.length > 0 ? `where ${filterQuerys}` : "";
        const filterParams = [...addressParams]
        return await handleListQuery(c,
            `SELECT ${selectFields} FROM raw_mails ${finalQuery}`,
            `SELECT count(*) as count FROM raw_mails ${finalQuery}`,
            filterParams, limit, offset
        );
    },
    getUnknowMails: async (c: Context<HonoCustomType>) => {
        const { limit, offset, summary } = c.req.query();
        const isSummary = summary === '1' || summary === 'true';
        const selectFields = isSummary
            ? `id, message_id, source, address, metadata, created_at`
            : `*`;
        return await handleListQuery(c,
            `SELECT ${selectFields} FROM raw_mails where address NOT IN (select name from address) `,
            `SELECT count(*) as count FROM raw_mails`
            + ` where address NOT IN (select name from address) `,
            [], limit, offset
        );
    },
    getMail: async (c: Context<HonoCustomType>) => {
        const { id } = c.req.param();
        const result = await c.env.DB.prepare(
            `SELECT * FROM raw_mails WHERE id = ?`
        ).bind(id).first();
        return c.json(result || null);
    },
    deleteMail: async (c: Context<HonoCustomType>) => {
        const { id } = c.req.param();
        const { success } = await c.env.DB.prepare(
            `DELETE FROM raw_mails WHERE id = ? `
        ).bind(id).run();
        return c.json({
            success: success
        })
    }
}
