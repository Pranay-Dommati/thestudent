import React, { useState } from 'react';
import { FaSearch, FaStar, FaFilter } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ConnectMentors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [activeSection, setActiveSection] = useState('seniors');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [sessionType, setSessionType] = useState('one-on-one');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [paymentOption, setPaymentOption] = useState('');

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
    },
    // Web Development
    {
      id: 11,
      name: "Chris Evans",
      role: "Frontend Developer",
      company: "Netflix",
      expertise: ["Web Development", "React", "JavaScript"],
      rating: 4.8,
      availability: "Mon, Wed, Fri",
      image: "https://randomuser.me/api/portraits/men/11.jpg",
      type: "free"
    },
    {
      id: 12,
      name: "Anna Taylor",
      role: "Backend Developer",
      company: "Spotify",
      expertise: ["Web Development", "Node.js", "Databases"],
      rating: 4.7,
      availability: "Tue, Thu",
      image: "https://randomuser.me/api/portraits/women/12.jpg",
      type: "paid",
      rate: "$40/hour"
    },
    {
      id: 13,
      name: "James Brown",
      role: "Full Stack Developer",
      company: "Uber",
      expertise: ["Web Development", "Full Stack", "Cloud"],
      rating: 4.9,
      availability: "Mon, Fri",
      image: "https://randomuser.me/api/portraits/men/13.jpg",
      type: "paid",
      rate: "$50/hour"
    },
    {
      id: 14,
      name: "Sophia Green",
      role: "Mobile Developer",
      company: "Instagram",
      expertise: ["Web Development", "Mobile Development", "Flutter"],
      rating: 4.6,
      availability: "Wed, Sat",
      image: "https://randomuser.me/api/portraits/women/14.jpg",
      type: "free"
    },
    // AI/ML
    {
      id: 15,
      name: "Ethan White",
      role: "AI Engineer",
      company: "Google DeepMind",
      expertise: ["AI/ML", "Reinforcement Learning", "Python"],
      rating: 4.9,
      availability: "Mon, Thu",
      image: "https://randomuser.me/api/portraits/men/15.jpg",
      type: "paid",
      rate: "$90/hour"
    },
    {
      id: 16,
      name: "Olivia Brown",
      role: "Data Scientist",
      company: "Facebook",
      expertise: ["AI/ML", "Data Analysis", "R"],
      rating: 4.8,
      availability: "Tue, Fri",
      image: "https://randomuser.me/api/portraits/women/16.jpg",
      type: "free"
    },
    {
      id: 17,
      name: "Liam Wilson",
      role: "ML Engineer",
      company: "Amazon",
      expertise: ["AI/ML", "Computer Vision", "TensorFlow"],
      rating: 4.7,
      availability: "Wed, Sat",
      image: "https://randomuser.me/api/portraits/men/17.jpg",
      type: "paid",
      rate: "$75/hour"
    },
    {
      id: 18,
      name: "Emma Davis",
      role: "AI Researcher",
      company: "OpenAI",
      expertise: ["AI/ML", "Natural Language Processing", "Deep Learning"],
      rating: 4.9,
      availability: "Mon, Tue",
      image: "https://randomuser.me/api/portraits/women/18.jpg",
      type: "free"
    },
    // Product Management
    {
      id: 19,
      name: "Noah Johnson",
      role: "Product Manager",
      company: "Microsoft",
      expertise: ["Product Management", "Agile", "Scrum"],
      rating: 4.8,
      availability: "Mon, Thu",
      image: "https://randomuser.me/api/portraits/men/19.jpg",
      type: "paid",
      rate: "$60/hour"
    },
    {
      id: 20,
      name: "Ava Martinez",
      role: "Product Strategist",
      company: "Apple",
      expertise: ["Product Management", "Product Strategy", "Market Research"],
      rating: 4.7,
      availability: "Tue, Fri",
      image: "https://randomuser.me/api/portraits/women/20.jpg",
      type: "free"
    },
    {
      id: 21,
      name: "William Garcia",
      role: "Senior Product Manager",
      company: "Slack",
      expertise: ["Product Management", "User Research", "Analytics"],
      rating: 4.9,
      availability: "Wed, Sat",
      image: "https://randomuser.me/api/portraits/men/21.jpg",
      type: "paid",
      rate: "$70/hour"
    },
    {
      id: 22,
      name: "Isabella Lopez",
      role: "Product Lead",
      company: "Zoom",
      expertise: ["Product Management", "Leadership", "Roadmapping"],
      rating: 4.8,
      availability: "Mon, Fri",
      image: "https://randomuser.me/api/portraits/women/22.jpg",
      type: "free"
    },
    // Entrepreneurship
    {
      id: 23,
      name: "Mason Clark",
      role: "Startup Founder",
      company: "TechStart",
      expertise: ["Entrepreneurship", "Fundraising", "Pitching"],
      rating: 4.9,
      availability: "Mon, Wed",
      image: "https://randomuser.me/api/portraits/men/23.jpg",
      type: "paid",
      rate: "$100/hour"
    },
    {
      id: 24,
      name: "Mia Hernandez",
      role: "Business Consultant",
      company: "BizConsult",
      expertise: ["Entrepreneurship", "Growth Marketing", "Business Strategy"],
      rating: 4.7,
      availability: "Tue, Thu",
      image: "https://randomuser.me/api/portraits/women/24.jpg",
      type: "free"
    },
    {
      id: 25,
      name: "Lucas Walker",
      role: "Startup Advisor",
      company: "Startup Hub",
      expertise: ["Entrepreneurship", "Business Development", "Networking"],
      rating: 4.8,
      availability: "Wed, Sat",
      image: "https://randomuser.me/api/portraits/men/25.jpg",
      type: "paid",
      rate: "$120/hour"
    },
    {
      id: 26,
      name: "Amelia Scott",
      role: "Innovation Coach",
      company: "InnovateNow",
      expertise: ["Entrepreneurship", "Idea Validation", "Leadership"],
      rating: 4.9,
      availability: "Mon, Fri",
      image: "https://randomuser.me/api/portraits/women/26.jpg",
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

  const handleScheduleClick = (mentor) => {
    setSelectedMentor(mentor);
  };

  const handleCloseModal = () => {
    setSelectedMentor(null);
    setSessionType('one-on-one');
    setDate('');
    setTime('');
    setPaymentOption('');
  };

  const handleConfirmSchedule = () => {
    if (selectedMentor.type === 'paid' && !paymentOption) {
      alert('Please select a payment option.');
      return;
    }
    alert(`Session scheduled with ${selectedMentor.name} on ${date} at ${time}.`);
    handleCloseModal();
  };

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
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => handleScheduleClick(mentor)}
                >
                  Schedule Session
                </button>
              </div>
            ))}
          </div>

          {/* Schedule Modal */}
          {selectedMentor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Schedule Session with {selectedMentor.name}</h2>
                <p className="text-gray-600 mb-4">{selectedMentor.role} at {selectedMentor.company}</p>
                <p className="text-gray-600 mb-4">Expertise: {selectedMentor.expertise.join(', ')}</p>
                <p className="text-gray-600 mb-4">Rating: {selectedMentor.rating}</p>
                <p className="text-gray-600 mb-4">Availability: {selectedMentor.availability}</p>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Session Type</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                  >
                    <option value="one-on-one">One-on-One</option>
                    <option value="group">Group Session</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Time</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded-lg"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                {selectedMentor.type === 'paid' && (
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Payment Option</label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={paymentOption}
                      onChange={(e) => setPaymentOption(e.target.value)}
                    >
                      <option value="">Select Payment Option</option>
                      <option value="credit-card">Credit Card</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <button
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={handleConfirmSchedule}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectMentors;
