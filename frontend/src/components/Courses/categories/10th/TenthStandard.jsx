import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaBookReader } from 'react-icons/fa';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { stateBoards } from '../../data/states';

const TenthStandard = () => {
  const navigate = useNavigate();
  const { stateId } = useParams();
  const location = useLocation();
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [showStateBoards, setShowStateBoards] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('/state/')) {
      setSelectedBoard(`state-${stateId}`);
    } else if (location.pathname.includes('/cbse')) {
      setSelectedBoard('cbse');
    }
  }, [location, stateId]);

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
      id: 'english',
      name: 'English',
      icon: '📚',
      courseId: '10th-english',
      description: 'Master language & literature with comprehensive coverage of CBSE syllabus',
      duration: '40+ hours of content'
    },
    {
      id: 'hindi',
      name: 'Hindi',
      icon: '📖',
      courseId: '10th-hindi',
      description: 'Strengthen your Hindi language skills with expert guidance',
      duration: '35+ hours of content'
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      icon: '📐',
      courseId: '10th-mathematics',
      description: 'Build strong foundations in algebra, geometry, and trigonometry',
      duration: '45+ hours of content'
    },
    {
      id: 'science',
      name: 'Science',
      icon: '🔬',
      courseId: '10th-science',
      description: 'Comprehensive coverage of Physics, Chemistry, and Biology',
      duration: '50+ hours of content'
    },
    {
      id: 'social',
      name: 'Social Science',
      icon: '🌍',
      courseId: '10th-social',
      description: 'In-depth exploration of History, Geography, and Civics',
      duration: '40+ hours of content'
    }
  ];

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
        </>
      ) : (
        <>
          <BackButton 
            title={`Class 10 - ${selectedBoard.includes('state') ? 
              stateBoards.find(s => selectedBoard.includes(s.id))?.name : 
              boards.find(b => b.id === selectedBoard)?.name}`}
            subtitle="Complete syllabus coverage with curated video lectures" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Link 
                to={selectedBoard.includes('state') 
                  ? `/courses/10th/state/${selectedBoard.replace('state-', '')}/${subject.id}` 
                  : `/courses/10th/${selectedBoard}/${subject.id}`} 
                key={subject.id}
              >
                <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                  <div className="relative p-6 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 rounded-t-xl text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{subject.icon}</span>
                      <FaPlay className="opacity-75" />
                    </div>
                    <h3 className="text-xl font-bold mt-2">{subject.name}</h3>
                    <p className="text-white/80 text-sm mt-1">{subject.duration}</p>
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
        </>
      )}
    </div>
  );
};

export default TenthStandard;