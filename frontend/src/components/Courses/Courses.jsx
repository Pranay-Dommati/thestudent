import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaBook, FaUniversity, FaLaptopCode } from 'react-icons/fa';
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import CourseHero from "./CourseHero/CourseHero";
import CourseCategories from "./CourseCategories/CourseCategories";
import CourseFilters from "./CourseFilters/CourseFilters";
import CourseListings from "./CourseListings/CourseListings";
import TenthStandard from './categories/10th/TenthStandard';
import EleventhStandard from './categories/11th/EleventhStandard';
import TwelfthStandard from './categories/12th/TwelveStandard';
import Undergraduate from './categories/undergraduate/Undergraduate';

const Courses = () => {
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filters, setFilters] = useState({
        skillLevel: 'all',
        duration: 'all',
        sortBy: 'popular'
    });

    // Education levels and boards configuration
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

    const boards = [
        { id: 'cbse', name: 'CBSE' },
        { id: 'ssc', name: 'State Board (SSC)' },
        { id: 'icse', name: 'ICSE' },
        { id: 'ib', name: 'International Baccalaureate' },
    ];

    const handleLevelSelect = (level) => {
        setSelectedLevel(level);
        if (level === 'undergraduate') {
            setSelectedBoard(null);
        }
    };

    const handleBoardSelect = (board) => {
        setSelectedBoard(board);
    };

    const handleBackToLevels = () => {
        setSelectedLevel(null);
        setSelectedBoard(null);
    };

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
                    ) : selectedLevel !== 'undergraduate' && !selectedBoard ? (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="max-w-4xl mx-auto"
                        >
                            <div className="flex items-center mb-8">
                                <motion.button 
                                    onClick={handleBackToLevels}
                                    className="mr-4 p-2 hover:bg-white rounded-full transition-all
                                             hover:shadow-md text-gray-600 hover:text-indigo-600"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" 
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                              d="M15 19l-7-7 7-7" />
                                    </svg>
                                </motion.button>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">
                                        Select Your Board
                                    </h2>
                                    <p className="text-gray-600 mt-1">
                                        Choose your education board to view relevant courses
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {boards.map((board) => (
                                    <motion.button
                                        key={board.id}
                                        onClick={() => handleBoardSelect(board.id)}
                                        className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-xl 
                                                 transition-all duration-300 border border-gray-100"
                                        whileHover={{ y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{board.name}</h3>
                                        <p className="text-gray-500 text-sm">
                                            View courses specifically designed for {board.name} students
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col">
                            {/* For 10th, 11th, and 12th standard */}
                            {selectedLevel !== 'undergraduate' && (
                                <>
                                    {selectedLevel === '10th' && <TenthStandard board={selectedBoard} />}
                                    {selectedLevel === '11th' && <EleventhStandard board={selectedBoard} />}
                                    {selectedLevel === '12th' && <TwelfthStandard board={selectedBoard} />}
                                </>
                            )}

                            {/* For undergraduate - keeping the filters */}
                            {selectedLevel === 'undergraduate' && (
                                <Undergraduate 
                                    selectedCategory={selectedCategory}
                                    onCategoryChange={setSelectedCategory}
                                    filters={filters}
                                    onFilterChange={setFilters}
                                    onBackClick={handleBackToLevels}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Courses;