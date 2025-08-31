import React, { useState, useEffect } from 'react';
import { getSchoolCourses, getAllCourses, getEngineeringCourses } from '../../../services/courseApi';
import { useNavigate, Link } from 'react-router-dom';

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
  const navigate = useNavigate();

  // Fetch real courses from database
  useEffect(() => {
    const fetchRealCourses = async () => {
      setLoading(true);
      try {
        // Fetch both school courses and engineering courses
        const [schoolCourses, engineeringCourses] = await Promise.all([
          getSchoolCourses('', '', ''), // Empty filters to get all school courses
          getEngineeringCourses('all') // Get all engineering courses
        ]);
        
  // Removed debug logs for production
        
        // Transform school courses to match our display format
        const transformedSchoolCourses = schoolCourses.map(course => {
          // Removed debug log
          
          // Determine category based on class_level
          let category = 'other';
          if (course.class_level && course.class_level.includes('6')) category = 'sixth';
          else if (course.class_level && course.class_level.includes('7')) category = 'seventh';
          else if (course.class_level && course.class_level.includes('8')) category = 'eighth';
          else if (course.class_level && course.class_level.includes('9')) category = 'ninth';
          else if (course.class_level && course.class_level.includes('10')) category = 'tenth';
          else if (course.class_level && course.class_level.includes('11')) category = 'eleventh';
          else if (course.class_level && course.class_level.includes('12')) category = 'twelfth';

          // Handle duration - now we have the real field from getSchoolCourses API
          let duration = 'Duration TBA';
          if (course.duration) {
            duration = `${course.duration} hours`;
          }

          // Handle board - format properly using the actual board field
          let boardName = 'CBSE';
          if (course.board) {
            if (course.board.toLowerCase() === 'cbse') {
              boardName = 'CBSE';
            } else if (course.board.toLowerCase() === 'state') {
              // For state board, show state name concisely as "State.XX"
              if (course.state) {
                // Shorten common state names
                const stateShortNames = {
                  'Andhra Pradesh': 'AP',
                  'Telangana': 'TS',
                  'Tamil Nadu': 'TN',
                  'Karnataka': 'KA',
                  'Kerala': 'KL',
                  'Maharashtra': 'MH',
                  'Gujarat': 'GJ',
                  'Rajasthan': 'RJ',
                  'West Bengal': 'WB',
                  'Uttar Pradesh': 'UP',
                  'Madhya Pradesh': 'MP',
                  'Bihar': 'BR',
                  'Odisha': 'OD',
                  'Punjab': 'PB',
                  'Haryana': 'HR',
                  'Himachal Pradesh': 'HP',
                  'Jharkhand': 'JH',
                  'Chhattisgarh': 'CG',
                  'Assam': 'AS',
                  'Uttarakhand': 'UK'
                };
                const stateCode = stateShortNames[course.state] || course.state.substring(0, 3).toUpperCase();
                boardName = `State · ${stateCode}`;
              } else {
                boardName = 'State';
              }
            } else {
              boardName = course.board;
            }
          }

          return {
            id: course.id,
            title: course.title,
            duration: duration,
            category: category,
            author: course.subject || 'EasyLearnova', // Use subject as author/category
            board: boardName,
            board_raw: course.board, // Store raw board data for navigation
            state: course.state, // Store state data for navigation
            subject: course.subject || 'General',
            class_level: course.class_level, // Store class level for navigation
            image: course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3',
            courseType: 'school'
          };
        });

        // Transform engineering courses to match our display format
        const transformedEngineeringCourses = Array.isArray(engineeringCourses) ? engineeringCourses.map(course => {
          // Removed debug log
          
          // Handle duration
          let duration = 'Duration TBA';
          if (course.duration) {
            duration = course.duration.includes('hour') ? course.duration : `${course.duration} hours`;
          }

          return {
            id: course.id,
            title: course.title,
            duration: duration,
            category: 'engineering', // All engineering courses get 'engineering' category
            author: course.sources || course.category || 'Engineering', // Use sources or category as author
            board: 'Engineering',
            board_raw: 'engineering',
            subject: course.category || 'Engineering',
            image: course.thumbnail || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3',
            courseType: 'engineering'
          };
        }) : [];

        // Combine both types of courses
        const allCourses = [...transformedSchoolCourses, ...transformedEngineeringCourses];
  // Removed debug logs
        
        setCourses(allCourses);
      } catch (error) {
  // Swallow error in production UI; optionally report to monitoring
        // Fallback to a few sample courses if API fails
        setCourses([
          {
            id: '1',
            title: 'Recently Added Mathematics Course',
            duration: '25 hours',
            category: 'tenth',
            author: 'EasyLearnova',
            board: 'CBSE',
            subject: 'Mathematics',
            image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3',
            courseType: 'school'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRealCourses();
  }, []);
  
  // Function to handle course card click and navigate to course page
  const handleCourseClick = (course) => {
  // Removed debug log
    
    // Handle engineering courses differently
    if (course.courseType === 'engineering') {
      const navigationPath = `/courses/engineering/${course.id}`;
  // Removed debug log
      navigate(navigationPath);
      return;
    }
    
    // Handle school courses
    // Extract class level from course data - handle different formats
    let classPath = '';
    if (course.class_level) {
  // Removed debug log
      
      // Handle different formats: "12th", "Class 12", "12", etc.
      const classLevel = course.class_level.toLowerCase();
      
      if (classLevel.includes('6') || classLevel === '6th') classPath = '6th';
      else if (classLevel.includes('7') || classLevel === '7th') classPath = '7th';
      else if (classLevel.includes('8') || classLevel === '8th') classPath = '8th';
      else if (classLevel.includes('9') || classLevel === '9th') classPath = '9th';
      else if (classLevel.includes('10') || classLevel === '10th') classPath = '10th';
      else if (classLevel.includes('11') || classLevel === '11th') classPath = '11th';
      else if (classLevel.includes('12') || classLevel === '12th') classPath = '12th';
    }
    
    // Extract board - convert to lowercase for URL
    const boardPath = course.board_raw ? course.board_raw.toLowerCase() : 'cbse';
    
    // Extract subject - convert to lowercase for URL
    const subjectPath = course.subject ? course.subject.toLowerCase() : 'general';
    
    // Build navigation path - include state for state board courses
    let navigationPath = '';
    if (boardPath === 'state' && course.state) {
      // For state board, include state abbreviation: /courses/{class}/state/{state}/{subject}
      const stateShortNames = {
        'Andhra Pradesh': 'ap',
        'Telangana': 'ts',
        'Tamil Nadu': 'tn',
        'Karnataka': 'ka',
        'Kerala': 'kl',
        'Maharashtra': 'mh',
        'Gujarat': 'gj',
        'Rajasthan': 'rj',
        'West Bengal': 'wb',
        'Uttar Pradesh': 'up',
        'Madhya Pradesh': 'mp',
        'Bihar': 'br',
        'Odisha': 'od',
        'Punjab': 'pb',
        'Haryana': 'hr',
        'Himachal Pradesh': 'hp',
        'Jharkhand': 'jh',
        'Chhattisgarh': 'cg',
        'Assam': 'as',
        'Uttarakhand': 'uk'
      };
      const stateCode = stateShortNames[course.state] || course.state.substring(0, 2).toLowerCase();
      navigationPath = `/courses/${classPath}/state/${stateCode}/${subjectPath}`;
    } else {
      // For CBSE and other boards: /courses/{class}/{board}/{subject}
      navigationPath = `/courses/${classPath}/${boardPath}/${subjectPath}`;
    }
    
  // Removed debug log
    
    // Navigate to course page
    if (classPath) {
      navigate(navigationPath);
    } else {
  // Navigation path not determined; no console output in production
    }
  };
  
  const [showAllOnMobile, setShowAllOnMobile] = useState(false);

  // Filter courses with mobile-specific display logic
  const allFilteredCourses = activeCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === activeCategory);
  
  // For mobile: show 4 initially, then all when "Load More" is clicked
  // For desktop: show normal limits
  const getDisplayedCourses = () => {
    if (window.innerWidth < 768) { // Mobile
      if (showAllOnMobile) {
        return allFilteredCourses;
      } else {
        return allFilteredCourses.slice(0, 4);
      }
    } else { // Desktop/Tablet
      return activeCategory === 'all' 
        ? allFilteredCourses.slice(0, 12)
        : allFilteredCourses.slice(0, 8);
    }
  };

  const displayedCourses = getDisplayedCourses();
  const hasMoreCourses = allFilteredCourses.length > displayedCourses.length;

  return (
    <section className="py-6 sm:py-8 lg:py-12 xl:pt-0 xl:pb-16 px-3 sm:px-4 bg-[#F9FAFB]">
      <div className="container mx-auto">
        {/* Header section - mobile vs desktop optimized */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 lg:mb-10">
          <div className="text-center lg:text-left">
            {/* Mobile header - more compact */}
            <div className="block sm:hidden">
              <h5 className="text-blue-600 font-semibold text-xs mb-1">FEATURED</h5>
              <h2 className="text-lg font-bold text-gray-900">Recently Launched</h2>
            </div>
            
            {/* Desktop header - preserved original */}
            <div className="hidden sm:block">
              <h5 className="text-blue-600 font-semibold text-sm lg:text-base mb-2">FEATURED COLLECTIONS</h5>
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Recently Launched</h2>
            </div>
          </div>
          
          <div className="mt-3 lg:mt-0 text-center lg:text-left">
            <Link to="/courses" className="inline-flex items-center text-blue-600 font-medium hover:underline text-xs sm:text-sm lg:text-base">
              View All Courses
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* Category filters - improved mobile experience */}
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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

        {/* Course grid with enhanced mobile layout */}
        {loading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 sm:ml-3 text-gray-600 text-sm sm:text-base">Loading new courses...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {displayedCourses.length > 0 ? (
                displayedCourses.map(course => (
                  <div 
                    key={course.id} 
                    onClick={() => handleCourseClick(course)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer"
                  >
                    {/* Course thumbnail with aspect ratio lock */}
                    <div className="relative pb-[56.25%]">
                      <img 
                        src={course.image} 
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Course info with responsive spacing */}
                    <div className="p-3 sm:p-4 lg:p-5">
                      <h3 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 text-sm sm:text-base">
                        {course.title}
                      </h3>
                      
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                        <span>{course.duration}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {course.author[0]}
                          </div>
                          <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-600 truncate">{course.author}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                            {course.board}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <div className="text-gray-400 mb-3 sm:mb-4">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No courses found</h3>
                  <p className="text-sm sm:text-base text-gray-600">New courses will appear here once they're added.</p>
                </div>
              )}
            </div>
            
            {/* Load More button for mobile */}
            {hasMoreCourses && (
              <div className="flex justify-center mt-6 sm:hidden">
                <button
                  onClick={() => setShowAllOnMobile(true)}
                  aria-label="Load more courses"
                  className="inline-flex items-center gap-2 px-4 h-11 min-h-[44px] rounded-full border border-blue-200 text-blue-700 bg-white/80 backdrop-blur-sm 
                             font-medium text-sm transition-all duration-200 shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 
                             active:scale-[0.99]"
                >
                  Load More Courses
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedPlaylists;