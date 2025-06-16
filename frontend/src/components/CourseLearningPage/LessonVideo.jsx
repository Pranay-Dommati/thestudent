import React, { useEffect, useState, useCallback } from 'react';

// YouTube error codes and messages for better user feedback
const YOUTUBE_ERROR_CODES = {
  2: "Invalid parameter",
  5: "HTML5 player error", 
  100: "Video not found",
  101: "Video embedding not allowed",
  150: "Video embedding not allowed",
};

// Function to find alternative videos when main video fails
const findAlternativeVideo = async (searchQuery, apiKey) => {
  if (!searchQuery) return null;
  
  try {
    console.log('Searching for alternative video with query:', searchQuery);
      // Use working key from previous successful API call if available
    const keysToTry = window.WORKING_YOUTUBE_API_KEY ? 
      [window.WORKING_YOUTUBE_API_KEY] : 
      [
        'AIzaSyBLn33rjtp5aRamO-hO6-yEWKcgxuvjepI',    // New primary key 
        import.meta.env.VITE_YOUTUBE_API_KEY || '',    // From environment (which is also updated)
        'AIzaSyB5RYfafKGA0xlqNb8Q28iygXZUTnEynFo',    // Previous direct key (now backup)
        'AIzaSyCYQ5brJYPAdmIBwbLMj3fX988h190dhQA',    // Previous key from old .env
        'AIzaSyBK8JXhEc4HLz5_Mbv0ta0JnriW1YSSqNY'     // From settings.py (now updated)
      ].filter(key => key && key.length > 10);
    
    console.log(`Alternative search: trying ${keysToTry.length} YouTube API keys`);
    
    // Try each API key until one works
    for (let i = 0; i < keysToTry.length; i++) {
      const currentKey = keysToTry[i];
      try {
        console.log(`Alternative search: trying key #${i+1}`);
        
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=3&key=${currentKey}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.error(`Alternative search: key #${i+1} failed with status ${response.status}`);
          if (i < keysToTry.length - 1) continue; // Try next key
          throw new Error(`YouTube API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Alternative video search results:', data);
        
        // Save working key for future use
        window.WORKING_YOUTUBE_API_KEY = currentKey;
        
        // Filter out any videos that might cause embedding issues
        const safeVideos = (data.items || []).filter(item => {
          // Skip videos with "private" or "age restricted" in title/description
          const title = item.snippet?.title?.toLowerCase() || '';
          const description = item.snippet?.description?.toLowerCase() || '';
          const channelTitle = item.snippet?.channelTitle?.toLowerCase() || '';
          
          const problematicTerms = ['private video', 'age restricted', 'unavailable', 'deleted', 'removed'];
          return !problematicTerms.some(term => 
            title.includes(term) || description.includes(term) || channelTitle.includes(term)
          );
        });
        
        if (safeVideos.length > 0) {
          const videoId = safeVideos[0].id.videoId;
          return {
            video_id: videoId,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            title: safeVideos[0].snippet.title,
            channelTitle: safeVideos[0].snippet.channelTitle,
            isAlternative: true
          };
        }
        
        // If we got here with a successful API call but no videos, continue to next key
      } catch (error) {
        console.error(`Error with alternative search API key #${i+1}:`, error);
        // Continue to next key
      }
    }
    
    console.warn('All API keys failed to find alternative videos');
    return null;
  } catch (error) {
    console.error('Error finding alternative video:', error);
    return null;
  }
};

// Generate text content as a last resort when videos fail
const generateFallbackContent = (topic) => {
  if (!topic) return null;
  
  const topicLower = topic.toLowerCase();
  
  // Determine topic category for better content suggestions
  let category = 'general';
  if (topicLower.includes('python') || topicLower.includes('javascript') || topicLower.includes('java') || 
      topicLower.includes('programming') || topicLower.includes('code')) {
    category = 'programming';
  } else if (topicLower.includes('math') || topicLower.includes('statistics')) {
    category = 'math';
  } else if (topicLower.includes('history') || topicLower.includes('geography')) {
    category = 'history';
  }
  
  const contentSuggestions = {
    programming: [
      "Try searching for online documentation for this topic",
      "Look for interactive code tutorials on sites like Codecademy or freeCodeCamp",
      "Check GitHub repositories with example code",
      "Find related coding exercises on LeetCode or HackerRank"
    ],
    math: [
      "Look for interactive math tutorials on Khan Academy",
      "Search for visual explanations on 3Blue1Brown",
      "Find practice problems on Brilliant.org",
      "Check for online math textbooks covering this topic"
    ],
    history: [
      "Look for documentaries on this historical topic",
      "Check for interactive timelines on sites like ThoughtCo",
      "Find primary sources on archive.org",
      "Search for lectures from university open courseware"
    ],
    general: [
      "Search for articles on this topic",
      "Look for online courses on platforms like Coursera or edX",
      "Check for explanatory guides on sites like wikiHow",
      "Find related discussions on Reddit or Quora"
    ]
  };
  
  // Select 3 random suggestions from the appropriate category
  const suggestions = contentSuggestions[category]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  
  return {
    title: `Learning Resources for: ${topic}`,
    suggestions: suggestions,
    searchQuery: topic
  };
};

const LessonVideo = ({ videoUrl, title }) => {  // PRIMARY_API_KEY should be the one you want to use as the primary choice
  const PRIMARY_API_KEY = 'AIzaSyBLn33rjtp5aRamO-hO6-yEWKcgxuvjepI'; // Primary key updated
  
  // YouTube API key selection order:
  // 1. Use the PRIMARY_API_KEY first (provided directly above)
  // 2. Fall back to any previously working key from localStorage
  // 3. Try any environment variable key as a last resort
  const YOUTUBE_API_KEY = PRIMARY_API_KEY || window.WORKING_YOUTUBE_API_KEY || import.meta.env.VITE_YOUTUBE_API_KEY;
  
  // Initialize window.WORKING_YOUTUBE_API_KEY and test the primary key
  useEffect(() => {
    // Set the primary key as the working key initially
    window.WORKING_YOUTUBE_API_KEY = PRIMARY_API_KEY;
    
    // Test the primary key immediately to verify it works
    const testPrimaryKey = async () => {
      try {
        console.log('Testing PRIMARY_API_KEY validity');
        const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${PRIMARY_API_KEY}`;
        const response = await fetch(testUrl);
        
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            console.log('PRIMARY_API_KEY is valid and working correctly');
            window.WORKING_YOUTUBE_API_KEY = PRIMARY_API_KEY;
            localStorage.setItem('WORKING_YOUTUBE_API_KEY', PRIMARY_API_KEY);
          } else {
            console.warn('PRIMARY_API_KEY response has no items');
          }
        } else {
          console.warn(`PRIMARY_API_KEY test failed with status: ${response.status}`);
          
          // If primary key fails, try to load from localStorage
          const savedKey = localStorage.getItem('WORKING_YOUTUBE_API_KEY');
          if (savedKey && savedKey !== PRIMARY_API_KEY) {
            console.log('Falling back to saved working key from localStorage');
            window.WORKING_YOUTUBE_API_KEY = savedKey;
          }
        }
      } catch (error) {
        console.error('Error testing PRIMARY_API_KEY:', error);
      }
    };
    
    testPrimaryKey();
    
    // Setup listener for updates to working key
    const saveWorkingKey = () => {
      if (window.WORKING_YOUTUBE_API_KEY) {
        localStorage.setItem('WORKING_YOUTUBE_API_KEY', window.WORKING_YOUTUBE_API_KEY);
        console.log('Saved working YouTube API key to localStorage');
      }
    };
    
    window.addEventListener('beforeunload', saveWorkingKey);
    
    return () => {
      window.removeEventListener('beforeunload', saveWorkingKey);      saveWorkingKey(); 
    };
  }, []);
  
  // Function to fetch videos directly when backend fails
  const directFetchVideo = async (searchQuery) => {
    if (!searchQuery) return null;
    
    console.log('Starting direct YouTube fetch for query:', searchQuery);
    
    // Updated API key list with new primary key first
    const apiKeysToTry = [
      'AIzaSyBLn33rjtp5aRamO-hO6-yEWKcgxuvjepI',               // New primary key
      import.meta.env.VITE_YOUTUBE_API_KEY || '',               // From environment (which is also updated)
      'AIzaSyB5RYfafKGA0xlqNb8Q28iygXZUTnEynFo',               // Previous direct key (now backup)
      'AIzaSyCYQ5brJYPAdmIBwbLMj3fX988h190dhQA',               // Previous key from old .env
      'AIzaSyBK8JXhEc4HLz5_Mbv0ta0JnriW1YSSqNY'                // From settings.py (now updated)
    ].filter(key => key && key.length > 10); // Filter out empty keys
    
    console.log(`Trying ${apiKeysToTry.length} different API keys`);
    
    // Try each API key until one works
    for (let i = 0; i < apiKeysToTry.length; i++) {
      const currentKey = apiKeysToTry[i];
      console.log(`Attempting with API key #${i+1}`);
      
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${currentKey}`;
      
      try {
        console.log(`Making YouTube API request with key #${i+1}`);
        const response = await fetch(apiUrl);
        
        console.log(`YouTube API response status with key #${i+1}:`, response.status);
        
        if (!response.ok) {
          // Parse error response
          let errorInfo;
          try {
            errorInfo = await response.json();
            console.error(`YouTube API error details with key #${i+1}:`, errorInfo);
          } catch (e) {
            const errorText = await response.text();
            console.error(`YouTube API error text with key #${i+1}:`, errorText);
          }
          
          if (i < apiKeysToTry.length - 1) {
            console.log(`Key #${i+1} failed with ${response.status}, trying next key`);
            continue; // Try next key
          } else {
            throw new Error(`All YouTube API keys failed, last status: ${response.status}`);
          }
        }
        
        const data = await response.json();
        console.log(`YouTube API response data with key #${i+1}:`, data);
        
        if (data.items && data.items.length > 0) {
          const videoId = data.items[0].id.videoId;
          console.log('Successfully found video ID:', videoId);
          // Update the working key for future use
          window.WORKING_YOUTUBE_API_KEY = currentKey;
          return {
            video_id: videoId,
            embedUrl: `https://www.youtube.com/embed/${videoId}`
          };
        } else {
          console.warn(`No videos found in API response with key #${i+1}`);
          // Key worked but no videos found, so save it as working
          window.WORKING_YOUTUBE_API_KEY = currentKey;
        }
      } catch (error) {
        console.error(`Error with API key #${i+1}:`, error);
        // Continue to next key
      }
    }
      console.error('All API keys failed to retrieve videos');
    return null;
  };
  
  const [videoSrc, setVideoSrc] = useState('');
  const [error, setError] = useState(false);
  const [errorCode, setErrorCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDirectly, setIsFetchingDirectly] = useState(false);
  const [directFetchAttempted, setDirectFetchAttempted] = useState(false);
  const [forceLiveDemo, setForceLiveDemo] = useState(false);
  const [alternativeVideo, setAlternativeVideo] = useState(null);
  const [isSearchingAlternative, setIsSearchingAlternative] = useState(false);
  const [fallbackContent, setFallbackContent] = useState(null);
  
  // Helper: convert plain YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // If already an embed URL
    if (url.includes('youtube.com/embed/')) return url;
    
    // Log what we're trying to parse
    console.log('Trying to parse YouTube URL:', url);
    
    // Handle direct video_id
    if (typeof url === 'string' && url.length === 11 && /^[\w-]{11}$/.test(url)) {
      console.log('Detected direct video ID');
      return `https://www.youtube.com/embed/${url}`;
    }
    
    // If it's a watch?v= URL
    const match = typeof url === 'string' ? 
      url.match(/(?:youtube\.com\/(?:watch\?v=|v\/|embed\/)|youtu\.be\/)([\w-]{11})/) : null;
    if (match && match[1]) {
      console.log('Extracted video ID:', match[1]);
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    return '';
  };

  // Extract src from iframe string if present
  const extractSrc = (iframeString) => {
    if (typeof iframeString !== 'string') return '';
    const srcMatch = iframeString.match(/src="([^"]+)"/);
    return srcMatch ? srcMatch[1] : '';
  };  useEffect(() => {
    console.log('LessonVideo received videoUrl:', videoUrl);
    // Reset states when videoUrl changes
    setError(false);
    setIsLoading(true);
    setVideoSrc('');
    setDirectFetchAttempted(false);
    setIsFetchingDirectly(false);try {
      // If there's no video URL at all
      if (!videoUrl) {
        console.log('No video URL provided');
        setError(true);
        return;
      }
      
      console.log('Analyzing video data:', { 
        type: typeof videoUrl, 
        isFallback: videoUrl && videoUrl.isFallback,
        hasVideoId: videoUrl && (videoUrl.video_id || /^[\w-]{11}$/.test(videoUrl))
      });
      
      // Handle fallback videos (created when YouTube API quota is exceeded)
      if (typeof videoUrl === 'object' && videoUrl !== null && videoUrl.isFallback) {
        console.log('Handling fallback video data:', videoUrl);
        // Open in a new tab if we have a search URL
        if (videoUrl.url && videoUrl.url.includes('youtube.com/results')) {
          console.log('This is a search fallback, using a placeholder with link');
          setVideoSrc(''); // Empty source will trigger our fallback UI
          return;
        }
      }
      
      // If input is an iframe string
      if (typeof videoUrl === 'string' && videoUrl.includes('<iframe')) {
        setVideoSrc(extractSrc(videoUrl));
        return;
      } 
        // Handle force live demo mode
      if (forceLiveDemo) {
        console.log('FORCE LIVE DEMO MODE - Trying direct YouTube fetch');
        setVideoSrc(''); // Clear any existing video
        return;
      }
      
      // If video_id is directly passed as a string (this is the case with your data)
      if (typeof videoUrl === 'string' && videoUrl.length > 0) {
        // If it appears to be a YouTube video ID (11 chars, alphanumeric with dashes/underscores)
        if (/^[\w-]{11}$/.test(videoUrl)) {
          console.log('Using direct YouTube video ID:', videoUrl);
          const embedUrl = `https://www.youtube.com/embed/${videoUrl}`;
          console.log('Setting embed URL:', embedUrl);
          setVideoSrc(embedUrl);
          return;
        }
        
        // If it starts with "fallback_" (from fallback video generation)
        if (videoUrl.startsWith('fallback_')) {
          console.log('Detected fallback video ID, showing placeholder');
          setVideoSrc(''); // Empty source will trigger our fallback UI
          return;
        }
        
        // Otherwise try to extract from a URL
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        if (embedUrl) {
          console.log('Extracted embed URL from string:', embedUrl);
          setVideoSrc(embedUrl);
          return;
        }
        
        // Add an alternative approach for problematic IDs
        if (videoUrl.length >= 11) {
          // Try to extract an 11-character ID from the string
          const possibleId = videoUrl.substring(0, 11);
          if (/^[\w-]{11}$/.test(possibleId)) {
            console.log('Extracted possible video ID from string:', possibleId);
            setVideoSrc(`https://www.youtube.com/embed/${possibleId}`);
            return;
          }
        }
      }
      
      // If videoUrl is an object with video_id property (different format)
      if (typeof videoUrl === 'object' && videoUrl !== null) {
        if (videoUrl.video_id) {
          // Handle fallback video IDs
          if (typeof videoUrl.video_id === 'string' && videoUrl.video_id.startsWith('fallback_')) {
            console.log('Detected fallback video_id in object, showing placeholder');
            setVideoSrc(''); // Empty source will trigger our fallback UI
            return;
          }
          
          console.log('Using video_id from object:', videoUrl.video_id);
          setVideoSrc(`https://www.youtube.com/embed/${videoUrl.video_id}`);
          return;
        } else if (videoUrl.embedUrl) {
          console.log('Using embedUrl from object:', videoUrl.embedUrl);
          setVideoSrc(videoUrl.embedUrl);
          return;
        } else if (videoUrl.url) {
          // Try to extract YouTube ID from URL
          const embedUrl = getYouTubeEmbedUrl(videoUrl.url);
          if (embedUrl) {
            setVideoSrc(embedUrl);
            return;
          }
        }
      }      // If we got here, we couldn't find a valid video source
      console.warn('Could not determine video source from:', videoUrl);
      
      // Skip automatic fetch to avoid quota issues - let user trigger it manually
      setError(true);
      
      /*
      // This automatic fetch is disabled to avoid unexpected quota usage
      // Only attempt direct fetch if we haven't tried already and we have a title
      if (!directFetchAttempted && title) {
        setIsFetchingDirectly(true);
        setError(false);
        
        // Use the title as a search query to try fetching directly from YouTube API
        console.log('Attempting direct fetch for:', title);
        directFetchVideo(title + ' tutorial')
          .then(result => {
            setDirectFetchAttempted(true);
            setIsFetchingDirectly(false);
            if (result && result.embedUrl) {
              console.log('Direct fetch successful, got video:', result);
              setVideoSrc(result.embedUrl);
            } else {
              console.log('Direct fetch returned no results');
              setError(true);
            }
          })
          .catch(err => {
            console.error('Direct fetch failed:', err);
            setDirectFetchAttempted(true);
            setIsFetchingDirectly(false);
            setError(true);
          });
      } else {
        setError(true);
      }
      */
    } catch (err) {
      console.error('Error processing video URL:', err);
      setError(true);
    }
  }, [videoUrl, title, directFetchAttempted]);  // Function to determine if it's a fallback from a YouTube search query
  const isFallbackSearch = typeof videoUrl === 'object' && videoUrl && videoUrl.url && 
    videoUrl.url.includes('youtube.com/results');
  
  const openYouTubeSearch = () => {
    if (isFallbackSearch && videoUrl.url) {
      window.open(videoUrl.url, '_blank');
    } else {
      // Fallback to searching by title
      const searchQuery = encodeURIComponent((title || 'Python tutorial') + ' tutorial');
      window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
    }
  };  // Add iframe load/error handlers
  const handleIframeLoad = useCallback(() => {
    console.log('Video iframe loaded successfully:', videoSrc);
    setIsLoading(false);
    
    // Reset error states on successful load
    setError(false);
    setErrorCode(null);
  }, [videoSrc]);
  
  const handleIframeError = useCallback(() => {
    console.error('Video iframe failed to load:', videoSrc);
    setError(true);
    setIsLoading(false);
  }, [videoSrc]);
  
  // YouTube iframe API event listeners
  useEffect(() => {
    if (!videoSrc) return;
    
    // Create YouTube iframe API event listener
    window.onYouTubeIframeAPIError = (event) => {
      console.error('YouTube iframe API error:', event);
      setError(true);
    };
    
    // Function to handle YouTube player errors
    window.onYouTubePlayerError = (errorEvent) => {
      const errorCode = errorEvent?.data;
      console.error(`YouTube player error ${errorCode}: ${YOUTUBE_ERROR_CODES[errorCode] || 'Unknown error'}`);
      
      setErrorCode(errorCode);
      setError(true);
      setIsLoading(false);
      
      // If this is a known embedding restriction error, try to find an alternative immediately
      if (errorCode === 101 || errorCode === 150) {
        searchForAlternativeVideo();
      }
    };
    
    return () => {
      // Clean up listeners
      window.onYouTubeIframeAPIError = null;
      window.onYouTubePlayerError = null;
    };
  }, [videoSrc]);
  // Function to search for alternative videos
  const searchForAlternativeVideo = useCallback(async () => {
    if (!title || isSearchingAlternative) return;
    
    setIsSearchingAlternative(true);
    console.log('Searching for alternative video for:', title);
    
    // Try multiple search queries for better results
    const searchQueries = [
      `${title} tutorial`,
      `learn ${title}`,
      `${title} explained`,
      `${title} for beginners`
    ];
    
    // Try each search query until we find a good video
    for (const query of searchQueries) {
      // We don't need to pass API key anymore since findAlternativeVideo handles multiple keys
      const result = await findAlternativeVideo(query);
      if (result) {
        console.log('Found alternative video:', result);
        setAlternativeVideo(result);
        setIsSearchingAlternative(false);
        return;
      }
    }
    
    // If no alternative video is found, generate fallback content
    console.log('No alternative videos found, generating fallback content');
    setFallbackContent(generateFallbackContent(title));
    setIsSearchingAlternative(false);
  }, [title]);
  
  // Render functions for different states to keep the main render cleaner
  const renderAlternativeVideo = () => (
    <div className="flex flex-col items-center">
      <div className="bg-amber-100 rounded-lg p-4 mb-4 w-full">
        <p className="text-amber-800 text-sm font-medium">The original video couldn't be played, but we found an alternative:</p>
        <p className="text-gray-700 font-medium mt-2">{alternativeVideo.title}</p>
        <p className="text-gray-500 text-xs">{alternativeVideo.channelTitle}</p>
      </div>
      
      <div className="w-full flex justify-center mb-4">
        <button 
          onClick={() => {
            // Use the alternative video
            setVideoSrc(alternativeVideo.embedUrl);
            setError(false);
            setIsLoading(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Watch Alternative Video
        </button>
      </div>
      
      <button 
        onClick={openYouTubeSearch}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Search on YouTube Instead
      </button>
    </div>
  );
  
  const renderFallbackContent = () => (
    <div className="flex flex-col items-center">
      <div className="bg-blue-100 rounded-lg p-4 mb-4 w-full">
        <p className="text-blue-800 text-sm font-medium">{fallbackContent.title}</p>
        <ul className="mt-2 space-y-2">
          {fallbackContent.suggestions.map((suggestion, index) => (
            <li key={index} className="text-gray-700 text-sm">• {suggestion}</li>
          ))}
        </ul>
      </div>
      
      <button 
        onClick={openYouTubeSearch}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Search for "{fallbackContent.searchQuery}" on YouTube
      </button>
    </div>
  );
  
  const renderSearchingState = () => (
    <div className="flex flex-col items-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="rounded-full h-12 w-12 bg-amber-400 flex items-center justify-center">
          <svg className="h-6 w-6 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-2 text-sm text-gray-500">Finding alternative video...</p>
      </div>
    </div>
  );

  return (
    <div className="relative aspect-video w-full">
      {videoSrc ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="animate-pulse flex flex-col items-center">
                <div className="rounded-full h-12 w-12 bg-blue-400 flex items-center justify-center">
                  <svg className="h-6 w-6 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="mt-2 text-sm text-gray-500">Loading video...</p>
              </div>
            </div>
          )}
          <iframe
            src={videoSrc}
            title={title || 'Lesson Video'}
            className="absolute top-0 left-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
            frameBorder="0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          ></iframe>
        </>      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-50 flex-col p-4">          {isSearchingAlternative ? (
            // Searching for alternative videos
            renderSearchingState()
          ) : alternativeVideo ? (
            // Alternative video found
            renderAlternativeVideo()
          ) : fallbackContent ? (
            // Text-based fallback content
            renderFallbackContent()
          ) : isFetchingDirectly ? (
            // Show loading state during direct fetch
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full h-12 w-12 bg-green-400 flex items-center justify-center">
                <svg className="h-6 w-6 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="mt-2 text-sm text-gray-500">Fetching video directly from YouTube API...</p>
            </div>
          ) : isFallbackSearch ? (
            // Fallback for YouTube search results
            <>
              <div className="text-blue-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-center text-gray-700 font-medium mb-2">{title || "Tutorial Video"}</p>
              <p className="text-center text-gray-600 mb-4">
                Due to API quota limitations, we can't embed the video directly.
              </p>
              <button 
                onClick={openYouTubeSearch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
                Watch on YouTube
              </button>
            </>
          ) : (
            // General error state
            <>              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-center text-gray-700 font-medium mb-2">Video not available</p>
              {errorCode && YOUTUBE_ERROR_CODES[errorCode] ? (
                <p className="text-center text-red-500 text-sm mb-4">
                  Error: {YOUTUBE_ERROR_CODES[errorCode]} (Code: {errorCode})
                </p>
              ) : (
                <p className="text-center text-gray-500 text-sm mb-4">
                  The lesson video couldn't be loaded. This may be due to API quota limitations.
                </p>
              )}
                <div className="flex flex-col gap-3 items-center w-full">
                <button 
                  onClick={searchForAlternativeVideo}
                  className="px-4 py-2 w-full bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Find Alternative Video
                </button>
                
                <button 
                  onClick={openYouTubeSearch}
                  className="px-4 py-2 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search for this lesson on YouTube
                </button>
                
                <button 
                  onClick={() => {
                    console.log('Manual fetch attempt triggered');
                    // Always reset for a fresh attempt
                    setDirectFetchAttempted(false);
                    setError(false);
                    
                    // Trigger direct fetch immediately
                    setIsFetchingDirectly(true);
                    
                    // Use the title as a search query to try fetching directly from YouTube API
                    const searchQuery = title + ' tutorial';
                    console.log('Manual direct fetch attempt for:', searchQuery);
                    
                    directFetchVideo(searchQuery)
                      .then(result => {
                        setDirectFetchAttempted(true);
                        setIsFetchingDirectly(false);
                        if (result && result.embedUrl) {
                          console.log('Manual direct fetch successful, got video:', result);
                          setVideoSrc(result.embedUrl);
                        } else {
                          console.log('Manual direct fetch returned no results');
                          setError(true);
                          alert('Could not find a video for this lesson. The API key may be invalid or quota exceeded.');
                        }
                      })
                      .catch(err => {
                        console.error('Manual direct fetch failed:', err);
                        setDirectFetchAttempted(true);
                        setIsFetchingDirectly(false);
                        setError(true);
                        alert('Error fetching video: ' + err.message);
                      });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Direct YouTube Fetch (Updated API Key)                </button>
                  <button 
                  onClick={async () => {
                    // Direct API test with a reliable test query
                    console.log('Testing YouTube API connectivity with multiple keys');
                      // Try multiple API keys
                    const apiKeysToTry = [
                      'AIzaSyBLn33rjtp5aRamO-hO6-yEWKcgxuvjepI',               // New primary key
                      import.meta.env.VITE_YOUTUBE_API_KEY || '',               // From environment (which is also updated)
                      'AIzaSyB5RYfafKGA0xlqNb8Q28iygXZUTnEynFo',               // Previous direct key (now backup)
                      'AIzaSyCYQ5brJYPAdmIBwbLMj3fX988h190dhQA',               // Previous key from old .env
                      'AIzaSyBK8JXhEc4HLz5_Mbv0ta0JnriW1YSSqNY'                // From settings.py (now updated)
                    ].filter(key => key && key.length > 10);
                    
                    let successfulKey = null;
                    let successData = null;
                    
                    for (let i = 0; i < apiKeysToTry.length; i++) {
                      const currentKey = apiKeysToTry[i];
                      console.log(`Testing API key #${i+1}: ${currentKey.substring(0, 8)}...`);
                      
                      try {
                        const testResult = await fetch(
                          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${currentKey}`
                        );
                        
                        const status = testResult.status;
                        console.log(`YouTube API test status for key #${i+1}:`, status);
                        
                        if (testResult.ok) {
                          const data = await testResult.json();
                          console.log(`API test response for key #${i+1}:`, data);
                          
                          if (data.items && data.items.length > 0) {
                            successfulKey = currentKey;
                            successData = data;
                            window.WORKING_YOUTUBE_API_KEY = currentKey; // Save working key
                            break;  // Exit loop - we found a working key
                          }
                        }
                      } catch (e) {
                        console.error(`Error testing key #${i+1}:`, e);
                      }
                    }
                    
                    // Show results
                    if (successfulKey) {
                      const masked = successfulKey.substring(0, 8) + '...';
                      alert(`YouTube API Test: Success! Found ${successData.items?.length || 0} videos using key ${masked}. This key will be used for future requests.`);
                    } else {
                      alert(`YouTube API Test: Failed. None of the ${apiKeysToTry.length} API keys worked. Check console for detailed errors.`);
                    }
                  }}
                  className="px-4 py-2 mt-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Test YouTube API Keys
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonVideo;
