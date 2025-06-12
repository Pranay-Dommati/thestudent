import React, { useState } from 'react';

const categories = [
  { id: 'all', name: 'All Playlists' },
  { id: 'tenth', name: 'Class 10' },
  { id: 'eleventh', name: 'Class 11' },
  { id: 'twelfth', name: 'Class 12' },
  { id: 'engineering', name: 'Engineering' }
];

const playlists = [
  // 10th Standard Courses
  { 
    id: 1, 
    title: 'CBSE Class 10 Mathematics', 
    duration: '45 hours', 
    lessons: 90,
    category: 'tenth',
    author: 'Master Mathematics',
    rating: 4.8,
    students: '25.4K',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3'
  },
  // 11th Standard Courses
  { 
    id: 2, 
    title: 'Class 11 Physics Complete Course', 
    duration: '50 hours',
    lessons: 95, 
    category: 'eleventh',
    author: 'Physics Academy',
    rating: 4.9,
    students: '20K',
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?ixlib=rb-4.0.3'
  },
  // 12th Standard Courses
  { 
    id: 3, 
    title: 'Chemistry for Class 12', 
    duration: '48 hours',
    lessons: 85,
    category: 'twelfth',
    author: 'Chemistry Masters',
    rating: 4.7,
    students: '18.9K',
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?ixlib=rb-4.0.3'
  },
  // Engineering Courses
  { 
    id: 4, 
    title: 'Web Development Bootcamp', 
    duration: '56 hours',
    lessons: 120,
    category: 'engineering',
    author: 'Tech Academy',
    rating: 4.8,
    students: '15.4K',
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3'
  }
];

const FeaturedPlaylists = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const filteredPlaylists = activeCategory === 'all' 
    ? playlists 
    : playlists.filter(playlist => playlist.category === activeCategory);

  return (
    <section className="py-8 sm:py-12 md:pt-0 md:pb-16 px-4 bg-[#F9FAFB]">
      <div className="container mx-auto">
        {/* Header section with improved mobile layout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-10">
          <div className="text-center md:text-left">
            <h5 className="text-blue-600 font-semibold text-sm sm:text-base mb-2">FEATURED COLLECTIONS</h5>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Most Popular Playlists</h2>
          </div>
          
          <div className="mt-4 md:mt-0 text-center md:text-left">
            <a href="#view-all" className="inline-flex items-center text-blue-600 font-medium hover:underline text-sm sm:text-base">
              View All Playlists
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

        {/* Playlist grid with responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredPlaylists.map(playlist => (
            <div 
              key={playlist.id} 
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
            >
              {/* Playlist thumbnail with aspect ratio lock */}
              <div className="relative pb-[56.25%]">
                <img 
                  src={playlist.image} 
                  alt={playlist.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              
              {/* Playlist info with improved spacing */}
              <div className="p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">
                  {playlist.title}
                </h3>
                
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span>{playlist.duration}</span>
                  <span className="mx-2">•</span>
                  <span>{playlist.lessons} lessons</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                      {playlist.author[0]}
                    </div>
                    <span className="ml-2 text-xs sm:text-sm text-gray-600">{playlist.author}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-xs sm:text-sm font-medium text-gray-600">{playlist.rating}</span>
                    <span className="mx-1.5 text-gray-500">•</span>
                    <span className="text-xs sm:text-sm text-gray-500">{playlist.students} students</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPlaylists;