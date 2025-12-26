// ProgressiveGenerationStatus.jsx
// Component to display progressive content generation status

import React from 'react';
import { 
  FaBookOpen, FaBrain, FaVideo, FaQuestionCircle, FaLink,
  FaCheck, FaClock, FaSpinner
} from 'react-icons/fa';
import { BiLoaderAlt } from 'react-icons/bi';

const ProgressiveGenerationStatus = ({ 
  isGenerating, 
  currentProgress = {},
  availableTabs = {},
  onTabClick,
  currentTopic,
  topics = []
}) => {
  const tabConfig = [
    { id: 'reading', label: 'Reading', icon: FaBookOpen, color: 'blue' },
    { id: 'summary', label: 'Summary', icon: FaBrain, color: 'purple' },
    { id: 'videos', label: 'Videos', icon: FaVideo, color: 'red' },
    { id: 'quiz', label: 'Quiz', icon: FaQuestionCircle, color: 'green' },
    { id: 'resources', label: 'Resources', icon: FaLink, color: 'orange' }
  ];

  const getTabStatus = (topicName, tabId) => {
    if (!availableTabs[topicName]) return 'waiting';
    if (availableTabs[topicName].includes(tabId)) return 'complete';
    
    // Check if this is currently being generated
    if (isGenerating && 
        currentProgress.topic === topicName && 
        currentProgress.tabType === tabId) {
      return 'generating';
    }
    
    return 'waiting';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <FaCheck className="text-green-500" />;
      case 'generating':
        return <FaSpinner className="text-blue-500 animate-spin" />;
      case 'waiting':
        return <FaClock className="text-gray-400" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getStatusColor = (status, baseColor) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'generating':
        return `bg-${baseColor}-100 border-${baseColor}-300 text-${baseColor}-800 animate-pulse`;
      case 'waiting':
        return 'bg-gray-100 border-gray-300 text-gray-500';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-500';
    }
  };

  if (!isGenerating && (!topics || topics.length === 0)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isGenerating && <BiLoaderAlt className="text-blue-500 animate-spin" />}
          <h3 className="text-lg font-semibold text-gray-800">
            {isGenerating ? 'Generating Course Content...' : 'Content Generation Status'}
          </h3>
        </div>
        
        {isGenerating && currentProgress.overallProgress !== undefined && (
          <div className="text-sm text-gray-600">
            {currentProgress.overallProgress}% Complete
          </div>
        )}
      </div>

      {/* Overall Progress Bar */}
      {isGenerating && currentProgress.overallProgress !== undefined && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress.overallProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Current Generation Status */}
      {isGenerating && currentProgress.topic && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>Currently Generating:</strong> {currentProgress.tabName} for {currentProgress.topic}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Topic {(currentProgress.topicIndex || 0) + 1} of {currentProgress.totalTopics || topics.length} • 
            Tab {(currentProgress.tabIndex || 0) + 1} of {currentProgress.totalTabs || 5}
          </div>
        </div>
      )}

      {/* Topics and Tabs Grid */}
      <div className="space-y-4">
        {topics.map((topic, topicIndex) => {
          const topicName = topic.name || topic;
          const isCurrentTopic = topicName === currentTopic;
          
          return (
            <div 
              key={topicIndex}
              className={`border rounded-lg p-3 transition-all duration-200 ${
                isCurrentTopic 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Topic Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-medium ${
                  isCurrentTopic ? 'text-blue-800' : 'text-gray-700'
                }`}>
                  {topicName}
                </h4>
                
                {/* Topic Progress */}
                <div className="text-xs text-gray-500">
                  {availableTabs[topicName] ? availableTabs[topicName].length : 0} / {tabConfig.length} tabs ready
                </div>
              </div>

              {/* Tabs Grid */}
              <div className="grid grid-cols-5 gap-2">
                {tabConfig.map((tab) => {
                  const status = getTabStatus(topicName, tab.id);
                  const IconComponent = tab.icon;
                  const isClickable = status === 'complete' && isCurrentTopic;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => isClickable && onTabClick && onTabClick(tab.id)}
                      disabled={!isClickable}
                      className={`
                        flex flex-col items-center justify-center p-2 rounded-lg border text-xs
                        transition-all duration-200 min-h-[60px]
                        ${getStatusColor(status, tab.color)}
                        ${isClickable 
                          ? 'hover:shadow-md cursor-pointer transform hover:scale-105' 
                          : 'cursor-not-allowed'
                        }
                      `}
                      title={`${tab.label} - ${status}`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <IconComponent className="text-sm" />
                        <div className="ml-1">
                          {getStatusIcon(status)}
                        </div>
                      </div>
                      <span className="text-center leading-tight">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <FaCheck className="text-green-500" />
            <span className="text-gray-600">Ready</span>
          </div>
          <div className="flex items-center space-x-1">
            <FaSpinner className="text-blue-500" />
            <span className="text-gray-600">Generating</span>
          </div>
          <div className="flex items-center space-x-1">
            <FaClock className="text-gray-400" />
            <span className="text-gray-600">Waiting</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressiveGenerationStatus;
