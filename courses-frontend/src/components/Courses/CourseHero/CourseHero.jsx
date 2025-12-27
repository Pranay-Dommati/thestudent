import React from 'react';
import { FaGraduationCap, FaBook, FaChartLine, FaUsers } from 'react-icons/fa';

const CourseHero = () => {
    const highlights = [
        {
            icon: FaGraduationCap,
            title: "Expert-Designed Courses",
            description: "Structured content aligned with your curriculum"
        },
        {
            icon: FaBook,
            title: "Guided Learning Paths",
            description: "Personalized roadmaps for your academic goals"
        },
        {
            icon: FaChartLine,
            title: "Track Your Progress",
            description: "Monitor your learning journey effectively"
        }
    ];

    return (
        <section className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 text-white pt-16 md:pt-20 pb-14 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-5 left-10 w-16 h-16 border border-white rounded-full"></div>
                <div className="absolute top-10 right-20 w-12 h-12 border border-white rounded-full"></div>
                <div className="absolute bottom-5 left-1/3 w-8 h-8 border border-white rounded-full"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
                        Find the Right Course. Learn the Right Way.
                    </h1>
                    <p className="text-base md:text-lg mb-6 max-w-2xl mx-auto opacity-80 font-light">
                        Expert-crafted courses and smart learning paths designed for real academic success.
                    </p>
                </div>

                {/* Compact feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto opacity-80 hover:opacity-100 transition-opacity duration-300">
                    {highlights.map((item, index) => (
                        <div
                            key={index}
                            className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                        >
                            <item.icon className="w-5 h-5 mx-auto mb-2 text-indigo-300" />
                            <h3 className="text-sm font-medium mb-1">{item.title}</h3>
                            <p className="text-[10px] opacity-60 hidden md:block leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CourseHero;