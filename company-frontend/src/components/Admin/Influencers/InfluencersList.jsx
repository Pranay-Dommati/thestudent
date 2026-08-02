import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-hot-toast';
import { FaPlus, FaCopy, FaCheck } from 'react-icons/fa';
import CreateInfluencerModal from './CreateInfluencerModal';

const InfluencersList = ({ isDarkMode }) => {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
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
          <table className="w-full text-left border-collapse">
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
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  </td>
                </tr>
              ) : influencers.length === 0 ? (
                <tr>
                  <td colSpan="8" className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{inf.referral_code}</div>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
