"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const callback_controller_1 = require("./callback.controller");
const router = (0, express_1.Router)();
router.post('/communication-event', callback_controller_1.callbackController.handleCommunicationEvent);
exports.default = router;
//# sourceMappingURL=callback.routes.js.map