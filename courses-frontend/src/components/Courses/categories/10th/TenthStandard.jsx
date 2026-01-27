import React, { useState, useEffect } from 'react';
import logger from '../../../../utils/logger';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { stateBoards } from '../../data/states';
import { getSchoolCourses, getSchoolCourseById } from '../../../../services/courseApi';
import { checkBoardAvailability, checkStateAvailability, getOptimisticBoardAvailability } from '../../../../utils/courseAvailability';
import MobileBoardSelector from '../../shared/MobileBoardSelector';
import { SegregatedCourseSections } from '../../shared/CourseCard';
import Footer from '../../../Footer/Footer';
import SEO from '../../../SEO/SEO';

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

const TenthStandard = () => {
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

    // Check board availability
    useEffect(() => {
        // STRICT REQUIREMENT: Only show State Board.
        // No API checks, no conditions, just this one board.
        const forcedBoards = [{
            id: 'state',
            name: 'State Board',
            fullName: 'State Board of Secondary and Higher Secondary Education',
            available: true
        }];

        setAvailableBoards(forcedBoards);
        setCheckingAvailability(false);
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
                        // For state boards, extract the state code
                        const stateCode = selectedBoard.replace('state-', '') || stateId;

                        // Map state codes to full state names as stored in database
                        const stateValue = stateCode === 'ts' ? 'Telangana' :
                            stateCode === 'ap' ? 'Andhra Pradesh' : stateCode;

                        logger.log(`Fetching state board courses: class=10th, board=state, state=${stateValue}`);
                        data = await getSchoolCourses('10th', 'state', stateValue);
                    } else {
                        logger.log(`Fetching courses: class=10th, board=${selectedBoard}`);
                        data = await getSchoolCourses('10th', selectedBoard);
                    }
                    logger.log('API returned courses:', data);

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

                        logger.log(`Filtering course:`, {
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

                    logger.log('Filtered courses:', filteredCourses);
                    setCourses(filteredCourses);
                } catch (error) {
                    logger.error("Error fetching courses:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchCourses();
        }
    }, [selectedBoard, stateId]);

    const handleBoardSelect = async (boardId) => {
        if (boardId === 'state') {
            // Dynamically check which states have courses (including Original courses)
            setShowStateBoards(true);
            setCheckingStates(true);
            setAvailableStates([]);
            try {
                const states = await checkStateAvailability('10th');
                setAvailableStates(states);
            } catch (error) {
                logger.error('Error checking state availability:', error);
                setAvailableStates([]);
            } finally {
                setCheckingStates(false);
            }
        } else {
            // Navigate first; URL-derived effect will sync selectedBoard
            navigate(`/10th/${boardId}`);
        }
    };

    const handleStateSelect = (stateId) => {
        const to = `/10th/state/${stateId}`;
        // Navigate immediately; URL effect will set selectedBoard
        navigate(to);
        setShowStateBoards(false);
    };

    const handleBack = () => {
        if (showStateBoards) {
            setShowStateBoards(false);
        } else if (selectedBoard) {
            setSelectedBoard(null);
            navigate('/10th');
        } else {
            navigate('/');
        }
    };

    // Add a bit more breathing room on board/state selection screens (mobile)
    const isBoardSelection = !selectedBoard && !showStateBoards;
    const isStateSelection = showStateBoards;
    const containerPadding = (isBoardSelection || isStateSelection)
        ? 'pt-24 pb-16 md:pt-0 md:pb-0' // selection
        : 'pt-24 pb-16 md:pt-0 md:pb-0'; // subject listing

    return (
        <>
            <SEO
                title="10th Standard Courses - CBSE & State Board Free Learning"
                description="Explore 10th standard courses: CBSE and state board playlists for Mathematics, Science, English & more. Prepare for board exams with structured lessons."
                keywords="10th standard courses, CBSE 10th, state board 10th, board exam preparation, 10th class subjects, free 10th courses"
                canonical="https://courses.easylearnova.com/10th"
            />
            <div className={`container mx-auto px-4 ${containerPadding}`}>
                {/* Mobile-only friendly selector */}
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

                {/* Subject listing should render on all sizes when a board/state is selected */}
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
                            <SegregatedCourseSections
                                courses={courses}
                                getLinkTo={(course) => {
                                    const sourceType = course.source_type === 'original' ? 'originals' : 'curated';
                                    const basePath = selectedBoard.includes('state')
                                        ? `/10th/state/${stateId || selectedBoard.replace('state-', '')}/${sourceType}/${course.subject.toLowerCase()}`
                                        : `/10th/${selectedBoard}/${sourceType}/${course.subject.toLowerCase()}`;
                                    return `${basePath}?courseId=${encodeURIComponent(course.id)}`;
                                }}
                                getBoardDisplay={() => selectedBoard.includes('state')
                                    ? `State · ${stateBoards.find(s => selectedBoard.includes(s.id))?.name || 'TS'}`
                                    : boards.find(b => b.id === selectedBoard)?.name || 'CBSE'}
                                onPrefetch={(course) => { try { getSchoolCourseById(course.id); } catch { } }}
                            />
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
                                    <p className="text-yellow-700">State board courses for 10th standard are being prepared and will be available soon.</p>
                                    <p className="text-sm text-yellow-600 mt-2">Please check back later or try CBSE board.</p>
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
                                    <p className="text-yellow-700">Courses for 10th standard are being prepared and will be available soon.</p>
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

export default TenthStandard;