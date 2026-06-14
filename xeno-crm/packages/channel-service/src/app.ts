import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { simulateDelivery } from './simulator/delivery.simulator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

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
  simulateDelivery({ communicationId, campaignId, channel, recipient, message, callbackUrl })
    .catch((err) => {
      console.error('[ChannelService] Simulation error', { communicationId, error: err.message });
    });
});

app.listen(PORT, () => {
  console.log(`📡 Channel Service (simulator) running on port ${PORT}`);
});

export default app;
