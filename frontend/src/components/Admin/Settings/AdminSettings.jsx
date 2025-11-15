import React, { useEffect, useState } from 'react';
import { FaLock, FaTimes, FaUserShield } from 'react-icons/fa';
import universalToast from '../../../utils/universalToast';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../../services/authService';

const AdminSettings = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await authService.fetchAdminUsers({ page_size: 200, status: 'all' });
        const list = Array.isArray(data.results) ? data.results.filter(u => u.is_superuser) : [];
        // Keep admins sorted alphabetically by email for readability
        list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
        setAdmins(list);
      } catch (e) {
        console.error('Failed to load admins', e);
        setError(e.message || 'Failed to load admins');
      } finally {
        setLoading(false);
      }
    };
    loadAdmins();
  }, []);

  const openPasswordModal = (admin) => {
    setSelectedAdmin(admin);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedAdmin(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
  universalToast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
  universalToast.error('Passwords do not match');
      return;
    }
    if (!selectedAdmin) {
  universalToast.error('No admin selected');
      return;
    }
    try {
      await authService.adminSetUserPassword(selectedAdmin.id, newPassword);
  universalToast.success('Password updated successfully');
      closePasswordModal();
    } catch (err) {
  universalToast.error(err.message || 'Failed to update password');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Admin Settings</h1>
          <p className="text-sm text-gray-500">Manage your account security and preferences</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Admin Accounts Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FaUserShield className="mr-2 text-blue-600" />
              Admin Accounts
            </h2>
            <p className="text-sm text-gray-500">Below are all superuser accounts. Use the button on each row to initiate a password change.</p>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                      <tr>
                        <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-500">Loading admins…</td>
                      </tr>
                    )}
                    {!loading && admins.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-500">{error || 'No admin accounts found'}</td>
                      </tr>
                    )}
                    {!loading && admins.map((a) => (
                      <tr key={a.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.name || a.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{a.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => openPasswordModal(a)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                          >
                            <FaLock />
                            Change Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Change Password</h3>
                <button 
                  onClick={closePasswordModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="mb-3 text-sm text-gray-600">
                {selectedAdmin ? (
                  <span>Updating password for <span className="font-semibold text-gray-900">{selectedAdmin.email}</span></span>
                ) : (
                  <span>Select an admin from the list to change password.</span>
                )}
              </div>
              <form onSubmit={submitPasswordChange}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      className="w-1/2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      onClick={closePasswordModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSettings;