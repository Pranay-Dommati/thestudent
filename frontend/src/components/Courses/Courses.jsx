import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaBook, FaUniversity, FaLaptopCode } from 'react-icons/fa';
import { getAllCourses, getEngineeringCourses } from '../../services/courseApi';
import Footer from "../Footer/Footer";
import CourseHero from "./CourseHero/CourseHero";

const Courses = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    const allEducationLevels = [
        { 
            id: '6th', 
            name: '6th Standard', 
            icon: FaBook,
            description: 'Foundation courses for 6th grade students'
        },
        { 
            id: '7th', 
            name: '7th Standard', 
            icon: FaBook,
            description: 'Foundation courses for 7th grade students'
        },
        { 
            id: '8th', 
            name: '8th Standard', 
            icon: FaBook,
            description: 'Foundation courses for 8th grade students'
        },
        { 
            id: '9th', 
            name: '9th Standard', 
            icon: FaGraduationCap,
            description: 'Foundation courses for 9th grade students'
        },
        { 
            id: '10th', 
            name: '10th Standard', 
            icon: FaBook,
            description: 'Foundation courses for 10th grade students'
        },
        { 
            id: '11th', 
            name: '11th Standard', 
            icon: FaGraduationCap,
            description: 'Advanced courses for 11th grade students'
        },
        { 
            id: '12th', 
            name: '12th Standard', 
            icon: FaUniversity,
            description: 'Preparation for higher education'
        },
        { 
            id: 'engineering', 
            name: 'Engineering', 
            icon: FaLaptopCode,
            description: 'Professional skill development'
        },
    ];

    // Check which classes have available courses
    useEffect(() => {
        const checkAvailableClasses = async () => {
            try {
                setLoading(true);
                console.log('🔍 Checking available classes...');
                
                // Get all school courses
                const schoolCourses = await getAllCourses();
                console.log('📚 School courses:', schoolCourses);
                
                // Get engineering courses
                const engineeringCourses = await getEngineeringCourses();
                console.log('🔧 Engineering courses:', engineeringCourses);
                
                // Find unique class levels that have courses
                // The API returns courses with different field names, so check multiple possibilities
                const availableSchoolClasses = [...new Set(
                    schoolCourses
                        .filter(course => course.course_type === 'school')
                        .map(course => {
                            // Check various field names that might contain class info
                            const classInfo = course.class || course.class_level || course.category;
                            // Extract class number from strings like "6th - state" or "6th"
                            if (typeof classInfo === 'string') {
                                const match = classInfo.match(/(\d+)(th|st|nd|rd)/);
                                return match ? `${match[1]}th` : null;
                            }
                            return classInfo;
                        })
                        .filter(Boolean)
                )];
                
                console.log('📊 Available school classes:', availableSchoolClasses);
                
                // Add engineering if it has courses
                const classesWithCourses = [...availableSchoolClasses];
                if (engineeringCourses && engineeringCourses.length > 0) {
                    classesWithCourses.push('engineering');
                }
                
                console.log('✅ Classes with courses:', classesWithCourses);
                setAvailableClasses(classesWithCourses);
                
            } catch (error) {
                console.error('❌ Error checking available classes:', error);
                // If there's an error, show all classes as fallback
                setAvailableClasses(allEducationLevels.map(level => level.id));
            } finally {
                setLoading(false);
            }
        };

        // Only check when on main courses page
        if (location.pathname === '/courses') {
            checkAvailableClasses();
        }
    }, [location.pathname]);

    // Filter education levels to only show those with available courses
    const educationLevels = allEducationLevels.filter(level => 
        availableClasses.includes(level.id)
    );

    const handleLevelSelect = (level) => {
        setSelectedLevel(level);
        navigate(`/courses/${level}`);
    };

    useEffect(() => {
        if (location.pathname === '/courses') {
            setSelectedLevel(null);
        }
    }, [location.pathname]);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.3 }
        }
    };

    return (
        <>
            <CourseHero />
            <div className="bg-gray-50 pb-16 pt-7">
                <div className="container mx-auto px-4 py-12">
                    {!selectedLevel ? (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="max-w-6xl mx-auto"
                        >
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                    Choose Your Learning Path
                                </h2>
                                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                    Select your education level to discover personalized learning resources
                                </p>
                            </div>
                            
                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {[...Array(8)].map((_, index) => (
                                        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100">
                                            <div className="p-8 animate-pulse">
                                                <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-4"></div>
                                                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                                <div className="h-4 bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : educationLevels.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {educationLevels.map((level) => (
                                        <motion.button
                                            key={level.id}
                                            onClick={() => handleLevelSelect(level.id)}
                                            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl 
                                                     transition-all duration-300 border border-gray-100 overflow-hidden"
                                            whileHover={{ y: -5 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 
                                                          opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                                            <div className="relative p-8 flex flex-col items-center text-center">
                                                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center 
                                                              justify-center mb-4 group-hover:bg-indigo-600 
                                                              transition-colors duration-300">
                                                    <level.icon className="w-8 h-8 text-indigo-600 
                                                                         group-hover:text-white transition-colors"/>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                    {level.name}
                                                </h3>
                                                <p className="text-gray-500 text-sm group-hover:text-gray-600">
                                                    {level.description}
                                                </p>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                                        <FaBook className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No Courses Available</h3>
                                    <p className="text-gray-600 text-lg max-w-md mx-auto mb-8">
                                        There are currently no courses available. Check back later or contact support.
                                    </p>
                                    <button 
                                        onClick={() => window.location.reload()}
                                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Refresh Page
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <Outlet />
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Courses;