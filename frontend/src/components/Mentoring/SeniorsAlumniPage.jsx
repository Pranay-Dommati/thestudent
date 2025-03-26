import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaStar, FaGraduationCap, FaBriefcase, FaLinkedin } from 'react-icons/fa';

const SeniorsAlumniPage = () => {
  const [selectedCollege, setSelectedCollege] = useState('all');

  const colleges = [
    'all',
    'IIT Hyderabad',
    'CBIT',
    'MGIT',
    'KMIT',
    'VNRVJIET',
    'Vasavi'
  ];

  const alumniData = [
    // IIT Hyderabad
    {
      id: 1,
      name: "Priya Sharma",
      graduationYear: 2020,
      course: "B.Tech Computer Science",
      college: "IIT Hyderabad",
      currentRole: "Software Engineer at Google",
      expertise: ["Web Development", "Machine Learning"],
      linkedIn: "https://linkedin.com/in/priya",
      image: "https://randomuser.me/api/portraits/women/11.jpg",
      accomplishments: "Led a team of 5 developers in Google Cloud Platform",
      type: "alumni",
    },
    {
      id: 9,
      name: "Vikram Singh",
      graduationYear: 2025,
      currentYear: "3rd Year",
      course: "B.Tech Computer Science",
      college: "IIT Hyderabad",
      currentRole: "Research Intern",
      expertise: ["AI/ML", "Deep Learning"],
      linkedIn: "https://linkedin.com/in/vikram",
      image: "https://randomuser.me/api/portraits/men/41.jpg",
      accomplishments: "Published paper in ICML conference",
      type: "senior",
    },
    {
      id: 3,
      name: "Anjali Kumar",
      graduationYear: 2019,
      course: "B.Tech AI & ML",
      college: "IIT Hyderabad",
      currentRole: "AI Researcher at Microsoft",
      expertise: ["Deep Learning", "NLP"],
      linkedIn: "https://linkedin.com/in/anjali",
      image: "https://randomuser.me/api/portraits/women/15.jpg",
      accomplishments: "Published 3 research papers in top conferences",
      type: "alumni",
    },
    {
      id: 4,
      name: "Rohan Mehta",
      graduationYear: 2024,
      currentYear: "4th Year",
      course: "B.Tech Computer Science",
      college: "IIT Hyderabad",
      currentRole: "ML Research Assistant",
      expertise: ["Computer Vision", "PyTorch"],
      linkedIn: "https://linkedin.com/in/rohan",
      image: "https://randomuser.me/api/portraits/men/18.jpg",
      accomplishments: "Developed ML models for autonomous vehicles",
      type: "senior",
    },
    // Add more IIT Hyderabad entries here...

    // CBIT
    {
      id: 2,
      name: "Rahul Patel",
      graduationYear: 2024,
      currentYear: "4th Year",
      course: "B.Tech Electronics",
      college: "CBIT",
      currentRole: "Student Researcher",
      expertise: ["Circuit Design", "IoT"],
      linkedIn: "https://linkedin.com/in/rahul",
      image: "https://randomuser.me/api/portraits/men/12.jpg",
      accomplishments: "Working on Smart City IoT Project",
      type: "senior",
    },
    {
      id: 13,
      name: "Aarav Kumar",
      graduationYear: 2021,
      course: "B.Tech Mechanical",
      college: "CBIT",
      currentRole: "Design Engineer at Boeing",
      expertise: ["CAD/CAM", "Aerodynamics"],
      linkedIn: "https://linkedin.com/in/aarav",
      image: "https://randomuser.me/api/portraits/men/45.jpg",
      accomplishments: "Designed aircraft components",
      type: "alumni",
    },
    {
      id: 14,
      name: "Ananya Reddy",
      graduationYear: 2025,
      currentYear: "3rd Year",
      course: "B.Tech ECE",
      college: "CBIT",
      currentRole: "Student Researcher",
      expertise: ["VLSI", "Signal Processing"],
      linkedIn: "https://linkedin.com/in/ananya",
      image: "https://randomuser.me/api/portraits/women/45.jpg",
      accomplishments: "Won Best Project in Tech Expo",
      type: "senior",
    },
    {
      id: 20,
      name: "Kavya Reddy",
      graduationYear: 2025,
      currentYear: "3rd Year",
      course: "B.Tech ECE",
      college: "CBIT",
      currentRole: "Student Researcher",
      expertise: ["VLSI", "Embedded Systems"],
      linkedIn: "https://linkedin.com/in/kavya",
      image: "https://randomuser.me/api/portraits/women/20.jpg",
      accomplishments: "Developed IoT-based smart home system",
      type: "senior",
    },
    // Add more CBIT entries here...

    // MGIT
    {
      id: 6,
      name: "Neha Singh",
      graduationYear: 2024,
      currentYear: "4th Year",
      course: "B.Tech Computer Science",
      college: "MGIT",
      currentRole: "Student Researcher",
      expertise: ["AI/ML", "Data Science"],
      linkedIn: "https://linkedin.com/in/neha",
      image: "https://randomuser.me/api/portraits/women/28.jpg",
      accomplishments: "Published paper in IEEE conference",
      type: "senior",
    },
    {
      id: 21,
      name: "Ravi Kumar",
      graduationYear: 2023,
      course: "B.Tech Mechanical",
      college: "MGIT",
      currentRole: "Mechanical Engineer at Tata Motors",
      expertise: ["Automobile Engineering", "CAD"],
      linkedIn: "https://linkedin.com/in/ravi",
      image: "https://randomuser.me/api/portraits/men/21.jpg",
      accomplishments: "Designed new engine model",
      type: "alumni",
    },
    {
      id: 22,
      name: "Sanjana Rao",
      graduationYear: 2025,
      currentYear: "3rd Year",
      course: "B.Tech ECE",
      college: "MGIT",
      currentRole: "Student Researcher",
      expertise: ["VLSI", "Signal Processing"],
      linkedIn: "https://linkedin.com/in/sanjana",
      image: "https://randomuser.me/api/portraits/women/22.jpg",
      accomplishments: "Developed new VLSI architecture",
      type: "senior",
    },
    {
      id: 23,
      name: "Amit Sharma",
      graduationYear: 2022,
      course: "B.Tech Civil",
      college: "MGIT",
      currentRole: "Civil Engineer at L&T",
      expertise: ["Structural Engineering", "Project Management"],
      linkedIn: "https://linkedin.com/in/amit",
      image: "https://randomuser.me/api/portraits/men/23.jpg",
      accomplishments: "Managed large scale construction projects",
      type: "alumni",
    },
    // Add more MGIT entries here...

    // KMIT
    {
      id: 7,
      name: "Aditya Verma",
      graduationYear: 2020,
      course: "B.Tech Computer Science",
      college: "KMIT",
      currentRole: "Senior Developer at Adobe",
      expertise: ["Frontend Development", "UX Design"],
      linkedIn: "https://linkedin.com/in/aditya",
      image: "https://randomuser.me/api/portraits/men/35.jpg",
      accomplishments: "Developed core features for Adobe XD",
      type: "alumni",
    },
    {
      id: 24,
      name: "Ritika Singh",
      graduationYear: 2024,
      currentYear: "4th Year",
      course: "B.Tech IT",
      college: "KMIT",
      currentRole: "Student Developer",
      expertise: ["Web Development", "Cloud Computing"],
      linkedIn: "https://linkedin.com/in/ritika",
      image: "https://randomuser.me/api/portraits/women/24.jpg",
      accomplishments: "Developed cloud-based web applications",
      type: "senior",
    },
    {
      id: 25,
      name: "Suresh Reddy",
      graduationYear: 2021,
      course: "B.Tech Mechanical",
      college: "KMIT",
      currentRole: "Mechanical Engineer at Mahindra",
      expertise: ["Automobile Engineering", "CAD"],
      linkedIn: "https://linkedin.com/in/suresh",
      image: "https://randomuser.me/api/portraits/men/25.jpg",
      accomplishments: "Designed new vehicle models",
      type: "alumni",
    },
    {
      id: 26,
      name: "Pooja Sharma",
      graduationYear: 2025,
      currentYear: "3rd Year",
      course: "B.Tech ECE",
      college: "KMIT",
      currentRole: "Student Researcher",
      expertise: ["VLSI", "Signal Processing"],
      linkedIn: "https://linkedin.com/in/pooja",
      image: "https://randomuser.me/api/portraits/women/26.jpg",
      accomplishments: "Developed new VLSI architecture",
      type: "senior",
    },
    // Add more KMIT entries here...

    // VNRVJIET
    {
      id: 3,
      name: "Karthik Reddy",
      graduationYear: 2021,
      course: "B.Tech Computer Science",
      college: "VNRVJIET",
      currentRole: "Software Developer at Amazon",
      expertise: ["Backend Development", "System Design"],
      linkedIn: "https://linkedin.com/in/karthik",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
      accomplishments: "Developed high-scale distributed systems",
      type: "alumni",
    },
    {
      id: 8,
      name: "Riya Patel",
      graduationYear: 2024,
      currentYear: "4th Year",
      course: "B.Tech AI & ML",
      college: "VNRVJIET",
      currentRole: "Student Developer",
      expertise: ["Deep Learning", "Computer Vision"],
      linkedIn: "https://linkedin.com/in/riya",
      image: "https://randomuser.me/api/portraits/women/30.jpg",
      accomplishments: "Intern at NVIDIA",
      type: "senior",
    },
    {
      id: 27,
      name: "Anil Kumar",
      graduationYear: 2020,
      course: "B.Tech Civil",
      college: "VNRVJIET",
      currentRole: "Civil Engineer at L&T",
      expertise: ["Structural Engineering", "Project Management"],
      linkedIn: "https://linkedin.com/in/anil",
      image: "https://randomuser.me/api/portraits/men/27.jpg",
      accomplishments: "Managed large scale construction projects",
      type: "alumni",
    },
    {
      id: 28,
      name: "Sneha Reddy",
      graduationYear: 2025,
      currentYear: "3rd Year",
      course: "B.Tech ECE",
      college: "VNRVJIET",
      currentRole: "Student Researcher",
      expertise: ["VLSI", "Signal Processing"],
      linkedIn: "https://linkedin.com/in/sneha",
      image: "https://randomuser.me/api/portraits/women/28.jpg",
      accomplishments: "Developed new VLSI architecture",
      type: "senior",
    },
    // Add more VNRVJIET entries here...

    // Vasavi
    {
      id: 4,
      name: "Sneha Verma",
      graduationYear: 2024,
      currentYear: "4th Year",
      course: "B.Tech Electronics",
      college: "Vasavi",
      currentRole: "Student Lead - Tech Club",
      expertise: ["VLSI", "Embedded Systems"],
      linkedIn: "https://linkedin.com/in/sneha",
      image: "https://randomuser.me/api/portraits/women/24.jpg",
      accomplishments: "Best Project Award in College Symposium",
      type: "senior",
    },
    {
      id: 29,
      name: "Rohit Sharma",
      graduationYear: 2023,
      course: "B.Tech Mechanical",
      college: "Vasavi",
      currentRole: "Mechanical Engineer at Tata Motors",
      expertise: ["Automobile Engineering", "CAD"],
      linkedIn: "https://linkedin.com/in/rohit",
      image: "https://randomuser.me/api/portraits/men/29.jpg",
      accomplishments: "Designed new engine model",
      type: "alumni",
    },
    {
      id: 30,
      name: "Anusha Reddy",
      graduationYear: 2025,
      currentYear: "3rd Year",
      course: "B.Tech ECE",
      college: "Vasavi",
      currentRole: "Student Researcher",
      expertise: ["VLSI", "Signal Processing"],
      linkedIn: "https://linkedin.com/in/anusha",
      image: "https://randomuser.me/api/portraits/women/30.jpg",
      accomplishments: "Developed new VLSI architecture",
      type: "senior",
    },
    {
      id: 31,
      name: "Vikram Reddy",
      graduationYear: 2022,
      course: "B.Tech Civil",
      college: "Vasavi",
      currentRole: "Civil Engineer at L&T",
      expertise: ["Structural Engineering", "Project Management"],
      linkedIn: "https://linkedin.com/in/vikram",
      image: "https://randomuser.me/api/portraits/men/31.jpg",
      accomplishments: "Managed large scale construction projects",
      type: "alumni",
    },
    // Add more Vasavi entries here...
  ];

  const filteredData = selectedCollege === 'all' 
    ? alumniData 
    : alumniData.filter(person => person.college === selectedCollege);

  const seniors = filteredData.filter(person => person.type === "senior");
  const alumni = filteredData.filter(person => person.type === "alumni");

  const PersonCard = ({ person }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center mb-4">
        <img src={person.image} alt={person.name} className="w-16 h-16 rounded-full mr-4" />
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {person.name}
            <span className="text-sm text-gray-500">({person.college})</span>
          </h3>
          <p className="text-gray-600 text-sm">
            {person.currentRole}
            {person.type === "senior" && (
              <span className="ml-2 text-blue-600">• {person.currentYear}</span>
            )}
          </p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600">
          <FaGraduationCap className="mr-2" />
          <span>{person.course} ({person.graduationYear})</span>
        </div>
        <div className="flex items-center text-gray-600">
          <FaBriefcase className="mr-2" />
          <span>{person.accomplishments}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {person.expertise.map((skill) => (
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
          href={person.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <FaLinkedin className="text-xl" />
        </a>
      </div>
    </div>
  );

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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Connect with Seniors & Alumni</h1>
            
            {/* College Filter */}
            <div className="relative">
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Colleges</option>
                {colleges.filter(c => c !== 'all').map(college => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* College Info */}
          {selectedCollege !== 'all' && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">
                Showing results for {selectedCollege}
              </h2>
              <p className="text-blue-600">
                {alumni.length} Alumni • {seniors.length} Seniors
              </p>
            </div>
          )}

          {/* Alumni Section */}
          {alumni.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Alumni</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {alumni.map(person => <PersonCard key={person.id} person={person} />)}
              </div>
            </>
          )}

          {/* Seniors Section */}
          {seniors.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Seniors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {seniors.map(person => <PersonCard key={person.id} person={person} />)}
              </div>
            </>
          )}

          {/* No Results Message */}
          {alumni.length === 0 && seniors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No seniors or alumni found for {selectedCollege}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeniorsAlumniPage;
