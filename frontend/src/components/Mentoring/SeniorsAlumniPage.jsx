import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaStar, FaGraduationCap, FaBriefcase, FaLinkedin } from 'react-icons/fa';

const SeniorsAlumniPage = () => {
  const [activeSection, setActiveSection] = useState('insights');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('all');

  const alumniData = [
    {
      id: 1,
      name: "Priya Sharma",
      graduationYear: 2020,
      course: "B.Tech Computer Science",
      currentRole: "Software Engineer at Google",
      expertise: ["Web Development", "Machine Learning"],
      linkedIn: "https://linkedin.com/in/priya",
      image: "https://randomuser.me/api/portraits/women/11.jpg",
      accomplishments: "Led a team of 5 developers in Google Cloud Platform"
    },
    {
      id: 2,
      name: "Rahul Patel",
      graduationYear: 2019,
      course: "B.Tech Electronics",
      currentRole: "Hardware Engineer at Apple",
      expertise: ["Circuit Design", "IoT"],
      linkedIn: "https://linkedin.com/in/rahul",
      image: "https://randomuser.me/api/portraits/men/12.jpg",
      accomplishments: "Patent holder for innovative circuit design"
    },
    {
      id: 3,
      name: "Sarah Khan",
      graduationYear: 2021,
      course: "B.Tech AI & ML",
      currentRole: "Data Scientist at Microsoft",
      expertise: ["Data Science", "Deep Learning"],
      linkedIn: "https://linkedin.com/in/sarah",
      image: "https://randomuser.me/api/portraits/women/13.jpg",
      accomplishments: "Published research paper in top AI conference"
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
              <Link to="/seniors-alumni" className="bg-white text-blue-600 px-3 py-2 rounded-lg">
                Seniors & Alumni
              </Link>
              <Link to="/mentor-insights" className="text-white hover:bg-white/10 px-3 py-2 rounded-lg">
                Mentor Insights
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Connect with Seniors & Alumni</h1>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, course, or expertise..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-lg bg-white"
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
            >
              <option value="all">All Fields</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          {/* Alumni Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {alumniData.map(alumni => (
              <div key={alumni.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  <img src={alumni.image} alt={alumni.name} className="w-16 h-16 rounded-full mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg">{alumni.name}</h3>
                    <p className="text-gray-600 text-sm">{alumni.currentRole}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <FaGraduationCap className="mr-2" />
                    <span>{alumni.course} ({alumni.graduationYear})</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaBriefcase className="mr-2" />
                    <span>{alumni.accomplishments}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {alumni.expertise.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Connect
                  </button>
                  <a
                    href={alumni.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <FaLinkedin className="text-xl" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeniorsAlumniPage;
