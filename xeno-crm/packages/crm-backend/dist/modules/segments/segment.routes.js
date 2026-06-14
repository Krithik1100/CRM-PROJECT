"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const segment_controller_1 = require("./segment.controller");
const router = (0, express_1.Router)();
router.get('/', segment_controller_1.segmentController.list);
router.post('/ai-query', segment_controller_1.segmentController.aiQuery);
router.post('/', segment_controller_1.segmentController.create);
router.get('/:id', segment_controller_1.segmentController.getOne);
router.get('/:id/customers', segment_controller_1.segmentController.getCustomers);
exports.default = router;
//# sourceMappingURL=segment.routes.js.map