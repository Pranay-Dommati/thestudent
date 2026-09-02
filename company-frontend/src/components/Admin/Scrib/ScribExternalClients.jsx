import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTrash, FaBuilding, FaCheck } from 'react-icons/fa';
import authService from '../../../services/authService';

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const ScribExternalClients = ({ isDarkMode = false }) => {
  const [entries, setEntries] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(todayStr());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [deletingId, setDeletingId] = useState(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.makeAuthenticatedRequest('/scrib/admin/external-client-payments/');
      setEntries(res.data?.results || []);
      setTotalAmount(res.data?.total_amount || 0);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load external client payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const resetForm = () => {
    setName(''); setEmail(''); setDate(todayStr()); setAmount(''); setNotes(''); setFormError('');
  };

  const handleAdd = async () => {
    setFormError('');
    if (!name.trim()) { setFormError('Name is required.'); return; }
    if (!date) { setFormError('Date is required.'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setFormError('Enter a valid amount greater than 0.'); return; }

    setSubmitting(true);
    try {
      await authService.makeAuthenticatedRequest('/scrib/admin/external-client-payments/', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), date, amount: amt, notes: notes.trim() }),
      });
      resetForm();
      setShowForm(false);
      fetchEntries();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await authService.makeAuthenticatedRequest(`/scrib/admin/external-client-payments/${id}/`, { method: 'DELETE' });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotalAmount((prev) => prev - Number(entries.find((e) => e.id === id)?.amount || 0));
    } catch {
      setError('Failed to delete entry. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`;
  const labelCls = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FaBuilding className="h-5 w-5 text-indigo-600" />
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              External Clients
            </h1>
          </div>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manually log revenue from clients who reached out directly and paid outside the app, so it's tracked alongside everything else.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="h-3.5 w-3.5" /> {showForm ? 'Cancel' : 'Add Client Payment'}
        </button>
      </div>

      {/* Stats */}
      <div className={`p-4 rounded-xl shadow-sm border w-fit ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="text-2xl font-bold text-green-600">₹{Number(totalAmount).toLocaleString('en-IN')}</div>
        <div className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Total external revenue · {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className={`rounded-xl shadow-md p-6 max-w-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {formError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Client / company name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email (optional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Amount (₹)</label>
                <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes (optional)</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" className={inputCls} />
            </div>
            <button
              onClick={handleAdd}
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Saving…</>
              ) : (<><FaCheck className="h-3.5 w-3.5" /> Save Entry</>)}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`rounded-xl shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {['Name', 'Email', 'Date', 'Amount', 'Notes', ''].map((h) => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-100 bg-white'}`}>
              {loading ? (
                <tr><td colSpan={6} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-red-500">{error}</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={6} className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No external client payments logged yet.</td></tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{e.name}</td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{e.email || '—'}</td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{Number(e.amount).toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{e.notes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        title="Delete entry"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && !error && (
          <div className={`px-4 py-2 text-xs border-t ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-400'}`}>
            {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScribExternalClients;
