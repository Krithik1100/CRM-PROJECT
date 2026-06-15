"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const customer_routes_1 = __importDefault(require("./modules/customers/customer.routes"));
const segment_routes_1 = __importDefault(require("./modules/segments/segment.routes"));
const campaign_routes_1 = __importDefault(require("./modules/campaigns/campaign.routes"));
const callback_routes_1 = __importDefault(require("./modules/callbacks/callback.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const errorHandler_1 = require("./shared/middleware/errorHandler");
const logger_1 = require("./shared/utils/logger");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, morgan_1.default)('combined', {
    stream: { write: (msg) => logger_1.logger.info(msg.trim()) },
}));
// Health check
app.get('/', (_, res) => {
    res.json({
        service: 'KK CRM Backend',
        status: 'running',
        health: '/health',
        api: {
            customers: '/api/customers',
            segments: '/api/segments',
            campaigns: '/api/campaigns',
            analytics: '/api/analytics/overview',
            callbacks: '/api/callbacks/communication-event',
        },
    });
});
app.get('/health', (_, res) => {
    res.json({ status: 'ok', service: 'crm-backend', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/customers', customer_routes_1.default);
app.use('/api/segments', segment_routes_1.default);
app.use('/api/campaigns', campaign_routes_1.default);
app.use('/api/callbacks', callback_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
// Error handling
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 CRM Backend running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map