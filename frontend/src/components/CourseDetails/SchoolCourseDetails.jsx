import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaBookReader, FaClock, FaChalkboardTeacher } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';

const SchoolCourseDetails = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingSpinner />;
  if (!course) return <div className="p-8 text-center">Course not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-12">
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
                  <FaChalkboardTeacher />
                  <span>Instructor: {course.instructor}</span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <FaClock />
                  <span>{course.duration} • {course.chapters} chapters</span>
                </div>
              </div>
              <Link 
                to={`/courses/${course.id}/learning`}
                className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                <FaPlay className="mr-2" /> Start Learning
              </Link>
            </div>
            <div className="relative">
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="rounded-lg shadow-xl w-full"
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
              <div className="text-blue-600 text-2xl mb-4">{feature.icon}</div>
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
  );
};

export default SchoolCourseDetails;