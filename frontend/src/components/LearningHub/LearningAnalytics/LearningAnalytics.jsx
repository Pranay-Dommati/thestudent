import React, { useState } from 'react';

const LearningAnalytics = ({ user }) => {
  const [timePeriod, setTimePeriod] = useState('week');
  
  // Set default weekly goal if not provided
  const weeklyGoalHours = user.weeklyGoalHours || 15;
  
  // Calculate weekly goal percentage
  const weeklyGoalPercentage = (user.hoursThisWeek / weeklyGoalHours) * 100;

  // Mock data for different time periods
  const timeData = {
    week: { 
      enrolled: user.totalCoursesEnrolled, 
      hours: user.hoursThisWeek, 
      change: '+2 courses', 
      hoursChange: '+3.5 hrs' 
    },
    month: { 
      enrolled: user.totalCoursesEnrolled, 
      hours: user.hoursThisWeek * 4, 
      change: '+5 courses', 
      hoursChange: '+12.5 hrs' 
    },
    year: { 
      enrolled: user.totalCoursesEnrolled, 
      hours: user.hoursThisWeek * 48, 
      change: '+18 courses', 
      hoursChange: '+120 hrs' 
    }
  };

  // Get current period data
  const currentData = timeData[timePeriod];
  
  return (
    <section className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Learning Statistics</h2>
        <select 
          className="text-sm border rounded-md border-gray-300 px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
      
      <div className="space-y-4 mb-8">
        {/* Total courses enrolled */}
        <div className="bg-indigo-50 rounded-lg p-4 flex items-center">
          <div className="bg-indigo-100 rounded-full p-2 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Total Courses Enrolled</p>
            <p className="text-2xl font-bold text-indigo-700">{currentData.enrolled}</p>
          </div>
          <div className="ml-auto text-sm text-green-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>{currentData.change}</span>
          </div>
        </div>
        
        {/* Study time this period */}
        <div className="bg-purple-50 rounded-lg p-4 flex items-center">
          <div className="bg-purple-100 rounded-full p-2 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Hours Spent This {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}</p>
            <p className="text-2xl font-bold text-purple-700">{currentData.hours}</p>
          </div>
          <div className="ml-auto text-sm text-green-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>{currentData.hoursChange} vs last {timePeriod}</span>
          </div>
        </div>
        
        {/* Certificates earned */}
        {/* <div className="bg-blue-50 rounded-lg p-4 flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Certificates Earned</p>
            <p className="text-2xl font-bold text-blue-700">{user.certificatesEarned}</p>
          </div>
          <div className="ml-auto">
            <button className="text-sm text-blue-600 border border-blue-300 rounded-md px-3 py-1 hover:bg-blue-50 transition-colors">
              View All
            </button>
          </div>
        </div> */}
      </div>
      
      {/* Weekly goal progress */}
      <div className="border-t border-gray-100 pt-5 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Weekly Learning Goal</h3>
          <span className="text-sm text-gray-500">{user.hoursThisWeek} / {weeklyGoalHours} hours</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${Math.min(weeklyGoalPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex items-center">
          {weeklyGoalPercentage >= 100 ? (
            <div className="flex items-center text-green-600 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You've reached your weekly goal! Great job! 🎉</span>
            </div>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{Math.round(weeklyGoalPercentage)}% of your weekly goal completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Learning streak */}
      <div className="border-t border-gray-100 pt-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-700">Current Learning Streak</h3>
          <span className="text-sm bg-amber-100 text-amber-800 px-3 py-0.5 rounded-full flex items-center">
            <span>{user.currentStreak || 5} days</span>
            <span className="ml-1 text-lg">🔥</span>
          </span>
        </div>
        <div className="flex justify-between">
          {Array(7).fill(0).map((_, i) => {
            const day = new Date();
            day.setDate(day.getDate() - 6 + i);
            const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
            // Mock data: active days pattern - you would replace with real data
            const isActive = i === 0 || i === 2 || i === 3 || i === 4 || i === 6; 
            
            return (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    isActive 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm' 
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <span className="text-xs font-medium">{day.getDate()}</span>
                </div>
                <span className={`text-xs ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                  {dayName.substring(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LearningAnalytics;