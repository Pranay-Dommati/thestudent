import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaPlay, FaBookReader, FaClock, FaChalkboardTeacher, FaGlobe } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';

const SchoolCourseDetails = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCourse({
        id: 1,
        title: "CBSE Class 10 Mathematics",
        subject: "Mathematics",
        board: "CBSE",
        class: "10th",
        features: [
          { icon: <FaChalkboardTeacher />, title: "Expert Teachers", desc: "Learn from experienced educators" },
          { icon: <FaBookReader />, title: "Structured Learning", desc: "Well-organized chapter-wise content" },
          { icon: <FaClock />, title: "Self-Paced", desc: "Learn at your own convenience" }
        ],
        keyTopics: [
          "Real Numbers",
          "Polynomials",
          "Coordinate Geometry",
          "Triangles",
          "Statistics"
        ],
        whatYouLearn: [
          "Master fundamental mathematical concepts",
          "Solve complex problems step by step",
          "Practice with previous year questions",
          "Prepare effectively for board exams"
        ],
        instructor: "Mrs. Sharma",
        duration: "40+ hours",
        chapters: 15,
        thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb"
      });
      setLoading(false);
    }, 800);
  }, [courseId]);

  const handleStartLearning = () => {
    navigate(`${location.pathname}/learning`);
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div className="p-8 text-center">Course not found</div>;

  return (
    <>
    <Navbar />
    
    <div className="min-h-screen bg-gray-50"> {/* Removed pt-6 from here */}
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-8"> {/* Added pt-8 here */}
        <div className="container mx-auto px-4 py-12"> {/* Changed pt-6 pb-12 to py-12 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <div className="flex items-center space-x-4 mb-6">
                <span>{course.board}</span>
                <span>•</span>
                <span>{course.class} Standard</span>
                <span>•</span>
                <span>{course.subject}</span>
              </div>
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <FaGlobe className="text-lg" />
                  <span>Sources : YouTube</span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <FaClock />
                  <span>{course.duration} • {course.chapters} chapters</span>
                </div>
              </div>
              <button 
                onClick={handleStartLearning}
                className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Start Learning
              </button>
            </div>
            {/* Update the image container div and img classes */}
            <div className="relative py-10 lg:py-6 max-w-xl mx-auto lg:mx-0">
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="rounded-lg shadow-xl w-full h-[250px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {course.features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-indigo-600 text-2xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Key Topics */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Key Topics Covered</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.keyTopics.map((topic, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-100">
                <span className="text-gray-800">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="mt-16 bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">What You'll Learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.whatYouLearn.map((item, index) => (
              <div key={index} className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default SchoolCourseDetails;