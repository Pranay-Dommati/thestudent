/**
 * GlobalBackgroundGenerationCard.jsx
 * 
 * A GLOBAL floating card that shows background course generation progress.
 * This component should be placed at the App level (in App.jsx or main.jsx).
 * 
 * Key behaviors:
 * - HIDES on ProLearning page (user can see progress there)
 * - SHOWS on all other pages when generation is active
 * - Persists state in localStorage for cross-page tracking
 * - X button dismisses card only (generation continues)
 * - Shows completion notification with "View Course" button
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Loader2, BookOpen, Sparkles, CheckCircle2, Eye } from 'lucide-react';

// Storage keys
const GENERATION_STATE_KEY = 'proLearning_globalGenerationState';
const DISMISSED_CARDS_KEY = 'proLearning_dismissedGenerationCards';

/**
 * Get generation state from localStorage
 */
const getGenerationState = () => {
    try {
        const stored = localStorage.getItem(GENERATION_STATE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

/**
 * Save generation state to localStorage
 */
export const saveGenerationState = (state) => {
    try {
        if (state) {
            localStorage.setItem(GENERATION_STATE_KEY, JSON.stringify({
                ...state,
                lastUpdated: Date.now()
            }));
            // Dispatch event for other components to listen
            window.dispatchEvent(new CustomEvent('generationStateUpdate', { detail: state }));
        } else {
            localStorage.removeItem(GENERATION_STATE_KEY);
        }
    } catch (e) {
        console.warn('Failed to save generation state:', e);
    }
};

/**
 * Clear generation state (call when generation completes or is cancelled)
 */
export const clearGenerationState = () => {
    try {
        localStorage.removeItem(GENERATION_STATE_KEY);
        window.dispatchEvent(new CustomEvent('generationStateUpdate', { detail: null }));
    } catch (e) {
        console.warn('Failed to clear generation state:', e);
    }
};

/**
 * Update generation progress (call from ProgressiveContentGenerator)
 */
export const updateGenerationProgress = ({
    courseId,
    courseTitle,
    currentTopic,
    currentStep,
    progress,
    totalTopics,
    completedTopics,
    isComplete = false,
    isGenerating = true
}) => {
    saveGenerationState({
        courseId,
        courseTitle,
        currentTopic,
        currentStep,
        progress: Math.min(100, Math.max(0, Math.round(progress || 0))),
        totalTopics,
        completedTopics,
        isComplete,
        isGenerating,
        timestamp: Date.now()
    });
};

/**
 * Mark generation as complete
 */
export const markGenerationComplete = (courseId, courseTitle) => {
    saveGenerationState({
        courseId,
        courseTitle,
        currentTopic: null,
        currentStep: null,
        progress: 100,
        totalTopics: 0,
        completedTopics: 0,
        isComplete: true,
        isGenerating: false,
        timestamp: Date.now()
    });
};

/**
 * Get dismissed card course IDs
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
 * Add course to dismissed cards
 */
const addDismissedCard = (courseId) => {
    try {
        const dismissed = getDismissedCards();
        if (!dismissed.includes(courseId)) {
            dismissed.push(courseId);
            localStorage.setItem(DISMISSED_CARDS_KEY, JSON.stringify(dismissed));
        }
    } catch (e) {
        console.warn('Failed to save dismissed card:', e);
    }
};

/**
 * Remove course from dismissed (for showing completion)
 */
const removeDismissedCard = (courseId) => {
    try {
        const dismissed = getDismissedCards();
        const filtered = dismissed.filter(id => id !== courseId);
        localStorage.setItem(DISMISSED_CARDS_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.warn('Failed to update dismissed cards:', e);
    }
};

/**
 * GlobalBackgroundGenerationCard Component
 */
const GlobalBackgroundGenerationCard = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [generationState, setGenerationState] = useState(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [showCard, setShowCard] = useState(false);

    const pollIntervalRef = useRef(null);

    // Check if we're on a ProLearning page
    const isOnProLearningPage = location.pathname.startsWith('/learning-path/') || location.pathname.startsWith('/pro-learning');

    // Poll for state updates and listen for events
    useEffect(() => {
        const updateFromStorage = () => {
            const state = getGenerationState();

            if (state) {
                // Check if state is stale (older than 5 minutes with no completion)
                const isStale = !state.isComplete &&
                    state.lastUpdated &&
                    (Date.now() - state.lastUpdated > 5 * 60 * 1000);

                if (isStale) {
                    clearGenerationState();
                    setGenerationState(null);
                    return;
                }

                setGenerationState(state);

                // Check dismissed state
                const dismissed = getDismissedCards();
                setIsDismissed(dismissed.includes(state.courseId));

                // If complete, remove from dismissed to show completion
                if (state.isComplete && dismissed.includes(state.courseId)) {
                    removeDismissedCard(state.courseId);
                    setIsDismissed(false);
                }
            } else {
                setGenerationState(null);
            }
        };

        // Initial check
        updateFromStorage();

        // Listen for custom events
        const handleStateUpdate = (e) => {
            if (e.detail) {
                setGenerationState(e.detail);
            } else {
                setGenerationState(null);
            }
        };

        window.addEventListener('generationStateUpdate', handleStateUpdate);

        // Poll every 2 seconds for storage changes (cross-tab support)
        pollIntervalRef.current = setInterval(updateFromStorage, 2000);

        return () => {
            window.removeEventListener('generationStateUpdate', handleStateUpdate);
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    // Handle visibility with animation
    useEffect(() => {
        const shouldShow = generationState &&
            !isOnProLearningPage &&
            !isDismissed &&
            (generationState.isGenerating || generationState.isComplete);

        if (shouldShow) {
            const timer = setTimeout(() => setShowCard(true), 100);
            return () => clearTimeout(timer);
        } else {
            setShowCard(false);
        }
    }, [generationState, isOnProLearningPage, isDismissed]);

    // Handle dismiss
    const handleDismiss = useCallback((e) => {
        e.stopPropagation();
        setIsExiting(true);

        setTimeout(() => {
            // If course is complete, clear the state entirely
            // Otherwise just add to dismissed (generation continues in background)
            if (generationState?.isComplete) {
                clearGenerationState();
                setGenerationState(null);
            } else if (generationState?.courseId) {
                addDismissedCard(generationState.courseId);
            }

            setIsDismissed(true);
            setIsExiting(false);
            setShowCard(false);
        }, 300);
    }, [generationState]);

    // Handle view course
    const handleViewCourse = useCallback(() => {
        if (generationState?.courseId) {
            navigate(`/learning-path/${generationState.courseId}`);
            // Clear the completion state after navigating
            setTimeout(() => clearGenerationState(), 500);
        }
    }, [generationState, navigate]);

    // Don't render if no state, on ProLearning page, or dismissed
    if (!generationState || isOnProLearningPage || isDismissed) {
        return null;
    }

    const {
        courseTitle = 'Your Course',
        currentTopic,
        currentStep,
        progress = 0,
        totalTopics = 0,
        completedTopics = 0,
        isComplete = false
    } = generationState;

    // Truncate title
    const displayTitle = courseTitle.length > 28
        ? courseTitle.substring(0, 25) + '...'
        : courseTitle;

    // Step labels
    const stepLabels = {
        reading: 'Reading',
        summary: 'Summary',
        videos: 'Videos',
        quiz: 'Quiz',
        resources: 'Resources',
    };

    const currentStepLabel = currentStep ? (stepLabels[currentStep] || currentStep) : null;

    // Truncate topic name
    const displayTopic = currentTopic && currentTopic.length > 20
        ? currentTopic.substring(0, 17) + '...'
        : currentTopic;

    const cardContent = (
        <div
            className={`
        fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]
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
        w-[300px] sm:w-[340px]
        ${isComplete ? 'ring-2 ring-green-500/50' : 'ring-1 ring-blue-500/30'}
      `}>
                {/* Animated background gradient */}
                <div className={`
          absolute inset-0 rounded-2xl opacity-30
          ${isComplete
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                        : 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
                    }
        `} />

                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                        className={`
              h-full transition-all duration-700 ease-out
              ${isComplete
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            }
            `}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                    {/* Animated shimmer for active generation */}
                    {!isComplete && (
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                            style={{
                                width: '50%',
                                animation: 'shimmer 2s infinite',
                            }}
                        />
                    )}
                </div>

                {/* Card content */}
                <div className="relative p-4 pt-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {/* Icon */}
                            <div className={`
                flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                ${isComplete
                                    ? 'bg-green-100 dark:bg-green-900/40'
                                    : 'bg-blue-100 dark:bg-blue-900/40'
                                }
              `}>
                                {isComplete ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                ) : (
                                    <div className="relative">
                                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-purple-500 animate-pulse" />
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={courseTitle}>
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
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
              "
                            title="Hide card (generation continues)"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Progress details */}
                    {!isComplete ? (
                        <div className="space-y-2">
                            {/* Current activity */}
                            <div className="flex items-center gap-2 text-xs">
                                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-400 truncate">
                                    {currentStepLabel && displayTopic
                                        ? `${currentStepLabel} • ${displayTopic}`
                                        : displayTopic
                                            ? `Processing: ${displayTopic}`
                                            : 'Preparing content...'
                                    }
                                </span>
                            </div>

                            {/* Progress row */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 dark:text-gray-500">
                                    {totalTopics > 0 ? `Topics: ${completedTopics}/${totalTopics}` : 'Starting...'}
                                </span>
                                <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                                    {progress}%
                                </span>
                            </div>

                            {/* Info */}
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                                Generation continues in background. You can navigate away safely.
                            </p>
                        </div>
                    ) : (
                        /* Completion state */
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Your course is ready to view!
                            </p>

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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Render via portal
    if (typeof document === 'undefined') return null;
    return createPortal(cardContent, document.body);
};

// CSS for shimmer animation
const styles = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;

// Inject styles once
if (typeof document !== 'undefined') {
    const existingStyle = document.querySelector('style[data-global-bg-card]');
    if (!existingStyle) {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-global-bg-card', 'true');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
}

export default GlobalBackgroundGenerationCard;
