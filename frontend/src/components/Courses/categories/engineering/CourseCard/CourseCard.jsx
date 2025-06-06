import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaClock, FaCertificate, FaTools, FaVideo } from 'react-icons/fa';

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

const tagStyles = {
  'Certificate': 'bg-green-100 text-green-800',
  'Project-Based': 'bg-blue-100 text-blue-800',
  'Video': 'bg-purple-100 text-purple-800',
  'beginner': 'bg-yellow-100 text-yellow-800',
  'intermediate': 'bg-orange-100 text-orange-800',
  'advanced': 'bg-red-100 text-red-800'
};

const TagIcon = ({ tag }) => {
  switch (tag) {
    case 'Certificate':
      return <FaCertificate className="mr-1" />;
    case 'Project-Based':
      return <FaTools className="mr-1" />;
    case 'Video':
      return <FaVideo className="mr-1" />;
    default:
      return null;
  }
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
        category = 'default'
    } = course;

    const [imgError, setImgError] = useState(false);

    // Remove duration from allTags since we'll display it separately
    const allTags = [
        level?.toLowerCase(),
        ...tags
    ].filter(Boolean);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Course Image */}
            <div className="relative h-48 overflow-hidden group">
                <img 
                    src={imgError ? categoryImages[category] || categoryImages.default : thumbnail}
                    alt={title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                        console.log('Image failed to load:', thumbnail);
                        setImgError(true);
                        e.target.src = categoryImages[category] || categoryImages.default;
                    }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Link 
                        to={`/courses/engineering/${id}`}
                        className="bg-white hover:bg-gray-100 text-gray-900 font-medium py-2 px-4 rounded-lg"
                    >
                        Quick Preview
                    </Link>
                </div>
            </div>
            
            {/* Course Info */}
            <div className="p-5">
                <Link to={`/courses/engineering/${id}`}>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-indigo-600">
                        {title}
                    </h3>
                </Link>
                
                <p className="text-gray-600 mb-4 flex items-center">
                    <FaUser className="mr-2" />
                    {instructor}
                </p>
                
                {/* Duration and Tags in one row */}
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                    {/* Duration Tag */}
                    <span className="text-xs px-3 py-1.5 rounded-full flex items-center bg-gray-100 text-gray-800">
                        <FaClock className="mr-1" />
                        {duration}
                    </span>
                    
                    {/* Other Tags */}
                    {allTags.map((tag, index) => {
                        const style = tagStyles[tag] || 'bg-gray-100 text-gray-800';
                        return (
                            <span 
                                key={index} 
                                className={`text-xs px-3 py-1.5 rounded-full flex items-center ${style}`}
                            >
                                <TagIcon tag={tag} />
                                {tag}
                            </span>
                        );
                    })}
                </div>
                
                {/* View Course Button */}
                <Link 
                    to={`/courses/engineering/${id}`}
                    className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                    View Course
                </Link>
            </div>
        </div>
    );
};

export default CourseCard;