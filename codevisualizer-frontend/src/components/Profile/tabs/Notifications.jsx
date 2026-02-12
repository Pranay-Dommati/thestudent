import React from 'react';
import { FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

const notifications = [
  {
    id: 1,
    type: 'success',
    message: 'Your profile has been updated successfully.',
    time: '2 minutes ago'
  },
  {
    id: 2,
    type: 'info',
    message: 'New course on React has been added.',
    time: '1 hour ago'
  },
  {
    id: 3,
    type: 'warning',
    message: 'Your subscription is about to expire.',
    time: '1 day ago'
  },
  {
    id: 4,
    type: 'error',
    message: 'Failed to load your recent activities.',
    time: '2 days ago'
  }
];

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'success':
      return <FaCheckCircle className="text-green-500" />;
    case 'info':
      return <FaInfoCircle className="text-blue-500" />;
    case 'warning':
      return <FaExclamationCircle className="text-yellow-500" />;
    case 'error':
      return <FaTimesCircle className="text-red-500" />;
    default:
      return <FaBell className="text-gray-500" />;
  }
};

const Notifications = ({ isDarkMode }) => {
  return (
    <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`flex items-start p-4 rounded-lg shadow-md ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}
        >
          <div className="flex-shrink-0">
            <NotificationIcon type={notification.type} className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="font-medium">{notification.message}</p>
            <p className="text-sm text-gray-500">{notification.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;