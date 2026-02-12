/**
 * BackgroundGenerationCard.jsx
 * 
 * A floating card component that shows when course generation is running in the background.
 * The X button dismisses the card UI only - generation continues in the background.
 * 
 * Features:
 * - Animated entrance/exit
 * - Progress indicator with pulse animation
 * - Topic/step progress display
 * - Dismissible (hides card, doesn't stop generation)
 * - Remembers dismissed state per course
 * - Shows completion notification option
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, BookOpen, Sparkles, CheckCircle2, Eye } from 'lucide-react';

// Storage key for dismissed cards
const DISMISSED_CARDS_KEY = 'proLearning_dismissedGenerationCards';

/**
 * Get dismissed card course IDs from localStorage
 */
const getDismissedCards = () => {
  try {
    const stored = localStorage.getItem(DISMISSED_CARDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Add a course ID to dismissed cards
 */
const addDismissedCard = (courseId) => {
  try {
    const dismissed = getDismissedCards();
    if (!dismissed.includes(courseId)) {
      dismissed.push(courseId);
      localStorage.setItem(DISMISSED_CARDS_KEY, JSON.stringify(dismissed));
    }
  } catch (e) {
    console.warn('Failed to save dismissed card state:', e);
  }
};

/**
 * Remove a course ID from dismissed cards (show again)
 */
const removeDismissedCard = (courseId) => {
  try {
    const dismissed = getDismissedCards();
    const filtered = dismissed.filter(id => id !== courseId);
    localStorage.setItem(DISMISSED_CARDS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to update dismissed card state:', e);
  }
};

/**
 * Clear all dismissed cards
 */
const clearAllDismissedCards = () => {
  try {
    localStorage.removeItem(DISMISSED_CARDS_KEY);
  } catch (e) {
    console.warn('Failed to clear dismissed cards:', e);
  }
};

/**
 * BackgroundGenerationCard Component
 */
const BackgroundGenerationCard = ({
  isVisible = false,
  courseId = null,
  courseTitle = 'Your Course',
  currentTopic = null,
  currentStep = null,
  progress = 0, // 0-100
  totalTopics = 0,
  completedTopics = 0,
  isComplete = false,
  onViewCourse = null, // Callback when user clicks "View Course" after completion
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showCard, setShowCard] = useState(false);

  // Check if this card was previously dismissed
  useEffect(() => {
    if (courseId) {
      const dismissed = getDismissedCards();
      setIsDismissed(dismissed.includes(courseId));
    }
  }, [courseId]);

  // Handle visibility and animation
  useEffect(() => {
    if (isVisible && !isDismissed) {
      // Small delay for entrance animation
      const timer = setTimeout(() => setShowCard(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowCard(false);
    }
  }, [isVisible, isDismissed]);

  // When generation completes, remove from dismissed so it shows completion
  useEffect(() => {
    if (isComplete && courseId) {
      removeDismissedCard(courseId);
      setIsDismissed(false);
    }
  }, [isComplete, courseId]);

  // Handle dismiss with animation
  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    setIsExiting(true);
    
    // Add to dismissed list
    if (courseId) {
      addDismissedCard(courseId);
    }
    
    // Wait for exit animation
    setTimeout(() => {
      setIsDismissed(true);
      setIsExiting(false);
      setShowCard(false);
    }, 300);
  }, [courseId]);

  // Handle view course click
  const handleViewCourse = useCallback(() => {
    if (onViewCourse) {
      onViewCourse(courseId);
    }
    // Clear from dismissed after viewing
    if (courseId) {
      removeDismissedCard(courseId);
    }
  }, [courseId, onViewCourse]);

  // Don't render if not visible or dismissed
  if (!isVisible || isDismissed) {
    return null;
  }

  // Position styles
  const positionStyles = {
    'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
    'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
    'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
    'top-left': 'top-4 left-4 sm:top-6 sm:left-6',
  };

  // Truncate title if too long
  const displayTitle = courseTitle.length > 30 
    ? courseTitle.substring(0, 27) + '...' 
    : courseTitle;

  // Format current step for display
  const stepLabels = {
    reading: 'Reading Material',
    summary: 'Summary',
    videos: 'Video Resources',
    quiz: 'Quiz Questions',
    resources: 'Additional Resources',
  };

  const currentStepLabel = currentStep ? (stepLabels[currentStep] || currentStep) : null;

  const cardContent = (
    <div
      className={`
        fixed ${positionStyles[position]} z-[9999]
        transition-all duration-300 ease-out
        ${showCard && !isExiting 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }
      `}
    >
      <div className={`
        relative overflow-hidden
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded-2xl shadow-2xl
        w-[320px] sm:w-[360px]
        backdrop-blur-sm
        ${isComplete ? 'ring-2 ring-green-500/50' : 'ring-1 ring-purple-500/20'}
      `}>
        {/* Animated gradient border effect */}
        <div className={`
          absolute inset-0 rounded-2xl opacity-50
          ${isComplete 
            ? 'bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10' 
            : 'bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10'
          }
        `} />
        
        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800">
          <div 
            className={`
              h-full transition-all duration-500 ease-out
              ${isComplete 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-[length:200%_100%] animate-gradient'
              }
            `}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>

        {/* Card content */}
        <div className="relative p-4 pt-5">
          {/* Header with dismiss button */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              {/* Icon */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                ${isComplete 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-purple-100 dark:bg-purple-900/30'
                }
              `}>
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <div className="relative">
                    <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-purple-500 animate-pulse" />
                  </div>
                )}
              </div>
              
              {/* Title */}
              <div className="flex-1 min-w-0">
                <h4 className={`
                  text-sm font-semibold truncate
                  ${isComplete 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-gray-900 dark:text-white'
                  }
                `}>
                  {isComplete ? 'Course Ready!' : 'Generating Course'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {displayTitle}
                </p>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="
                flex-shrink-0 p-1.5 rounded-lg
                text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-500/50
              "
              title="Hide this card (generation continues in background)"
              aria-label="Dismiss card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress details */}
          {!isComplete ? (
            <div className="space-y-2.5">
              {/* Current activity */}
              <div className="flex items-center gap-2 text-xs">
                <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {currentTopic && currentStepLabel 
                    ? `${currentStepLabel} • ${currentTopic}`
                    : currentTopic 
                      ? `Processing: ${currentTopic}`
                      : 'Preparing content...'
                  }
                </span>
              </div>

              {/* Topics progress */}
              {totalTopics > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-500">
                    Topics: {completedTopics}/{totalTopics}
                  </span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
              )}

              {/* Info text */}
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                Generation continues in background. You can navigate away safely.
              </p>
            </div>
          ) : (
            /* Completion state */
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your course has been generated and saved successfully!
              </p>
              
              {onViewCourse && (
                <button
                  onClick={handleViewCourse}
                  className="
                    w-full flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-xl
                    bg-gradient-to-r from-green-500 to-emerald-500
                    hover:from-green-600 hover:to-emerald-600
                    text-white text-sm font-medium
                    transition-all duration-200
                    shadow-lg shadow-green-500/25
                    focus:outline-none focus:ring-2 focus:ring-green-500/50
                  "
                >
                  <Eye className="w-4 h-4" />
                  View Course
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render via portal to ensure it's above everything
  return createPortal(cardContent, document.body);
};

// CSS for gradient animation (add to your global styles or use styled-components)
const styles = `
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-gradient {
  animation: gradient 2s ease infinite;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  if (!document.querySelector('style[data-bg-card-styles]')) {
    styleEl.setAttribute('data-bg-card-styles', 'true');
    document.head.appendChild(styleEl);
  }
}

export default BackgroundGenerationCard;

// Named exports for utility functions
export { 
  getDismissedCards, 
  addDismissedCard, 
  removeDismissedCard, 
  clearAllDismissedCards 
};
