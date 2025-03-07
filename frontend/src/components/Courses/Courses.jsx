import React, { useState } from 'react';
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import CourseHero from "./CourseHero/CourseHero";
import CourseCategories from "./CourseCategories/CourseCategories";
import CourseFilters from "./CourseFilters/CourseFilters";
import CourseListings from "./CourseListings/CourseListings";

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
        { id: '10th', name: '10th Standard', icon: '📚' },
        { id: '11th', name: '11th Standard', icon: '📖' },
        { id: '12th', name: '12th Standard', icon: '🎓' },
        { id: 'undergraduate', name: 'Undergraduate', icon: '🎯' },
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

    return (
        <>
            <Navbar initialStyle="gradient"/>
            <CourseHero />
            <div className="container mx-auto px-4 py-25">
                {!selectedLevel ? (
                    // Education Level Selection
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                            Select Your Education Level
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {educationLevels.map((level) => (
                                <button
                                    key={level.id}
                                    onClick={() => handleLevelSelect(level.id)}
                                    className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 
                                             border border-gray-100 flex flex-col items-center justify-center gap-3
                                             transform hover:scale-105"
                                >
                                    <span className="text-4xl">{level.icon}</span>
                                    <h3 className="text-lg font-semibold text-gray-800">{level.name}</h3>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : selectedLevel !== 'undergraduate' && !selectedBoard ? (
                    // Board Selection for 10th, 11th, and 12th
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center mb-6">
                            <button 
                                onClick={handleBackToLevels}
                                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Select Your Board
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {boards.map((board) => (
                                <button
                                    key={board.id}
                                    onClick={() => handleBoardSelect(board.id)}
                                    className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300
                                             border border-gray-100 text-left
                                             transform hover:scale-105"
                                >
                                    <h3 className="text-lg font-semibold text-gray-800">{board.name}</h3>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Course Listings with Filters
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="md:w-1/4">
                            {(selectedLevel === 'undergraduate' || selectedBoard) && (
                                <div className="mb-6">
                                    <button 
                                        onClick={handleBackToLevels}
                                        className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back to Levels
                                    </button>
                                </div>
                            )}
                            <CourseCategories 
                                selectedCategory={selectedCategory} 
                                onCategoryChange={setSelectedCategory}
                                educationLevel={selectedLevel}
                                board={selectedBoard}
                            />
                            <CourseFilters 
                                filters={filters} 
                                onFilterChange={setFilters}
                            />
                        </div>
                        <div className="md:w-3/4">
                            <CourseListings 
                                category={selectedCategory}
                                filters={filters}
                                educationLevel={selectedLevel}
                                board={selectedBoard}
                            />
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default Courses;