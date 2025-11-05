import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
// logger removed for production cleanliness
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { FaBrain, FaPlay, FaCheckCircle, FaClock, FaChartLine, FaTrash, FaEllipsisV, FaSpinner } from 'react-icons/fa';
import { IoShareSocial } from 'react-icons/io5';
import universalToast from '../../../utils/universalToast';
import ShareCourseButton from '../../Shared/ShareCourseButton.jsx';

// Use axios baseURL and dev proxy

const AILearningPlans = () => {
  const navigate = useNavigate();
  const [proCourses, setProCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, course: null });

  const COURSES_TO_SHOW = 6;

  // Simple session cache to speed up UI. Stored shape: { ts: number, data: Array }
  const CACHE_KEY = 'ai_pro_courses_cache_v1';
  const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
  const isFetchingRef = useRef(null); // holds in-flight promise

  const readCache = () => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || !Array.isArray(parsed.data)) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  };

  const writeCache = (data) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (_) {}
  };

  const refreshCourses = useCallback((force = false) => {
    fetchProCourses(force);
  }, []);

  useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);

  // Lightweight realtime refresh: listen to custom events and storage changes (no polling)
  useEffect(() => {
    // Force refresh when these events indicate backend changes or page becomes active
    const onSaved = () => refreshCourses(true);
    const onStorage = (e) => {
      if (e && typeof e.key === 'string' && (e.key.startsWith('proLearning_') || e.key === 'coursesSavedToHub')) {
        refreshCourses(true);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshCourses(true);
    };
    const onFocus = () => refreshCourses(true);
  const onLearningActivity = () => refreshCourses(true); // progress may change after activity updates
  const onLearningProgress = () => refreshCourses(true); // explicit lesson/topic progress event
    window.addEventListener('prolearning:course-saved', onSaved);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
  window.addEventListener('learning:activity-updated', onLearningActivity);
  window.addEventListener('learning:progress-updated', onLearningProgress);
    return () => {
      window.removeEventListener('prolearning:course-saved', onSaved);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('learning:activity-updated', onLearningActivity);
      window.removeEventListener('learning:progress-updated', onLearningProgress);
    };
  }, [refreshCourses]);

  const fetchProCourses = async (force = false) => {
    // If we have a fresh cache and not forcing, use it instantly
    try {
      const cached = readCache();
      if (!force && cached && (Date.now() - cached.ts) < CACHE_TTL) {
        setProCourses(cached.data);
        setLoading(false);
        // still consider returning early; avoid network call
        return cached.data;
      }
    } catch (_) {}

    // Deduplicate in-flight requests
    if (isFetchingRef.current && !force) {
      try {
        const result = await isFetchingRef.current;
        return result;
      } catch (e) {
        // continue to attempt fetch below
      }
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    setLoading(true);
    const p = (async () => {
      try {
        const response = await axios.get(`/courses/pro-learning/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data.results || response.data || [];
        setProCourses(data);
        writeCache(data);
        setError(null);
        return data;
      } catch (error) {
        if (error.response?.status === 401) {
          setError('Please log in to view your AI-created courses');
        } else {
          setError('Failed to load AI-created courses');
        }
        throw error;
      } finally {
        setLoading(false);
      }
    })();

    isFetchingRef.current = p;
    try {
      const res = await p;
      return res;
    } finally {
      isFetchingRef.current = null;
    }
  };

  const handleStartCourse = async (courseId, courseName) => {
  
    try {
      // Add loading toast
  universalToast.loading(`Loading ${courseName}...`, { id: `loading-${courseId}` });
      
      // Optional: Check if course is accessible before navigation
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`/courses/pro-learning/${courseId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        universalToast.success('Course loaded successfully!', { id: `loading-${courseId}` });
        // Open in a new tab for a friendlier experience
        try {
          window.open(`/pro-learning/${courseId}`, '_blank', 'noopener');
        } catch (_) {
          // Fallback to same-tab navigation if popup blocked
          navigate(`/pro-learning/${courseId}`);
        }
      }
    } catch (error) {
  
      if (error.response?.status === 404) {
  universalToast.error('Course not found. It may have been deleted.', { id: `loading-${courseId}` });
        // Refresh the course list
        fetchProCourses();
      } else if (error.response?.status === 401) {
  universalToast.error('Please log in to access this course.', { id: `loading-${courseId}` });
      } else {
  universalToast.error('Failed to load course. Please try again.', { id: `loading-${courseId}` });
      }
    }
  };

  const handleDeleteClick = (course) => {
    setDeleteConfirm({ show: true, course });
  };

  const confirmDelete = async () => {
    const course = deleteConfirm.course;
    if (!course) return;

    setDeleteLoading(course.id);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/courses/pro-learning/${course.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Remove the deleted course from state
      const updated = proCourses.filter(c => c.id !== course.id);
      setProCourses(updated);
      // Update cache so the UI remains consistent if user switches tabs
      writeCache(updated);
      
      universalToast.success(`"${formatCourseName(course)}" has been deleted successfully`);
      try {
        const ev = new CustomEvent('prolearning:course-deleted', { detail: { id: course.id, name: formatCourseName(course) } });
        window.dispatchEvent(ev);
      } catch {}
    } catch (error) {
      universalToast.error('Failed to delete course. Please try again.');
    } finally {
      setDeleteLoading(null);
      setDeleteConfirm({ show: false, course: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, course: null });
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!deleteConfirm.show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev || ''; };
  }, [deleteConfirm.show]);

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCourseName = (course) => {
    if (!course) return 'Untitled Course';
    const isIdLike = typeof course.course_name === 'string' && /^course_[a-z0-9_]+$/i.test(course.course_name);
    const isGenericTitle = (t) => !t || /^(AI Course:|AI Generated Course:?|ProLearning Course|Generated Course|Database Course)$/i.test(String(t).trim());
    // Prefer a non-generic title
    if (course.title && !isGenericTitle(course.title) && course.title !== course.course_name) {
      return String(course.title).trim();
    }
    // If course_name isn't an internal ID and looks fine, use it after cleaning prefixes
    let base = !isIdLike && course.course_name ? String(course.course_name) : '';
    base = base
      .replace(/^AI Course:\s*/i, '')
      .replace(/^AI Generated Course:\s*/i, '')
      .replace(/^AI Generated Course$/i, '')
      .replace(/^AI\s+/i, '')
      .trim();
    if (base && base.toLowerCase() !== 'course') {
      return base;
    }
    // As a last resort, try topic-based name if topics are provided on this page in future
    if (Array.isArray(course.topics) && course.topics.length > 0) {
      const names = course.topics.map(t => (t.topic_name || t.name || '').trim()).filter(Boolean);
      if (names.length > 0) {
        const first = names[0];
        const additional = Math.max(0, names.length - 1);
        if (additional === 0) return first;
        if (additional === 1) return `${first} +1`;
        if (additional === 2) return `${first} +1 +2`;
        if (additional === 3) return `${first} +1 +2 +3`;
        return `${first} +1 +2 +3 +...`;
      }
    }
    return 'Untitled Course';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading your AI-created courses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchProCourses}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (proCourses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <FaBrain className="text-2xl mx-auto mb-2" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Courses</h3>
        <p className="text-gray-500 text-sm mb-6">
          Create your first AI-powered course
        </p>
        <Link 
          to="/chat"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          style={{ 
            pointerEvents: 'auto',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Create Course
        </Link>
      </div>
    );
  }

  const coursesToDisplay = showMore ? proCourses : proCourses.slice(0, COURSES_TO_SHOW);

  // Debug logging for Load More functionality
  

  return (
    <>
      {/* Course List */}
      <div className="space-y-2">
        {coursesToDisplay.map((course) => (
          <div 
            key={course.id} 
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center justify-between">
              {/* Left: Course Info */}
              <div className="flex items-center flex-1 min-w-0 mr-4">
                <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0">
                  <FaBrain className="text-blue-600 text-sm" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate" style={{ userSelect: 'text', cursor: 'text' }}>
                    {formatCourseName(course)}
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5" style={{ userSelect: 'text', cursor: 'text' }}>
                    <span className={course.is_completed ? 'text-green-600' : 'text-blue-600'}>
                      {course.is_completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Progress & Actions */}
              <div className="flex items-center space-x-4 flex-shrink-0 relative z-10" style={{ pointerEvents: 'auto' }}>
                {/* Progress */}
                <div className="text-xs text-gray-500 font-medium" style={{ userSelect: 'text', cursor: 'text' }}>
                  {Math.round(course.completion_percentage || 0)}%
                </div>
                
                {/* Start Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStartCourse(course.id, formatCourseName(course));
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center relative z-10"
                  style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative' }}
                  type="button"
                >
                  <FaPlay className="mr-1 text-[10px]" />
                  Start
                </button>
                
                {/* Share Button */}
                <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
                  <ShareCourseButton
                    courseId={course.id}
                    courseTitle={formatCourseName(course)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors relative z-10"
                    title="Share course"
                    preventDefault
                  />
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteClick(course);
                  }}
                  disabled={deleteLoading === course.id}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded transition-colors relative z-10"
                  title="Delete"
                  style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative' }}
                  type="button"
                >
                  {deleteLoading === course.id ? (
                    <FaSpinner className="text-sm animate-spin" />
                  ) : (
                    <FaTrash className="text-sm" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {proCourses.length > COURSES_TO_SHOW && (
        <div className="mt-4">
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showMore ? 'Show Less' : `Show ${proCourses.length - COURSES_TO_SHOW} More`}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && createPortal((
        <div
          className="fixed inset-0 bg-transparent flex items-center justify-center z-[1000] p-4"
          style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', backgroundColor: 'transparent' }}
          onClick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}
        >
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Course</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{formatCourseName(deleteConfirm.course)}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading === deleteConfirm.course?.id}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleteLoading === deleteConfirm.course?.id ? (
                  <>
                    <FaSpinner className="animate-spin mr-1 text-xs" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
};

export default AILearningPlans;