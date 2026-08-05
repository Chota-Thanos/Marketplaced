'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Users, ShieldCheck, ShieldAlert, UserPlus, Search, Ban, CheckCircle2, KeyRound,
} from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../components/admin/AdminAuthContext';

const ROLE_LABELS = {
  CUSTOMER: 'Customer',
  SUB_ADMIN: 'Sub-admin',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Admin',
};

const ROLE_TONE = {
  CUSTOMER: 'bg-surface-sunken text-ink-muted',
  SUB_ADMIN: 'bg-info-soft text-info',
  ADMIN: 'bg-accent-soft text-accent',
  SUPER_ADMIN: 'bg-accent-soft text-accent',
};

/**
 * User and staff management. Full admins only.
 *
 * A sub-admin who reaches this URL gets a 403 from the API and the explanation
 * below — the server is the gate, this page just explains the refusal rather
 * than rendering an empty table that looks broken.
 */
export default function UsersPage() {
  const { token, user: me } = useAdminAuth();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('q', filter);
      if (roleFilter) params.set('role', roleFilter);

      const res = await apiFetch(`/admin/users?${params}`, { token });
      setUsers(res.data ?? res);
      setMeta(res.meta ?? null);
    } catch (e) {
      if (e.status === 403) setForbidden(true);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, filter, roleFilter]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const act = async (path, body, method = 'PUT') => {
    setError(null);
    try {
      const res = await apiFetch(path, { method, token, body });
      setStatus(res.message || 'Done.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (forbidden) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-warning mx-auto mb-4" />
          <h1 className="text-xl font-black text-ink mb-2">Restricted to full admins</h1>
          <p className="text-base text-ink-muted mb-6">
            Sub-admins can run the store — catalogue, orders, returns, coupons, content
            and appearance — but cannot manage accounts or change who has access.
          </p>
          <Link
            href="/admin"
            className="inline-block px-5 py-2.5 rounded-pill bg-primary text-on-primary text-sm font-bold"
          >
            Back to the dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-header bg-surface border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-ink-muted hover:text-ink" aria-label="Back to admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-ink flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" /> Users &amp; staff
            </h1>
            {meta?.counts && (
              <p className="text-xs text-ink-muted">
                {meta.counts.customers} customers · {meta.counts.sub_admins} sub-admins ·{' '}
                {meta.counts.admins} admins · {meta.counts.blocked} blocked
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-pill bg-primary text-on-primary text-xs font-bold shadow-button hover:bg-primary-hover transition"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add staff
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-control bg-danger-soft border border-danger/20 px-4 py-3 text-base text-danger">
            {error}
          </div>
        )}
        {status && (
          <div className="mb-6 rounded-control bg-success-soft border border-success/20 px-4 py-3 text-base text-success">
            {status}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <label htmlFor="user-search" className="sr-only">Search users</label>
            <input
              id="user-search"
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by name, email or phone"
              className="w-full bg-surface border border-line rounded-pill pl-9 pr-4 py-2.5 text-base text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
            />
          </div>
          {['', 'CUSTOMER', 'SUB_ADMIN', 'ADMIN'].map((r) => (
            <button
              key={r || 'all'}
              type="button"
              onClick={() => setRoleFilter(r)}
              aria-pressed={roleFilter === r}
              className={`px-4 py-2 rounded-pill text-xs font-bold border transition ${
                roleFilter === r
                  ? 'bg-primary text-on-primary border-transparent'
                  : 'bg-surface text-ink-muted border-line hover:text-ink'
              }`}
            >
              {r ? ROLE_LABELS[r] : 'Everyone'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-ink-muted text-base">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-ink-muted text-base">No accounts match that.</p>
        ) : (
          <div className="rounded-card border border-line bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead className="bg-surface-muted border-b border-line">
                  <tr className="text-2xs uppercase tracking-wider text-ink-subtle">
                    <th className="px-4 py-3 font-black">Account</th>
                    <th className="px-4 py-3 font-black">Role</th>
                    <th className="px-4 py-3 font-black">Orders</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === me?.id;
                    return (
                      <tr key={u.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-bold text-ink">{u.name}</p>
                          <p className="text-xs text-ink-subtle">{u.email}</p>
                          {u.auth_provider === 'GOOGLE' && (
                            <span className="text-2xs text-ink-subtle">via Google</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-2xs font-black ${ROLE_TONE[u.role]}`}
                          >
                            {u.role !== 'CUSTOMER' && <ShieldCheck className="w-3 h-3" />}
                            {ROLE_LABELS[u.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted font-mono text-xs">
                          {u.orders_count ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-bold ${
                              u.status === 'BLOCKED' ? 'text-danger' : 'text-success'
                            }`}
                          >
                            {u.status === 'BLOCKED' ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {isSelf ? (
                              <span className="text-2xs text-ink-subtle italic">
                                This is you
                              </span>
                            ) : (
                              <>
                                <label className="sr-only" htmlFor={`role-${u.id}`}>
                                  Role for {u.name}
                                </label>
                                <select
                                  id={`role-${u.id}`}
                                  value={u.role === 'SUPER_ADMIN' ? 'ADMIN' : u.role}
                                  onChange={(e) =>
                                    act(`/admin/users/${u.id}/role`, { role: e.target.value })
                                  }
                                  className="bg-surface-muted border border-line rounded-chip px-2 py-1 text-xs text-ink focus:outline-none focus:border-accent"
                                >
                                  <option value="CUSTOMER">Customer</option>
                                  <option value="SUB_ADMIN">Sub-admin</option>
                                  <option value="ADMIN">Admin</option>
                                </select>

                                <button
                                  type="button"
                                  title={u.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                                  onClick={() =>
                                    act(`/admin/users/${u.id}/status`, {
                                      status: u.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED',
                                    })
                                  }
                                  className={`p-1.5 rounded-chip border border-line ${
                                    u.status === 'BLOCKED'
                                      ? 'text-success hover:border-success'
                                      : 'text-ink-muted hover:text-danger hover:border-danger'
                                  }`}
                                >
                                  {u.status === 'BLOCKED' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <Ban className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {u.role !== 'CUSTOMER' && (
                                  <button
                                    type="button"
                                    title="Reset password"
                                    onClick={() => {
                                      const pw = window.prompt(
                                        `New password for ${u.name} (min 12 characters).\nTheir sessions will be revoked.`,
                                      );
                                      if (pw) act(`/admin/users/${u.id}/password`, { password: pw });
                                    }}
                                    className="p-1.5 rounded-chip border border-line text-ink-muted hover:text-accent hover:border-accent"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showCreate && (
        <CreateStaffModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={(msg) => {
            setShowCreate(false);
            setStatus(msg);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateStaffModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'SUB_ADMIN',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch('/admin/users/staff', { method: 'POST', token, body: form });
      onCreated(res.message || 'Staff account created.');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const field = (key, label, type = 'text', hint) => (
    <div>
      <label htmlFor={`staff-${key}`} className="block text-xs font-bold text-ink-muted mb-1.5">
        {label}
      </label>
      <input
        id={`staff-${key}`}
        type={type}
        required={key !== 'phone'}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full bg-surface border border-line rounded-control px-3.5 py-2.5 text-base text-ink focus:outline-none focus:border-accent"
      />
      {hint && <p className="mt-1 text-2xs text-ink-subtle">{hint}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-inverse/50 backdrop-blur-sm cursor-default"
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md bg-surface rounded-panel shadow-panel p-6 space-y-4"
      >
        <div>
          <h2 className="text-lg font-black text-ink">Add a staff account</h2>
          <p className="text-xs text-ink-muted">
            You set the password and hand it over — there is no email invite until a
            mailer is configured.
          </p>
        </div>

        {error && (
          <div className="rounded-control bg-danger-soft border border-danger/20 px-3 py-2 text-base text-danger">
            {error}
          </div>
        )}

        {field('name', 'Full name')}
        {field('email', 'Email address', 'email')}
        {field('phone', 'Mobile number (optional)', 'tel')}
        {field('password', 'Password', 'password', 'At least 12 characters — this account can read every order.')}

        <div>
          <span className="block text-xs font-bold text-ink-muted mb-2">Access level</span>
          <div className="space-y-2">
            {[
              {
                value: 'SUB_ADMIN',
                title: 'Sub-admin',
                blurb: 'Runs the store: catalogue, orders, returns, coupons, content, appearance, analytics. Cannot manage users.',
              },
              {
                value: 'ADMIN',
                title: 'Full admin',
                blurb: 'Everything, including creating staff, blocking accounts and adjusting wallets.',
              },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex gap-3 p-3 rounded-control border cursor-pointer transition ${
                  form.role === opt.value ? 'border-accent bg-accent-soft' : 'border-line'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  aria-label={`${opt.title} — ${opt.blurb}`}
                  checked={form.role === opt.value}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="mt-1 accent-accent"
                />
                <span>
                  <span className="block text-base font-bold text-ink">{opt.title}</span>
                  <span className="block text-xs text-ink-muted">{opt.blurb}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-pill border border-line text-sm font-bold text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-pill bg-primary text-on-primary text-sm font-bold disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}
