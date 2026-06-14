"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("./customer.controller");
const router = (0, express_1.Router)();
router.get('/', customer_controller_1.customerController.list);
router.get('/stats', customer_controller_1.customerController.getStats);
router.get('/:id', customer_controller_1.customerController.getOne);
router.post('/seed', customer_controller_1.customerController.seed);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map