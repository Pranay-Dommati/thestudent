import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getEngineeringCourses } from '../../../../../services/courseApi';
import CourseCard from '../CourseCard/CourseCard';

const API_URL = 'http://localhost:8000';

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
                console.log('Fetched courses:', data);
                setCourses(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching courses:', error);
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {category === 'all' ? 'All Courses' : `${category} Courses`}
                </h2>
                <span className="text-gray-600">{courses.length} results</span>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <CourseCard 
                            key={course.id} 
                            course={{
                                id: course.id,
                                // Fix: Check if thumbnail starts with http/https, if not prepend API_URL
                                thumbnail: course.thumbnail?.startsWith('http') 
                                    ? course.thumbnail 
                                    : `${API_URL}${course.thumbnail}`,
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
                <div className="text-center py-12">
                    <p className="text-gray-500">No courses found in this category.</p>
                </div>
            )}
        </div>
    );
};

export default CourseListings;