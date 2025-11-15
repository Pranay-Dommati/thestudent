import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../../../utils/axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Small util to format date/time consistently
const fmt = (iso) => {
  try {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString();
  } catch {
    return String(iso || '—');
  }
};

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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'replay' | 'enrollments' | 'prolearning'
  const timerRef = useRef(null);
  const eventsRef = useRef([]);

  // Admin: Course enrollments overview
  const [courseStatsLoading, setCourseStatsLoading] = useState(false);
  const [courseStatsError, setCourseStatsError] = useState(null);
  const [coursesStats, setCoursesStats] = useState({ total_courses: 0, total_enrollments: 0, items: [] });
  // Local UI filters for Enrollments tab (client-side)
  const [enrFilters, setEnrFilters] = useState({ q: '', type: 'all', published: 'all', sort: 'enroll_desc' });

  // Admin: Selected course enrollments detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detailMeta, setDetailMeta] = useState(null); // {id,title,type}
  const [detailItems, setDetailItems] = useState([]); // [{name,email,enrolled_at,last_activity}]

  // Admin: ProLearning topics across users
  const [proTopicsLoading, setProTopicsLoading] = useState(false);
  const [proTopicsError, setProTopicsError] = useState(null);
  const [proTopics, setProTopics] = useState([]); // [{topic_id, topic_name, course_title, user_name, user_email, created_at, updated_at, completed_at, progress_percentage}]
  // Local UI filters for AI ProLearning tab (client-side)
  const [proFilters, setProFilters] = useState({ q: '', completion: 'all', minProgress: '0', sort: 'recent' });

  const goToProLearning = (item) => {
    if (!item || !item.course_id) return;
    const url = `/pro-learning/${item.course_id}`;
    try { window.open(url, '_blank', 'noopener'); } catch { window.location.href = url; }
  };

  // Removed: legacy overview course stats & users snapshot (moved/removed per design)

  // Removed: legacy enrollments modal used on Overview

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.last) params.set('last', filters.last);
      if (filters.feature) params.set('feature', filters.feature);
      if (filters.success) params.set('success', filters.success);
      if (filters.contains) params.set('contains', filters.contains);
      params.set('limit', '500');
      const res = await axios.get(`/analytics/recent-events/?${params.toString()}`);
      let evts = res.data.events || [];
      setEvents(evts);
      eventsRef.current = evts;
    } catch (e) {
      setError(e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin course enrollment stats for the table
  const fetchCourseStats = async () => {
    setCourseStatsLoading(true);
    setCourseStatsError(null);
    try {
      const res = await axios.get(`/courses/admin/enrollment-stats/`);
      const data = res.data || {};
      // Normalize both possible shapes
      let items = [];
      let totalCourses = 0;
      let totalEnrollments = 0;
      if (Array.isArray(data.items)) {
        // Shape A
        items = data.items.map((it) => ({
          id: it.course_id,
          title: it.title,
          course_type: (it.type || '').toString().toLowerCase(),
          enrollments: Number(it.enrollments || 0),
          is_published: Boolean(it.published),
        }));
        totalCourses = Number(data.total_courses || items.length || 0);
        totalEnrollments = Number(data.total_enrollments || 0);
      } else if (Array.isArray(data.courses)) {
        // Shape B
        items = data.courses.map((it) => ({
          id: it.id,
          title: it.title,
          course_type: (it.course_type || '').toString().toLowerCase(),
          enrollments: Number(it.enrollments || 0),
          is_published: Boolean(it.is_published),
        }));
        totalCourses = Number(data?.totals?.total_courses || items.length || 0);
        totalEnrollments = Number(data?.totals?.total_enrollments || 0);
      }
      // Order by enrollments desc
      items.sort((a, b) => (b.enrollments - a.enrollments) || (a.title || '').localeCompare(b.title || ''));
      setCoursesStats({ total_courses: totalCourses, total_enrollments: totalEnrollments, items });
    } catch (e) {
      setCourseStatsError(e?.response?.data || e.message);
      setCoursesStats({ total_courses: 0, total_enrollments: 0, items: [] });
    } finally {
      setCourseStatsLoading(false);
    }
  };

  // Fetch admin ProLearning topics list
  const fetchProTopics = async () => {
    setProTopicsLoading(true);
    setProTopicsError(null);
    try {
      const params = new URLSearchParams();
      params.set('last', filters.last || '30d');
      params.set('limit', '1000');
      const res = await axios.get(`/courses/pro-learning/admin/topics/?${params.toString()}`);
      const data = res.data || {};
      const items = Array.isArray(data.items) ? data.items : [];
      // sort by updated_at desc fallback created_at
      items.sort((a,b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
      setProTopics(items);
    } catch (e) {
      setProTopicsError(e?.response?.data || e.message);
      setProTopics([]);
    } finally {
      setProTopicsLoading(false);
    }
  };

  // Removed: legacy data loaders for overview (course stats & users snapshot)

  useEffect(() => {
    fetchEvents();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchEvents, 10000); // auto-refresh every 10s
    return () => timerRef.current && clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.last, filters.feature, filters.success, filters.contains]);

  // Removed: initial enrollment stats fetch on mount; we fetch only when Enrollments tab is active

  useEffect(() => {
    if (activeTab === 'enrollments') {
      fetchCourseStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'prolearning') {
      fetchProTopics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters.last]);

  // Removed: legacy overview data (course stats & users snapshot) initial load

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

  // Derived lists with client-side filtering
  const filteredCourses = React.useMemo(() => {
    let list = Array.isArray(coursesStats.items) ? [...coursesStats.items] : [];
    const q = (enrFilters.q || '').toLowerCase();
    if (q) list = list.filter(c => (c.title || '').toLowerCase().includes(q));
    if (enrFilters.type !== 'all') list = list.filter(c => (c.course_type || '').toLowerCase() === enrFilters.type);
    if (enrFilters.published !== 'all') list = list.filter(c => !!c.is_published === (enrFilters.published === 'yes'));
    // Sorting
    if (enrFilters.sort === 'enroll_desc') list.sort((a,b) => (b.enrollments - a.enrollments) || (a.title || '').localeCompare(b.title || ''));
    else if (enrFilters.sort === 'enroll_asc') list.sort((a,b) => (a.enrollments - b.enrollments) || (a.title || '').localeCompare(b.title || ''));
    else if (enrFilters.sort === 'name') list.sort((a,b) => (a.title || '').localeCompare(b.title || ''));
    return list;
  }, [coursesStats.items, enrFilters]);

  const filteredProTopics = React.useMemo(() => {
    let list = Array.isArray(proTopics) ? [...proTopics] : [];
    const q = (proFilters.q || '').toLowerCase();
    if (q) list = list.filter(t =>
      (t.topic_name || '').toLowerCase().includes(q) ||
      (t.course_title || '').toLowerCase().includes(q) ||
      (t.user_email || '').toLowerCase().includes(q) ||
      (t.user_name || '').toLowerCase().includes(q)
    );
    if (proFilters.completion !== 'all') {
      const wantCompleted = proFilters.completion === 'completed';
      list = list.filter(t => Boolean(t.completed_at) === wantCompleted);
    }
    const minP = Number(proFilters.minProgress || 0);
    if (Number.isFinite(minP) && minP > 0) list = list.filter(t => Number(t.progress_percentage || 0) >= minP);
    // Sorting
    if (proFilters.sort === 'recent') list.sort((a,b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
    else if (proFilters.sort === 'progress') list.sort((a,b) => Number(b.progress_percentage || 0) - Number(a.progress_percentage || 0));
    else if (proFilters.sort === 'topic') list.sort((a,b) => (a.topic_name || '').localeCompare(b.topic_name || ''));
    return list;
  }, [proTopics, proFilters]);

  const openCourseDetail = async (course) => {
    if (!course || !course.id) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailMeta({ id: course.id, title: course.title, type: course.course_type });
    setDetailItems([]);
    try {
      // backend expects lower-case 'engineering' or 'school'
      const ctype = (course.course_type || '').toLowerCase();
      const res = await axios.get(`/courses/admin/enrollments/${ctype}/${course.id}/`);
      const data = res.data || {};
      const list = Array.isArray(data.enrollments) ? data.enrollments : [];
      setDetailItems(list);
      // normalize title/type if provided
      if (data.course) setDetailMeta({ id: data.course.id, title: data.course.title, type: (data.course.type || ctype).toString().toLowerCase() });
    } catch (e) {
      setDetailError(e?.response?.data || e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const ReplayPanel = () => {
    const POSTHOG_APP_URL = import.meta.env.VITE_POSTHOG_APP_URL || import.meta.env.VITE_PUBLIC_POSTHOG_APP_URL || 'https://us.posthog.com';
    const [q, setQ] = useState('');
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [errSessions, setErrSessions] = useState(null);

    const loadSessions = async () => {
      setLoadingSessions(true);
      setErrSessions(null);
      try {
        const params = new URLSearchParams();
        if (filters.last) params.set('last', filters.last);
        if (filters.feature) params.set('feature', filters.feature);
        if (filters.success) params.set('success', filters.success);
        if (filters.contains) params.set('contains', filters.contains);
        params.set('limit', '1200');
        const res = await axios.get(`/analytics/recent-sessions/?${params.toString()}`);
        setSessions(res.data.sessions || []);
      } catch (e) {
        setErrSessions(e?.response?.data || e.message);
      } finally {
        setLoadingSessions(false);
      }
    };

    useEffect(() => {
      loadSessions();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.last, filters.feature, filters.success, filters.contains]);

    const filtered = useMemo(() => {
      const list = sessions.map(s => ({
        id: s.session_id || s.id || s.distinct_id || s.sessionId || '',
        count: s.count,
        success: s.success,
        fail: s.fail,
        first: s.first ? new Date(s.first) : null,
        last: s.last ? new Date(s.last) : null,
        durationMin: s.duration_min ?? s.duration_minute ?? 0,
        // try to surface origin/host info to help find recordings from non-localhost devices
        host: (s.host || s.origin || s.domain || s.hostname || (s.pages && s.pages[0] && (() => { try { const u = new URL(s.pages[0].url); return u.hostname; } catch { return null; } })()) || '')
      }));
      const ql = q.toLowerCase();
      return q ? list.filter(s => s.id?.toLowerCase().includes(ql)) : list;
    }, [sessions, q]);

    const copy = async (text) => { try { await navigator.clipboard.writeText(text); } catch {} };
    const recordingUrl = (sid) => {
      // Search for distinct_id or session_id across PostHog recordings. Use a quoted search to avoid partial matches.
      const q = `distinct_id:\"${sid}\" OR session_id:\"${sid}\" OR id:\"${sid}\"`;
      const base = (POSTHOG_APP_URL || 'https://us.posthog.com').replace(/\/$/, '');
      return `${base}/recordings?search=${encodeURIComponent(q)}`;
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

        <div className="mb-3 flex items-center gap-2">
          <input
            className="w-full md:w-64 border rounded-lg px-3 py-2"
            placeholder="Filter by session id..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={loadSessions} className="px-3 py-2 border rounded">Refresh</button>
        </div>

        {errSessions && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 mb-3 text-sm">
            Failed to load sessions: {JSON.stringify(errSessions)}
          </div>
        )}

        <div className="overflow-auto border rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success/Fail</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingSessions ? (
                <tr><td className="px-4 py-6" colSpan="7">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-4 py-6" colSpan="7">No sessions found</td></tr>
                ) : filtered.map(s => (
                <tr key={s.id || Math.random()}>
                  <td className="px-4 py-2 text-xs font-mono">{s.id || '—'}</td>
                  <td className="px-4 py-2 text-xs">{s.host || '—'}</td>
                  <td className="px-4 py-2 text-xs">{s.count}</td>
                  <td className="px-4 py-2 text-xs">{s.success} / {s.fail}</td>
                  <td className="px-4 py-2 text-xs">{s.first ? s.first.toLocaleString() : '—'}</td>
                  <td className="px-4 py-2 text-xs">{s.last ? s.last.toLocaleString() : '—'}</td>
                  <td className="px-4 py-2 text-xs">{s.durationMin}m</td>
                  <td className="px-4 py-2 text-xs flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => copy(s.id)}>Copy ID</button>
                    <a className="px-2 py-1 border rounded" href={recordingUrl(s.id)} target="_blank" rel="noreferrer">Open PostHog</a>
                    <a className="px-2 py-1 border rounded" href={`${POSTHOG_APP_URL.replace(/\/$/, '')}/recordings`} target="_blank" rel="noreferrer">All Recordings</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Removed: legacy enrollments modal handlers for Overview

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
        <button
          onClick={() => setActiveTab('enrollments')}
          className={`px-3 py-2 rounded-lg text-sm ${activeTab==='enrollments' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >Enrollments</button>
        <button
          onClick={() => setActiveTab('prolearning')}
          className={`px-3 py-2 rounded-lg text-sm ${activeTab==='prolearning' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >AI ProLearning</button>
      </div>

      {activeTab !== 'enrollments' && activeTab !== 'prolearning' && (
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          onRefresh={() => { fetchEvents(); }}
          onExport={exportCSV}
        />
      )}

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 mb-4">
          Failed to load events: {JSON.stringify(error)}
        </div>
      )}

      {activeTab === 'replay' ? (
        <ReplayPanel />
      ) : activeTab === 'overview' ? (
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

          {/* Removed: Overview enrollments and users snapshot per request */}

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

          {/* Removed: legacy enrollments modal on Overview */}
        </>
      ) : activeTab === 'enrollments' ? (
        // Enrollments tab content
        <div className="mb-6 p-4 bg-white rounded-xl border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Course Enrollments</h3>
            <div className="text-xs text-gray-500">Total: {coursesStats.total_courses}</div>
          </div>
          {/* Local filters */}
          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Search</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                placeholder="Course title..."
                value={enrFilters.q}
                onChange={(e) => setEnrFilters(f => ({ ...f, q: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <select className="mt-1 w-40 border rounded-lg px-3 py-2" value={enrFilters.type} onChange={(e) => setEnrFilters(f => ({ ...f, type: e.target.value }))}>
                <option value="all">All</option>
                <option value="engineering">Engineering</option>
                <option value="school">School</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Published</label>
              <select className="mt-1 w-40 border rounded-lg px-3 py-2" value={enrFilters.published} onChange={(e) => setEnrFilters(f => ({ ...f, published: e.target.value }))}>
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Sort</label>
              <select className="mt-1 w-48 border rounded-lg px-3 py-2" value={enrFilters.sort} onChange={(e) => setEnrFilters(f => ({ ...f, sort: e.target.value }))}>
                <option value="enroll_desc">Enrollments (High → Low)</option>
                <option value="enroll_asc">Enrollments (Low → High)</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>
          {courseStatsError && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 mb-3 text-sm">
              Failed to load course stats: {JSON.stringify(courseStatsError)}
            </div>
          )}
          <div className="overflow-auto border rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseStatsLoading ? (
                  <tr><td className="px-4 py-6" colSpan="4">Loading…</td></tr>
                ) : (coursesStats.items?.length || 0) === 0 ? (
                  <tr><td className="px-4 py-6" colSpan="4">No data</td></tr>
                ) : (
                  filteredCourses.map((c) => (
                    <tr key={`${c.course_type}-${c.id}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => openCourseDetail(c)}>
                      <td className="px-4 py-2 text-sm">{c.title}</td>
                      <td className="px-4 py-2 text-sm">{c.course_type === 'engineering' ? 'Engineering' : 'School'}</td>
                      <td className="px-4 py-2 text-sm">{c.enrollments}</td>
                      <td className="px-4 py-2 text-sm">{c.is_published ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ProLearning tab content
        <div className="mb-6 p-4 bg-white rounded-xl border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">AI ProLearning Topics (All Users)</h3>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500 hidden md:block">{filteredProTopics.length} items</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <label className="text-gray-500">Range</label>
                <select
                  className="border rounded-lg px-2 py-1 text-xs"
                  value={filters.last}
                  onChange={(e) => setFilters((f) => ({ ...f, last: e.target.value }))}
                >
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last 7d</option>
                  <option value="30d">Last 30d</option>
                </select>
              </div>
            </div>
          </div>
          {/* ProLearning local filters */}
          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Search</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                placeholder="Topic, course, user/email..."
                value={proFilters.q}
                onChange={(e) => setProFilters(f => ({ ...f, q: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Completion</label>
              <select className="mt-1 w-40 border rounded-lg px-3 py-2" value={proFilters.completion} onChange={(e) => setProFilters(f => ({ ...f, completion: e.target.value }))}>
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="inprogress">In progress</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Min progress</label>
              <select className="mt-1 w-40 border rounded-lg px-3 py-2" value={proFilters.minProgress} onChange={(e) => setProFilters(f => ({ ...f, minProgress: e.target.value }))}>
                <option value="0">0%</option>
                <option value="25">25%</option>
                <option value="50">50%</option>
                <option value="75">75%</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Sort</label>
              <select className="mt-1 w-48 border rounded-lg px-3 py-2" value={proFilters.sort} onChange={(e) => setProFilters(f => ({ ...f, sort: e.target.value }))}>
                <option value="recent">Recently updated</option>
                <option value="progress">Progress (High → Low)</option>
                <option value="topic">Topic A–Z</option>
              </select>
            </div>
          </div>
          {proTopicsError && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 mb-3 text-sm">
              Failed to load: {JSON.stringify(proTopicsError)}
            </div>
          )}
          <div className="overflow-auto border rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proTopicsLoading ? (
                  <tr><td className="px-4 py-6" colSpan="9">Loading…</td></tr>
                ) : filteredProTopics.length === 0 ? (
                  <tr><td className="px-4 py-6" colSpan="9">No data</td></tr>
                ) : (
                  filteredProTopics.map((t) => (
                    <tr key={t.topic_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{t.topic_name}</td>
                      <td className="px-4 py-2 text-sm">
                        {t.course_id ? (
                          <a className="text-blue-600 hover:underline" href={`/pro-learning/${t.course_id}`} target="_blank" rel="noreferrer">{t.course_title || t.course_id}</a>
                        ) : (t.course_title || '—')}
                      </td>
                      <td className="px-4 py-2 text-sm">{t.user_name || '—'}</td>
                      <td className="px-4 py-2 text-xs">{t.user_email || '—'}</td>
                      <td className="px-4 py-2 text-xs">{fmt(t.created_at)}</td>
                      <td className="px-4 py-2 text-xs">{fmt(t.updated_at)}</td>
                      <td className="px-4 py-2 text-xs">{fmt(t.completed_at)}</td>
                      <td className="px-4 py-2 text-xs">{typeof t.progress_percentage === 'number' ? `${Math.round(t.progress_percentage)}%` : '—'}</td>
                      <td className="px-4 py-2 text-xs">
                        {t.course_id && (
                          <button className="px-2 py-1 border rounded" onClick={() => goToProLearning(t)}>Open</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enrolled users detail modal */}
      {detailOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setDetailOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">Enrolled users</div>
                <div className="text-xs text-gray-500">{detailMeta?.title} · {(detailMeta?.type || '').toString().toUpperCase()}</div>
              </div>
              <button className="px-3 py-1 border rounded" onClick={() => setDetailOpen(false)}>Close</button>
            </div>
            {detailError && (
              <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-b border-red-200">{JSON.stringify(detailError)}</div>
            )}
            <div className="p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled at</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last activity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detailLoading ? (
                    <tr><td className="px-4 py-6" colSpan="5">Loading…</td></tr>
                  ) : detailItems.length === 0 ? (
                    <tr><td className="px-4 py-6" colSpan="5">No enrollments</td></tr>
                  ) : (
                    detailItems.map((u, idx) => (
                      <tr key={`${u.user_id || idx}`}>
                        <td className="px-4 py-2 text-sm">{u.name || '—'}</td>
                        <td className="px-4 py-2 text-sm">{u.email || '—'}</td>
                        <td className="px-4 py-2 text-sm">{fmt(u.enrolled_at)}</td>
                        <td className="px-4 py-2 text-sm">{fmt(u.last_activity)}</td>
                        <td className="px-4 py-2 text-sm">{typeof u.progress_percentage === 'number' ? `${Math.round(u.progress_percentage)}%` : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
