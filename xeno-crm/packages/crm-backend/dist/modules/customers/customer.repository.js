"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerRepository = void 0;
const pool_1 = require("../../db/pool");
exports.customerRepository = {
    async resetDemoData() {
        await (0, pool_1.query)('DELETE FROM communication_events');
        await (0, pool_1.query)('DELETE FROM communications');
        await (0, pool_1.query)('DELETE FROM campaign_stats');
        await (0, pool_1.query)('DELETE FROM campaigns');
        await (0, pool_1.query)('DELETE FROM segments');
        await (0, pool_1.query)('DELETE FROM orders');
        await (0, pool_1.query)('DELETE FROM customers');
    },
    async findAll(options) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const offset = (page - 1) * limit;
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (options.search) {
            conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
            params.push(`%${options.search}%`);
            paramIndex++;
        }
        if (options.tier) {
            conditions.push(`tier = $${paramIndex}`);
            params.push(options.tier);
            paramIndex++;
        }
        if (options.city) {
            conditions.push(`city ILIKE $${paramIndex}`);
            params.push(`%${options.city}%`);
            paramIndex++;
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const countResult = await (0, pool_1.queryOne)(`SELECT COUNT(*) as count FROM customers ${whereClause}`, params);
        const customers = await (0, pool_1.query)(`SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        return { customers, total: parseInt(countResult?.count || '0') };
    },
    async findById(id) {
        return (0, pool_1.queryOne)('SELECT * FROM customers WHERE id = $1', [id]);
    },
    async findOrdersByCustomerId(customerId) {
        return (0, pool_1.query)('SELECT * FROM orders WHERE customer_id = $1 ORDER BY ordered_at DESC LIMIT 50', [customerId]);
    },
    async insertCustomer(customer) {
        const rows = await (0, pool_1.query)(`INSERT INTO customers (external_id, name, email, phone, city, tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (external_id) DO UPDATE SET
         name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
         city = EXCLUDED.city, tier = EXCLUDED.tier, updated_at = NOW()
       RETURNING *`, [customer.external_id, customer.name, customer.email, customer.phone, customer.city, customer.tier || 'bronze']);
        return rows[0];
    },
    async insertOrder(order) {
        const rows = await (0, pool_1.query)(`INSERT INTO orders (customer_id, order_number, amount, status, channel, category, items, ordered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (order_number) DO NOTHING
       RETURNING *`, [order.customer_id, order.order_number, order.amount, order.status, order.channel, order.category, JSON.stringify(order.items), order.ordered_at]);
        return rows[0];
    },
    async getStats() {
        const result = await (0, pool_1.queryOne)(`SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE tier = 'gold') as gold,
        COUNT(*) FILTER (WHERE tier = 'silver') as silver,
        COUNT(*) FILTER (WHERE tier = 'bronze') as bronze,
        ROUND(AVG(total_spent)::numeric, 2) as avg_spent
       FROM customers`);
        return {
            total: parseInt(result?.total || '0'),
            gold: parseInt(result?.gold || '0'),
            silver: parseInt(result?.silver || '0'),
            bronze: parseInt(result?.bronze || '0'),
            avg_spent: parseFloat(result?.avg_spent || '0'),
        };
    },
};
//# sourceMappingURL=customer.repository.js.map