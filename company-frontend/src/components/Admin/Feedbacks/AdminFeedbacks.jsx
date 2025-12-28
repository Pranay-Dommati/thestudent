import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaCommentDots, FaUser, FaCalendarAlt, FaEye, FaTrash } from 'react-icons/fa';
import api from '../../../utils/axios';

const AdminFeedbacks = ({ isDarkMode }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/feedback/');
      if (data) {
        // Ensure data is an array
        setFeedbacks(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch feedbacks');
        setFeedbacks([]);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setError('Network error occurred');
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      await api.delete(`/feedback/${id}/`);
      
      if (true) {
        setFeedbacks(prev => prev.filter(feedback => feedback.id !== id));
        setShowModal(false);
      } else {
        alert('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Network error occurred');
    }
  };

  // Ensure feedbacks is always an array before filtering
  const filteredFeedbacks = Array.isArray(feedbacks) ? feedbacks.filter(feedback =>
    feedback.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.message?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const truncateMessage = (message, length = 100) => {
    return message.length > length ? message.substring(0, length) + '...' : message;
  };

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
            User Feedbacks
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view user feedback submissions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            {filteredFeedbacks.length} feedback{filteredFeedbacks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or message..."
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

      {/* Feedbacks List */}
      {filteredFeedbacks.length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaCommentDots className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No feedbacks found</h3>
          <p>No feedback submissions match your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className={`p-6 border rounded-lg hover:shadow-md transition-shadow ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FaUser className="mr-2 text-blue-600" />
                    <h3 className="text-lg font-semibold">{feedback.name}</h3>
                  </div>
                  
                  <div className="flex items-center mb-3 text-sm text-gray-500">
                    <FaCalendarAlt className="mr-2" />
                    <span>{formatDate(feedback.submitted_at)}</span>
                  </div>
                  
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {truncateMessage(feedback.message)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                  <button
                    onClick={() => {
                      setSelectedFeedback(feedback);
                      setShowModal(true);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <FaEye className="mr-1" />
                    View
                  </button>
                  
                  <button
                    onClick={() => deleteFeedback(feedback.id)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  >
                    <FaTrash className="mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing full feedback */}
      {showModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Feedback Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className={`text-gray-400 hover:text-gray-600 transition-colors ${
                    isDarkMode ? 'hover:text-gray-300' : ''
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name:</label>
                  <p className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {selectedFeedback.name}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Submitted:</label>
                  <p className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {formatDate(selectedFeedback.submitted_at)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Message:</label>
                  <div className={`p-4 rounded-lg min-h-[120px] ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="whitespace-pre-wrap">{selectedFeedback.message}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
                <button
                  onClick={() => deleteFeedback(selectedFeedback.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbacks;
