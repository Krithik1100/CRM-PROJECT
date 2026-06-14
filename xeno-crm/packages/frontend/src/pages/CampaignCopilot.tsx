import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ArrowLeft, Rocket, MessageSquare,
  Users, Zap, CheckCircle, Edit3, Mail, Smartphone
} from 'lucide-react';
import { campaignApi, segmentApi, CopilotRecommendation, Segment } from '../services/api';
import { ChannelBadge, LoadingSpinner } from '../components/ui';

const GOAL_EXAMPLES = [
  'Win back customers who haven\'t ordered in 60 days',
  'Upsell loyal cafe customers to our premium coffee plan',
  'Congratulate first-time buyers and encourage a second purchase',
  'Promote weekend flash sale to inactive coffee customers',
  'Send a monthly newsletter to regular coffee customers',
];

const CHANNEL_OPTIONS = [
  {
    value: 'whatsapp',
    label: 'WhatsApp',
    type: 'Urgent Offer',
    reason: 'Best for short, time-sensitive offers and win-back messages.',
    Icon: MessageSquare,
  },
  {
    value: 'email',
    label: 'Email',
    type: 'Newsletter',
    reason: 'Best for newsletters, premium offers, and detailed updates.',
    Icon: Mail,
  },
  {
    value: 'sms',
    label: 'SMS',
    type: 'Reminder',
    reason: 'Best for short reminders and simple nudges.',
    Icon: Smartphone,
  },
] as const;

// Typewriter hook
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(timer); setDone(true); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

type Step = 'goal' | 'analyzing' | 'review' | 'preview' | 'launching' | 'done';

export default function CampaignCopilot() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledSegmentId = searchParams.get('segmentId');

  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState('');
  const [recommendation, setRecommendation] = useState<CopilotRecommendation | null>(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [editedName, setEditedName] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState(prefilledSegmentId || '');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [createdCampaign, setCreatedCampaign] = useState<{ id: string } | null>(null);
  const [error, setError] = useState('');
  const [launchResult, setLaunchResult] = useState<{ totalTargeted: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { displayed: reasoningText, done: reasoningDone } = useTypewriter(
    step === 'review' ? (recommendation?.reasoning || '') : '',
    12
  );

  useEffect(() => {
    segmentApi.list().then(r => setSegments(r.data));
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  const handleAnalyze = async () => {
    if (!goal.trim()) return;
    setStep('analyzing');
    setError('');
    try {
      const res = await campaignApi.copilot(goal);
      setRecommendation(res.data);
      setEditedMessage(res.data.messageTemplate);
      setEditedName(res.data.campaignName);
      setSelectedChannel(['whatsapp', 'email', 'sms'].includes(res.data.channel) ? res.data.channel as 'whatsapp' | 'email' | 'sms' : 'whatsapp');
      setStep('review');
    } catch (e: unknown) {
      setError('Failed to analyze goal. Check your API connection and try again.');
      setStep('goal');
    }
  };

  const handleCreateAndPreview = async () => {
    if (!recommendation) return;
    setStep('preview');

    // Create segment from recommendation if no segment selected
    let segId = selectedSegmentId;
    if (!segId) {
      const segRes = await segmentApi.create({
        name: recommendation.segmentName,
        description: recommendation.segmentDescription,
        filter_json: recommendation.filterJson,
        ai_query: goal,
      });
      segId = segRes.data.id;
      setSelectedSegmentId(segId);
    }

    const res = await campaignApi.create({
      name: editedName,
      goal,
      segment_id: segId,
      channel: selectedChannel,
      message_template: editedMessage,
      ai_reasoning: recommendation.reasoning,
    });
    setCreatedCampaign(res.data);
  };

  const handleLaunch = async () => {
    if (!createdCampaign) return;
    setStep('launching');
    try {
      const res = await campaignApi.launch(createdCampaign.id);
      setLaunchResult(res.data);
      setStep('done');
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Launch failed.');
      setStep('preview');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        <button onClick={() => navigate('/campaigns')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: { goal: '10%', analyzing: '30%', review: '50%', preview: '75%', launching: '90%', done: '100%' }[step] }}
          />
        </div>
        <div className="flex items-center gap-1 text-indigo-400">
          <Sparkles size={16} />
          <span className="text-sm font-medium">AI Copilot</span>
        </div>
      </div>

      {/* Step: Goal */}
      {step === 'goal' && (
        <div className="animate-slide-up">
          <h1 className="font-display text-2xl font-bold text-white mb-2">What's your campaign goal?</h1>
          <p className="text-slate-400 mb-6">Describe what you want to achieve. The AI will handle the rest.</p>

          <div className="card ai-glow mb-4">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent text-white placeholder-slate-500 text-lg resize-none outline-none h-28 font-sans"
              placeholder="e.g. Win back customers who haven't ordered in 60 days..."
              value={goal}
              onChange={e => setGoal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAnalyze(); }}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {GOAL_EXAMPLES.map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-full border border-white/10 transition-colors"
              >
                {g}
              </button>
            ))}
          </div>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 mb-4">{error}</div>}

          <button onClick={handleAnalyze} disabled={!goal.trim()} className="btn-primary w-full justify-center py-3">
            <Sparkles size={18} /> Analyze with AI <ArrowRight size={18} />
          </button>
          <p className="text-center text-xs text-slate-500 mt-2">⌘ + Enter</p>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="animate-fade-in text-center py-20">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse-soft">
            <Sparkles size={28} className="text-indigo-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">AI is thinking...</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Analyzing your customer base, finding the right audience, drafting the perfect message.
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && recommendation && (
        <div className="animate-slide-up space-y-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">AI Recommendation</h1>
            <p className="text-slate-400 text-sm">Review and adjust before previewing.</p>
          </div>

          {/* Campaign name */}
          <div className="card">
            <label className="label">Campaign Name</label>
            <input
              className="input"
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
            />
          </div>

          {/* AI Reasoning */}
          <div className="card border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-indigo-400" />
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">AI Reasoning</span>
            </div>
            <p className={`text-sm text-slate-300 leading-relaxed ${!reasoningDone ? 'typewriter-cursor' : ''}`}>
              {reasoningText}
            </p>
          </div>

          {/* Audience */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-slate-400" />
              <span className="label mb-0">Target Audience</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{recommendation.segmentName}</p>
                <p className="text-sm text-slate-400 mt-1">{recommendation.segmentDescription}</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-2xl font-display font-bold text-white">{recommendation.estimatedAudience.toLocaleString()}</p>
                <p className="text-xs text-slate-500">customers</p>
              </div>
            </div>

            {/* Segment override */}
            {segments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <label className="label">Or use saved segment</label>
                <select className="input text-sm" value={selectedSegmentId} onChange={e => setSelectedSegmentId(e.target.value)}>
                  <option value="">Use AI recommendation</option>
                  {segments.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.customer_count} customers)</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Channel */}
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-slate-400" />
              <span className="label mb-0">Channel</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">{recommendation.channelReasoning}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CHANNEL_OPTIONS.map(({ value, label, type, reason, Icon }) => {
                const active = selectedChannel === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedChannel(value)}
                    className={`text-left rounded-lg border p-3 transition-colors ${
                      active
                        ? 'border-indigo-400 bg-indigo-500/10'
                        : 'border-white/10 bg-white/3 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className={active ? 'text-indigo-300' : 'text-slate-400'} />
                      <span className="text-sm font-medium text-white">{label}</span>
                    </div>
                    <p className="text-xs text-slate-400">{type}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">{reason}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-slate-400" />
              <span className="label mb-0">Message Template</span>
              <Edit3 size={12} className="text-slate-500 ml-auto" />
            </div>
            <textarea
              className="input resize-none h-28 text-sm"
              value={editedMessage}
              onChange={e => setEditedMessage(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Placeholders: {'{{name}}'} · {'{{city}}'} · {'{{last_purchase_days}}'} · {'{{total_spent}}'}
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('goal')} className="btn-secondary flex-1 justify-center">
              <ArrowLeft size={16} /> Edit Goal
            </button>
            <button onClick={handleCreateAndPreview} className="btn-primary flex-1 justify-center">
              Preview Campaign <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && recommendation && (
        <div className="animate-slide-up space-y-5">
          <h1 className="font-display text-2xl font-bold text-white">Ready to launch</h1>

          <div className="card border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={20} className="text-emerald-400" />
              <span className="font-medium text-white">Campaign preview</span>
            </div>
            <div className="space-y-3">
              {[
                ['Name', editedName],
                ['Audience', `${recommendation.segmentName} · ${recommendation.estimatedAudience.toLocaleString()} customers`],
                ['Channel', selectedChannel.toUpperCase()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-400">{k}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Message preview */}
          <div className="card">
            <p className="label">Message Preview</p>
            <div className="bg-navy-950 rounded-xl p-4 font-mono text-sm text-slate-300 leading-relaxed border border-white/5">
              {editedMessage}
            </div>
            <p className="text-xs text-slate-500 mt-2">Placeholders will be personalized per recipient at send time.</p>
          </div>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>}

          <div className="flex gap-3">
            <button onClick={() => setStep('review')} className="btn-secondary flex-1 justify-center">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleLaunch} className="btn-primary flex-1 justify-center py-3 bg-emerald-600 hover:bg-emerald-700">
              <Rocket size={18} /> Launch Campaign
            </button>
          </div>
        </div>
      )}

      {/* Step: Launching */}
      {step === 'launching' && (
        <div className="animate-fade-in text-center py-20">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Rocket size={28} className="text-emerald-400 animate-bounce" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Launching campaign...</h2>
          <p className="text-slate-400 text-sm">Dispatching messages to channel service.</p>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="animate-slide-up text-center py-12">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Campaign launched!</h2>
          <p className="text-slate-400 mb-2">
            <span className="text-white font-bold">{launchResult?.totalTargeted.toLocaleString()}</span> messages dispatched to the channel service.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Delivery events will stream in over the next few minutes. Watch the analytics update live.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(`/campaigns/${createdCampaign?.id}`)} className="btn-primary">
              View Campaign Analytics
            </button>
            <button onClick={() => { setStep('goal'); setGoal(''); setRecommendation(null); }} className="btn-secondary">
              New Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
