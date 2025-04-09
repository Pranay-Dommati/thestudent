import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaBookReader } from 'react-icons/fa';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { stateBoards } from '../../data/states';

const EleventhStandard = () => {
  const navigate = useNavigate();
  const { stateId } = useParams();
  const location = useLocation();
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [showStateBoards, setShowStateBoards] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);

  // Add this useEffect to handle URL-based board selection
  useEffect(() => {
    if (location.pathname.includes('/state/')) {
      setSelectedBoard(`state-${stateId}`);
    } else if (location.pathname.includes('/cbse')) {
      setSelectedBoard('cbse');
    }
  }, [location, stateId]);

  // Update the useEffect hook with proper filtering
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
            
            console.log(`Fetching state board courses: class=11th, board=state, state=${stateValue}`);
            data = await getSchoolCourses('11th', 'state', stateValue);
          } else {
            console.log(`Fetching courses: class=11th, board=${selectedBoard}`);
            data = await getSchoolCourses('11th', selectedBoard);
          }

          console.log('API returned courses:', data);
          
          // Apply strict filtering
          const filteredCourses = data.filter(course => {
            const classMatch = course.class_level === '11th';
            const boardMatch = course.board.toLowerCase() === 
              (selectedBoard.startsWith('state-') ? 'state' : selectedBoard.toLowerCase());
            
            let stateMatch = true;
            if (selectedBoard.startsWith('state-')) {
              const stateCode = selectedBoard.replace('state-', '') || stateId;
              const stateValue = stateCode === 'ts' ? 'Telangana' : 
                               stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;
              
              stateMatch = course.state && 
                course.state.toLowerCase().includes(stateValue.toLowerCase());
            }
            
            return classMatch && boardMatch && stateMatch;
          });

          console.log(`Filtered to ${filteredCourses.length} courses for 11th standard`);
          setCourses(filteredCourses);
        } catch (error) {
          console.error("Error fetching 11th standard courses:", error);
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

  const subjects = [
    {
      id: 'physics',
      name: 'Physics',
      icon: '🔬',
      courseId: '11th-physics', // Updated courseId
      description: 'Comprehensive coverage of Physics for 11th grade',
      duration: '50+ hours of content'
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      icon: '⚗️',
      courseId: '11th-chemistry', // Updated courseId
      description: 'In-depth exploration of Chemistry concepts',
      duration: '45+ hours of content'
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      icon: '📐',
      courseId: '11th-mathematics', // Updated courseId
      description: 'Advanced Mathematics for 11th grade',
      duration: '60+ hours of content'
    },
    {
      id: 'biology',
      name: 'Biology',
      icon: '🧬',
      courseId: '11th-biology', // Updated courseId
      description: 'Detailed study of Biology topics',
      duration: '55+ hours of content'
    },
    {
      id: 'english',
      name: 'English',
      icon: '📚',
      courseId: '11th-english', // Updated courseId
      description: 'Master English language and literature',
      duration: '40+ hours of content'
    }
  ];

  const handleBoardSelect = (board) => {
    if (board === 'state') {
      setShowStateBoards(true);
    } else {
      navigate(`/courses/11th/${board}`);
    }
  };

  const handleStateSelect = (stateId) => {
    navigate(`/courses/11th/state/${stateId}`);
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
    <div className="container mx-auto px-4 py-8 pt-20">
      {!selectedBoard && !showStateBoards ? (
        <>
          <BackButton 
            title="Select Your Board" 
            subtitle="Choose your education board to view relevant courses" 
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
        </>
      ) : showStateBoards ? (
        <>
          <BackButton 
            title="Select Your State" 
            subtitle="Choose your state board" 
          />
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {stateBoards.map((state) => (
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
        </>
      ) : (
        <>
          <BackButton 
            title={`Class 11 - ${selectedBoard.includes('state') ? 
              stateBoards.find(s => selectedBoard.includes(s.id))?.name : 
              boards.find(b => b.id === selectedBoard)?.name}`}
            subtitle="Complete syllabus coverage with curated video lectures" 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Link 
                to={selectedBoard.includes('state') 
                  ? `/courses/11th/state/${selectedBoard.replace('state-', '')}/${subject.id}` 
                  : `/courses/11th/${selectedBoard}/${subject.id}`} 
                key={subject.id}
              >
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 rounded-t-xl"></div>
                    <div className="relative p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-2xl">{subject.icon}</span>
                        <FaPlay className="text-white opacity-75" />
                      </div>
                      <h3 className="text-white text-xl font-bold mt-2">{subject.name}</h3>
                      <p className="text-white/80 text-sm mt-1">{subject.duration}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4">{subject.description}</p>
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
  );
};

export default EleventhStandard;