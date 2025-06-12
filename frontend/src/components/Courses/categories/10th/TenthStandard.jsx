import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaBookReader } from 'react-icons/fa';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { stateBoards } from '../../data/states';
import { getSchoolCourses } from '../../../../services/courseApi';

const SUBJECT_ICONS = {
  'Mathematics': '📐',
  'Physics': '🔬',
  'Chemistry': '⚗️',
  'Biology': '🧬',
  'English': '📚',
  'Hindi': '📖',
  'Social': '🌍',
  'Science': '🔬',
  'Computer Science': '💻',
  'General': '📘'
};

const boards = [
  { 
    id: 'cbse', 
    name: 'CBSE',
    fullName: 'Central Board of Secondary Education',
    available: true
  },
  { 
    id: 'state', 
    name: 'State Board',
    fullName: 'State Board of Secondary and Higher Secondary Education',
    available: true
  }
];

const TenthStandard = () => {
  const navigate = useNavigate();
  const { boardId, stateId } = useParams();
  const location = useLocation();
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [showStateBoards, setShowStateBoards] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Set selected board based on URL
  useEffect(() => {
    if (location.pathname.includes('/state/')) {
      setSelectedBoard(`state-${stateId}`);
    } else if (location.pathname.includes('/cbse')) {
      setSelectedBoard('cbse');
    }
  }, [location, stateId]);

  // Fetch courses when board/state is selected
  useEffect(() => {
    if (selectedBoard) {
      const fetchCourses = async () => {
        setLoading(true);
        try {
          let data;

          if (selectedBoard === 'state' || selectedBoard.startsWith('state-')) {
            // For state boards, extract the state code
            const stateCode = selectedBoard.replace('state-', '') || stateId;
            
            // Map state codes to full state names as stored in database
            const stateValue = stateCode === 'ts' ? 'Telangana' : 
                             stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;
            
            console.log(`Fetching state board courses: class=10th, board=state, state=${stateValue}`);
            data = await getSchoolCourses('10th', 'state', stateValue);
          } else {
            console.log(`Fetching courses: class=10th, board=${selectedBoard}`);
            data = await getSchoolCourses('10th', selectedBoard);
          }

          console.log('API returned courses:', data);

          // Filter courses for exact matches but do not double-filter by board
          // since the API should already return correct board courses
          const filteredCourses = data.filter(course => {
            const classMatch = course.class_level === '10th';
            
            // For state boards, strictly match the state name
            let stateMatch = true;
            if (selectedBoard.startsWith('state-')) {
              const stateCode = selectedBoard.replace('state-', '') || stateId;
              const stateValue = stateCode === 'ts' ? 'Telangana' : 
                               stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;
              stateMatch = course.state === stateValue;
            }
            
            console.log(`Filtering course:`, {
              course: course.title,
              class: course.class_level,
              board: course.board,
              state: course.state,
              matches: {
                class: classMatch,
                board: true, // We trust the API to return correct board
                state: stateMatch
              }
            });

            return classMatch && stateMatch;
          });

          console.log('Filtered courses:', filteredCourses);
          setCourses(filteredCourses);
        } catch (error) {
          console.error("Error fetching courses:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCourses();
    }
  }, [selectedBoard, stateId]);

  const handleBoardSelect = (board) => {
    if (board === 'state') {
      setShowStateBoards(true);
    } else {
      navigate(`/courses/10th/${board}`);
    }
  };

  const handleStateSelect = (stateId) => {
    navigate(`/courses/10th/state/${stateId}`);
    setShowStateBoards(false);
  };

  const handleBack = () => {
    if (showStateBoards) {
      setShowStateBoards(false);
    } else if (selectedBoard) {
      setSelectedBoard(null);
    } else {
      navigate('/courses');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-16 sm:pt-20">
      {selectedBoard ? (
        <>
          <BackButton 
            title={selectedBoard.includes('state') ? 
              stateBoards.find(s => selectedBoard.includes(s.id))?.name + ' State Board' : 
              'CBSE Board'} 
            subtitle="Select your preferred subject to start learning" 
            onBack={handleBack}
          />

          {loading ? (
            <div className="flex justify-center my-6 sm:my-8">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {courses.map((course) => (
                <Link 
                  to={selectedBoard.includes('state') 
                    ? `/courses/10th/state/${stateId || selectedBoard.replace('state-', '')}/${course.subject.toLowerCase()}` 
                    : `/courses/10th/${selectedBoard}/${course.subject.toLowerCase()}`} 
                  key={course.id}
                >
                  <motion.div 
                    whileHover={{ y: -5 }} 
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                  >
                    <div className="relative p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 rounded-t-lg sm:rounded-t-xl text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl lg:text-2xl">{SUBJECT_ICONS[course.subject] || '📚'}</span>
                        <FaPlay className="opacity-75 h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold mt-2">{course.subject}</h3>
                      <p className="text-white/80 text-xs sm:text-sm mt-1">{course.duration}+ hours of content</p>
                    </div>
                    <div className="p-3 sm:p-4 lg:p-6">
                      <p className="text-gray-600 text-xs sm:text-sm lg:text-base mb-3 sm:mb-4">{course.short_description || `Complete curriculum for ${course.class_level} ${course.subject}`}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <FaBookReader className="text-indigo-600 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm text-gray-600">Structured Learning</span>
                        </div>
                        <span className="text-indigo-600 text-xs sm:text-sm font-medium">Preview Course →</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-500 text-sm sm:text-base">No courses found for this selection.</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">Check back later or try a different board.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <BackButton 
            title="Select Your Board" 
            subtitle="Choose your board to see available subjects"
            onBack={handleBack}
          />
          
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <motion.button
                onClick={() => handleBoardSelect('cbse')}
                className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 text-left"
              >
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-blue-600 mb-1 sm:mb-2">CBSE Board</h3>
                <p className="text-xs sm:text-sm text-gray-600">Central Board of Secondary Education</p>
              </motion.button>
              
              <motion.button
                onClick={() => setShowStateBoards(true)}
                className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 text-left"
              >
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-green-600 mb-1 sm:mb-2">State Board</h3>
                <p className="text-xs sm:text-sm text-gray-600">Select your state board</p>
              </motion.button>
            </div>

            {/* State Boards Grid */}
            {showStateBoards && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {stateBoards.map((state) => (
                  <motion.button
                    key={state.id}
                    onClick={() => handleStateSelect(state.id)}
                    className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 text-left"
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{state.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{state.fullName}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TenthStandard;