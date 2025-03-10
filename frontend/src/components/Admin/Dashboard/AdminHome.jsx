import React from 'react';
import { FaBook, FaUsers, FaGraduationCap, FaChartLine, FaCog, FaPlus } from 'react-icons/fa';

const AdminHome = ({ onQuickAction, stats }) => {
  const quickActions = [
    { 
      id: 'add-course',
      label: 'Add New Course',
      icon: FaPlus,
      description: 'Create and publish new courses',
      color: 'blue'
    },
    {
      id: 'manage-users',
      label: 'Manage Users',
      icon: FaUsers,
      description: 'View and manage student accounts',
      color: 'green'
    },
    {
      id: 'view-reports',
      label: 'Analytics',
      icon: FaChartLine,
      description: 'View detailed reports and statistics',
      color: 'purple'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: FaCog,
      description: 'Configure system settings',
      color: 'gray'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <div className="flex space-x-2">
          <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={FaBook} 
          label="Total Courses" 
          value={stats.totalCourses} 
          color="blue"
          trend="+12% this month"
        />
        <StatCard 
          icon={FaUsers} 
          label="Active Students" 
          value={stats.activeStudents} 
          color="green"
          trend="+5% this week"
        />
        <StatCard 
          icon={FaGraduationCap} 
          label="Enrollments" 
          value={stats.enrollments} 
          color="purple"
          trend="+8% this month"
        />
        <StatCard 
          icon={FaChartLine} 
          label="Revenue" 
          value={stats.revenue} 
          color="orange"
          trend="+15% this month"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onQuickAction(action.id)}
            className={`p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all
              border-l-4 border-${action.color}-500 group`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                <action.icon className={`w-6 h-6 text-${action.color}-600`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{action.label}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          <ActivityItem
            icon={FaUsers}
            color="green"
            title="New Student Registration"
            description="John Doe enrolled in Physics Course"
            time="2 minutes ago"
          />
          <ActivityItem
            icon={FaBook}
            color="blue"
            title="New Course Added"
            description="Chemistry Fundamentals for Class 12"
            time="1 hour ago"
          />
          <ActivityItem
            icon={FaGraduationCap}
            color="purple"
            title="Course Completion"
            description="5 students completed Mathematics Basic"
            time="3 hours ago"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${color}-500`}>
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
        {trend && (
          <p className={`text-xs text-${color}-600 mt-1`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  </div>
);

const ActivityItem = ({ icon: Icon, color, title, description, time }) => (
  <div className="flex items-start space-x-4">
    <div className={`p-2 rounded-lg bg-${color}-100`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <div className="flex-1">
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <span className="text-xs text-gray-500">{time}</span>
  </div>
);

export default AdminHome;