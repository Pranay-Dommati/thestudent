import React, { useEffect, useState, useCallback } from 'react';
import { callGeminiAPI } from '../Chatbot/ChatbotAPI';
import ReactMarkdown from 'react-markdown';

// YouTube error codes and messages for better user feedback
const YOUTUBE_ERROR_CODES = {
  2: "Invalid parameter",
  5: "HTML5 player error", 
  100: "Video not found",
  101: "Video embedding not allowed",
  150: "Video embedding not allowed",
};

// Helper function to extract YouTube video ID from URL
const extractYouTubeId = (url) => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname === '/watch') {
        return urlObj.searchParams.get('v');
      }
      const match = urlObj.pathname.match(/\/embed\/([^\/\?]+)/);
      if (match) return match[1];
    } else if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
  } catch (err) {
    console.warn('Invalid URL format:', err);
  }
  return null;
};

// Function to search YouTube videos
const searchYouTubeVideo = async (searchQuery) => {
  try {    
    // COMMENTED OUT FOR TESTING AI FALLBACK CONTENT
    // const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyBLn33rjtp5aRamO-hO6-yEWKcgxuvjepI';
    const apiKey = null; // Force fallback to AI content
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${apiKey}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const error = new Error(`YouTube API error: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    if (!data.items?.length) {
      throw new Error('No videos found');
    }

    return {
      videoId: data.items[0].id.videoId,
      title: data.items[0].snippet.title
    };
  } catch (error) {
    console.error('Error searching YouTube:', error);
    if (error.status === 403) {
      throw new Error('YouTube API quota exceeded or key invalid');
    } else if (error.status === 400) {
      throw new Error('Invalid search request');
    }
    throw new Error('Failed to fetch video from YouTube');
  }
};

// Generate AI content when no video is available
const generateAIContent = async (topic) => {
  if (!topic) return null;
  
  try {
    console.log(`Generating AI content for topic: ${topic}`);
    
    // Create a comprehensive prompt for the AI to generate educational content
    const prompt = `Create a comprehensive educational markdown guide about "${topic}". 
    
Structure your response as a well-formatted markdown document with:

1. A main heading with the topic name
2. An introductory section explaining the core concepts
3. 2-3 key sections with subheadings covering important aspects
4. Use bullet points for lists where appropriate
5. Include at least one simple table if relevant 
6. Add emphasis using bold and italics for important terms
7. Include a brief summary or key takeaways section at the end

Make this educational content informative yet concise (around 300-500 words total).`;

    // Call the Gemini API to generate the content
    const markdownContent = await callGeminiAPI(prompt);
    
    console.log("Successfully generated AI content");
    return {
      title: `AI-Generated Guide: ${topic}`,
      content: markdownContent,
      isMarkdown: true
    };
  } catch (error) {
    console.error('Error generating AI content:', error);
    return generateFallbackContent(topic); // Fallback to basic content if AI generation fails
  }
};

// Generate fallback content when videos fail
const generateFallbackContent = (topic) => {
  if (!topic) return null;
  
  const topicLower = topic.toLowerCase();
  let category = 'general';
  
  if (topicLower.includes('python') || topicLower.includes('javascript') || 
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
  
  const suggestions = contentSuggestions[category]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  
  return {
    title: `Learning Resources for: ${topic}`,
    suggestions,
    searchQuery: topic
  };
};

const LessonVideo = ({ videoUrl, title, onAIContentGenerated }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [fallbackContent, setFallbackContent] = useState(null);
  const [aiContent, setAIContent] = useState(null);
  const [aiContentLoading, setAIContentLoading] = useState(false);

  useEffect(() => {
    const loadVideo = async () => {
      setLoading(true);
      setError(null);
      setFallbackContent(null);
      setAIContent(null);
      
      try {
        if (!videoUrl) {
          throw new Error('No video URL provided');
        }

        // Try to extract video ID from URL first
        const urlVideoId = extractYouTubeId(videoUrl);
        if (urlVideoId) {
          setVideoId(urlVideoId);
          return;
        }

        // If no valid YouTube URL, search for video
        const searchResult = await searchYouTubeVideo(title || videoUrl);
        setVideoId(searchResult.videoId);
      } catch (err) {
        console.error('Video loading error:', err);
        setError(err.message);
        
        // Generate basic fallback content immediately
        if (title) {
          setFallbackContent(generateFallbackContent(title));
            // Generate AI content in background
          setAIContentLoading(true);
          generateAIContent(title)
            .then(content => {
              if (content) {
                setAIContent(content);
                // Notify the parent component about the generated content
                if (onAIContentGenerated && typeof onAIContentGenerated === 'function') {
                  onAIContentGenerated(content);
                }
              }
            })
            .catch(aiError => {
              console.error('AI content generation error:', aiError);
            })
            .finally(() => {
              setAIContentLoading(false);
            });
        }
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoUrl, title]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }  // If we have AI content, don't display it here - let the parent component handle it in the About tab
  if (error && aiContent) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-blue-700">Video not available, but AI-generated content has been provided in the About section below.</p>
          {aiContentLoading && (
            <div className="animate-pulse rounded-full h-3 w-3 bg-indigo-600"></div>
          )}
        </div>
      </div>
    );
  }
  // Show basic fallback content while AI content might still be loading
  if (error && fallbackContent) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-yellow-700">{error}</p>
          {aiContentLoading && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
              <span className="text-sm text-indigo-600">Generating AI content...</span>
            </div>
          )}
        </div>
        
        <p className="text-gray-600">Check the About section below for learning resources and content.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-gray-600 mt-2">
          Please try refreshing the page or contact support if the issue persists.
        </p>
      </div>
    );
  }

  if (!videoId) {
    return null;
  }

  return (
    <div className="relative pt-[56.25%] w-full">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title || 'Video content'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default LessonVideo;
