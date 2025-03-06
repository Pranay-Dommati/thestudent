import React, { useState } from 'react';

const CourseHero = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        // Implement search functionality
        console.log("Searching for:", searchQuery);
    };

    return (
        <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-28 pb-18">
            <div className="container mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Find the Perfect Course for You</h1>
                <p className="text-xl mb-8 max-w-3xl mx-auto">
                    Discover carefully curated and AI-recommended courses to accelerate your learning journey
                </p>
                
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by topic, instructor, or platform..."
                            className="w-full py-4 px-6 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 bg-indigo-700 hover:bg-indigo-800 text-white p-2 rounded-full"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default CourseHero;