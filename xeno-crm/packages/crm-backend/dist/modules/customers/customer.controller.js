"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerController = void 0;
const customer_service_1 = require("./customer.service");
const response_1 = require("../../shared/utils/response");
exports.customerController = {
    async list(req, res, next) {
        try {
            const { page = '1', limit = '20', search, tier, city } = req.query;
            const { customers, total } = await customer_service_1.customerService.listCustomers({
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                tier: tier,
                city: city,
            });
            (0, response_1.sendPaginated)(res, customers, total, parseInt(page), parseInt(limit));
        }
        catch (err) {
            next(err);
        }
    },
    async getOne(req, res, next) {
        try {
            const customer = await customer_service_1.customerService.getCustomer(req.params.id);
            (0, response_1.sendSuccess)(res, customer);
        }
        catch (err) {
            next(err);
        }
    },
    async getStats(req, res, next) {
        try {
            const stats = await customer_service_1.customerService.getStats();
            (0, response_1.sendSuccess)(res, stats);
        }
        catch (err) {
            next(err);
        }
    },
    async seed(req, res, next) {
        try {
            const { count = 500 } = req.body;
            const result = await customer_service_1.customerService.seedData(count);
            (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=customer.controller.js.map