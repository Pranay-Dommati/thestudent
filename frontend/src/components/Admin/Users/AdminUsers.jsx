import React, { useEffect, useState } from 'react';
import { FaSearch, FaFilter, FaEllipsisV, FaUserGraduate } from 'react-icons/fa';
import authService from '../../../services/authService';

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total_users: 0, active_users: 0, new_this_month: 0, inactive_users: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        q: searchQuery,
        status: selectedFilter,
        page: String(currentPage),
        page_size: '10',
      });
  const resp = await authService.makeAuthenticatedRequest(`/auth/users/?${params.toString()}`);
      const data = resp.data || {};
  const results = Array.isArray(data.results) ? data.results : [];
  // Ensure admins show on top even if backend ordering changes
  results.sort((a, b) => (b.is_superuser === true) - (a.is_superuser === true));
  setUsers(results);
      setStats(data.stats || { total_users: 0, active_users: 0, new_this_month: 0, inactive_users: 0 });
    } catch (e) {
      console.error('Fetch users error:', e);
      setError(e.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedFilter, currentPage]);

  const handleUserAction = async (userId, action) => {
    try {
      if (action === 'delete') {
        const confirmed = window.confirm('Are you sure you want to delete this user? This cannot be undone.');
        if (!confirmed) return;
  await authService.makeAuthenticatedRequest(`/auth/users/${userId}/`, { method: 'DELETE' });
        await fetchUsers();
        return;
      }
      if (action === 'edit') {
        const newName = window.prompt('Enter new full name (leave blank to keep):');
        const newEmail = window.prompt('Enter new email (leave blank to keep):');
        const makeAdmin = window.confirm('Make this user admin? Click OK for Yes, Cancel for No.');
        const payload = {};
        if (newName) payload.full_name = newName;
        if (newEmail) payload.email = newEmail;
        payload.is_superuser = makeAdmin;
  const resp = await authService.makeAuthenticatedRequest(`/auth/users/${userId}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        // axios will throw on non-2xx; no manual ok/json checks needed
        await fetchUsers();
        return;
      }
    } catch (e) {
      alert(e.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">User Management</h1>
          <p className="text-sm text-gray-500">View and manage user accounts</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Add New User
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
          <div className="text-sm text-gray-500">Active Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">{stats.new_this_month}</div>
          <div className="text-sm text-gray-500">New This Month</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-red-600">{stats.inactive_users}</div>
          <div className="text-sm text-gray-500">Inactive Users</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="w-full sm:w-40 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled Courses
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td className="px-6 py-6 text-center text-sm text-gray-500" colSpan={5}>Loading users…</td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-sm text-gray-500" colSpan={5}>{error || 'No users found'}</td>
                </tr>
              )}
              {!loading && users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <FaUserGraduate className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <span>{user.name}</span>
                          {user.is_superuser && (
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.enrolledCourses}
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-3">
                      <button
                        onClick={() => handleUserAction(user.id, 'edit')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleUserAction(user.id, 'delete')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <p className="text-sm text-gray-700">
          Showing page {currentPage}
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;