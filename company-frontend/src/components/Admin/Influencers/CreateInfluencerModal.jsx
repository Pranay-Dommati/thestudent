import React, { useState } from 'react';
import axios from '../../../utils/axios';
import { toast } from 'react-hot-toast';
import { FaTimes, FaCopy } from 'react-icons/fa';
import { getScribOrigin } from '../../../utils/scribOrigin';

const CreateInfluencerModal = ({ isOpen, onClose, onSuccess, isDarkMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    referral_code: '',
    email: '',
    phone: '',
    instagram_username: '',
    commission_rate: '10',
    commission_eligible_payments: '2',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'referral_code') {
      // Keep it URL-safe: lowercase, only a-z 0-9 _ -
      value = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.referral_code) {
      toast.error('Name and Referral Code are required');
      return;
    }

    if (formData.referral_code.length < 3) {
      toast.error('Referral code must be at least 3 characters');
      return;
    }

    const rate = parseFloat(formData.commission_rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }

    const eligiblePayments = parseInt(formData.commission_eligible_payments, 10);
    if (isNaN(eligiblePayments) || eligiblePayments < 0 || eligiblePayments > 50) {
      toast.error('Eligible payments must be a whole number between 0 and 50');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/scrib/admin/influencers/', {
        ...formData,
        commission_rate: rate,
        commission_eligible_payments: eligiblePayments,
      });
      setSuccessData(res.data);
      onSuccess();
      toast.success('Influencer created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create influencer');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const domain = getScribOrigin();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-medium leading-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} id="modal-title">
              {successData ? 'Influencer Created' : 'Add New Influencer'}
            </h3>
            <button
              onClick={onClose}
              className={`rounded-md text-gray-400 hover:text-gray-500 focus:outline-none`}
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          {!successData ? (
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Referral Code *</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className={`inline-flex items-center px-3 rounded-l-md border border-r-0 sm:text-sm ${isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-500'}`}>
                      /invite/
                    </span>
                    <input
                      type="text"
                      name="referral_code"
                      value={formData.referral_code}
                      onChange={handleChange}
                      className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                      placeholder="e.g. rycreation"
                      required
                    />
                  </div>
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Used for signup tracking. Should be short and memorable.</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Commission Rate *</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      name="commission_rate"
                      value={formData.commission_rate}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.5"
                      className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                      required
                    />
                    <span className={`inline-flex items-center px-3 rounded-r-md border border-l-0 sm:text-sm ${isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-500'}`}>
                      % per payment
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Percent paid on each qualifying payment. Default 10%.</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Commission-Eligible Payments *</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      name="commission_eligible_payments"
                      value={formData.commission_eligible_payments}
                      onChange={handleChange}
                      min="0"
                      max="50"
                      step="1"
                      className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                      required
                    />
                    <span className={`inline-flex items-center px-3 rounded-r-md border border-l-0 sm:text-sm ${isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-500'}`}>
                      payments per user
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>How many of each referred user's payments earn commission, counted from their first. e.g. 2 = only their 1st and 2nd payments. 0 disables commissions.</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Instagram Username</label>
                  <input
                    type="text"
                    name="instagram_username"
                    value={formData.instagram_username}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                    placeholder="@username"
                  />
                </div>
              </div>

              <div className={`px-6 py-4 flex justify-end space-x-3 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`bg-white py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Creating...' : 'Create Influencer'}
                </button>
              </div>
            </form>
          ) : (
            <div className="px-6 py-4 space-y-6">
              <div className={`p-4 rounded-md ${isDarkMode ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>Success!</h4>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-green-300/80' : 'text-green-700'}`}>
                  The influencer has been created. Copy these links and send them to the influencer.
                  Both links are always available again from this influencer's detail page.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Public Referral Link</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={`${domain}/invite/${successData.referral_code}`}
                    className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md sm:text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(`${domain}/invite/${successData.referral_code}`)}
                    className={`inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}
                  >
                    <FaCopy className="mr-2" /> Copy
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Private Dashboard Link</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={`${domain}/influencer/${successData.dashboard_token}`}
                    className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md sm:text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(`${domain}/influencer/${successData.dashboard_token}`)}
                    className={`inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}
                  >
                    <FaCopy className="mr-2" /> Copy
                  </button>
                </div>
                <p className={`mt-1 text-xs text-red-500`}>Warning: Dashboard Link acts as a password. Do not share publicly.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInfluencerModal;
