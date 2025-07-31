import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const ActiveCourses = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/api/courses/enrolled/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Enrolled courses response:', response.data);

        if (response.data.success) {
          // Format the courses for display
          const formattedCourses = response.data.courses.map(enrollment => {
            const course = enrollment.school_course || enrollment.engineering_course;
            const courseType = enrollment.school_course ? 'school' : 'engineering';
            
            // Calculate time since enrollment for "last accessed"
            const startedDate = new Date(enrollment.started_at);
            const now = new Date();
            const daysDiff = Math.floor((now - startedDate) / (1000 * 60 * 60 * 24));
            const lastAccessed = daysDiff === 0 ? 'Today' : 
                               daysDiff === 1 ? 'Yesterday' : 
                               `${daysDiff} days ago`;

            // Build course URL based on type
            let courseUrl = '';
            if (courseType === 'school') {
              const classLevel = enrollment.class_level;
              const board = enrollment.board;
              const subject = enrollment.subject;
              courseUrl = `/courses/${classLevel}/${board}/${subject}`;
            } else {
              courseUrl = `/courses/engineering/${course.category}/${course.proficiency}`;
            }

            return {
              id: course.id,
              enrollmentId: enrollment.id,
              title: course.title,
              subject: course.subject,
              board: courseType === 'school' ? enrollment.board : course.category,
              class: courseType === 'school' ? enrollment.class_level : `${course.proficiency} Level`,
              thumbnail: course.thumbnail || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
              progress: enrollment.progress_percentage || 0,
              timeLeft: "Not calculated",
              lastAccessed: lastAccessed,
              courseType: courseType,
              courseUrl: courseUrl,
              learningUrl: `${courseUrl}/learning`
            };
          });

          setEnrolledCourses(formattedCourses);
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        if (error.response?.status !== 401) {
          toast.error('Failed to load enrolled courses');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [isLoggedIn]);

  const activeCourses = enrolledCourses;

  return (
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Enrolled Courses</h2>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative group">
            <button className="font-medium text-gray-500 hover:text-indigo-600 flex items-center">
              <span>Sort by: Recent</span>
              <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <span className="hidden sm:inline text-gray-300">|</span>
          <button className="font-medium text-gray-500 hover:text-indigo-600">
            View all
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-6 sm:p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading your courses...</p>
        </div>
      ) : !isLoggedIn ? (
        <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-xl">
          <div className="max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Please Login</h3>
            <p className="text-base text-gray-600 mb-6">Login to see your enrolled courses and continue learning.</p>
            <Link 
              to="/auth?mode=login" 
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 
              transition-all duration-200 hover:shadow-lg active:transform active:scale-95"
            >
              Login Now
            </Link>
          </div>
        </div>
      ) : activeCourses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeCourses.map((course) => (
            <div key={course.enrollmentId} className="group border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
              <div className="flex flex-col sm:flex-row">
                <Link to={course.courseUrl} className="block sm:w-1/3 relative overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="h-48 sm:h-full w-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
                </Link>
                <div className="flex-1 flex flex-col p-4 sm:p-5">
                  <div>
                    <Link to={course.courseUrl} className="group-hover:text-indigo-600 transition-colors">
                      <h3 className="font-bold text-base sm:text-lg line-clamp-2 mb-1">{course.title}</h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-1">{course.board} • {course.class}</p>
                    <p className="text-gray-500 text-xs mb-3">{course.subject}</p>
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                        <span>Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`rounded-full h-2 transition-all duration-300 ${
                            course.progress < 30 ? 'bg-blue-500' : 
                            course.progress < 70 ? 'bg-indigo-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
                      <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                        <span>Enrolled {course.lastAccessed}</span>
                      </div>
                      <Link 
                        to={course.learningUrl}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 
                        transition-colors flex items-center justify-center sm:justify-start group-hover:shadow-md"
                      >
                        {course.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>      ) : (
        <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-xl">
          <div className="max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4 transform transition-transform hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Enrolled Courses Yet</h3>
            <p className="text-base text-gray-600 mb-6">Ready to start your learning journey? Browse our courses and enroll in the ones that interest you.</p>
            <Link 
              to="/courses" 
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 
              transition-all duration-200 hover:shadow-lg active:transform active:scale-95"
            >
              <span>Browse Courses</span>
              <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};

export default ActiveCourses;