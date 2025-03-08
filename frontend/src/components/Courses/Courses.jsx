import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaBook, FaUniversity, FaLaptopCode } from 'react-icons/fa';
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import CourseHero from "./CourseHero/CourseHero";

const Courses = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedLevel, setSelectedLevel] = useState(null);

    const educationLevels = [
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
            id: 'undergraduate', 
            name: 'Undergraduate', 
            icon: FaLaptopCode,
            description: 'Professional skill development'
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
            <Navbar initialStyle="gradient"/>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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