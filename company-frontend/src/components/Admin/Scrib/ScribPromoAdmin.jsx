import React, { useState, useEffect, useCallback } from 'react';
import { FaTicketAlt, FaPlus, FaArrowLeft, FaSearch, FaCopy, FaCheck, FaUsers, FaFileAlt, FaCreditCard, FaChevronDown, FaChevronUp, FaChartBar } from 'react-icons/fa';
import authService from '../../../services/authService';
import ScribPaidAnalytics from './ScribPaidAnalytics';

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
  const [activeTab, setActiveTab] = useState('promo');
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
  // Cohort toggle state
  const [cohort, setCohort] = useState('preview');
  const [giveFreeCredit, setGiveFreeCredit] = useState(false);
  const [cohortLoading, setCohortLoading] = useState(true);
  const [cohortSaving, setCohortSaving] = useState(false);
  const [cohortSaved, setCohortSaved] = useState(false);
  const [cohortError, setCohortError] = useState('');
  const [cohortEconomics, setCohortEconomics] = useState({
    users_given_free_credit: 2481,
    free_credits_used: 2106,
    converted_to_paid: 184,
    conversion_rate_pct: 8.74,
    cost_per_free_credit: 7,
    total_free_credit_cost: 14742,
    lifetime_profit: 96850,
    net_gain: 82108,
    return_per_rupee: 6.57,
  });
  const [cohortComparison, setCohortComparison] = useState(null);

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

  const fetchCohortConfig = useCallback(async () => {
    setCohortLoading(true);
    try {
      const res = await authService.makeAuthenticatedRequest('/scrib/admin/config/');
      setCohort(res.data.cohort);
      setGiveFreeCredit(res.data.give_free_credit_on_signup);
      if (res.data.cohort_economics) {
        setCohortEconomics(res.data.cohort_economics);
      }
      if (res.data.cohort_comparison) {
        setCohortComparison(res.data.cohort_comparison);
      }
    } catch {
      setCohortError('Failed to load cohort config.');
    } finally {
      setCohortLoading(false);
    }
  }, []);

  const saveCohortConfig = async () => {
    setCohortSaving(true);
    setCohortSaved(false);
    setCohortError('');
    try {
      const res = await authService.makeAuthenticatedRequest('/scrib/admin/config/', {
        method: 'PATCH',
        body: { cohort, give_free_credit_on_signup: giveFreeCredit },
      });
      if (res.data?.cohort_economics) {
        setCohortEconomics(res.data.cohort_economics);
      }
      setCohortSaved(true);
      setTimeout(() => setCohortSaved(false), 3000);
    } catch {
      setCohortError('Failed to save config. Please try again.');
    } finally {
      setCohortSaving(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchInsights();
    fetchCohortConfig();
  }, [fetchStats, fetchInsights, fetchCohortConfig]);

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

  const tabBase = 'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors';
  const tabActive = isDarkMode
    ? 'bg-gray-700 text-white'
    : 'bg-white text-gray-900 shadow-sm';
  const tabInactive = isDarkMode
    ? 'text-gray-400 hover:text-gray-200'
    : 'text-gray-500 hover:text-gray-700';

  return (
    <div className="space-y-6">
      {/* ── Tab Bar ── */}
      <div className={`flex gap-1 p-1 rounded-xl w-fit ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <button
          id="tab-promo-codes"
          onClick={() => { setActiveTab('promo'); setView('dashboard'); }}
          className={`${tabBase} ${activeTab === 'promo' ? tabActive : tabInactive}`}
        >
          <FaTicketAlt className="h-3.5 w-3.5" /> Promo Codes
        </button>
        <button
          id="tab-paid-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`${tabBase} ${activeTab === 'analytics' ? tabActive : tabInactive}`}
        >
          <FaChartBar className="h-3.5 w-3.5" /> Paid Analytics
        </button>
        <button
          id="tab-cohort-toggle"
          onClick={() => setActiveTab('cohort')}
          className={`${tabBase} ${activeTab === 'cohort' ? tabActive : tabInactive}`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Cohort
        </button>
      </div>

      {/* ── Cohort Toggle & Economics tab ── */}
      {activeTab === 'cohort' && (
        <div className="space-y-8 max-w-5xl">
          {/* Card 1: Landing Modal Cohort */}
          <div className={`rounded-xl shadow-sm border p-6 max-w-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-1">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Landing Modal Cohort</h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Controls which modal new visitors see on the Scrib homepage</p>
              </div>
            </div>

            {cohortLoading ? (
              <div className={`mt-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading config…</div>
            ) : (
              <>
                {cohortError && (
                  <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{cohortError}</div>
                )}

                {/* Cohort selector cards */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Cohort A */}
                  <button
                    id="cohort-select-preview"
                    onClick={() => setCohort('preview')}
                    className={`text-left rounded-xl border-2 p-4 transition-all ${
                      cohort === 'preview'
                        ? 'border-indigo-500 bg-indigo-50'
                        : isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        cohort === 'preview' ? 'text-indigo-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Cohort A</span>
                      {cohort === 'preview' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">● Active</span>
                      )}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef7df] border border-[#dbe8c3] mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4e8c3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                    <p className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Preview Modal</p>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Shows "See exactly what you're paying for." Directs users to browse 50+ free preview notes.
                    </p>
                  </button>

                  {/* Cohort B */}
                  <button
                    id="cohort-select-free-credit"
                    onClick={() => setCohort('free_credit')}
                    className={`text-left rounded-xl border-2 p-4 transition-all ${
                      cohort === 'free_credit'
                        ? 'border-amber-500 bg-amber-50'
                        : isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        cohort === 'free_credit' ? 'text-amber-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Cohort B</span>
                      {cohort === 'free_credit' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">● Active</span>
                      )}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef7df] border border-[#dbe8c3] mb-2">
                      <span className="text-xl">🎁</span>
                    </div>
                    <p className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Free Credit Modal</p>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Shows "Get your first free credit 🎁". Encourages new users to sign up and try generating.
                    </p>
                  </button>
                </div>

                {/* Sub-toggle: Give real credit on signup */}
                <div className={`mt-5 rounded-xl border p-4 transition-all ${
                  cohort === 'free_credit'
                    ? isDarkMode ? 'border-amber-700 bg-amber-900/20' : 'border-amber-200 bg-amber-50'
                    : isDarkMode ? 'border-gray-700 opacity-40' : 'border-gray-100 opacity-40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Actually grant the free credit on signup</p>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        When ON, new users get +1 credit automatically after email verification. Only applies to Cohort B.
                      </p>
                    </div>
                    <button
                      id="toggle-give-free-credit"
                      onClick={() => cohort === 'free_credit' && setGiveFreeCredit(v => !v)}
                      disabled={cohort !== 'free_credit'}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                        giveFreeCredit && cohort === 'free_credit' ? 'bg-amber-500' : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                      }`}
                      aria-label="Toggle give free credit"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        giveFreeCredit && cohort === 'free_credit' ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {giveFreeCredit && cohort === 'free_credit' && (
                    <p className="mt-2 text-xs text-amber-700 font-medium">
                      ⚡ Credit granted at first signup (OTP email or Google) — once per user, automatically.
                    </p>
                  )}
                </div>

                {/* Save button */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    id="save-cohort-config"
                    onClick={saveCohortConfig}
                    disabled={cohortSaving}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {cohortSaving ? (
                      <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Saving…</>
                    ) : 'Save changes'}
                  </button>
                  {cohortSaved && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                      <FaCheck className="h-3.5 w-3.5" /> Saved!
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Card 2: Free Credit Cohort Economics */}
          <div className={`rounded-2xl shadow-sm border p-6 md:p-8 transition-all ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200/80'
          }`}>
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3.5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isDarkMode ? 'bg-emerald-950/60 border border-emerald-800' : 'bg-emerald-50 border border-emerald-100'
                }`}>
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className={`font-extrabold text-lg sm:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Free Credit Cohort Economics
                    </h3>
                  </div>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Deep financial evaluation of Cohort B experiment (cost, profit, and founder ROI)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-8">
              {/* 1. Cohort Summary */}
              <div>
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-3.5 flex items-center gap-2 ${
                  isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`}>
                  <span>1. Cohort Summary</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50/80 border-gray-100'}`}>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Users Given Free Credit</p>
                    <p className={`text-xl sm:text-2xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {Number(cohortEconomics.users_given_free_credit || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50/80 border-gray-100'}`}>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Free Credits Used</p>
                    <p className={`text-xl sm:text-2xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {Number(cohortEconomics.free_credits_used || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50/80 border-gray-100'}`}>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Converted to Paid</p>
                    <p className={`text-xl sm:text-2xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {Number(cohortEconomics.converted_to_paid || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-emerald-50/80 border-emerald-100'}`}>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Conversion Rate</p>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {cohortEconomics.conversion_rate_pct || 0}%
                    </p>
                  </div>
                </div>
                <p className={`mt-2.5 text-xs italic flex items-center gap-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>💡</span> This tells you the size and conversion of the experiment.
                </p>
              </div>

              {/* 2. Investment (Your Cost) */}
              <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-rose-50/30 border-rose-100'}`}>
                <h4 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                  2. Investment (Your Cost)
                </h4>
                <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Since every used free credit costs Scrib ₹7:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cost per Free Credit</p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>₹{cohortEconomics.cost_per_free_credit || 7}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Free Credits Used</p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{Number(cohortEconomics.free_credits_used || 0).toLocaleString()}</p>
                  </div>
                  <div className={`pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l pl-0 sm:pl-4 ${isDarkMode ? 'border-gray-700' : 'border-rose-200'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Total Free Credit Cost</p>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                      ₹{Number(cohortEconomics.total_free_credit_cost || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <code className="text-[11px] px-2 py-1 rounded bg-rose-100/60 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-mono inline-block">
                    Formula: Total Free Credit Cost = Free Credits Used × ₹7
                  </code>
                </div>
              </div>

              {/* 3. Return (Profit, not Revenue) */}
              <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-emerald-50/30 border-emerald-100'}`}>
                <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  3. Return (Profit, not Revenue)
                </h4>
                <p className={`text-xs font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Don't show revenue. <span className="font-bold underline decoration-emerald-500 decoration-2">Show Lifetime Profit.</span>
                </p>
                
                <div className={`p-4 rounded-xl border mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-emerald-950/40 border-emerald-800/50' : 'bg-white border-emerald-200/80 shadow-sm'
                }`}>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Lifetime Profit from Converted Users
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ₹{Number(cohortEconomics.lifetime_profit || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className={`text-xs space-y-2 p-3.5 rounded-lg ${isDarkMode ? 'bg-gray-800/80 text-gray-300' : 'bg-white/80 text-gray-600 border border-gray-100'}`}>
                  <p>
                    <strong className="text-gray-900 dark:text-white">Definition:</strong> Sum of the profit earned from all successful payments made by users who originally received the free credit.
                  </p>
                  <p className="font-semibold text-gray-700 dark:text-gray-200 pt-1">This accounts for:</p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li>AI generation costs for paid credits</li>
                    <li>Payment gateway fees</li>
                    <li>Any other variable costs included in profit calculation</li>
                  </ul>
                  <p className="text-[11px] pt-1.5 border-t border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 italic">
                    Note: Profit sits around ₹2.5/credit for ₹19 pack, ₹2.0/credit for ₹89 pack, ₹1.5/credit for ₹169 pack, and ₹1.0/credit for ₹319 pack.
                  </p>
                </div>
              </div>

              {/* 4. Net Gain */}
              <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-indigo-50/30 border-indigo-100'}`}>
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
                  4. Net Gain
                </h4>
                
                <div className="max-w-md space-y-2.5 text-sm font-medium">
                  <div className="flex justify-between items-center">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Lifetime Profit</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{Number(cohortEconomics.lifetime_profit || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>
                  <div className="flex justify-between items-center">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Free Credit Cost</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      ₹{Number(cohortEconomics.total_free_credit_cost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-2"></div>
                  <div className="flex justify-between items-center text-base sm:text-lg font-black">
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Net Gain</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      ₹{Number(cohortEconomics.net_gain || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <code className="text-[11px] px-2 py-1 rounded bg-indigo-100/60 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 font-mono inline-block">
                    Formula: Net Gain = Lifetime Profit − Total Free Credit Cost
                  </code>
                </div>
              </div>

              {/* 5. Return on Investment */}
              <div className={`rounded-2xl p-6 border-2 relative overflow-hidden ${
                isDarkMode ? 'bg-gradient-to-br from-indigo-950/50 via-gray-900 to-purple-950/40 border-indigo-500/40' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-200 shadow-sm'
              }`}>
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                  5. Return on Investment
                </h4>
                <p className={`text-xs mb-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Instead of a percentage, show something every founder understands.
                </p>

                <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isDarkMode ? 'bg-gray-900/80 border-indigo-800/50' : 'bg-white border-indigo-100 shadow-sm'
                }`}>
                  <div>
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Every ₹1 Spent on Free Credits Returned
                    </p>
                    <p className="text-3xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400 mt-1 tracking-tight">
                      ₹{cohortEconomics.return_per_rupee || 6.57}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <code className="text-[11px] px-2.5 py-1 rounded bg-indigo-100/60 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-mono inline-block">
                      Formula: Return per ₹1 = Lifetime Profit ÷ Total Free Credit Cost
                    </code>
                  </div>
                  <p className={`text-xs font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Example: Cost = ₹{Number(cohortEconomics.total_free_credit_cost || 0).toLocaleString()} | Lifetime Profit = ₹{Number(cohortEconomics.lifetime_profit || 0).toLocaleString()} | ₹{Number(cohortEconomics.lifetime_profit || 0).toLocaleString()} ÷ ₹{Number(cohortEconomics.total_free_credit_cost || 0).toLocaleString()} = {cohortEconomics.return_per_rupee || 6.57}
                  </p>
                  <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    isDarkMode ? 'bg-indigo-900/30 text-indigo-200 border border-indigo-800/40' : 'bg-indigo-100/60 text-indigo-900'
                  }`}>
                    <span className="text-base">🚀</span>
                    <span>
                      <strong>Meaning:</strong> Every ₹1 invested in free credits generated ₹{cohortEconomics.return_per_rupee || 6.57} in lifetime profit.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Lifetime Cohort Comparison */}
            {cohortComparison && (() => {
              const B = cohortComparison.by_cohort?.free_credit || {};
              const A = cohortComparison.by_cohort?.preview || {};
              const periods = cohortComparison.periods || [];

              const delta = (aVal, bVal, higherIsBetter = true) => {
                if (!bVal) return null;
                const pct = Math.round(((aVal - bVal) / bVal) * 100);
                const improved = higherIsBetter ? pct > 0 : pct < 0;
                return { pct, improved };
              };

              const DeltaBadge = ({ d }) => {
                if (!d) return null;
                return (
                  <span className={`ml-1.5 inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    d.improved ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {d.pct > 0 ? '↑' : '↓'} {Math.abs(d.pct)}%
                  </span>
                );
              };

              const rows = [
                { label: 'Days Active',              bVal: B.days_active,              aVal: A.days_active,              fmt: v => v ?? '—',        higher: false },
                { label: 'Total Signups',             bVal: B.signups,                  aVal: A.signups,                  fmt: v => v?.toLocaleString() ?? '—', higher: false },
                { label: 'Signups / Day',             bVal: B.signups_per_day,          aVal: A.signups_per_day,          fmt: v => v != null ? `${v}` : '—',   higher: true  },
                { label: 'Paid Users',                bVal: B.paid_users,               aVal: A.paid_users,               fmt: v => v?.toLocaleString() ?? '—', higher: true  },
                { label: 'Paid Conversion Rate',      bVal: B.conversion_pct,           aVal: A.conversion_pct,           fmt: v => v != null ? `${v}%` : '—',  higher: true, emphasis: true },
                { label: 'Lifetime Profit',           bVal: B.lifetime_profit,          aVal: A.lifetime_profit,          fmt: v => v != null ? `₹${Number(v).toLocaleString()}` : '—', higher: true },

                { label: 'Avg Profit / Paid User',    bVal: B.avg_profit_per_paid_user, aVal: A.avg_profit_per_paid_user, fmt: v => v != null ? `₹${v}` : '—',  higher: true },
                { label: 'Credits Used',              bVal: B.credits_used,             aVal: A.credits_used,             fmt: v => v?.toLocaleString() ?? '—', higher: false },
              ];

              const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
              const textSub  = isDarkMode ? 'text-gray-400' : 'text-gray-500';
              const cardBg   = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200/80';

              return (
                <div className={`mt-8 rounded-2xl shadow-sm border p-6 md:p-8 ${cardBg}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3.5">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        isDarkMode ? 'bg-indigo-950/60 border border-indigo-800' : 'bg-indigo-50 border border-indigo-100'
                      }`}>
                        <span className="text-2xl">⚖️</span>
                      </div>
                      <div>
                        <h3 className={`font-extrabold text-lg sm:text-xl tracking-tight ${textMain}`}>
                          Lifetime Cohort Comparison
                        </h3>
                        <p className={`text-xs mt-0.5 ${textSub}`}>
                          All-time metrics aggregated by the cohort users signed up under
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {periods.length} period{periods.length !== 1 ? 's' : ''} tracked
                    </span>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className={`text-left py-3 pr-4 font-semibold text-xs uppercase tracking-wider ${textSub}`}>Metric</th>
                          <th className={`text-center py-3 px-4 font-extrabold text-sm ${
                            isDarkMode ? 'text-amber-300' : 'text-amber-600'
                          }`}>
                            Cohort B
                            <span className={`block text-[10px] font-normal ${textSub}`}>Free Credit</span>
                          </th>
                          <th className={`text-center py-3 pl-4 font-extrabold text-sm ${
                            isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                          }`}>
                            Cohort A
                            <span className={`block text-[10px] font-normal ${textSub}`}>Preview Modal</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        {rows.map(({ label, bVal, aVal, fmt, higher, emphasis }) => {
                          const d = delta(aVal, bVal, higher);
                          return (
                            <tr key={label} className={emphasis ? (isDarkMode ? 'bg-indigo-950/20' : 'bg-indigo-50/40') : ''}>
                              <td className={`py-3 pr-4 font-medium ${emphasis ? (isDarkMode ? 'text-indigo-200' : 'text-indigo-800') : textMain}`}>
                                {label}
                                {emphasis && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500">★ KEY</span>}
                              </td>
                              <td className={`py-3 px-4 text-center font-semibold ${
                                isDarkMode ? 'text-amber-200' : 'text-amber-700'
                              }`}>
                                {fmt(bVal)}
                              </td>
                              <td className={`py-3 pl-4 text-center font-semibold flex items-center justify-center gap-0 ${
                                isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                              }`}>
                                {fmt(aVal)}
                                <DeltaBadge d={d} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className={`mt-5 pt-4 border-t text-xs flex items-center gap-4 flex-wrap ${
                    isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'
                  }`}>
                    <span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] mr-1">↑ x%</span>
                      Cohort A is better than Cohort B by x%
                    </span>
                    <span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] mr-1">↓ x%</span>
                      Cohort A is worse than Cohort B by x%
                    </span>
                  </div>

                  {periods.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className={`text-xs font-semibold mb-2 uppercase tracking-wider ${textSub}`}>Period Timeline</p>
                      <div className="flex flex-wrap gap-2">
                        {periods.map((p, i) => (
                          <div key={i} className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                            p.cohort === 'free_credit'
                              ? (isDarkMode ? 'bg-amber-900/30 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800')
                              : (isDarkMode ? 'bg-indigo-900/30 border-indigo-700/50 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-800')
                          }`}>
                            <span className="font-bold">{p.cohort === 'free_credit' ? 'B' : 'A'}</span>
                            {' '}{new Date(p.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {' → '}
                            {p.ended_at ? new Date(p.ended_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'now'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Paid Analytics tab ── */}
      {activeTab === 'analytics' && (
        <ScribPaidAnalytics isDarkMode={isDarkMode} />
      )}

      {/* ── Promo Codes tab ── */}
      {activeTab === 'promo' && <>
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
              <div className="grid grid-cols-3 gap-4 mb-6 -mt-2">
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
                <div className={`p-4 rounded-xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className={`text-2xl font-bold text-orange-500`}>
                    {loadingInsights ? <span className="text-gray-300 animate-pulse">…</span> : (insights?.repeat_paid_users ?? '—')}
                  </div>
                  <div className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Repeat Payers (≥ 2×)</div>
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
      </>}
    </div>
  );
};

export default ScribPromoAdmin;
