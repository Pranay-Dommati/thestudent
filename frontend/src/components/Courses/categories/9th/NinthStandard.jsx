import React, { useState, useEffect } from 'react';
import logger from '../../../../utils/logger';
import { motion } from 'framer-motion';
import { FaPlay, FaBookReader } from 'react-icons/fa';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import MobileBoardSelector from '../../shared/MobileBoardSelector';
import { stateBoards } from '../../data/states';
import { getSchoolCourses } from '../../../../services/courseApi';
import { checkBoardAvailability } from '../../../../utils/courseAvailability';
import Footer from '../../../Footer/Footer';

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

const NinthStandard = () => {
  const navigate = useNavigate();
  const { boardId, stateId } = useParams();
  const location = useLocation();
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [showStateBoards, setShowStateBoards] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableBoards, setAvailableBoards] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(true);

  // Check course availability for each board
  useEffect(() => {
    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const availableBoards = await checkBoardAvailability('9th');
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

  // Fetch courses when board/state is selected
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
            
            logger.log(`Fetching state board courses: class=9th, board=state, state=${stateValue}`);
            data = await getSchoolCourses('9th', 'state', stateValue);
          } else {
            logger.log(`Fetching courses: class=9th, board=${selectedBoard}`);
            data = await getSchoolCourses('9th', selectedBoard);
          }
          logger.log('API returned courses:', data);

          const filteredCourses = data.filter(course => {
            const classMatch = course.class_level === '9th';
            
            let stateMatch = true;
            if (selectedBoard.startsWith('state-')) {
              const stateCode = selectedBoard.replace('state-', '') || stateId;
              const stateValue = stateCode === 'ts' ? 'Telangana' : 
                               stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;
              stateMatch = course.state === stateValue;
            }
            
            return classMatch && stateMatch;
          });

          setCourses(filteredCourses);
        } catch (error) {
          logger.error('Error fetching courses:', error);
          setCourses([]);
        }
        setLoading(false);
      };

      fetchCourses();
    }
  }, [selectedBoard, stateId]);

  const handleBoardSelect = (boardId) => {
    if (boardId === 'state') {
      setShowStateBoards(true);
    } else {
      setSelectedBoard(boardId);
      navigate(`/courses/9th/${boardId}`);
    }
  };

  const handleStateSelect = (stateId) => {
    navigate(`/courses/9th/state/${stateId}`);
    setShowStateBoards(false);
    setSelectedBoard(`state-${stateId}`);
  };

  const handleBack = () => {
    if (showStateBoards) {
      setShowStateBoards(false);
    } else if (selectedBoard) {
      setSelectedBoard(null);
      navigate('/courses/9th');
    } else {
      navigate('/courses');
    }
  };

  // Add breathing room on selection screens (mobile)
  const isBoardSelection = !selectedBoard && !showStateBoards;
  const isStateSelection = showStateBoards;
  const containerPadding = (isBoardSelection || isStateSelection)
    ? 'pt-24 pb-16 md:pt-0 md:pb-0' // selection
    : 'pt-24 pb-24 md:pt-0 md:pb-0'; // subject listing

  return (
    <>
    <div className={`container mx-auto px-4 ${containerPadding}`}>
      <MobileBoardSelector
        availableBoards={availableBoards}
        availableStates={[]}
        checkingAvailability={checkingAvailability}
        checkingStates={false}
        isBoardSelection={!selectedBoard && !showStateBoards}
        isStateSelection={showStateBoards}
        onSelectBoard={handleBoardSelect}
        onSelectState={() => {}}
        onBack={handleBack}
      />

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
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {courses.map((course) => (
                <Link 
                  to={selectedBoard.includes('state') 
                    ? `/courses/9th/state/${stateId || selectedBoard.replace('state-', '')}/${course.subject.toLowerCase()}` 
                    : `/courses/9th/${selectedBoard}/${course.subject.toLowerCase()}`} 
                  key={course.id}
                >
                  <motion.div 
                    whileHover={{ y: -5 }} 
                    className="bg-white rounded-lg md:rounded-xl shadow-sm md:hover:shadow-lg transition-all duration-300 cursor-pointer h-full border border-gray-100"
                  >
                    <div className="relative p-4 md:p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg md:rounded-t-xl text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xl md:text-2xl">{SUBJECT_ICONS[course.subject] || '📚'}</span>
                        <FaPlay className="opacity-75 text-sm md:text-base" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mt-1 md:mt-2">{course.subject}</h3>
                      <p className="text-white/80 text-xs md:text-sm mt-1">{course.duration}+ hours of content</p>
                    </div>
                    <div className="p-4 md:p-5">
                      <p className="text-gray-600 text-sm md:text-base mb-3 md:mb-4">{course.short_description || `Complete curriculum for ${course.class_level} ${course.subject}`}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaBookReader className="text-indigo-600" />
                          <span className="text-sm text-gray-600">Structured Learning</span>
                        </div>
                        <span className="text-indigo-600 text-xs md:text-sm font-medium">Preview Course →</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No courses found for this selection.</p>
              <p className="text-sm text-gray-400 mt-2">Check back later or try a different board.</p>
            </div>
          )}
        </>
      ) : showStateBoards ? (
        <div className="hidden md:block">
          <BackButton 
            title="Select Your State" 
            subtitle="Choose your state board" 
            onBack={handleBack}
          />
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {stateBoards.map((state) => (
                <motion.button
                  key={state.id}
                  onClick={() => handleStateSelect(state.id)}
                  className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{state.name}</h3>
                  <p className="text-gray-500 text-sm">{state.fullName}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:block">
          <BackButton 
            title="Select Your Board" 
            subtitle="Choose your education board to view relevant courses" 
            onBack={handleBack}
          />
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {boards.filter(board => board.available).map((board) => (
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

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">More Boards Coming Soon!</h3>
              <p className="text-indigo-700">We're working hard to bring you content for ICSE, NIOS, and other boards. Stay tuned for updates!</p>
            </div>
          </div>
        </div>
  )}
    </div>
      
 
    </>
  );
};

export default NinthStandard;
