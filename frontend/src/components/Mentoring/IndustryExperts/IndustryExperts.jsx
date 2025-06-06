import React, { useState } from "react";
import MentoringNavbar from "../MentoringNavbar";
import Footer from "../../Footer/Footer";
import { FaStar, FaSearch, FaBriefcase, FaLinkedin } from "react-icons/fa";

const industryExperts = [
  {
    id: 1,
    name: "John Doe",
    role: "Software Engineer",
    company: "Google",
    experience: "8+ years",
    expertise: ["Web Development", "System Design", "Cloud Architecture"],
    rating: 4.9,
    totalReviews: 124,
    price: 50,
    availability: "Available this week",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    linkedIn: "https://linkedin.com/in/johndoe",
  },
  {
    id: 2,
    name: "Emma Watson",
    role: "Data Scientist",
    company: "Microsoft",
    experience: "6+ years",
    expertise: ["Machine Learning", "Data Analytics", "Python"],
    rating: 4.8,
    totalReviews: 98,
    price: 40,
    availability: "Available next week",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
    linkedIn: "https://linkedin.com/in/emmawatson",
  },
  // Add more mentors here
];

const IndustryExperts = () => {
  const [search, setSearch] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("All");

  const filteredMentors = industryExperts.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedExpertise === "All" || mentor.expertise.includes(selectedExpertise))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MentoringNavbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Find Your Industry Expert</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with experienced professionals from top companies for personalized career guidance.
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-blue-200">Expert Mentors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">4.9/5</div>
              <div className="text-blue-200">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">10k+</div>
              <div className="text-blue-200">Sessions Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 -mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentors by name or expertise..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedExpertise}
              onChange={(e) => setSelectedExpertise(e.target.value)}
              className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Expertise</option>
              <option value="Web Development">Web Development</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="System Design">System Design</option>
            </select>
          </div>
        </div>

        {/* Mentors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={mentor.image}
                    alt={mentor.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{mentor.name}</h3>
                    <p className="text-blue-600 font-medium">{mentor.role}</p>
                    <p className="text-gray-600">{mentor.company}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-yellow-400">
                        <FaStar />
                        <span className="ml-1 text-gray-700">{mentor.rating}</span>
                      </div>
                      <span className="text-gray-500">({mentor.totalReviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <FaBriefcase className="text-blue-500" />
                    <span>{mentor.experience}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.expertise.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-gray-600">
                    <span className="font-semibold text-xl text-gray-800">${mentor.price}</span>/hour
                  </div>
                  <a
                    href={mentor.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <FaLinkedin size={24} />
                  </a>
                </div>

                <button className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  Schedule Session
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default IndustryExperts;
