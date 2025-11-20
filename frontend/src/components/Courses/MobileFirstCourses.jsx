import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
    FaGraduationCap, 
    FaBook, 
    FaUniversity, 
    FaLaptopCode, 
    FaChevronRight,
    FaSearch,
    FaFilter,
    FaStar
} from 'react-icons/fa';
import Footer from "../Footer/Footer";
import '../../styles/mobile-courses.css';
import logger from '../../utils/logger';
import api from '../../utils/axios';
import { courseCache } from '../../utils/courseCache';
import prefetchBoardsAndStates from '../../utils/prefetchBoardsAndStates';

const MobileFirstCourses = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [filteredLevels, setFilteredLevels] = useState([]);
    const [availableLevels, setAvailableLevels] = useState([]);
    const [loading, setLoading] = useState(true);

    const allEducationLevels = [
        { 
            id: '6th', 
            name: '6th Standard', 
            icon: FaBook,
            description: 'Board-wise Preparation',
            subjects: ['CBSE', 'State Boards'],
            difficulty: 'Beginner',
            apiClass: '6th'
        },
        { 
            id: '7th', 
            name: '7th Standard', 
            icon: FaBook,
            description: 'Board-wise Preparation',
            subjects: ['CBSE', 'State Boards'],
            difficulty: 'Beginner',
            apiClass: '7th'
        },
        { 
            id: '8th', 
            name: '8th Standard', 
            icon: FaBook,
            description: 'Board-wise Preparation',
            subjects: ['CBSE', 'State Boards'],
            difficulty: 'Beginner',
            apiClass: '8th'
        },
        { 
            id: '9th', 
            name: '9th Standard', 
            icon: FaGraduationCap,
            description: 'Board-wise Preparation',
            subjects: ['CBSE', 'State Boards'],
            difficulty: 'Intermediate',
            apiClass: '9th'
        },
        { 
            id: '10th', 
            name: '10th Standard', 
            icon: FaBook,
            description: 'Board-wise Preparation',
            subjects: ['CBSE', 'State Boards'],
            difficulty: 'Intermediate',
            apiClass: '10th'
        },
        { 
            id: '11th', 
            name: '11th Standard', 
            icon: FaGraduationCap,
            description: 'Board-wise Preparation',
            subjects: ['CBSE', 'State Boards'],
            difficulty: 'Advanced',
            apiClass: '11th'
        },
        { 
            id: '12th', 
            name: '12th Standard', 
            icon: FaUniversity,
            description: 'Board-wise Preparation',
            subjects: ['CBSE', 'State Boards'],
            difficulty: 'Advanced',
            apiClass: '12th'
        },
        // Temporarily disabled engineering card
        // { 
        //     id: 'engineering', 
        //     name: 'Engineering', 
        //     icon: FaLaptopCode,
        //     description: 'Professional skill development',
        //     subjects: ['Programming', 'Web Dev', 'Data Science'],
        //     difficulty: 'Expert',
        //     apiClass: 'engineering'
        // },
    ];

    // Function to check if courses exist for a specific class level
    const checkCoursesAvailability = async () => {
        // First check if we have cached availability data
        const cachedAvailability = courseCache.getCourseAvailability();
        if (cachedAvailability) {
            console.log('📦 Using cached course availability data (Mobile)');
            setAvailableLevels(cachedAvailability);
            setLoading(false);
            return;
        }

        console.log('🔄 Fetching fresh course availability data (Mobile)');
        setLoading(true);

        try {
            // Define levels that are always available (skip API check)
            const alwaysAvailableIds = ['10th', '11th'];
            
            // Filter levels that need checking (exclude engineering and always available ones)
            const levelsToCheck = allEducationLevels.filter(level => 
                level.apiClass !== 'engineering' && !alwaysAvailableIds.includes(level.id)
            );

            // Fire requests in parallel and keep payloads small
            const schoolPromises = levelsToCheck.map(level =>
                api.get('/courses/school/', { params: { class: level.apiClass, limit: 1 } })
                    .then(({ data }) => ({ level, data }))
                    .catch(error => ({ level, error }))
            );

            // Engineering (currently hidden, but keep logic resilient)
            const engineeringLevel = allEducationLevels.find(l => l.apiClass === 'engineering');
            const engineeringPromise = engineeringLevel
                ? api.get('/courses/engineering/', { params: { limit: 1 } })
                    .then(({ data }) => ({ level: engineeringLevel, data }))
                    .catch(error => ({ level: engineeringLevel, error }))
                : Promise.resolve(null);

            const results = await Promise.allSettled([
                ...schoolPromises,
                engineeringPromise,
            ]);

            // Start with the always available levels
            const levelsWithCourses = allEducationLevels.filter(level => alwaysAvailableIds.includes(level.id));

            results.forEach(result => {
                if (!result || result.status !== 'fulfilled') return;
                const payload = result.value;
                if (!payload || payload.error) {
                    if (payload?.error) logger.error(`Error checking courses for ${payload.level?.apiClass}:`, payload.error);
                    return;
                }

                const { level, data } = payload;
                const count = Array.isArray(data) ? data.length : (data?.results?.length || 0);
                if (count > 0) {
                    levelsWithCourses.push(level);
                    // Optionally cache tiny payload to warm level cache
                    const items = Array.isArray(data) ? data : (data?.results || []);
                    courseCache.setCoursesForLevel(level.apiClass, items);
                }
            });

            // Sort levels to match the original order in allEducationLevels
            const finalLevels = allEducationLevels.filter(level => 
                levelsWithCourses.some(l => l.id === level.id)
            );

            // Cache only non-empty availability to avoid persisting a blank screen
            if (finalLevels.length > 0) {
                courseCache.setCourseAvailability(finalLevels);
            }
            setAvailableLevels(finalLevels);
        } catch (error) {
            logger.error('Error checking course availability:', error);
            // Fallback: show all levels if API fails
            setAvailableLevels(allEducationLevels);
        } finally {
            setLoading(false);
        }
    };

    const handleLevelSelect = (level) => {
        setSelectedLevel(level);
        navigate(`/courses/${level}`);
    };

    useEffect(() => {
        // Defer the availability check slightly to avoid blocking paint, but keep it fast
        const t = setTimeout(checkCoursesAvailability, 0);
        // Prefetch board/state availability on mobile entry as well
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const run = () => prefetchBoardsAndStates(undefined, controller?.signal);
        const handle = typeof requestIdleCallback !== 'undefined'
            ? requestIdleCallback(run, { timeout: 1500 })
            : setTimeout(run, 200);
        return () => {
            clearTimeout(t);
            if (typeof cancelIdleCallback !== 'undefined') try { cancelIdleCallback(handle); } catch {}
            else clearTimeout(handle);
            try { controller?.abort(); } catch {}
        };
    }, []);

    useEffect(() => {
        // Derive selected level from URL so back/forward navigation renders correct child
        const segments = location.pathname.split('/').filter(Boolean);
        if (segments[0] === 'courses' && segments[1]) {
            const levelId = segments[1];
            if (allEducationLevels.some(l => l.id === levelId)) {
                setSelectedLevel(levelId);
                return;
            }
        }

        if (location.pathname === '/courses') {
            setSelectedLevel(null);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = availableLevels.filter(level =>
                level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                level.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                level.subjects.some(subject => 
                    subject.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
            setFilteredLevels(filtered);
        } else {
            setFilteredLevels(availableLevels);
        }
    }, [searchQuery, availableLevels]);

    const MobileHero = () => (
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white pt-16 pb-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-4 w-20 h-20 border-2 border-white rounded-full animate-pulse"></div>
                <div className="absolute top-32 right-8 w-16 h-16 border border-white rounded-full animate-bounce"></div>
                <div className="absolute bottom-10 left-1/3 w-12 h-12 border border-white rounded-full"></div>
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">
                        Find Your Perfect Course
                    </h1>
                    <p className="text-sm sm:text-base opacity-90 mb-6 px-4">
                        Choose your education level and start learning today
                    </p>
                    
                    {/* Feature highlights */}
                    <div className="flex justify-center space-x-6 text-center">
                        <div className="flex flex-col items-center">
                            <div className="mb-1">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div className="text-xs opacity-80">Interactive Learning</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="mb-1 flex justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-xs opacity-80">Personalized Path</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="mb-1">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="text-xs opacity-80">AI-Powered</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    const SearchSection = () => (
        <div className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="flex-shrink-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 
                                 transition-colors duration-200"
                    >
                        <FaSearch className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {showSearch && (
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search courses, subjects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg 
                                             focus:outline-none focus:ring-2 focus:ring-indigo-500 
                                             focus:border-transparent text-sm"
                                />
                            </div>
                        )}
                    
                    <div className="text-sm text-gray-500">
                        {filteredLevels.length} course{filteredLevels.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
        </div>
    );

    const MobileCourseCard = ({ level, index }) => {
        // Safely get the icon component or use a default
        const IconComponent = level.icon || FaBook;
        
        return (
            <button
                onClick={() => handleLevelSelect(level.id)}
                className="w-full bg-white rounded-2xl shadow-sm hover:shadow-lg 
                         transition-shadow duration-200 border border-gray-100 overflow-hidden
                         active:scale-95 transform"
            >
                {/* Clean Card Header */}
                <div className="h-20 bg-gradient-to-r from-gray-50 to-gray-100 relative overflow-hidden border-b border-gray-100">
                    <div className="absolute top-3 right-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                <div className="absolute bottom-3 left-4">
                    <div className="flex items-center space-x-1 text-gray-600">
                        <FaStar className="w-3 h-3" />
                        <span className="text-xs font-medium">{level.difficulty}</span>
                    </div>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{level.name}</h3>
                    <FaChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {level.description}
                </p>
                
                {/* Subject Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {(level.subjects || []).slice(0, 3).map((subject, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
                        >
                            {subject}
                        </span>
                    ))}
                    {level.id !== 'engineering' && (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                            + More
                        </span>
                    )}
                    {(level.subjects && level.subjects.length > 3) && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs">
                            +{level.subjects.length - 3}
                        </span>
                    )}
                </div>

                {/* Progress indicator or call to action */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Tap to explore</span>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
            </div>
        </button>
        );
    };

    if (selectedLevel) {
        return (
            <>
                <Outlet />
                {/* Footer hidden for class subpages on mobile */}
            </>
        );
    }

    return (
        <>
            <MobileHero />
            
            <div className="bg-gray-50 min-h-screen pb-6">
                <div className="container mx-auto px-4 py-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading available courses...</p>
                        </div>
                    ) : availableLevels.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📚</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Courses Available Yet</h3>
                            <p className="text-gray-500">New courses will appear here as they are added by administrators.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Course Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredLevels.map((level, index) => (
                                    <MobileCourseCard 
                                        key={level.id} 
                                        level={level} 
                                        index={index} 
                                    />
                                ))}
                            </div>

                            {/* Empty State for Search */}
                            {filteredLevels.length === 0 && searchQuery && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full 
                                                  flex items-center justify-center">
                                        <FaSearch className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No courses found
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        Try searching with different keywords
                                    </p>
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg 
                                                 text-sm font-medium hover:bg-indigo-700 transition-colors"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MobileFirstCourses;
