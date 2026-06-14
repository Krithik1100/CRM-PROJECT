import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, MessageSquare, Users,
  TrendingUp, CheckCircle, XCircle, Mail, MousePointer, ShoppingBag, FlaskConical, Trash2
} from 'lucide-react';
import { campaignApi, Campaign } from '../services/api';
import {
  ChannelBadge, StatusBadge, LoadingSpinner,
  MetricFunnel, ProgressBar
} from '../components/ui';

function StatBox({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="card-sm text-center">
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCampaign = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await campaignApi.get(id);
      setCampaign(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteCampaign = async () => {
    if (!campaign || !window.confirm(`Delete campaign "${campaign.name}"? This removes its messages and analytics.`)) return;
    await campaignApi.delete(campaign.id);
    navigate('/campaigns');
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  // Live polling while campaign is sending
  useEffect(() => {
    if (campaign?.status === 'sending') {
      pollRef.current = setInterval(() => fetchCampaign(true), 4000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [campaign?.status]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <LoadingSpinner size={32} />
    </div>
  );

  if (!campaign) return (
    <div className="text-center py-32 text-slate-400">Campaign not found.</div>
  );

  const sent = campaign.total_sent || 0;
  const delivered = campaign.total_delivered || 0;
  const failed = campaign.total_failed || 0;
  const opened = campaign.total_opened || 0;
  const read = campaign.total_read || 0;
  const clicked = campaign.total_clicked || 0;
  const purchased = campaign.total_purchased || 0;
  const revenue = Number(campaign.revenue_attributed || 0);

  const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '—';
  const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '—';
  const clickRate = opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '—';
  const convRate = clicked > 0 ? ((purchased / clicked) * 100).toFixed(1) : '—';

  const funnelSteps = [
    { label: 'Sent', value: sent, color: 'bg-indigo-500' },
    { label: 'Delivered', value: delivered, color: 'bg-sky-500' },
    { label: 'Opened', value: opened, color: 'bg-violet-500' },
    { label: 'Read', value: read, color: 'bg-purple-500' },
    { label: 'Clicked', value: clicked, color: 'bg-emerald-500' },
    { label: 'Purchased', value: purchased, color: 'bg-amber-500' },
  ];

  const communications = (campaign as Campaign & { communications?: Array<{
    id: string; customer_name?: string; recipient: string; status: string; channel: string; message: string;
  }> }).communications || [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button onClick={() => navigate('/campaigns')} className="btn-ghost p-2 mt-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-white">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
            <ChannelBadge channel={campaign.channel} />
            {campaign.status === 'sending' && (
              <span className="flex items-center gap-1.5 text-sm text-amber-400">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Live — updating every 4s
              </span>
            )}
          </div>
          {campaign.goal && (
            <p className="text-slate-400 mt-1 text-sm italic">"{campaign.goal}"</p>
          )}
          {campaign.segment_name && (
            <p className="text-slate-500 text-xs mt-1">Segment: {campaign.segment_name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchCampaign(true)} className="btn-ghost p-2" title="Refresh">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={deleteCampaign} className="btn-ghost p-2 text-slate-500 hover:text-rose-300" title="Delete campaign">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Key rates row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="Delivery Rate" value={`${deliveryRate}%`} sub={`${delivered.toLocaleString()} delivered`} color="text-sky-400" />
        <StatBox label="Open Rate" value={`${openRate}%`} sub={`${opened.toLocaleString()} opened`} color="text-violet-400" />
        <StatBox label="Click Rate" value={`${clickRate}%`} sub={`${clicked.toLocaleString()} clicked`} color="text-emerald-400" />
        <StatBox label="Conversion Rate" value={`${convRate}%`} sub={`${purchased.toLocaleString()} purchased`} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Funnel */}
        <div className="card lg:col-span-1">
          <h2 className="section-title mb-5">Engagement Funnel</h2>
          {sent === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <MetricFunnel steps={funnelSteps} total={sent} />
          )}
        </div>

        {/* Stats grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card border-sky-500/20 bg-sky-500/5">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical size={14} className="text-sky-300" />
              <p className="text-xs text-sky-300 uppercase tracking-wider">Stubbed Channel Results</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              These results come from the running Channel Service callback flow. The service processes the campaign send request and posts back sent, delivered, opened, read, clicked, purchased, and revenue events to the CRM.
            </p>
          </div>

          {/* Revenue */}
          <div className="card border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Revenue Attributed</p>
                <p className="font-display text-3xl font-bold text-white">
                  ₹{revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  from {purchased.toLocaleString()} purchases
                  {purchased > 0 && ` · avg ₹${Math.round(revenue / purchased).toLocaleString('en-IN')}`}
                </p>
              </div>
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} className="text-amber-400" />
              </div>
            </div>
          </div>

          {/* Volume breakdown */}
          <div className="card">
            <h3 className="section-title mb-4">Volume Breakdown</h3>
            <div className="space-y-3">
              <ProgressBar value={delivered} max={sent} color="sky" label={`Delivered (${delivered.toLocaleString()})`} />
              <ProgressBar value={failed} max={sent} color="rose" label={`Failed (${failed.toLocaleString()})`} />
              <ProgressBar value={opened} max={sent} color="violet" label={`Opened (${opened.toLocaleString()})`} />
              <ProgressBar value={clicked} max={sent} color="emerald" label={`Clicked (${clicked.toLocaleString()})`} />
              <ProgressBar value={purchased} max={sent} color="amber" label={`Purchased (${purchased.toLocaleString()})`} />
            </div>
          </div>

          {/* AI Reasoning */}
          {campaign.ai_reasoning && (
            <div className="card border-indigo-500/20 bg-indigo-500/5">
              <p className="text-xs text-indigo-400 uppercase tracking-wider mb-2">AI Reasoning</p>
              <p className="text-sm text-slate-300 leading-relaxed">{campaign.ai_reasoning}</p>
            </div>
          )}
        </div>
      </div>

      {/* Message template */}
      <div className="card mb-6">
        <h2 className="section-title mb-3">Message Template</h2>
        <div className="bg-navy-950 rounded-xl p-4 font-mono text-sm text-slate-300 leading-relaxed border border-white/5">
          {campaign.message_template}
        </div>
      </div>

      {/* Communications sample */}
      {communications.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">
            Communications Sample
            <span className="text-sm text-slate-500 font-normal ml-2">(first 50)</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Recipient', 'Customer', 'Status', 'Channel'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {communications.slice(0, 50).map(c => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-3 py-2 text-slate-400 font-mono text-xs">{c.recipient.slice(0, 20)}***</td>
                    <td className="px-3 py-2 text-white">{c.customer_name || '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2"><ChannelBadge channel={c.channel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
