import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FaGraduationCap, FaBook, FaUniversity, FaLaptopCode } from 'react-icons/fa';
import Footer from "../Footer/Footer";
import CourseHero from "./CourseHero/CourseHero";
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
        // Temporarily hidden - Engineering card
        // { 
        //     id: 'engineering', 
        //     name: 'Engineering', 
        //     icon: FaLaptopCode,
        //     description: 'Professional skill development',
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

    useEffect(() => {
        // Defer the availability check slightly to avoid blocking paint, but keep it fast
        const t = setTimeout(checkCoursesAvailability, 0);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        // Also prefetch board/state availability immediately when landing on /courses
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
        // Derive selected level from URL so back/forward navigation renders correct child
        const segments = location.pathname.split('/').filter(Boolean);
        // segments example: ['6th', 'cbse'] (was ['courses', '6th', 'cbse'])

        // If we are at root /, show chooser
        if (segments.length === 0) {
            setSelectedLevel(null);
            return;
        }

        // If first segment is a valid level ID
        const levelId = segments[0];
        if (allEducationLevels.some(l => l.id === levelId)) {
            setSelectedLevel(levelId);
        }
    }, [location.pathname]);

    return (
        <>
            <CourseHero />
            <div className="bg-gray-50 pt-7">
                <div className="container mx-auto px-4 py-12">
                    {!selectedLevel ? (
                        <div className="max-w-6xl mx-auto"
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
                                <div className="text-center py-12">
                                    {/* Loading skeleton cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
                            )}
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