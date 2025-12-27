import React, { useState, useEffect } from 'react';
import logger from '../../../../utils/logger';
import { motion } from 'framer-motion';
import { FaPlay, FaBookReader } from 'react-icons/fa';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import MobileBoardSelector from '../../shared/MobileBoardSelector';
import { stateBoards } from '../../data/states';
import { getSchoolCourses } from '../../../../services/courseApi';
import { checkBoardAvailability, checkStateAvailability, getOptimisticBoardAvailability } from '../../../../utils/courseAvailability';
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

const SixthStandard = () => {
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

    // Optimistic board availability: show immediately, then refine in background
    useEffect(() => {
        // Immediate optimistic boards (cached or both)
        const cached = getOptimisticBoardAvailability('6th');
        if (cached) {
            setAvailableBoards(cached);
            setCheckingAvailability(false);
        }

        // Background refinement without blocking UI
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const run = async () => {
            try {
                const fresh = await checkBoardAvailability('6th');
                if (Array.isArray(fresh) && fresh.length) setAvailableBoards(fresh);
            } catch { } finally {
                if (!cached) setCheckingAvailability(false);
            }
        };
        const handle = typeof requestIdleCallback !== 'undefined'
            ? requestIdleCallback(run, { timeout: 1500 })
            : setTimeout(run, 200);
        return () => {
            if (typeof cancelIdleCallback !== 'undefined') try { cancelIdleCallback(handle); } catch { }
            else clearTimeout(handle);
            try { controller?.abort(); } catch { }
        };
    }, []);

    // Sync selected board with URL; also reset on /6th
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/state/')) {
            setSelectedBoard(`state-${stateId}`);
            setShowStateBoards(false);
        } else if (path.includes('/cbse')) {
            setSelectedBoard('cbse');
            setShowStateBoards(false);
        } else {
            // e.g., /6th -> clear selection so board grid shows
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

                        logger.log(`Fetching state board courses: class=6th, board=state, state=${stateValue}`);
                        data = await getSchoolCourses('6th', 'state', stateValue);
                    } else {
                        logger.log(`Fetching courses: class=6th, board=${selectedBoard}`);
                        data = await getSchoolCourses('6th', selectedBoard);
                    }

                    logger.log('API returned courses:', data);

                    const filteredCourses = data.filter(course => {
                        const classMatch = course.class_level === '6th';

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

    const handleBoardSelect = async (boardId) => {
        if (boardId === 'state') {
            setCheckingStates(true);
            try {
                const availableStates = await checkStateAvailability('6th');
                setAvailableStates(availableStates);
                setShowStateBoards(true);
            } catch (error) {
                logger.error('Error checking state availability:', error);
                setAvailableStates([]);
                setShowStateBoards(true);
            } finally {
                setCheckingStates(false);
            }
        } else {
            setSelectedBoard(boardId);
            navigate(`/6th/${boardId}`);
        }
    };

    const handleStateSelect = (stateId) => {
        navigate(`/6th/state/${stateId}`);
        setShowStateBoards(false);
        setSelectedBoard(`state-${stateId}`);
    };

    const handleBack = () => {
        if (showStateBoards) {
            setShowStateBoards(false);
        } else if (selectedBoard) {
            setSelectedBoard(null);
            navigate('/6th');
        } else {
            navigate('/');
        }
    };

    // Add breathing room on selection screens (mobile)
    const isBoardSelection = !selectedBoard && !showStateBoards;
    const isStateSelection = showStateBoards;
    const containerPadding = (isBoardSelection || isStateSelection)
        ? 'pt-24 pb-16 md:pt-0 md:pb-0' // board/state selection
        : 'pt-24 pb-16 md:pt-0 md:pb-0'; // subject listing (course cards)

    return (
        <>
            <SEO
                title="6th Standard Courses - CBSE & State Board Foundation Learning"
                description="Explore 6th standard courses: CBSE and state board playlists for Mathematics, Science, English, Social Studies & more. Build strong foundations with free lessons."
                keywords="6th standard courses, CBSE 6th, state board 6th, 6th class subjects, foundation courses, free 6th grade courses"
                canonical="https://easylearnova.com/courses/6th"
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
                    onSelectState={(state) => handleStateSelect(state)}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4 lg:gap-6 px-4 sm:px-0">
                                {courses.map((course) => {
                                    // Format board name for display
                                    let boardDisplay = selectedBoard.includes('state')
                                        ? `State · ${stateBoards.find(s => selectedBoard.includes(s.id))?.name || 'TS'}`
                                        : boards.find(b => b.id === selectedBoard)?.name || 'CBSE';

                                    return (
                                        <Link
                                            to={`${(selectedBoard.includes('state')
                                                ? `/6th/state/${stateId || selectedBoard.replace('state-', '')}/${course.subject.toLowerCase()}`
                                                : `/6th/${selectedBoard}/${course.subject.toLowerCase()}`)}?courseId=${encodeURIComponent(course.id)}`}
                                            key={course.id}
                                        >
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
                    </>
                ) : showStateBoards ? (
                    <div className="hidden md:block">
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
                                    <p className="text-yellow-700">State board courses for 6th standard are being prepared and will be available soon.</p>
                                    <p className="text-sm text-yellow-600 mt-2">Please check back later or try a different class.</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="hidden md:block">
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
                                    <p className="text-yellow-700">Courses for 6th standard are being prepared and will be available soon.</p>
                                    <p className="text-sm text-yellow-600 mt-2">Please check back later or try a different class.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>


        </>
    );
};

export default SixthStandard;
