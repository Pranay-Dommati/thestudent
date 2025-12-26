import React from 'react';
import { Link } from 'react-router-dom';
import { FaRocket, FaBookOpen } from 'react-icons/fa';

const MobileHeroSection = ({ user }) => {
    return (
        <div className="bg-indigo-600 text-white px-4 py-6 rounded-xl">
            <p className="text-base mb-4">
                Continue your learning journey with expert-crafted courses and AI-powered personalized learning paths.
            </p>

            {/* Learning Stats */}
            <div className="bg-indigo-500/30 backdrop-blur-sm p-4 rounded-xl mb-6">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <div className="text-2xl font-bold">{user.totalCoursesEnrolled || 0}</div>
                        <div className="text-white/80 text-xs">Enrolled Courses</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">
                            {typeof user.hoursThisWeek === 'number' ? user.hoursThisWeek.toFixed(1) : (user.hoursThisWeek || 0)}h
                        </div>
                        <div className="text-white/80 text-xs">This Week</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{user.currentStreak || 0}</div>
                        <div className="text-white/80 text-xs">Day Streak 🔥</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
                <Link
                    to="/learning-path"
                    className="bg-white text-indigo-700 font-medium rounded-lg px-4 py-2.5 text-center flex items-center justify-center"
                >
                    <FaRocket className="mr-2" /> Create Custom Course
                </Link>

                <Link
                    to="/courses"
                    className="bg-indigo-500 text-white font-medium rounded-lg px-4 py-2.5 text-center flex items-center justify-center border border-indigo-400"
                >
                    <FaBookOpen className="mr-2" /> Explore Expert Courses
                </Link>
            </div>
        </div>
    );
};

export default MobileHeroSection;
