const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const out = path.resolve(__dirname, '..', 'docs', 'architecture-diagram.png');
const width = 1800;
const height = 1200;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

const colors = {
  bg: '#0b1120',
  panel: '#111827',
  panel2: '#172033',
  text: '#f8fafc',
  muted: '#94a3b8',
  line: '#38bdf8',
  green: '#34d399',
  amber: '#f59e0b',
  violet: '#a78bfa',
  rose: '#fb7185',
  border: '#334155',
};

function roundRect(x, y, w, h, r, fill, stroke = colors.border) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function text(str, x, y, size = 30, color = colors.text, weight = '600', align = 'left') {
  ctx.font = `${weight} ${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(str, x, y);
}

function wrap(str, x, y, maxWidth, lineHeight, size = 24, color = colors.muted, weight = '400') {
  ctx.font = `${weight} ${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const words = str.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy + lineHeight;
}

function box({ x, y, w, h, title, subtitle, badge, color }) {
  roundRect(x, y, w, h, 22, colors.panel, color);
  text(title, x + 28, y + 24, 32, colors.text, '700');
  wrap(subtitle, x + 28, y + 72, w - 56, 30, 23, colors.muted);
}

function arrow(x1, y1, x2, y2, label, color = colors.line, labelOffsetY = -44) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 16;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  if (label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 + labelOffsetY;
    text(label, mx, my, 18, color, '700', 'center');
  }
}

ctx.fillStyle = colors.bg;
ctx.fillRect(0, 0, width, height);
text('CoffeeReach AI-Native CRM Architecture', 80, 58, 48, colors.text, '800');
wrap('Cafe-focused shopper CRM: ingest customer/order data, let AI choose audience/message/channel, send through a separate Channel Service, and track callback-driven results.', 80, 124, 1420, 34, 25, colors.muted);

box({
  x: 80, y: 250, w: 360, h: 210,
  title: 'React Frontend',
  subtitle: 'Dashboard, customers, segments, campaign copilot, campaign analytics, delete campaign action.',
  badge: 'Vite UI',
  color: colors.violet,
});

box({
  x: 580, y: 230, w: 430, h: 250,
  title: 'CRM Backend',
  subtitle: 'Express API for customers, orders, segments, campaigns, callbacks, analytics. Owns persistence and business rules.',
  badge: 'Node + TS',
  color: colors.line,
});

box({
  x: 1180, y: 250, w: 420, h: 210,
  title: 'Gemini AI',
  subtitle: 'Turns marketer intent into segment JSON, message templates, channel recommendation, and explainable reasoning.',
  badge: 'AI Copilot',
  color: colors.amber,
});

box({
  x: 580, y: 570, w: 430, h: 225,
  title: 'PostgreSQL / Neon',
  subtitle: 'Stores cafe customers, orders, saved segments, campaigns, communications, callback events, and materialized campaign stats.',
  badge: 'Source of Truth',
  color: colors.green,
});

box({
  x: 1180, y: 570, w: 420, h: 225,
  title: 'Channel Service',
  subtitle: 'Separate stub service. Accepts sends, simulates delivery lifecycle, retries callbacks, and posts events back to CRM.',
  badge: 'Port 3002',
  color: colors.rose,
});

box({
  x: 80, y: 570, w: 360, h: 225,
  title: 'Marketer Workflow',
  subtitle: 'Seed cafe data, ask for an audience, review AI recommendation, choose WhatsApp/SMS/Email, launch, then inspect results.',
  badge: 'Human Review',
  color: colors.violet,
});

arrow(440, 355, 580, 355, 'REST /api');
arrow(1010, 315, 1180, 315, 'AI request');
arrow(1180, 395, 1010, 395, 'JSON response', colors.amber, 36);
arrow(795, 480, 795, 570, 'SQL writes');
arrow(1010, 660, 1180, 660, 'POST /send');
arrow(1180, 735, 1010, 735, 'event callbacks', colors.rose, 30);
arrow(440, 680, 580, 680, 'campaign actions', colors.violet);
arrow(880, 570, 880, 480, 'analytics reads', colors.green, -30);

text('Major decisions and reasoning', 80, 850, 36, colors.text, '800');
const decisions = [
  ['Separate Channel Service', 'Matches assignment and real provider architecture; proves async callback handling instead of fake in-process status updates.'],
  ['Structured AI filters', 'AI outputs JSON, not SQL. The backend translator validates fields/operators and uses parameterized SQL for safety.'],
  ['Materialized campaign_stats', 'Callback writes increment counters once, so dashboards are fast and do not scan every communication on each load.'],
  ['Fire-and-forget dispatch', 'Good for demo scale and responsive UI. At production scale, replace with BullMQ/SQS workers and retries.'],
  ['Cafe seed reset', 'Seed action replaces old demo records so the app stays focused on one coherent cafe CRM dataset.'],
  ['Human-in-the-loop Copilot', 'AI recommends audience, message, and channel, but the marketer reviews/edits before launch.'],
];

let y = 908;
for (let i = 0; i < decisions.length; i++) {
  const x = i % 2 === 0 ? 80 : 930;
  if (i % 2 === 0 && i > 0) y += 92;
  roundRect(x, y, 760, 72, 16, colors.panel2, colors.border);
  text(decisions[i][0], x + 22, y + 14, 22, colors.text, '700');
  wrap(decisions[i][1], x + 22, y + 40, 705, 24, 18, colors.muted);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, canvas.toBuffer('image/png'));
console.log(out);
