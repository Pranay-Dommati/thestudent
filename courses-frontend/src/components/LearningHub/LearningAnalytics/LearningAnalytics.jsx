import React from 'react';

const LearningAnalytics = ({ user }) => {
    // Set default weekly goal if not provided
    const weeklyGoalHours = user.weeklyGoalHours || 15;

    // Calculate weekly goal percentage
    const weeklyGoalPercentage = (user.hoursThisWeek / weeklyGoalHours) * 100;

    // Use only weekly data
    const currentData = {
        enrolled: user.totalCoursesEnrolled,
        hours: user.hoursThisWeek
    };

    return (
        <section className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {/* Header with gradient accent */}
            <div className="mb-8">
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Learning Analytics
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Track your progress</p>
                </div>
            </div>

            <div className="space-y-6 mb-8">
                {/* Total courses enrolled */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-3 mr-4 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-600 text-sm font-medium">Total Courses Enrolled</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {currentData.enrolled}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Study time this period */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-3 mr-4 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-600 text-sm font-medium">Hours This Week</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {typeof currentData.hours === 'number' ? currentData.hours.toFixed(1) : currentData.hours}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Weekly goal progress */}
            <div className="border-t border-gray-100 pt-6 mb-6">
                <div className="flex flex-col gap-2 mb-3">
                    <h3 className="text-sm font-bold text-gray-700 whitespace-nowrap">Weekly Learning Goal</h3>
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium w-fit">
                        {typeof user.hoursThisWeek === 'number' ? user.hoursThisWeek.toFixed(1) : user.hoursThisWeek} / {weeklyGoalHours} hours
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                        style={{ width: `${Math.min(weeklyGoalPercentage, 100)}%` }}
                    ></div>
                </div>
                <div className="flex items-center">
                    {weeklyGoalPercentage >= 100 ? (
                        <div className="flex items-center text-emerald-600 text-sm bg-emerald-50 px-4 py-2 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">You've reached your weekly goal! Great job! 🎉</span>
                        </div>
                    ) : (
                        <div className="flex items-center text-sm text-gray-600 bg-indigo-50 px-4 py-2 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="font-medium">{Math.round(weeklyGoalPercentage)}% of your weekly goal completed</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Learning streak */}
            <div className="border-t border-gray-100 pt-6">
                <div className="flex flex-col gap-2 mb-6">
                    <h3 className="text-sm font-bold text-gray-700 whitespace-nowrap">Current Learning Streak</h3>
                    <span className="text-sm bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full flex items-center font-medium border border-amber-200 w-fit">
                        <span>{user.currentStreak || 0} days</span>
                        <span className="ml-2 text-lg">🔥</span>
                    </span>
                </div>
                <div className="flex justify-between overflow-hidden">
                    {user.weeklyBreakdown && user.weeklyBreakdown.length > 0 ? (
                        // Use real data from backend API
                        user.weeklyBreakdown.map((dayData, i) => {
                            const dayDate = new Date(dayData.date);
                            const dayName = dayData.day_name;
                            const isActive = dayData.has_activity; // Real activity data from backend

                            return (
                                <div key={i} className="flex flex-col items-center group">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all duration-300 ${isActive
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span className="text-[10px] sm:text-xs font-bold">{dayDate.getDate()}</span>
                                    </div>
                                    <span className={`text-[10px] sm:text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                        {dayName}
                                    </span>
                                </div>
                            );
                        })
                    ) : null}
                </div>
            </div>
        </section>
    );
};

export default LearningAnalytics;