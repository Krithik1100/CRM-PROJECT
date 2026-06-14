"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignController = void 0;
const campaign_service_1 = require("./campaign.service");
const response_1 = require("../../shared/utils/response");
exports.campaignController = {
    async list(req, res, next) {
        try {
            const campaigns = await campaign_service_1.campaignService.listCampaigns();
            (0, response_1.sendSuccess)(res, campaigns);
        }
        catch (err) {
            next(err);
        }
    },
    async getOne(req, res, next) {
        try {
            const campaign = await campaign_service_1.campaignService.getCampaign(req.params.id);
            (0, response_1.sendSuccess)(res, campaign);
        }
        catch (err) {
            next(err);
        }
    },
    async copilot(req, res, next) {
        try {
            const { goal } = req.body;
            if (!goal) {
                res.status(400).json({ success: false, error: { message: 'goal is required' } });
                return;
            }
            const recommendation = await campaign_service_1.campaignService.copilot(goal);
            (0, response_1.sendSuccess)(res, recommendation);
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            const campaign = await campaign_service_1.campaignService.createCampaign(req.body);
            (0, response_1.sendSuccess)(res, campaign, 201);
        }
        catch (err) {
            next(err);
        }
    },
    async launch(req, res, next) {
        try {
            const result = await campaign_service_1.campaignService.launchCampaign(req.params.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            const result = await campaign_service_1.campaignService.deleteCampaign(req.params.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    },
    async getStats(req, res, next) {
        try {
            const campaign = await campaign_service_1.campaignService.getCampaign(req.params.id);
            (0, response_1.sendSuccess)(res, campaign);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=campaign.controller.js.map