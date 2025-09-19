import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getEngineeringCourses } from '../../../../../services/courseApi';
import logger from '../../../../../utils/logger';
import CourseCard from '../CourseCard/CourseCard';
import { toAbsoluteMedia } from '../../../../../utils/apiOrigin';

const CourseListings = ({ category, filters }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getEngineeringCourses(category);
                logger.log('Fetched courses:', data);
                setCourses(Array.isArray(data) ? data : []);
            } catch (error) {
                logger.error('Error fetching courses:', error);
                setError('Failed to load courses');
                toast.error(error.response?.data?.details || 'Failed to load courses');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [category, filters]);

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {category === 'all' ? 'All Courses' : `${category} Courses`}
                </h2>
                <span className="text-sm sm:text-base text-gray-600">{courses.length} results</span>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {courses.map(course => (
                        <CourseCard 
                            key={course.id} 
                            course={{
                                id: course.id,
                                thumbnail: toAbsoluteMedia(course.thumbnail),
                                title: course.title,
                                instructor: course.sources,
                                duration: course.duration,
                                level: course.proficiency,
                                tags: [
                                    course.certificate_given ? 'Certificate' : null,
                                    course.project_based ? 'Project-Based' : null,
                                    'Video'
                                ].filter(Boolean),
                                category: course.category
                            }} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-500 text-sm sm:text-base">No courses found in this category.</p>
                </div>
            )}
        </div>
    );
};

export default CourseListings;