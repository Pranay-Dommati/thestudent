import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaCheck, FaCopy, FaInstagram, FaEnvelope, FaPhone, FaTrash } from 'react-icons/fa';
import { getScribOrigin } from '../../../utils/scribOrigin';

const InfluencerDetails = ({ isDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mark as paid state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [payFormData, setPayFormData] = useState({ transaction_reference: '', notes: '' });
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Edit influencer state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', instagram_username: '', commission_rate: '10', commission_eligible_payments: '2', status: 'active' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete influencer state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/scrib/admin/influencers/${id}/`);
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load influencer details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleOpenPayModal = (commission) => {
    setSelectedCommission(commission);
    setPayFormData({ transaction_reference: '', notes: '' });
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payFormData.transaction_reference.trim()) {
      toast.error('Transaction reference is required');
      return;
    }
    if (paySubmitting) return;

    try {
      setPaySubmitting(true);
      await axios.post(`/scrib/admin/influencers/commissions/${selectedCommission.id}/pay/`, payFormData);
      toast.success('Commission marked as paid');
      setIsPayModalOpen(false);
      fetchData(); // refresh data
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark as paid');
    } finally {
      setPaySubmitting(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: data.name || '',
      email: data.email || '',
      instagram_username: data.instagram_username || '',
      commission_rate: String(data.commission_rate ?? '10'),
      commission_eligible_payments: String(data.commission_eligible_payments ?? '2'),
      status: data.status || 'active',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    const rate = parseFloat(editForm.commission_rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }
    const eligiblePayments = parseInt(editForm.commission_eligible_payments, 10);
    if (isNaN(eligiblePayments) || eligiblePayments < 0 || eligiblePayments > 50) {
      toast.error('Eligible payments must be a whole number between 0 and 50');
      return;
    }
    if (editSubmitting) return;

    try {
      setEditSubmitting(true);
      await axios.patch(`/scrib/admin/influencers/${id}/`, {
        ...editForm,
        commission_rate: rate,
        commission_eligible_payments: eligiblePayments,
      });
      toast.success('Influencer updated');
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update influencer');
    } finally {
      setEditSubmitting(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmText('');
    setIsDeleteOpen(true);
  };

  const handleDelete = async ({ force = false } = {}) => {
    if (deleteSubmitting) return;
    try {
      setDeleteSubmitting(true);
      const res = await axios.delete(`/scrib/admin/influencers/${id}/${force ? '?force=true' : ''}`);
      toast.success(`Deleted "${res.data?.deleted || data.name}"`);
      setIsDeleteOpen(false);
      navigate('/admin-p/scrib/influencers');
    } catch (error) {
      const resp = error.response?.data;
      if (error.response?.status === 409 && resp?.requires_force) {
        // Ask for explicit confirmation of payout-history loss
        if (window.confirm(`${resp.error}\n\nPermanently delete anyway?`)) {
          return handleDelete({ force: true });
        }
      } else {
        toast.error(resp?.error || 'Failed to delete influencer');
      }
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return <div className="text-center p-8 text-red-500">Influencer not found</div>;

  const domain = getScribOrigin();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/admin-p/scrib/influencers')}
          className={`mt-1 p-2 rounded-full transition-colors shrink-0 ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
        >
          <FaArrowLeft />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className={`text-xl sm:text-2xl font-bold break-words ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {data.name}
            </h2>
            <span className={`px-2 py-1 text-xs rounded-full ${
              data.status === 'active' ? 'bg-green-100 text-green-800' :
              data.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {data.status.toUpperCase()}
            </span>
            <button
              onClick={openEditModal}
              className={`text-xs font-medium border rounded px-2 py-1 transition-colors ${isDarkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
            >
              Edit
            </button>
            <button
              onClick={openDeleteModal}
              className={`flex items-center gap-1 text-xs font-medium border rounded px-2 py-1 transition-colors border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-900/20`}
            >
              <FaTrash className="h-3 w-3" /> Delete
            </button>
          </div>
          <div className={`mt-1.5 text-sm flex flex-wrap gap-x-4 gap-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {data.email && <span className="flex items-center min-w-0"><FaEnvelope className="mr-1 shrink-0" /> <span className="truncate">{data.email}</span></span>}
            {data.instagram_username && <span className="flex items-center"><FaInstagram className="mr-1 shrink-0" /> {data.instagram_username}</span>}
            {data.phone && <span className="flex items-center"><FaPhone className="mr-1 shrink-0" /> {data.phone}</span>}
            <span className="flex items-center font-medium">
              {data.commission_rate}% commission
              {data.commission_eligible_payments != null && (
                <span className="ml-1 font-normal">
                  {data.commission_eligible_payments === 0
                    ? '· commissions disabled'
                    : `· first ${data.commission_eligible_payments} payment${data.commission_eligible_payments === 1 ? '' : 's'} per user`}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action Links */}
      <div className={`p-4 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div>
          <label className={`block text-xs font-semibold uppercase mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Public Referral Link</label>
          <div className="flex items-center space-x-2">
            <code className={`px-2 py-1 rounded flex-1 min-w-0 text-sm overflow-x-auto whitespace-nowrap ${isDarkMode ? 'bg-gray-900 text-blue-400' : 'bg-gray-100 text-blue-600'}`}>
              {domain}/invite/{data.referral_code}
            </code>
            <button onClick={() => handleCopy(`${domain}/invite/${data.referral_code}`)} className="p-2 shrink-0 text-gray-400 hover:text-blue-500 transition-colors">
              <FaCopy />
            </button>
          </div>
        </div>
        <div>
          <label className={`block text-xs font-semibold uppercase mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dashboard Access Link (Private)</label>
          <div className="flex items-center space-x-2">
            <code className={`px-2 py-1 rounded flex-1 min-w-0 text-sm overflow-x-auto whitespace-nowrap ${isDarkMode ? 'bg-gray-900 text-pink-400' : 'bg-gray-100 text-pink-600'}`}>
              {domain}/influencer/{data.dashboard_token}
            </code>
            <button onClick={() => handleCopy(`${domain}/influencer/${data.dashboard_token}`)} className="p-2 shrink-0 text-gray-400 hover:text-pink-500 transition-colors">
              <FaCopy />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clicks', value: data.stats.clicks, color: 'blue' },
          { label: 'Registrations', value: data.stats.registered_users, color: 'indigo' },
          { label: 'Paid Users', value: data.stats.paid_users, color: 'purple' },
          { label: 'Revenue Generated', value: `₹${data.stats.revenue_generated}`, color: 'emerald' },
          { label: 'Pending Commission', value: `₹${data.stats.pending_commission}`, color: 'yellow' },
          { label: 'Paid Commission', value: `₹${data.stats.paid_commission}`, color: 'green' },
          { label: 'Total Commission', value: `₹${data.stats.pending_commission + data.stats.paid_commission}`, color: 'teal' },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm`}>
            <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</div>
            <div className={`text-2xl font-bold text-${stat.color}-500 dark:text-${stat.color}-400`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referrals */}
        <div className={`rounded-xl border shadow-sm flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`px-4 py-3 border-b font-semibold flex justify-between items-center ${isDarkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-800'}`}>
            <span>Referred Users</span>
            <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{data.referred_users.length} total</span>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full min-w-[420px] text-sm text-left">
              <thead className={`sticky top-0 bg-opacity-95 backdrop-blur ${isDarkMode ? 'bg-gray-800 text-gray-400 border-b border-gray-700' : 'bg-white text-gray-500 border-b border-gray-200'}`}>
                <tr>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium text-center">Payments</th>
                  <th className="px-4 py-2 font-medium text-right">Commission</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {data.referred_users.length === 0 ? (
                  <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-500">No users referred yet</td></tr>
                ) : (
                  data.referred_users.map((ref, idx) => (
                    <tr key={idx} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{ref.user_name}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{ref.user_email}</div>
                      </td>
                      <td className={`px-4 py-3 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{ref.payments_count}</td>
                      <td className={`px-4 py-3 text-right font-medium ${ref.commission > 0 ? 'text-green-500' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>
                        ₹{ref.commission}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commissions */}
        <div className={`rounded-xl border shadow-sm flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`px-4 py-3 border-b font-semibold flex justify-between items-center ${isDarkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-800'}`}>
            <span>Commission History</span>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full min-w-[560px] text-sm text-left">
              <thead className={`sticky top-0 bg-opacity-95 backdrop-blur ${isDarkMode ? 'bg-gray-800 text-gray-400 border-b border-gray-700' : 'bg-white text-gray-500 border-b border-gray-200'}`}>
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                  <th className="px-4 py-2 font-medium text-center">Status</th>
                  <th className="px-4 py-2 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {data.commission_history.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No commissions yet</td></tr>
                ) : (
                  data.commission_history.map((comm) => (
                    <tr key={comm.id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                      <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {new Date(comm.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Payment #{comm.payment_number}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{comm.user_name}</div>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        ₹{comm.commission_amount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          comm.status === 'paid' ? 'bg-green-100 text-green-800' :
                          comm.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {comm.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comm.status === 'pending' ? (
                          <button
                            onClick={() => handleOpenPayModal(comm)}
                            className="text-blue-500 hover:text-blue-700 font-medium text-xs border border-blue-500 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                          >
                            Mark Paid
                          </button>
                        ) : comm.status === 'paid' ? (
                          <span className={`text-xs flex justify-center items-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <FaCheck className="mr-1" /> Done
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pay Modal */}
      {isPayModalOpen && selectedCommission && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsPayModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium mb-4">Mark Commission as Paid</h3>
                <div className={`p-3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className="text-sm"><strong>Amount to Pay:</strong> ₹{selectedCommission.commission_amount}</p>
                  <p className="text-sm"><strong>Influencer:</strong> {data.name}</p>
                </div>
                <form onSubmit={handlePaySubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Transaction Reference *</label>
                      <input
                        type="text"
                        required
                        value={payFormData.transaction_reference}
                        onChange={(e) => setPayFormData({...payFormData, transaction_reference: e.target.value})}
                        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        placeholder="e.g. UPI Ref / Bank Txn ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                      <textarea
                        value={payFormData.notes}
                        onChange={(e) => setPayFormData({...payFormData, notes: e.target.value})}
                        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        rows="2"
                        placeholder="Any internal notes"
                      ></textarea>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={paySubmitting}
                      className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${paySubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {paySubmitting ? 'Saving…' : 'Confirm Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPayModalOpen(false)}
                      className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsEditOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium mb-4">Edit Influencer</h3>
                <form onSubmit={handleEditSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Instagram Username</label>
                      <input
                        type="text"
                        value={editForm.instagram_username}
                        onChange={(e) => setEditForm({ ...editForm, instagram_username: e.target.value })}
                        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Commission %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={editForm.commission_rate}
                          onChange={(e) => setEditForm({ ...editForm, commission_rate: e.target.value })}
                          className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Eligible payments</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="1"
                          value={editForm.commission_eligible_payments}
                          onChange={(e) => setEditForm({ ...editForm, commission_eligible_payments: e.target.value })}
                          className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Eligible payments = how many of each referred user's payments earn commission, counted from their first (0 disables). Changes apply to future payments only; commissions already recorded are unaffected.
                      Paused / disabled stops new click tracking and new commissions.
                    </p>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${editSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {editSubmitting ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditOpen(false)}
                      className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => !deleteSubmitting && setIsDeleteOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium mb-2 text-red-600 dark:text-red-400">Delete influencer</h3>
                <p className="text-sm mb-3">
                  Permanently delete <strong>{data.name}</strong> (@{data.referral_code}). This cannot be undone.
                </p>
                <ul className={`text-sm list-disc pl-5 space-y-1 mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>{data.stats.clicks} click record{data.stats.clicks === 1 ? '' : 's'} removed</li>
                  <li>{data.stats.registered_users} referral link{data.stats.registered_users === 1 ? '' : 's'} removed</li>
                  <li>{data.commission_history.length} commission record{data.commission_history.length === 1 ? '' : 's'} removed
                    {(data.stats.paid_commission > 0) && <span className="text-red-500 font-medium"> (includes ₹{data.stats.paid_commission} already marked paid)</span>}
                  </li>
                  <li>Referred users are kept, but no longer attributed to this influencer</li>
                </ul>
                <label className="block text-sm font-medium mb-1">Type <span className="font-mono">{data.referral_code}</span> to confirm</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder={data.referral_code}
                  autoFocus
                />
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={deleteSubmitting || deleteConfirmText.trim() !== data.referral_code}
                    onClick={() => handleDelete()}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${(deleteSubmitting || deleteConfirmText.trim() !== data.referral_code) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {deleteSubmitting ? 'Deleting…' : 'Delete permanently'}
                  </button>
                  <button
                    type="button"
                    disabled={deleteSubmitting}
                    onClick={() => setIsDeleteOpen(false)}
                    className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencerDetails;
