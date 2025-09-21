import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../../../utils/axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const StatCard = ({ title, value, subtitle, accent = 'blue' }) => (
  <div className="p-4 rounded-xl border bg-white shadow-sm">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
    {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
  </div>
);

const FilterBar = ({ filters, setFilters, onRefresh, onExport }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-end mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
        <div>
          <label className="text-xs text-gray-500">Date Range</label>
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={filters.last}
            onChange={(e) => setFilters((f) => ({ ...f, last: e.target.value }))}
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7d</option>
            <option value="30d">Last 30d</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Feature</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            placeholder="e.g., pro_learning"
            value={filters.feature}
            onChange={(e) => setFilters((f) => ({ ...f, feature: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Event contains</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            placeholder="e.g., save"
            value={filters.contains}
            onChange={(e) => setFilters((f) => ({ ...f, contains: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Success</label>
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={filters.success}
            onChange={(e) => setFilters((f) => ({ ...f, success: e.target.value }))}
          >
            <option value="">All</option>
            <option value="true">Success</option>
            <option value="false">Failed</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Refresh</button>
        <button onClick={onExport} className="px-4 py-2 rounded-lg bg-gray-700 text-white">Export CSV</button>
      </div>
    </div>
  );
};

const AdminAnalytics = ({ isDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ last: '24h', feature: '', contains: '', success: '' });
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'replay'
  const timerRef = useRef(null);
  const eventsRef = useRef([]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.last) params.set('last', filters.last);
      if (filters.feature) params.set('feature', filters.feature);
      if (filters.success) params.set('success', filters.success);
      params.set('limit', '500');
      const res = await axios.get(`/analytics/recent-events/?${params.toString()}`);
      let evts = res.data.events || [];
      if (filters.contains) {
        const q = filters.contains.toLowerCase();
        evts = evts.filter(e => (e.event_type || '').toLowerCase().includes(q));
      }
      setEvents(evts);
      eventsRef.current = evts;
    } catch (e) {
      setError(e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchEvents, 10000); // auto-refresh every 10s
    return () => timerRef.current && clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.last, filters.feature, filters.success, filters.contains]);

  const metrics = useMemo(() => {
    const total = events.length;
    const success = events.filter(e => e.success).length;
    const fail = total - success;
    const saveAttempts = events.filter(e => (e.event_type || '').includes('save')).length;
    const saveSuccess = events.filter(e => (e.event_type || '').includes('save') && e.success).length;
    const latSamples = events.filter(e => Number.isFinite(e.latency_ms) && e.latency_ms >= 0);
    const avgLatency = Math.round(latSamples.reduce((s, e) => s + (e.latency_ms || 0), 0) / Math.max(1, latSamples.length));
    const byFeature = events.reduce((acc, e) => {
      const key = e.feature || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const timeSeries = events
      .slice()
      .reverse()
      .map(e => ({ t: new Date(e.created_at), v: 1 }))
      .reduce((acc, p) => {
        const key = p.t.toISOString().slice(0,16); // minute-bucket
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    const tsData = Object.entries(timeSeries).map(([k, v]) => ({ name: k.slice(11), value: v }));
    return { total, success, fail, saveAttempts, saveSuccess, avgLatency, byFeature, tsData };
  }, [events]);

  const exportCSV = () => {
    const rows = [
      ['id','created_at','session_id','event_type','feature','success','latency_ms','client_ts','metadata']
    ];
    for (const e of eventsRef.current) {
      const meta = (() => { try { return JSON.stringify(e.metadata || {}); } catch { return ''; } })();
      rows.push([
        e.id,
        e.created_at,
        e.session_id,
        e.event_type,
        e.feature || '',
        String(!!e.success),
        Number.isFinite(e.latency_ms) ? e.latency_ms : '',
        e.client_ts || '',
        meta
      ].map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g,'""')}"` : v));
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ReplayPanel = () => {
    const POSTHOG_APP_URL = import.meta.env.VITE_POSTHOG_APP_URL || 'https://us.posthog.com';
    const [q, setQ] = useState('');
    const sessions = useMemo(() => {
      const grouped = new Map();
      for (const e of events) {
        const id = e.session_id || 'unknown';
        if (!grouped.has(id)) grouped.set(id, []);
        grouped.get(id).push(e);
      }
      const list = Array.from(grouped.entries()).map(([id, arr]) => {
        const times = arr.map(a => new Date(a.created_at).getTime());
        const first = new Date(Math.min(...times));
        const last = new Date(Math.max(...times));
        const success = arr.filter(a => a.success).length;
        const fail = arr.length - success;
        return {
          id,
          count: arr.length,
          first, last,
          durationMin: Math.max(0, Math.round((last - first) / 60000)),
          success, fail,
        };
      }).sort((a, b) => b.last - a.last);
      return q ? list.filter(s => s.id.toLowerCase().includes(q.toLowerCase())) : list;
    }, [events, q]);

    const copy = async (text) => {
      try { await navigator.clipboard.writeText(text); } catch {}
    };

    return (
      <div className="p-0">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-sm text-gray-500">PostHog Session Replay</div>
            <div className="text-xs text-gray-400">Distinct ID = our session_id. Use Copy + search in PostHog Recordings.</div>
          </div>
          <a
            href={`${POSTHOG_APP_URL}/recordings`}
            target="_blank" rel="noreferrer"
            className="px-3 py-2 text-sm rounded-lg bg-black text-white"
          >Open PostHog Recordings ↗</a>
        </div>

        <div className="mb-3">
          <input
            className="w-full md:w-64 border rounded-lg px-3 py-2"
            placeholder="Filter by session id..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="overflow-auto border rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success/Fail</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <tr><td className="px-4 py-6" colSpan="7">No sessions found</td></tr>
              ) : sessions.map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-xs font-mono">{s.id}</td>
                  <td className="px-4 py-2 text-xs">{s.count}</td>
                  <td className="px-4 py-2 text-xs">{s.success} / {s.fail}</td>
                  <td className="px-4 py-2 text-xs">{s.first.toLocaleString()}</td>
                  <td className="px-4 py-2 text-xs">{s.last.toLocaleString()}</td>
                  <td className="px-4 py-2 text-xs">{s.durationMin}m</td>
                  <td className="px-4 py-2 text-xs flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => copy(s.id)}>Copy ID</button>
                    <a className="px-2 py-1 border rounded" href={`${POSTHOG_APP_URL}/recordings`} target="_blank" rel="noreferrer">Open PostHog</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="text-xs text-gray-500">Auto-refreshing every 10s</div>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 rounded-lg text-sm ${activeTab==='overview' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >Overview</button>
        <button
          onClick={() => setActiveTab('replay')}
          className={`px-3 py-2 rounded-lg text-sm ${activeTab==='replay' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >Replay</button>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} onRefresh={fetchEvents} onExport={exportCSV} />

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 mb-4">
          Failed to load events: {JSON.stringify(error)}
        </div>
      )}

      {activeTab === 'replay' ? (
        <ReplayPanel />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard title="Events" value={metrics.total} />
            <StatCard title="Success" value={metrics.success} />
            <StatCard title="Failures" value={metrics.fail} />
            <StatCard title="Save Attempts" value={metrics.saveAttempts} />
            <StatCard title="Avg Latency (ms)" value={Number.isFinite(metrics.avgLatency) ? metrics.avgLatency : '—'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 p-4 bg-white rounded-xl border">
              <h3 className="font-semibold mb-2">Events over time</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.tsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <h3 className="font-semibold mb-2">By Feature</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.byFeature).map(([feature, count]) => (
                  <div key={feature} className="px-3 py-1 rounded-full border text-sm bg-white">
                    {feature}: {count}
                  </div>
                ))}
                {Object.keys(metrics.byFeature).length === 0 && (
                  <div className="text-sm text-gray-500">No feature data</div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-auto border rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metadata</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td className="px-4 py-6" colSpan="7">Loading…</td></tr>
                ) : events.length === 0 ? (
                  <tr><td className="px-4 py-6" colSpan="7">No events</td></tr>
                ) : (
                  events.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-2 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-xs font-mono">{e.session_id?.slice(0,8)}</td>
                      <td className="px-4 py-2 text-xs">{e.event_type}</td>
                      <td className="px-4 py-2 text-xs">{e.feature || '—'}</td>
                      <td className="px-4 py-2 text-xs">{e.success ? '✅' : '❌'}</td>
                      <td className="px-4 py-2 text-xs">{Number.isFinite(e.latency_ms) ? `${e.latency_ms}ms` : '—'}</td>
                      <td className="px-4 py-2 text-xs max-w-md truncate" title={JSON.stringify(e.metadata)}>
                        {(() => { try { return JSON.stringify(e.metadata); } catch { return '—'; } })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
