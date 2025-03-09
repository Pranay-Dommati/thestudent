import React, { useState } from 'react';

const FeaturedPlaylists = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: 'All Playlists' },
    { id: 'tenth', name: 'Class 10' },
    { id: 'eleventh', name: 'Class 11' },
    { id: 'twelfth', name: 'Class 12' },
    { id: 'undergraduate', name: 'Undergraduate' }
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
      title: 'Chemistry for Class 12 Board Prep', 
      duration: '48 hours',
      lessons: 85,
      category: 'twelfth',
      author: 'Chemistry Masters',
      rating: 4.7,
      students: '18.9K',
      image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?ixlib=rb-4.0.3'
    },
    // Undergraduate Courses
    { 
      id: 4, 
      title: 'Web Development Bootcamp', 
      duration: '56 hours',
      lessons: 120,
      category: 'undergraduate',
      author: 'Tech Academy',
      rating: 4.8,
      students: '15.4K',
      image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3'
    },
    { 
      id: 5, 
      title: 'Class 10 Science Masterclass', 
      duration: '42 hours',
      lessons: 80,
      category: 'tenth',
      author: 'Science Experts',
      rating: 4.9,
      students: '22.8K',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3'
    },
    { 
      id: 6, 
      title: 'Class 11 Advanced Mathematics', 
      duration: '52 hours',
      lessons: 100,
      category: 'eleventh',
      author: 'Math Academy',
      rating: 4.8,
      students: '16.5K',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3'
    }
  ];
  
  const filteredPlaylists = activeCategory === 'all' 
    ? playlists 
    : playlists.filter(playlist => playlist.category === activeCategory);

  return (
    <section className="pt-0 pb-16 px-4 bg-[#F9FAFB]">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h5 className="text-blue-600 font-semibold mb-2">FEATURED COLLECTIONS</h5>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Most Popular Playlists</h2>
          </div>
          
          <div className="mt-4 md:mt-0">
            <a href="#view-all" className="inline-flex items-center text-blue-600 font-medium hover:underline">
              View All Playlists
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <div key={playlist.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={playlist.image} 
                  alt={playlist.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                    {categories.find(c => c.id === playlist.category)?.name}
                  </span>
                  <span className="flex items-center text-white text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {playlist.duration}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {playlist.title}
                </h3>
                <div className="flex items-center mb-4 text-sm text-gray-500">
                  <span className="flex items-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {playlist.author}
                  </span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {playlist.lessons} lessons
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center mr-2">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(playlist.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{playlist.rating} ({playlist.students})</span>
                  </div>
                  <button className="px-4 py-2 bg-indigo-50 text-blue-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                    View Course
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Load More Courses
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPlaylists;