/**
* Factory function to create the initializeCourseData function with dependencies
* @param {Object} dependencies - Required dependencies for course initialization
* @returns {Function} The initializeCourseData async function
*/
export const createInitializeCourseData = (dependencies) => {
    const {
        getCourseId,
        topicParam,
        courseTitle,
        setTopicsList,
        setSelectedTopic,
        setAvailableTabsForTopics,
        proContentManager,
        getCurrentTopicFromParam,
        navigate,
        setActiveTab,
        loadScenario,
        loadContentForReloadMode,
        loadTopicContent,
        parseTopicsFromParam,
        detectLoadScenario,
        setLoadScenario,
        handleReloadScenario,
        fetchCourseFromDB
    } = dependencies;

    const initializeCourseData = async () => {
        const currentCourseId = getCourseId();

        if (!currentCourseId) {
            return;
        }

        // Helper function to handle URL-based topic selection
        const handleTopicSelection = (topics) => {
            if (!topics || topics.length === 0) return;

            let matchingTopicIndex = -1;

            if (topicParam) {
                // Use robust parser; pick the first parsed topic for selection
                const parsedFromParam = parseTopicsFromParam(topicParam);
                const actualTopic = parsedFromParam.length > 0 ? parsedFromParam[0] : topicParam;

                // Strategy 1: Exact match (case insensitive)
                matchingTopicIndex = topics.findIndex(topic =>
                    topic.name.toLowerCase().trim() === actualTopic.toLowerCase().trim()
                );

                // Strategy 2: Partial match
                if (matchingTopicIndex === -1) {
                    matchingTopicIndex = topics.findIndex(topic =>
                        topic.name.toLowerCase().includes(actualTopic.toLowerCase()) ||
                        actualTopic.toLowerCase().includes(topic.name.toLowerCase())
                    );
                }
            }

            // If no match found or no topicParam, use first topic
            if (matchingTopicIndex === -1) {
                matchingTopicIndex = 0;
            }

            const selectedTopicObject = topics[matchingTopicIndex];

            // Update topics with active state
            const updatedTopics = topics.map((topic, index) => ({
                ...topic,
                isActive: index === matchingTopicIndex
            }));

            // Update the topics list with active state
            setTopicsList(updatedTopics);
            setSelectedTopic(selectedTopicObject);

            // CRITICAL: Populate available tabs for all topics that have content
            const populateAvailableTabsForAllTopics = async () => {
                const currentCourseId = getCourseId();
                if (!currentCourseId) return;

                const tabsMap = {};
                for (const topic of updatedTopics) {
                    try {
                        const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, topic.name);
                        if (storedContent) {
                            const availableTabs = [];
                            if (storedContent.reading) availableTabs.push('reading');
                            if (storedContent.summary) availableTabs.push('summary');
                            if (storedContent.videos?.length > 0) availableTabs.push('videos');
                            if (storedContent.quiz?.length > 0 || (storedContent.quiz?.questions?.length > 0)) availableTabs.push('quiz');
                            // Consider resources generation complete if metadata.generatedAt exists (even with 0 results)
                            if ((storedContent.resources?.length > 0) || (storedContent.resourcesMetadata?.generatedAt)) availableTabs.push('resources');

                            if (availableTabs.length > 0) {
                                tabsMap[topic.name] = availableTabs;
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to check content for topic: ${topic.name}`, error);
                    }
                }

                if (Object.keys(tabsMap).length > 0) {
                    setAvailableTabsForTopics(prev => ({
                        ...prev,
                        ...tabsMap
                    }));
                    console.log('🎯 Populated available tabs for topics:', Object.keys(tabsMap));
                }
            };

            // Run tab population asynchronously
            populateAvailableTabsForAllTopics();

            // Update URL if needed
            const selectedTopicName = selectedTopicObject.name;
            const currentTopicParam = getCurrentTopicFromParam(topicParam);

            if (selectedTopicName !== currentTopicParam) {
                const newSearchParams = new URLSearchParams(window.location.search);
                newSearchParams.set("topic", selectedTopicName);
                navigate(`/learning-path/${currentCourseId}?${newSearchParams.toString()}`, { replace: true });
            }

            // Handle tab parameter from URL
            const currentTabParam = new URLSearchParams(window.location.search).get("tab");
            if (currentTabParam) {
                setActiveTab(currentTabParam);
            }

            // Auto-load content for the selected topic
            setTimeout(() => {
                if (loadScenario === 'reload') {
                    // RELOAD MODE: Simple content loading without generation
                    loadContentForReloadMode(selectedTopicName);
                } else {
                    // FIRST-TIME MODE: Full generation logic
                    loadTopicContent(selectedTopicName);
                }
            }, 100);
        };

        // Ensure ProContentManager cache is hydrated from backend/local storage before any synchronous getters
        try {
            await proContentManager.initializeCourse(currentCourseId);
            // Cache initialized; synchronous getters will now return data reliably
        } catch (e) {
            // If initialization fails, continue with other fallbacks below
        }

        // CRITICAL: Detect if this is first-time generation or subsequent reload
        const detectedScenario = await detectLoadScenario(currentCourseId);
        setLoadScenario(detectedScenario);
        console.log('🔍 Load scenario detected:', detectedScenario);

        if (detectedScenario === 'reload') {
            // RELOAD SCENARIO: Content already exists, load quickly
            const reloadSuccess = await handleReloadScenario(currentCourseId, handleTopicSelection);
            if (reloadSuccess) {
                return; // Successfully handled as reload
            }
            // If reload failed, fall through to first-time generation logic
            console.log('🔄 Reload scenario failed, falling back to generation logic');
        }

        // FIRST-TIME SCENARIO: Continue with existing generation logic
        console.log('🚀 First-time generation scenario - proceeding with generation flow');

        // Step 1: Check localStorage for course data
        const storedTopics = await proContentManager.getStoredTopics(currentCourseId);
        console.log('🔍 Step 1 - Stored topics check:', {
            courseId: currentCourseId,
            topicsFound: storedTopics.length,
            topics: storedTopics.map(t => t.name)
        });

        if (storedTopics.length > 0) {
            handleTopicSelection(storedTopics);
            return;
        }

        // Step 2: Check batch generation data (localStorage only; legacy payload)
        let foundFromBatch = false;
        try {
            let payload = null;
            if (typeof localStorage !== 'undefined') {
                const legacy = localStorage.getItem('proLearning_batchGeneration');
                if (legacy) {
                    try { payload = JSON.parse(legacy); } catch { }
                }
            }
            if (payload && payload.courseId === currentCourseId && Array.isArray(payload.topics) && payload.topics.length > 0) {
                console.log('🔍 Step 2 - Batch generation data found (localStorage):', {
                    courseId: currentCourseId,
                    topicsFound: payload.topics.length,
                    topics: payload.topics.map(t => t.name || t)
                });

                // Use handleTopicSelection for batch topics too
                handleTopicSelection(payload.topics);
                // Persist topics immediately so refresh shows them in sidebar
                try {
                    const normalized = payload.topics.map((t, i) => ({ id: (t.id || i + 1), name: t.name || t }));
                    proContentManager.setCourse(courseTitle || 'Generated Course', currentCourseId);
                    await proContentManager.storeTopics(normalized, currentCourseId);
                    console.log('✅ Batch topics stored successfully');
                } catch (e) {
                    console.error('❌ Failed to store batch topics:', e);
                }
                foundFromBatch = true;
                return;
            }
        } catch (error) {
            // ignore and continue
        }

        // Step 3: Try to fetch from database
        const databaseCourse = await fetchCourseFromDB(currentCourseId);

        console.log('🗄️ Database course fetch result:', {
            courseId: currentCourseId,
            found: !!databaseCourse,
            topics: databaseCourse?.topics?.length || 0,
            courseName: databaseCourse?.course_name
        });

        if (databaseCourse) {
            // Transform database course data to the format expected by the UI
            if (databaseCourse.topics && databaseCourse.topics.length > 0) {
                console.log('🔍 Step 3 - Database topics found:', {
                    courseId: currentCourseId,
                    topicsFound: databaseCourse.topics.length,
                    topics: databaseCourse.topics.map(t => t.topic_name)
                });
                // Find the index of the first topic that matches URL parameter
                let activeTopicIndex = -1;
                if (topicParam) {
                    activeTopicIndex = databaseCourse.topics.findIndex(topic =>
                        topic.topic_name.toLowerCase().trim() === topicParam.toLowerCase().trim()
                    );
                }

                // If no match found and we have topics, use first topic
                if (activeTopicIndex === -1 && databaseCourse.topics.length > 0) {
                    activeTopicIndex = 0;
                }

                const transformedTopics = databaseCourse.topics.map((topic, index) => ({
                    id: index + 1,
                    name: topic.topic_name,
                    dbTopic: topic, // Keep reference to original database topic
                    isActive: index === activeTopicIndex // Only ONE topic is active
                }));

                console.log('🔄 Transformed database topics:', {
                    activeTopicIndex,
                    topicParam,
                    topics: transformedTopics.map(t => ({ name: t.name, isActive: t.isActive }))
                });

                // CRITICAL FIX: Differentiate between three cases:
                // 1. Fresh generation: course_TIMESTAMP_ID (e.g., course_1760070219554_jd70zm6tc)
                // 2. LocalStorage reload: Same course_TIMESTAMP_ID, reload page
                // 3. Database reload: UUID format (e.g., 7fce76ea-85c4-44c9-bcf9-77197b8d2ad2)

                // Check if courseId is a UUID (database reload) or timestamp-based (fresh/localStorage)
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentCourseId);
                const isTimestampBased = currentCourseId.startsWith('course_');

                console.log('🔍 Course ID analysis:', {
                    courseId: currentCourseId,
                    isUUID,
                    isTimestampBased,
                    hasBatchMarker: !!(typeof localStorage !== 'undefined' && localStorage.getItem('proLearning_batchMarker'))
                });

                if (isUUID) {
                    // Case 3: Database reload with UUID - completed course from database
                    console.log('✅ Database reload (UUID) - loading completed course from database');
                    setLoadScenario('reload');
                    try {
                        // Set course context explicitly with DB title to avoid any fallback generation flows
                        const title = databaseCourse.title || databaseCourse.course_name || courseTitle || 'Saved Course';
                        proContentManager.setCourse(title, currentCourseId);
                    } catch { }
                } else if (isTimestampBased) {
                    // Case 1 or 2: Fresh generation or localStorage reload with course_TIMESTAMP_ID
                    // Check if there's an active batch marker indicating ongoing generation
                    const hasBatchMarker = typeof localStorage !== 'undefined' ? localStorage.getItem('proLearning_batchMarker') : null;

                    if (hasBatchMarker) {
                        // Case 1: Fresh generation in progress
                        console.log('🆕 Fresh generation (course_TIMESTAMP) - progressive generation mode');
                        setLoadScenario('first-time');
                    } else {
                        // Case 2: LocalStorage reload - page refreshed during or after generation
                        console.log('💾 LocalStorage reload (course_TIMESTAMP) - using cached content');
                        setLoadScenario('reload');
                    }
                } else {
                    // Fallback: treat as reload
                    console.log('⚠️ Unknown course ID format - defaulting to reload mode');
                    setLoadScenario('reload');
                }

                handleTopicSelection(transformedTopics);
                // Persist DB topics so they’re available on refresh
                try {
                    const normalized = transformedTopics.map(t => ({ id: t.id, name: t.name }));
                    proContentManager.setCourse(databaseCourse.course_name || courseTitle || 'Database Course', currentCourseId);
                    await proContentManager.storeTopics(normalized, currentCourseId);
                    console.log('✅ Database topics stored successfully');
                } catch (e) {
                    console.error('❌ Failed to store database topics:', e);
                }          // CRITICAL: Set course context in ProContentManager for database-loaded courses
                proContentManager.setCourse(databaseCourse.course_name, currentCourseId);

                return;
            }
        }

        // Step 3.5: If no stored/batch/db topics, but URL has topic(s), derive topics from URL
        // IMPORTANT: Handle both multiple topics (||| delimiter) and single-topic URLs
        // Only split by comma if ||| delimiter is present, otherwise treat as single topic
        if (topicParam && topicParam.includes('|||')) {
            try {
                const topicNames = parseTopicsFromParam(topicParam);
                if (topicNames.length > 1) { // Only if multiple topics in URL
                    const derivedTopics = topicNames.map((name, idx) => ({
                        id: idx + 1,
                        name,
                        isActive: false // Will be set by handleTopicSelection
                    }));

                    // Use handleTopicSelection for URL-derived topics
                    handleTopicSelection(derivedTopics);

                    // Persist immediately so sidebar/progress work and refresh is safe
                    try {
                        proContentManager.setCourse(courseTitle || 'Generated Course', currentCourseId);
                        await proContentManager.storeTopics(derivedTopics, currentCourseId);
                    } catch (e) {
                    }
                    return; // We’ve initialized topics from URL; stop here
                }
            } catch (e) {
            }
        }
        // Single-topic URL: still initialize topics list so sidebar shows the current topic
        else if (topicParam) {
            try {
                const parsed = parseTopicsFromParam(topicParam);
                const actualTopic = (parsed[0] || '').trim();
                if (actualTopic) {
                    const derivedTopics = [{ id: 1, name: actualTopic, isActive: false }];

                    // Use handleTopicSelection to set active topic and sync URL/tab
                    handleTopicSelection(derivedTopics);

                    // Persist immediately so refresh shows topic in sidebar and progress isn’t 0/0
                    try {
                        proContentManager.setCourse(courseTitle || 'Generated Course', currentCourseId);
                        await proContentManager.storeTopics(derivedTopics, currentCourseId);
                    } catch (e) {
                    }
                    return; // Initialized from single-topic URL
                }
            } catch (e) {
            }
        }

        // Step 4: Fallback - if nothing is available, treat as invalid URL and redirect to NotFound
        const hasBatchMarker = typeof localStorage !== 'undefined' ? localStorage.getItem('proLearning_batchMarker') : null;
        if (!courseTitle && !topicParam && !hasBatchMarker && !foundFromBatch) {
            console.warn('⚠️ No course context found (no title, topics, batch, or DB). Redirecting to 404.');
            navigate('/not-found', { replace: true });
            return;
        } else {
            // Could show error message to user here
        }
    };

    return initializeCourseData;
};




