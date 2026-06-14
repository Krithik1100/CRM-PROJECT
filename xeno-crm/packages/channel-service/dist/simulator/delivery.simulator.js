"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateDelivery = simulateDelivery;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
// Realistic delivery probabilities per channel
const CHANNEL_CONFIG = {
    email: {
        deliveryRate: 0.95,
        openRate: 0.28,
        clickRate: 0.08,
        purchaseRate: 0.03,
        deliveryDelayMs: [500, 2000],
        openDelayMs: [3000, 15000],
        clickDelayMs: [1000, 5000],
        purchaseDelayMs: [2000, 8000],
    },
    sms: {
        deliveryRate: 0.98,
        openRate: 0.82,
        clickRate: 0.19,
        purchaseRate: 0.06,
        deliveryDelayMs: [200, 1000],
        openDelayMs: [1000, 8000],
        clickDelayMs: [500, 3000],
        purchaseDelayMs: [1000, 5000],
    },
    whatsapp: {
        deliveryRate: 0.97,
        openRate: 0.72,
        clickRate: 0.22,
        purchaseRate: 0.07,
        deliveryDelayMs: [300, 1500],
        openDelayMs: [1500, 10000],
        clickDelayMs: [800, 4000],
        purchaseDelayMs: [1500, 6000],
    },
    rcs: {
        deliveryRate: 0.90,
        openRate: 0.55,
        clickRate: 0.15,
        purchaseRate: 0.05,
        deliveryDelayMs: [400, 2000],
        openDelayMs: [2000, 12000],
        clickDelayMs: [1000, 5000],
        purchaseDelayMs: [2000, 7000],
    },
};
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomDelay([min, max]) {
    return randomBetween(min, max);
}
async function sendCallback(callbackUrl, communicationId, campaignId, eventType, eventData = {}, retries = 3) {
    const idempotencyKey = `${communicationId}:${eventType}:${(0, uuid_1.v4)()}`;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await axios_1.default.post(callbackUrl, {
                communicationId,
                campaignId,
                eventType,
                eventData,
                idempotencyKey,
                timestamp: new Date().toISOString(),
            }, {
                timeout: 10000,
                headers: { 'Content-Type': 'application/json', 'X-Channel-Service': 'xeno-channel-sim' },
            });
            return; // success
        }
        catch (err) {
            if (attempt === retries) {
                console.error(`[ChannelService] Callback failed after ${retries} attempts`, {
                    communicationId, eventType, error: err.message,
                });
                return;
            }
            // Exponential backoff: 1s, 2s, 4s
            const backoffMs = Math.pow(2, attempt - 1) * 1000;
            console.warn(`[ChannelService] Callback attempt ${attempt} failed, retrying in ${backoffMs}ms`);
            await new Promise(r => setTimeout(r, backoffMs));
        }
    }
}
/**
 * Simulates the full delivery lifecycle of a single communication.
 * Each event fires asynchronously after a realistic delay,
 * then calls back to the CRM with the event details.
 *
 * Lifecycle: SENT → DELIVERED/FAILED → OPENED → READ → CLICKED → PURCHASED
 */
async function simulateDelivery(req) {
    const { communicationId, campaignId, channel, callbackUrl } = req;
    const config = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.email;
    console.log(`[ChannelService] Simulating delivery for ${communicationId} via ${channel}`);
    // Step 1: SENT (immediate acknowledgement)
    await sendCallback(callbackUrl, communicationId, campaignId, 'sent');
    // Step 2: DELIVERED or FAILED (after delivery delay)
    await new Promise(r => setTimeout(r, randomDelay(config.deliveryDelayMs)));
    const isDelivered = Math.random() < config.deliveryRate;
    if (!isDelivered) {
        await sendCallback(callbackUrl, communicationId, campaignId, 'failed', {
            reason: 'invalid_recipient',
        });
        return; // Terminal state
    }
    await sendCallback(callbackUrl, communicationId, campaignId, 'delivered');
    // Step 3: OPENED (probabilistic, after open delay)
    await new Promise(r => setTimeout(r, randomDelay(config.openDelayMs)));
    const isOpened = Math.random() < config.openRate;
    if (!isOpened)
        return; // Delivered but not opened
    await sendCallback(callbackUrl, communicationId, campaignId, 'opened');
    // Step 4: READ (shortly after open, high correlation)
    await new Promise(r => setTimeout(r, randomDelay([500, 2000])));
    await sendCallback(callbackUrl, communicationId, campaignId, 'read');
    // Step 5: CLICKED (probabilistic)
    await new Promise(r => setTimeout(r, randomDelay(config.clickDelayMs)));
    const isClicked = Math.random() < config.clickRate;
    if (!isClicked)
        return;
    await sendCallback(callbackUrl, communicationId, campaignId, 'clicked', {
        link: 'https://brand.example.com/offer',
    });
    // Step 6: PURCHASED (probabilistic, attributed to this campaign)
    await new Promise(r => setTimeout(r, randomDelay(config.purchaseDelayMs)));
    const isPurchased = Math.random() < config.purchaseRate;
    if (!isPurchased)
        return;
    const orderAmount = randomBetween(499, 4999);
    await sendCallback(callbackUrl, communicationId, campaignId, 'purchased', {
        order_amount: orderAmount,
        order_id: `SIM-ORD-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`,
    });
    console.log(`[ChannelService] ${communicationId} completed full lifecycle → PURCHASED`);
}
