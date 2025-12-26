/**
 * useBackgroundGenerationCard.js
 * 
 * Custom hook to manage the background generation card visibility and state.
 * Integrates with ProgressiveContentGenerator and BackgroundGenerationService.
 * 
 * Usage:
 * const { cardProps, showCard, hideCard } = useBackgroundGenerationCard({
 *   courseId,
 *   courseTitle,
 *   isGenerating,
 *   progressiveProgress,
 * });
 * 
 * return <BackgroundGenerationCard {...cardProps} />;
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Storage keys
const ACTIVE_GENERATION_KEY = 'proLearning_activeBackgroundGeneration';
const CARD_VISIBLE_KEY = 'proLearning_bgCardVisible';

/**
 * Get active generation info from storage
 */
const getActiveGeneration = () => {
  try {
    const stored = localStorage.getItem(ACTIVE_GENERATION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Save active generation info to storage
 */
const saveActiveGeneration = (info) => {
  try {
    if (info) {
      localStorage.setItem(ACTIVE_GENERATION_KEY, JSON.stringify(info));
    } else {
      localStorage.removeItem(ACTIVE_GENERATION_KEY);
    }
  } catch (e) {
    console.warn('Failed to save active generation:', e);
  }
};

/**
 * Custom hook for background generation card
 */
const useBackgroundGenerationCard = ({
  courseId = null,
  courseTitle = 'Your Course',
  isGenerating = false,
  isComplete = false,
  progressiveProgress = {}, // Progress object from ProgressiveContentGenerator
  topicsList = [],
  onNavigateToCourse = null,
}) => {
  const navigate = useNavigate();
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [cardState, setCardState] = useState({
    currentTopic: null,
    currentStep: null,
    progress: 0,
    totalTopics: 0,
    completedTopics: 0,
  });
  
  const lastCourseIdRef = useRef(courseId);
  const wasGeneratingRef = useRef(false);

  // Calculate progress from progressiveProgress object
  // The progress object can be either:
  // 1. Direct progress update: { topic, tabName, overallProgress, ... }
  // 2. Full progress map: { [topicName]: { tabs: { reading: 'complete', ... } } }
  useEffect(() => {
    if (!progressiveProgress || Object.keys(progressiveProgress).length === 0) {
      return;
    }

    // Check if this is a direct progress update (has topic and tabName)
    if (progressiveProgress.topic && progressiveProgress.tabName) {
      // Direct progress format from onProgress callback
      const progress = progressiveProgress.overallProgress || 0;
      const currentTopic = progressiveProgress.topic;
      const currentStep = progressiveProgress.tabName;
      const completedTopics = progressiveProgress.completedTopics || 0;
      const totalTopics = progressiveProgress.totalTopics || topicsList.length;

      setCardState({
        currentTopic,
        currentStep,
        progress: Math.round(progress),
        totalTopics,
        completedTopics,
      });

      // Save to storage for persistence
      if (isGenerating && courseId) {
        saveActiveGeneration({
          courseId,
          courseTitle,
          currentTopic,
          currentStep,
          progress: Math.round(progress),
          totalTopics,
          completedTopics,
          timestamp: Date.now(),
        });
      }
      return;
    }

    // Full progress map format
    const topics = Object.keys(progressiveProgress);
    const totalTopics = topics.length || topicsList.length;
    
    let completedTopics = 0;
    let currentTopic = null;
    let currentStep = null;
    let totalSteps = 0;
    let completedSteps = 0;

    const tabOrder = ['reading', 'summary', 'videos', 'quiz', 'resources'];

    topics.forEach(topic => {
      const topicProgress = progressiveProgress[topic];
      if (!topicProgress) return;

      const tabs = topicProgress.tabs || {};
      const tabKeys = Object.keys(tabs);
      
      let topicComplete = true;

      tabOrder.forEach(tab => {
        totalSteps++;
        const tabStatus = tabs[tab];
        
        if (tabStatus === 'complete' || tabStatus === 'completed') {
          completedSteps++;
        } else if (tabStatus === 'generating' || tabStatus === 'in-progress') {
          topicComplete = false;
          if (!currentTopic) {
            currentTopic = topic;
            currentStep = tab;
          }
        } else if (tabStatus === 'pending' || tabStatus === 'queued' || !tabStatus) {
          topicComplete = false;
        }
      });

      if (topicComplete && tabKeys.length >= tabOrder.length) {
        completedTopics++;
      }
    });

    // Calculate overall progress percentage
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    setCardState({
      currentTopic,
      currentStep,
      progress,
      totalTopics: totalTopics || topicsList.length,
      completedTopics,
    });

    // Save to storage for persistence across page navigations
    if (isGenerating && courseId) {
      saveActiveGeneration({
        courseId,
        courseTitle,
        currentTopic,
        currentStep,
        progress,
        totalTopics: totalTopics || topicsList.length,
        completedTopics,
        timestamp: Date.now(),
      });
    }
  }, [progressiveProgress, topicsList, isGenerating, courseId, courseTitle]);

  // Show card when generation starts
  useEffect(() => {
    if (isGenerating && courseId && !wasGeneratingRef.current) {
      setIsCardVisible(true);
      wasGeneratingRef.current = true;
    }
    
    if (!isGenerating && wasGeneratingRef.current) {
      // Generation finished
      wasGeneratingRef.current = false;
      
      // Keep card visible briefly to show completion, then it can be dismissed
      if (isComplete) {
        // Card stays visible for completion message
        setCardState(prev => ({ ...prev, progress: 100 }));
      }
    }
  }, [isGenerating, courseId, isComplete]);

  // Check for active generation on mount (for page refresh scenarios)
  useEffect(() => {
    const activeGen = getActiveGeneration();
    if (activeGen && activeGen.courseId && activeGen.progress < 100) {
      // There's an active generation from before
      const timeSinceStart = Date.now() - activeGen.timestamp;
      const maxAge = 30 * 60 * 1000; // 30 minutes max
      
      if (timeSinceStart < maxAge) {
        setCardState({
          currentTopic: activeGen.currentTopic,
          currentStep: activeGen.currentStep,
          progress: activeGen.progress,
          totalTopics: activeGen.totalTopics,
          completedTopics: activeGen.completedTopics,
        });
        setIsCardVisible(true);
      } else {
        // Too old, clear it
        saveActiveGeneration(null);
      }
    }
  }, []);

  // Clear active generation when complete
  useEffect(() => {
    if (isComplete && courseId) {
      // Don't clear immediately, user might want to see completion
      const timer = setTimeout(() => {
        saveActiveGeneration(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, courseId]);

  // Handle navigation to course
  const handleViewCourse = useCallback((cId) => {
    const targetCourseId = cId || courseId;
    if (onNavigateToCourse) {
      onNavigateToCourse(targetCourseId);
    } else if (targetCourseId) {
      navigate(`/pro-learning/${targetCourseId}`);
    }
    saveActiveGeneration(null);
  }, [courseId, navigate, onNavigateToCourse]);

  // Manually show the card
  const showCard = useCallback(() => {
    setIsCardVisible(true);
  }, []);

  // Manually hide the card (doesn't stop generation)
  const hideCard = useCallback(() => {
    setIsCardVisible(false);
  }, []);

  // Build props for BackgroundGenerationCard component
  const cardProps = {
    isVisible: isCardVisible && (isGenerating || isComplete),
    courseId,
    courseTitle,
    currentTopic: cardState.currentTopic,
    currentStep: cardState.currentStep,
    progress: cardState.progress,
    totalTopics: cardState.totalTopics,
    completedTopics: cardState.completedTopics,
    isComplete,
    onViewCourse: handleViewCourse,
    position: 'bottom-right',
  };

  return {
    cardProps,
    isCardVisible,
    showCard,
    hideCard,
    cardState,
  };
};

export default useBackgroundGenerationCard;

// Export utilities
export { getActiveGeneration, saveActiveGeneration };
