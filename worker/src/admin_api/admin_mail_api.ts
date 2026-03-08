import { Context } from "hono";
import { handleListQuery, RAW_MAIL_SUBJECT_SQL } from "../common";

export default {
    getMails: async (c: Context<HonoCustomType>) => {
        const { address, limit, offset, summary } = c.req.query();
        const isSummary = summary === '1' || summary === 'true';
        const selectFieldsWithSubject = `id, message_id, source, COALESCE(NULLIF(subject, ''), (${RAW_MAIL_SUBJECT_SQL})) as subject, address, metadata, created_at`;
        const selectFieldsWithoutSubject = `id, message_id, source, (${RAW_MAIL_SUBJECT_SQL}) as subject, address, metadata, created_at`;
        const addressQuery = address ? `address = ?` : "";
        const addressParams = address ? [address] : [];
        const filterQuerys = [addressQuery].filter((item) => item).join(" and ");
        const finalQuery = filterQuerys.length > 0 ? `where ${filterQuerys}` : "";
        const filterParams = [...addressParams]
        const countQuery = `SELECT count(*) as count FROM raw_mails ${finalQuery}`;
        if (!isSummary) {
            return await handleListQuery(c,
                `SELECT * FROM raw_mails ${finalQuery}`,
                countQuery,
                filterParams, limit, offset
            );
        }
        try {
            return await handleListQuery(c,
                `SELECT ${selectFieldsWithSubject} FROM raw_mails ${finalQuery}`,
                countQuery,
                filterParams, limit, offset
            );
        } catch (error) {
            const errorMessage = `${error}`;
            if (!errorMessage.includes("no such column: subject")) {
                throw error;
            }
            return await handleListQuery(c,
                `SELECT ${selectFieldsWithoutSubject} FROM raw_mails ${finalQuery}`,
                countQuery,
                filterParams, limit, offset
            );
        }
    },
    getUnknowMails: async (c: Context<HonoCustomType>) => {
        const { limit, offset, summary } = c.req.query();
        const isSummary = summary === '1' || summary === 'true';
        const selectFieldsWithSubject = `id, message_id, source, COALESCE(NULLIF(subject, ''), (${RAW_MAIL_SUBJECT_SQL})) as subject, address, metadata, created_at`;
        const selectFieldsWithoutSubject = `id, message_id, source, (${RAW_MAIL_SUBJECT_SQL}) as subject, address, metadata, created_at`;
        const countQuery = `SELECT count(*) as count FROM raw_mails`
            + ` where address NOT IN (select name from address) `;
        if (!isSummary) {
            return await handleListQuery(c,
                `SELECT * FROM raw_mails where address NOT IN (select name from address) `,
                countQuery,
                [], limit, offset
            );
        }
        try {
            return await handleListQuery(c,
                `SELECT ${selectFieldsWithSubject} FROM raw_mails where address NOT IN (select name from address) `,
                countQuery,
                [], limit, offset
            );
        } catch (error) {
            const errorMessage = `${error}`;
            if (!errorMessage.includes("no such column: subject")) {
                throw error;
            }
            return await handleListQuery(c,
                `SELECT ${selectFieldsWithoutSubject} FROM raw_mails where address NOT IN (select name from address) `,
                countQuery,
                [], limit, offset
            );
        }
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
