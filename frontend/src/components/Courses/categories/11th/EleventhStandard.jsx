import React, { useState, useEffect } from 'react';
import logger from '../../../../utils/logger';
import { motion } from 'framer-motion';
import { FaPlay, FaBookReader } from 'react-icons/fa';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import MobileBoardSelector from '../../shared/MobileBoardSelector';
import { stateBoards } from '../../data/states';
import { getSchoolCourses } from '../../../../services/courseApi';
import { checkBoardAvailability, checkStateAvailability } from '../../../../utils/courseAvailability';
import Footer from '../../../Footer/Footer';
import SEO from '../../../SEO/SEO';

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

const EleventhStandard = () => {
  const navigate = useNavigate();
  const { stateId } = useParams();
  const location = useLocation();
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [showStateBoards, setShowStateBoards] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [availableBoards, setAvailableBoards] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [availableStates, setAvailableStates] = useState([]);
  const [checkingStates, setCheckingStates] = useState(false);

  // Check course availability for each board
  useEffect(() => {
    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const availableBoards = await checkBoardAvailability('11th');
        setAvailableBoards(availableBoards);
      } catch (error) {
        logger.error('Error checking board availability:', error);
        setAvailableBoards([]);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, []);

  // Sync selected board with URL; also reset on base route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/state/')) {
      setSelectedBoard(`state-${stateId}`);
      setShowStateBoards(false);
    } else if (path.includes('/cbse')) {
      setSelectedBoard('cbse');
      setShowStateBoards(false);
    } else {
      setSelectedBoard(null);
      setShowStateBoards(false);
    }
  }, [location.pathname, stateId]);

  useEffect(() => {
    if (selectedBoard) {
      const fetchCourses = async () => {
        setLoading(true);
        try {
          let data;

          if (selectedBoard === 'state' || selectedBoard.startsWith('state-')) {
            const stateCode = selectedBoard.replace('state-', '') || stateId;
            const stateValue = stateCode === 'ts' ? 'Telangana' : 
                             stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;
            
            logger.log(`Fetching state board courses: class=11th, board=state, state=${stateValue}`);
            data = await getSchoolCourses('11th', 'state', stateValue);
          } else {
            logger.log(`Fetching courses: class=11th, board=${selectedBoard}`);
            data = await getSchoolCourses('11th', selectedBoard);
          }
          logger.log('API returned courses:', data);
          
          const filteredCourses = data.filter(course => {
            const classMatch = course.class_level === '11th';
            
            let stateMatch = true;
            if (selectedBoard.startsWith('state-')) {
              const stateCode = selectedBoard.replace('state-', '') || stateId;
              const stateValue = stateCode === 'ts' ? 'Telangana' : 
                               stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;
              stateMatch = course.state && course.state.includes(stateValue);
            }
            
            logger.log(`Filtering course:`, {
              course: course.title,
              class: course.class_level,
              board: course.board,
              state: course.state,
              matches: {
                class: classMatch,
                board: true,
                state: stateMatch
              }
            });
            
            return classMatch && stateMatch;
          });

          logger.log('Filtered courses:', filteredCourses);
          setCourses(filteredCourses);
        } catch (error) {
          logger.error("Error fetching 11th standard courses:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCourses();
    }
  }, [selectedBoard, stateId]);

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
    },
    { 
      id: 'icse', 
      name: 'CISCE',
      fullName: 'Council for the Indian School Certificate Examinations',
      available: false
    },
    { 
      id: 'nios', 
      name: 'NIOS',
      fullName: 'National Institute of Open Schooling',
      available: false
    }
  ];

  const handleBoardSelect = async (boardId) => {
    if (boardId === 'state') {
      // Show state UI immediately for snappy UX; load availability in background
      setShowStateBoards(true);
      setCheckingStates(true);
      setAvailableStates([]);
      try {
        const states = await checkStateAvailability('11th');
        setAvailableStates(states);
      } catch (error) {
        logger.error('Error checking state availability:', error);
        setAvailableStates([]);
      } finally {
        setCheckingStates(false);
      }
    } else {
      // Navigate first; URL-derived effect will sync selectedBoard
      navigate(`/courses/11th/${boardId}`);
    }
  };

  const handleStateSelect = (stateId) => {
    const to = `/courses/11th/state/${stateId}`;
    // Navigate immediately; URL effect will set selectedBoard
    navigate(to);
    setShowStateBoards(false);
  };

  const handleBack = () => {
    if (showStateBoards) {
      setShowStateBoards(false);
    } else if (selectedBoard) {
      setSelectedBoard(null);
      navigate('/courses/11th');
    } else {
      navigate('/courses');
    }
  };

  // Add breathing room on selection screens (mobile)
  const isBoardSelection = !selectedBoard && !showStateBoards;
  const isStateSelection = showStateBoards;
  const containerPadding = (isBoardSelection || isStateSelection)
    ? 'pt-24 pb-16 md:pt-0 md:pb-0'
    : 'pt-24 pb-24 md:pt-0 md:pb-0';

  return (
    <>
    <SEO
      title="11th Standard Courses - CBSE & State Board JEE/NEET Prep"
      description="Master 11th standard courses with free CBSE and state board playlists. Excel in Physics, Chemistry, Biology, Math for JEE/NEET preparation."
      keywords="11th standard courses, CBSE 11th, state board 11th, JEE preparation, NEET preparation, class 11 science"
      canonical="https://easylearnova.com/courses/11th"
    />
    <div className={`container mx-auto px-4 ${containerPadding}`}>
      <MobileBoardSelector
        availableBoards={availableBoards}
        availableStates={availableStates}
        checkingAvailability={checkingAvailability}
        checkingStates={checkingStates}
        isBoardSelection={!selectedBoard && !showStateBoards}
        isStateSelection={showStateBoards}
        onSelectBoard={handleBoardSelect}
        onSelectState={handleStateSelect}
        onBack={handleBack}
      />

      {!selectedBoard && !showStateBoards ? (
        <div className="hidden md:block">
          <BackButton 
            title="Select Your Board" 
            subtitle="Choose your education board to view relevant courses" 
          />

          {checkingAvailability ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking available boards...</p>
            </div>
          ) : availableBoards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Courses Available Yet</h3>
              <p className="text-gray-500">Courses for 11th standard are being prepared and will be available soon.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {availableBoards.map((board) => (
                  <motion.button
                    key={board.id}
                    onClick={() => handleBoardSelect(board.id)}
                    className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{board.name}</h3>
                    <p className="text-gray-500 text-sm">{board.fullName}</p>
                  </motion.button>
                ))}
              </div>

              {availableBoards.length < boards.length && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-2">More Boards Coming Soon!</h3>
                  <p className="text-indigo-700">We're working hard to bring you content for ICSE, NIOS, and other boards. Stay tuned for updates!</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : showStateBoards ? (
        <div className="hidden md:block">
          <BackButton 
            title="Select Your State" 
            subtitle="Choose your state board" 
          />
          {checkingStates ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking available states...</p>
            </div>
          ) : availableStates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No State Boards Available Yet</h3>
              <p className="text-gray-500">State board courses for 11th standard are being prepared and will be available soon.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {availableStates.map((state) => (
                  <motion.button
                    key={state.id}
                    onClick={() => handleStateSelect(state.id)}
                    className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-xl 
                             transition-all duration-300 border border-gray-100"
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{state.name}</h3>
                    <p className="text-gray-500 text-sm">{state.fullName}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <BackButton 
            title={`Class 11 - ${selectedBoard.includes('state') ? 
              stateBoards.find(s => selectedBoard.includes(s.id))?.name : 
              boards.find(b => b.id === selectedBoard)?.name}`}
            subtitle="Complete syllabus coverage with curated video lectures" 
            onBack={handleBack}
          />

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4 lg:gap-6 px-4 sm:px-0">
              {courses.map((course) => {
                // Preserve a stable course identifier in the URL to disambiguate subjects with multiple variants (e.g., 1A vs 1B)
                const basePath = selectedBoard.includes('state')
                  ? `/courses/11th/state/${stateId || selectedBoard.replace('state-', '')}/${course.subject.toLowerCase()}`
                  : `/courses/11th/${selectedBoard}/${course.subject.toLowerCase()}`;
                const to = `${basePath}?courseId=${encodeURIComponent(course.id)}`;
                
                // Format board name for display
                let boardDisplay = selectedBoard.includes('state') 
                  ? `State · ${stateBoards.find(s => selectedBoard.includes(s.id))?.name || 'TS'}`
                  : boards.find(b => b.id === selectedBoard)?.name || 'CBSE';

                return (
                  <Link to={to} key={`${course.id}-${course.subject}`}>
                    <motion.div 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer h-full"
                    >
                      {/* Course thumbnail */}
                      <div className="relative pb-[56.25%] rounded-t-xl overflow-hidden">
                        <img 
                          src={course.thumbnail || `https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&text=${encodeURIComponent(course.subject)}`}
                          alt={course.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Course info with better mobile spacing */}
                      <div className="p-4 sm:p-4 lg:p-5">
                        <h3 className="font-semibold text-gray-900 mb-2 sm:mb-2 line-clamp-2 text-base sm:text-base leading-tight">
                          {course.title}
                        </h3>
                        
                        <div className="flex items-center text-sm sm:text-sm text-gray-500 mb-3 sm:mb-3">
                          <span>{course.duration}+ hours</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1 mr-2">
                            <div className="h-6 w-6 sm:h-6 sm:w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600 flex-shrink-0">
                              {SUBJECT_ICONS[course.subject] || course.subject[0]}
                            </div>
                            <span className="ml-2 sm:ml-2 text-sm sm:text-sm text-gray-600 truncate">{course.subject}</span>
                          </div>
                          
                          <div className="flex items-center flex-shrink-0">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 sm:px-2 py-1 sm:py-1 rounded-full font-medium whitespace-nowrap">
                              {boardDisplay}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No courses found for this selection.</p>
              <p className="text-sm text-gray-400 mt-2">Check back later or try a different board.</p>
            </div>
          )}

          <div className="mt-12 bg-gray-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">Sample Papers</h3>
              <p className="text-gray-600 mb-4">
                {selectedBoard && selectedBoard.includes('state-ap') 
                  ? 'Andhra Pradesh Intermediate previous years question papers'
                  : selectedBoard && selectedBoard.includes('state-ts')
                    ? 'Telangana Intermediate previous years question papers'
                    : 'CBSE sample papers and previous year questions'}
              </p>
              <a 
                href={
                  selectedBoard && selectedBoard.includes('state-ap')
                    ? "https://www.selfstudys.com/state-wise/andhra-pradesh/class-11th"
                    : selectedBoard && selectedBoard.includes('state-ts')
                      ? "https://www.selfstudys.com/state-wise/telangana/class-11th"
                      : "https://www.educart.co/previous-year-question-paper/cbse-class-11"
                }
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-600 font-medium hover:text-indigo-800 inline-flex items-center"
              >
                Access Now 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
      

    </>
  );
};

export default EleventhStandard;