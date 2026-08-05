"use client";

import { useEffect, useState } from 'react';
import { BarChart3, Users, TrendingUp, Search, RefreshCw, Download, AlertTriangle, Package, RotateCcw } from 'lucide-react';
import { apiFetch, formatINR } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../components/admin/AdminAuthContext';

/** Inline SVG bar chart — no external chart dependency. */
function RevenueChart({ series }) {
  if (!series?.length) {
    return <p className="text-sm text-ink-subtle py-8 text-center">No revenue in this period yet.</p>;
  }

  const max = Math.max(...series.map(d => d.revenue), 1);
  const width = 100 / series.length;

  return (
    <div>
      <div className="flex items-end gap-1 h-48" role="img" aria-label="Daily revenue chart">
        {series.map((d) => {
          const pct = (d.revenue / max) * 100;
          return (
            <div key={d.date} className="flex-1 flex flex-col justify-end group relative" style={{ minWidth: `${width}%` }}>
              <div
                className="bg-accent hover:bg-accent rounded-t-chip transition-all"
                style={{ height: `${Math.max(pct, 1)}%` }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-inverse text-ink-inverse text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                {d.date}: {formatINR(d.revenue)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-ink-subtle mt-2 font-medium">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="bg-surface border border-line p-5 rounded-card flex items-center gap-4">
      <div className={`p-3 rounded-control ${tone}`}><Icon className="w-6 h-6" /></div>
      <div>
        <p className="text-xs text-ink-subtle font-bold">{label}</p>
        <p className="text-2xl font-black text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { token } = useAdminAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/admin/analytics?days=${days}`, { token });
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token, days]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [['Date', 'Revenue', 'Orders'], ...data.revenue_series.map(d => [d.date, d.revenue, d.orders])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `bazaarx-analytics-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8 text-center text-ink-subtle font-bold">Loading analytics…</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-danger-soft border border-danger text-danger p-4 rounded-card font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-ink">Advanced Analytics</h1>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            aria-label="Reporting period"
            className="bg-surface border border-line rounded-control px-3 py-2 text-sm font-bold"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={load} aria-label="Refresh analytics" className="p-2.5 bg-surface border border-line rounded-control">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 bg-inverse text-ink-inverse px-4 py-2.5 rounded-control text-sm font-bold">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label={`Revenue (${days}d)`} value={formatINR(data.revenue_total)} tone="bg-accent-soft text-accent" />
        <StatCard icon={Package} label={`Orders (${days}d)`} value={data.orders_total} tone="bg-success-soft text-success" />
        <StatCard icon={Users} label="New Customers" value={data.new_customers} tone="bg-accent-soft text-accent" />
        <StatCard icon={RotateCcw} label="Return Rate" value={`${data.return_rate}%`} tone="bg-danger-soft text-danger" />
      </div>

      <div className="bg-surface border border-line p-6 rounded-card">
        <h2 className="font-black text-ink mb-4">Revenue Over Time</h2>
        <RevenueChart series={data.revenue_series} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-line p-6 rounded-card">
          <h2 className="font-black text-ink mb-4">Top Selling Products</h2>
          {data.top_products.length === 0 ? (
            <p className="text-sm text-ink-subtle">No sales yet.</p>
          ) : (
            <div className="space-y-3">
              {data.top_products.map(p => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <span className="text-ink-muted font-medium truncate pr-4">{p.title}</span>
                  <span className="text-ink-subtle font-bold whitespace-nowrap">{p.units} sold · {formatINR(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-line p-6 rounded-card">
          <h2 className="font-black text-ink mb-4">Revenue by Category</h2>
          {data.category_split.length === 0 ? (
            <p className="text-sm text-ink-subtle">No sales yet.</p>
          ) : (
            <div className="space-y-3">
              {data.category_split.map(c => {
                const pct = data.revenue_total > 0 ? Math.round((c.revenue / data.revenue_total) * 100) : 0;
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink-muted font-medium">{c.name}</span>
                      <span className="text-ink-subtle font-bold">{pct}%</span>
                    </div>
                    <div className="h-2 bg-surface-sunken rounded-pill overflow-hidden">
                      <div className="h-full bg-success rounded-pill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-surface border border-line p-6 rounded-card">
          <h2 className="font-black text-ink mb-4 flex items-center gap-2">
            <Search className="w-4 h-4" /> Top Searches
          </h2>
          {data.top_searches.length === 0 ? (
            <p className="text-sm text-ink-subtle">No searches recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {data.top_searches.map((s, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-ink-muted">{s.normalised_query}</span>
                  <span className="text-ink-subtle font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-line p-6 rounded-card">
          <h2 className="font-black text-ink mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger" /> Inventory Gaps (Zero Results)
          </h2>
          {data.zero_result_searches.length === 0 ? (
            <p className="text-sm text-ink-subtle">No zero-result searches — good sign.</p>
          ) : (
            <div className="space-y-2">
              {data.zero_result_searches.map((s, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-danger font-medium">{s.normalised_query}</span>
                  <span className="text-ink-subtle font-bold">{s.count} searches</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
