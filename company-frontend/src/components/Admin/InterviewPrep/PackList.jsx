import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-hot-toast';
import { FaPlus, FaFilePdf, FaExclamationTriangle, FaLayerGroup, FaChartLine } from 'react-icons/fa';

const rupees = (paise) => `₹${Math.round((paise || 0) / 100).toLocaleString('en-IN')}`;

const THEMES = ['blue', 'green', 'purple', 'orange', 'red', 'olive'];

const EMPTY_PACK = {
  title: '',
  category: '',
  section: 'interview',
  description: '',
  theme: 'blue',
  price_paise: 9900,
  free_page_count: 10,
  sort_order: 0,
  is_active: true,
};

const PackList = ({ isDarkMode }) => {
  const [packs, setPacks] = useState([]);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(EMPTY_PACK);
  const [saving, setSaving] = useState(false);
  const [bundleDraft, setBundleDraft] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const navigate = useNavigate();

  const card = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const input = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDarkMode
      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900'
  }`;
  const label = `block text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [packRes, bundleRes] = await Promise.all([
        axios.get('/scrib/admin/packs/'),
        axios.get('/scrib/admin/bundles/'),
      ]);
      setPacks(packRes.data.results || []);
      const first = (bundleRes.data.results || [])[0] || null;
      setBundle(first);
      setBundleDraft(
        first
          ? { ...first, price_rupees: first.price_paise / 100 }
          : { name: 'All Interview Packs', price_rupees: 399, pack_ids: [], is_active: true },
      );
    } catch (error) {
      toast.error('Could not load interview packs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    axios
      .get('/scrib/admin/packs/analytics/')
      .then((res) => alive && setAnalytics(res.data))
      .catch(() => {
        // Non-critical — the pack table above still works without this.
      })
      .finally(() => alive && setAnalyticsLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const createPack = async (e) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.category.trim()) {
      toast.error('Title and subject are both required');
      return;
    }
    try {
      setSaving(true);
      const res = await axios.post('/scrib/admin/packs/', draft);
      toast.success('Pack created — now upload its PDF');
      setShowCreate(false);
      setDraft(EMPTY_PACK);
      navigate(`/admin-p/interview-prep/${res.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create the pack');
    } finally {
      setSaving(false);
    }
  };

  const saveBundle = async () => {
    const payload = {
      name: bundleDraft.name,
      section: 'interview',
      price_paise: Math.round(Number(bundleDraft.price_rupees) * 100),
      pack_ids: bundleDraft.pack_ids,
      is_active: bundleDraft.is_active,
    };
    try {
      if (bundle?.id) {
        await axios.patch(`/scrib/admin/bundles/${bundle.id}/`, payload);
      } else {
        await axios.post('/scrib/admin/bundles/', payload);
      }
      toast.success('Bundle saved');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save the bundle');
    }
  };

  const toggleBundlePack = (packId) => {
    setBundleDraft((prev) => {
      const ids = prev.pack_ids || [];
      return {
        ...prev,
        pack_ids: ids.includes(packId) ? ids.filter((id) => id !== packId) : [...ids, packId],
      };
    });
  };

  const totalIndividual = packs
    .filter((p) => (bundleDraft?.pack_ids || []).includes(p.id))
    .reduce((sum, p) => sum + p.price_paise, 0) / 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Interview Prep
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Subject packs, their PDFs and their quizzes
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium transition-colors"
        >
          <FaPlus className="mr-2" /> New pack
        </button>
      </div>

      {/* ── Analytics overview ── */}
      {!analyticsLoading && analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Revenue', value: rupees(analytics.overview.revenue_paise), sub: `${analytics.overview.pack_purchases + analytics.overview.bundle_purchases} purchases` },
              { label: 'Buyers', value: analytics.overview.buyers, sub: 'unique users' },
              { label: 'Packs live', value: `${analytics.overview.packs_live} / ${analytics.overview.packs_total}`, sub: 'published' },
              { label: 'Quiz attempts', value: analytics.overview.quiz_attempts, sub: 'all-time' },
              { label: 'Avg score', value: analytics.overview.avg_score_pct != null ? `${analytics.overview.avg_score_pct}%` : '—', sub: 'across attempts' },
            ].map((tile) => (
              <div key={tile.label} className={`rounded-xl border shadow-sm p-4 ${card}`}>
                <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{tile.value}</div>
                <div className={`text-sm font-medium mt-0.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{tile.label}</div>
                <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{tile.sub}</div>
              </div>
            ))}
          </div>

          {analytics.packs.length > 0 && (
            <div className={`rounded-xl border shadow-sm overflow-hidden ${card}`}>
              <div className="flex items-center gap-2 px-4 pt-4">
                <FaChartLine className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Performance by pack
                </h3>
              </div>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`${isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-500'} border-y ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="p-3 font-medium text-xs">Pack</th>
                      <th className="p-3 font-medium text-xs text-center">Purchases</th>
                      <th className="p-3 font-medium text-xs text-right">Revenue</th>
                      <th className="p-3 font-medium text-xs text-center">Quiz attempts</th>
                      <th className="p-3 font-medium text-xs text-center">Avg score</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {analytics.packs.map((row) => (
                      <tr key={row.id}>
                        <td className="p-3">
                          <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {row.title}
                          </span>
                          {!row.is_active && (
                            <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] rounded-full">Hidden</span>
                          )}
                        </td>
                        <td className={`p-3 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.purchases}</td>
                        <td className={`p-3 text-right text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rupees(row.revenue_paise)}</td>
                        <td className={`p-3 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.quiz_attempts}</td>
                        <td className={`p-3 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {row.avg_score_pct != null ? `${row.avg_score_pct}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Packs table ── */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`${
                  isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-500'
                } border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <th className="p-4 font-medium text-sm">Pack</th>
                <th className="p-4 font-medium text-sm text-center">PDF</th>
                <th className="p-4 font-medium text-sm text-center">Pages</th>
                <th className="p-4 font-medium text-sm text-center">Free</th>
                <th className="p-4 font-medium text-sm text-center">Quizzes</th>
                <th className="p-4 font-medium text-sm text-center">Questions</th>
                <th className="p-4 font-medium text-sm text-right">Price</th>
                <th className="p-4 font-medium text-sm text-center">Sold</th>
                <th className="p-4 font-medium text-sm text-center">Live</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading && (
                <tr>
                  <td colSpan="9" className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && packs.length === 0 && (
                <tr>
                  <td colSpan="9" className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No packs yet. Create one, then upload its PDF and add quizzes.
                  </td>
                </tr>
              )}

              {!loading &&
                packs.map((pack) => (
                  <tr
                    key={pack.id}
                    onClick={() => navigate(`/admin-p/interview-prep/${pack.id}`)}
                    className={`cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-4">
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {pack.title}
                      </div>
                      <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {pack.category} · /{pack.slug}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {pack.has_pdf ? (
                        <FaFilePdf className="inline text-green-500" title="PDF uploaded" />
                      ) : (
                        <FaExclamationTriangle className="inline text-amber-500" title="No PDF yet" />
                      )}
                    </td>
                    <td className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {pack.page_count || '—'}
                    </td>
                    <td className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {pack.free_page_count}
                    </td>
                    <td className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {pack.quiz_count}
                    </td>
                    <td className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {pack.question_count}
                    </td>
                    <td className={`p-4 text-right text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ₹{pack.price_paise / 100}
                    </td>
                    <td className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {pack.purchase_count}
                    </td>
                    <td className="p-4 text-center">
                      {pack.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Live</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">Hidden</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bundle ── */}
      {bundleDraft && (
        <div className={`rounded-xl border shadow-sm p-6 ${card}`}>
          <div className="flex items-center gap-2 mb-1">
            <FaLayerGroup className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Bundle offer
            </h3>
          </div>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Buying this unlocks every pack ticked below — including packs you tick later.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={label}>Name</label>
              <input
                className={input}
                value={bundleDraft.name}
                onChange={(e) => setBundleDraft({ ...bundleDraft, name: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Price (₹)</label>
              <input
                type="number"
                min="0"
                className={input}
                value={bundleDraft.price_rupees}
                onChange={(e) => setBundleDraft({ ...bundleDraft, price_rupees: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <label className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={bundleDraft.is_active}
                  onChange={(e) => setBundleDraft({ ...bundleDraft, is_active: e.target.checked })}
                />
                Show on the site
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className={label}>Packs in this bundle</label>
            <div className="flex flex-wrap gap-2">
              {packs.map((pack) => {
                const on = (bundleDraft.pack_ids || []).includes(pack.id);
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => toggleBundlePack(pack.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      on
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-900 border-gray-700 text-gray-300'
                          : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {pack.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Bought separately: <b>₹{totalIndividual}</b> · bundle saves{' '}
              <b>₹{Math.max(totalIndividual - Number(bundleDraft.price_rupees || 0), 0)}</b>
            </p>
            <button
              onClick={saveBundle}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Save bundle
            </button>
          </div>
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={createPack}
            className={`w-full max-w-lg rounded-xl border shadow-xl p-6 max-h-[90vh] overflow-y-auto ${card}`}
          >
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              New interview pack
            </h3>

            <div className="space-y-4">
              <div>
                <label className={label}>Title</label>
                <input
                  className={input}
                  placeholder="OS — Interview Notes"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div>
                <label className={label}>Subject</label>
                <input
                  className={input}
                  placeholder="Operating Systems"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                />
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea
                  className={input}
                  rows="2"
                  placeholder="What this pack covers"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={input}
                    value={draft.price_paise / 100}
                    onChange={(e) =>
                      setDraft({ ...draft, price_paise: Math.round(Number(e.target.value) * 100) })
                    }
                  />
                </div>
                <div>
                  <label className={label}>Free pages</label>
                  <input
                    type="number"
                    min="1"
                    className={input}
                    value={draft.free_page_count}
                    onChange={(e) => setDraft({ ...draft, free_page_count: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={label}>Card colour</label>
                  <select
                    className={input}
                    value={draft.theme}
                    onChange={(e) => setDraft({ ...draft, theme: e.target.value })}
                  >
                    {THEMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                  isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
              >
                {saving ? 'Creating…' : 'Create pack'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PackList;
