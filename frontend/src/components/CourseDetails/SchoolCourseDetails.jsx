import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaPlay, FaBookReader, FaClock, FaChalkboardTeacher, FaGlobe } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';

const API_URL = 'http://localhost:8000';

const SchoolCourseDetails = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { boardId, stateId, subjectId } = useParams();

  // Define subject icons mapping
  const SUBJECT_ICONS = {
    'Mathematics': '📐',
    'Physics': '🔬',
    'Chemistry': '⚗️',
    'Biology': '🧬',
    'English': '📚',
    'Hindi': '📖',
    'Social Science': '🌍',
    'Science': '🔬',
    'Computer Science': '💻',
    'General': '📘'
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        // Extract parameters from the URL
        const classLevel = location.pathname.includes('/10th/') ? '10th' : 
                          location.pathname.includes('/11th/') ? '11th' : '12th';
        const board = boardId || '';
        const subject = subjectId || '';
        const state = stateId || '';

        console.log('Fetching course with params:', { classLevel, board, subject, state });
        
        // Build API URL to fetch courses matching the parameters
        let apiUrl = `${API_URL}/api/courses/school/?class=${classLevel}&board=${board}`;
        if (state && board === 'state') {
          // Handle different state name formats
          const stateValue = state === 'ts' ? 'Telangana' : 
                           state === 'ap' ? 'Andhra Pradesh' : state;
          apiUrl += `&state=${stateValue}`;
        }
        
        console.log('API URL:', apiUrl);
        
        // Fetch courses matching these parameters
        const response = await axios.get(apiUrl);
        console.log('API response:', response.data);
        
        // Find the course matching the subject
        let courseData = null;
        if (response.data && Array.isArray(response.data)) {
          courseData = response.data.find(c => 
            c.subject.toLowerCase() === subject.toLowerCase()
          );
          console.log('Found matching course:', courseData);
        }
        
        if (!courseData) {
          console.warn('No matching course found');
          throw new Error('Course not found');
        }
        
        // Format the board display value properly
        let displayBoard = courseData.board.toUpperCase();
        if (courseData.board === 'state' && courseData.state) {
          // For state boards, show state name instead of just "STATE"
          const stateName = courseData.state;
          displayBoard = `${stateName} State Board`;
        }
        
        // Get number of chapters (sections) for this course
        let chapterCount = 0;
        if (courseData.chapters && Array.isArray(courseData.chapters)) {
          chapterCount = courseData.chapters.length;
        }
        
        // Format the course data for display
        const formattedCourse = {
          id: courseData.id,
          title: courseData.title,
          subject: courseData.subject,
          board: displayBoard,
          class: classLevel,
          lastUpdated: courseData.last_updated ? new Date(courseData.last_updated).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long'
          }) : "Recently updated",
          // Static features as requested
          features: [
            { icon: <FaChalkboardTeacher />, title: "Expert Teachers", desc: "Learn from experienced educators" },
            { icon: <FaBookReader />, title: "Structured Learning", desc: "Well-organized chapter-wise content" },
            { icon: <FaClock />, title: "Self-Paced", desc: "Learn at your own convenience" }
          ],
          keyTopics: courseData.key_topics || ["No topics available"],
          whatYouLearn: courseData.learning_points || ["No learning points available"],
          // Use duration from database, but show as "X+ hours"
          duration: courseData.duration || "20",
          chapters: chapterCount,
          sources: courseData.sources || "YouTube",
          // Use the actual thumbnail path from the database
          thumbnail: courseData.thumbnail,
          icon: SUBJECT_ICONS[courseData.subject] || '📚'
        };
        
        setCourse(formattedCourse);
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course details');
        
        // Fallback to dummy data in case of error
        const classLevel = location.pathname.includes('/10th/') ? '10th' : 
                         location.pathname.includes('/11th/') ? '11th' : '12th';
        const board = boardId || '';
        const subject = subjectId || '';
        
        setCourse({
          id: 1,
          title: `${classLevel.toUpperCase()} ${board.toUpperCase()} ${subject}`,
          subject: subject,
          board: board.toUpperCase(),
          class: classLevel,
          lastUpdated: "April 2025",
          features: [
            { icon: <FaChalkboardTeacher />, title: "Expert Teachers", desc: "Learn from experienced educators" },
            { icon: <FaBookReader />, title: "Structured Learning", desc: "Well-organized chapter-wise content" },
            { icon: <FaClock />, title: "Self-Paced", desc: "Learn at your own convenience" }
          ],
          keyTopics: ["Real Numbers", "Polynomials", "Coordinate Geometry", "Triangles", "Statistics"],
          whatYouLearn: [
            "Master fundamental mathematical concepts",
            "Solve complex problems step by step",
            "Practice with previous year questions",
            "Prepare effectively for board exams"
          ],
          duration: "40",
          chapters: 15,
          sources: "YouTube",
          thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
          icon: SUBJECT_ICONS[subject] || '📚'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [location.pathname, boardId, stateId, subjectId]);

  const handleStartLearning = () => {
    navigate(`${location.pathname}/learning`);
  };

  if (loading) return <LoadingSpinner />;
  
  if (!course) return <div className="p-8 text-center">Course not found</div>;

  return (
    <>
    <Navbar />
    
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid pt-8 grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                <div className="flex flex-wrap items-center space-x-4 text-gray-200 mb-6">
                  <span>{course.board}</span>
                  <span>•</span>
                  <span>{course.class} Standard</span>
                  <span>•</span>
                  <span>{course.subject}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center space-x-4 text-sm">
                <span className="flex items-center">
                  <FaChalkboardTeacher className="mr-2" />
                  Expert Teachers
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <FaClock className="mr-2" />
                  {course.duration}+ hours
                </span>
                <span>•</span>
                <span>Updated {course.lastUpdated}</span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <FaGlobe className="text-lg" />
                  <span>Sources : {course.sources}</span>
                </div>
              </div>

              <button 
                onClick={handleStartLearning}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-lg font-medium flex items-center space-x-2 transform transition hover:scale-105"
              >
                <FaPlay className="mr-2" />
                Start Learning Now
              </button>
            </div>
            
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img 
                src={course.thumbnail} 
                alt={course.title} 
                className="w-full h-[350px] object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        
        {/* Course Features - Static as requested */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {course.features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm flex items-start">
              <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 mr-4">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Key Topics - Dynamic from database */}
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

        {/* What You'll Learn - Dynamic from database */}
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

        {/* Add CTA button at the bottom of the page */}
        <div className="mt-16 text-center">
          <button 
            onClick={handleStartLearning}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-lg font-medium flex items-center justify-center space-x-2 transform transition hover:scale-105 shadow-lg mx-auto"
          >
            <FaPlay className="mr-2" />
            Start Learning Now
          </button>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default SchoolCourseDetails;