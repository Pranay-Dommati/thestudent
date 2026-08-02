import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaCheck, FaCopy, FaInstagram, FaEnvelope, FaPhone } from 'react-icons/fa';

const InfluencerDetails = ({ isDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mark as paid state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [payFormData, setPayFormData] = useState({ transaction_reference: '', notes: '' });

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
    if (!payFormData.transaction_reference) {
      toast.error('Transaction reference is required');
      return;
    }
    
    try {
      await axios.post(`/scrib/admin/influencers/commissions/${selectedCommission.id}/pay/`, payFormData);
      toast.success('Commission marked as paid');
      setIsPayModalOpen(false);
      fetchData(); // refresh data
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark as paid');
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

  const domain = window.location.hostname.includes('easylearnova.com') 
    ? 'https://scrib.easylearnova.com' 
    : window.location.origin.replace('5173', '5174');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/admin-p/scrib/influencers')}
          className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
        >
          <FaArrowLeft />
        </button>
        <div>
          <h2 className={`text-2xl font-bold flex items-center space-x-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            <span>{data.name}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              data.status === 'active' ? 'bg-green-100 text-green-800' :
              data.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {data.status.toUpperCase()}
            </span>
          </h2>
          <div className={`mt-1 text-sm flex space-x-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {data.email && <span className="flex items-center"><FaEnvelope className="mr-1" /> {data.email}</span>}
            {data.instagram_username && <span className="flex items-center"><FaInstagram className="mr-1" /> {data.instagram_username}</span>}
            {data.phone && <span className="flex items-center"><FaPhone className="mr-1" /> {data.phone}</span>}
          </div>
        </div>
      </div>

      {/* Action Links */}
      <div className={`p-4 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div>
          <label className={`block text-xs font-semibold uppercase mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Public Referral Link</label>
          <div className="flex items-center space-x-2">
            <code className={`px-2 py-1 rounded flex-1 text-sm ${isDarkMode ? 'bg-gray-900 text-blue-400' : 'bg-gray-100 text-blue-600'}`}>
              {domain}/invite/{data.referral_code}
            </code>
            <button onClick={() => handleCopy(`${domain}/invite/${data.referral_code}`)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
              <FaCopy />
            </button>
          </div>
        </div>
        <div>
          <label className={`block text-xs font-semibold uppercase mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dashboard Access Link (Private)</label>
          <div className="flex items-center space-x-2">
            <code className={`px-2 py-1 rounded flex-1 text-sm truncate ${isDarkMode ? 'bg-gray-900 text-pink-400' : 'bg-gray-100 text-pink-600'}`}>
              {domain}/scrib/influencer/{data.dashboard_token}
            </code>
            <button onClick={() => handleCopy(`${domain}/scrib/influencer/${data.dashboard_token}`)} className="p-2 text-gray-400 hover:text-pink-500 transition-colors">
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
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-sm text-left">
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
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-sm text-left">
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
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Confirm Payment
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
    </div>
  );
};

export default InfluencerDetails;
