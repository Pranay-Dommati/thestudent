import React from 'react';
import { motion } from 'framer-motion';
import { 
    FaChevronRight, 
    FaStar, 
    FaClock, 
    FaUsers, 
    FaPlay,
    FaBookmark
} from 'react-icons/fa';

const MobileCourseCard = ({ 
    course, 
    onSelect, 
    index = 0,
    variant = 'default' // 'default', 'compact', 'featured'
}) => {
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { 
                duration: 0.5, 
                delay: index * 0.1,
                ease: "easeOut" 
            }
        }
    };

    const getVariantClasses = () => {
        switch (variant) {
            case 'compact':
                return 'p-3';
            case 'featured':
                return 'p-5 border-2 border-indigo-200';
            default:
                return 'p-4';
        }
    };

    const getHeaderHeight = () => {
        switch (variant) {
            case 'compact':
                return 'h-20';
            case 'featured':
                return 'h-28';
            default:
                return 'h-24';
        }
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
        >
            <button
                onClick={() => onSelect(course)}
                className={`w-full bg-white rounded-2xl shadow-sm hover:shadow-lg 
                           transition-all duration-300 border border-gray-100 overflow-hidden
                           active:scale-95 transform ${variant === 'featured' ? 'ring-2 ring-indigo-100' : ''}`}
            >
                {/* Card Header - Clean Design */}
                <div className={`${getHeaderHeight()} bg-gradient-to-r from-gray-50 to-gray-100 
                               relative overflow-hidden border-b border-gray-100`}>
                    
                    {/* Icon */}
                    <div className="absolute top-3 right-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 
                                      flex items-center justify-center">
                            {course.icon ? (
                                <course.icon className="w-5 h-5 text-indigo-600" />
                            ) : (
                                <FaPlay className="w-4 h-4 text-indigo-600" />
                            )}
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                        {course.badge && (
                            <span className="px-2 py-1 bg-indigo-100 rounded-full 
                                           text-indigo-700 text-xs font-medium">
                                {course.badge}
                            </span>
                        )}
                    </div>
                    
                    {/* Bottom Info */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-gray-600">
                            <FaStar className="w-3 h-3" />
                            <span className="text-xs font-medium">
                                {course.difficulty || course.rating || 'New'}
                            </span>
                        </div>
                        
                        {course.duration && (
                            <div className="flex items-center space-x-1 text-gray-600">
                                <FaClock className="w-3 h-3" />
                                <span className="text-xs">{course.duration}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card Content */}
                <div className={`text-left ${getVariantClasses()}`}>
                    <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-bold text-gray-900 ${variant === 'compact' ? 'text-base' : 'text-lg'}`}>
                            {course.name || course.title}
                        </h3>
                        <FaChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                    
                    <p className={`text-gray-600 mb-3 line-clamp-2 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
                        {course.description}
                    </p>
                    
                    {/* Subject Tags or Metadata */}
                    {course.subjects && course.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {course.subjects.slice(0, variant === 'compact' ? 2 : 3).map((subject, idx) => (
                                <span
                                    key={idx}
                                    className={`px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium 
                                              ${variant === 'compact' ? 'text-xs' : 'text-xs'}`}
                                >
                                    {subject}
                                </span>
                            ))}
                            {course.subjects.length > (variant === 'compact' ? 2 : 3) && (
                                <span className={`px-2 py-1 bg-gray-100 text-gray-500 rounded-md 
                                                ${variant === 'compact' ? 'text-xs' : 'text-xs'}`}>
                                    +{course.subjects.length - (variant === 'compact' ? 2 : 3)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {course.students && (
                                <div className="flex items-center space-x-1 text-gray-500">
                                    <FaUsers className="w-3 h-3" />
                                    <span className="text-xs">{course.students}</span>
                                </div>
                            )}
                            
                            {course.lessons && (
                                <div className="flex items-center space-x-1 text-gray-500">
                                    <FaPlay className="w-3 h-3" />
                                    <span className="text-xs">{course.lessons} lessons</span>
                                </div>
                            )}
                        </div>

                        {/* Action Indicator */}
                        <div className="flex items-center space-x-2">
                            {course.bookmarked && (
                                <FaBookmark className="w-3 h-3 text-indigo-500" />
                            )}
                            <div className={`w-2 h-2 rounded-full ${
                                course.status === 'completed' ? 'bg-green-400' :
                                course.status === 'in-progress' ? 'bg-yellow-400' :
                                'bg-indigo-400'
                            }`}></div>
                        </div>
                    </div>

                    {/* Progress Bar (if applicable) */}
                    {course.progress !== undefined && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">Progress</span>
                                <span className="text-xs text-gray-700 font-medium">{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${course.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            </button>
        </motion.div>
    );
};

export default MobileCourseCard;
