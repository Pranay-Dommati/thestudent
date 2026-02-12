import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <section className="relative min-h-[80vh] sm:min-h-[75vh] md:min-h-[80vh] lg:min-h-[85vh] xl:min-h-[90vh] pt-14 pb-12 sm:pt-16 sm:pb-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-32 xl:pt-32 xl:pb-48 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 overflow-hidden">
            {/* Mobile version - modern and visually appealing */}
            <div className="block lg:hidden">
                {/* Mobile/Tablet background elements - responsive sizing */}
                <div className="absolute top-10 right-4 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-pink-400/20 to-purple-400/20 blur-xl animate-pulse-slow"></div>
                <div className="absolute top-32 left-4 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 blur-lg animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-20 right-8 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-400/20 blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

                {/* Mobile/Tablet floating geometric shapes */}
                <div className="absolute top-24 left-8 w-3 h-3 md:w-4 md:h-4 bg-white/30 rounded rotate-45 animate-bounce-slow"></div>
                <div className="absolute top-40 right-12 w-2 h-6 sm:h-8 bg-white/20 rounded-full animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-32 left-6 w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>

                <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-20 min-h-[70vh] flex flex-col justify-center">
                    <div className="text-center max-w-sm sm:max-w-md md:max-w-lg mx-auto">
                        {/* Mobile/Tablet AI badge - more prominent */}
                        <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4 sm:mb-6 shadow-lg">
                            <div className="animate-pulse-slow mr-2 h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 shadow-md"></div>
                            <span className="text-white text-xs sm:text-sm font-bold tracking-wide">AI-POWERED LEARNING</span>
                        </div>

                        {/* Mobile/Tablet hero heading - responsive sizing */}
                        <h1 className="text-xl sm:text-2xl md:text-3xl leading-tight font-black text-white mb-3 sm:mb-4 tracking-tight">
                            Your Personal
                            <br className="sm:hidden" />
                            <span className="sm:hidden"> </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-300">
                                AI Study Companion
                            </span>
                        </h1>

                        {/* Mobile/Tablet description with better responsive spacing */}
                        <p className="text-sm sm:text-base md:text-lg leading-relaxed text-white/90 mb-6 sm:mb-8 font-medium">
                            Expert courses for Classes 6–12 or create personalized study materials with AI.
                        </p>

                        {/* Mobile/Tablet action buttons - responsive layout */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-md mx-auto">
                            <Link
                                to="/courses"
                                className="flex-1 sm:w-auto px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-white text-indigo-600 font-bold text-sm sm:text-base
                         transition-all duration-300 ease-out transform
                         hover:shadow-xl hover:shadow-white/30 hover:-translate-y-1
                         active:translate-y-0 active:scale-95
                         focus:outline-none focus:ring-4 focus:ring-white/50"
                            >
                                <div className="flex items-center justify-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span className="hidden sm:inline">Browse Ready Courses</span>
                                    <span className="sm:hidden">Browse Courses</span>
                                </div>
                            </Link>

                            <Link
                                to="/learning-path"
                                className="flex-1 sm:w-auto group px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-white/10 backdrop-blur-md text-white 
                         border-2 border-white/30 font-bold text-sm sm:text-base
                         transition-all duration-300 ease-out transform
                         hover:bg-white/20 hover:border-white/50 hover:-translate-y-1
                         active:translate-y-0 active:scale-95
                         focus:outline-none focus:ring-4 focus:ring-white/30"
                            >
                                <div className="flex items-center justify-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="hidden sm:inline">Create Custom Course</span>
                                    <span className="sm:hidden">Create Course</span>
                                </div>
                            </Link>
                        </div>

                        {/* Mobile/Tablet feature highlights - Responsive info badges */}
                        <div className="flex items-center justify-center text-center opacity-90 max-w-xs mx-auto">
                            <Link to="/courses" className="flex flex-col items-center space-y-2 transition-all duration-300 hover:scale-110 active:scale-95">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <span className="text-xs sm:text-sm text-white/90 font-medium leading-tight">Expert<br />Courses</span>
                            </Link>

                            {/* Professional vertical divider */}
                            <div className="mx-4 sm:mx-6 h-12 sm:h-16 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>

                            <Link to="/learning-hub#ai-courses" className="flex flex-col items-center space-y-2 transition-all duration-300 hover:scale-110 active:scale-95">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                    <span className="text-xs sm:text-sm font-bold text-white">AI</span>
                                </div>
                                <span className="text-xs sm:text-sm text-white/90 font-medium leading-tight">Study<br />Materials</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop version - optimized for large screens */}
            <div className="hidden lg:block">
                {/* Desktop decorative elements */}
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-32 md:w-48 lg:w-72 xl:w-96 h-32 md:h-48 lg:h-72 xl:h-96 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-32 md:w-48 lg:w-72 xl:w-96 h-32 md:h-48 lg:h-72 xl:h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 opacity-20 blur-3xl"></div>

                {/* Grid background */}
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:15px_15px] md:bg-[length:20px_20px] lg:bg-[length:30px_30px]"></div>

                <div className="container mx-auto px-4 md:px-6 lg:px-6 xl:px-8 max-w-7xl relative z-20 min-h-[75vh] md:min-h-[80vh] flex items-center">
                    <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto text-center">
                        {/* AI badge - optimized for tablet */}
                        <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white border border-gray-200 mb-4 md:mb-6 lg:mb-8 shadow-lg">
                            <span className="animate-pulse-slow mr-2 h-2 w-2 md:h-3 md:w-3 rounded-full bg-green-400 shadow-sm"></span>
                            <span className="text-black text-xs md:text-sm font-semibold">AI-Powered Learning</span>
                        </div>

                        {/* Heading - better tablet optimization */}
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-white mb-3 md:mb-4 lg:mb-6 leading-tight">
                            Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">AI Study Companion</span>
                            <span className="hidden md:inline"> and Expert-Crafted Courses</span>
                        </h1>

                        {/* Description - tablet-optimized */}
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-6 md:mb-8 lg:mb-10 max-w-xl md:max-w-2xl mx-auto px-2 md:px-4 leading-relaxed">
                            <span className="md:hidden">Expert courses for Classes 6–12 or create personalized study materials with AI.</span>
                            <span className="hidden md:inline">Explore expertly crafted courses for Classes 6–12, aligned with your board syllabus — or use our AI Companion to generate personalized study materials like summaries, quizzes, videos, and more.</span>
                        </p>

                        {/* Buttons - tablet-optimized */}
                        <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mb-8 md:mb-12 lg:mb-16 xl:mb-20 px-2 md:px-4">
                            <Link
                                to="/courses"
                                className="w-full sm:w-auto px-4 py-2.5 md:px-6 md:py-3 lg:px-6 lg:py-3.5 xl:px-8 xl:py-4 rounded-lg bg-white text-indigo-600 font-bold text-sm md:text-base lg:text-lg
                         transition-all duration-300 ease-out transform
                         hover:shadow-lg hover:shadow-white/30 hover:-translate-y-1
                         hover:bg-opacity-95 hover:text-indigo-700
                         active:translate-y-0
                         focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                                Browse Ready Courses
                            </Link>
                            <Link
                                to="/learning-path"
                                className="w-full sm:w-auto group px-4 py-2.5 md:px-6 md:py-3 lg:px-6 lg:py-3.5 xl:px-8 xl:py-4 rounded-lg bg-indigo-800 bg-opacity-50 text-white 
                         border border-indigo-400 border-opacity-30 backdrop-blur-sm font-bold text-sm md:text-base lg:text-lg
                         transition-all duration-300 ease-out transform
                         hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-1
                         hover:bg-opacity-60 hover:border-opacity-50
                         active:translate-y-0
                         focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                            >
                                <span className="flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 mr-2 transition-transform duration-300 group-hover:scale-110"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Create Custom Course
                                </span>
                            </Link>
                        </div>

                        {/* Feature highlights for tablet - more compact */}
                        <div className="hidden md:flex items-center justify-center space-x-8 lg:space-x-12 opacity-90">
                            <Link to="/courses" className="flex items-center space-x-2 transition-all duration-300 hover:scale-110 active:scale-95 group">
                                <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <span className="text-xs lg:text-sm text-white/90 font-medium group-hover:text-white transition-colors">Expert Courses</span>
                            </Link>

                            <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>

                            <Link to="/learning-hub#ai-courses" className="flex items-center space-x-2 transition-all duration-300 hover:scale-110 active:scale-95 group">
                                <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                    <span className="text-xs lg:text-sm font-bold text-white">AI</span>
                                </div>
                                <span className="text-xs lg:text-sm text-white/90 font-medium group-hover:text-white transition-colors">Study Materials</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wave pattern - responsive */}
            <div className="absolute bottom-0 left-0 right-0 z-10 transform translate-y-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto" preserveAspectRatio="none">
                    <path
                        fill="#F9FAFB"
                        fillOpacity="1"
                        d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,138.7C672,149,768,203,864,202.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    ></path>
                </svg>
            </div>
        </section>
    );
};

export default Hero;