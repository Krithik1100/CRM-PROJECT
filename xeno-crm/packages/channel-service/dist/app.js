"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const delivery_simulator_1 = require("./simulator/delivery.simulator");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('combined'));
// Health check
app.get('/health', (_, res) => {
    res.json({ status: 'ok', service: 'channel-service', timestamp: new Date().toISOString() });
});
/**
 * Send endpoint — receives a communication from the CRM.
 * Immediately returns 202 Accepted, then simulates delivery asynchronously.
 *
 * The CRM should not wait for delivery to complete — it's fire-and-forget.
 * Outcomes arrive via callbacks to the CRM's /api/callbacks/communication-event endpoint.
 */
app.post('/api/channel/send', (req, res) => {
    const { communicationId, campaignId, channel, recipient, message, callbackUrl } = req.body;
    if (!communicationId || !campaignId || !channel || !recipient || !callbackUrl) {
        res.status(400).json({ error: 'Missing required fields: communicationId, campaignId, channel, recipient, callbackUrl' });
        return;
    }
    console.log(`[ChannelService] Received send request`, {
        communicationId,
        campaignId,
        channel,
        recipient: recipient.slice(0, 8) + '***', // mask PII in logs
    });
    // Immediately acknowledge receipt
    res.status(202).json({
        accepted: true,
        communicationId,
        message: 'Communication accepted for delivery simulation',
    });
    // Run simulation asynchronously — does NOT block the response
    (0, delivery_simulator_1.simulateDelivery)({ communicationId, campaignId, channel, recipient, message, callbackUrl })
        .catch((err) => {
        console.error('[ChannelService] Simulation error', { communicationId, error: err.message });
    });
});
app.listen(PORT, () => {
    console.log(`📡 Channel Service (simulator) running on port ${PORT}`);
});
exports.default = app;
