// CourseDetails.js - Main component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import HeroSection from './HeroSection';
import VideoPlayer from './VideoPlayer';
import CourseTabs from './CourseTabs';
import CourseContent from './CourseContent';
import CourseOverview from './CourseOverview';
import CourseReviews from './CourseReviews';
import RelatedCourses from './RelatedCourses';

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
    return <LoadingSpinner />;
  }

  if (!course) {
    return <div className="p-8 text-center">Course not found</div>;
  }

  // Calculate progress
  const totalLessons = course.chapters.reduce((acc, chapter) => acc + chapter.lessons.length, 0);
  const completedLessons = course.chapters.reduce((acc, chapter) => 
    acc + chapter.lessons.filter(lesson => lesson.completed).length, 0);
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <HeroSection 
        course={course} 
        progressPercentage={progressPercentage} 
        completedLessons={completedLessons} 
        totalLessons={totalLessons} 
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <VideoPlayer videoUrl={course.videoUrl} title={course.title} />

          <CourseTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'outline' && (
              <CourseContent course={course} />
            )}

            {activeTab === 'overview' && (
              <CourseOverview course={course} />
            )}

            {activeTab === 'reviews' && (
              <CourseReviews course={course} />
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
        <RelatedCourses relatedCourses={course.relatedCourses} />
      </div>
    </div>
  );
};

export default CourseDetails;