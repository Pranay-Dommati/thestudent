import React from 'react';
import { Link } from 'react-router-dom';

// Sample realistic course images by category
const categoryImages = {
  'Web Development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y29kaW5nfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
  'Data Science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGRhdGElMjBzY2llbmNlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
  'Design': 'https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGRlc2lnbnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
  'Business': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGJ1c2luZXNzfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
  'Marketing': 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fG1hcmtldGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
  'AI': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGFydGlmaWNpYWwlMjBpbnRlbGxpZ2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
  'default': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fGVkdWNhdGlvbnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60'
};

const CourseCard = ({ course }) => {
    const { 
        id, 
        thumbnail, 
        title, 
        instructor, 
        duration, 
        level, 
        tags = [], 
        rating, 
        reviewCount,
        platform,
        category = 'default'
    } = course;

    // Default image based on course category or use provided thumbnail
    const courseImage = thumbnail || categoryImages[category] || categoryImages.default;
    
    // Platform badges styling
    const platformBadges = {
        'YouTube': 'bg-red-600',
        'Udemy': 'bg-purple-600',
        'Coursera': 'bg-blue-600',
        'edX': 'bg-indigo-600',
        'FreeCodeCamp': 'bg-green-600',
        'default': 'bg-gray-800'
    };
    
    // Tag styling based on tag name
    const getTagStyle = (tag) => {
        const styles = {
            'Free': 'bg-green-100 text-green-800',
            'Certificate': 'bg-purple-100 text-purple-800',
            'Video': 'bg-blue-100 text-blue-800',
            'Project-Based': 'bg-orange-100 text-orange-800',
            'Interactive': 'bg-pink-100 text-pink-800',
            'default': 'bg-gray-100 text-gray-800'
        };
        return styles[tag] || styles.default;
    };

    // Convert rating to stars
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                // Full star
                stars.push(<span key={i} className="text-yellow-400">★</span>);
            } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
                // Half star
                stars.push(<span key={i} className="text-yellow-400">★</span>);
            } else {
                // Empty star
                stars.push(<span key={i} className="text-gray-300">★</span>);
            }
        }
        return stars;
    };

    return (
        <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 relative">
            {/* Ribbon for hot/popular courses */}
            {course.isPopular && (
                <div className="absolute top-0 left-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs py-1 px-3 font-semibold z-10 rounded-tr-md rounded-bl-xl">
                    🔥 Popular
                </div>
            )}
            
            {/* Thumbnail with platform badge */}
            <div className="relative overflow-hidden">
                <img 
                    src={courseImage} 
                    alt={title} 
                    className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                {platform && (
                    <div className={`absolute top-3 right-3 ${platformBadges[platform] || platformBadges.default} text-white text-xs px-2 py-1 rounded-md font-medium shadow-sm`}>
                        {platform}
                    </div>
                )}
                
                {/* Hover overlay with quick view button */}
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Link 
                        to={`/courses/engineering/${id}`}
                        className="bg-white hover:bg-gray-100 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors duration-200 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                    >
                        Quick Preview
                    </Link>
                </div>
            </div>
            
            {/* Course content */}
            <div className="p-5 flex-grow flex flex-col">
                {/* Title and instructor */}
                <Link 
                    to={`/courses/engineering/${id}`} 
                    className="group-hover:text-indigo-600 transition-colors duration-200"
                >
                    <h3 className="font-bold text-xl mb-2 text-gray-800 line-clamp-2">{title}</h3>
                </Link>
                <p className="text-gray-600 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {instructor}
                </p>
                
                {/* Duration and level */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {duration}
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                        {level}
                    </span>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {tags && tags.map((tag, index) => (
                        <span 
                            key={index} 
                            className={`text-xs px-2 py-1 rounded ${getTagStyle(tag)}`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                
                {/* Ratings */}
                <div className="flex items-center mb-4 mt-auto">
                    <div className="flex mr-2">
                        {renderStars(rating)}
                    </div>
                    <span className="text-sm text-gray-600">({reviewCount} reviews)</span>
                </div>
                
                {/* CTA Button */}
                <Link 
                    to={`/courses/engineering/${id}`} 
                    className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow"
                >
                    View Course
                </Link>
            </div>
        </div>
    );
};

export default CourseCard;