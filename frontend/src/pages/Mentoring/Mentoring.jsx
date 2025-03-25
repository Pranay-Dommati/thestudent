import React from 'react';
import { FaChalkboardTeacher, FaUsers, FaCalendar, FaComments } from 'react-icons/fa';

const Mentoring = () => {
  const features = [
    {
      icon: <FaChalkboardTeacher className="w-6 h-6" />,
      title: "Find a Mentor",
      description: "Connect with experienced mentors in your field of study"
    },
    {
      icon: <FaUsers className="w-6 h-6" />,
      title: "Group Sessions",
      description: "Join group mentoring sessions and learn with peers"
    },
    {
      icon: <FaCalendar className="w-6 h-6" />,
      title: "Schedule Meetings",
      description: "Book one-on-one sessions with your chosen mentor"
    },
    {
      icon: <FaComments className="w-6 h-6" />,
      title: "Discussion Forums",
      description: "Participate in topic-specific discussions"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect Mentor</h1>
          <p className="text-xl mb-8">Get guidance from experienced professionals and accelerate your learning journey</p>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-full font-medium hover:shadow-lg transition-shadow">
            Get Started
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Mentoring Journey?</h2>
          <p className="text-gray-600 mb-8">Join our community of learners and mentors today</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors">
            Browse Mentors
          </button>
        </div>
      </div>
    </div>
  );
};

export default Mentoring;
