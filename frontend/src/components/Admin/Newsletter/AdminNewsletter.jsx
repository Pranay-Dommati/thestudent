import React, { useState, useEffect } from 'react';
import { FaSearch, FaEnvelope, FaCalendarAlt, FaUsers, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const AdminNewsletter = ({ isDarkMode }) => {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/newsletter/');
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        setNewsletters(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch newsletter subscriptions');
        setNewsletters([]);
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      setError('Network error occurred');
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteNewsletter = async (id) => {
    if (!window.confirm('Are you sure you want to delete this newsletter subscription?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/newsletter/${id}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNewsletters(prev => prev.filter(newsletter => newsletter.id !== id));
      } else {
        alert('Failed to delete newsletter subscription');
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      alert('Network error occurred');
    }
  };

  const toggleNewsletterStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/api/newsletter/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });
      
      if (response.ok) {
        setNewsletters(prev => prev.map(newsletter => 
          newsletter.id === id 
            ? { ...newsletter, is_active: !currentStatus }
            : newsletter
        ));
      } else {
        alert('Failed to update newsletter status');
      }
    } catch (error) {
      console.error('Error updating newsletter status:', error);
      alert('Network error occurred');
    }
  };

  // Ensure newsletters is always an array before filtering
  const filteredNewsletters = Array.isArray(newsletters) ? newsletters.filter(newsletter =>
    newsletter.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activeSubscribers = filteredNewsletters.filter(n => n.is_active).length;
  const inactiveSubscribers = filteredNewsletters.filter(n => !n.is_active).length;

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'} rounded-lg shadow-sm`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'} rounded-lg shadow-sm`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Newsletter Subscribers
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage newsletter subscriptions and subscriber list
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
          }`}>
            {activeSubscribers} Active
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            {inactiveSubscribers} Inactive
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center">
            <FaUsers className="text-blue-600 text-2xl mr-3" />
            <div>
              <p className="text-2xl font-bold">{filteredNewsletters.length}</p>
              <p className="text-sm text-gray-500">Total Subscribers</p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center">
            <FaToggleOn className="text-green-600 text-2xl mr-3" />
            <div>
              <p className="text-2xl font-bold">{activeSubscribers}</p>
              <p className="text-sm text-gray-500">Active Subscriptions</p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center">
            <FaEnvelope className="text-purple-600 text-2xl mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {newsletters.filter(n => {
                  const date = new Date(n.subscribed_at);
                  const today = new Date();
                  return date.toDateString() === today.toDateString();
                }).length}
              </p>
              <p className="text-sm text-gray-500">Today's Signups</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Newsletter List */}
      {filteredNewsletters.length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaEnvelope className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No subscribers found</h3>
          <p>No newsletter subscriptions match your search criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <thead>
              <tr className={`border-b ${
                isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
              }`}>
                <th className="text-left p-4 font-semibold">Email</th>
                <th className="text-left p-4 font-semibold">Subscribed Date</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNewsletters.map((newsletter) => (
                <tr
                  key={newsletter.id}
                  className={`border-b hover:bg-opacity-50 transition-colors ${
                    isDarkMode 
                      ? 'border-gray-700 hover:bg-gray-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center">
                      <FaEnvelope className="mr-2 text-blue-600" />
                      <span className="font-medium">{newsletter.email}</span>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <FaCalendarAlt className="mr-2" />
                      <span>{formatDate(newsletter.subscribed_at)}</span>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      newsletter.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {newsletter.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleNewsletterStatus(newsletter.id, newsletter.is_active)}
                        className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          newsletter.is_active
                            ? 'text-orange-600 bg-orange-100 hover:bg-orange-200'
                            : 'text-green-600 bg-green-100 hover:bg-green-200'
                        }`}
                        title={newsletter.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {newsletter.is_active ? <FaToggleOff className="mr-1" /> : <FaToggleOn className="mr-1" />}
                        {newsletter.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => deleteNewsletter(newsletter.id)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
                      >
                        <FaTrash className="mr-1" />
                        Delete
                      </button>
                    </div>
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

export default AdminNewsletter;
