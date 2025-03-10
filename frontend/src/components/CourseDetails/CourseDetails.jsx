import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlay, FaClock, FaUserGraduate, FaChartLine, FaAward, FaCode } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import Footer from '../Footer/Footer';

const CourseDetails = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCourse({
        id: 1,
        title: "Master Next.js: From Zero to Production",
        subtitle: "Build modern, production-ready web applications with Next.js and React",
        instructor: {
          name: "John Doe",
          role: "Senior Software Engineer",
          company: "Tech Solutions Inc.",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300",
          bio: "10+ years of experience in web development and teaching"
        },
        stats: {
          students: "12,345",
          rating: 4.8,
          reviews: 2156,
          lastUpdated: "December 2024"
        },
        keyFeatures: [
          { icon: <FaUserGraduate />, title: "Beginner to Advanced", text: "No prior experience needed" },
          { icon: <FaClock />, title: "56 Hours", text: "Self-paced learning" },
          { icon: <FaChartLine />, title: "Real Projects", text: "Build 5 production apps" },
          { icon: <FaAward />, title: "Certificate", text: "Upon completion" }
        ],
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
        previewImage: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800",
        description: "This comprehensive course takes you from the basics of Next.js to deploying production-ready applications. Learn through practical examples and real-world projects.",
        highlights: [
          "Master Next.js fundamentals and advanced concepts",
          "Build scalable and performant applications",
          "Learn best practices and design patterns",
          "Deploy applications to production",
          "Implement authentication and authorization",
          "Handle API routes and server-side rendering"
        ],
        curriculum: [
          {
            title: "Getting Started",
            lessons: [
              { title: "Introduction to Next.js", duration: "15:00" },
              { title: "Setting Up Your Environment", duration: "20:00" },
              { title: "Your First Next.js App", duration: "30:00" }
            ]
          },
          // ...more sections
        ]
      });
      setLoading(false);
    }, 800);
  }, [courseId]);

  const handleStartLearning = () => {
    navigate(`/courses/engineering/${course.id}/learning`);
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div>Course not found</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="grid pt-8 grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                  <p className="text-xl text-gray-200">{course.subtitle}</p>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center">
                    <FaUserGraduate className="mr-2" />
                    {course.stats.students} students
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <FaClock className="mr-2" />
                    {course.keyFeatures[1].title}
                  </span>
                  <span>•</span>
                  <span>Updated {course.stats.lastUpdated}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <img 
                    src={course.instructor.avatar} 
                    alt={course.instructor.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{course.instructor.name}</p>
                    <p className="text-sm text-gray-300">{course.instructor.role} at {course.instructor.company}</p>
                  </div>
                </div>

                <button 
                  onClick={handleStartLearning}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-lg font-medium flex items-center space-x-2 transform transition hover:scale-105"
                >
                  <FaPlay />
                  <span>Start Learning Now</span>
                </button>
              </div>

              <div className="relative">
                <img 
                  src={course.previewImage}
                  alt="Course Preview"
                  className="rounded-lg shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Features */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {course.keyFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-indigo-600 text-2xl mb-4">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Course Description */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <FaCode className="text-indigo-600 mt-1" />
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
                <div className="space-y-4">
                  {course.curriculum.map((section, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm">
                      <div className="p-4 border-b">
                        <h3 className="font-bold">{section.title}</h3>
                      </div>
                      <div className="p-4">
                        {section.lessons.map((lesson, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <FaPlay className="text-indigo-600 text-sm" />
                              <span>{lesson.title}</span>
                            </div>
                            <span className="text-sm text-gray-500">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-indigo-600">{course.stats.rating}</span>
                      <div className="flex text-yellow-400">
                        {'★'.repeat(Math.floor(course.stats.rating))}
                        {'☆'.repeat(5 - Math.floor(course.stats.rating))}
                      </div>
                    </div>
                    <span className="text-gray-500">({course.stats.reviews} reviews)</span>
                  </div>
                  
                  <button 
                    onClick={handleStartLearning}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium"
                  >
                    Enroll Now - Free
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetails;