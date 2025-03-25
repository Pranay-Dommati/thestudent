import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaPlay, FaClock, FaUserGraduate, FaChartLine, FaCode, FaChevronDown, FaChevronUp, FaGlobe } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import Footer from '../Footer/Footer';
import { getEngineeringCourseById } from '../../services/courseApi';
import { toast } from 'react-hot-toast';

// Add this helper function at the top of your file
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `Updated ${date.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
};

const CourseDetails = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [openSections, setOpenSections] = useState({});
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        const courseData = await getEngineeringCourseById(courseId);
        
        // Format the duration to append "hours" if it's not already there
        const formattedDuration = courseData.duration.toLowerCase().includes('hours') 
          ? courseData.duration 
          : `${courseData.duration} hours`;

        setCourse({
          id: courseData.id,
          title: courseData.title,
          subtitle: courseData.short_description || courseData.title,
          instructor: {
            name: "Sources:",
            role: courseData.sources || "YouTube",
            company: "",
            avatar: "",
          },
          stats: {
            students: "0", // Removed as requested
            rating: 4.8,
            reviews: 0,
            lastUpdated: formatDate(courseData.last_updated)
          },
          keyFeatures: [
            { 
              icon: <FaUserGraduate />, 
              title: courseData.proficiency || "Beginner to Advanced", 
              text: "No prior experience needed" 
            },
            { 
              icon: <FaClock />, 
              title: formattedDuration, 
              text: "Self-paced learning" 
            },
            { 
              icon: <FaChartLine />, 
              title: courseData.project_based ? "Project-Based Learning" : "Practical Learning", 
              text: courseData.project_based ? "Build Real Projects" : "Hands-on Practice"
            },
            { 
              icon: <FaCode />, 
              title: "Coding Drills", 
              text: "Code along with guided exercises" 
            }
          ],
          thumbnail: courseData.thumbnail.startsWith('http') 
            ? courseData.thumbnail 
            : `${import.meta.env.VITE_API_URL}${courseData.thumbnail}`,
          previewImage: courseData.thumbnail.startsWith('http') 
            ? courseData.thumbnail 
            : `${import.meta.env.VITE_API_URL}${courseData.thumbnail}`,
          description: courseData.description,
          highlights: courseData.learning_points || [],
          curriculum: courseData.sections.map(section => ({
            title: section.name,
            lectures: section.lessons.map(lesson => ({
              title: lesson.title,
              duration: "" // Empty string since we're not showing duration
            }))
          })),
          requirements: courseData.requirements || []
        });
      } catch (error) {
        console.error('Error fetching course details:', error);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const handleStartLearning = () => {
    navigate(`/courses/engineering/${courseId}/learning`);
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div>Course not found</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="grid pt-8 grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                  <p className="text-xl text-gray-200">{course.subtitle}</p>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center">
                    <FaClock className="mr-2" />
                    {course.keyFeatures[1].title}
                  </span>
                  <span>•</span>
                  <span>{course.stats.lastUpdated}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <div className="flex items-center space-x-2">
                      <FaGlobe className="text-lg" />
                      <span>Sources: {course.instructor.role}</span>
                    </div>
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

              <div className="relative w-full h-[400px]"> {/* Fixed height container */}
                <img 
                  src={course.previewImage}
                  alt={course.title}
                  className="w-full h-full object-cover rounded-lg shadow-2xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-course-thumbnail.jpg'; // Add a default image path
                  }}
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
                <div className="text-blue-600 text-2xl mb-4">{feature.icon}</div>
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
                      <FaCode className="text-blue-600 mt-1" />
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
                {/* Course Curriculum */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {course.curriculum.map((section, index) => (
                    <div key={index} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => toggleSection(index)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <span className={`text-blue-600 transform transition-transform duration-200 ${
                              openSections[index] ? 'rotate-180' : ''
                            }`}>
                              <FaChevronDown className="w-4 h-4" />
                            </span>
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-lg text-gray-800">{section.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {section.lectures.length} lectures
                            </p>
                          </div>
                        </div>
                      </button>
                      
                      {openSections[index] && (
                        <div className="bg-gray-50 border-t border-gray-100">
                          {section.lectures.map((lecture, idx) => (
                            <div
                              key={idx}
                              className="px-6 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-blue-600 p-1.5 bg-blue-50 rounded-full">
                                  <FaPlay className="w-3 h-3" />
                                </span>
                                <span className="text-gray-700">{lecture.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Requirements Section */}
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <ul className="space-y-3">
                      {course.requirements.map((req, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                <div className="space-y-6">
                  {/* Rating Section */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-blue-600">{course.stats.rating}</span>
                      <div className="flex text-yellow-400">
                        {'★'.repeat(Math.floor(course.stats.rating))}
                        {'☆'.repeat(5 - Math.floor(course.stats.rating))}
                      </div>
                    </div>
                    <span className="text-gray-500">({course.stats.reviews} reviews)</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-gray-700">
                      <FaClock className="text-blue-600 text-lg" />
                      <span className="font-medium">Self-Paced Learning</span>
                    </div>
                    <div className="flex items-start space-x-3 text-gray-700">
                      <FaUserGraduate className="text-blue-600 text-lg mt-1" />
                      <span className="font-medium">Taught by Top YouTube Educational Creators</span>
                    </div>
                  </div>

                  {/* Enrollment Button */}
                  <button 
  onClick={handleStartLearning}
  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
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