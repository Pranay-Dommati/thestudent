import React from 'react';
import { FaUserTie, FaHandshake } from 'react-icons/fa';

export default function CTASection() {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.486 15.272 9.9l9.9-9.9h-2.828zM32 0l-9.9 9.9 1.414 1.414L33.828 0H32zM0 0c0 .528.792.97 1.516 1.364L21.364 21.364l.707-.707L1.364 0H0zm0 5.373l6.485 6.484L8.9 10.443 2.415 3.958 0 5.374zm0 5.656l9.9 9.9 1.414-1.414L0 8.485v2.544zm0 5.658l13.314 13.314 1.414-1.414L0 14.142v2.545zm0 5.656l16.728 16.728 1.414-1.414L0 19.8v2.544zM0 25.03l20.142 20.142 1.414-1.414L0 25.029v2.517zM0 30.686L22.344 53.03l1.414-1.414L0 30.686v2.546zm0 5.656l24 24 1.414-1.414L0 36.343v2.544z' fill='%23FFFFFF' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E\")",
          backgroundSize: '30px 30px'
        }}/>
      </div>

      <div className="relative max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">
          Start Your Mentorship Journey Today
        </h2>
        <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
          Whether you're looking to find guidance or share your expertise,
          join our community of mentors and mentees.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-6 max-w-2xl mx-auto">
          {/* Find a Mentor Button */}
          <button className="group flex-1 bg-white hover:bg-blue-50 text-blue-600 px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3">
            <FaUserTie className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg">Find a Mentor</span>
          </button>

          {/* Become a Mentor Button */}
          <button className="group flex-1 bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3">
            <FaHandshake className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg">Become a Mentor</span>
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 flex justify-center gap-8 text-blue-100">
          <div className="text-center">
            <div className="font-bold text-2xl text-white">500+</div>
            <div>Active Mentors</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl text-white">1000+</div>
            <div>Success Stories</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl text-white">24/7</div>
            <div>Support</div>
          </div>
        </div>
      </div>
    </section>
  );
}
