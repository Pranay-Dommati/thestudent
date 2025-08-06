import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import '../../styles/mobile-courses.css';

const MobileFirstCourses = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [filteredLevels, setFilteredLevels] = useState([]);

    const educationLevels = [
        { 
            id: '6th', 
            name: '6th Standard', 
            icon: FaBook,
            description: 'Foundation courses for 6th grade',
            subjects: ['Math', 'Science', 'English'],
            difficulty: 'Beginner'
        },
        { 
            id: '7th', 
            name: '7th Standard', 
            icon: FaBook,
            description: 'Foundation courses for 7th grade',
            subjects: ['Math', 'Science', 'English', 'Social'],
            difficulty: 'Beginner'
        },
        { 
            id: '8th', 
            name: '8th Standard', 
            icon: FaBook,
            description: 'Foundation courses for 8th grade',
            subjects: ['Math', 'Science', 'English', 'Social'],
            difficulty: 'Beginner'
        },
        { 
            id: '9th', 
            name: '9th Standard', 
            icon: FaGraduationCap,
            description: 'Foundation courses for 9th grade',
            subjects: ['Math', 'Physics', 'Chemistry', 'Biology'],
            difficulty: 'Intermediate'
        },
        { 
            id: '10th', 
            name: '10th Standard', 
            icon: FaBook,
            description: 'Board exam preparation',
            subjects: ['Math', 'Physics', 'Chemistry', 'Biology'],
            difficulty: 'Intermediate'
        },
        { 
            id: '11th', 
            name: '11th Standard', 
            icon: FaGraduationCap,
            description: 'Advanced courses for 11th grade',
            subjects: ['Math', 'Physics', 'Chemistry', 'Biology'],
            difficulty: 'Advanced'
        },
        { 
            id: '12th', 
            name: '12th Standard', 
            icon: FaUniversity,
            description: 'Board & entrance exam prep',
            subjects: ['Math', 'Physics', 'Chemistry', 'Biology'],
            difficulty: 'Advanced'
        },
        { 
            id: 'engineering', 
            name: 'Engineering', 
            icon: FaLaptopCode,
            description: 'Professional skill development',
            subjects: ['Programming', 'Web Dev', 'Data Science'],
            difficulty: 'Expert'
        },
    ];

    const handleLevelSelect = (level) => {
        setSelectedLevel(level);
        navigate(`/courses/${level}`);
    };

    useEffect(() => {
        if (location.pathname === '/courses') {
            setSelectedLevel(null);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = educationLevels.filter(level =>
                level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                level.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                level.subjects.some(subject => 
                    subject.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
            setFilteredLevels(filtered);
        } else {
            setFilteredLevels(educationLevels);
        }
    }, [searchQuery]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    const searchVariants = {
        hidden: { opacity: 0, height: 0 },
        visible: { 
            opacity: 1, 
            height: "auto",
            transition: { duration: 0.3 }
        }
    };

    const MobileHero = () => (
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white pt-16 pb-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-4 w-20 h-20 border-2 border-white rounded-full animate-pulse"></div>
                <div className="absolute top-32 right-8 w-16 h-16 border border-white rounded-full animate-bounce"></div>
                <div className="absolute bottom-10 left-1/3 w-12 h-12 border border-white rounded-full"></div>
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
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
                </motion.div>
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
                    
                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                variants={searchVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className="flex-1"
                            >
                                <input
                                    type="text"
                                    placeholder="Search courses, subjects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg 
                                             focus:outline-none focus:ring-2 focus:ring-indigo-500 
                                             focus:border-transparent text-sm"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <div className="text-sm text-gray-500">
                        {filteredLevels.length} course{filteredLevels.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
        </div>
    );

    const MobileCourseCard = ({ level, index }) => (
        <motion.button
            variants={cardVariants}
            onClick={() => handleLevelSelect(level.id)}
            className="w-full bg-white rounded-2xl shadow-sm hover:shadow-lg 
                     transition-all duration-300 border border-gray-100 overflow-hidden
                     active:scale-95 transform"
            whileTap={{ scale: 0.98 }}
        >
            {/* Clean Card Header */}
            <div className="h-20 bg-gradient-to-r from-gray-50 to-gray-100 relative overflow-hidden border-b border-gray-100">
                <div className="absolute top-3 right-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <level.icon className="w-5 h-5 text-indigo-600" />
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
                    {level.subjects.slice(0, 3).map((subject, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
                        >
                            {subject}
                        </span>
                    ))}
                    {level.subjects.length > 3 && (
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
        </motion.button>
    );

    if (selectedLevel) {
        return (
            <>
                <Navbar initialStyle="transparent"/>
                <Outlet />
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar initialStyle="transparent"/>
            <MobileHero />
            <SearchSection />
            
            <div className="bg-gray-50 min-h-screen pb-6">
                <div className="container mx-auto px-4 py-6">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                    >
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

                        {/* Empty State */}
                        {filteredLevels.length === 0 && searchQuery && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-12"
                            >
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
                            </motion.div>
                        )}

                        {/* Quick Actions */}
                        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-3 bg-indigo-50 rounded-lg flex flex-col items-center 
                                                 space-y-2 hover:bg-indigo-100 transition-colors">
                                    <FaBook className="w-5 h-5 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-900">My Courses</span>
                                </button>
                                <button className="p-3 bg-indigo-50 rounded-lg flex flex-col items-center 
                                                 space-y-2 hover:bg-indigo-100 transition-colors">
                                    <FaGraduationCap className="w-5 h-5 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-900">Progress</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MobileFirstCourses;
