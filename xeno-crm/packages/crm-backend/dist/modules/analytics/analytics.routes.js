"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_repository_1 = require("../campaigns/campaign.repository");
const customer_repository_1 = require("../customers/customer.repository");
const response_1 = require("../../shared/utils/response");
const router = (0, express_1.Router)();
router.get('/overview', async (req, res, next) => {
    try {
        const [campaignStats, customerStats] = await Promise.all([
            campaign_repository_1.campaignRepository.getOverviewStats(),
            customer_repository_1.customerRepository.getStats(),
        ]);
        (0, response_1.sendSuccess)(res, { campaigns: campaignStats, customers: customerStats });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map