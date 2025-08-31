import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaBookReader } from 'react-icons/fa';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { stateBoards } from '../../data/states';
import { getSchoolCourses } from '../../../../services/courseApi';
import { checkBoardAvailability, checkStateAvailability } from '../../../../utils/courseAvailability';

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

const SeventhStandard = () => {
  const navigate = useNavigate();
  const { boardId, stateId } = useParams();
  const location = useLocation();
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [showStateBoards, setShowStateBoards] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableBoards, setAvailableBoards] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [availableStates, setAvailableStates] = useState([]);
  const [checkingStates, setCheckingStates] = useState(false);

  // Check course availability for each board
  useEffect(() => {
    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const availableBoards = await checkBoardAvailability('7th');
        setAvailableBoards(availableBoards);
      } catch (error) {
        console.error('Error checking board availability:', error);
        setAvailableBoards([]);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, []);

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
            const stateCode = selectedBoard.replace('state-', '') || stateId;
            const stateValue = stateCode === 'ts' ? 'Telangana' : 
                             stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;
            
            console.log(`Fetching state board courses: class=7th, board=state, state=${stateValue}`);
            data = await getSchoolCourses('7th', 'state', stateValue);
          } else {
            console.log(`Fetching courses: class=7th, board=${selectedBoard}`);
            data = await getSchoolCourses('7th', selectedBoard);
          }

          console.log('API returned courses:', data);

          const filteredCourses = data.filter(course => {
            const classMatch = course.class_level === '7th';
            
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
          console.error('Error fetching courses:', error);
          setCourses([]);
        }
        setLoading(false);
      };

      fetchCourses();
    }
  }, [selectedBoard, stateId]);

  const handleBoardSelect = async (boardId) => {
    if (boardId === 'state') {
      setCheckingStates(true);
      try {
        const availableStates = await checkStateAvailability('7th');
        setAvailableStates(availableStates);
        setShowStateBoards(true);
      } catch (error) {
        console.error('Error checking state availability:', error);
        setAvailableStates([]);
        setShowStateBoards(true);
      } finally {
        setCheckingStates(false);
      }
    } else {
      setSelectedBoard(boardId);
      navigate(`/courses/7th/${boardId}`);
    }
  };

  const handleStateSelect = (stateId) => {
    navigate(`/courses/7th/state/${stateId}`);
    setShowStateBoards(false);
  };

  const handleBack = () => {
    if (showStateBoards) {
      setShowStateBoards(false);
    } else if (selectedBoard) {
      setSelectedBoard(null);
      navigate('/courses/7th');
    } else {
      navigate('/courses');
    }
  };

  return (
    <div className="container mx-auto px-4 pt-20 md:pt-0">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link 
                  to={selectedBoard.includes('state') 
                    ? `/courses/7th/state/${stateId || selectedBoard.replace('state-', '')}/${course.subject.toLowerCase()}` 
                    : `/courses/7th/${selectedBoard}/${course.subject.toLowerCase()}`} 
                  key={course.id}
                >
                  <motion.div 
                    whileHover={{ y: -5 }} 
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                  >
                    <div className="relative p-6 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 rounded-t-xl text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{SUBJECT_ICONS[course.subject] || '📚'}</span>
                        <FaPlay className="opacity-75" />
                      </div>
                      <h3 className="text-xl font-bold mt-2">{course.subject}</h3>
                      <p className="text-white/80 text-sm mt-1">{course.duration}+ hours of content</p>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-4">{course.short_description || `Complete curriculum for ${course.class_level} ${course.subject}`}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaBookReader className="text-indigo-600" />
                          <span className="text-sm text-gray-600">Structured Learning</span>
                        </div>
                        <span className="text-indigo-600 text-sm font-medium">Preview Course →</span>
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
        <>
          <BackButton 
            title="Select Your State" 
            subtitle="Choose your state board" 
            onBack={handleBack}
          />
          {checkingStates ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : availableStates.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {availableStates.map((state) => (
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
          ) : (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-yellow-800 mb-2">No State Courses Available Yet</h3>
                <p className="text-yellow-700">State board courses for 7th standard are being prepared and will be available soon.</p>
                <p className="text-sm text-yellow-600 mt-2">Please check back later or try a different class.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <BackButton 
            title="Select Your Board" 
            subtitle="Choose your education board to view relevant courses" 
            onBack={handleBack}
          />
          {checkingAvailability ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : availableBoards.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {availableBoards.filter(board => board.available).map((board) => (
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
          ) : (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-yellow-800 mb-2">No Courses Available Yet</h3>
                <p className="text-yellow-700">Courses for 7th standard are being prepared and will be available soon.</p>
                <p className="text-sm text-yellow-600 mt-2">Please check back later or try a different class.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeventhStandard;
