import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Sparkles, ChevronRight, Trash2 } from 'lucide-react';
import { campaignApi, Campaign } from '../services/api';
import { ChannelBadge, StatusBadge, EmptyState, LoadingSpinner, PageHeader } from '../components/ui';

function RateDisplay({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  return (
    <div className="text-center">
      <p className={`text-lg font-display font-bold ${color}`}>{pct}%</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const deleteCampaign = async (id: string, name: string) => {
    if (!window.confirm(`Delete campaign "${name}"? This removes its messages and analytics.`)) return;
    await campaignApi.delete(id);
    setCampaigns(current => current.filter(c => c.id !== id));
  };

  useEffect(() => {
    campaignApi.list().then(r => {
      setCampaigns(r.data);
      setLoading(false);
    });
    // Poll every 10s while any campaign is sending
    const interval = setInterval(async () => {
      const res = await campaignApi.list();
      setCampaigns(res.data);
      const hasSending = res.data.some((c: Campaign) => c.status === 'sending');
      if (!hasSending) clearInterval(interval);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Campaigns"
        subtitle={`${campaigns.length} campaigns · results are simulated by the Channel Service stub`}
        action={
          <button onClick={() => navigate('/campaigns/new')} className="btn-primary">
            <Sparkles size={16} /> New Campaign
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size={28} /></div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Use the AI Campaign Copilot to create your first campaign in minutes."
          action={
            <button onClick={() => navigate('/campaigns/new')} className="btn-primary">
              <Sparkles size={16} /> Start with AI Copilot
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const sent = c.total_sent || 0;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/campaigns/${c.id}`)}
                className="w-full text-left card hover:border-white/10 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-display font-semibold text-white group-hover:text-indigo-300 transition-colors">{c.name}</h3>
                      <StatusBadge status={c.status} />
                      {c.status === 'sending' && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                    {c.goal && <p className="text-sm text-slate-400 line-clamp-1 mb-3">"{c.goal}"</p>}
                    <div className="flex items-center gap-3 flex-wrap">
                      <ChannelBadge channel={c.channel} />
                      {c.segment_name && <span className="text-xs text-slate-500">{c.segment_name}</span>}
                      <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  {sent > 0 && (
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-display font-bold text-white">{sent.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">sent</p>
                      </div>
                      <RateDisplay label="delivered" value={c.total_delivered || 0} total={sent} color="text-sky-400" />
                      <RateDisplay label="opened" value={c.total_opened || 0} total={sent} color="text-violet-400" />
                      <RateDisplay label="clicked" value={c.total_clicked || 0} total={sent} color="text-emerald-400" />
                      <div className="text-center">
                        <p className="text-lg font-display font-bold text-amber-400">
                          ₹{Number(c.revenue_attributed || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-slate-500">revenue</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCampaign(c.id, c.name);
                      }}
                      className="btn-ghost p-2 text-slate-500 hover:text-rose-300"
                      title="Delete campaign"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
