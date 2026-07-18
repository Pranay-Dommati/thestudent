import React, { useEffect, useState } from 'react';
import { FaSearch, FaFilter, FaEllipsisV, FaUserGraduate, FaEnvelope } from 'react-icons/fa';
import authService from '../../../services/authService';

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all|active|inactive
  const [roleFilter, setRoleFilter] = useState('all'); // all|admin|user
  const [joinedFilter, setJoinedFilter] = useState('all'); // all|last7|last30|thismonth
  const [productFilter, setProductFilter] = useState('all'); // all|scrib|courses|codevisualizer
  const [sortBy, setSortBy] = useState('recent'); // recent|oldest|name
  // Additional filter: enrollment count quick filter (client-side)
  const [enrollmentFilter, setEnrollmentFilter] = useState('all'); // all|none|1plus|5plus
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total_users: 0, active_users: 0, active_last_7_days: 0, active_last_30_days: 0, new_this_month: 0, inactive_users: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState('paid_users');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        q: searchQuery,
        status: statusFilter,
        role: roleFilter,
        joined: joinedFilter,
        product: productFilter,
        order: sortBy,
        page: String(currentPage),
        page_size: '10',
      });
      const resp = await authService.makeAuthenticatedRequest(`/auth/users/?${params.toString()}`);
      const data = resp.data || {};
      const results = Array.isArray(data.results) ? data.results : [];
      // Keep the order returned by backend; do not re-sort here
      setUsers(results);
      setStats(data.stats || { total_users: 0, active_users: 0, active_last_7_days: 0, active_last_30_days: 0, new_this_month: 0, inactive_users: 0 });
    } catch (e) {
      console.error('Fetch users error:', e);
      const serverMsg = e?.response?.data?.error;
      setError(serverMsg || e.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, roleFilter, joinedFilter, productFilter, sortBy, currentPage]);

  // Derive client-side filter for enrollment counts (backend may ignore this param)
  const usersToRender = React.useMemo(() => {
    if (!Array.isArray(users) || enrollmentFilter === 'all') return users;
    return users.filter(u => {
      const cnt = Number(u.enrolledCourses || u.enrolled_courses || 0);
      if (enrollmentFilter === 'none') return cnt === 0;
      if (enrollmentFilter === '1plus') return cnt >= 1;
      if (enrollmentFilter === '5plus') return cnt >= 5;
      return true;
    });
  }, [users, enrollmentFilter]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      alert('Please enter both subject and message.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to broadcast this email to all ${broadcastTarget === 'paid_users' ? 'paid' : 'registered'} users using AWS SES?`);
    if (!confirmed) return;

    try {
      setBroadcastSending(true);
      setBroadcastResult(null);
      const resp = await authService.makeAuthenticatedRequest('/auth/users/broadcast/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_group: broadcastTarget,
          subject: broadcastSubject,
          message: broadcastMessage
        })
      });
      const data = resp.data || {};
      setBroadcastResult({
        success: true,
        status: data.status || 'Broadcast campaign started in background via Celery worker.',
        task_id: data.task_id,
        total: data.total_recipients || 0
      });
      setBroadcastSubject('');
      setBroadcastMessage('');
    } catch (err) {
      console.error('Broadcast email error:', err);
      const serverMsg = err?.response?.data?.error || err.message || 'Failed to send broadcast email';
      setBroadcastResult({ success: false, error: serverMsg });
    } finally {
      setBroadcastSending(false);
    }
  };

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
      const serverMsg = e?.response?.data?.error;
      alert(serverMsg || e.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">User Management</h1>
          <p className="text-sm text-gray-500">View and manage user accounts</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => { setShowBroadcastModal(true); setBroadcastResult(null); }}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <FaEnvelope className="text-sm" /> Send Broadcast Email
          </button>
          <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Add New User
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">{stats.total_users || 0}</div>
          <div className="text-sm text-gray-500 font-medium">Total Users</div>
          <div className="text-xs text-gray-400 mt-0.5">Registered accounts</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-emerald-600">{stats.active_last_7_days || 0}</div>
          <div className="text-sm text-gray-500 font-medium">Active (7 Days)</div>
          <div className="text-xs text-gray-400 mt-0.5">Opened in last 7 days</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-purple-600">{stats.active_last_30_days || 0}</div>
          <div className="text-sm text-gray-500 font-medium">Active (30 Days)</div>
          <div className="text-xs text-gray-400 mt-0.5">Opened in last 30 days</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">{stats.active_users || 0}</div>
          <div className="text-sm text-gray-500 font-medium">Enabled Accounts</div>
          <div className="text-xs text-gray-400 mt-0.5">Not disabled</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-yellow-600">{stats.new_this_month || 0}</div>
          <div className="text-sm text-gray-500 font-medium">New This Month</div>
          <div className="text-xs text-gray-400 mt-0.5">Joined this calendar month</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-red-600">{stats.inactive_users || 0}</div>
          <div className="text-sm text-gray-500 font-medium">Disabled Accounts</div>
          <div className="text-xs text-gray-400 mt-0.5">Banned / deactivated</div>
        </div>
      </div>
      
      {/* Ecosystem Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-indigo-600">{stats.scrib_users || 0}</div>
          <div className="text-sm text-gray-500">Scrib Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-teal-600">{stats.courses_users || 0}</div>
          <div className="text-sm text-gray-500">Courses Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-orange-600">{stats.codevisualizer_users || 0}</div>
          <div className="text-sm text-gray-500">Visualizer Users</div>
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
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="w-full sm:w-40 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
          className="w-full sm:w-40 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="user">Non-admins</option>
        </select>

        {/* Joined date filter */}
        <select
          value={joinedFilter}
          onChange={(e) => { setJoinedFilter(e.target.value); setCurrentPage(1); }}
          className="w-full sm:w-44 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Time</option>
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
          <option value="thismonth">This month</option>
        </select>
        
        {/* Product filter */}
        <select
          value={productFilter}
          onChange={(e) => { setProductFilter(e.target.value); setCurrentPage(1); }}
          className="w-full sm:w-44 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Products</option>
          <option value="scrib">Scrib Only</option>
          <option value="courses">Courses Only</option>
          <option value="codevisualizer">Visualizer Only</option>
        </select>

        {/* Enrollment count (client-side) */}
        <select
          value={enrollmentFilter}
          onChange={(e) => { setEnrollmentFilter(e.target.value); setCurrentPage(1); }}
          className="w-full sm:w-44 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Enrollments</option>
          <option value="none">No enrollments</option>
          <option value="1plus">1+ enrollments</option>
          <option value="5plus">5+ enrollments</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
          className="w-full sm:w-44 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="recent">Recently added</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
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
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products Used
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
              {!loading && usersToRender.map((user) => (
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
                    <div className="text-[10px] text-gray-400 mt-0.5">via {user.signup_source || 'main'}</div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <span title="Scrib" className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${user.products?.includes('scrib') ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-300'}`}>S</span>
                      <span title="Courses" className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${user.products?.includes('courses') ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-300'}`}>C</span>
                      <span title="Code Visualizer" className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${user.products?.includes('codevisualizer') ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-300'}`}>V</span>
                    </div>
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

      {/* Broadcast Email Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-fadeIn">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-xl" />
                <div>
                  <h3 className="text-lg font-bold">Send Broadcast Email</h3>
                  <p className="text-xs text-purple-100">Delivered via official AWS SES (info@easylearnova.com)</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-white hover:text-gray-200 text-2xl leading-none font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="p-6 space-y-5">
              {broadcastResult && (
                <div className={`p-4 rounded-xl text-sm ${broadcastResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {broadcastResult.success ? (
                    <div>
                      <p className="font-bold text-base flex items-center gap-1.5">
                        ✅ Background Campaign Started!
                      </p>
                      <p className="mt-1">
                        Queued <strong>{broadcastResult.total}</strong> target recipients for delivery via your background Celery worker at ~12 emails/sec (AWS SES quota safe).
                      </p>
                      {broadcastResult.task_id && (
                        <p className="mt-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded inline-block font-mono">
                          Task ID: {broadcastResult.task_id}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="font-semibold">❌ Error: {broadcastResult.error}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`cursor-pointer border rounded-xl p-3 flex items-start gap-3 transition-all ${broadcastTarget === 'paid_users' ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500/20' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="target_group"
                      value="paid_users"
                      checked={broadcastTarget === 'paid_users'}
                      onChange={() => setBroadcastTarget('paid_users')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-bold text-gray-900 block text-sm">All Paid Users ⭐</span>
                      <span className="text-xs text-gray-500">Users who have completed at least 1 paid purchase</span>
                    </div>
                  </label>

                  <label className={`cursor-pointer border rounded-xl p-3 flex items-start gap-3 transition-all ${broadcastTarget === 'all_users' ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500/20' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="target_group"
                      value="all_users"
                      checked={broadcastTarget === 'all_users'}
                      onChange={() => setBroadcastTarget('all_users')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-bold text-gray-900 block text-sm">All Registered Users</span>
                      <span className="text-xs text-gray-500">Every active account in the ecosystem ({stats.total_users || 'All'})</span>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 italic">Note: Additional segmentation options will be added in future updates.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  placeholder="e.g., Exciting New Features Available on EasyLearnova!"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Message Body
                </label>
                <textarea
                  rows="6"
                  placeholder="Write your email announcement here. Paragraphs and line breaks will be automatically formatted inside our official branded HTML template..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-sans"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Your message will be automatically wrapped in our responsive EasyLearnova header and footer with unsubscribe & support links.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold transition-all shadow-md disabled:opacity-60 flex items-center gap-2"
                >
                  {broadcastSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending via SES...
                    </>
                  ) : (
                    <>
                      <FaEnvelope /> Send Broadcast Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;