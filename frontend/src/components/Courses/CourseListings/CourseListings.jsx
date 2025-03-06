import React, { useState, useEffect } from 'react';
import CourseCard from '../CourseCard/CourseCard';

const CourseListings = ({ category, filters }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    // Sample course data - in a real app this would come from an API
    const sampleCourses = [
        {
            id: 1,
            thumbnail: "https://images.unsplash.com/photo-1457305237443-44c3d5a30b89?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            title: "Web Development: From Zero to Mastery",
            instructor: "YT",
            duration: "56 hours",
            level: "Beginner",
            tags: ["Free", "Video", "Project-Based"],
            rating: "",
            reviewCount: 0,
            platform: "YouTube"
        },
        {
            id: 2,
            thumbnail: "https://via.placeholder.com/300x200?text=React",
            title: "Advanced React Hooks and State Management",
            instructor: "Sarah Jones",
            duration: "32 hours",
            level: "Intermediate",
            tags: ["Free", "Video"],
            rating: 4.9,
            reviewCount: 876,
            platform: "YouTube"
        },
        {
            id: 3,
            thumbnail: "https://via.placeholder.com/300x200?text=Python",
            title: "Data Science with Python: Machine Learning",
            instructor: "Michael Chen",
            duration: "48 hours",
            level: "Intermediate",
            tags: ["Free", "Certificate", "Project-Based"],
            rating: 4.7,
            reviewCount: 1052,
            platform: "FreeCodeCamp"
        },
        {
            id: 4,
            thumbnail: "https://via.placeholder.com/300x200?text=Figma",
            title: "UI/UX Design with Figma: Zero to Expert",
            instructor: "Emma Rodriguez",
            duration: "38 hours",
            level: "Beginner",
            tags: ["Free", "Video", "Project-Based"],
            rating: 4.6,
            reviewCount: 932,
            platform: "Udemy"
        },
        {
            id: 5,
            thumbnail: "https://via.placeholder.com/300x200?text=Node.js",
            title: "Complete Node.js Backend Development",
            instructor: "David Wilson",
            duration: "42 hours",
            level: "Advanced",
            tags: ["Free", "Video", "Certificate"],
            rating: 4.9,
            reviewCount: 768,
            platform: "YouTube"
        },
        {
            id: 6,
            thumbnail: "https://via.placeholder.com/300x200?text=Flutter",
            title: "Flutter Mobile App Development",
            instructor: "Lisa Johnson",
            duration: "35 hours",
            level: "Intermediate",
            tags: ["Free", "Video", "Project-Based"],
            rating: 4.7,
            reviewCount: 645,
            platform: "YouTube"
        },
    ];

    useEffect(() => {
        setLoading(true);
        
        // Simulate API fetch with timeout
        setTimeout(() => {
            setCourses(sampleCourses);
            setLoading(false);
            setHasMore(false); // No more pages in this example
        }, 800);
        
    }, [category, filters]);

    const loadMoreCourses = () => {
        setCurrentPage(prev => prev + 1);
        // In a real app, you would fetch more courses here
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {category === 'all' ? 'All Courses' : `${category.charAt(0).toUpperCase() + category.slice(1)} Courses`}
                </h2>
                <span className="text-gray-600">{courses.length} results</span>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            ) : courses.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                    
                    {hasMore && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={loadMoreCourses}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Load More Courses
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-4 text-xl font-medium text-gray-700">No courses found</h3>
                    <p className="mt-2 text-gray-500">Try adjusting your filters or search terms</p>
                </div>
            )}
        </div>
    );
};

export default CourseListings;