import React, { useState, useEffect } from 'react';
import logger from '../../../../utils/logger';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import MobileBoardSelector from '../../shared/MobileBoardSelector';
import { stateBoards } from '../../data/states';
import { getSchoolCourses } from '../../../../services/courseApi';
import { checkBoardAvailability, checkStateAvailability, getOptimisticBoardAvailability } from '../../../../utils/courseAvailability';
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
    'Social Science': '🌍',
    'Science': '🔬',
    'Computer Science': '💻',
    'General': '📘'
};

const EighthStandard = () => {
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

    // Redirect external visitors (from Google, search engines, etc.) to main courses page
    useEffect(() => {
        const referrer = document.referrer;
        const currentDomain = window.location.origin;
        const currentPath = window.location.pathname;

        // Check if user came from external source (not from our own site)
        const cameFromExternal = referrer && !referrer.startsWith(currentDomain);

        // Only redirect if:
        // 1. User came from external source (Google, social media, etc.)
        // 2. User is on the base /8th route (not on board/state specific routes)
        const isBaseEighthRoute = currentPath === '/8th' || currentPath === '/8th/';

        if (cameFromExternal && isBaseEighthRoute) {
            console.log('External visitor detected on /8th, redirecting to /');
            navigate('/courses', { replace: true });
        }
    }, [navigate]);

    // Optimistic board availability
    useEffect(() => {
        const cached = getOptimisticBoardAvailability('8th');
        if (cached) {
            setAvailableBoards(cached);
            setCheckingAvailability(false);
        }

        const run = async () => {
            try {
                const fresh = await checkBoardAvailability('8th');
                if (Array.isArray(fresh) && fresh.length) setAvailableBoards(fresh);
            } catch { } finally {
                if (!cached) setCheckingAvailability(false);
            }
        };
        const handle = typeof requestIdleCallback !== 'undefined' ? requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 200);
        return () => {
            if (typeof cancelIdleCallback !== 'undefined') try { cancelIdleCallback(handle); } catch { } else clearTimeout(handle);
        };
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

                        logger.log(`Fetching state board courses: class=8th, board=state, state=${stateValue}`);
                        data = await getSchoolCourses('8th', 'state', stateValue);
                    } else {
                        logger.log(`Fetching courses: class=8th, board=${selectedBoard}`);
                        data = await getSchoolCourses('8th', selectedBoard);
                    }
                    logger.log('API returned courses:', data);

                    const filteredCourses = data.filter(course => {
                        const classMatch = course.class_level === '8th';

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
            // Dynamically check which states have courses
            setShowStateBoards(true);
            setCheckingStates(true);
            setAvailableStates([]);
            try {
                const states = await checkStateAvailability('8th');
                setAvailableStates(states);
            } catch (error) {
                logger.error('Error checking state availability:', error);
                setAvailableStates([]);
            } finally {
                setCheckingStates(false);
            }
        } else {
            setSelectedBoard(boardId);
            navigate(`/8th/${boardId}`);
        }
    };

    const handleStateSelect = (stateId) => {
        navigate(`/8th/state/${stateId}`);
        setShowStateBoards(false);
        setSelectedBoard(`state-${stateId}`);
    };

    const handleBack = () => {
        if (showStateBoards) {
            setShowStateBoards(false);
        } else if (selectedBoard) {
            setSelectedBoard(null);
            navigate('/8th');
        } else {
            navigate('/');
        }
    };

    // Add breathing room on selection screens (mobile)
    const isBoardSelection = !selectedBoard && !showStateBoards;
    const isStateSelection = showStateBoards;
    const containerPadding = (isBoardSelection || isStateSelection)
        ? 'pt-24 pb-16 md:pt-0 md:pb-0' // board/state selection
        : 'pt-24 pb-24 md:pt-0 md:pb-0'; // subject listing

    return (
        <>
            <SEO
                title="8th Standard Courses - CBSE & State Board Advanced Foundation"
                description="Explore 8th standard courses: CBSE and state board playlists for Mathematics, Science, English, Social Studies & more. Strengthen concepts with free lessons."
                keywords="8th standard courses, CBSE 8th, state board 8th, 8th class subjects, middle school advanced, free 8th grade courses"
                canonical="https://courses.easylearnova.com/"
                noindex={true}
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
                            <SegregatedCourseSections
                                courses={[]}
                                loading={true}
                                getLinkTo={() => ''}
                                getBoardDisplay={() => ''}
                            />
                        ) : courses.length > 0 ? (
                            <SegregatedCourseSections
                                courses={courses}
                                getLinkTo={(course) => {
                                    const sourceType = course.source_type === 'original' ? 'originals' : 'curated';
                                    const basePath = selectedBoard.includes('state')
                                        ? `/8th/state/${stateId || selectedBoard.replace('state-', '')}/${sourceType}/${course.subject.toLowerCase()}`
                                        : `/8th/${selectedBoard}/${sourceType}/${course.subject.toLowerCase()}`;
                                    return `${basePath}?courseId=${encodeURIComponent(course.id)}`;
                                }}
                                getBoardDisplay={() => selectedBoard.includes('state')
                                    ? `State · ${stateBoards.find(s => selectedBoard.includes(s.id))?.name || 'TS'}`
                                    : boards.find(b => b.id === selectedBoard)?.name || 'CBSE'}
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
                                    <p className="text-yellow-700">State board courses for 8th standard are being prepared and will be available soon.</p>
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
                                    <p className="text-yellow-700">Courses for 8th standard are being prepared and will be available soon.</p>
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

export default EighthStandard;
