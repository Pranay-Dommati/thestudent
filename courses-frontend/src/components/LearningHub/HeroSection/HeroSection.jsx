import React from 'react';
// logger removed for production cleanliness
import { Link } from 'react-router-dom';
import { FaRocket, FaBookOpen } from 'react-icons/fa';

const HeroSection = ({ user }) => {


    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-16 pb-16 relative overflow-hidden">
            {/* Decorative elements removed for clean, uniform coloring */}

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome Back, {user.name}! 👋</h1>
                    <p className="text-xl mb-8 text-white/80">
                        Continue your learning with expert-crafted courses, or get a smart learning path when you’re not sure where to start.
                    </p>

                    {/* Learning Stats */}
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold">{user.totalCoursesEnrolled || 0}</div>
                                <div className="text-white/70 text-sm">Enrolled Courses</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {typeof user.hoursThisWeek === 'number' ? user.hoursThisWeek.toFixed(1) : (user.hoursThisWeek || 0)}h
                                </div>
                                <div className="text-white/70 text-sm">This Week</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{user.currentStreak || 0}</div>
                                <div className="text-white/70 text-sm">Day Streak 🔥</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/learning-path"
                            className="group relative px-6 py-3 bg-white text-indigo-700 font-medium rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:bg-opacity-95 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 border border-gray-200"
                            style={{
                                pointerEvents: 'auto',
                                cursor: 'pointer',
                                position: 'relative',
                                zIndex: 50
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <span className="relative z-10 flex items-center">
                                <FaRocket className="mr-2" />
                                Try Smart Learning
                            </span>
                        </Link>
                        <Link
                            to="/#courses"
                            className="group relative px-6 py-3 bg-indigo-500 bg-opacity-30 text-white font-medium rounded-lg border border-white/30 transition-all duration-300 hover:bg-opacity-40 hover:border-white/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50"
                            style={{
                                pointerEvents: 'auto',
                                cursor: 'pointer',
                                position: 'relative',
                                zIndex: 50
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <span className="relative z-10 flex items-center">
                                <FaBookOpen className="mr-2" />
                                Explore Expert Courses
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;