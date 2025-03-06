import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = ({ user }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-24 pb-16 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-xl -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-10 rounded-full blur-xl translate-y-1/2 -translate-x-1/4"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome Back, {user.name}!</h1>
          <p className="text-xl mb-8 text-white/80">
            Continue where you left off, track your progress, and explore new courses tailored to your interests.
          </p>
          
          {user.lastCourse && (
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl mb-8 flex flex-col md:flex-row items-start md:items-center">
              <img 
                src={user.lastCourse.thumbnail} 
                alt={user.lastCourse.title} 
                className="w-16 h-16 object-cover rounded-lg mr-4 mb-4 md:mb-0"
              />
              <div className="flex-grow">
                <p className="text-white/70 mb-1">Continue learning</p>
                <h3 className="font-bold text-lg mb-2">{user.lastCourse.title}</h3>
                <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-blue-400 h-2.5 rounded-full" 
                    style={{ width: `${user.lastCourse.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-white/70">{user.lastCourse.progress}% complete</p>
              </div>
              <Link 
                to={`/courses/${user.lastCourse.id}/learning`}
                className="mt-4 md:mt-0 md:ml-4 px-6 py-2.5 bg-white text-indigo-700 font-medium rounded-lg hover:bg-opacity-90 transition shadow-lg"
              >
                Resume Course
              </Link>
            </div>
          )}
          
          <div className="flex flex-wrap gap-4">
            <Link 
              to={`/courses/${user.lastCourse?.id || ''}/learning`}
              className="px-6 py-3 bg-white text-indigo-700 font-medium rounded-lg hover:bg-opacity-90 transition shadow-lg"
            >
              Resume Last Course
            </Link>
            <Link 
              to="/courses"
              className="px-6 py-3 bg-indigo-500 bg-opacity-30 text-white font-medium rounded-lg border border-white/30 hover:bg-opacity-40 transition"
            >
              Explore New Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;