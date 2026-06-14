import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
  trend?: { value: number; label: string };
}

export function StatCard({ label, value, sub, icon: Icon, color = 'indigo', trend }: StatCardProps) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
  };

  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          <p className="stat-value">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          {trend && (
            <p className={clsx('text-xs mt-2', trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Channel Badge ────────────────────────────────────────────────────────────
const CHANNEL_CONFIG = {
  email: { label: 'Email', color: 'badge-blue' },
  sms: { label: 'SMS', color: 'badge-green' },
  whatsapp: { label: 'WhatsApp', color: 'badge-green' },
  rcs: { label: 'RCS', color: 'badge-yellow' },
};

export function ChannelBadge({ channel }: { channel: string }) {
  const config = CHANNEL_CONFIG[channel as keyof typeof CHANNEL_CONFIG] || { label: channel, color: 'badge-gray' };
  return <span className={config.color}>{config.label}</span>;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'badge-gray' },
  sending: { label: 'Sending', color: 'badge-yellow' },
  completed: { label: 'Completed', color: 'badge-green' },
  failed: { label: 'Failed', color: 'badge-red' },
  delivered: { label: 'Delivered', color: 'badge-green' },
  opened: { label: 'Opened', color: 'badge-blue' },
  clicked: { label: 'Clicked', color: 'badge-blue' },
  purchased: { label: 'Purchased', color: 'badge-green' },
  queued: { label: 'Queued', color: 'badge-gray' },
  sent: { label: 'Sent', color: 'badge-yellow' },
  failed_delivery: { label: 'Failed', color: 'badge-red' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || { label: status, color: 'badge-gray' };
  return <span className={config.color}>{config.label}</span>;
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────
export function TierBadge({ tier }: { tier: string }) {
  const config = {
    gold: 'badge bg-amber-500/15 text-amber-300 border border-amber-500/20',
    silver: 'badge bg-slate-400/15 text-slate-300 border border-slate-400/20',
    bronze: 'badge bg-orange-900/30 text-orange-300 border border-orange-800/20',
  };
  return <span className={config[tier as keyof typeof config] || 'badge-gray'}>{tier}</span>;
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx('animate-spin text-indigo-400', className)} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-indigo-400" />
      </div>
      <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'indigo', label }: { value: number; max: number; color?: string; label?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
  };
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span>{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-1000', colorMap[color] || 'bg-indigo-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Metric Funnel ────────────────────────────────────────────────────────────
interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

export function MetricFunnel({ steps, total }: { steps: FunnelStep[]; total: number }) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">{step.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">{step.value.toLocaleString()}</span>
              <span className="text-slate-500 text-xs w-10 text-right">
                {total > 0 ? ((step.value / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full funnel-bar', step.color)}
              style={{ width: total > 0 ? `${(step.value / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
