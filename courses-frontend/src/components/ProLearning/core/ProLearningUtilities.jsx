/**
 * Pro Learning Utilities
 * 
 * Helper functions for storage management, URL navigation, course ID management,
 * and utility functions for the Pro Learning experience.
 */

import proContentManager from '../../../services/ProContentManager';
import contentStorageService from '../../../services/ContentStorageService';

/**
 * Clear all content storage (for debugging/development)
 */
export const clearContentStorage = (dependencies) => {
    const {
        clearReadingContentCache,
        setContent,
        setReadingSections,
        setReadingSectionIndex,
        setTopicsList,
        setCompletedTopics
    } = dependencies;

    proContentManager.clearStorage();
    contentStorageService.clearStorage();
    clearReadingContentCache();

    // Reset local state to force regeneration
    setContent(null);
    setReadingSections([]);
    setReadingSectionIndex(0);
    setTopicsList([]);
    setCompletedTopics([]);
};

/**
 * Clear content for a specific topic from both storage systems (for fresh generation)
 */
export const clearTopicFromBothStorages = (courseId, topicName) => {
    try {
        console.log('🗑️ DEBUG: Clearing topic content from both storage systems:', topicName);

        // Clear from ProContentManager (localStorage/IndexedDB)
        if (proContentManager.clearTopicStorage) {
            proContentManager.clearTopicStorage(courseId, topicName);
        }

        // Clear from ContentStorageService (Map-based) - but preserve the topic, just clear content
        const topic = contentStorageService.getTopicByName(topicName, courseId);
        if (topic && topic.id) {
            console.log('🗑️ DEBUG: Removing content for topic ID:', topic.id);
            // Only remove the content, not the topic itself to avoid ID mismatches
            if (contentStorageService.removeTopicContent) {
                contentStorageService.removeTopicContent(topic.id);
            }
            // Don't remove the topic itself - just mark it as not having content
            const topicData = contentStorageService.storage?.topics?.get(topic.id);
            if (topicData) {
                topicData.contentGenerated = false;
                topicData.contentId = null;
                topicData.updatedAt = new Date().toISOString();
                contentStorageService.storage.topics.set(topic.id, topicData);
                console.log('🗑️ DEBUG: Topic content cleared but topic preserved:', topic.id);
            }
        }

        console.log('🗑️ DEBUG: Topic content cleared from both storage systems');
    } catch (error) {
        console.error('❌ Error clearing topic content:', error);
    }
};

/**
 * Reading section navigation handlers
 */
export const createReadingNavigationHandlers = (dependencies) => {
    const { readingSectionIndex, setReadingSectionIndex, readingSections } = dependencies;

    const handlePrevSection = () => {
        if (readingSectionIndex > 0) {
            setReadingSectionIndex(readingSectionIndex - 1);
        }
    };

    const handleNextSection = () => {
        if (readingSectionIndex < readingSections.length - 1) {
            setReadingSectionIndex(readingSectionIndex + 1);
        }
    };

    return { handlePrevSection, handleNextSection };
};

/**
 * URL and Tab Management
 */
export const createTabNavigationHandlers = (dependencies) => {
    const {
        setActiveTab,
        setSearchParams,
        searchParams,
        tabUrlSyncPendingRef,
        debouncedUpdateActiveTab
    } = dependencies;

    // Update URL when activeTab changes
    const updateActiveTab = (newTab) => {
        tabUrlSyncPendingRef.current = true;
        setActiveTab(newTab);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('tab', newTab);
        setSearchParams(newSearchParams, { replace: true });
        // Clear the pending flag on next tick
        setTimeout(() => { tabUrlSyncPendingRef.current = false; }, 0);
    };

    // Debounced version for desktop to prevent rapid clicking issues
    const updateActiveTabDesktop = (newTab) => {
        // Clear any pending debounced calls
        if (debouncedUpdateActiveTab.current) {
            clearTimeout(debouncedUpdateActiveTab.current);
        }

        // Immediately update the UI
        tabUrlSyncPendingRef.current = true;
        setActiveTab(newTab);

        // Debounce the URL update to prevent excessive navigation
        debouncedUpdateActiveTab.current = setTimeout(() => {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('tab', newTab);
            setSearchParams(newSearchParams, { replace: true });
            tabUrlSyncPendingRef.current = false;
        }, 100); // 100ms debounce
    };

    // Update URL when topic changes
    const updateTopicInUrl = (newTopic) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('topic', newTopic);
        // Reset tab to reading when changing topics
        newSearchParams.set('tab', 'reading');
        // Avoid double setSearchParams race: update activeTab state locally, then set both params once
        setActiveTab('reading');
        setSearchParams(newSearchParams, { replace: true });
    };

    return { updateActiveTab, updateActiveTabDesktop, updateTopicInUrl };
};

/**
 * Course ID Management
 */
export const createCourseIdHandlers = (dependencies) => {
    const { courseId, navigate } = dependencies;

    // Generate or get course ID for current session
    const generateCourseId = () => `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const getCourseId = () => {
        // Prefer URL param; otherwise use cached localStorage. The IndexedDB write happens when setting.
        return courseId || (typeof localStorage !== 'undefined' ? localStorage.getItem('currentCourseId') : null) || null;
    };

    const setAndNavigateToCourseId = async (id) => {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('currentCourseId', id);
            }
        } catch { }
        navigate(`/learning-path/${id}${window.location.search}`, { replace: true });
    };

    return { generateCourseId, getCourseId, setAndNavigateToCourseId };
};

/**
 * Get currently active topic
 */
export const getCurrentTopic = (dependencies) => {
    const { topicsList, topicParam } = dependencies;
    const activeTopic = topicsList.find(t => t.isActive);
    return activeTopic ? activeTopic.name : (topicParam || (topicsList.length > 0 ? topicsList[0].name : ''));
};

/**
 * Compute completed topics count
 */
export const computeCompletedTopicsCount = (dependencies) => {
    const {
        topicsList,
        courseId,
        hasValidSummary,
        contentStorageService
    } = dependencies;

    if (!courseId || !topicsList || topicsList.length === 0) {
        return 0;
    }

    const isTopicComplete = (topic) => {
        // Prefer stored content when available (progressive/batch paths)
        const stored = contentStorageService.getContentByTopicName(topic.name || topic, courseId);
        const fromDB = topic.dbTopic || null;
        const c = stored || (fromDB
            ? {
                reading: fromDB.reading_material,
                summary: fromDB.summary,
                videos: Array.isArray(fromDB.videos) ? fromDB.videos : [],
                quiz: Array.isArray(fromDB.quiz_questions) ? fromDB.quiz_questions : [],
                resources: Array.isArray(fromDB.resources) ? fromDB.resources : [],
            }
            : null);
        if (!c) return false;
        const readingOk = typeof c.reading === 'string' && c.reading.trim().length > 0;
        const summaryOk = hasValidSummary(c);
        const videosOk = Array.isArray(c.videos) && c.videos.length > 0;
        const quizOk = Array.isArray(c.quiz)
            ? c.quiz.length > 0
            : (c.quiz && Array.isArray(c.quiz?.questions) && c.quiz.questions.length > 0);
        const resourcesOk = Array.isArray(c.resources) && c.resources.length > 0;
        return readingOk && summaryOk && videosOk && quizOk && resourcesOk;
    };

    let completeCount = 0;
    for (const t of topicsList) {
        if (isTopicComplete(t)) completeCount += 1;
    }
    return completeCount;
};

/**
 * Handle closing of batch generation status notification
 */
export const createBatchStatusHandler = (dependencies) => {
    const { setBatchGenerationProgress, setBatchGenerationStatus } = dependencies;

    const handleCloseBatchStatus = () => {
        setBatchGenerationProgress(0);
        setBatchGenerationStatus('');
    };

    return { handleCloseBatchStatus };
};
