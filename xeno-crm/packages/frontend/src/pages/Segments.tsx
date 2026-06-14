import React, { useEffect, useState } from 'react';
import { Layers, Sparkles, Plus, Users, ChevronRight, X } from 'lucide-react';
import { segmentApi, Segment, Customer } from '../services/api';
import { EmptyState, LoadingSpinner, PageHeader } from '../components/ui';
import { useNavigate } from 'react-router-dom';

const EXAMPLE_QUERIES = [
  'Customers who spent more than INR 5000 in the last 90 days',
  'Cafe customers who haven\'t ordered in 60 days',
  'Customers who ordered cold coffee or pastries twice',
  'First-time buyers from Mumbai or Delhi',
  'High-value lapsed cafe customers inactive for 30+ days',
];

function AIQueryPanel({ onSave }: { onSave: () => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    filterJson: object;
    segmentName: string;
    description: string;
    sqlPreview: string;
    customerCount: number;
    customerSample: Customer[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await segmentApi.aiQuery(query);
      setResult(res.data);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Failed to parse query. Try rephrasing.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await segmentApi.create({
        name: result.segmentName,
        description: result.description,
        filter_json: result.filterJson,
        ai_query: query,
      });
      onSave();
      setResult(null);
      setQuery('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card ai-glow mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-indigo-500/15 rounded-lg flex items-center justify-center">
          <Sparkles size={14} className="text-indigo-400" />
        </div>
        <h2 className="font-display font-semibold text-white">AI Segment Builder</h2>
      </div>

      <div className="relative mb-3">
        <textarea
          className="input resize-none h-20 text-sm font-mono"
          placeholder='Describe your audience in plain language...'
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleQuery(); }}
        />
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {EXAMPLE_QUERIES.map(q => (
          <button
            key={q}
            onClick={() => setQuery(q)}
            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-full border border-white/10 transition-colors"
          >
            {q.length > 45 ? q.slice(0, 45) + '…' : q}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleQuery}
          disabled={loading || !query.trim()}
          className="btn-primary"
        >
          {loading ? <LoadingSpinner size={16} /> : <Sparkles size={16} />}
          {loading ? 'Analyzing...' : 'Find Audience'}
        </button>
        <span className="text-xs text-slate-500 self-center">⌘ + Enter</span>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      {result && (
        <div className="mt-6 animate-slide-up space-y-4">
          <div className="border-t border-white/5 pt-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-white">{result.segmentName}</h3>
                <p className="text-sm text-slate-400 mt-1">{result.description}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-2xl font-display font-bold text-white">{result.customerCount.toLocaleString()}</p>
                <p className="text-xs text-slate-400">matching customers</p>
              </div>
            </div>

            {/* SQL Preview */}
            <div className="bg-navy-950 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Query preview</p>
              <p className="font-mono text-xs text-indigo-400">{result.sqlPreview}</p>
            </div>

            {/* Sample customers */}
            {result.customerSample.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Sample ({Math.min(5, result.customerSample.length)} of {result.customerCount})</p>
                <div className="grid grid-cols-2 gap-2">
                  {result.customerSample.slice(0, 4).map(c => (
                    <div key={c.id} className="flex items-center gap-2 p-2 bg-white/3 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">{c.name[0]}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{c.name}</p>
                        <p className="text-xs text-slate-500">₹{Number(c.total_spent).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <LoadingSpinner size={16} /> : <Plus size={16} />}
                Save Segment
              </button>
              <button onClick={() => setResult(null)} className="btn-ghost">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Segments() {
  const navigate = useNavigate();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSegments = async () => {
    const res = await segmentApi.list();
    setSegments(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchSegments(); }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Segments"
        subtitle="AI-powered audience builder"
      />

      <AIQueryPanel onSave={fetchSegments} />

      {/* Saved segments */}
      <h2 className="section-title mb-4">Saved Segments</h2>
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size={24} /></div>
      ) : segments.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No saved segments yet"
          description="Use the AI builder above to define and save your first audience segment."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map(s => (
            <button
              key={s.id}
              onClick={() => navigate(`/campaigns/new?segmentId=${s.id}`)}
              className="card text-left hover:border-indigo-500/20 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-white group-hover:text-indigo-300 transition-colors">{s.name}</h3>
                  {s.description && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{s.description}</p>}
                  {s.ai_query && (
                    <p className="text-xs font-mono text-slate-500 mt-2 bg-white/3 px-2 py-1 rounded truncate">"{s.ai_query}"</p>
                  )}
                </div>
                <ChevronRight size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors ml-3 shrink-0 mt-1" />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Users size={14} className="text-slate-500" />
                <span className="text-sm font-medium text-white">{s.customer_count.toLocaleString()}</span>
                <span className="text-sm text-slate-400">customers</span>
                <span className="ml-auto text-xs text-slate-500">
                  {new Date(s.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
