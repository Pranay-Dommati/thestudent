import React, { useState, useEffect, useCallback } from 'react';
import { FaTicketAlt, FaPlus, FaArrowLeft, FaSearch, FaCopy, FaCheck, FaUsers, FaFileAlt, FaCreditCard, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import authService from '../../../services/authService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const statusBadge = (status) => {
  const map = {
    Active:    'bg-green-100 text-green-700',
    Expired:   'bg-red-100 text-red-700',
    Exhausted: 'bg-yellow-100 text-yellow-800',
    Inactive:  'bg-gray-100 text-gray-500',
    active:    'bg-green-100 text-green-700',
    expired:   'bg-red-100 text-red-700',
    exhausted: 'bg-yellow-100 text-yellow-800',
    inactive:  'bg-gray-100 text-gray-500',
  };
  return map[status] || 'bg-gray-100 text-gray-500';
};

// ─── Reusable UserTable ──────────────────────────────────────────────────────

/**
 * A searchable, collapsible table of users with per-row stats.
 * columns = [{ key, label, render? }]
 */
const UserInsightTable = ({ title, subtitle, count, accentColor, users, columns, icon: Icon, isDarkMode, loading }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = (users || []).filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const bg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const headerBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const rowHover = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const divider = isDarkMode ? 'divide-gray-700' : 'divide-gray-100';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`rounded-xl shadow-sm border ${bg}`}>
      {/* Header row — always visible */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${accentColor.bg}`}>
            <Icon className={`h-4 w-4 ${accentColor.icon}`} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${textMain}`}>{title}</p>
            <p className={`text-xs ${textSub}`}>{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${accentColor.text}`}>{loading ? '…' : count}</span>
          {open
            ? <FaChevronUp className={`h-4 w-4 ${textSub}`} />
            : <FaChevronDown className={`h-4 w-4 ${textSub}`} />
          }
        </div>
      </button>

      {/* Expandable body */}
      {open && (
        <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          {/* Search bar */}
          <div className="px-5 py-3">
            <div className="relative max-w-xs">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3 w-3" />
              <input
                type="text"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-8 pr-4 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={headerBg}>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider ${textSub}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${divider}`}>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className={`px-4 py-8 text-center text-sm ${textSub}`}>
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className={`px-4 py-8 text-center text-sm ${textSub}`}>
                      {search ? 'No users match your search.' : 'No users in this list yet.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className={rowHover}>
                      {columns.map((col) => (
                        <td key={col.key} className={`px-4 py-3 text-sm ${col.bold ? `font-medium ${textMain}` : textMuted}`}>
                          {col.render ? col.render(user) : user[col.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className={`px-4 py-2 text-xs border-t ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-400'}`}>
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Campaign dashboard table ─────────────────────────────────────────────────

const CampaignDashboard = ({ campaigns, onSelectCampaign, isDarkMode }) => {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className={`rounded-xl shadow-md p-10 text-center ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-400'}`}>
        <FaTicketAlt className="mx-auto mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">No campaigns yet.</p>
        <p className="text-xs mt-1">Click "Create Promo Codes" to generate your first batch.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              {['Campaign', 'Credits', 'Generated', 'Redeemed', 'Remaining', 'Expiry', 'Status', ''].map((h) => (
                <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-100 bg-white'}`}>
            {campaigns.map((c, idx) => (
              <tr key={idx} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                <td className={`px-4 py-3 font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{c.campaign_name}</td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{c.credits_to_add}</td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{c.total_generated}</td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{c.total_redeemed ?? 0}</td>
                <td className={`px-4 py-3 text-sm font-semibold ${c.remaining === 0 ? 'text-red-500' : isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {c.remaining}
                </td>
                <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(c.expires_at)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onSelectCampaign(c.campaign_name)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Individual coupon code row ───────────────────────────────────────────────

const CodeRow = ({ item, isDarkMode }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(item.code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <tr className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-semibold tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.code}</span>
          <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600" title="Copy code">
            {copied ? <FaCheck className="h-3 w-3 text-green-500" /> : <FaCopy className="h-3 w-3" />}
          </button>
        </div>
      </td>
      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {item.times_redeemed > 0
          ? <span className="inline-flex rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">Redeemed</span>
          : <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
        }
      </td>
      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {item.redemptions?.length > 0 ? item.redemptions[0].user_email : '—'}
      </td>
      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {item.redemptions?.length > 0 ? formatDate(item.redemptions[0].redeemed_at) : '—'}
      </td>
      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.credits_to_add}</td>
    </tr>
  );
};

// ─── Coupon detail view ───────────────────────────────────────────────────────

const CouponDetailView = ({ campaignName, codes, loadingCodes, isDarkMode, onBack }) => {
  const [search, setSearch] = useState('');
  const filtered = codes.filter(
    (c) => c.code.includes(search.toUpperCase()) || (c.redemptions?.[0]?.user_email || '').toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          <FaArrowLeft className="h-4 w-4" /> Back
        </button>
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{campaignName}</h2>
      </div>
      <div className="relative max-w-xs">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search code or email…" value={search} onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`} />
      </div>
      <div className={`rounded-xl shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>{['Coupon Code', 'Status', 'Redeemed By', 'Date Redeemed', 'Credits'].map((h) => (
                <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-100 bg-white'}`}>
              {loadingCodes ? (
                <tr><td colSpan={5} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading codes…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No codes found.</td></tr>
              ) : (
                filtered.map((item) => <CodeRow key={item.id} item={item} isDarkMode={isDarkMode} />)
              )}
            </tbody>
          </table>
        </div>
        <div className={`px-4 py-2 text-xs border-t ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-400 border-gray-100'}`}>
          {filtered.length} code{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

// ─── Create Promo Codes form ──────────────────────────────────────────────────

const CreatePromoForm = ({ isDarkMode, onBack, onCreated }) => {
  const [campaignName, setCampaignName] = useState('Faculty Pilot');
  const [credits, setCredits] = useState(5);
  const [quantity, setQuantity] = useState(100);
  const [expiryDays, setExpiryDays] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    setError('');
    if (!campaignName.trim()) { setError('Campaign name is required.'); return; }
    if (credits < 1) { setError('Credits must be at least 1.'); return; }
    if (quantity < 1 || quantity > 500) { setError('Quantity must be between 1 and 500.'); return; }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays, 10));
    setSubmitting(true);
    try {
      const res = await authService.makeAuthenticatedRequest('/scrib/admin/promo-codes/', {
        method: 'POST',
        body: JSON.stringify({ campaign_name: campaignName.trim(), credits_to_add: parseInt(credits, 10), quantity: parseInt(quantity, 10), max_redemptions: 1, expires_at: expiresAt.toISOString() }),
      });
      setGeneratedCodes(res.data.codes || []);
      setShowPreview(true);
      if (onCreated) onCreated();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate codes.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`;
  const labelCls = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <FaArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>
        <div className={`rounded-xl shadow-md p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <FaCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{generatedCodes.length} codes generated for "{campaignName}"</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{credits} credits · Expires in {expiryDays} days</p>
            </div>
          </div>
          <div className={`rounded-lg p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
            {generatedCodes.slice(0, 20).map((c) => <div key={c}>{c}</div>)}
            {generatedCodes.length > 20 && <div className="text-gray-400">…and {generatedCodes.length - 20} more</div>}
          </div>
          <button onClick={onBack} className="mt-5 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          <FaArrowLeft className="h-4 w-4" /> Back
        </button>
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create Promo Codes</h2>
      </div>
      <div className={`rounded-xl shadow-md p-6 max-w-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="space-y-4">
          <div><label className={labelCls}>Campaign Name</label><input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Faculty Pilot" className={inputCls} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelCls}>Credits</label><input type="number" min={1} max={100} value={credits} onChange={(e) => setCredits(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Quantity</label><input type="number" min={1} max={500} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Expires (days)</label><input type="number" min={1} max={3650} value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className={inputCls} /></div>
          </div>
          <div className={`rounded-lg p-4 text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-50 text-blue-800'}`}>
            <p className="font-semibold mb-1">Preview</p>
            <p>{quantity} unique codes · {credits} credits each · expires {(() => { const d = new Date(); d.setDate(d.getDate() + parseInt(expiryDays || 60, 10)); return formatDate(d.toISOString()); })()}</p>
            <p className="font-mono mt-1 text-xs opacity-75">SCRIB-XXXXXX (example)</p>
          </div>
          <button onClick={handleGenerate} disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? (<><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Generating…</>) : (<>Generate {quantity} Codes</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Stats bar ────────────────────────────────────────────────────────────────

const StatsBar = ({ stats, isDarkMode }) => {
  const cards = [
    { label: 'Total Codes', value: stats?.total_codes ?? '—', color: 'text-blue-600' },
    { label: 'Total Redeemed', value: stats?.total_redeemed ?? '—', color: 'text-green-600' },
    { label: 'Active Campaigns', value: stats?.active_campaigns ?? '—', color: 'text-indigo-600' },
    { label: 'Remaining', value: stats?.total_remaining ?? '—', color: 'text-orange-500' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className={`p-4 rounded-xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          <div className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{c.label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ScribPromoAdmin = ({ isDarkMode = false }) => {
  const [view, setView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [detailCampaign, setDetailCampaign] = useState('');
  const [detailCodes, setDetailCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  // User insight state
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError('');
    try {
      const res = await authService.makeAuthenticatedRequest('/scrib/admin/promo-codes/stats/');
      setStats(res.data);
    } catch (err) {
      setStatsError(err?.response?.data?.message || 'Failed to load promo code data.');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const res = await authService.makeAuthenticatedRequest('/scrib/admin/user-insights/');
      setInsights(res.data);
    } catch {
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchInsights();
  }, [fetchStats, fetchInsights]);

  const handleSelectCampaign = async (campaignName) => {
    setDetailCampaign(campaignName);
    setView('detail');
    setLoadingCodes(true);
    try {
      const res = await authService.makeAuthenticatedRequest(`/scrib/admin/promo-codes/?campaign=${encodeURIComponent(campaignName)}`);
      const results = res.data?.results || [];
      const detailed = await Promise.all(
        results.map(async (code) => {
          try { const d = await authService.makeAuthenticatedRequest(`/scrib/admin/promo-codes/${code.id}/`); return d.data; }
          catch { return code; }
        })
      );
      setDetailCodes(detailed);
    } catch { setDetailCodes([]); }
    finally { setLoadingCodes(false); }
  };

  // Column definitions for each user list
  const paidCouponCols = [
    { key: 'email', label: 'Email', bold: true },
    { key: 'full_name', label: 'Name' },
    { key: 'paid_payments', label: 'Payments', render: (u) => <span className="inline-flex rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">{u.paid_payments} paid</span> },
    { key: 'coupons_redeemed', label: 'Coupons Used', render: (u) => <span className="inline-flex rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold">{u.coupons_redeemed} code{u.coupons_redeemed !== 1 ? 's' : ''}</span> },
    { key: 'total_generated', label: 'Notes/Packs', render: (u) => `${u.notes_generated} notes, ${u.packs_generated} packs` },
    { key: 'date_joined', label: 'Joined', render: (u) => formatDate(u.date_joined) },
  ];

  const generatedUsersCols = [
    { key: 'email', label: 'Email', bold: true },
    { key: 'full_name', label: 'Name' },
    { key: 'total_generated', label: 'Generations', render: (u) => (
      <span className="inline-flex rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-semibold">
        {u.notes_generated}N + {u.packs_generated}P = {u.total_generated}
      </span>
    )},
    { key: 'has_paid', label: 'Paid?', render: (u) => u.has_paid
      ? <span className="inline-flex rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">✓ Paid</span>
      : <span className="inline-flex rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-xs">Free</span>
    },
    { key: 'coupons_redeemed', label: 'Coupons', render: (u) => u.coupons_redeemed > 0
      ? <span className="inline-flex rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold">{u.coupons_redeemed} used</span>
      : '—'
    },
    { key: 'date_joined', label: 'Joined', render: (u) => formatDate(u.date_joined) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <FaTicketAlt className="h-5 w-5 text-indigo-600" />
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Scrib — Promo Codes
            </h1>
          </div>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage Faculty Pilot and other promo code campaigns for Scrib credits.
          </p>
        </div>
        {view === 'dashboard' && (
          <button onClick={() => setView('create')}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            <FaPlus className="h-3.5 w-3.5" /> Create Promo Codes
          </button>
        )}
      </div>

      {/* Dashboard view */}
      {view === 'dashboard' && (
        <>
          {loadingStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className={`h-20 rounded-xl animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />)}
              </div>
              <div className={`h-48 rounded-xl animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
            </div>
          ) : statsError ? (
            <div className={`rounded-xl p-6 text-center shadow-md ${isDarkMode ? 'bg-gray-800 text-red-400' : 'bg-white text-red-600'}`}>
              <p className="text-sm font-medium">{statsError}</p>
              <button onClick={fetchStats} className="mt-3 text-blue-600 text-sm hover:underline">Retry</button>
            </div>
          ) : (
            <>
              <StatsBar stats={stats} isDarkMode={isDarkMode} />

              {/* Secondary stats row — from user-insights */}
              <div className="grid grid-cols-2 gap-4 mb-6 -mt-2">
                <div className={`p-4 rounded-xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className={`text-2xl font-bold text-purple-600`}>
                    {loadingInsights ? <span className="text-gray-300 animate-pulse">…</span> : (insights?.total_packs_generated ?? '—')}
                  </div>
                  <div className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Study Packs Generated</div>
                </div>
                <div className={`p-4 rounded-xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className={`text-2xl font-bold text-teal-600`}>
                    {loadingInsights ? <span className="text-gray-300 animate-pulse">…</span> : (insights?.total_paid_users ?? '—')}
                  </div>
                  <div className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Paid Users</div>
                </div>
              </div>

              {/* Campaign Table */}
              <div className="mb-3">
                <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Campaigns</h2>
              </div>
              <CampaignDashboard campaigns={stats?.campaigns || []} onSelectCampaign={handleSelectCampaign} isDarkMode={isDarkMode} />

              {/* ── User Insights ── */}
              <div className="mt-8 mb-3">
                <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>User Insights</h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Click a section to expand the full user list.
                </p>
              </div>

              <div className="space-y-3">
                {/* List 1: Paid users who also used a coupon */}
                <UserInsightTable
                  title="Paid users who redeemed a coupon"
                  subtitle="Made at least 1 payment AND used at least 1 promo code"
                  count={insights?.paid_and_coupon?.count ?? '—'}
                  accentColor={{ bg: 'bg-green-100', icon: 'text-green-600', text: 'text-green-600' }}
                  users={insights?.paid_and_coupon?.users || []}
                  columns={paidCouponCols}
                  icon={FaCreditCard}
                  isDarkMode={isDarkMode}
                  loading={loadingInsights}
                />

                {/* List 2: Users who generated at least once */}
                <UserInsightTable
                  title="Users who generated at least once"
                  subtitle="Generated at least 1 note or study pack (paid or free)"
                  count={insights?.generated_users?.count ?? '—'}
                  accentColor={{ bg: 'bg-blue-100', icon: 'text-blue-600', text: 'text-blue-600' }}
                  users={insights?.generated_users?.users || []}
                  columns={generatedUsersCols}
                  icon={FaFileAlt}
                  isDarkMode={isDarkMode}
                  loading={loadingInsights}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Create view */}
      {view === 'create' && (
        <CreatePromoForm isDarkMode={isDarkMode} onBack={() => { setView('dashboard'); fetchStats(); fetchInsights(); }} onCreated={fetchStats} />
      )}

      {/* Detail view */}
      {view === 'detail' && (
        <CouponDetailView campaignName={detailCampaign} codes={detailCodes} loadingCodes={loadingCodes} isDarkMode={isDarkMode} onBack={() => setView('dashboard')} />
      )}
    </div>
  );
};

export default ScribPromoAdmin;
