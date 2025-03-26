import React, { useState } from 'react';
import { FaSearch, FaStar, FaFilter } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ConnectMentors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [activeSection, setActiveSection] = useState('seniors');

  const mentors = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Senior Software Engineer",
      company: "Google",
      expertise: ["Web Development", "System Design"],
      rating: 4.9,
      availability: "Mon, Wed, Fri",
      image: "https://randomuser.me/api/portraits/women/1.jpg",
      type: "paid",
      rate: "$50/hour"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Data Scientist",
      company: "Microsoft",
      expertise: ["Machine Learning", "Python", "Data Analysis"],
      rating: 4.8,
      availability: "Tue, Thu, Sat",
      image: "https://randomuser.me/api/portraits/men/2.jpg",
      type: "free"
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "UX Design Lead",
      company: "Apple",
      expertise: ["UI/UX Design", "Product Design", "Figma"],
      rating: 4.9,
      availability: "Mon, Thu, Fri",
      image: "https://randomuser.me/api/portraits/women/3.jpg",
      type: "paid",
      rate: "$60/hour"
    },
    {
      id: 4,
      name: "David Kim",
      role: "Product Manager",
      company: "Amazon",
      expertise: ["Product Strategy", "Agile", "Leadership"],
      rating: 4.7,
      availability: "Wed, Fri",
      image: "https://randomuser.me/api/portraits/men/4.jpg",
      type: "free"
    },
    {
      id: 5,
      name: "Alex Thompson",
      role: "AI Research Scientist",
      company: "OpenAI",
      expertise: ["AI/ML", "Deep Learning", "Neural Networks"],
      rating: 4.9,
      availability: "Mon, Wed",
      image: "https://randomuser.me/api/portraits/men/5.jpg",
      type: "paid",
      rate: "$80/hour"
    },
    {
      id: 6,
      name: "Priya Patel",
      role: "ML Engineer",
      company: "Tesla",
      expertise: ["AI/ML", "Computer Vision", "Python"],
      rating: 4.7,
      availability: "Tue, Thu, Sat",
      image: "https://randomuser.me/api/portraits/women/6.jpg",
      type: "free"
    },
    {
      id: 7,
      name: "John Martinez",
      role: "Senior Product Manager",
      company: "Meta",
      expertise: ["Product Management", "Product Strategy", "User Research"],
      rating: 4.8,
      availability: "Mon, Fri",
      image: "https://randomuser.me/api/portraits/men/7.jpg",
      type: "paid",
      rate: "$70/hour"
    },
    {
      id: 8,
      name: "Lisa Wang",
      role: "Product Lead",
      company: "Airbnb",
      expertise: ["Product Management", "Agile", "Product Analytics"],
      rating: 4.9,
      availability: "Wed, Thu",
      image: "https://randomuser.me/api/portraits/women/8.jpg",
      type: "free"
    },
    {
      id: 9,
      name: "Rajesh Kumar",
      role: "Startup Advisor",
      company: "Startup Inc.",
      expertise: ["Entrepreneurship", "Business Strategy", "Fundraising"],
      rating: 4.8,
      availability: "Mon, Tue, Fri",
      image: "https://randomuser.me/api/portraits/men/9.jpg",
      type: "paid",
      rate: "$100/hour"
    },
    {
      id: 10,
      name: "Sophia Lee",
      role: "Business Consultant",
      company: "Consulting Co.",
      expertise: ["Entrepreneurship", "Growth Marketing", "Business Development"],
      rating: 4.7,
      availability: "Wed, Sat",
      image: "https://randomuser.me/api/portraits/women/10.jpg",
      type: "free"
    }
  ];

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesField = selectedField === 'all' || mentor.expertise.includes(selectedField);
    const matchesType = selectedType === 'all' || mentor.type === selectedType;
    return matchesSearch && matchesField && matchesType;
  });

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

            {/* Section Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/mentoring"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === 'mentors'
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Home
              </Link>
              <Link
                to="/connect-mentors"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === 'seniors'
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Connect with Mentors
              </Link>
              <Link
                to="/seniors-alumni"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === 'insights'
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Seniors & Alumni
              </Link>
              <Link
                to="/mentor-insights"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === 'connect'
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Mentor Insights
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Connect with Mentors</h1>
          
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentors by name or expertise..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-lg bg-white"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
            >
              <option value="all">All Fields</option>
              <option value="Web Development">Web Development</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Product Management">Product Management</option>
              <option value="Entrepreneurship">Entrepreneurship</option>
            </select>
            <select
              className="px-4 py-2 border rounded-lg bg-white"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="free">Free Mentoring</option>
              <option value="paid">Paid Mentoring</option>
            </select>
          </div>

          {/* Mentors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMentors.map(mentor => (
              <div key={mentor.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  <img src={mentor.image} alt={mentor.name} className="w-16 h-16 rounded-full mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg">{mentor.name}</h3>
                    <p className="text-gray-600 text-sm">{mentor.role} at {mentor.company}</p>
                  </div>
                </div>
                <div className="flex items-center mb-4">
                  <FaStar className="text-yellow-400" />
                  <span className="ml-1 font-medium">{mentor.rating}</span>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className="text-gray-600">{mentor.reviews} reviews</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.expertise.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    mentor.type === 'free' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {mentor.type === 'free' ? 'Free Mentoring' : mentor.rate}
                  </span>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Schedule Session
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectMentors;
