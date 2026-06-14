"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segmentRepository = void 0;
const pool_1 = require("../../db/pool");
const filter_translator_1 = require("./filter.translator");
exports.segmentRepository = {
    async findAll() {
        return (0, pool_1.query)('SELECT * FROM segments ORDER BY created_at DESC');
    },
    async findById(id) {
        return (0, pool_1.queryOne)('SELECT * FROM segments WHERE id = $1', [id]);
    },
    async create(data) {
        const rows = await (0, pool_1.query)(`INSERT INTO segments (name, description, filter_json, ai_query, customer_count, last_computed_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`, [data.name, data.description, JSON.stringify(data.filter_json), data.ai_query, data.customer_count]);
        return rows[0];
    },
    async computeCustomers(filterJson) {
        const { sql, params } = (0, filter_translator_1.filterJsonToSql)(filterJson);
        const customers = await (0, pool_1.query)(`SELECT * FROM customers WHERE ${sql} ORDER BY total_spent DESC LIMIT 200`, params);
        const countResult = await (0, pool_1.queryOne)(`SELECT COUNT(*) as count FROM customers WHERE ${sql}`, params);
        return { customers, count: parseInt(countResult?.count || '0') };
    },
    async refreshCount(segmentId, filterJson) {
        const { sql, params } = (0, filter_translator_1.filterJsonToSql)(filterJson);
        const result = await (0, pool_1.queryOne)(`SELECT COUNT(*) as count FROM customers WHERE ${sql}`, params);
        const count = parseInt(result?.count || '0');
        await (0, pool_1.query)('UPDATE segments SET customer_count = $1, last_computed_at = NOW() WHERE id = $2', [count, segmentId]);
        return count;
    },
    async getCustomerIds(filterJson) {
        const { sql, params } = (0, filter_translator_1.filterJsonToSql)(filterJson);
        const rows = await (0, pool_1.query)(`SELECT id FROM customers WHERE ${sql}`, params);
        return rows.map(r => r.id);
    },
};
//# sourceMappingURL=segment.repository.js.map