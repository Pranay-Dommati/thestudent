import React from 'react';
import { FaLink, FaYoutube, FaGithub, FaFilePdf, FaExternalLinkAlt, FaBookOpen, FaGraduationCap, FaVideo, FaCode, FaDownload, FaBook, FaNewspaper, FaLaptopCode, FaUsers, FaBookmark, FaCertificate, FaStar } from 'react-icons/fa';

// ============================================
// RESOURCES VALIDATION HELPERS
// ============================================

/**
 * Check if resources generation has completed (with or without results)
 * Returns true if metadata.generatedAt exists OR if legacy resources array has items
 */
export const isResourcesGenerationComplete = (content, loadScenario = null, isDbCourse = false) => {
  // Check if resources metadata indicates completion
  const hasMetadata = !!content?.resourcesMetadata?.generatedAt;
  
  // Legacy support: if older stored course has resources array but no metadata at all, treat as completed
  const hasLegacyResources = !hasMetadata && 
    Array.isArray(content?.resources) && 
    content.resources.length > 0 && 
    !content?.resourcesMetadata;
  
  // Reload mode safety: if we're in reload mode and resourcesMetadata is missing but other tabs exist,
  // assume resources generation previously completed with zero results
  const hasReloadFallback = !hasMetadata && 
    (loadScenario === 'reload' || isDbCourse) && 
    !content?.resourcesMetadata;
  
  if (hasReloadFallback) {
    const otherTabsPresent = !!(
      content?.reading || 
      content?.summary || 
      (Array.isArray(content?.videos) && content.videos.length > 0) || 
      (Array.isArray(content?.quiz) && content.quiz.length > 0) || 
      (content?.quiz?.questions?.length > 0)
    );
    return otherTabsPresent;
  }
  
  return hasMetadata || hasLegacyResources;
};

/**
 * Check if resources array is valid and has items
 */
export const hasValidResources = (content) => {
  return content?.resources && 
         Array.isArray(content.resources) && 
         content.resources.length > 0;
};

/**
 * Check if a single resource object is valid
 */
export const isValidResource = (resource) => {
  return resource && typeof resource === 'object';
};

/**
 * Get resources array safely with validation
 */
export const getResourcesArray = (content) => {
  if (!content?.resources || !Array.isArray(content.resources)) {
    return [];
  }
  return content.resources;
};

/**
 * Get resources count
 */
export const getResourcesCount = (content) => {
  const resources = getResourcesArray(content);
  return resources.length;
};

/**
 * Check if resources tab is ready (has metadata OR has items)
 */
export const isResourcesTabReady = (content) => {
  return ((content?.resources?.length || 0) > 0) || !!content?.resourcesMetadata?.generatedAt;
};

// ============================================
// RESOURCE ICON MAPPING
// ============================================

/**
 * Map icon names to actual React components
 */
export const getIconComponent = (iconName) => {
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
    'FaStar': FaStar,
    'FaGithub': FaGithub,
    'FaFilePdf': FaFilePdf,
    'FaLink': FaLink
  };
  return iconMap[iconName] || FaExternalLinkAlt;
};

/**
 * Get appropriate icon name for resource type
 */
export const getResourceIconName = (resourceType) => {
  const typeMap = {
    'video': 'FaYoutube',
    'youtube': 'FaYoutube',
    'article': 'FaNewspaper',
    'documentation': 'FaBook',
    'tutorial': 'FaGraduationCap',
    'course': 'FaLaptopCode',
    'book': 'FaBookOpen',
    'pdf': 'FaFilePdf',
    'github': 'FaGithub',
    'code': 'FaCode',
    'repository': 'FaGithub',
    'download': 'FaDownload',
    'certification': 'FaCertificate',
    'community': 'FaUsers',
    'bookmark': 'FaBookmark',
    'link': 'FaLink'
  };
  
  const normalizedType = (resourceType || '').toLowerCase().trim();
  return typeMap[normalizedType] || 'FaExternalLinkAlt';
};

// ============================================
// RESOURCES RENDERING COMPONENTS
// ============================================

/**
 * Resources Header Component
 */
export const ResourcesHeader = ({ resourcesCount, topicName }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
            <FaLink className="text-sm" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Learning Resources</h2>
            <p className="text-sm text-gray-600">Curated materials for {topicName} mastery</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-3 text-xs">
          <div className="bg-white px-2 py-1 rounded-full shadow-sm">
            <span className="text-blue-600 font-medium">{resourcesCount} Resources</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span>⭐ Quality</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Resource Card Component
 */
export const ResourceCard = ({ resource, index, getResourceIcon }) => {
  // Safety check
  if (!isValidResource(resource)) {
    console.warn('⚠️ [RESOURCES] Skipping invalid resource at index', index);
    return null;
  }
  
  const iconName = getResourceIcon ? getResourceIcon(resource.type) : getResourceIconName(resource.type);
  const IconComponent = getIconComponent(iconName);
  
  return (
    <div
      key={resource.id || `resource-${index}`}
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-2 h-full"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
          <IconComponent className="text-xl text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 font-medium mb-1">{resource.type || 'Resource'}</div>
          <div className="text-base font-semibold text-gray-900 line-clamp-2">{resource.title || 'Untitled Resource'}</div>
        </div>
      </div>
      <div className="text-sm text-gray-600 line-clamp-3 mb-2">{resource.description || 'No description available'}</div>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-block text-blue-600 hover:underline text-sm font-medium"
      >
        Visit Resource
      </a>
    </div>
  );
};

/**
 * Empty Resources State Component
 */
export const EmptyResourcesState = ({ onGoToReading, onGoToQuiz }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-sky-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <FaLink className="text-4xl text-blue-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">
        Oops! No Resources Found
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        We couldn't find any external learning resources for this topic at the moment. 
        Don't worry—the reading material, summary, videos, and quiz are still available!
      </p>
      <div className="flex gap-3">
        <button
          onClick={onGoToReading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
        >
          Go to Reading
        </button>
        <button
          onClick={onGoToQuiz}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
        >
          Try the Quiz
        </button>
      </div>
    </div>
  );
};

/**
 * Main Resources Renderer Component
 */
export const ResourcesRenderer = ({ 
  content, 
  loadScenario, 
  isDbCourse, 
  getCurrentTopic,
  getResourceIcon,
  setActiveTab,
  LoadingComponent 
}) => {
  // Check if resources generation has COMPLETED (metadata.generatedAt exists)
  const resourcesGenerationCompleted = isResourcesGenerationComplete(content, loadScenario, isDbCourse);
  
  // If resources generation hasn't completed yet, show loader
  if (!resourcesGenerationCompleted) {
    return <LoadingComponent />;
  }
  
  // Check if we have valid resources
  const hasResources = hasValidResources(content);
  
  // If resources array is empty, undefined, or invalid (generation completed but found no resources)
  if (!hasResources) {
    return (
      <EmptyResourcesState 
        onGoToReading={() => setActiveTab('reading')}
        onGoToQuiz={() => setActiveTab('quiz')}
      />
    );
  }
  
  console.log('✅ [RESOURCES RENDER] Rendering resources grid with', content.resources.length, 'items');
  
  const resources = getResourcesArray(content);
  const topicName = getCurrentTopic ? getCurrentTopic() : 'this topic';
  
  return (
    <div className="space-y-6 pt-6">
      <ResourcesHeader 
        resourcesCount={resources.length}
        topicName={topicName}
      />
      
      {/* Compact Professional Resources Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource, index) => (
          <ResourceCard 
            key={resource.id || `resource-${index}`}
            resource={resource}
            index={index}
            getResourceIcon={getResourceIcon}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// RESOURCES DATA HELPERS
// ============================================

/**
 * Format resources array for storage/backend
 */
export const formatResourcesForStorage = (resources) => {
  if (!Array.isArray(resources)) return [];
  return resources.filter(r => isValidResource(r));
};

/**
 * Merge resources content (prefer new over old)
 */
export const mergeResourcesContent = (newResources, prevResources) => {
  if (Array.isArray(newResources)) {
    return newResources;
  }
  return Array.isArray(prevResources) ? prevResources : [];
};

/**
 * Merge resources metadata
 */
export const mergeResourcesMetadata = (newMetadata, prevMetadata) => {
  return newMetadata || prevMetadata || null;
};

/**
 * Check if resources content has meaningful data for tab unlocking
 */
export const hasResourcesContentForTabUnlock = (content) => {
  // Resources content is {resources: [...], resourcesMetadata: {...}}
  if (Array.isArray(content)) {
    return content.length > 0; // Legacy format
  }
  // New format: object with resources array and metadata
  return content && typeof content === 'object' && 
         ((Array.isArray(content.resources) && content.resources.length > 0) ||
          !!content.resourcesMetadata?.generatedAt); // Has resources OR metadata exists (generation completed)
};

export default ResourcesRenderer;
