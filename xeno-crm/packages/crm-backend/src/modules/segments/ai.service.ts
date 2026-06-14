import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../shared/utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const DB_SCHEMA_CONTEXT = `
You are an AI assistant for KK Cafe, an AI-native CRM for coffee shops and consumer brands.

BUSINESS WORKFLOW:
1. Store customer details, purchase history, order amounts, and purchase dates.
2. Convert marketer goals like "Find customers who haven't purchased in 60 days" into filter JSON.
3. Recommend the best channel:
   - urgent offers and win-back promotions: whatsapp
   - newsletters and longer updates: email
   - short reminders and nudges: sms
   - premium upsell campaigns: email
4. Generate short personalized marketing messages with useful placeholders.
5. Campaign delivery is sent to a separate stubbed Channel Service, which simulates callbacks.
6. Analytics are based on delivered, opened, read, clicked, purchased, and revenue events.

DATABASE SCHEMA:
- customers: id, name, email, phone, city, internal tier, total_spent (INR), order_count, first_order_at, last_order_at
- orders: id, customer_id, order_number, amount, status, channel (online/offline), category, ordered_at

FILTER JSON STRUCTURE (what you must output for segmentation):
{
  "operator": "AND" | "OR",
  "conditions": [
    { "field": "total_spent", "op": "gte" | "lte" | "gt" | "lt" | "eq", "value": number },
    { "field": "order_count", "op": "gte" | "lte" | "gt" | "lt" | "eq", "value": number },
    { "field": "last_order_at", "op": "days_ago_gte" | "days_ago_lte", "value": number },
    { "field": "first_order_at", "op": "days_ago_gte" | "days_ago_lte", "value": number },
    { "field": "city", "op": "eq" | "in", "value": string | string[] },
    { "field": "category", "op": "eq" | "in", "value": string | string[], "subquery": true },
    { "field": "channel", "op": "eq", "value": "online" | "offline", "subquery": true }
  ]
}
`;

function extractDays(text: string, fallback = 60): number {
  const lower = text.toLowerCase();
  const dayMatch = lower.match(/(\d+)\s*days?/);
  if (dayMatch) return Number(dayMatch[1]);
  if (lower.includes('3 months')) return 90;
  return fallback;
}

function inactiveSegment(days: number) {
  return {
    filterJson: {
      operator: 'AND',
      conditions: [
        { field: 'last_order_at', op: 'days_ago_gte', value: days },
      ],
    },
    segmentName: `Inactive ${days}+ Days`,
    description: `Customers whose last purchase was at least ${days} days ago.`,
    sqlPreview: `last_order_at <= NOW() - INTERVAL '${days} days'`,
  };
}

function fallbackSegmentQuery(query: string) {
  const lower = query.toLowerCase();
  const days = extractDays(query);

  if (lower.includes('inactive') || lower.includes("haven't") || lower.includes('not purchased') || lower.includes('last purchase')) {
    return inactiveSegment(days);
  }

  if (lower.includes('spend') || lower.includes('high value') || lower.includes('vip') || lower.includes('loyal')) {
    return {
      filterJson: {
        operator: 'AND',
        conditions: [
          { field: 'total_spent', op: 'gte', value: 5000 },
          { field: 'order_count', op: 'gte', value: 3 },
        ],
      },
      segmentName: 'High Value Cafe Customers',
      description: 'Cafe customers with repeat order history and at least INR 5,000 in spend.',
      sqlPreview: 'total_spent >= 5000 AND order_count >= 3',
    };
  }

  if (lower.includes('offer') || lower.includes('discount')) {
    return {
      filterJson: {
        operator: 'AND',
        conditions: [
          { field: 'order_count', op: 'lte', value: 2 },
          { field: 'last_order_at', op: 'days_ago_gte', value: 30 },
        ],
      },
      segmentName: 'Offer Sensitive Customers',
      description: 'Low-frequency customers who are likely to respond to a clear discount.',
      sqlPreview: "order_count <= 2 AND last_order_at <= NOW() - INTERVAL '30 days'",
    };
  }

  return inactiveSegment(days);
}

function fallbackCampaignRecommendation(goal: string, customerStats: object) {
  const lower = goal.toLowerCase();
  const days = extractDays(goal);
  const stats = customerStats as { total?: number; avg_spent?: number };

  if (lower.includes('newsletter')) {
    return {
      campaignName: 'Coffee Club Newsletter',
      segmentName: 'Existing Coffee Customers',
      segmentDescription: 'Customers with at least one order, suitable for a broad non-urgent update.',
      filterJson: { operator: 'AND', conditions: [{ field: 'order_count', op: 'gte', value: 1 }] },
      channel: 'email',
      channelReasoning: 'Email is best for newsletters because it supports longer content and is less intrusive.',
      messageTemplate: 'Hi {{name}}, here is what is new at our coffee shop this week. Drop by for fresh brews, seasonal snacks, and member-only offers.',
      reasoning: `This goal is a content update, so it targets existing customers and uses email. The database currently has about ${stats.total || 0} customers, with average spend near INR ${Math.round(stats.avg_spent || 0).toLocaleString('en-IN')}.`,
    };
  }

  if (lower.includes('remind') || lower.includes('reminder')) {
    return {
      campaignName: 'Quick Coffee Reminder',
      segmentName: `Inactive ${days}+ Days`,
      segmentDescription: `Customers who have not purchased in at least ${days} days and need a short nudge.`,
      filterJson: inactiveSegment(days).filterJson,
      channel: 'sms',
      channelReasoning: 'SMS is best for short reminders that do not need rich formatting.',
      messageTemplate: 'Hi {{name}}, your favorite coffee is waiting. Visit us this week and enjoy 10% off your next order.',
      reasoning: 'A reminder should be short, direct, and easy to act on. SMS fits that behavior better than a long email.',
    };
  }

  if (lower.includes('upsell') || lower.includes('premium') || lower.includes('loyal') || lower.includes('regular')) {
    return {
      campaignName: 'Premium Coffee Upgrade',
      segmentName: 'Loyal Cafe Customers',
      segmentDescription: 'Repeat cafe customers with strong spend who are good candidates for premium beans, subscriptions, or bundles.',
      filterJson: {
        operator: 'AND',
        conditions: [
          { field: 'total_spent', op: 'gte', value: 5000 },
          { field: 'order_count', op: 'gte', value: 2 },
        ],
      },
      channel: 'email',
      channelReasoning: 'Email is recommended for premium upsell campaigns because it can explain product value and include more detail than SMS or WhatsApp.',
      messageTemplate: 'Hi {{name}}, thanks for being one of our valued coffee customers. Try our premium beans or monthly coffee plan this week and get an exclusive member offer at our {{city}} location.',
      reasoning: 'The goal targets valuable existing cafe customers, so the segment focuses on spend and repeat order history. Email is better for an upsell because the message needs more explanation than an urgent offer.',
    };
  }

  return {
    campaignName: 'Win Back Coffee Customers',
    segmentName: `Inactive ${days}+ Days`,
    segmentDescription: `Customers whose last purchase was at least ${days} days ago.`,
    filterJson: inactiveSegment(days).filterJson,
    channel: 'whatsapp',
    channelReasoning: 'WhatsApp is recommended for urgent win-back offers because it is immediate and conversational.',
    messageTemplate: "Hey {{name}}! We've missed you at KK Cafe. It's been {{last_purchase_days}} since your last order. Come back and enjoy 25% off your next purchase! Valid at our {{city}} location. See you soon!",
    reasoning: 'The goal is to bring inactive customers back, so the audience is customers whose last purchase is old enough to indicate churn risk. A short WhatsApp offer is the strongest fit for a time-bound promotion.',
  };
}

function enforceChannelDecision(goal: string, recommendation: {
  channel: string;
  channelReasoning: string;
  [key: string]: unknown;
}) {
  const lower = goal.toLowerCase();

  if (lower.includes('newsletter')) {
    return {
      ...recommendation,
      channel: 'email',
      channelReasoning: 'Email is recommended for newsletters because it supports longer updates and is less intrusive.',
    };
  }

  if (lower.includes('remind') || lower.includes('reminder')) {
    return {
      ...recommendation,
      channel: 'sms',
      channelReasoning: 'SMS is recommended for reminders because it is short, direct, and easy to act on.',
    };
  }

  if (lower.includes('urgent') || lower.includes('flash') || lower.includes('offer') || lower.includes('win back') || lower.includes('inactive')) {
    return {
      ...recommendation,
      channel: 'whatsapp',
      channelReasoning: 'WhatsApp is recommended for urgent offers and win-back campaigns because it is immediate and conversational.',
    };
  }

  if (!['email', 'sms', 'whatsapp'].includes(recommendation.channel)) {
    return {
      ...recommendation,
      channel: 'email',
      channelReasoning: 'Email is selected as the default supported channel for non-urgent campaigns.',
    };
  }

  return recommendation;
}

export const aiService = {
  async parseSegmentQuery(naturalLanguageQuery: string): Promise<{
    filterJson: object;
    segmentName: string;
    description: string;
    sqlPreview: string;
  }> {
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `${DB_SCHEMA_CONTEXT}

USER QUERY: "${naturalLanguageQuery}"

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "filterJson": { ...filter object as described above... },
  "segmentName": "short descriptive name for this segment",
  "description": "1-sentence description of who is in this segment",
  "sqlPreview": "a readable SQL WHERE clause preview (use plain English for dates like 'NOW() - INTERVAL 90 days')"
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      logger.error('AI segment parse failed, using deterministic fallback', { error, query: naturalLanguageQuery });
      return fallbackSegmentQuery(naturalLanguageQuery);
    }
  },

  async generateCampaignRecommendation(goal: string, customerStats: object): Promise<{
    segmentDescription: string;
    filterJson: object;
    segmentName: string;
    channel: string;
    channelReasoning: string;
    messageTemplate: string;
    reasoning: string;
    campaignName: string;
  }> {
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `${DB_SCHEMA_CONTEXT}

MARKETER'S GOAL: "${goal}"

CURRENT DATABASE STATS: ${JSON.stringify(customerStats)}

You are the AI Campaign Copilot. Based on the marketer's goal, recommend:
1. The best audience segment to target
2. The best channel (email/sms/whatsapp)
3. A personalized message template (use {{name}}, {{city}}, {{last_purchase_days}} as placeholders)

Return ONLY valid JSON (no markdown) with this structure:
{
  "campaignName": "short campaign name",
  "segmentName": "name of the target segment",
  "segmentDescription": "who is in this segment and why they're right for this goal",
  "filterJson": { ...filter object... },
  "channel": "email" | "sms" | "whatsapp",
  "channelReasoning": "why this channel is best for this goal and audience",
  "messageTemplate": "the personalized message (2-3 sentences, uses {{name}} and other placeholders)",
  "reasoning": "overall strategic reasoning for these recommendations (2-3 sentences)"
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return enforceChannelDecision(goal, JSON.parse(cleaned)) as {
        segmentDescription: string;
        filterJson: object;
        segmentName: string;
        channel: string;
        channelReasoning: string;
        messageTemplate: string;
        reasoning: string;
        campaignName: string;
      };
    } catch (error) {
      logger.error('AI campaign copilot failed, using deterministic fallback', { error, goal });
      return fallbackCampaignRecommendation(goal, customerStats);
    }
  },

  async personalizeMessage(template: string, customer: {
    name: string;
    city?: string;
    last_order_at?: string;
    total_spent?: number;
  }): Promise<string> {
    const daysSinceLastOrder = customer.last_order_at
      ? Math.floor((Date.now() - new Date(customer.last_order_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return template
      .replace(/\{\{name\}\}/g, customer.name.split(' ')[0])
      .replace(/\{\{city\}\}/g, customer.city || 'your city')
      .replace(/\{\{last_purchase_days\}\}/g, daysSinceLastOrder ? `${daysSinceLastOrder} days` : 'a while')
      .replace(/\{\{total_spent\}\}/g, customer.total_spent ? `INR ${customer.total_spent.toLocaleString('en-IN')}` : '');
  },
};
