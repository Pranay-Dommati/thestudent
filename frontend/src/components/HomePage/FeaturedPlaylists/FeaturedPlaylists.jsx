import React, { useState, useEffect } from 'react';
import { getSchoolCourses, getAllCourses } from '../../../services/courseApi';

const categories = [
  { id: 'all', name: 'All Courses' },
  { id: 'sixth', name: 'Class 6' },
  { id: 'seventh', name: 'Class 7' },
  { id: 'eighth', name: 'Class 8' },
  { id: 'ninth', name: 'Class 9' },
  { id: 'tenth', name: 'Class 10' },
  { id: 'eleventh', name: 'Class 11' },
  { id: 'twelfth', name: 'Class 12' },
  { id: 'engineering', name: 'Engineering' }
];

const FeaturedPlaylists = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real courses from database
  useEffect(() => {
    const fetchRealCourses = async () => {
      setLoading(true);
      try {
        // Get all courses from database
        const allCourses = await getAllCourses('school');
        console.log('Fetched real courses:', allCourses);
        
        // Transform courses to match our display format
        const transformedCourses = allCourses.map(course => {
          // Determine category based on class_level
          let category = 'other';
          if (course.class && course.class.includes('6')) category = 'sixth';
          else if (course.class && course.class.includes('7')) category = 'seventh';
          else if (course.class && course.class.includes('8')) category = 'eighth';
          else if (course.class && course.class.includes('9')) category = 'ninth';
          else if (course.class && course.class.includes('10')) category = 'tenth';
          else if (course.class && course.class.includes('11')) category = 'eleventh';
          else if (course.class && course.class.includes('12')) category = 'twelfth';

          return {
            id: course.id,
            title: course.title,
            duration: '40+ hours', // Default duration
            lessons: 60, // Default lesson count
            category: category,
            author: course.category || 'StudentsHub',
            rating: 4.5,
            students: Math.floor(Math.random() * 1000) + 100 + ' students', // Random student count
            image: course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3'
          };
        });

        setCourses(transformedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Fallback to a few sample courses if API fails
        setCourses([
          {
            id: '1',
            title: 'Recently Added Mathematics Course',
            duration: '40+ hours',
            lessons: 60,
            category: 'tenth',
            author: 'StudentsHub',
            rating: 4.5,
            students: '500 students',
            image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRealCourses();
  }, []);
  
  const filteredCourses = activeCategory === 'all' 
    ? courses.slice(0, 12) // Show max 12 courses for 'all'
    : courses.filter(course => course.category === activeCategory).slice(0, 4); // Show max 4 per category

  return (
    <section className="py-8 sm:py-12 md:pt-0 md:pb-16 px-4 bg-[#F9FAFB]">
      <div className="container mx-auto">
        {/* Header section with improved mobile layout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-10">
          <div className="text-center md:text-left">
            <h5 className="text-blue-600 font-semibold text-sm sm:text-base mb-2">FEATURED COLLECTIONS</h5>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Recently Launched</h2>
          </div>
          
          <div className="mt-4 md:mt-0 text-center md:text-left">
            <a href="/courses" className="inline-flex items-center text-blue-600 font-medium hover:underline text-sm sm:text-base">
              View All Courses
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
        
        {/* Category filters with improved scrolling on mobile */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 min-w-max pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Course grid with responsive layout */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading new courses...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
                <div 
                  key={course.id} 
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                >
                  {/* Course thumbnail with aspect ratio lock */}
                  <div className="relative pb-[56.25%]">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* New badge */}
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      New
                    </div>
                  </div>
                  
                  {/* Course info with improved spacing */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">
                      {course.title}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <span>{course.duration}</span>
                      <span className="mx-2">•</span>
                      <span>{course.lessons} lessons</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          {course.author[0]}
                        </div>
                        <span className="ml-2 text-xs sm:text-sm text-gray-600">{course.author}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="ml-1 text-xs sm:text-sm font-medium text-gray-600">{course.rating}</span>
                        <span className="mx-1.5 text-gray-500">•</span>
                        <span className="text-xs sm:text-sm text-gray-500">{course.students}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600">New courses will appear here once they're added.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedPlaylists;