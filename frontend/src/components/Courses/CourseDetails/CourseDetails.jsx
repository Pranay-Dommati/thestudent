import React, { useState, useEffect } from 'react';

const CourseDetails = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('outline');
  
  // Simulated course data (in a real app, you'd fetch this from an API)
  useEffect(() => {
    setLoading(true);
    
    // Simulating API fetch
    setTimeout(() => {
      setCourse({
        id: 1,
        title: "Master Next.js: From Zero to Production",
        instructor: {
          name: "John Doe",
          avatar: "https://via.placeholder.com/150",
          bio: "Senior Developer with 10+ years of experience"
        },
        thumbnail: "https://via.placeholder.com/1200x600?text=Next.js+Course",
        duration: "56 hours",
        level: "Beginner",
        tags: ["Free", "Video", "Project-Based"],
        rating: 4.8,
        reviewCount: 1245,
        platform: "YouTube",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "This comprehensive course takes you from the basics of Next.js to deploying production-ready applications.",
        chapters: [
          {
            title: "Introduction to Next.js",
            lessons: [
              { title: "What is Next.js?", duration: "12:45", completed: true },
              { title: "Setting Up Your Environment", duration: "18:30", completed: false },
              { title: "Creating Your First Next.js App", duration: "25:10", completed: false }
            ]
          },
          {
            title: "Routing in Next.js",
            lessons: [
              { title: "File-based Routing", duration: "15:20", completed: false },
              { title: "Dynamic Routes", duration: "22:15", completed: false }
            ]
          }
        ],
        reviews: [
          {
            user: "Sarah M.",
            rating: 5,
            comment: "This course is amazing! I've learned so much about Next.js."
          },
          {
            user: "Michael T.",
            rating: 4,
            comment: "Great content and well-explained."
          }
        ],
        relatedCourses: [
          {
            id: 2,
            title: "Advanced React Hooks",
            thumbnail: "https://via.placeholder.com/300x200?text=React+Hooks",
            instructor: "Sarah Smith",
            duration: "32 hours",
            rating: 4.9
          },
          {
            id: 5,
            title: "Node.js Backend Development",
            thumbnail: "https://via.placeholder.com/300x200?text=Node.js",
            instructor: "David Wilson",
            duration: "42 hours",
            rating: 4.9
          }
        ]
      });
      setLoading(false);
    }, 800);
    
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-center">Course not found</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{course.title}</h1>
          <div className="flex items-center mb-4">
            <span className="mr-2">Created by {course.instructor.name}</span>
            <span className="mx-2">•</span>
            <span className="flex items-center">
              {Array(5).fill(0).map((_, i) => (
                <svg key={i} className={`w-5 h-5 ${i < Math.floor(course.rating) ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1">{course.rating} ({course.reviewCount} reviews)</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{course.level}</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{course.duration}</span>
            {course.tags.map(tag => (
              <span key={tag} className="bg-white/20 px-3 py-1 rounded-full text-sm">{tag}</span>
            ))}
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{course.platform}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Video Preview */}
          <div className="aspect-w-16 aspect-h-9">
            <iframe 
              src={course.videoUrl} 
              allowFullScreen
              className="w-full h-96"
              title={course.title}
            ></iframe>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex">
              <button 
                onClick={() => setActiveTab('outline')} 
                className={`px-4 py-3 font-medium ${activeTab === 'outline' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-700'}`}
              >
                Course Outline
              </button>
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`px-4 py-3 font-medium ${activeTab === 'overview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-700'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('reviews')} 
                className={`px-4 py-3 font-medium ${activeTab === 'reviews' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-700'}`}
              >
                Reviews
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'outline' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Course Content</h2>
                <div className="space-y-4">
                  {course.chapters.map((chapter, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 font-medium">
                        {chapter.title}
                      </div>
                      <ul className="divide-y">
                        {chapter.lessons.map((lesson, idx) => (
                          <li key={idx} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center">
                              <span className={`mr-3 ${lesson.completed ? 'text-green-500' : 'text-gray-400'}`}>
                                {lesson.completed ? '✓' : '○'}
                              </span>
                              <span>{lesson.title}</span>
                            </div>
                            <span className="text-gray-500 text-sm">{lesson.duration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                <p className="text-gray-700">{course.description}</p>
                
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-3">Instructor</h3>
                  <div className="flex items-center">
                    <img src={course.instructor.avatar} alt={course.instructor.name} className="w-16 h-16 rounded-full mr-4" />
                    <div>
                      <h4 className="font-medium">{course.instructor.name}</h4>
                      <p className="text-gray-600">{course.instructor.bio}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Student Reviews</h2>
                <div className="space-y-6">
                  {course.reviews.map((review, index) => (
                    <div key={index} className="border-b pb-4">
                      <div className="flex items-center mb-2">
                        <span className="font-medium mr-2">{review.user}</span>
                        <div className="flex">
                          {Array(5).fill(0).map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Start Learning Button */}
        <div className="mt-8 flex justify-center">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg shadow-md transition">
            Start Learning
          </button>
        </div>

        {/* Related Courses */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You might also like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {course.relatedCourses.map((related) => (
              <div key={related.id} className="bg-white rounded-lg shadow overflow-hidden flex">
                <img src={related.thumbnail} alt={related.title} className="w-1/3 h-auto object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{related.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">by {related.instructor}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">{related.duration}</span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {related.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;