import React from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaBook, FaChartLine, FaUsers } from 'react-icons/fa';

const CourseHero = () => {
    const highlights = [
        {
            icon: FaGraduationCap,
            title: "Structured Learning",
            description: "Organized courses from 6th standard to Engineering"
        },
        {
            icon: FaChartLine,
            title: "Track Progress",
            description: "Monitor your learning journey effectively"
        },
        {
            icon: FaBook,
            title: "Practice through Quizzes",
            description: "Test your knowledge with interactive assessments"
        }
    ];

    return (
        <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-28 pb-16 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-5 left-10 w-16 h-16 border border-white rounded-full"></div>
                <div className="absolute top-10 right-20 w-12 h-12 border border-white rounded-full"></div>
                <div className="absolute bottom-5 left-1/3 w-8 h-8 border border-white rounded-full"></div>
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-10">
                    <motion.h1 
                        className="text-3xl md:text-5xl font-bold mb-6 leading-tight"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        Find the Perfect Course for You
                    </motion.h1>
                    <motion.p 
                        className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        Choose your class and explore courses designed for your academic success
                    </motion.p>
                </div>

                {/* Compact feature highlights */}
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    {highlights.map((item, index) => (
                        <div 
                            key={index}
                            className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300"
                        >
                            <item.icon className="w-6 h-6 mx-auto mb-3 text-white" />
                            <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
                            <p className="text-xs opacity-80 hidden md:block">{item.description}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default CourseHero;