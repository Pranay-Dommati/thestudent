import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSchoolCourses } from '../../services/courseApi';
import MobileNavigation from '../Navigation/MobileNavigation';
import { 
  FaRocket, FaBrain, FaBookOpen, FaStar, FaChevronRight, 
  FaGraduationCap, FaUser, FaFire, FaAward, FaChartLine, 
  FaCode, FaCalculator, FaAtom, FaFlask, FaBook, FaLanguage
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

// Hero Section for Mobile
const MobileHero = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-4 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-8 w-8 h-8 bg-yellow-300/20 rounded-full animate-bounce delay-300"></div>
        <div className="absolute bottom-20 left-8 w-12 h-12 bg-pink-300/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-4 w-6 h-6 bg-blue-300/30 rounded-full animate-bounce delay-700"></div>
      </div>

      <div className="relative z-10 px-4 py-12">
        {/* Stats Bar */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-2">
            <HiSparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-sm font-medium">10M+ lessons completed</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
            Learn Anything,
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Anytime, Anywhere
            </span>
          </h1>
          <p className="text-white/90 text-lg mb-6 max-w-sm mx-auto">
            AI-powered personalized learning for students. From Class 6 to 12 and beyond.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 mb-8">
          <Link 
            to="/chat"
            className="flex items-center justify-between w-full bg-white rounded-2xl p-4 shadow-lg group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FaBrain className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900">AI Study Assistant</div>
                <div className="text-sm text-gray-600">Get instant help with any topic</div>
              </div>
            </div>
            <FaChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </Link>

          <Link 
            to="/courses"
            className="flex items-center justify-between w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FaGraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-white">Browse Courses</div>
                <div className="text-sm text-white/80">Structured learning paths</div>
              </div>
            </div>
            <FaChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
          </Link>
        </div>

        {/* User Avatar Section */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {[1,2,3,4].map((i) => (
                <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{i}</span>
                </div>
              ))}
            </div>
            <span className="text-white/90 text-sm font-medium">Join 100k+ students</span>
          </div>
        </div>
      </div>

      {/* Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-auto">
          <path 
            fill="#f8fafc" 
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,58.7C672,64,768,96,864,96C960,96,1056,64,1152,53.3C1248,43,1344,53,1392,58.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </div>
    </section>
  );
};

// Subject Icons Component
const SubjectCard = ({ subject, icon, color, count }) => (
  <Link 
    to={`/courses?subject=${subject.toLowerCase()}`}
    className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group hover:shadow-md transition-all"
  >
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <span className="font-medium text-gray-900 text-sm text-center">{subject}</span>
    <span className="text-xs text-gray-500">{count} courses</span>
  </Link>
);

// Trending Courses Component
const TrendingCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const allCourses = await getSchoolCourses('', '', '');
        setCourses(allCourses.slice(0, 6));
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-gray-200 rounded-2xl h-24 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course, index) => (
        <Link 
          key={course.id} 
          to={`/course/${course.id}`}
          className="flex items-center space-x-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group hover:shadow-md transition-all"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaBookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
              {course.title}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span>{course.class_level}</span>
              <span>•</span>
              <span>{course.subject}</span>
              <span>•</span>
              <div className="flex items-center">
                <FaStar className="w-3 h-3 text-yellow-400 mr-1" />
                <span>4.8</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                Popular
              </span>
              {index < 3 && (
                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                  <FaFire className="w-3 h-3 mr-1" />
                  Trending
                </span>
              )}
            </div>
          </div>
          <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </Link>
      ))}
    </div>
  );
};

// Learning Stats Component
const LearningStats = () => (
  <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 text-white">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold">Your Learning Journey</h3>
      <FaChartLine className="w-6 h-6" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">12</div>
        <div className="text-sm text-white/80">Courses</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">4.8</div>
        <div className="text-sm text-white/80">Avg Score</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">48h</div>
        <div className="text-sm text-white/80">Learning Time</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">85%</div>
        <div className="text-sm text-white/80">Progress</div>
      </div>
    </div>
    <button className="w-full bg-white/20 backdrop-blur-sm rounded-xl py-3 mt-4 font-medium hover:bg-white/30 transition-colors">
      View Detailed Stats
    </button>
  </div>
);

// Main Mobile First Home Page Component
const MobileFirstHomePage = () => {
  const { isLoggedIn } = useAuth();

  const subjects = [
    { name: 'Mathematics', icon: <FaCalculator className="w-6 h-6 text-white" />, color: 'bg-gradient-to-br from-blue-500 to-blue-600', count: '24' },
    { name: 'Physics', icon: <FaAtom className="w-6 h-6 text-white" />, color: 'bg-gradient-to-br from-purple-500 to-purple-600', count: '18' },
    { name: 'Chemistry', icon: <FaFlask className="w-6 h-6 text-white" />, color: 'bg-gradient-to-br from-green-500 to-green-600', count: '16' },
    { name: 'Biology', icon: <FaBook className="w-6 h-6 text-white" />, color: 'bg-gradient-to-br from-red-500 to-red-600', count: '20' },
    { name: 'English', icon: <FaLanguage className="w-6 h-6 text-white" />, color: 'bg-gradient-to-br from-yellow-500 to-yellow-600', count: '12' },
    { name: 'Programming', icon: <FaCode className="w-6 h-6 text-white" />, color: 'bg-gradient-to-br from-indigo-500 to-indigo-600', count: '8' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation />
      <MobileHero />
      
      {/* Main Content */}
      <div className="px-4 py-6 space-y-8">
        
        {/* Subjects Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Explore Subjects</h2>
            <Link to="/courses" className="text-blue-600 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {subjects.map((subject, index) => (
              <SubjectCard 
                key={index}
                subject={subject.name}
                icon={subject.icon}
                color={subject.color}
                count={subject.count}
              />
            ))}
          </div>
        </section>

        {/* Learning Stats - Show only for logged in users */}
        {isLoggedIn && (
          <section>
            <LearningStats />
          </section>
        )}

        {/* Trending Courses */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
              <FaFire className="w-5 h-5 text-orange-500" />
            </div>
            <Link to="/courses" className="text-blue-600 text-sm font-medium">
              View all
            </Link>
          </div>
          <TrendingCourses />
        </section>

        {/* AI Features Banner */}
        <section>
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-2">
                <HiSparkles className="w-6 h-6" />
                <span className="text-sm font-medium">AI-Powered Learning</span>
              </div>
              <h3 className="text-xl font-bold mb-2">
                Get Instant Help with Any Topic
              </h3>
              <p className="text-white/90 text-sm mb-4">
                Ask questions, get explanations, create quizzes, and more with our AI assistant.
              </p>
              <Link 
                to="/chat"
                className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 font-medium hover:bg-white/30 transition-colors"
              >
                <span>Try AI Assistant</span>
                <FaRocket className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!isLoggedIn && (
          <section>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaGraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ready to Start Learning?
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Join thousands of students already learning with StudentsHub
              </p>
              <div className="space-y-3">
                <Link 
                  to="/auth?mode=signup"
                  className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-shadow"
                >
                  Sign Up Free
                </Link>
                <Link 
                  to="/auth?mode=login"
                  className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Already have an account?
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Add bottom padding to account for fixed tab bar */}
      <div className="h-20"></div>
    </div>
  );
};

export default MobileFirstHomePage;
