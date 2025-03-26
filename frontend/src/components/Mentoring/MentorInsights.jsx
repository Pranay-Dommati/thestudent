import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaBookReader, FaClock, FaRegThumbsUp, FaRegComment, FaShare } from 'react-icons/fa';

const MentorInsights = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const insights = [
    {
      id: 1,
      author: {
        name: "Dr. Sarah Johnson",
        role: "Senior Software Engineer at Google",
        image: "https://randomuser.me/api/portraits/women/1.jpg"
      },
      title: "Building Scalable Systems: Lessons from Google",
      category: "Technical",
      readTime: "8 min read",
      likes: 245,
      comments: 32,
      preview: "Learn the key principles behind designing systems that can handle millions of users...",
      date: "2023-12-01"
    },
    {
      id: 2,
      author: {
        name: "Michael Chen",
        role: "Product Manager at Microsoft",
        image: "https://randomuser.me/api/portraits/men/2.jpg"
      },
      title: "Transitioning from Engineering to Product Management",
      category: "Career Growth",
      readTime: "6 min read",
      likes: 189,
      comments: 24,
      preview: "My journey from writing code to managing products, and key lessons learned along the way...",
      date: "2023-11-28"
    },
    {
      id: 3,
      author: {
        name: "Lisa Anderson",
        role: "Startup Founder & CEO",
        image: "https://randomuser.me/api/portraits/women/3.jpg"
      },
      title: "From College Project to Successful Startup",
      category: "Entrepreneurship",
      readTime: "10 min read",
      likes: 312,
      comments: 45,
      preview: "How we turned our final year project into a venture-backed startup...",
      date: "2023-11-25"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <span className="font-bold text-xl text-white">Students Hub</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/mentoring" className="text-white hover:bg-white/10 px-3 py-2 rounded-lg">
                Home
              </Link>
              <Link to="/connect-mentors" className="text-white hover:bg-white/10 px-3 py-2 rounded-lg">
                Connect with Mentors
              </Link>
              <Link to="/seniors-alumni" className="text-white hover:bg-white/10 px-3 py-2 rounded-lg">
                Seniors & Alumni
              </Link>
              <Link to="/mentor-insights" className="bg-white text-blue-600 px-3 py-2 rounded-lg">
                Mentor Insights
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Mentor Insights</h1>

          {/* Search and Categories */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'Technical', 'Career Growth', 'Entrepreneurship'].map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg ${
                    activeCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 gap-8">
            {insights.map(article => (
              <div key={article.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  <img src={article.author.image} alt={article.author.name} className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h3 className="font-semibold">{article.author.name}</h3>
                    <p className="text-gray-600 text-sm">{article.author.role}</p>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold mb-3">{article.title}</h2>
                <p className="text-gray-600 mb-4">{article.preview}</p>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <FaClock className="mr-1" />
                    {article.readTime}
                  </span>
                  <span className="mx-3">•</span>
                  <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                      <FaRegThumbsUp /> {article.likes}
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                      <FaRegComment /> {article.comments}
                    </button>
                  </div>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                    <FaShare /> Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorInsights;
