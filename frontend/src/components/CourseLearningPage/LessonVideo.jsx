import React, { useEffect, useState, useCallback } from 'react';

const LessonVideo = ({ videoUrl, title }) => {  // YouTube API key from environment variable 
  const YOUTUBE_API_KEY = 'AIzaSyB5RYfafKGA0xlqNb8Q28iygXZUTnEynFo'; // Direct assignment for testing
  
  // Log API key for debugging
  useEffect(() => {
    console.log('Using YouTube API Key:', YOUTUBE_API_KEY);
    console.log('Environment variable value:', import.meta.env.VITE_YOUTUBE_API_KEY);
  }, []);
  // Function to fetch videos directly when backend fails
  const directFetchVideo = async (searchQuery) => {
    if (!searchQuery) return null;
    
    console.log('Starting direct YouTube fetch for query:', searchQuery);
    console.log('Using API key:', YOUTUBE_API_KEY);
    
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;
    console.log('API URL (censored):', apiUrl.replace(YOUTUBE_API_KEY, 'API_KEY_HIDDEN'));
    
    try {
      const response = await fetch(apiUrl);
      
      console.log('YouTube API response status:', response.status);
      
      if (!response.ok) {
        // Get more detailed error information
        const errorText = await response.text();
        console.error('YouTube API error details:', errorText);
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('YouTube API response data:', data);
      
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        console.log('Successfully found video ID:', videoId);
        return {
          video_id: videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}`
        };
      }
      console.warn('No videos found in API response');
      return null;
    } catch (error) {
      console.error('Error fetching from YouTube API directly:', error);
      return null;
    }
  };  const [videoSrc, setVideoSrc] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDirectly, setIsFetchingDirectly] = useState(false);
  const [directFetchAttempted, setDirectFetchAttempted] = useState(false);
  const [forceLiveDemo, setForceLiveDemo] = useState(false);
  
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
  };
  // Add iframe load/error handlers
  const handleIframeLoad = useCallback(() => {
    console.log('Video iframe loaded successfully:', videoSrc);
    setIsLoading(false);
  }, [videoSrc]);
  
  const handleIframeError = useCallback(() => {
    console.error('Video iframe failed to load:', videoSrc);
    setError(true);
    setIsLoading(false);
  }, [videoSrc]);

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
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-50 flex-col p-4">
          {isFetchingDirectly ? (
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
            <>
              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-center text-gray-700 font-medium mb-2">Video not available</p>              <p className="text-center text-gray-500 text-sm mb-4">The lesson video couldn't be loaded. This may be due to API quota limitations.</p>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center">                <button 
                  onClick={openYouTubeSearch}
                  className="px-4 py-2 mb-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    console.log('Testing YouTube API connectivity with test query');
                    const testResult = await fetch(
                      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`
                    );
                    
                    const status = testResult.status;
                    console.log('YouTube API test status:', status);
                    
                    let message = '';
                    try {
                      const data = await testResult.json();
                      message = `API Status: ${status}. Found ${data.items?.length || 0} videos.`;
                      console.log('API test response:', data);
                    } catch (e) {
                      const text = await testResult.text();
                      message = `API Status: ${status}. Error: ${text.substring(0, 100)}`;
                    }
                    
                    alert(`YouTube API Test: ${message}`);
                  }}
                  className="px-4 py-2 mt-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Test YouTube API Connectivity
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
