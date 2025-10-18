import React, { useState, useEffect } from 'react';
// logger removed for production cleanliness
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import axios from '../../../utils/axios';
import universalToast from '../../../utils/universalToast';
import { FaTrash } from 'react-icons/fa';
import { stateNameToCode } from '../../../utils/stateMapping';

// Use shared axios instance with baseURL
const COURSES_PER_PAGE = 4; // Show 4 courses initially

const ActiveCourses = ({ onEnrollmentChanged }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [showAll, setShowAll] = useState(false);
  const [removingCourseId, setRemovingCourseId] = useState(null);
  const [confirmState, setConfirmState] = useState({ visible: false, enrollmentId: null, courseTitle: '' });
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/courses/enrolled/`);

  

        if (response.data.success) {
          // Format the courses for display
          const formattedCourses = response.data.courses.map(enrollment => {
            const course = enrollment.school_course || enrollment.engineering_course;
            const courseType = enrollment.school_course ? 'school' : 'engineering';
            
            // Debug course data
            
            
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
              const subject = enrollment.subject || course?.subject || '';
              // Use enrollment.board first; fallback to nested course.board
              const boardRaw = (enrollment.board && String(enrollment.board)) || (course?.board ? String(course.board) : '');
              if (boardRaw === 'state') {
                // When state board, include the state code segment in the route
                const stateName = course?.state || '';
                let stateCode = stateNameToCode(stateName);
                if (!stateCode) {
                  // safe slug fallback from the name
                  stateCode = String(stateName).toLowerCase().replace(/\s+/g, '-');
                }
                courseUrl = `/courses/${classLevel}/state/${stateCode}/${subject}`;
              } else {
                const board = boardRaw || 'cbse'; // final fallback to keep URL valid
                courseUrl = `/courses/${classLevel}/${board}/${subject}`;
              }
            } else {
              // Engineering courses use course ID
              courseUrl = `/courses/engineering/${course.id}`;
            }

            // Use the thumbnail URL directly from the API (backend should handle absolute URLs)
            const imageUrl = course.thumbnail || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80";
            
            

            // Board label for display with fallbacks
            let boardLabel;
            if (courseType === 'school') {
              const effectiveBoard = (enrollment.board || course?.board || '').toString();
              if (effectiveBoard === 'state' && course?.state) {
                boardLabel = `${course.state} State Board`;
              } else {
                boardLabel = effectiveBoard || 'CBSE';
              }
            } else {
              boardLabel = course.category;
            }

            return {
              id: course.id,
              enrollmentId: enrollment.id,
              title: course.title,
              subject: course.subject,
              board: boardLabel,
              class: courseType === 'school' ? enrollment.class_level : `${course.proficiency} Level`,
              thumbnail: imageUrl,
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
  // silently handle in production
        if (error.response?.status !== 401) {
          universalToast.error('Failed to load enrolled courses');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [isLoggedIn]);

  const handleSortChange = () => {
    
    const newSort = sortBy === 'recent' ? 'alphabetical' : 'recent';
    setSortBy(newSort);
    
  universalToast.success(`Sorted by ${newSort === 'recent' ? 'Recent' : 'Alphabetical'}`);
  };

  const handleViewAll = () => {
    
    setShowAll(!showAll);
    
  universalToast.success(`${showAll ? 'Showing limited courses' : 'Showing all courses'}`);
  };

  const handleRemoveCourse = async (enrollmentId, courseTitle) => {
    setRemovingCourseId(enrollmentId);
    
    try {
      await axios.delete(`/courses/enrollment/${enrollmentId}/`);

      // Compute new count synchronously from current state
      const nextCount = Math.max(0, (enrolledCourses?.length || 1) - 1);

      // Remove the course from the local state
      setEnrolledCourses(prev => prev.filter(course => course.enrollmentId !== enrollmentId));
  universalToast.success(`Successfully removed "${courseTitle}" from your courses`);
      // Notify parent (prefer exact count) and emit a custom event so other parts can react
      try {
        onEnrollmentChanged && onEnrollmentChanged({ delta: -1, count: nextCount, enrollmentId });
      } catch (_) {}
      try {
        const evt = new CustomEvent('enrollment-changed', { detail: { delta: -1, count: nextCount, enrollmentId } });
        window.dispatchEvent(evt);
      } catch (_) {}
    } catch (error) {
  
      if (error.response?.status === 404) {
  universalToast.error('Course enrollment not found');
      } else {
  universalToast.error('Failed to remove course. Please try again.');
      }
    } finally {
      setRemovingCourseId(null);
      setConfirmState({ visible: false, enrollmentId: null, courseTitle: '' });
    }
  };

  const askRemoveCourse = (enrollmentId, courseTitle) => {
    setConfirmState({ visible: true, enrollmentId, courseTitle });
  };

  const cancelConfirm = () => setConfirmState({ visible: false, enrollmentId: null, courseTitle: '' });

  // Close confirmation on Escape key for accessibility/UX
  useEffect(() => {
    if (!confirmState.visible) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        cancelConfirm();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmState.visible]);

  // Lock background scroll on small devices when modal is open
  useEffect(() => {
    if (confirmState.visible) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
  }, [confirmState.visible]);

  // Apply sorting and filtering
  const processedCourses = React.useMemo(() => {
    let courses = [...enrolledCourses];
    
    // Sort courses
    if (sortBy === 'alphabetical') {
      courses.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Sort by recent (newest enrollments first)
      courses.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
    }
    
    return courses;
  }, [enrolledCourses, sortBy]);

  // Get courses to display (with pagination)
  const coursesToDisplay = showAll ? processedCourses : processedCourses.slice(0, COURSES_PER_PAGE);
  const hasMoreCourses = processedCourses.length > COURSES_PER_PAGE;

  const activeCourses = coursesToDisplay;

  return (
    <>
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Enrolled Courses</h2>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative group">
            <button 
              onClick={handleSortChange}
              className="font-medium text-gray-500 hover:text-indigo-600 flex items-center transition-colors cursor-pointer relative z-10"
              style={{ pointerEvents: 'auto' }}
              type="button"
            >
              <span>Sort by: {sortBy === 'recent' ? 'Recent' : 'Alphabetical'}</span>
              <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <span className="hidden sm:inline text-gray-300">|</span>
          <button 
            onClick={handleViewAll}
            className="font-medium text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer relative z-10"
            style={{ pointerEvents: 'auto' }}
            type="button"
          >
            {showAll ? 'Show less' : 'View all'}
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
        <>
          {/* Course Grid with Properly Sized Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {activeCourses.map((course) => (
              <div key={course.enrollmentId} className="group bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative flex flex-col h-80">

                {/* Course Image - Increased Height */}
                <Link to={course.courseUrl} className="block relative overflow-hidden flex-shrink-0">
                  <div className="h-40 bg-gray-100">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        
                        e.target.onerror = null;
                        
                        const fallbackImages = [
                          "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                          "https://via.placeholder.com/400x240/6366f1/ffffff?text=Course+Image"
                        ];
                        
                        const currentIndex = fallbackImages.indexOf(e.target.src);
                        const nextIndex = currentIndex + 1;
                        
                        if (nextIndex < fallbackImages.length) {
                          e.target.src = fallbackImages[nextIndex];
                        } else {
                          e.target.src = fallbackImages[fallbackImages.length - 1];
                        }
                      }}
                      onLoad={() => {}}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
                </Link>

                {/* Course Content - Reduced Spacing */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div className="flex-1">
                    <Link to={course.courseUrl} className="group-hover:text-indigo-600 transition-colors">
                      <h3 className="font-semibold text-base line-clamp-2 mb-1">{course.title}</h3>
                    </Link>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="truncate">{course.board}</span>
                      <span className="mx-1">•</span>
                      <span className="truncate">{course.class}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-0">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                        <span>Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div 
                          className={`rounded-full h-1.5 transition-all duration-300 ${
                            course.progress < 30 ? 'bg-blue-500' : 
                            course.progress < 70 ? 'bg-indigo-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs text-gray-500 truncate">Enrolled {course.lastAccessed}</span>
                      <div className="flex items-center gap-2">
                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            askRemoveCourse(course.enrollmentId, course.title);
                          }}
                          className="w-7 h-7 bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-500 rounded-md flex items-center justify-center transition-all duration-200 shadow-sm"
                          title="Remove from enrolled courses"
                          disabled={removingCourseId === course.enrollmentId}
                        >
                          {removingCourseId === course.enrollmentId ? (
                            <div className="w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <FaTrash className="text-xs" />
                          )}
                        </button>
                        
                        {/* Start/Continue Button */}
                        <Link 
                          to={course.learningUrl}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 
                          transition-colors flex items-center justify-center group-hover:shadow-md cursor-pointer relative z-10 flex-shrink-0"
                          style={{ pointerEvents: 'auto' }}
                          onClick={(e) => {}}
                        >
                          {course.progress > 0 ? 'Continue' : 'Start'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMoreCourses && !showAll && (
            <div className="text-center mt-6">
              <button
                onClick={handleViewAll}
                className="inline-flex items-center justify-center h-11 min-h-[44px] px-5 rounded-full border border-indigo-200 text-indigo-700 bg-white/80 backdrop-blur-sm hover:bg-white 
                           transition-all duration-200 font-medium text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                Load More Courses ({processedCourses.length - COURSES_PER_PAGE} remaining)
              </button>
            </div>
          )}

          {/* Show Less Button */}
          {showAll && hasMoreCourses && (
            <div className="text-center mt-6">
              <button
                onClick={handleViewAll}
                className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm hover:shadow-md text-sm"
              >
                Show Less
              </button>
            </div>
          )}
        </>
      ) : (
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
              transition-all duration-200 hover:shadow-lg active:transform active:scale-95 border border-indigo-700"
              style={{ 
                pointerEvents: 'auto',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 50
              }}
              onClick={(e) => {
                // Ensure navigation happens
                e.stopPropagation();
              }}
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
    {confirmState.visible && (
      <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/40" onClick={cancelConfirm} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove enrolled course?</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to remove 
                <span className="font-medium text-gray-900"> "{confirmState.courseTitle}"</span> from your enrolled courses?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={cancelConfirm}
                className="px-4 py-2 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveCourse(confirmState.enrollmentId, confirmState.courseTitle)}
                disabled={removingCourseId === confirmState.enrollmentId}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {removingCourseId === confirmState.enrollmentId ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ActiveCourses;