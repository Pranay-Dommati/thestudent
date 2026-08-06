import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUsers, FaRedo, FaCrown, FaRupeeSign, FaCreditCard,
  FaFlask, FaTicketAlt, FaFileAlt, FaChevronDown, FaChevronUp,
  FaSearch, FaTimes, FaExternalLinkAlt, FaMedal, FaSortUp, FaSortDown,
  FaSort, FaArrowLeft, FaSpinner,
} from 'react-icons/fa';
import authService from '../../../services/authService';

// ─── Tiny helpers ────────────────────────────────────────────────────────────

const fmt = {
  inr:  (v) => `₹${(v ?? 0).toLocaleString('en-IN')}`,
  date: (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return iso; }
  },
  relDate: (iso) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30)  return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  },
};

const parseTopicsList = (topicsJson) => {
  if (!topicsJson) return [];
  let parsed = topicsJson;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return []; }
  }
  if (!Array.isArray(parsed) || !parsed.length) return [];
  const list = [];
  parsed.forEach((page, pageIdx) => {
    if (page && typeof page === 'object' && Array.isArray(page.topics)) {
      page.topics.forEach((t) => {
        if (t && typeof t === 'object') {
          if (t.name || t.instruction) {
            list.push({
              pageNumber: pageIdx + 1,
              name: t.name || '—',
              instruction: t.instruction || '',
            });
          }
        } else if (t) {
          list.push({ pageNumber: pageIdx + 1, name: String(t), instruction: '' });
        }
      });
    } else if (Array.isArray(page)) {
      page.forEach((t) => {
        if (t && typeof t === 'object') {
          list.push({ pageNumber: pageIdx + 1, name: t.name || '—', instruction: t.instruction || '' });
        } else if (t) {
          list.push({ pageNumber: pageIdx + 1, name: String(t), instruction: '' });
        }
      });
    } else if (page && typeof page === 'object' && (page.name || page.topic)) {
      list.push({ pageNumber: pageIdx + 1, name: page.name || page.topic, instruction: page.instruction || '' });
    } else if (page) {
      list.push({ pageNumber: pageIdx + 1, name: String(page), instruction: '' });
    }
  });
  return list;
};

const TopicsBreakdownBox = ({ topicsList, title, email, isDarkMode }) => {
  if (!topicsList || !topicsList.length) return null;
  const pages = Array.from(new Set(topicsList.map(t => t.pageNumber)));
  return (
    <div className={`p-4 rounded-xl border shadow-inner text-left space-y-3 ${
      isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-indigo-100'
    }`}>
      <div className="flex items-center justify-between border-b pb-2.5 border-inherit">
        <div>
          <span className="text-xs font-bold tracking-wide uppercase text-indigo-600 dark:text-indigo-400">
            📋 User Entered Topics & Optional Instructions
          </span>
          {title && (
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Study Note: <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</span> {email ? `(${email})` : ''}
            </p>
          )}
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
          {topicsList.length} topic{topicsList.length !== 1 ? 's' : ''} • {pages.length} page{pages.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
        {pages.map(pageNum => {
          const pageTopics = topicsList.filter(t => t.pageNumber === pageNum);
          return (
            <div key={pageNum} className={`p-3 rounded-lg border flex flex-col justify-between ${
              isDarkMode ? 'bg-gray-900/70 border-gray-700' : 'bg-gray-50/80 border-gray-200 shadow-sm'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-inherit">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isDarkMode ? 'bg-indigo-900/80 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    Page {pageNum}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {pageTopics.length} topic{pageTopics.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="space-y-2">
                  {pageTopics.map((t, idx) => (
                    <li key={idx} className="text-xs">
                      <div className="font-semibold flex items-start gap-1.5">
                        <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
                        <span className={`break-words ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{t.name}</span>
                      </div>
                      {t.instruction ? (
                        <div className={`mt-1.5 ml-3 p-2 rounded text-[11px] border-l-2 border-amber-500 ${
                          isDarkMode ? 'bg-gray-800/90 text-amber-300' : 'bg-amber-50 text-amber-900'
                        }`}>
                          <span className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider block mb-0.5">Optional Instruction:</span>
                          <span className="italic">"{t.instruction}"</span>
                        </div>
                      ) : (
                        <span className="ml-3 text-[10px] text-gray-400 italic block mt-0.5">No optional instruction provided</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Summary Card ────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon: Icon, color, sub, isDarkMode }) => (
  <div className={`rounded-2xl p-5 flex items-start gap-4 shadow-sm border
    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color.bg}`}>
      <Icon className={`h-5 w-5 ${color.icon}`} />
    </div>
    <div className="min-w-0">
      <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${color.text}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  </div>
);

// ─── Cohort Panel ─────────────────────────────────────────────────────────────

const CohortPanel = ({ icon: Icon, title, subtitle, color, rows, isDarkMode }) => (
  <div className={`rounded-2xl p-5 shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color.bg}`}>
        <Icon className={`h-4 w-4 ${color.icon}`} />
      </div>
      <div>
        <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
      </div>
    </div>
    <div className="space-y-3">
      {rows.map(({ label, value, emphasis }) => (
        <div key={label} className="flex items-center justify-between">
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
          <span className={`text-sm font-semibold ${emphasis ? color.text : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>{value}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Leaderboard Panel ───────────────────────────────────────────────────────

const medalColors = ['text-yellow-500', 'text-gray-400', 'text-orange-600'];

const LeaderboardPanel = ({ title, icon: Icon, color, entries, valueKey, valueLabel, valueFormat, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  const bg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${bg}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color.bg}`}>
            <Icon className={`h-4 w-4 ${color.icon}`} />
          </div>
          <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
        </div>
        {open
          ? <FaChevronUp className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          : <FaChevronDown className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />}
      </button>
      {open && (
        <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <table className="min-w-full">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider w-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>#</th>
                <th className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>User</th>
                <th className={`px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{valueLabel}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {entries.map((e) => (
                <tr key={e.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 text-center">
                    {e.rank <= 3
                      ? <FaMedal className={`h-4 w-4 mx-auto ${medalColors[e.rank - 1]}`} />
                      : <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{e.rank}</span>}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <p className="font-medium truncate max-w-[160px]">{e.full_name || e.email.split('@')[0]}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[160px]`}>{e.email}</p>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold text-sm ${color.text}`}>
                    {valueFormat(e[valueKey])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Note Generations Table ──────────────────────────────────────────────────

const NoteGenerationsTable = ({ packs = [], emptyMessage, isDarkMode, handleViewPdf, pdfLoadingId, maxH = '' }) => {
  const [expandedPackId, setExpandedPackId] = useState(null);
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className={`overflow-x-auto ${maxH}`}>
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-700 border-b border-gray-600' : 'bg-gray-50 border-b border-gray-200'}`}>
            <tr>
              <th className={`px-4 py-3 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Title</th>
              <th className={`px-4 py-3 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>User Email</th>
              <th className={`px-4 py-3 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pages</th>
              <th className={`px-4 py-3 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
              <th className={`px-4 py-3 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Created</th>
              <th className={`px-4 py-3 font-semibold text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>PDF</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {packs.map(pack => {
              const topicsList = parseTopicsList(pack.topics_json);
              const isExpanded = expandedPackId === pack.id;
              return (
                <React.Fragment key={pack.id}>
                  <tr className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-4 py-3 font-medium max-w-[260px] ${textMain}`}>
                      <div className="truncate" title={pack.title}>{pack.title}</div>
                      {topicsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedPackId(isExpanded ? null : pack.id)}
                          className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                            isExpanded
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isDarkMode
                                ? 'bg-gray-700/80 text-indigo-300 border-gray-600 hover:bg-gray-700'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                          }`}
                        >
                          <span>📋 {topicsList.length} topic{topicsList.length !== 1 ? 's' : ''} & optional instructions</span>
                          {isExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                        </button>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${textSub}`}>{pack.email}</td>
                    <td className={`px-4 py-3 ${textMain}`}>{pack.total_pages}</td>
                    <td className={`px-4 py-3`}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize
                        ${pack.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                          pack.status === 'generating' ? 'bg-amber-100 text-amber-700' :
                          pack.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'}`}>
                        {pack.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${textSub}`}>
                      {fmt.date(pack.created_at)} ({fmt.relDate(pack.created_at)})
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(pack.status === 'completed' || pack.status === 'ready') ? (
                        <button
                          onClick={() => handleViewPdf(pack.id)}
                          disabled={pdfLoadingId === pack.id}
                          className={`text-lg transition-transform ${pdfLoadingId === pack.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                          title="View PDF"
                        >
                          {pdfLoadingId === pack.id ? <FaSpinner className="animate-spin h-4 w-4" /> : '📄'}
                        </button>
                      ) : (
                        <span className={`text-xs ${textSub}`}>—</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && topicsList.length > 0 && (
                    <tr className={isDarkMode ? 'bg-gray-900/60' : 'bg-indigo-50/30'}>
                      <td colSpan="6" className="px-4 py-4 whitespace-normal">
                        <TopicsBreakdownBox
                          topicsList={topicsList}
                          title={pack.title}
                          email={pack.email}
                          isDarkMode={isDarkMode}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {!packs.length && (
              <tr>
                <td colSpan="6" className={`px-4 py-8 text-center text-sm ${textSub}`}>{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── PDF Drilldown Drawer ────────────────────────────────────────────────────

const DrilldownDrawer = ({ user, onClose, isDarkMode }) => {
  const [pdfState, setPdfState] = useState(null);
  const [expandedPackId, setExpandedPackId] = useState(null);

  const bg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const border = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const row = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  const divider = isDarkMode ? 'divide-gray-700' : 'divide-gray-100';
  const hdr = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';

  const handleViewPdf = async (pack) => {
    // If pack has s3_key (or even pdf_url stored) — fetch a fresh URL from the admin endpoint
    setPdfState({ loading: true, packId: pack.id, title: pack.title, topicsJson: pack.topics_json });
    try {
      const res = await authService.makeAuthenticatedRequest(`/scrib/admin/packs/${pack.id}/pdf/`);
      const freshUrl = res.data?.pdf_url;
      const topicsJson = res.data?.topics_json || pack.topics_json;
      if (!freshUrl) throw new Error('No URL returned');
      setPdfState({ url: freshUrl, title: res.data?.title || pack.title, topicsJson });
    } catch (err) {
      setPdfState({ error: err?.response?.data?.message || 'Could not load PDF. Try opening it directly.', packId: pack.id, title: pack.title, topicsJson: pack.topics_json });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`relative z-10 h-full w-full max-w-xl shadow-2xl overflow-y-auto ${bg} flex flex-col`}
        style={{ animation: 'slideInRight 0.25s ease' }}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${border} ${bg}`}>
          <div>
            <p className={`font-bold text-base ${textMain}`}>{user.full_name || user.email.split('@')[0]}</p>
            <p className={`text-xs ${textSub}`}>{user.email}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <FaTimes className={`h-4 w-4 ${textSub}`} />
          </button>
        </div>

        {/* KPIs row 1 */}
        <div className={`grid grid-cols-3 gap-0 border-b ${border}`}>
          {[
            { label: 'Payments', value: user.payment_count },
            { label: 'Revenue', value: fmt.inr(user.total_revenue_inr) },
            { label: 'Credits Bought', value: user.credits_purchased },
          ].map(({ label, value }) => (
            <div key={label} className={`px-4 py-3 border-r last:border-r-0 ${border}`}>
              <p className={`text-xs ${textSub}`}>{label}</p>
              <p className={`font-bold text-base mt-0.5 ${textMain}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* KPIs row 2 */}
        <div className={`grid grid-cols-3 gap-0 border-b ${border}`}>
          {[
            { label: 'Credits Spent', value: user.credits_spent },
            { label: 'Credits Left', value: user.credits_remaining },
            { label: 'Study Packs', value: user.study_packs_count },
          ].map(({ label, value }) => (
            <div key={label} className={`px-4 py-3 border-r last:border-r-0 ${border}`}>
              <p className={`text-xs ${textSub}`}>{label}</p>
              <p className={`font-bold text-base mt-0.5 ${textMain}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Study packs table / PDF viewer */}
        <div className="flex-1 overflow-auto">
          {pdfState?.loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FaSpinner className={`h-6 w-6 animate-spin ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-sm ${textSub}`}>Loading PDF…</p>
            </div>
          )}
          {pdfState?.error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
              <p className={`text-sm font-medium text-red-500`}>{pdfState.error}</p>
              <button
                onClick={() => setPdfState(null)}
                className={`text-xs ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                ← Back to packs
              </button>
            </div>
          )}
          {pdfState?.url && (
            <div className="flex flex-col h-full" style={{ minHeight: '400px' }}>
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${border}`}>
                <button
                  onClick={() => setPdfState(null)}
                  className={`flex items-center gap-1.5 text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <FaArrowLeft className="h-3 w-3" /> Back to packs
                </button>
                <span className={`ml-2 text-xs truncate max-w-[200px] ${textSub}`}>{pdfState.title}</span>
              </div>
              {pdfState?.topicsJson && parseTopicsList(pdfState.topicsJson).length > 0 && (
                <div className="p-4 border-b border-inherit">
                  <TopicsBreakdownBox
                    topicsList={parseTopicsList(pdfState.topicsJson)}
                    title={pdfState.title}
                    email={user.email}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
              <iframe src={pdfState.url} className="flex-1 w-full border-0" title="PDF Preview" style={{ minHeight: '500px' }} />
              <div className={`p-3 border-t ${border} flex gap-2`}>
                <a
                  href={pdfState.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-semibold py-2 hover:bg-blue-700"
                >
                  <FaExternalLinkAlt className="h-3 w-3" /> Open PDF
                </a>
              </div>
            </div>
          )}
          {!pdfState && (
            <>
              <div className={`px-4 py-3 ${hdr} border-b ${border}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>
                  Study Pack History ({user.packs.length})
                </p>
              </div>
              {user.packs.length === 0 ? (
                <div className={`px-4 py-10 text-center text-sm ${textSub}`}>No study packs generated yet.</div>
              ) : (
                <table className="min-w-full">
                  <thead className={hdr}>
                    <tr>
                      {['Title', 'Date', 'Credits', 'Pages', ''].map(h => (
                        <th key={h} className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider ${textSub}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${divider}`}>
                    {user.packs.map((pack) => {
                      const topicsList = parseTopicsList(pack.topics_json);
                      const isExpanded = expandedPackId === pack.id;
                      return (
                        <React.Fragment key={pack.id}>
                          <tr className={row}>
                            <td className={`px-4 py-3 text-sm font-medium ${textMain} max-w-[180px]`}>
                              <div className="truncate" title={pack.title}>{pack.title || '—'}</div>
                              {topicsList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedPackId(isExpanded ? null : pack.id)}
                                  className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                                    isExpanded
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : isDarkMode
                                        ? 'bg-gray-700/80 text-indigo-300 border-gray-600 hover:bg-gray-700'
                                        : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                                  }`}
                                >
                                  <span>📋 {topicsList.length} topic{topicsList.length !== 1 ? 's' : ''}</span>
                                  {isExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                </button>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-xs ${textSub} whitespace-nowrap`}>{fmt.date(pack.created_at)}</td>
                            <td className={`px-4 py-3 text-xs ${textSub}`}>{pack.credits_used ?? '—'}</td>
                            <td className={`px-4 py-3 text-xs ${textSub}`}>{pack.total_pages ?? '—'}</td>
                            <td className="px-4 py-3 text-right">
                              {(pack.pdf_url || pack.share_token) ? (
                                <button
                                  onClick={() => handleViewPdf(pack)}
                                  className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                                >
                                  View PDF
                                </button>
                              ) : (
                                <span className={`text-xs ${textSub}`}>—</span>
                              )}
                            </td>
                          </tr>
                          {isExpanded && topicsList.length > 0 && (
                            <tr className={isDarkMode ? 'bg-gray-900/60' : 'bg-indigo-50/30'}>
                              <td colSpan="5" className="px-4 py-4 whitespace-normal">
                                <TopicsBreakdownBox
                                  topicsList={topicsList}
                                  title={pack.title}
                                  email={user.email}
                                  isDarkMode={isDarkMode}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ─── Paid Users Table ────────────────────────────────────────────────────────

const SORT_FIELDS = [
  { key: 'full_name',         label: 'User' },
  { key: 'payment_count',     label: 'Payments' },
  { key: 'total_revenue_inr', label: 'Revenue' },
  { key: 'credits_purchased', label: 'Credits Bought' },
  { key: 'credits_remaining', label: 'Credits Left' },
  { key: 'study_packs_count', label: 'Packs' },
  { key: 'last_active',       label: 'Last Active' },
];

const SortIcon = ({ field, sortKey, sortDir }) => {
  if (sortKey !== field) return <FaSort className="h-3 w-3 opacity-30 ml-1 inline" />;
  return sortDir === 'asc'
    ? <FaSortUp className="h-3 w-3 ml-1 inline text-blue-500" />
    : <FaSortDown className="h-3 w-3 ml-1 inline text-blue-500" />;
};

const PaidUsersTable = ({ users, isDarkMode, onSelectUser }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('total_revenue_inr');
  const [sortDir, setSortDir] = useState('desc');

  const bg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const hdr = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const row = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const divider = isDarkMode ? 'divide-gray-700' : 'divide-gray-100';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textMuted = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = (users || []).filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey] ?? '';
    const vb = b[sortKey] ?? '';
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va - vb);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${bg}`}>
      {/* Search bar */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="relative flex-1 max-w-xs">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3 w-3" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-8 pr-4 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500
              ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
          />
        </div>
        <span className={`text-xs ${textSub}`}>{sorted.length} user{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className={hdr}>
            <tr>
              {SORT_FIELDS.map(f => (
                <th
                  key={f.key}
                  onClick={() => handleSort(f.key)}
                  className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none ${textSub}`}
                >
                  {f.label}
                  <SortIcon field={f.key} sortKey={sortKey} sortDir={sortDir} />
                </th>
              ))}
              <th className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-center ${textSub}`}>PDFs</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${divider}`}>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className={`px-4 py-10 text-center text-sm ${textSub}`}>
                  {search ? 'No users match your search.' : 'No paid users yet.'}
                </td>
              </tr>
            ) : sorted.map(u => (
              <tr key={u.id} className={row}>
                <td className={`px-4 py-3 text-sm ${textMain}`}>
                  <p className="font-medium">{u.full_name || '—'}</p>
                  <p className={`text-xs ${textSub} truncate max-w-[160px]`}>{u.email}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {u.has_trial && (
                      <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold">Trial</span>
                    )}
                    {u.has_coupon && (
                      <span className="inline-flex rounded-full bg-indigo-100 text-indigo-700 px-1.5 py-0.5 text-[10px] font-semibold">Coupon</span>
                    )}
                    {u.payment_count >= 2 && (
                      <span className="inline-flex rounded-full bg-green-100 text-green-700 px-1.5 py-0.5 text-[10px] font-semibold">Repeat</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold
                    ${u.payment_count >= 3 ? 'bg-purple-100 text-purple-700' :
                      u.payment_count >= 2 ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'}`}>
                    {u.payment_count}×
                  </span>
                </td>
                <td className={`px-4 py-3 text-sm font-semibold ${u.total_revenue_inr >= 300 ? 'text-emerald-600' : textMuted}`}>
                  {fmt.inr(u.total_revenue_inr)}
                </td>
                <td className={`px-4 py-3 text-sm ${textMuted}`}>{u.credits_purchased}</td>
                <td className={`px-4 py-3 text-sm ${textMuted}`}>{u.credits_remaining}</td>
                <td className={`px-4 py-3 text-sm ${textMuted}`}>{u.study_packs_count}</td>
                <td className={`px-4 py-3 text-xs ${textSub}`}>{fmt.relDate(u.last_active)}</td>
                <td className="px-4 py-3 text-center">
                  {u.study_packs_count > 0 ? (
                    <button
                      onClick={() => onSelectUser(u)}
                      className="text-lg hover:scale-110 transition-transform"
                      title="View study packs"
                    >📄</button>
                  ) : (
                    <span className={`text-xs ${textSub}`}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

// IST "today" as YYYY-MM-DD, regardless of the browser's timezone
const istToday = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().split('T')[0];

const DayNoteGenerations = ({ isDarkMode, handleViewPdf, pdfLoadingId }) => {
  const [day, setDay] = useState(istToday);
  const [packs, setPacks] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authService.makeAuthenticatedRequest(`/scrib/admin/packs-by-date/?date=${day}`);
        if (cancelled) return;
        setPacks(res.data?.packs ?? []);
        setCount(res.data?.count ?? res.data?.packs?.length ?? 0);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load note generations.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [day]);

  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const isToday = day === istToday();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className={`text-sm font-semibold ${textMain}`}>📅 Note Generations by Day</h3>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={day}
            max={istToday()}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            className={`text-xs px-2 py-1.5 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          />
          {!isToday && (
            <button
              onClick={() => setDay(istToday())}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
          )}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isDarkMode ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
          }`}>
            {loading ? '…' : `${count} generated`}
          </span>
        </div>
      </div>
      {loading ? (
        <div className={`h-32 rounded-2xl animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
      ) : error ? (
        <div className={`rounded-2xl p-6 text-center text-sm ${isDarkMode ? 'bg-gray-800 text-red-400' : 'bg-white text-red-600'}`}>
          {error}
        </div>
      ) : (
        <NoteGenerationsTable
          packs={packs}
          emptyMessage={`No note generations on ${fmt.date(day)}.`}
          isDarkMode={isDarkMode}
          handleViewPdf={handleViewPdf}
          pdfLoadingId={pdfLoadingId}
          maxH="max-h-80 overflow-y-auto"
        />
      )}
    </div>
  );
};

const ScribPaidAnalytics = ({ isDarkMode = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 28);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const handleViewPdf = async (packId) => {
    setPdfLoadingId(packId);
    try {
      const res = await authService.makeAuthenticatedRequest(`/scrib/admin/packs/${packId}/pdf/`);
      const freshUrl = res.data?.pdf_url;
      if (freshUrl) window.open(freshUrl, '_blank');
      else alert('Could not find PDF URL.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not load PDF.');
    } finally {
      setPdfLoadingId(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.makeAuthenticatedRequest(`/scrib/admin/paid-analytics/?start_date=${startDate}&end_date=${endDate}`);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load paid analytics.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-24 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
          ))}
        </div>
        <div className={`h-40 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
        <div className={`h-64 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl p-8 text-center ${isDarkMode ? 'bg-gray-800 text-red-400' : 'bg-white text-red-600'}`}>
        <p className="font-medium">{error}</p>
        <button onClick={fetchData} className="mt-3 text-blue-600 text-sm hover:underline">Retry</button>
      </div>
    );
  }

  const s = data?.summary ?? {};
  const cohorts = data?.cohorts ?? {};
  const lb = data?.leaderboards ?? {};
  const trial = cohorts.trial ?? {};
  const coupon = cohorts.coupon ?? {};

  const summaryCards = [
    {
      label: 'Paid Users',
      value: s.total_paid_users ?? '—',
      icon: FaUsers,
      color: { bg: 'bg-blue-100', icon: 'text-blue-600', text: 'text-blue-600' },
    },
    {
      label: 'Total Revenue',
      value: fmt.inr(s.total_revenue_inr ?? 0),
      icon: FaRupeeSign,
      color: { bg: 'bg-emerald-100', icon: 'text-emerald-700', text: 'text-emerald-700' },
    },
    {
      label: 'Repeat Payers',
      value: s.repeat_payers ?? '—',
      icon: FaRedo,
      color: { bg: 'bg-green-100', icon: 'text-green-600', text: 'text-green-600' },
      sub: s.total_paid_users > 0
        ? `${Math.round((s.repeat_payers / s.total_paid_users) * 100)}% of paid`
        : undefined,
    },
    {
      label: '≥ 3 Purchases',
      value: s.three_plus_payers ?? '—',
      icon: FaCrown,
      color: { bg: 'bg-purple-100', icon: 'text-purple-600', text: 'text-purple-600' },
      sub: s.total_paid_users > 0
        ? `${Math.round((s.three_plus_payers / s.total_paid_users) * 100)}% of paid`
        : undefined,
    },
    {
      label: 'Avg Revenue / User',
      value: fmt.inr(s.avg_revenue_per_user_inr ?? 0),
      icon: FaRupeeSign,
      color: { bg: 'bg-emerald-100', icon: 'text-emerald-600', text: 'text-emerald-600' },
    },
    {
      label: 'Avg Credits / User',
      value: s.avg_credits_per_user ?? '—',
      icon: FaCreditCard,
      color: { bg: 'bg-orange-100', icon: 'text-orange-500', text: 'text-orange-500' },
      sub: 'credits purchased',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Section header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-bold ${textMain}`}>📊 Paid Users Analytics</h2>
          <p className={`text-xs mt-0.5 ${textSub}`}>Live data — based on payments in selected date range</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`text-xs px-2 py-1.5 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          />
          <span className={`text-xs ${textSub}`}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`text-xs px-2 py-1.5 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          />
          <button
            onClick={fetchData}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium
              ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {summaryCards.map(c => (
          <KpiCard key={c.label} isDarkMode={isDarkMode} {...c} />
        ))}
      </div>

      {/* ── Cohort Analytics ── */}
      <div>
        <h3 className={`text-sm font-semibold mb-3 ${textMain}`}>Cohort Analytics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CohortPanel
            icon={FaFlask}
            title="₹19 Trial Cohort"
            subtitle="Users who purchased the ₹19 trial pack"
            color={{ bg: 'bg-amber-100', icon: 'text-amber-600', text: 'text-amber-600' }}
            isDarkMode={isDarkMode}
            rows={[
              { label: 'Trial Buyers', value: trial.trial_buyers ?? '—' },
              { label: 'Trial → 2nd Purchase', value: trial.conversion_to_2nd_pct != null ? `${trial.conversion_to_2nd_pct}%` : '—', emphasis: true },
              { label: 'Trial → 3rd Purchase', value: trial.conversion_to_3rd_pct != null ? `${trial.conversion_to_3rd_pct}%` : '—', emphasis: true },
              { label: 'Avg Revenue / Trial User', value: fmt.inr(trial.avg_revenue_inr ?? 0) },
            ]}
          />
          <CohortPanel
            icon={FaTicketAlt}
            title="Coupon Cohort"
            subtitle="Users who redeemed at least one promo code"
            color={{ bg: 'bg-indigo-100', icon: 'text-indigo-600', text: 'text-indigo-600' }}
            isDarkMode={isDarkMode}
            rows={[
              { label: 'Coupon Redeemers', value: coupon.coupon_users ?? '—' },
              { label: 'Coupon → Paid', value: coupon.coupon_to_paid_pct != null ? `${coupon.coupon_to_paid_pct}%` : '—', emphasis: true },
              { label: 'Coupon → Repeat', value: coupon.coupon_to_repeat_pct != null ? `${coupon.coupon_to_repeat_pct}%` : '—', emphasis: true },
              { label: 'Avg Revenue / Coupon User', value: fmt.inr(coupon.avg_revenue_inr ?? 0) },
            ]}
          />
        </div>
      </div>

      {/* ── Note Generations by Day ── */}
      <DayNoteGenerations
        isDarkMode={isDarkMode}
        handleViewPdf={handleViewPdf}
        pdfLoadingId={pdfLoadingId}
      />

      {/* ── Recent Note Generations ── */}
      <div>
        <h3 className={`text-sm font-semibold mb-3 ${textMain}`}>⚡ Recent Note Generations</h3>
        <NoteGenerationsTable
          packs={data?.recent_packs ?? []}
          emptyMessage="No recent packs found."
          isDarkMode={isDarkMode}
          handleViewPdf={handleViewPdf}
          pdfLoadingId={pdfLoadingId}
        />
      </div>

      {/* ── Paid Users Table ── */}
      <div>
        <h3 className={`text-sm font-semibold mb-3 ${textMain}`}>👥 Paid Users</h3>
        <PaidUsersTable
          users={data?.paid_users ?? []}
          isDarkMode={isDarkMode}
          onSelectUser={setSelectedUser}
        />
      </div>

      {/* ── Leaderboards ── */}
      <div>
        <h3 className={`text-sm font-semibold mb-3 ${textMain}`}>⭐ Leaderboards</h3>
        <div className="space-y-3">
          <LeaderboardPanel
            title="Top Revenue Users"
            icon={FaRupeeSign}
            color={{ bg: 'bg-emerald-100', icon: 'text-emerald-600', text: 'text-emerald-600' }}
            entries={lb.top_revenue ?? []}
            valueKey="total_revenue_inr"
            valueLabel="Revenue"
            valueFormat={(v) => fmt.inr(v)}
            isDarkMode={isDarkMode}
          />
          <LeaderboardPanel
            title="Top Repeat Buyers"
            icon={FaRedo}
            color={{ bg: 'bg-green-100', icon: 'text-green-600', text: 'text-green-600' }}
            entries={lb.top_repeat ?? []}
            valueKey="payment_count"
            valueLabel="Payments"
            valueFormat={(v) => `${v}×`}
            isDarkMode={isDarkMode}
          />
          <LeaderboardPanel
            title="Top Credit Consumers"
            icon={FaCreditCard}
            color={{ bg: 'bg-orange-100', icon: 'text-orange-500', text: 'text-orange-500' }}
            entries={lb.top_credits ?? []}
            valueKey="credits_spent"
            valueLabel="Credits Used"
            valueFormat={(v) => v}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* ── PDF Drilldown Drawer ── */}
      {selectedUser && (
        <DrilldownDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default ScribPaidAnalytics;
