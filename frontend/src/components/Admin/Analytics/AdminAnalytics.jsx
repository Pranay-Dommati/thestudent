import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaGraduationCap, FaBook } from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, subDays } from 'date-fns';

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const stats = {
    totalStudents: '1,234',
    completions: '856',
    activeCourses: '45',
    revenue: '₹2.3L'
  };

  // Generate dates for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return {
      name: format(date, 'EEE'),
      enrollments: Math.floor(Math.random() * 50) + 30,
      activity: Math.floor(Math.random() * 100) + 50
    };
  }).reverse();

  const revenueData = [
    { name: 'Jan', revenue: 120000 },
    { name: 'Feb', revenue: 190000 },
    { name: 'Mar', revenue: 150000 },
    { name: 'Apr', revenue: 250000 },
    { name: 'May', revenue: 220000 },
    { name: 'Jun', revenue: 300000 },
  ];

  const courseDistribution = [
    { name: 'Physics', value: 30, color: '#ff6b6b' },
    { name: 'Chemistry', value: 25, color: '#4ecdc4' },
    { name: 'Mathematics', value: 25, color: '#45b7d1' },
    { name: 'Biology', value: 20, color: '#96ceb4' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatRevenue = (value) => `₹${(value / 1000).toFixed(1)}K`;

  return (
    <div className="space-y-6 p-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your platform's performance</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="p-2 border rounded-lg bg-white shadow-sm"
        >
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
          <option value="year">Last 12 months</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={FaUsers}
          label="Total Students"
          value={stats.totalStudents}
          trend="+12%"
          color="blue"
        />
        <MetricCard
          icon={FaGraduationCap}
          label="Course Completions"
          value={stats.completions}
          trend="+5%"
          color="green"
        />
        <MetricCard
          icon={FaBook}
          label="Active Courses"
          value={stats.activeCourses}
          trend="+8%"
          color="purple"
        />
        <MetricCard
          icon={FaChartLine}
          label="Revenue"
          value={stats.revenue}
          trend="+15%"
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4">Enrollment Trends</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#4ecdc4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4">Revenue Analysis</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatRevenue} />
                <Tooltip formatter={formatRevenue} />
                <Bar dataKey="revenue" fill="#45b7d1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Student Activity</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="activity"
                  stroke="#ff6b6b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4">Course Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={courseDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {courseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${color}-500`}>
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className={`text-xs text-${color}-600 mt-1`}>{trend}</p>
      </div>
    </div>
  </div>
);

export default AdminAnalytics;