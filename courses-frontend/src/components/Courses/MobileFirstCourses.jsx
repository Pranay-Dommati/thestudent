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

    // New State for View Mode
    const [viewMode, setViewMode] = useState('discovery');
    const [allCourses, setAllCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

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
        // STRICT REQUIREMENT: Only show 10th and 11th standard cards.
        // No API checks, no conditions, just these two.
        const forcedLevels = allEducationLevels.filter(level =>
            level.id === '10th' || level.id === '11th'
        );

        setAvailableLevels(forcedLevels);
        setLoading(false);
    };

    const fetchAllCourses = async () => {
        setLoadingCourses(true);
        try {
            const response = await api.get('/courses/all/');
            if (response.data) {
                // Filter out engineering courses (DSA, Python, etc.) as requested
                // Using a blacklist approach since some valid school courses might have varying class_level values
                const hiddenKeywords = ['python', 'dsa', 'data structures', 'engineering', 'web development', 'coding'];
                const filteredCourses = response.data.filter(course => {
                    const title = course.title?.toLowerCase() || '';
                    const subject = course.subject?.toLowerCase() || '';

                    // Check if title or subject contains any hidden keywords
                    const isHidden = hiddenKeywords.some(keyword =>
                        title.includes(keyword) || subject.includes(keyword)
                    );

                    return !isHidden;
                });
                setAllCourses(filteredCourses);
            }
        } catch (error) {
            logger.error('Error fetching all courses (mobile):', error);
        } finally {
            setLoadingCourses(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(checkCoursesAvailability, 0);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (viewMode === 'discovery' && allCourses.length === 0) {
            fetchAllCourses();
        }
    }, [viewMode]);

    const handleLevelSelect = (level) => {
        setSelectedLevel(level);
        navigate(`/${level}`);
    };

    useEffect(() => {
        const segments = location.pathname.split('/').filter(Boolean);
        if (segments.length === 0) {
            setSelectedLevel(null);
            return;
        }
        const levelId = segments[0];
        if (allEducationLevels.some(l => l.id === levelId)) {
            setSelectedLevel(levelId);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (searchQuery.trim()) {
            if (viewMode === 'by_class') {
                const filtered = availableLevels.filter(level =>
                    level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    level.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    level.subjects.some(subject =>
                        subject.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                );
                setFilteredLevels(filtered);
            } else {
                // Discovery mode filtering handled in render or derived state
            }
        } else {
            setFilteredLevels(availableLevels);
        }
    }, [searchQuery, availableLevels, viewMode]);

    const MobileHero = () => (
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white pt-16 pb-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-4 w-20 h-20 border-2 border-white rounded-full animate-pulse"></div>
                <div className="absolute top-32 right-8 w-16 h-16 border border-white rounded-full animate-bounce"></div>
                <div className="absolute bottom-10 left-1/3 w-12 h-12 border border-white rounded-full"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mt-6">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 leading-tight tracking-tight text-white">
                        Start Learning
                    </h1>
                    <p className="text-sm sm:text-base text-white/80 mb-6 px-4">
                        Browse courses directly, or discover what fits your class best.
                    </p>

                    {/* Mobile Toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/20 backdrop-blur-md p-1 rounded-full inline-flex border border-white/30 relative shadow-lg">
                            <button
                                onClick={() => setViewMode('discovery')}
                                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${viewMode === 'discovery'
                                    ? 'bg-white text-indigo-700 shadow-lg shadow-indigo-900/10 transform scale-105'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                All Courses
                            </button>
                            <button
                                onClick={() => setViewMode('by_class')}
                                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${viewMode === 'by_class'
                                    ? 'bg-white text-indigo-700 shadow-lg shadow-indigo-900/10 transform scale-105'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                Discover by Class
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    const SearchSection = () => (
        <div className="bg-white border-b border-gray-100">
            <div className="container mx-auto px-4 py-3">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={viewMode === 'discovery' ? "Search courses..." : "Search classes..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500 
                                     focus:border-transparent focus:bg-white text-sm transition-all"
                    />
                </div>
            </div>
        </div>
    );

    const MobileCourseCard = ({ level, index }) => {
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

    // Derived filtered courses for discovery mode
    const getDiscoveryCourses = () => {
        const baseList = allCourses;
        if (!searchQuery.trim()) return baseList;
        const lowerQ = searchQuery.toLowerCase();
        return baseList.filter(c =>
            c.title?.toLowerCase().includes(lowerQ) ||
            c.subject?.toLowerCase().includes(lowerQ)
        );
    };
    
    const filteredDiscovery = getDiscoveryCourses();
    const originals = filteredDiscovery.filter(c => c.source_type === 'original');
    const curated = filteredDiscovery.filter(c => c.source_type !== 'original');

    const navigateToCourse = (course) => {
        if (course.course_type === 'school' && course.class && course.category) {
            const classString = course.class || '';
            const [classLevel, boardPart] = classString.split(' - ').map(s => s?.trim());
            const subject = (course.category || '').toLowerCase();
            const sourceType = course.source_type === 'original' ? 'originals' : 'curated';

            if (classLevel && boardPart && subject) {
                const board = boardPart.toLowerCase();
                let path;
                if (board === 'state') {
                    path = `/${classLevel}/state/ts/${sourceType}/${subject}?courseId=${course.id}`;
                } else {
                    path = `/${classLevel}/${board}/${sourceType}/${subject}?courseId=${course.id}`;
                }
                navigate(path);
                return;
            }
        }
        navigate(`/${course.id}`);
    };

    if (selectedLevel) {
        return (
            <>
                <Outlet />
            </>
        );
    }

    return (
        <>
            <MobileHero />

            {/* Search Section - Inlined to prevent focus loss */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-3">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={viewMode === 'discovery' ? "Search courses..." : "Search classes..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                                         focus:outline-none focus:ring-2 focus:ring-indigo-500 
                                         focus:border-transparent focus:bg-white text-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 min-h-screen pb-6">
                <div className="container mx-auto px-4 py-6">
                    {viewMode === 'discovery' ? (
                        // Discovery View with Two Sections
                        <div className="space-y-10">
                            {/* Section 1: EasyLearnova Originals */}
                            <section>
                                <div className="mb-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            EasyLearnova Originals
                                        </h3>
                                        {originals.length === 0 && (
                                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 ml-4">Expert-crafted courses by our educators</p>
                                </div>

                                {loadingCourses ? (
                                    <div className="space-y-4">
                                        {[...Array(2)].map((_, i) => (
                                            <div key={i} className="bg-white rounded-xl shadow-sm p-3 flex gap-3 border border-gray-100 animate-pulse">
                                                <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-xl" />
                                                <div className="flex-1 flex flex-col justify-center space-y-2">
                                                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : originals.length > 0 ? (
                                    <div className="space-y-4">
                                        {originals.map((course) => (
                                            <div
                                                key={course.id}
                                                onClick={() => navigateToCourse(course)}
                                                className="bg-white rounded-xl shadow-sm hover:shadow p-3 flex gap-3 border border-indigo-100 active:scale-[0.99] transition-transform"
                                            >
                                                <div className="w-24 h-24 flex-shrink-0 relative">
                                                    <img
                                                        src={course.thumbnail}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                    <div className="absolute top-1 right-1 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                                        ORIGINAL
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    {course.class && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                                {course.class}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">{course.category}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-xl border border-indigo-100/50 py-8 px-4 text-center">
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Original courses created by EasyLearnova, with structured lessons and clear explanations.
                                        </p>
                                    </div>
                                )}
                            </section>

                            {/* Section 2: YouTube Curated */}
                            <section>
                                <div className="mb-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-1 h-5 bg-gray-400 rounded-full"></div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            YouTube Curated
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-400 ml-4">Playlists from top educators across YouTube</p>
                                </div>

                                {loadingCourses ? (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="bg-white rounded-xl shadow-sm p-3 flex gap-3 border border-gray-100 animate-pulse">
                                                <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-xl" />
                                                <div className="flex-1 flex flex-col justify-center space-y-2">
                                                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : curated.length > 0 ? (
                                    <div className="space-y-4">
                                        {curated.map((course) => (
                                            <div
                                                key={course.id}
                                                onClick={() => navigateToCourse(course)}
                                                className="bg-white rounded-xl shadow-sm hover:shadow p-3 flex gap-3 border border-gray-100 active:scale-[0.99] transition-transform"
                                            >
                                                <div className="w-24 h-24 flex-shrink-0 relative">
                                                    <img
                                                        src={course.thumbnail || `https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&text=${encodeURIComponent(course.subject || 'Course')}`}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover rounded-xl opacity-90"
                                                    />
                                                    <div className="absolute top-1 right-1 bg-gray-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                                                        <span>▶</span> <span>CURATED</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    {course.class && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                {course.class}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">{course.category}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <div className="text-gray-300 text-4xl mb-3">🔍</div>
                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">No courses found</h3>
                                        <p className="text-xs text-gray-500 px-6">Check back later for new content or try a different search.</p>
                                    </div>
                                )}
                            </section>

                            {/* Side-by-Side CTA Section (Mobile - Stacked) */}
                            <div className="mt-12 mb-8 pt-8 border-t border-gray-100">
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        Not sure where to start?
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-5">
                                        We'll create a clear learning path for you — step by step.
                                    </p>
                                    <button
                                        onClick={() => navigate('/learning-path')}
                                        className="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold active:scale-[0.98] transition-all shadow-sm"
                                    >
                                        Get My Learning Path
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // By Class View (Existing Mobile Logic)
                        loading ? (
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
                        )
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MobileFirstCourses;
