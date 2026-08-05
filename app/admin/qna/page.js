"use client";

import { useEffect, useState } from 'react';
import { MessageSquare, Check, X, Send, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../components/admin/AdminAuthContext';

const TABS = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
];

export default function QnAModeration() {
  const { token } = useAdminAuth();
  const [status, setStatus] = useState('PENDING');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/admin/questions?status=${status}`, { token });
      setQuestions(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token, status]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const moderate = async (id, next) => {
    setBusyId(id);
    try {
      await apiFetch(`/admin/questions/${id}/moderate`, { method: 'PUT', token, body: { status: next } });
      setQuestions(prev => prev.filter(q => q.id !== id));
      showToast(next === 'APPROVED' ? '✅ Question approved — now live on the PDP.' : '🚫 Question rejected.');
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const postAnswer = async (id) => {
    const body = (answers[id] || '').trim();
    if (!body) return;
    setBusyId(id);
    try {
      await apiFetch(`/questions/${id}/answer`, { method: 'POST', token, body: { body } });
      setAnswers(a => ({ ...a, [id]: '' }));
      showToast('💬 Official answer posted.');
      await load();
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {toast && (
        <div role="status" className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-inverse text-ink-inverse px-6 py-3 rounded-pill shadow-panel z-50 font-bold text-sm">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-ink flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> Q&amp;A Moderation
        </h1>
        <button onClick={load} aria-label="Refresh questions" className="p-2.5 bg-surface border border-line rounded-control">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setStatus(t.id)}
            className={`px-4 py-2 rounded-pill text-xs font-bold border transition ${
              status === t.id
                ? 'bg-inverse text-ink-inverse border-line-strong'
                : 'bg-surface text-ink-muted border-line'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="bg-danger-soft border border-danger text-danger p-4 rounded-card font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink-subtle font-bold">Loading questions…</div>
      ) : questions.length === 0 ? (
        <div className="text-center p-12 border border-line rounded-card text-ink-subtle">
          No {status.toLowerCase()} questions. You&apos;re all caught up.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.id} className="bg-surface border border-line p-6 rounded-card space-y-4">
              <div className="flex justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-ink-subtle text-xs font-bold">{q.product?.title || 'Unknown product'}</span>
                  <p className="text-base font-bold text-ink mt-1">&ldquo;{q.body}&rdquo;</p>
                  <p className="text-xs text-ink-subtle mt-1">
                    Asked by {q.user?.name || 'Guest'} · {new Date(q.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {status === 'PENDING' && (
                  <div className="flex gap-2 h-fit shrink-0">
                    <button
                      onClick={() => moderate(q.id, 'APPROVED')}
                      disabled={busyId === q.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-success-soft text-success border border-success rounded-control text-xs font-bold disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => moderate(q.id, 'REJECTED')}
                      disabled={busyId === q.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-danger-soft text-danger border border-danger rounded-control text-xs font-bold disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>

              {q.answers?.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-line">
                  {q.answers.map(a => (
                    <div key={a.id} className="text-sm">
                      <p className="text-ink-muted">{a.body}</p>
                      <p className="text-[11px] text-ink-subtle mt-0.5 flex items-center gap-1.5">
                        {a.is_official && (
                          <span className="inline-flex items-center gap-1 bg-accent-soft text-accent px-1.5 py-0.5 rounded font-bold">
                            <ShieldCheck className="w-3 h-3" /> BazaarX
                          </span>
                        )}
                        {a.is_verified_buyer && (
                          <span className="bg-success-soft text-success px-1.5 py-0.5 rounded font-bold">Verified Buyer</span>
                        )}
                        {a.user?.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-line">
                <label htmlFor={`answer-${q.id}`} className="text-xs text-ink-subtle font-bold block mb-2">
                  Post an official answer
                </label>
                <div className="flex gap-2">
                  <input
                    id={`answer-${q.id}`}
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); postAnswer(q.id); } }}
                    placeholder="Type your answer…"
                    className="flex-1 bg-surface-muted border border-line rounded-control px-4 py-2.5 text-sm"
                  />
                  <button
                    onClick={() => postAnswer(q.id)}
                    disabled={busyId === q.id || !(answers[q.id] || '').trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-inverse text-ink-inverse rounded-control text-sm font-bold disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> Post
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
