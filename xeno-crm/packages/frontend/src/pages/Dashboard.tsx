import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Megaphone, MessageSquare, TrendingUp, Sparkles, ArrowRight, Database } from 'lucide-react';
import { analyticsApi, customerApi, campaignApi, OverviewStats, Campaign } from '../services/api';
import { StatCard, StatusBadge, ChannelBadge, LoadingSpinner, MetricFunnel } from '../components/ui';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    Promise.all([
      analyticsApi.overview(),
      campaignApi.list(),
    ]).then(([s, c]) => {
      setStats(s.data);
      setCampaigns(c.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('Replacing old data with cafe customers and orders...');
    try {
      await customerApi.seed(30);
      setSeedMsg('Cafe data seeded. Refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setSeedMsg('❌ Seed failed. Check API connection.');
    } finally {
      setSeeding(false);
    }
  };

  const s = stats?.campaigns;
  const cs = stats?.customers;

  const funnelSteps = s ? [
    { label: 'Sent', value: Number(s.total_messages_sent), color: 'bg-indigo-500' },
    { label: 'Delivered', value: Number(s.total_delivered), color: 'bg-sky-500' },
    { label: 'Opened', value: Number(s.total_opened), color: 'bg-violet-500' },
    { label: 'Clicked', value: Number(s.total_clicked), color: 'bg-emerald-500' },
    { label: 'Purchased', value: Number(s.total_purchased), color: 'bg-amber-500' },
  ] : [];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">
          Good morning. <span className="gradient-text">What's your goal today?</span>
        </h1>
        <p className="text-slate-400 mt-2">AI-powered shopper engagement for your brand.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/campaigns/new')}
          className="card hover:border-indigo-500/30 transition-all duration-200 text-left group ai-glow"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/15 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors">
              <Sparkles size={22} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-white">AI Campaign Copilot</p>
              <p className="text-sm text-slate-400 mt-0.5">Describe your goal → AI builds the campaign</p>
            </div>
            <ArrowRight size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>
        </button>

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="card hover:border-white/10 transition-all duration-200 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
              {seeding ? <LoadingSpinner size={22} /> : <Database size={22} className="text-slate-400" />}
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-white">Seed Cafe Data</p>
              <p className="text-sm text-slate-400 mt-0.5">
                {seedMsg || 'Replace old data with 30 cafe customers + orders'}
              </p>
            </div>
            {!seeding && <ArrowRight size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />}
          </div>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size={32} /></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Customers"
              value={cs?.total?.toLocaleString() || '0'}
              sub={`Avg spend INR ${Number(cs?.avg_spent || 0).toLocaleString('en-IN')}`}
              icon={Users}
              color="indigo"
            />
            <StatCard
              label="Campaigns"
              value={Number(s?.total_campaigns || 0).toLocaleString()}
              icon={Megaphone}
              color="emerald"
            />
            <StatCard
              label="Messages Sent"
              value={Number(s?.total_messages_sent || 0).toLocaleString()}
              icon={MessageSquare}
              color="amber"
            />
            <StatCard
              label="Revenue Attributed"
              value={`₹${Number(s?.total_revenue || 0).toLocaleString('en-IN')}`}
              icon={TrendingUp}
              color="rose"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Engagement Funnel */}
            <div className="card lg:col-span-1">
              <h2 className="section-title mb-6">Overall Funnel</h2>
              {Number(s?.total_messages_sent || 0) === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Launch a campaign to see funnel data</p>
              ) : (
                <MetricFunnel steps={funnelSteps} total={Number(s?.total_messages_sent || 1)} />
              )}
            </div>

            {/* Recent Campaigns */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-title">Recent Campaigns</h2>
                <button onClick={() => navigate('/campaigns')} className="btn-ghost text-xs">
                  View all <ArrowRight size={14} />
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No campaigns yet.</p>
                  <button onClick={() => navigate('/campaigns/new')} className="btn-primary mt-4 mx-auto">
                    <Sparkles size={16} /> Create your first
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(c => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                      className="w-full text-left p-4 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 transition-all duration-150 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">{c.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <ChannelBadge channel={c.channel} />
                            <StatusBadge status={c.status} />
                            {c.segment_name && (
                              <span className="text-xs text-slate-500 truncate">{c.segment_name}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-sm font-medium text-white">{(c.total_sent || 0).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">sent</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
