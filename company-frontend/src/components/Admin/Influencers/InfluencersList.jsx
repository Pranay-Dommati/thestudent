import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-hot-toast';
import { FaPlus, FaCopy, FaCheck, FaTrash } from 'react-icons/fa';
import CreateInfluencerModal from './CreateInfluencerModal';

const InfluencersList = ({ isDarkMode }) => {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchInfluencers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/scrib/admin/influencers/');
      setInfluencers(res.data);
    } catch (error) {
      toast.error('Failed to load influencers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const openDelete = (e, inf) => {
    e.stopPropagation();
    setDeleteTarget(inf);
    setDeleteConfirmText('');
  };

  const handleDelete = async ({ force = false } = {}) => {
    if (!deleteTarget || deleteSubmitting) return;
    try {
      setDeleteSubmitting(true);
      await axios.delete(`/scrib/admin/influencers/${deleteTarget.id}/${force ? '?force=true' : ''}`);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      fetchInfluencers();
    } catch (error) {
      const resp = error.response?.data;
      if (error.response?.status === 409 && resp?.requires_force) {
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>;
      case 'paused':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Paused</span>;
      case 'disabled':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Disabled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Influencers
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage referral partners and commissions
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium transition-colors"
        >
          <FaPlus className="mr-2" /> Add Influencer
        </button>
      </div>

      <div className={`rounded-xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left border-collapse">
            <thead>
              <tr className={`${isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-500'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className="p-4 font-medium text-sm">Influencer</th>
                <th className="p-4 font-medium text-sm text-center">Clicks</th>
                <th className="p-4 font-medium text-sm text-center">Registered</th>
                <th className="p-4 font-medium text-sm text-center">Paid Users</th>
                <th className="p-4 font-medium text-sm text-right">Revenue</th>
                <th className="p-4 font-medium text-sm text-right">Pending</th>
                <th className="p-4 font-medium text-sm text-right">Paid</th>
                <th className="p-4 font-medium text-sm text-center">Status</th>
                <th className="p-4 font-medium text-sm text-center"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  </td>
                </tr>
              ) : influencers.length === 0 ? (
                <tr>
                  <td colSpan="9" className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No influencers found. Add one to get started!
                  </td>
                </tr>
              ) : (
                influencers.map((inf) => (
                  <tr 
                    key={inf.id} 
                    onClick={() => navigate(`/admin-p/scrib/influencers/${inf.id}`)}
                    className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="p-4">
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{inf.name}</div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        @{inf.referral_code}
                        {inf.commission_rate != null && <span className="ml-2">· {inf.commission_rate}%</span>}
                        {inf.commission_eligible_payments != null && (
                          <span className="ml-1">
                            {inf.commission_eligible_payments === 0
                              ? '· disabled'
                              : `× ${inf.commission_eligible_payments} pmt${inf.commission_eligible_payments === 1 ? '' : 's'}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{inf.clicks}</td>
                    <td className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{inf.registered_users}</td>
                    <td className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{inf.paid_users}</td>
                    <td className={`p-4 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>₹{inf.revenue_generated}</td>
                    <td className={`p-4 text-right text-sm font-medium ${inf.pending_commission > 0 ? 'text-yellow-600' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                      ₹{inf.pending_commission}
                    </td>
                    <td className={`p-4 text-right text-sm font-medium ${inf.paid_commission > 0 ? 'text-green-600' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                      ₹{inf.paid_commission}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(inf.status)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => openDelete(e, inf)}
                        title="Delete influencer"
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
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
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !deleteSubmitting && setDeleteTarget(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium mb-2 text-red-600 dark:text-red-400">Delete influencer</h3>
                <p className="text-sm mb-3">
                  Permanently delete <strong>{deleteTarget.name}</strong> (@{deleteTarget.referral_code}) and all of their
                  clicks, referrals and commission history. Referred users are kept but no longer attributed. This cannot be undone.
                </p>
                {(deleteTarget.paid_commission > 0 || deleteTarget.pending_commission > 0) && (
                  <p className="text-sm mb-3 text-red-500 font-medium">
                    Warning: this influencer has ₹{deleteTarget.pending_commission} pending and ₹{deleteTarget.paid_commission} paid commission on record.
                  </p>
                )}
                <label className="block text-sm font-medium mb-1">Type <span className="font-mono">{deleteTarget.referral_code}</span> to confirm</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  autoFocus
                  className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder={deleteTarget.referral_code}
                />
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={deleteSubmitting || deleteConfirmText.trim() !== deleteTarget.referral_code}
                    onClick={() => handleDelete()}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${(deleteSubmitting || deleteConfirmText.trim() !== deleteTarget.referral_code) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {deleteSubmitting ? 'Deleting…' : 'Delete permanently'}
                  </button>
                  <button
                    type="button"
                    disabled={deleteSubmitting}
                    onClick={() => setDeleteTarget(null)}
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

      {isModalOpen && (
        <CreateInfluencerModal
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchInfluencers}
          isDarkMode={isDarkMode} 
        />
      )}
    </div>
  );
};

export default InfluencersList;
