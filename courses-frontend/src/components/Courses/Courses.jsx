import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FaGraduationCap, FaBook, FaUniversity, FaLaptopCode } from 'react-icons/fa';
import Footer from "../Footer/Footer";
import CourseHero from "./CourseHero/CourseHero";
import SEO from "../SEO/SEO";
import logger from '../../utils/logger';
import api from '../../utils/axios';
import { courseCache } from '../../utils/courseCache';
import prefetchBoardsAndStates from '../../utils/prefetchBoardsAndStates';

const Courses = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [availableLevels, setAvailableLevels] = useState([]);
    const [loading, setLoading] = useState(true);

    // New State for View Mode: 'discovery' (default) or 'by_class'
    const [viewMode, setViewMode] = useState('discovery');
    const [allCourses, setAllCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    const allEducationLevels = [
        {
            id: '6th',
            name: '6th Standard',
            icon: FaBook,
            description: 'Foundation courses for 6th grade students',
            apiClass: '6th'
        },
        {
            id: '7th',
            name: '7th Standard',
            icon: FaBook,
            description: 'Foundation courses for 7th grade students',
            apiClass: '7th'
        },
        {
            id: '8th',
            name: '8th Standard',
            icon: FaBook,
            description: 'Foundation courses for 8th grade students',
            apiClass: '8th'
        },
        {
            id: '9th',
            name: '9th Standard',
            icon: FaGraduationCap,
            description: 'Foundation courses for 9th grade students',
            apiClass: '9th'
        },
        {
            id: '10th',
            name: '10th Standard',
            icon: FaBook,
            description: 'Foundation courses for 10th grade students',
            apiClass: '10th'
        },
        {
            id: '11th',
            name: '11th Standard',
            icon: FaGraduationCap,
            description: 'Advanced courses for 11th grade students',
            apiClass: '11th'
        },
        {
            id: '12th',
            name: '12th Standard',
            icon: FaUniversity,
            description: 'Preparation for higher education',
            apiClass: '12th'
        },
    ];

    // Function to check if courses exist for a specific class level
    const checkCoursesAvailability = async () => {
        // STRICT REQUIREMENT: Only show 10th and 11th standard cards.
        const forcedLevels = allEducationLevels.filter(level =>
            level.id === '10th' || level.id === '11th'
        );

        setAvailableLevels(forcedLevels);
        setLoading(false);
    };

    // Fetch all courses for Discovery Mode
    const fetchAllCourses = async () => {
        setLoadingCourses(true);
        try {
            // Using getAllCourses from api which hits /courses/all/
            // or we could use getCourses() which hits /courses/
            // Based on courseApi.js, getAllCourses seems more appropriate for filtering if needed later
            // But getCourses() returns the main list. Let's try getCourses first as it's the main list endpoint.
            // Actually, courseApi.js has `getAllCourses` which calls `/courses/all/` and `getCourses` which calls `/courses/`
            // Let's use `getAllCourses` as it likely bypasses some filters or gets everything.
            // Wait, looking at courseApi.js again, `getAllCourses` takes a category.
            // `getCourses` just hits `/courses/`. Let's try `getCourses` first as it seems to be the standard list.
            // If that fails or is paginated, we'll adjust.
            // Actually, let's use `getSchoolCourses` for specific standards if we want to ensure we get school content,
            // but "Discovery" implies everything.
            // Let's stick to `api.get('/courses/')` equivalent which is `import { getCourses } ...`
            // I need to import getCourses.
            // Update: I'll use the imported `api` to fetch directly for full control or import `getCourses` from courseApi.
            // Since I am inside `Courses.jsx`, I should use `courseApi`.
            // I need to update imports to include `getAllCourses`.

            // For now, I will use a direct API call via the existing `api` import or mock it if needed, 
            // but better to use the service. I'll add `import { getAllCourses } ...` to the top in a separate edit 
            // or just use generic `api` here since I can't change imports in this block easily without replacing the whole file header.
            // Actually, I am replacing the COMPONENT BODY, so I can't add imports effectively unless I assume they are there.
            // The file already has `import api from ...`. I will use that.

            const response = await api.get('/courses/all/'); // Direct call to ensure we get what we want
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
            logger.error('Error fetching all courses for discovery:', error);
        } finally {
            setLoadingCourses(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(checkCoursesAvailability, 0);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        // Fetch courses when entering discovery mode
        if (viewMode === 'discovery' && allCourses.length === 0) {
            fetchAllCourses();
        }
    }, [viewMode]);

    useEffect(() => {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const run = () => prefetchBoardsAndStates(undefined, controller?.signal);
        const handle = typeof requestIdleCallback !== 'undefined'
            ? requestIdleCallback(run, { timeout: 1500 })
            : setTimeout(run, 200);
        return () => {
            if (typeof cancelIdleCallback !== 'undefined') try { cancelIdleCallback(handle); } catch { }
            else clearTimeout(handle);
            try { controller?.abort(); } catch { }
        };
    }, []);

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

    // Render logic
    // const isRoot = !selectedLevel; // Removed as it caused regression

    return (
        <>
            <SEO
                title="Free Online Courses - CBSE & State Board | EasyLearnova"
                description="Explore free online courses for 10th, 11th, 12th standard students. CBSE and State Board playlists for Mathematics, Science, English and more."
                keywords="free online courses, CBSE courses, state board courses, 10th standard, 11th standard, 12th standard, school courses"
                canonical="https://courses.easylearnova.com/"
            />
            <CourseHero />
            <div className="bg-gray-50 pt-7">
                <div className="container mx-auto px-4 py-12">
                    {!selectedLevel ? (
                        <div id="courses" className="max-w-7xl mx-auto">
                            {/* Header & Toggle */}
                            <div className="flex flex-col items-center mb-12 mt-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                                    Start Learning
                                </h2>
                                <p className="text-gray-500 text-base max-w-2xl mx-auto text-center mb-10">
                                    Browse courses directly, or discover what fits your class best.
                                </p>

                                {/* Toggle Switch */}
                                <div className="bg-gray-100/50 p-1.5 rounded-full border border-gray-200/60 inline-flex relative">
                                    <button
                                        onClick={() => setViewMode('discovery')}
                                        className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${viewMode === 'discovery'
                                            ? 'bg-white text-indigo-700 shadow-md ring-1 ring-black/5 transform scale-105'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                                            }`}
                                    >
                                        All Courses
                                    </button>
                                    <button
                                        onClick={() => setViewMode('by_class')}
                                        className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${viewMode === 'by_class'
                                            ? 'bg-white text-indigo-700 shadow-md ring-1 ring-black/5 transform scale-105'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                                            }`}
                                    >
                                        Discover by Class
                                    </button>
                                </div>
                            </div>

                            {/* View Content */}
                            {viewMode === 'discovery' ? (
                                // Discovery View with Two Sections
                                <div className="space-y-14">
                                    {/* Section 1: EasyLearnova Originals */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                EasyLearnova Originals
                                            </h3>
                                            {allCourses.filter(c => c.source_type === 'original').length === 0 && (
                                                <span className="bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                                    Coming Soon
                                                </span>
                                            )}
                                        </div>

                                        {allCourses.filter(c => c.source_type === 'original').length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {allCourses.filter(c => c.source_type === 'original').map((course) => (
                                                    <div
                                                        key={course.id}
                                                        onClick={() => {
                                                            if (course.course_type === 'school' && course.class && course.category) {
                                                                const classString = course.class || '';
                                                                const [classLevel, boardPart] = classString.split(' - ').map(s => s?.trim());
                                                                const subject = (course.category || '').toLowerCase();

                                                                if (classLevel && boardPart && subject) {
                                                                    const board = boardPart.toLowerCase();
                                                                    let path;
                                                                    if (board === 'state') {
                                                                        path = `/${classLevel}/state/ts/${subject}?courseId=${course.id}`;
                                                                    } else {
                                                                        path = `/${classLevel}/${board}/${subject}?courseId=${course.id}`;
                                                                    }
                                                                    navigate(path);
                                                                    return;
                                                                }
                                                            }
                                                            navigate(`/${course.id}`);
                                                        }}
                                                        className="bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer border border-indigo-100 group transform"
                                                    >
                                                        <div className="aspect-video relative overflow-hidden bg-gray-100">
                                                            <img
                                                                src={course.thumbnail}
                                                                alt={course.title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            />
                                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md border border-indigo-100 text-indigo-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm z-20 flex items-center gap-1.5">
                                                                <span className="text-yellow-500 text-xs">★</span> <span>Original</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-5">
                                                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                                {course.title}
                                                            </h3>
                                                            <div className="flex items-center text-sm text-gray-500 mb-3">
                                                                <span>{course.category}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-gradient-to-r from-indigo-50 to-slate-50 rounded-xl border border-indigo-100/50 py-12 px-6 text-center">
                                                <p className="text-gray-500">
                                                    Original courses created by EasyLearnova, with structured lessons and clear explanations.
                                                </p>
                                            </div>
                                        )}
                                    </section>

                                    {/* Section 2: Youtube Curated */}
                                    <section>
                                        <div className="mb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-1 h-6 bg-gray-400 rounded-full"></div>
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    YouTube Curated
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-400 ml-4">
                                                This course uses publicly available YouTube videos. All rights belong to respective creators.
                                            </p>
                                        </div>

                                        {loadingCourses ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
                                                        <div className="aspect-video bg-gray-200" />
                                                        <div className="p-4 space-y-3">
                                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : allCourses.filter(c => c.source_type !== 'original').length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {allCourses.filter(c => c.source_type !== 'original').map((course) => (
                                                    <div
                                                        key={course.id}
                                                        onClick={() => {
                                                            if (course.course_type === 'school' && course.class && course.category) {
                                                                const classString = course.class || '';
                                                                const [classLevel, boardPart] = classString.split(' - ').map(s => s?.trim());
                                                                const subject = (course.category || '').toLowerCase();

                                                                if (classLevel && boardPart && subject) {
                                                                    const board = boardPart.toLowerCase();
                                                                    let path;
                                                                    if (board === 'state') {
                                                                        path = `/${classLevel}/state/ts/${subject}?courseId=${course.id}`;
                                                                    } else {
                                                                        path = `/${classLevel}/${board}/${subject}?courseId=${course.id}`;
                                                                    }
                                                                    navigate(path);
                                                                    return;
                                                                }
                                                            }
                                                            navigate(`/${course.id}`);
                                                        }}
                                                        className="bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100/80 group transform"
                                                    >
                                                        <div className="aspect-video relative overflow-hidden bg-gray-100">
                                                            <img
                                                                src={course.thumbnail || `https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&text=${encodeURIComponent(course.subject || 'Course')}`}
                                                                alt={course.title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                                                <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                                                                    Preview Course
                                                                </span>
                                                            </div>
                                                            <div className="absolute top-3 right-3 bg-gray-900/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium text-white z-20 flex items-center gap-1.5 border border-white/10">
                                                                <span>▶</span> <span>Curated</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-5">
                                                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                                {course.title}
                                                            </h3>
                                                            <div className="flex items-center text-sm text-gray-500 mb-3">
                                                                <span>{course.category}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                                <div className="text-gray-400 text-5xl mb-4">🔍</div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">No courses found</h3>
                                                <p className="text-gray-500">Check back later for new content.</p>
                                            </div>
                                        )}
                                    </section>
                                </div>
                            ) : (
                                // Class Selection View (Existing Logic)
                                loading ? (
                                    <div className="text-center py-12">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                                    <div className="p-8 flex flex-col items-center text-center">
                                                        <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse mb-4"></div>
                                                        <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : availableLevels.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 text-6xl mb-4">📚</div>
                                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Courses Available Yet</h3>
                                        <p className="text-gray-500">New courses will appear here as they are added by administrators.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {availableLevels.map((level) => {
                                            const IconComponent = level.icon || FaBook;
                                            return (
                                                <button
                                                    key={level.id}
                                                    onClick={() => handleLevelSelect(level.id)}
                                                    className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg 
                                                             transition-shadow duration-200 border border-gray-100 overflow-hidden active:scale-[0.98]"
                                                >
                                                    <div className="relative p-8 flex flex-col items-center text-center">
                                                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center 
                                                                      justify-center mb-4 group-hover:bg-indigo-600 
                                                                      transition-colors duration-200">
                                                            <IconComponent className="w-8 h-8 text-indigo-600 
                                                                                 group-hover:text-white transition-colors duration-200"/>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                            {level.name}
                                                        </h3>
                                                        <p className="text-gray-500 text-sm">
                                                            {level.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )
                            )}
                            {/* Side-by-Side CTA Section */}
                            <div className="mt-20 mb-8 pt-12 border-t border-gray-100">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 max-w-4xl mx-auto">
                                    {/* Text - Left */}
                                    <div className="text-center md:text-left">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            Not sure where to start?
                                        </h3>
                                        <p className="text-gray-500">
                                            We'll create a clear learning path for you — step by step.
                                        </p>
                                    </div>

                                    {/* Button - Right */}
                                    <button
                                        onClick={() => navigate('/learning-path')}
                                        className="flex-shrink-0 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        Get My Learning Path
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </div>
            </div>
            <div className="hidden md:block">
                <Footer />
            </div>
        </>
    );
}

export default Courses;