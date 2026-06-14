import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyticsApi, campaignApi, OverviewStats, Campaign } from '../services/api';
import { StatCard, LoadingSpinner, PageHeader, MetricFunnel } from '../components/ui';
import { TrendingUp, MessageSquare, Users, Megaphone } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-navy-800 border border-white/10 rounded-lg p-3 text-sm shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-white font-bold">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.overview(), campaignApi.list()])
      .then(([s, c]) => {
        setStats(s.data);
        setCampaigns(c.data.filter((c: Campaign) => (c.total_sent || 0) > 0));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32"><LoadingSpinner size={32} /></div>
  );

  const s = stats?.campaigns;
  const cs = stats?.customers;
  const totalSent = Number(s?.total_messages_sent || 0);
  const totalDelivered = Number(s?.total_delivered || 0);
  const totalOpened = Number(s?.total_opened || 0);
  const totalClicked = Number(s?.total_clicked || 0);
  const totalPurchased = Number(s?.total_purchased || 0);
  const totalRevenue = Number(s?.total_revenue || 0);

  // Revenue per campaign for bar chart
  const revenueData = campaigns
    .filter(c => (c.revenue_attributed || 0) > 0)
    .sort((a, b) => (b.revenue_attributed || 0) - (a.revenue_attributed || 0))
    .slice(0, 8)
    .map(c => ({
      name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name,
      revenue: Number(c.revenue_attributed || 0),
    }));

  const funnelSteps = [
    { label: 'Sent', value: totalSent, color: 'bg-indigo-500' },
    { label: 'Delivered', value: totalDelivered, color: 'bg-sky-500' },
    { label: 'Opened', value: totalOpened, color: 'bg-violet-500' },
    { label: 'Clicked', value: totalClicked, color: 'bg-emerald-500' },
    { label: 'Purchased', value: totalPurchased, color: 'bg-amber-500' },
  ];

  // Channel breakdown from campaigns
  const channelMap: Record<string, { sent: number; revenue: number; count: number }> = {};
  for (const c of campaigns) {
    const ch = c.channel;
    if (!channelMap[ch]) channelMap[ch] = { sent: 0, revenue: 0, count: 0 };
    channelMap[ch].sent += c.total_sent || 0;
    channelMap[ch].revenue += Number(c.revenue_attributed || 0);
    channelMap[ch].count++;
  }

  const CHART_COLORS = ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#ddd6fe'];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle="Cross-campaign performance overview" />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Customers" value={cs?.total?.toLocaleString() || '0'} icon={Users} color="indigo" />
        <StatCard label="Campaigns Run" value={Number(s?.total_campaigns || 0).toLocaleString()} icon={Megaphone} color="emerald" />
        <StatCard label="Messages Sent" value={totalSent.toLocaleString()} icon={MessageSquare} color="amber" />
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} icon={TrendingUp} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Global Funnel */}
        <div className="card">
          <h2 className="section-title mb-6">Engagement Funnel</h2>
          {totalSent === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No campaign data yet</p>
          ) : (
            <MetricFunnel steps={funnelSteps} total={totalSent} />
          )}
        </div>

        {/* Key rates */}
        <div className="card lg:col-span-2">
          <h2 className="section-title mb-5">Platform Rates</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Avg Delivery Rate', value: totalSent > 0 ? `${((totalDelivered / totalSent) * 100).toFixed(1)}%` : '—', color: 'text-sky-400', desc: `${totalDelivered.toLocaleString()} delivered` },
              { label: 'Avg Open Rate', value: totalDelivered > 0 ? `${((totalOpened / totalDelivered) * 100).toFixed(1)}%` : '—', color: 'text-violet-400', desc: `${totalOpened.toLocaleString()} opened` },
              { label: 'Avg Click Rate', value: totalOpened > 0 ? `${((totalClicked / totalOpened) * 100).toFixed(1)}%` : '—', color: 'text-emerald-400', desc: `${totalClicked.toLocaleString()} clicked` },
              { label: 'Purchase Rate', value: totalClicked > 0 ? `${((totalPurchased / totalClicked) * 100).toFixed(1)}%` : '—', color: 'text-amber-400', desc: `${totalPurchased.toLocaleString()} purchases` },
            ].map(({ label, value, color, desc }) => (
              <div key={label} className="card-sm">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">{label}</p>
                <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by campaign */}
      {revenueData.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-title mb-6">Revenue by Campaign</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {revenueData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Channel breakdown */}
      {Object.keys(channelMap).length > 0 && (
        <div className="card">
          <h2 className="section-title mb-5">Channel Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(channelMap).map(([channel, data]) => (
              <div key={channel} className="card-sm">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">{channel}</p>
                <p className="text-xl font-display font-bold text-white">{data.sent.toLocaleString()}</p>
                <p className="text-xs text-slate-500">messages · {data.count} campaigns</p>
                <p className="text-xs text-amber-400 mt-1 font-medium">
                  ₹{data.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} revenue
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
