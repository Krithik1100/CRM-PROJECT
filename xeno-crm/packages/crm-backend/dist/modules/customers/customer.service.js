"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerService = void 0;
const customer_repository_1 = require("./customer.repository");
const customer_seeder_1 = require("./customer.seeder");
const errors_1 = require("../../shared/errors");
const logger_1 = require("../../shared/utils/logger");
exports.customerService = {
    async listCustomers(query) {
        return customer_repository_1.customerRepository.findAll(query);
    },
    async getCustomer(id) {
        const customer = await customer_repository_1.customerRepository.findById(id);
        if (!customer)
            throw new errors_1.NotFoundError('Customer');
        const orders = await customer_repository_1.customerRepository.findOrdersByCustomerId(id);
        return { ...customer, orders };
    },
    async getStats() {
        return customer_repository_1.customerRepository.getStats();
    },
    async seedData(count = 30) {
        const seedCount = Math.min(Math.max(Number(count) || 30, 10), 40);
        logger_1.logger.info(`Resetting existing demo data and seeding cafe dataset with ${seedCount} customers`);
        await customer_repository_1.customerRepository.resetDemoData();
        await (0, customer_seeder_1.seedDatabase)(seedCount);
        return { seeded: true, reset: true, dataset: 'cafe', count: seedCount };
    },
};
//# sourceMappingURL=customer.service.js.map