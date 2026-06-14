"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_controller_1 = require("./campaign.controller");
const router = (0, express_1.Router)();
router.get('/', campaign_controller_1.campaignController.list);
router.post('/copilot', campaign_controller_1.campaignController.copilot);
router.post('/', campaign_controller_1.campaignController.create);
router.get('/:id', campaign_controller_1.campaignController.getOne);
router.post('/:id/launch', campaign_controller_1.campaignController.launch);
router.get('/:id/stats', campaign_controller_1.campaignController.getStats);
router.delete('/:id', campaign_controller_1.campaignController.delete);
exports.default = router;
//# sourceMappingURL=campaign.routes.js.map