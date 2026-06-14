# Xeno Assignment Requirements Audit

Source checked: `C:\Users\krith\Downloads\Xeno Engineering Internship Assignment - 2026.pdf`

## Status Summary

| Assignment requirement | Status | Where implemented |
|---|---:|---|
| Shopper/consumer CRM, not sales/support CRM | Done | Cafe-focused CRM UI and backend modules |
| Ingest customers and orders | Done | `POST /api/customers/seed`, `customers`, `orders` tables |
| Store customer details and purchase history | Done | `customers` and `orders` schema/repositories |
| Segment shoppers by behavior/attributes | Done | Segments UI, `filter.translator.ts`, segment repository |
| AI-native segmentation | Done | `POST /api/segments/ai-query`, Gemini + deterministic fallback |
| AI assists audience/message/channel decisions | Done | Campaign Copilot recommends segment, template, channel |
| Personalized communications | Done | `{{name}}`, `{{city}}`, `{{last_purchase_days}}`, `{{total_spent}}` personalization |
| Separate stubbed Channel Service | Done | `packages/channel-service`, independent Express service |
| No real WhatsApp/SMS/Email provider | Done | Channel Service simulates lifecycle locally |
| CRM calls Channel Service on campaign launch | Done | `campaign.service.ts` posts to `/api/channel/send` |
| Channel Service asynchronously calls CRM callbacks | Done | `delivery.simulator.ts` posts to `/api/callbacks/communication-event` |
| Track sent/delivered/failed/opened/read/clicked/purchased | Done | `communications`, `communication_events`, `campaign_stats` |
| Campaign/audience performance insights | Done | Campaign detail, Campaigns list, Analytics dashboard |
| Handle retries/failures/idempotency | Done | Channel retry logic + callback idempotency key |
| System design and tradeoffs explained | Done | `docs/ARCHITECTURE.md`, `docs/architecture-diagram.png` |
| Architecture diagram | Done | `docs/architecture-diagram.png` |
| Code repository | Ready locally | Needs final GitHub/public repo link for submission |
| Hosted working product | Needs deployment confirmation | Render/Vercel config exists, but public URLs must be deployed/submitted |
| Walkthrough video | Needs recording | `docs/WALKTHROUGH.md` provides script |

## Important Notes

- The current app correctly uses a separate Channel Service stub. The wording in the app says "Stubbed Channel Results" to make clear that callbacks flow through the local service and no real external provider is called. That matches the assignment.
- Seed data is now cafe-focused and resets old demo records before inserting fresh cafe customers/orders.
- Campaign delete support was added through `DELETE /api/campaigns/:id` and frontend delete buttons.

## Final Submission Checklist

1. Deploy CRM backend and channel service, then set `CHANNEL_SERVICE_URL` and `CRM_CALLBACK_URL` to public Render URLs.
2. Deploy frontend and set `VITE_API_URL` to the public backend URL.
3. Run DB migration on the production Neon database.
4. Seed cafe data from the deployed dashboard.
5. Record a 5-6 minute walkthrough using `docs/WALKTHROUGH.md`.
6. Submit hosted URL, repository link, and video link in the Xeno form.
