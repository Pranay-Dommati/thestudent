import React from 'react';
import { FaSearch, FaUsers, FaStar } from 'react-icons/fa';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6">Find Your Perfect Mentor</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with industry experts, alumni, and seniors for personalized guidance on your career journey
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex items-center bg-white rounded-lg p-2">
              <FaSearch className="text-gray-400 ml-2" />
              <input
                type="text"
                placeholder="Search by skill, domain, or expertise..."
                className="w-full px-4 py-2 focus:outline-none text-gray-800"
              />
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Expert Mentors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Students Mentored</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">4.8/5</div>
              <div className="text-blue-100">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
