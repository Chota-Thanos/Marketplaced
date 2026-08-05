"use client";

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, ThumbsUp, ShieldCheck, Send, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import { useStore } from '../providers/StoreProvider';

export default function ProductQnA({ productId }) {
  const { authToken } = useStore();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/products/${productId}/questions`);
      setQuestions(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    if (!authToken) {
      setError('Please sign in to ask a question.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/products/${productId}/questions`, {
        method: 'POST', token: authToken, body: { body: body.trim() },
      });
      setBody('');
      // Questions are moderated before they go public, so say that rather than
      // optimistically rendering something no one else can see yet.
      setNotice('Thanks! Your question was sent for moderation and appears once approved.');
      setTimeout(() => setNotice(''), 6000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const voteHelpful = async (answerId) => {
    try {
      await apiFetch(`/answers/${answerId}/helpful`, { method: 'POST' });
      setQuestions(prev => prev.map(q => ({
        ...q,
        answers: q.answers?.map(a => a.id === answerId ? { ...a, helpful_count: a.helpful_count + 1 } : a),
      })));
    } catch {
      // A failed vote isn't worth interrupting the page for.
    }
  };

  return (
    <section className="mt-12" aria-labelledby="qna-heading">
      <h2 id="qna-heading" className="text-2xl font-black text-ink flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6" /> Questions &amp; Answers
      </h2>

      <div className="bg-canvas border border-line rounded-panel p-6 mb-8">
        <label htmlFor="qna-input" className="block font-bold text-ink mb-3">
          Have a question about this product?
        </label>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
          <input
            id="qna-input"
            type="text"
            maxLength={1000}
            placeholder="e.g. Does this ship with a dupatta?"
            className="flex-1 bg-surface border border-line rounded-card px-4 py-3 text-sm font-medium focus:outline-none focus:border-line-strong"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-inverse text-ink-inverse font-bold rounded-card text-sm disabled:opacity-50"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Ask
          </button>
        </form>

        {notice && <p role="status" className="mt-3 text-xs font-bold text-success">{notice}</p>}
        {error && <p role="alert" className="mt-3 text-xs font-bold text-danger">{error}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-ink-subtle font-bold">Loading questions…</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-ink-subtle">No questions yet — be the first to ask.</p>
      ) : (
        <ul className="space-y-6">
          {questions.map(q => (
            <li key={q.id} className="border-b border-line pb-6 last:border-0">
              <p className="font-bold text-ink">Q: {q.body}</p>
              <p className="text-[11px] text-ink-subtle mt-1">
                {q.user?.name || 'Customer'} · {new Date(q.created_at).toLocaleDateString('en-IN')}
              </p>

              {q.answers?.length > 0 ? (
                <ul className="mt-3 space-y-3 pl-4 border-l-2 border-line">
                  {q.answers.map(a => (
                    <li key={a.id}>
                      <p className="text-sm text-ink-muted">A: {a.body}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {a.is_official && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-accent-soft text-accent px-2 py-0.5 rounded-pill">
                            <ShieldCheck className="w-3 h-3" /> BazaarX
                          </span>
                        )}
                        {a.is_verified_buyer && (
                          <span className="text-[10px] font-black bg-success-soft text-success px-2 py-0.5 rounded-pill">
                            Verified Buyer
                          </span>
                        )}
                        <span className="text-[11px] text-ink-subtle">{a.user?.name || 'Customer'}</span>
                        <button
                          onClick={() => voteHelpful(a.id)}
                          className="ml-auto flex items-center gap-1 text-[11px] font-bold text-ink-subtle hover:text-ink"
                        >
                          <ThumbsUp className="w-3 h-3" /> Helpful ({a.helpful_count})
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-ink-subtle italic pl-4">Not answered yet.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
