import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const SUBJECT_ICONS = {
    'Mathematics': '📐',
    'Physics': '🔬',
    'Chemistry': '⚗️',
    'Biology': '🧬',
    'English': '📚',
    'Hindi': '📖',
    'Social Science': '🌍',
    'Science': '🔬',
    'Computer Science': '💻',
    'General': '📘'
};

/**
 * Reusable course card component for class listing pages
 */
const CourseCard = ({ course, linkTo, boardDisplay, onPrefetch }) => {
    return (
        <Link
            to={linkTo}
            onMouseEnter={onPrefetch}
            onFocus={onPrefetch}
            onTouchStart={onPrefetch}
        >
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer h-full"
            >
                {/* Course thumbnail */}
                <div className="relative pb-[56.25%] rounded-t-xl overflow-hidden">
                    <img
                        src={course.thumbnail || `https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&text=${encodeURIComponent(course.subject)}`}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Source Type Badge */}
                    {course.source_type === 'original' ? (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md border border-indigo-100 text-indigo-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm z-20 flex items-center gap-1.5">
                            <span className="text-yellow-500 text-xs">★</span> <span>Original</span>
                        </div>
                    ) : (
                        <div className="absolute top-3 right-3 bg-gray-900/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium text-white z-20 flex items-center gap-1.5 border border-white/10">
                            <span>▶</span> <span>Curated</span>
                        </div>
                    )}
                </div>

                {/* Course info */}
                <div className="p-4 sm:p-4 lg:p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 sm:mb-2 line-clamp-2 text-base sm:text-base leading-tight">
                        {course.title}
                    </h3>

                    <div className="flex items-center text-sm sm:text-sm text-gray-500 mb-3 sm:mb-3">
                        <span>{course.duration}+ hours</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1 mr-2">
                            <div className="h-6 w-6 sm:h-6 sm:w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600 flex-shrink-0">
                                {SUBJECT_ICONS[course.subject] || course.subject?.[0] || '📚'}
                            </div>
                            <span className="ml-2 sm:ml-2 text-sm sm:text-sm text-gray-600 truncate">{course.subject}</span>
                        </div>

                        <div className="flex items-center flex-shrink-0">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 sm:px-2 py-1 sm:py-1 rounded-full font-medium whitespace-nowrap">
                                {boardDisplay}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

/**
 * Section component for displaying courses grouped by source type
 */
export const CourseSection = ({
    title,
    subtitle,
    courses,
    getLinkTo,
    getBoardDisplay,
    onPrefetch,
    emptyMessage = "No courses available yet.",
    isOriginal = false
}) => {
    if (!courses || courses.length === 0) {
        return null;
    }

    return (
        <section className="mb-12">
            {/* Section Header - matching homepage style */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`w-1 h-6 rounded-full ${isOriginal ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
                    <h3 className="text-xl font-semibold text-gray-900">
                        {title}
                    </h3>
                </div>
                {subtitle && (
                    <p className="text-sm text-gray-400 ml-4">{subtitle}</p>
                )}
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                    <CourseCard
                        key={course.id}
                        course={course}
                        linkTo={getLinkTo(course)}
                        boardDisplay={getBoardDisplay(course)}
                        onPrefetch={() => onPrefetch && onPrefetch(course)}
                    />
                ))}
            </div>
        </section>
    );
};

/**
 * Component to render segregated course sections (Originals + Curated)
 */
export const SegregatedCourseSections = ({
    courses,
    getLinkTo,
    getBoardDisplay,
    onPrefetch
}) => {
    const originalCourses = courses.filter(c => c.source_type === 'original');
    const curatedCourses = courses.filter(c => c.source_type !== 'original');

    if (courses.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No courses found for this selection.</p>
                <p className="text-sm text-gray-400 mt-2">Check back later or try a different board.</p>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-0 space-y-14">
            {/* Originals Section */}
            {originalCourses.length > 0 && (
                <CourseSection
                    title="EasyLearnova Originals"
                    subtitle="Expert-crafted courses designed by our educators"
                    courses={originalCourses}
                    getLinkTo={getLinkTo}
                    getBoardDisplay={getBoardDisplay}
                    onPrefetch={onPrefetch}
                    isOriginal={true}
                />
            )}

            {/* Curated Section */}
            {curatedCourses.length > 0 && (
                <CourseSection
                    title="YouTube Curated"
                    subtitle="This course uses publicly available YouTube videos. All rights belong to respective creators."
                    courses={curatedCourses}
                    getLinkTo={getLinkTo}
                    getBoardDisplay={getBoardDisplay}
                    onPrefetch={onPrefetch}
                    isOriginal={false}
                />
            )}
        </div>
    );
};

export default CourseCard;
