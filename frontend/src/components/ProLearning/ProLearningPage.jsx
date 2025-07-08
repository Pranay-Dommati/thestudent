import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { 
  IoHome, IoChevronBack, IoPlayCircle, IoBookmark, IoDownload, 
  IoCheckmarkCircle, IoTime, IoEye, IoStar, IoSparkles, IoRocket, 
  IoTrendingUp, IoMenu, IoClose, IoChevronDown, IoShare, IoStatsChart
} from "react-icons/io5";
import { 
  FaRobot, FaYoutube, FaGithub, FaFilePdf, FaExternalLinkAlt, 
  FaBookOpen, FaBrain, FaVideo, FaQuestionCircle, FaLink, 
  FaGraduationCap, FaClock, FaUsers, FaChartLine, FaLightbulb,
  FaBolt, FaBullseye, FaCheck, FaTrophy, FaBook, FaNewspaper,
  FaCode, FaDownload, FaBookmark, FaCertificate, FaLaptopCode,
  FaStar
} from "react-icons/fa";
import { 
  BiLoaderAlt, BiTrophy, BiCode, BiTargetLock, BiCheckShield,
  BiBookReader, BiStats, BiTime, BiPlay
} from "react-icons/bi";
import { 
  HiSparkles, HiAcademicCap, HiLightningBolt, HiFire, 
  HiChartBar, HiLightBulb, HiOutlineSparkles, HiOutlineFire
} from "react-icons/hi";
import { 
  MdOutlineAutoAwesome, MdTrendingUp, MdTimer, MdPlayArrow,
  MdSchool, MdAutoAwesome, MdTimeline, MdExplore
} from "react-icons/md";
import ReactMarkdown from "react-markdown";
import {
  splitMarkdownSections,
  generateProContent,
  generateReadingContent,
  generateSummaryContent,
  generateVideosContent,
  generateQuizContent,
  generateResourcesContent,
  handleQuizAnswer,
  restartQuiz,
  nextQuestion,
  prevQuestion
} from './ProLearningLogic';
import {
  formatDuration,
  formatViewCount,
  formatSubscriberCount,
  getResourceIcon
} from './services/index.js';

const ProLearningPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get("topic") || "Learning Topic";
  const [sidebarVisible, setSidebarVisible] = useState(false); // Start hidden on mobile
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize sidebar visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      // Show sidebar by default on large screens, hide on mobile
      if (window.innerWidth >= 1024) {
        setSidebarVisible(true);
      } else {
        setSidebarVisible(false);
        // Also close mobile menu if open
        setIsMobileMenuOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Parse multiple topics from the search parameter
  const parseTopics = (topicString) => {
    if (!topicString) return [];
    
    // Split by spaces and filter out empty strings
    const topics = topicString.split(/\s+/).filter(topic => topic.trim().length > 0);
    
    // If only one topic or no valid separation, return as single topic
    if (topics.length <= 1) {
      return [{ id: 1, name: topicString.trim(), isActive: true }];
    }
    
    // Return multiple topics with the first one active by default
    return topics.map((topicName, index) => ({
      id: index + 1,
      name: topicName.trim(),
      isActive: index === 0
    }));
  };

  const [topicsList, setTopicsList] = useState(() => parseTopics(topic));

  // Handle topic selection from sidebar
  const handleTopicSelect = (topicId) => {
    setTopicsList(prev => 
      prev.map(t => ({ ...t, isActive: t.id === topicId }))
    );
    
    // Get the selected topic name for content generation
    const selectedTopicObj = topicsList.find(t => t.id === topicId);
    if (selectedTopicObj) {
      setSelectedTopic(selectedTopicObj.name);
      // Trigger content generation for the selected topic
      generateProContent({ 
        topic: selectedTopicObj.name, 
        setIsLoading, 
        setLoadingProgress, 
        setShowSkeletons, 
        setLoadingStep, 
        setContent, 
        setStats, 
        content 
      });
    }
  };

  // Get currently active topic
  const getCurrentTopic = () => {
    const activeTopic = topicsList.find(t => t.isActive);
    return activeTopic ? activeTopic.name : topic;
  };

  // Map icon names to actual React components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'FaBookOpen': FaBookOpen,
      'FaGraduationCap': FaGraduationCap,
      'FaVideo': FaVideo,
      'FaCode': FaCode,
      'FaDownload': FaDownload,
      'FaBook': FaBook,
      'FaNewspaper': FaNewspaper,
      'FaLaptopCode': FaLaptopCode,
      'FaUsers': FaUsers,
      'FaBookmark': FaBookmark,
      'FaYoutube': FaYoutube,
      'FaCertificate': FaCertificate,
      'FaExternalLinkAlt': FaExternalLinkAlt,
      'FaStar': FaStar
    };
    return iconMap[iconName] || FaExternalLinkAlt;
  };
  
  const [activeTab, setActiveTab] = useState("reading");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Initializing...");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSkeletons, setShowSkeletons] = useState(true);

  // Handle mobile menu state changes
  const handleMobileMenuToggle = (isOpen) => {
    setIsMobileMenuOpen(isOpen);
    // Close sidebar when mobile menu opens on mobile devices
    if (isOpen && window.innerWidth < 1024) {
      setSidebarVisible(false);
    }
  };

  // Handle sidebar toggle
  const handleSidebarToggle = (isVisible) => {
    setSidebarVisible(isVisible);
    // Close mobile menu when sidebar opens on mobile devices
    if (isVisible && window.innerWidth < 1024) {
      setIsMobileMenuOpen(false);
    }
  };
  
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  
  const [content, setContent] = useState({
    reading: "",
    summary: "",
    videos: [],
    quiz: [],
    resources: []
  });
  
  const [stats, setStats] = useState({
    estimatedReadTime: 0,
    totalQuestions: 0,
    totalVideos: 0,
    totalResources: 0,
    difficulty: "Intermediate",
    completionRate: 0
  });

  const tabs = [
    { 
      id: "reading", 
      label: "Reading", 
      icon: FaBookOpen,
      description: "Comprehensive study material",
      color: "blue",
      gradient: "from-blue-500 to-indigo-600"
    },
    { 
      id: "summary", 
      label: "Summary", 
      icon: FaBrain,
      description: "Key points & concepts",
      color: "purple",
      gradient: "from-purple-500 to-pink-600"
    },
    { 
      id: "videos", 
      label: "Videos", 
      icon: FaVideo,
      description: "Curated video content",
      color: "red",
      gradient: "from-red-500 to-pink-600"
    },
    { 
      id: "quiz", 
      label: "Quiz", 
      icon: FaQuestionCircle,
      description: "Test your knowledge",
      color: "green",
      gradient: "from-green-500 to-emerald-600"
    },
    { 
      id: "resources", 
      label: "Resources", 
      icon: FaLink,
      description: "Additional materials",
      color: "orange",
      gradient: "from-orange-500 to-amber-600"
    }
  ];

  const [readingSectionIndex, setReadingSectionIndex] = useState(0);
  const readingSections = useMemo(() => splitMarkdownSections(content.reading), [content.reading]);

  const handleNextSection = () => {
    setReadingSectionIndex((prev) => Math.min(prev + 1, readingSections.length - 1));
  };
  const handlePrevSection = () => {
    setReadingSectionIndex((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    // Re-parse topics when URL parameter changes
    const newTopics = parseTopics(topic);
    setTopicsList(newTopics);
    
    // Generate content for the first/active topic
    const activeTopic = newTopics.find(t => t.isActive);
    const topicToGenerate = activeTopic ? activeTopic.name : topic;
    
    if (topicToGenerate) {
      generateProContent({ 
        topic: topicToGenerate, 
        setIsLoading, 
        setLoadingProgress, 
        setShowSkeletons, 
        setLoadingStep, 
        setContent, 
        setStats, 
        content 
      });
    }
  }, [topic]);

  const handleQuizAnswer = (questionId, answerIndex) => {
    setContent(prev => ({
      ...prev,
      quiz: prev.quiz.map(q => 
        q.id === questionId ? { ...q, userAnswer: answerIndex } : q
      )
    }));
    
    // Calculate score and update stats
    const updatedQuiz = content.quiz.map(q => 
      q.id === questionId ? { ...q, userAnswer: answerIndex } : q
    );
    const correctAnswers = updatedQuiz.filter(q => q.userAnswer === q.correct).length;
    const answeredQuestions = updatedQuiz.filter(q => q.userAnswer !== null).length;
    
    setQuizScore(correctAnswers);
    
    // Show results if all questions answered
    if (answeredQuestions === content.quiz.length) {
      setTimeout(() => setShowQuizResults(true), 500);
    }
  };

  const restartQuiz = () => {
    setContent(prev => ({
      ...prev,
      quiz: prev.quiz.map(q => ({ ...q, userAnswer: null }))
    }));
    setQuizScore(0);
    setCurrentQuestionIndex(0);
    setShowQuizResults(false);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < content.quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    // Here you could save to localStorage or send to backend
  };

  // Enhanced loading component
  const LoadingComponent = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 opacity-50"></div>
          
          {/* Main loading icon */}
          <div className="relative z-10 mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BiLoaderAlt className="text-2xl text-white animate-spin" />
            </div>
            {/* Floating particles */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="flex space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">
            Creating Your Learning Experience
          </h3>
          
          <p className="text-sm text-gray-600 mb-6 relative z-10">
            Generating materials for <span className="font-semibold text-blue-600">{getCurrentTopic()}</span>
          </p>

          {/* Enhanced progress bar */}
          <div className="mb-6 relative z-10">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="font-medium">{loadingStep.replace(/[📘🧠🎥✅📚✨❌]/g, '').trim()}</span>
              <span className="font-bold text-blue-600">{loadingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{width: `${loadingProgress}%`}}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Enhanced status indicators */}
          <div className="flex justify-center space-x-3 mb-4 relative z-10">
            {tabs.slice(0, 5).map((tab, index) => {
              const IconComponent = tab.icon;
              const isCompleted = loadingProgress > (index + 1) * 20;
              const isActive = loadingProgress >= index * 20 && loadingProgress <= (index + 1) * 20;
              
              return (
                <div key={tab.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110' 
                      : isActive
                        ? 'bg-gradient-to-br from-blue-400 to-purple-600 text-white animate-pulse scale-105'
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <FaCheck className="text-xs" />
                    ) : (
                      <IconComponent className="text-xs" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 transition-colors ${
                    isCompleted ? 'text-green-600 font-medium' : 
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}>
                    {tab.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="text-xs text-gray-400 relative z-10">
            Powered by AI • Personalized Content
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return <LoadingComponent />;
    }

    switch (activeTab) {
      case "reading":
        return (
          <div className="max-w-none">
            {/* Compact Reading Header */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaBookOpen className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Reading Material</h2>
                    <p className="text-sm text-gray-600">Comprehensive study content</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs text-gray-600">
                  <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
                    <BiTime className="mr-1 text-blue-500" />
                    <span>{stats.estimatedReadTime}m read</span>
                  </div>
                  <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
                    <FaBullseye className="mr-1 text-purple-500" />
                    <span>{stats.difficulty}</span>
                  </div>
                  <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                    <IoBookmark className="mr-1" />
                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                </div>
              </div>
            </div>
            {/* Section Navigation */}
            {readingSections.length > 1 && (
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handlePrevSection}
                  disabled={readingSectionIndex === 0}
                  className={`px-4 py-2 rounded bg-blue-100 text-blue-700 font-semibold mr-2 ${readingSectionIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'}`}
                >
                  Previous
                </button>
                <span className="text-gray-600 font-medium">
                  Section {readingSectionIndex + 1} of {readingSections.length}
                </span>
                <button
                  onClick={handleNextSection}
                  disabled={readingSectionIndex === readingSections.length - 1}
                  className={`px-4 py-2 rounded bg-blue-100 text-blue-700 font-semibold ml-2 ${readingSectionIndex === readingSections.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'}`}
                >
                  Next
                </button>
              </div>
            )}
            {/* Enhanced Content with better typography, one section at a time */}
            <div className="prose prose-lg max-w-none">
              {readingSections.length > 0 && (
                <ReactMarkdown
                  components={{
                    h1: ({children}) => (
                      <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {children}
                      </h1>
                    ),
                    h2: ({children}) => (
                      <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8 flex items-center">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
                        {children}
                      </h2>
                    ),
                    h3: ({children}) => (
                      <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6 flex items-center">
                        <FaLightbulb className="text-yellow-500 mr-2" />
                        {children}
                      </h3>
                    ),
                    p: ({children}) => (
                      <p className="text-gray-700 leading-relaxed mb-4 text-base">
                        {children}
                      </p>
                    ),
                    code: ({children}) => (
                      <code className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-2 py-1 rounded-md text-sm font-mono border">
                        {children}
                      </code>
                    ),
                    pre: ({children}) => (
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto mb-6 shadow-lg border">
                        <div className="flex items-center justify-between mb-2 text-xs">
                          <span className="text-gray-400">Code</span>
                          <button className="text-gray-400 hover:text-white">
                            <IoShare />
                          </button>
                        </div>
                        <pre className="text-sm">{children}</pre>
                      </div>
                    ),
                    ul: ({children}) => <ul className="space-y-2 mb-6 ml-6">{children}</ul>,
                    li: ({children}) => (
                      <li className="flex items-start text-gray-700">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                        <span>{children}</span>
                      </li>
                    ),
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-6 py-4 my-6 rounded-r-lg">
                        <div className="flex items-start">
                          <FaLightbulb className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                          <div className="text-blue-800 italic">{children}</div>
                        </div>
                      </blockquote>
                    )
                  }}
                >
                  {`${readingSections[readingSectionIndex].header}\n${readingSections[readingSectionIndex].content}`}
                </ReactMarkdown>
              )}
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="max-w-none">
            {/* Compact Summary Header */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaBrain className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Quick Summary</h2>
                    <p className="text-sm text-gray-600">Key points and concepts</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-purple-600 font-medium">Quick Review</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaBolt className="text-yellow-500 mr-1" />
                    <span>5-min read</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Summary Content */}
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown 
                components={{
                  h1: ({children}) => (
                    <h1 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-purple-200 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {children}
                    </h1>
                  ),
                  h2: ({children}) => (
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8 flex items-center">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-3"></div>
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6">
                      {children}
                    </h3>
                  ),
                  p: ({children}) => (
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({children}) => <ul className="space-y-3 mb-6 ml-6">{children}</ul>,
                  li: ({children}) => (
                    <li className="flex items-start text-gray-700">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <span className="leading-relaxed">{children}</span>
                    </li>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto my-6">
                      <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({children}) => (
                    <th className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-100">
                      {children}
                    </td>
                  )
                }}
              >
                {content.summary}
              </ReactMarkdown>
            </div>
          </div>
        );

      case "videos":
        return (
          <div>
            {/* Compact Videos Header */}
            <div className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaVideo className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Video Learning</h2>
                    <p className="text-sm text-gray-600">
                      {content.videosMetadata?.source === 'youtube_api' ? 'Live YouTube Data' : 'Curated educational content'}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-red-600 font-medium">{content.videos.length} videos</span>
                  </div>
                  {content.videosMetadata?.avgViewCount && (
                    <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                      <span className="text-gray-600">
                        Avg: {formatViewCount(content.videosMetadata.avgViewCount)}
                      </span>
                    </div>
                  )}
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-gray-600">HD Quality</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaYoutube className="text-red-500 mr-1" />
                    <span>
                      {content.videosMetadata?.source === 'youtube_api' ? 'Real YouTube Data' : 'YouTube Curated'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Video Stats Summary */}
              {content.videosMetadata?.source === 'youtube_api' && content.videos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {content.videos.reduce((sum, v) => sum + (v.viewCount || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Total Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {content.videos.reduce((sum, v) => sum + (v.subscriberCount || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Total Subscribers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {content.videosMetadata.totalDuration || 0} min
                      </div>
                      <div className="text-xs text-gray-600">Total Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {content.videos.filter(v => v.isEducationalChannel).length}
                      </div>
                      <div className="text-xs text-gray-600">Verified Channels</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Video Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {content.videos.map((video, index) => (
                <div key={video.id} className="group bg-white border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  <div className="flex flex-col">
                    {/* Video Thumbnail */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <IoPlayCircle className="text-red-500 text-2xl ml-1" />
                        </div>
                      </div>
                      {/* Duration badge */}
                      <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded-lg text-sm font-medium">
                        {video.formattedDuration || formatDuration(video.duration) || video.duration + ' min'}
                      </div>
                      {/* Quality badge */}
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        HD
                      </div>
                    </div>
                    
                    {/* Video Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-red-600 transition-colors">
                          {video.title}
                        </h3>
                        <div className="ml-2 flex-shrink-0">
                          {video.isEducationalChannel && (
                            <div className="flex items-center bg-blue-100 px-2 py-1 rounded-full">
                              <IoCheckmarkCircle className="text-blue-500 mr-1 text-xs" />
                              <span className="text-xs font-semibold text-blue-700">Verified</span>
                            </div>
                          )}
                          {video.difficulty && (
                            <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                              video.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                              video.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {video.difficulty}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-600 mb-4">
                        <FaYoutube className="text-red-500 mr-2" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{video.channel}</span>
                          {video.formattedSubscriberCount && (
                            <span className="text-xs text-gray-500">{video.formattedSubscriberCount}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <IoEye className="mr-1" />
                            <span>{video.formattedViewCount || (video.viewCount ? formatViewCount(video.viewCount) : video.views + ' views')}</span>
                          </div>
                          <div className="flex items-center">
                            <BiTime className="mr-1" />
                            <span>{video.formattedDuration || formatDuration(video.duration) || video.duration + ' min'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Video Description/Key Topics */}
                      {video.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      
                      {/* Key Topics Tags */}
                      {video.keyTopics && video.keyTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {video.keyTopics.slice(0, 3).map((topic, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-2">
                        <a 
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                        >
                          <IoPlayCircle className="mr-1" />
                          Watch
                        </a>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <IoBookmark className="text-lg" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                          <IoShare className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Video learning tips */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <FaLightbulb className="text-yellow-500 mr-3 text-xl" />
                <h3 className="text-lg font-semibold text-gray-900">Video Learning Tips</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Take notes while watching</span>
                </div>
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Practice along with examples</span>
                </div>
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Pause and replay difficult sections</span>
                </div>
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Apply concepts immediately</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "quiz":
        const answeredQuestions = content.quiz.filter(q => q.userAnswer !== null).length;
        const correctAnswers = content.quiz.filter(q => q.userAnswer === q.correct).length;
        const quizProgress = (answeredQuestions / content.quiz.length) * 100;
        
        return (
          <div>
            {/* Compact Quiz Header */}
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaQuestionCircle className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Knowledge Quiz</h2>
                    <p className="text-sm text-gray-600">Test your understanding</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-green-600 font-medium">{content.quiz.length} questions</span>
                  </div>
                  {answeredQuestions > 0 && (
                    <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                      <span className="text-gray-600">{correctAnswers}/{answeredQuestions} correct</span>
                    </div>
                  )}
                  {answeredQuestions === content.quiz.length && (
                    <button 
                      onClick={restartQuiz}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Restart Quiz
                    </button>
                  )}
                </div>
              </div>
              
              {/* Compact Quiz Progress */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-600">Progress: {Math.round(quizProgress)}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500"
                  style={{width: `${quizProgress}%`}}
                />
              </div>
            </div>
            
            {/* Quiz Questions */}
            <div className="space-y-6">
              {content.quiz.map((question, index) => {
                const isAnswered = question.userAnswer !== null;
                const isCorrect = question.userAnswer === question.correct;
                
                return (
                  <div key={question.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    {/* Question Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white mr-4 ${
                            isAnswered 
                              ? isCorrect 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                                : 'bg-gradient-to-br from-red-500 to-pink-600'
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Question {index + 1} of {content.quiz.length}</span>
                            {isAnswered && (
                              <div className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block ${
                                isCorrect 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isAnswered && (
                          <div className="text-right">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCorrect ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {isCorrect ? (
                                <FaCheck className="text-green-600" />
                              ) : (
                                <span className="text-red-600 font-bold">×</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
                        {question.question}
                      </h3>
                    </div>
                    
                    {/* Answer Options */}
                    <div className="p-6">
                      <div className="space-y-3 mb-6">
                        {question.options.map((option, optionIndex) => {
                          let buttonStyle = "border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700";
                          let iconStyle = "border-gray-300 text-gray-600";
                          
                          if (isAnswered) {
                            if (optionIndex === question.correct) {
                              buttonStyle = "border-2 border-green-500 bg-green-50 text-green-800";
                              iconStyle = "border-green-500 bg-green-500 text-white";
                            } else if (question.userAnswer === optionIndex) {
                              buttonStyle = "border-2 border-red-500 bg-red-50 text-red-800";
                              iconStyle = "border-red-500 bg-red-500 text-white";
                            } else {
                              buttonStyle = "border-2 border-gray-200 bg-gray-50 text-gray-500";
                              iconStyle = "border-gray-300 text-gray-400";
                            }
                          } else if (question.userAnswer === optionIndex) {
                            buttonStyle = "border-2 border-blue-500 bg-blue-50 text-blue-800";
                            iconStyle = "border-blue-500 bg-blue-500 text-white";
                          }
                          
                          return (
                            <button
                              key={optionIndex}
                              onClick={() => handleQuizAnswer(question.id, optionIndex)}
                              disabled={isAnswered}
                              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${buttonStyle} ${
                                isAnswered ? 'cursor-default' : 'cursor-pointer transform hover:scale-[1.02]'
                              }`}
                            >
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold text-sm transition-all duration-200 ${iconStyle}`}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </div>
                                <span className="font-medium leading-relaxed">{option}</span>
                                {isAnswered && optionIndex === question.correct && (
                                  <div className="ml-auto">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <FaCheck className="text-white text-xs" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Explanation */}
                      {isAnswered && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-start">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <HiLightBulb className="text-white text-sm" />
                            </div>
                            <div>
                              <div className="font-semibold text-blue-800 mb-2">Explanation</div>
                              <p className="text-blue-700 leading-relaxed">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Quiz Summary */}
              {answeredQuestions === content.quiz.length && (
                <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-2xl p-8 text-center shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FaTrophy className="text-white text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h3>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {correctAnswers}/{content.quiz.length}
                  </div>
                  <p className="text-gray-600 mb-4">
                    Score: {((correctAnswers / content.quiz.length) * 100).toFixed(0)}%
                  </p>
                  
                  {/* Performance message */}
                  <div className="mb-6">
                    {((correctAnswers / content.quiz.length) * 100) >= 80 ? (
                      <div className="bg-green-100 border border-green-300 rounded-xl p-4">
                        <p className="text-green-800 font-medium">🎉 Excellent work! You have a strong understanding of {getCurrentTopic()}.</p>
                      </div>
                    ) : ((correctAnswers / content.quiz.length) * 100) >= 60 ? (
                      <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4">
                        <p className="text-yellow-800 font-medium">👍 Good job! Review the explanations to strengthen your knowledge.</p>
                      </div>
                    ) : (
                      <div className="bg-blue-100 border border-blue-300 rounded-xl p-4">
                        <p className="text-blue-800 font-medium">📚 Keep learning! Consider reviewing the reading material and trying again.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button 
                      onClick={restartQuiz}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <IoRocket className="mr-2" />
                      Try Again
                    </button>
                    <button 
                      onClick={() => setActiveTab('reading')}
                      className="flex items-center px-6 py-3 bg-white text-green-600 border-2 border-green-200 hover:bg-green-50 rounded-xl font-semibold transition-all duration-300"
                    >
                      <FaBookOpen className="mr-2" />
                      Review Material
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "resources":
        return (
          <div className="space-y-6">
            {/* Compact Resources Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <FaLink className="text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Learning Resources</h2>
                    <p className="text-indigo-100 text-sm">
                      Curated materials for {getCurrentTopic()} mastery
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{content.resources.length}</div>
                    <div className="text-indigo-200 text-xs">Resources</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">⭐</div>
                    <div className="text-indigo-200 text-xs">Quality</div>
                  </div>
                </div>
              </div>
              
              {/* Resource Categories */}
              <div className="mt-4 flex flex-wrap gap-2">
                {content.resourcesMetadata?.categories?.map((category, index) => (
                  <span
                    key={index}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-medium text-white"
                  >
                    {category}
                  </span>
                )) || ['Documentation', 'Tutorials', 'Community', 'Tools'].map((cat, index) => (
                  <span
                    key={index}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-medium text-white"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Compact Professional Resources Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {content.resources.map((resource, index) => {
                const iconName = getResourceIcon(resource.type);
                const IconComponent = getIconComponent(iconName);
                
                // Define type-specific styling
                const getTypeStyles = (type) => {
                  const typeStyles = {
                    'Documentation': {
                      gradient: 'from-blue-500 to-indigo-600',
                      bgColor: 'bg-blue-50',
                      borderColor: 'border-blue-200',
                      textColor: 'text-blue-700',
                      badgeColor: 'bg-blue-100 text-blue-800'
                    },
                    'Tutorial': {
                      gradient: 'from-green-500 to-emerald-600',
                      bgColor: 'bg-green-50',
                      borderColor: 'border-green-200',
                      textColor: 'text-green-700',
                      badgeColor: 'bg-green-100 text-green-800'
                    },
                    'Course': {
                      gradient: 'from-purple-500 to-violet-600',
                      bgColor: 'bg-purple-50',
                      borderColor: 'border-purple-200',
                      textColor: 'text-purple-700',
                      badgeColor: 'bg-purple-100 text-purple-800'
                    },
                    'Tool': {
                      gradient: 'from-orange-500 to-red-600',
                      bgColor: 'bg-orange-50',
                      borderColor: 'border-orange-200',
                      textColor: 'text-orange-700',
                      badgeColor: 'bg-orange-100 text-orange-800'
                    },
                    'Community': {
                      gradient: 'from-pink-500 to-rose-600',
                      bgColor: 'bg-pink-50',
                      borderColor: 'border-pink-200',
                      textColor: 'text-pink-700',
                      badgeColor: 'bg-pink-100 text-pink-800'
                    },
                    'Book': {
                      gradient: 'from-amber-500 to-yellow-600',
                      bgColor: 'bg-amber-50',
                      borderColor: 'border-amber-200',
                      textColor: 'text-amber-700',
                      badgeColor: 'bg-amber-100 text-amber-800'
                    },
                    'Article': {
                      gradient: 'from-cyan-500 to-teal-600',
                      bgColor: 'bg-cyan-50',
                      borderColor: 'border-cyan-200',
                      textColor: 'text-cyan-700',
                      badgeColor: 'bg-cyan-100 text-cyan-800'
                    }
                  };
                  return typeStyles[type] || typeStyles['Documentation'];
                };
                
                const styles = getTypeStyles(resource.type);
                
                return (
                  <div
                    key={resource.id}
                    className={`group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border ${styles.borderColor} overflow-hidden transform hover:-translate-y-1`}
                  >
                    {/* Resource Number Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className={`w-6 h-6 bg-gradient-to-r ${styles.gradient} rounded-full flex items-center justify-center shadow-md`}>
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                    </div>
                    
                    {/* Header Section */}
                    <div className={`${styles.bgColor} p-4`}>
                      <div className="flex items-start space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${styles.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                          <IconComponent className="text-lg text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles.badgeColor}`}>
                              {resource.type}
                            </span>
                            {resource.free ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                FREE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                PAID
                              </span>
                            )}
                          </div>
                          <h3 className={`text-lg font-bold ${styles.textColor} line-clamp-2 group-hover:text-gray-900 transition-colors`}>
                            {resource.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-4">
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                        {resource.description}
                      </p>
                      
                      {/* Tags */}
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {resource.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Difficulty and Rating */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          resource.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                          resource.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          resource.difficulty === 'Advanced' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {resource.difficulty}
                        </span>
                        <div className="flex items-center space-x-0.5">
                          {[...Array(resource.rating === 'High' ? 5 : resource.rating === 'Medium' ? 4 : 3)].map((_, i) => (
                            <FaStar key={i} className="w-3 h-3 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group/btn w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r ${styles.gradient} text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all duration-300 transform hover:scale-105`}
                      >
                        <span className="mr-2">Explore</span>
                        <FaExternalLinkAlt className="text-xs group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                      </a>
                    </div>
                    
                    {/* Hover Effect Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${styles.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none rounded-xl`}></div>
                  </div>
                );
              })}
            </div>
            
            {/* Compact Call to Action */}
            <div className="bg-gradient-to-r from-gray-900 via-purple-900 to-violet-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-6"></div>
              </div>
              
              <div className="relative z-10 text-center max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <IoBookmark className="text-2xl text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">
                  Ready to dive deeper into {getCurrentTopic()}?
                </h3>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  These curated resources will guide your learning journey. 
                  Bookmark and track your progress.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button className="group flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg">
                    <IoBookmark className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Bookmark Resources
                  </button>
                  
                  <button className="group flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300">
                    <IoDownload className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Download Guide
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('quiz')}
                    className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
                  >
                    <FaQuestionCircle className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Test Knowledge
                  </button>
                </div>
              </div>
            </div>
            
            {/* Compact Resources Statistics */}
            {content.resourcesMetadata && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <IoStatsChart className="mr-2 text-blue-600" />
                  Resource Overview
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{content.resourcesMetadata.totalResources}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {content.resources.filter(r => r.free).length}
                    </div>
                    <div className="text-xs text-gray-600">Free</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {content.resourcesMetadata.categories?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">
                      {content.resources.filter(r => r.rating === 'High').length}
                    </div>
                    <div className="text-xs text-gray-600">High Quality</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="w-full px-2 sm:px-4 lg:px-6 max-w-full overflow-hidden">
          <div className="flex items-center justify-between h-16 min-w-0">
            {/* Left section */}
            <div className="flex items-center min-w-0 flex-shrink-0">
              <button
                onClick={() => navigate(-1)}
                className="mr-2 sm:mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
              >
                <IoChevronBack size={20} />
              </button>
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg flex-shrink-0">
                  <FaRobot className="text-white text-sm sm:text-base" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900">Pro Learning</h1>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{getCurrentTopic()}</p>
                </div>
              </div>
            </div>
            
            {/* Center section - Mobile tab indicator */}
            <div className="flex items-center space-x-2">
              {/* Mobile Sidebar Toggle */}
              <button
                onClick={() => handleSidebarToggle(!sidebarVisible)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Toggle learning guide"
              >
                <IoMenu size={18} />
              </button>
              
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => handleMobileMenuToggle(true)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <IoChevronDown size={18} />
              </button>
            </div>
            
            {/* Right section */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {!isLoading && (
                <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 text-sm">
                  <div className="flex items-center bg-gray-100 px-2 xl:px-3 py-1 rounded-full">
                    <FaClock className="mr-1 text-blue-500 text-xs" />
                    <span className="text-gray-700 text-xs xl:text-sm">{stats.estimatedReadTime}m</span>
                  </div>
                  <div className="flex items-center bg-gray-100 px-2 xl:px-3 py-1 rounded-full">
                    <FaVideo className="mr-1 text-red-500 text-xs" />
                    <span className="text-gray-700 text-xs xl:text-sm">{stats.totalVideos}</span>
                  </div>
                  <div className="flex items-center bg-gray-100 px-2 xl:px-3 py-1 rounded-full">
                    <FaQuestionCircle className="mr-1 text-green-500 text-xs" />
                    <span className="text-gray-700 text-xs xl:text-sm">{stats.totalQuestions}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                  bookmarked 
                    ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' 
                    : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                <IoBookmark size={18} />
              </button>
              
              <Link
                to="/"
                className="flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-sm flex-shrink-0"
              >
                <IoHome className="mr-1 sm:mr-2" size={16} />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => handleMobileMenuToggle(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform z-[70]">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <button
                  onClick={() => handleMobileMenuToggle(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-xl"
                >
                  <IoClose size={20} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      handleMobileMenuToggle(false);
                    }}
                    disabled={isLoading}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.gradient} text-white`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent className="mr-3" />
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className={`text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-gray-500'}`}>
                          {tab.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Sidebar Layout */}
      <div className="min-h-screen relative">
        {/* Main Content Area */}
        <div className={`transition-all duration-300 min-h-screen ${
          sidebarVisible 
            ? 'lg:mr-[400px]' // Add right margin on large screens when sidebar is visible
            : ''
        }`}>
          <div className="w-full px-2 sm:px-4 lg:px-6 py-4 max-w-full overflow-x-hidden">
              {/* Enhanced Tab Navigation */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border mb-6 hidden md:block overflow-hidden">
                <div className="p-2">
                  <nav className="flex space-x-2 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                    {tabs.map((tab) => {
                      const IconComponent = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          disabled={isLoading}
                          className={`group flex-1 min-w-[120px] p-4 rounded-xl font-medium transition-all duration-300 ${
                            isActive
                              ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`p-2 rounded-lg transition-colors ${
                              isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                              <IconComponent className="text-lg" />
                            </div>
                            <span className="text-sm font-semibold whitespace-nowrap">{tab.label}</span>
                            <span className={`text-xs text-center ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                              {tab.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Mobile Tab Indicator */}
              <div className="md:hidden mb-4">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon, { 
                        className: "mr-2 text-lg text-blue-600" 
                      })}
                      <div>
                        <div className="font-semibold text-gray-900">
                          {tabs.find(tab => tab.id === activeTab)?.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {tabs.find(tab => tab.id === activeTab)?.description}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMobileMenuToggle(true)}
                      className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      <IoChevronDown />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border overflow-hidden">
                <div className="p-4 lg:p-6 max-w-full overflow-x-hidden">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => handleSidebarToggle(!sidebarVisible)}
          className={`fixed transition-all duration-300 z-40 hover:bg-gray-50 ${
            sidebarVisible 
              ? 'top-20 right-[400px] lg:right-[400px] xl:right-[400px] transform bg-white p-3 shadow-md rounded-l-lg' 
              : 'top-20 right-4 bg-white p-3 shadow-lg rounded-lg'
          } hidden lg:flex items-center justify-center`}
          aria-label={sidebarVisible ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarVisible ? 
            <IoChevronBack className="w-5 h-5 text-gray-600" /> : 
            <IoMenu className="w-5 h-5 text-gray-600" />
          }
        </button>

        {/* Mobile Sidebar Backdrop */}
        {sidebarVisible && (
          <div 
            className="fixed inset-0 bg-black/50 z-[25] lg:hidden"
            onClick={() => handleSidebarToggle(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`fixed top-0 right-0 h-screen bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-30 flex flex-col ${
            sidebarVisible ? 'translate-x-0' : 'translate-x-full'
          } ${
            // Responsive width
            'w-full sm:w-[380px] md:w-[400px] lg:w-[400px] xl:w-[400px]'
          } ${
            // Hide on mobile by default, show only when explicitly opened
            'lg:block'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex-shrink-0 pt-20 px-4 pb-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Learning Guide</h2>
              <button
                onClick={() => handleSidebarToggle(false)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close sidebar"
              >
                <IoClose className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            {/* Topic Information */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <FaRobot className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {topicsList.length > 1 ? 'Learning Topics' : 'Current Topic'}
                  </h3>
                </div>
              </div>
              
              {/* Display multiple topics or single topic */}
              {topicsList.length > 1 ? (
                <div className="space-y-2">
                  <p className="text-blue-700 font-medium text-sm mb-3">
                    Select a topic to focus on:
                  </p>
                  {topicsList.map((topicItem) => (
                    <button
                      key={topicItem.id}
                      onClick={() => handleTopicSelect(topicItem.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        topicItem.isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                          : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{topicItem.name}</span>
                        {topicItem.isActive && (
                          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                            <FaCheck className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-blue-600 text-xs">
                      Currently learning: <span className="font-semibold">{getCurrentTopic()}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-blue-700 font-medium">{getCurrentTopic()}</p>
              )}
            </div>

            {/* Progress Overview */}
            {!isLoading && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Learning Progress</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">{stats.estimatedReadTime}m</div>
                    <div className="text-xs text-blue-700">Read Time</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">{stats.totalQuestions}</div>
                    <div className="text-xs text-green-700">Questions</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-red-600">{stats.totalVideos}</div>
                    <div className="text-xs text-red-700">Videos</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-orange-600">{stats.totalResources}</div>
                    <div className="text-xs text-orange-700">Resources</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            <div className="space-y-4">

              {/* Reading Section Navigation */}
              {activeTab === 'reading' && !isLoading && readingSections.length > 1 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Reading Sections</h4>
                  <div className="space-y-2">
                    {readingSections.map((section, index) => (
                      <button
                        key={index}
                        onClick={() => setReadingSectionIndex(index)}
                        className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                          readingSectionIndex === index
                            ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{section.header || `Section ${index + 1}`}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {section.content.substring(0, 60)}...
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Tips */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Learning Tips</h4>
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <FaLightbulb className="text-yellow-600 mt-0.5 mr-2" />
                      <div>
                        <div className="font-medium text-yellow-800 text-sm">Stay Engaged</div>
                        <div className="text-xs text-yellow-700 mt-1">Take notes and ask questions as you learn</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <FaTrophy className="text-green-600 mt-0.5 mr-2" />
                      <div>
                        <div className="font-medium text-green-800 text-sm">Practice Regularly</div>
                        <div className="text-xs text-green-700 mt-1">Apply what you learn through exercises</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <FaBrain className="text-purple-600 mt-0.5 mr-2" />
                      <div>
                        <div className="font-medium text-purple-800 text-sm">Review Summary</div>
                        <div className="text-xs text-purple-700 mt-1">Use summaries to reinforce key concepts</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProLearningPage;
