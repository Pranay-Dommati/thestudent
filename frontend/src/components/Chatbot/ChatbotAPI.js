import axios from "axios";
import axiosInstance from "../../utils/axios";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use environment variables for API keys
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const HUGGINGFACE_API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Base URLs for APIs
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const LEARNING_PLAN_API_URL = `${API_BASE_URL}/learning/generate-learning-plan/`;
const LEARNING_PLAN_SAVE_API_URL = `${API_BASE_URL}/learning/generate-learning-plan/`;

// Initialize Google Generative AI
let genAI = null;
let model = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

// Debug API keys and quota monitoring
let youtubeApiCalls = 0;
let youtubeQuotaExceeded = false;

console.log("API Configuration Status:", {
  youtube: YOUTUBE_API_KEY ? "✓" : "✗",
  huggingface: HUGGINGFACE_API_TOKEN ? "✓" : "✗",
  gemini: GEMINI_API_KEY ? "✓" : "✗"
});

// Fetch from YouTube API
const getYoutubeVideoLink = async (query) => {
  try {
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        q: query,
        part: "snippet",
        maxResults: 1,
        type: "video",
        key: YOUTUBE_API_KEY,
      },
    });
    const videoId = response.data.items[0]?.id?.videoId;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch (error) {
    console.error("YouTube API error:", error);
    return null;
  }
};

// Function to get YouTube resources for a specific topic
export const getYoutubeResources = async (topic, maxResults = 1) => {
  try {
    console.log(`Fetching ${maxResults} YouTube videos for: ${topic}`);
    
    // Check if quota was previously exceeded
    if (youtubeQuotaExceeded) {
      console.warn("YouTube API quota previously exceeded - using fallback");
      return createFallbackVideo(topic);
    }
    
    youtubeApiCalls++;
    console.log(`YouTube API call #${youtubeApiCalls}`);

    if (!YOUTUBE_API_KEY) {
      console.error("YouTube API key is missing from environment variables");
      throw new Error("YouTube API key is missing");
    }
    
    // Enhance the search query to prioritize tutorials and educational content
    let enhancedQuery = topic;
    if (!topic.toLowerCase().includes('tutorial') && !topic.toLowerCase().includes('course')) {
      enhancedQuery += ' tutorial';
    }
    
    // Add parameters to improve video quality and relevance
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        q: enhancedQuery,
        part: "snippet",
        maxResults: maxResults + 3, // Request extra videos to filter out low quality ones
        type: "video",
        videoDefinition: "high", // Get higher quality videos
        relevanceLanguage: "en", // English language results
        videoDuration: "medium", // Medium length videos (tutorials are often 5-20 mins)
        key: YOUTUBE_API_KEY,
      },
    });
    
    if (!response.data.items || response.data.items.length === 0) {
      console.warn(`No YouTube videos found for topic: ${enhancedQuery}`);
      return [];
    }

    console.log(`Found ${response.data.items.length} YouTube videos for ${enhancedQuery}`);
    
    // Process and filter video results
    const videos = response.data.items
      // Filter out videos with misleading or clickbait titles
      .filter(item => {
        const title = item.snippet.title.toLowerCase();
        const isRelevant = !title.includes('prank') && 
                          !title.includes('clickbait') && 
                          !title.includes('reaction') &&
                          item.snippet.title.length < 100; // Filter out videos with extremely long titles
        return isRelevant;
      })
      // Transform the data for our frontend
      .map(item => ({
        id: item.id.videoId,
        video_id: item.id.videoId,  // This is the key property needed by ChatbotPage.jsx
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
      }))
      // Take only the requested number of videos after filtering
      .slice(0, maxResults);
    
    console.log("Processed video data:", videos[0]);
    return videos;
  } catch (error) {
    console.error("Error fetching YouTube resources:", error);
    
    // Handle specific YouTube API errors
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        console.warn("YouTube API quota exceeded - switching to fallback mode");
        youtubeQuotaExceeded = true; // Prevent further API calls
        return createFallbackVideo(topic);
      } else if (status === 401) {
        console.error("YouTube API authentication failed - invalid API key");
      } else if (status === 429) {
        console.warn("YouTube API rate limit exceeded");
        youtubeQuotaExceeded = true;
        return createFallbackVideo(topic);
      }
    }
    
    // Return empty array for other errors to make the app resilient
    return [];
  }
};

// Helper function to create fallback video data when YouTube API fails
const createFallbackVideo = (topic) => {
  return [{
    id: `fallback_${Date.now()}`,
    video_id: `fallback_${Date.now()}`,
    title: `${topic} - Tutorial`,
    description: `Educational content about ${topic}. Search for this topic on YouTube to find relevant tutorials.`,
    thumbnail: "https://via.placeholder.com/320x180/4285f4/ffffff?text=Tutorial",
    channelTitle: "Educational Content",
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`,
    embedUrl: null, // No embed for fallback
    isFallback: true
  }];
};

// Function to call the Hugging Face API
const callHuggingFaceAPI = async (prompt) => {
  if (!HUGGINGFACE_API_TOKEN) {
    console.error("Hugging Face API token not found in .env file");
    throw new Error("Missing API token. Please add VITE_HUGGINGFACE_API_TOKEN to your .env file.");
  }
  
  try {
    console.log("Calling Hugging Face API...");
    console.log("Using token:", HUGGINGFACE_API_TOKEN.substring(0, 5) + "...");
    console.log("API URL:", HUGGINGFACE_API_URL);
    
    const headers = {
      "Authorization": `Bearer ${HUGGINGFACE_API_TOKEN}`,
      "Content-Type": "application/json"
    };
    
    const payload = {
      "inputs": prompt,
      "parameters": {
        "max_new_tokens": 2048,
        "temperature": 0.7,
        "return_full_text": false
      }
    };
    
    console.log("Sending request to Hugging Face API with prompt length:", prompt.length);
    console.log("Prompt first 100 chars:", prompt.substring(0, 100) + "...");
    
    // Add timeout to prevent hanging requests
    const response = await axios.post(HUGGINGFACE_API_URL, payload, { 
      headers,
      timeout: 30000 // 30 second timeout
    });
    
    console.log("Received response from Hugging Face API");
    console.log("Response status:", response.status);
    console.log("Response type:", typeof response.data);
    
    // Extract the generated text
    let generatedText = "";
    if (Array.isArray(response.data)) {
      console.log("Response is an array of length:", response.data.length);
      generatedText = response.data[0]?.generated_text || "";
    } else if (typeof response.data === 'object') {
      console.log("Response is an object with keys:", Object.keys(response.data).join(', '));
      generatedText = response.data?.generated_text || JSON.stringify(response.data) || "";
    } else {
      console.log("Response is a string of length:", String(response.data).length);
      generatedText = String(response.data) || "";
    }
    
    console.log("Generated text length:", generatedText.length);
    console.log("Generated text first 100 chars:", generatedText.substring(0, 100) + "...");
    
    return generatedText;
  } catch (error) {
    console.error("Error calling Hugging Face API:", error.message);
    console.error("Error type:", error.name);
    console.error("Stack trace:", error.stack);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", JSON.stringify(error.response.headers));
      console.error("Response data:", error.response.data);
      
      // Check for specific error codes
      if (error.response.status === 402) {
        console.warn("Hugging Face API quota exceeded or payment required");
        return generateFallbackResponse(prompt);
      } else if (error.response.status === 401) {
        console.error("Hugging Face API authentication failed - invalid token");
        return generateFallbackResponse(prompt);
      } else if (error.response.status === 429) {
        console.warn("Hugging Face API rate limit exceeded");
        return generateFallbackResponse(prompt);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received:", error.request);
      if (error.code === 'ECONNABORTED') {
        console.error("Request timed out");
      }
      return generateFallbackResponse(prompt);
    }
    
    // For all other errors, use fallback
    console.warn("Using fallback response due to API error");
    return generateFallbackResponse(prompt);
  }
};

// Function to generate fallback responses when API quota is exceeded
const generateFallbackResponse = (prompt) => {
  console.log("Using fallback response generator");
  
  // Extract the main query or topic from the prompt
  let userQuery = prompt;
  if (prompt.includes('"')) {
    // Extract text between quotes if present
    const matches = prompt.match(/"([^"]*)"/); 
    if (matches && matches[1]) {
      userQuery = matches[1];
    }
  }
  
  // Check if this is a learning plan request
  if (prompt.includes('learning plan') || prompt.includes('day-by-day')) {
    return generateFallbackLearningPlan(userQuery);
  }
  
  // For regular chat requests
  return `I'm currently experiencing high demand and my advanced AI features are temporarily limited. ` +
    `Here's a simplified response to your query about "${userQuery}":\n\n` +
    `To learn more about this topic, I recommend checking resources like Wikipedia, YouTube tutorials, ` +
    `or specialized educational websites. You can also try again later when my advanced features are available again.`;
};

// Function to call the actual Google Gemini API
const callRealGeminiAPI = async (prompt) => {
  if (!GEMINI_API_KEY || !model) {
    console.error("Gemini API not properly configured");
    throw new Error("Gemini API configuration missing");
  }

  try {
    console.log("Calling Google Gemini API...");
    console.log("Prompt length:", prompt.length);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Received response from Gemini API");
    console.log("Response length:", text.length);
    
    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

// Generate a meaningful learning plan when API is unavailable
const generateFallbackLearningPlan = (topic) => {
  console.log("Generating fallback learning plan for:", topic);
  
  // DEBUGGING: Log the exact input we're working with
  console.log("Topic string for extraction:", JSON.stringify(topic));
  
  // First check directly for common subjects
  let subject = null;
  let days = 7;
  
  // Direct check for common subjects first
  const commonTechnologies = [
    {name: 'ReactJS', aliases: ['react', 'reactjs', 'react.js', 'react js']},
    {name: 'JavaScript', aliases: ['javascript', 'js', 'java script']},
    {name: 'Python', aliases: ['python', 'py']},
    {name: 'AI', aliases: ['ai', 'artificial intelligence', 'machine learning', 'ml']},
    {name: 'Java', aliases: ['java']},
    {name: 'HTML', aliases: ['html', 'html5']},
    {name: 'CSS', aliases: ['css', 'css3', 'styling']},
    {name: 'Node.js', aliases: ['node', 'nodejs', 'node.js', 'node js']}
  ];
  
  // Check the topic string for any of our known technologies
  const topicLower = topic.toLowerCase();
  for (const tech of commonTechnologies) {
    // Check for exact name match or any aliases
    if (topicLower.includes(tech.name.toLowerCase())) {
      subject = tech.name;
      console.log(`Found subject directly: ${subject}`);
      break;
    }
    
    // Check aliases
    for (const alias of tech.aliases) {
      if (topicLower.includes(alias)) {
        subject = tech.name;
        console.log(`Found subject via alias '${alias}': ${subject}`);
        break;
      }
    }
    
    if (subject) break;
  }
  
  // Try different regex patterns to extract days
  const daysMatch = topicLower.match(/in\s+(\d+)\s+days?/i);
  if (daysMatch && daysMatch[1]) {
    days = parseInt(daysMatch[1]);
    console.log(`Found days: ${days}`);
  }
  
  // If we still don't have a subject, try more complex extraction
  if (!subject) {
    // Try to extract from phrases like "Learn X" or "Master X"
    let extractedSubject = "";
    if (topicLower.includes('learn')) {
      const match = topic.match(/[Ll]earn\s+([^\d]+?)(?:\s+in\s+|$)/i);
      if (match && match[1]) {
        extractedSubject = match[1].trim();
        console.log(`Extracted subject from 'learn' pattern: ${extractedSubject}`);
      }
    } else if (topicLower.includes('master')) {
      const match = topic.match(/[Mm]aster\s+([^\d]+?)(?:\s+in\s+|$)/i);
      if (match && match[1]) {
        extractedSubject = match[1].trim();
        console.log(`Extracted subject from 'master' pattern: ${extractedSubject}`);
      }
    }
    
    // If no subject found, check for learning plan directly
    if (!extractedSubject && topicLower.includes('learning plan')) {
      const match = topic.match(/([^\s]+)\s+learning\s+plan/i);
      if (match && match[1]) {
        extractedSubject = match[1].trim();
        console.log(`Extracted subject from 'learning plan' pattern: ${extractedSubject}`);
      }
    }
    
    // Use the extracted subject
    if (extractedSubject) {
      // Check if the extracted subject contains any of our known technologies
      const extractedLower = extractedSubject.toLowerCase();
      for (const tech of commonTechnologies) {
        if (extractedLower.includes(tech.name.toLowerCase())) {
          subject = tech.name;
          break;
        }
        
        for (const alias of tech.aliases) {
          if (extractedLower.includes(alias)) {
            subject = tech.name;
            break;
          }
        }
        
        if (subject) break;
      }
      
      // If still no match with known technologies, use the extracted text directly
      if (!subject) {
        subject = extractedSubject;
      }
    }
  }
  
  // Fallback to default if we still don't have a subject
  if (!subject) {
    subject = "programming";
  }
  
  console.log(`Creating fallback plan for ${subject} in ${days} days`);
  
  // Generate appropriate topics based on the subject
  const topics = generateTopicsForSubject(subject, days);
  
  // Create the learning plan with the generated topics
  const fallbackPlan = [];
  for (let i = 0; i < days; i++) {
    fallbackPlan.push({
      day: i + 1,
      topic: topics[i].title,
      project_idea: topics[i].project,
      youtube_query: `${subject} ${topics[i].searchTerm} tutorial`
    });
  }
  
  return fallbackPlan;
};

// Generate relevant topics for any subject
export const generateTopicsForSubject = (subject, days) => {
  console.log(`Generating ${days} topics for ${subject}`);
  
  // Normalize subject for better matching
  const subjectLower = subject.toLowerCase();
  
  // Generate a dynamic learning path for any subject
  const generateDynamicTopics = (subject, days) => {
    const topics = [];
    const stages = [
      "Fundamentals and Introduction",
      "Core Concepts and Basics",
      "Essential Skills and Tools",
      "Intermediate Techniques",
      "Advanced Concepts",
      "Practical Applications",
      "Best Practices and Patterns",
      "Real-world Projects",
      "Performance and Optimization",
      "Expert-level Topics"
    ];

    for (let i = 0; i < days; i++) {
      const stageIndex = Math.min(i, stages.length - 1);
      const day = i + 1;
      
      // Generate project ideas based on the stage
      let projectIdea = "";
      if (i < 3) {
        projectIdea = `Create a simple ${subject} project focusing on ${stages[stageIndex].toLowerCase()}`;
      } else if (i < 6) {
        projectIdea = `Build an intermediate ${subject} application incorporating ${stages[stageIndex].toLowerCase()}`;
      } else {
        projectIdea = `Develop an advanced ${subject} project that demonstrates mastery of ${stages[stageIndex].toLowerCase()}`;
      }

      topics.push({
        title: `${subject} ${stages[stageIndex]} - Day ${day}`,
        project: projectIdea,
        searchTerm: `${subject} ${stages[stageIndex].toLowerCase()} tutorial`
      });
    }
    
    return topics;
  };

  // Generate topics for the subject
  const topicSet = generateDynamicTopics(subject, days);
  
  // Return the slice of topics matching the requested number of days
  return topicSet.slice(0, days);
};

// Function to parse the learning plan from Hugging Face response
export const parseHuggingFaceLearningPlan = (generatedText, goal) => {
  try {
    console.log("Parsing AI response for learning plan");

    // Check if this is a fallback response in JSON format from our own system
    try {
      const parsedData = JSON.parse(generatedText);
      if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].day && parsedData[0].topic) {
        console.log("Using pre-parsed fallback learning plan");
        return parsedData;
      }
    } catch (fallbackError) {
      console.log("Not a fallback response, continuing with normal parsing");
    }
    
    // First attempt: try to parse as JSON directly
    try {
      const jsonStart = generatedText.indexOf('[');
      const jsonEnd = generatedText.lastIndexOf(']') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonStr = generatedText.substring(jsonStart, jsonEnd);
        const parsedData = JSON.parse(jsonStr);
        
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log("Successfully parsed JSON learning plan");
          return parsedData;
        }
      }
    } catch (jsonError) {
      console.warn("Could not parse JSON directly", jsonError);
    }
    
    // Second attempt: Try to use regex to extract information
    console.log("Attempting regex extraction of learning plan");
    const daysRegex = /Day (\d+)[:\s]+(.*?)(?:\n|$)(.*?)(?:Project|Exercise|Practice)[:\s]+(.*?)(?:\n|$)/gis;
    const days = [];
    let match;
    let dayNumber = 1;
    
    while ((match = daysRegex.exec(generatedText)) !== null) {
      const extractedDay = match[1].trim();
      const topic = match[2].trim();
      const projectIdea = match[4].trim();
      
      days.push({
        day: parseInt(extractedDay) || dayNumber,
        topic: topic,
        project_idea: projectIdea,
        youtube_query: `${topic} tutorial`
      });
      
      dayNumber++;
    }
    
    if (days.length > 0) {
      console.log(`Extracted ${days.length} days using regex`);
      return days;
    }
    
    // If we couldn't extract anything, generate a proper fallback based on the requested topic
    console.warn("Could not extract learning plan from response, using smart fallback");
    
    // Extract the subject and days from the goal
    const extractionResult = extractSubjectAndDays(goal);
    const { subject, days: numDays } = extractionResult;
    
    console.log(`Creating smart fallback for ${subject} with ${numDays} days`);
    
    // Generate topics based on the extracted subject
    const topics = generateTopicsForSubject(subject, numDays);
    
    // Convert to the expected format
    return topics.map((topic, index) => ({
      day: index + 1,
      topic: topic.title,
      project_idea: topic.project,
      youtube_query: `${subject} ${topic.searchTerm}`
    }));
  } catch (error) {
    console.error("Error parsing learning plan:", error);
    // Absolute last resort fallback
    return [
      { day: 1, topic: "Getting Started", project_idea: "Set up your environment", youtube_query: `${goal} basics` },
      { day: 2, topic: "Fundamentals", project_idea: "Practice the basics", youtube_query: `${goal} fundamentals` },
      { day: 3, topic: "Building Projects", project_idea: "Create a simple project", youtube_query: `${goal} projects` }
    ];
  }
};

// Helper function to extract subject and days from a goal
const extractSubjectAndDays = (goal) => {
  console.log("Extracting subject and days from:", goal);
  
  let subject = null;
  let days = 7;
  
  // Try different regex patterns to extract days first
  const topicLower = goal.toLowerCase();
  const daysMatch = topicLower.match(/in\s+(\d+)\s+days?/i);
  if (daysMatch && daysMatch[1]) {
    days = parseInt(daysMatch[1]);
    console.log(`Found days: ${days}`);
  }
  
  // Extract subject using various patterns
  if (topicLower.includes('learn')) {
    const match = goal.match(/[Ll]earn\s+([^\d]+?)(?:\s+in\s+|$)/i);
    if (match && match[1]) {
      subject = match[1].trim();
      console.log(`Extracted subject from 'learn' pattern: ${subject}`);
    }
  } else if (topicLower.includes('master')) {
    const match = goal.match(/[Mm]aster\s+([^\d]+?)(?:\s+in\s+|$)/i);
    if (match && match[1]) {
      subject = match[1].trim();
      console.log(`Extracted subject from 'master' pattern: ${subject}`);
    }
  } else if (topicLower.includes('learning plan')) {
    const match = goal.match(/([^\s]+)\s+learning\s+plan/i);
    if (match && match[1]) {
      subject = match[1].trim();
      console.log(`Extracted subject from 'learning plan' pattern: ${subject}`);
    }
  } else if (topicLower.includes('create') || topicLower.includes('make')) {
    const match = goal.match(/(?:create|make)\s+(?:a|an)?\s+([^\d]+?)(?:\s+learning\s+plan|\s+course|\s+tutorial|\s+guide|\s+in\s+|$)/i);
    if (match && match[1]) {
      subject = match[1].trim();
      console.log(`Extracted subject from 'create/make' pattern: ${subject}`);
    }
  }
  
  // If no subject found yet, try to extract any topic
  if (!subject) {
    // Remove common words and extract the main topic
    const commonWords = ['learn', 'master', 'study', 'create', 'make', 'plan', 'course', 'tutorial', 'guide', 'in', 'days', 'day'];
    let words = goal.split(/\s+/);
    words = words.filter(word => !commonWords.includes(word.toLowerCase()));
    if (words.length > 0) {
      subject = words.join(' ').trim();
      console.log(`Extracted subject from remaining words: ${subject}`);
    }
  }
  
  // If still no subject found, use the entire goal as the subject
  if (!subject) {
    subject = goal.replace(/in\s+\d+\s+days?/i, '').trim();
    console.log(`Using entire goal as subject: ${subject}`);
  }
  
  return { subject, days };
};

// Compatibility function to replace Gemini API
export const callGeminiAPI = async (userMessage, options = {}) => {
  try {
    console.log("Chat request received:", userMessage);
    console.log("Options:", options);
    
    if (options.createCourse) {
      // Course creation mode - use Hugging Face API
      console.log("Using Hugging Face API for course creation mode");
      
      const prompt = `You are an AI course creation assistant. Your primary goal is to help create structured learning courses and educational content. When a user asks you something, always try to interpret their request in the context of course creation, curriculum development, or educational planning.

For the following user request: "${userMessage}"

Please respond by either:
1. Creating a detailed course outline if the request relates to learning a topic
2. Providing course creation advice and educational structure recommendations
3. Suggesting learning objectives, course modules, and teaching methods
4. If the request is completely unrelated to education, still try to frame your response in an educational context

Focus on creating comprehensive, well-structured educational content.`;

      // Call Hugging Face API for course creation
      const generatedText = await callHuggingFaceAPI(prompt);
      console.log("Generated course creation response successfully");
      
      // Ensure we always return a string
      if (typeof generatedText === 'string') {
        return generatedText;
      } else if (Array.isArray(generatedText)) {
        console.warn("Received array instead of string, converting to string");
        return generatedText.join(' ');
      } else if (typeof generatedText === 'object') {
        console.warn("Received object instead of string, converting to string");
        return JSON.stringify(generatedText);
      } else {
        console.warn("Received unexpected type, converting to string");
        return String(generatedText);
      }
    } else {
      // Regular chat mode - use actual Google Gemini API
      console.log("Using Google Gemini API for regular chat mode");
      
      const prompt = `You are a helpful AI assistant. Please provide a conversational response to the user's question. Do NOT create learning plans, course outlines, or structured educational content unless specifically asked. Just give a normal, informative answer like a regular chatbot would.

User's question: "${userMessage}"

Respond naturally and conversationally without creating any courses or learning plans.`;

      // Call the actual Gemini API
      const generatedText = await callRealGeminiAPI(prompt);
      console.log("Generated regular chat response successfully from Gemini API");
      console.log("Response type:", typeof generatedText);
      
      return generatedText;
    }
  } catch (error) {
    console.error("Error in callGeminiAPI:", error);
    
    // If Gemini API fails and we're in regular chat mode, fall back to Hugging Face
    if (!options.createCourse && HUGGINGFACE_API_TOKEN) {
      console.log("Falling back to Hugging Face API for regular chat");
      try {
        const fallbackPrompt = `You are a helpful AI assistant. Please provide a conversational response to the user's question: "${userMessage}"`;
        return await callHuggingFaceAPI(fallbackPrompt);
      } catch (fallbackError) {
        console.error("Fallback to Hugging Face also failed:", fallbackError);
      }
    }
    
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
};

// For backward compatibility with getLearningPath function
export const getLearningPath = async (userInput) => {
  try {
    console.log("getLearningPath called with:", userInput);
    // Forward to the new implementation
    const result = await generateLearningPlan(userInput);
    
    if (result.success) {
      console.log("Learning plan generated successfully");
      return result.content;
    } else {
      console.error("Error generating learning plan:", result.message);
      return `I'm sorry, I couldn't generate a learning plan. ${result.message}`;
    }
  } catch (error) {
    console.error("Error in getLearningPath:", error);
    return "I'm sorry, there was an error generating your learning plan. Please try again later.";
  }
};

// Test function to directly check subject extraction - can be called from browser console
export const testLearningPlanSubject = (topic) => {
  console.log("============ TESTING SUBJECT EXTRACTION ============");
  console.log("Input:", topic);
  
  // First check directly for common subjects
  let subject = null;
  let days = 7;
  
  // Direct check for common subjects first
  const commonTechnologies = [
    {name: 'ReactJS', aliases: ['react', 'reactjs', 'react.js', 'react js']},
    {name: 'JavaScript', aliases: ['javascript', 'js', 'java script']},
    {name: 'Python', aliases: ['python', 'py']},
    {name: 'AI', aliases: ['ai', 'artificial intelligence', 'machine learning', 'ml']},
    {name: 'Java', aliases: ['java']},
    {name: 'HTML', aliases: ['html', 'html5']},
    {name: 'CSS', aliases: ['css', 'css3', 'styling']},
    {name: 'Node.js', aliases: ['node', 'nodejs', 'node.js', 'node js']}
  ];
  
  // Check the topic string for any of our known technologies
  const topicLower = topic.toLowerCase();
  for (const tech of commonTechnologies) {
    // Check for exact name match or any aliases
    if (topicLower.includes(tech.name.toLowerCase())) {
      subject = tech.name;
      console.log(`Direct match: ${subject}`);
      break;
    }
    
    // Check aliases
    for (const alias of tech.aliases) {
      if (topicLower.includes(alias)) {
        subject = tech.name;
        console.log(`Alias match '${alias}': ${subject}`);
        break;
      }
    }
    
    if (subject) break;
  }
  
  // Try different regex patterns to extract days
  const daysMatch = topicLower.match(/in\s+(\d+)\s+days?/i);
  if (daysMatch && daysMatch[1]) {
    days = parseInt(daysMatch[1]);
    console.log(`Extracted days: ${days}`);
  }
  
  // If we still don't have a subject, try more complex extraction
  if (!subject) {
    // Try to extract from phrases like "Learn X" or "Master X"
    let extractedSubject = "";
    if (topicLower.includes('learn')) {
      const match = topic.match(/[Ll]earn\s+([^\d]+?)(?:\s+in\s+|$)/i);
      if (match && match[1]) {
        extractedSubject = match[1].trim();
        console.log(`Learn pattern match: ${extractedSubject}`);
      }
    } else if (topicLower.includes('master')) {
      const match = topic.match(/[Mm]aster\s+([^\d]+?)(?:\s+in\s+|$)/i);
      if (match && match[1]) {
        extractedSubject = match[1].trim();
        console.log(`Master pattern match: ${extractedSubject}`);
      }
    }
    
    console.log(`Final extracted subject: ${extractedSubject || 'none'}`);
  }
  
  console.log(`Final result: Subject=${subject || 'none'}, Days=${days}`);
  console.log("============ END TESTING ============");
  
  return { subject, days };
};

// Function to save the AI-generated learning plan to the database
async function saveLearningPlanToDatabase(learningPlan) {
  try {
    console.log("Saving learning plan to database:", learningPlan.title);
      // Format the data for the backend API
    const formattedPlan = {
      goal: learningPlan.title,
      days: learningPlan.days.map(day => ({
        day: day.day,
        topic: day.topic,
        project_idea: day.project_idea,
        youtube_query: day.youtube_query,
        videos: day.videos.map(video => ({
          title: video.title,
          description: video.description,
          video_id: video.video_id,
          thumbnail_url: video.thumbnail || video.thumbnail_url,
          channel_title: video.channelTitle || video.channel_title
        })),
        // Include quiz questions in the data sent to backend
        quizQuestions: day.quizQuestions || []
      }))
    };
    
    // Send the data to the backend API using authenticated axios instance
    const response = await axiosInstance.post(LEARNING_PLAN_SAVE_API_URL, formattedPlan);
    
    console.log("Learning plan saved successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error saving learning plan to database:", error);
    throw error;
  }
}

// Function to format the learning plan response as markdown text for display
const formatLearningPlanResponse = (learningPlan) => {
  // Create markdown text from the learning plan structure
  let markdown = `# ${learningPlan.title}\n\n`;
  
  // Add direct learning interface link
  markdown += `## 🚀 [Start Your Learning Journey](/learning/${learningPlan.id})\n`;
  markdown += `I've created a personalized, interactive learning experience for you. **[Click here to start learning](/learning/${learningPlan.id})** with curated videos and structured progression. Your learning plan is also saved to your account.\n\n`;
  
  learningPlan.days.forEach(day => {
    markdown += `## Day ${day.day}: ${day.topic}\n\n`;
    markdown += `**Project idea:** ${day.project_idea}\n\n`;
    
    if (day.videos && day.videos.length > 0) {
      markdown += '**Recommended videos:**\n';
      day.videos.forEach(video => {
        if (video.video_id || video.id) {
          const videoId = video.video_id || video.id;
          markdown += `- [${video.title}](https://www.youtube.com/watch?v=${videoId})\n`;
        } else {
          markdown += `- ${video.title}\n`;
        }
      });
      markdown += '\n';
    }
  });
  
  return markdown;
};

// Function to generate quiz questions using Gemini AI
const generateQuizQuestions = async (sectionName, topics) => {
  try {
    console.log(`🧩 Generating quiz for section: ${sectionName}`);
    console.log(`📋 Topics: ${topics.join(', ')}`);
    
    const quizPrompt = `
    Create a quiz with 5 multiple choice questions based on the following section and topics:
    
    Section: ${sectionName}
    Topics: ${topics.join(', ')}
    
    Requirements:
    - Each question should have 4 options (A, B, C, D)
    - Only one option should be correct
    - Questions should test understanding of the key concepts
    - Make questions practical and applicable
    - Difficulty should be appropriate for beginners learning this topic
    
    Format your response as JSON:
    {
      "questions": [
        {
          "id": 1,
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": 0
        }
      ]
    }
    
    Make sure to return valid JSON only, no additional text.
    `;
    
    const quizResponse = await callRealGeminiAPI(quizPrompt);
    
    if (!quizResponse || quizResponse.trim().length === 0) {
      throw new Error("Empty quiz response from Gemini");
    }
    
    // Try to parse JSON from the response
    let quizData;
    try {
      // Clean the response to extract JSON
      const cleanedResponse = quizResponse.replace(/```json\n?|\n?```/g, '').trim();
      quizData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.warn("Failed to parse quiz JSON, creating fallback quiz");
      quizData = createFallbackQuiz(sectionName, topics);
    }
    
    // Validate quiz structure
    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      console.warn("Invalid quiz structure, using fallback");
      quizData = createFallbackQuiz(sectionName, topics);
    }
    
    console.log(`✅ Generated ${quizData.questions.length} quiz questions for ${sectionName}`);
    return quizData.questions;
    
  } catch (error) {
    console.error(`❌ Error generating quiz for ${sectionName}:`, error);
    return createFallbackQuiz(sectionName, topics).questions;
  }
};

// Create a fallback quiz when AI generation fails
const createFallbackQuiz = (sectionName, topics) => {
  return {
    questions: [
      {
        id: 1,
        question: `What is the main focus of the ${sectionName} section?`,
        options: [
          `Understanding ${topics[0] || 'basic concepts'}`,
          "Learning advanced programming",
          "Database management",
          "Network security"
        ],
        correct_answer: 0
      },
      {
        id: 2,
        question: `Which of the following is a key topic covered in ${sectionName}?`,
        options: [
          "Artificial Intelligence",
          topics[1] || topics[0] || "Basic concepts",
          "Machine Learning",
          "Data Science"
        ],
        correct_answer: 1
      },
      {
        id: 3,
        question: `When learning ${sectionName}, what should you focus on first?`,
        options: [
          "Advanced techniques",
          "Complex algorithms",
          "Basic fundamentals",
          "Professional tools"
        ],
        correct_answer: 2
      },
      {
        id: 4,
        question: `Which approach is best for practicing ${sectionName}?`,
        options: [
          "Reading only",
          "Watching videos only",
          "Hands-on practice with examples",
          "Taking notes only"
        ],
        correct_answer: 2
      },
      {
        id: 5,
        question: `What is important to remember about ${topics[0] || sectionName}?`,
        options: [
          "It's only for experts",
          "It requires expensive software",
          "Practice and patience are key to learning",
          "It's impossible to learn without a degree"
        ],
        correct_answer: 2
      }
    ]
  };
};

// Function to generate a dynamic learning plan using Gemini + Hugging Face
export const generateLearningPlan = async (goal) => {
  try {
    console.log("🎯 Generating dynamic learning plan for:", goal);
    
    // Step 1: Use Gemini to create initial course structure
    console.log("Step 1: Getting course structure from Gemini...");
    const courseStructure = await generateCourseStructureWithGemini(goal);
    
    if (!courseStructure.success) {
      console.log("❌ Gemini failed, falling back to original method...");
      return await generateOriginalLearningPlan(goal);
    }
    
    // Step 2: Use Hugging Face to create detailed JSON from Gemini's structure
    console.log("Step 2: Creating detailed course content with Hugging Face...");
    const detailedCourse = await createDetailedCourseWithHuggingFace(courseStructure.data, goal);
    
    return detailedCourse;
    
  } catch (error) {
    console.error("❌ Error in dynamic learning plan generation:", error);
    console.log("🔄 Falling back to original method...");
    return await generateOriginalLearningPlan(goal);
  }
};

// Step 1: Generate course structure using Gemini API
const generateCourseStructureWithGemini = async (userQuery) => {
  try {
    const geminiPrompt = `
    Based on this user request: "${userQuery}"
    
    Create a comprehensive course outline in the following format:
    
    Course Title: [Subject] Course Outline
    
    # Section Topics Covered
    1 [Section Name] • [Topic 1]
    • [Topic 2] 
    • [Topic 3]
    2 [Section Name] • [Topic 1]
    • [Topic 2]
    • [Topic 3]
    
    Requirements:
    - Create 8-12 sections based on the subject complexity
    - Each section should have 3-6 specific topics
    - Topics should be concrete and actionable (not vague)
    - Progress from beginner to advanced concepts
    - Include practical/project sections
    - Make topics specific enough to find YouTube tutorials
    
    Example format:
    Beginner-Friendly Python Course Outline
    # Section Topics Covered
    1 Getting Started • Why Python?
    • Installing Python & VS Code
    • Running your first script
    • How to read official docs
    2 Python Basics • Variables & data types
    • Math & comparison operators
    • Input/output with print() & input()
    • Comments & docstrings
    
    Important: Keep topics specific and tutorial-friendly!
    `;
      console.log("🤖 Calling Gemini for course structure...");
    console.log("📝 Gemini Prompt:", geminiPrompt);
    const geminiResponse = await callRealGeminiAPI(geminiPrompt);
    
    if (!geminiResponse || geminiResponse.trim().length === 0) {
      throw new Error("Empty response from Gemini API");
    }
    
    console.log("✅ Gemini response received:");
    console.log("🔍 RAW GEMINI RESPONSE:", geminiResponse);
    console.log("📊 Response length:", geminiResponse.length);
    console.log("🔄 Now parsing structure...");
    const parsedStructure = parseCourseStructureFromGemini(geminiResponse);
    
    return { success: true, data: parsedStructure };
    
  } catch (error) {
    console.error("❌ Error generating course structure with Gemini:", error);
    return { 
      success: false, 
      message: "Failed to generate course structure. Please try again.",
      error: error.message
    };
  }
};

// Parse the course structure from Gemini's response
const parseCourseStructureFromGemini = (geminiResponse) => {
  console.log("🔍 Parsing Gemini course structure...");
  console.log("📋 Input for parsing:", geminiResponse);
  
  const lines = geminiResponse.split('\n');
  console.log(`📝 Total lines to process: ${lines.length}`);
  
  let courseTitle = "Learning Course";
  let sections = [];
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = originalLine.trim();
    
    console.log(`📍 Line ${i + 1}: "${originalLine}" -> "${line}"`);
    
    // Extract course title
    if (line.includes('Course Outline') || line.includes('Course Title:')) {
      courseTitle = line.replace('Course Title:', '').replace('Course Outline', '').trim();
      console.log(`🏷️ Found course title: "${courseTitle}"`);
      continue;
    }
    
    // Parse section headers (numbered lines like "1 Getting Started" or "1\tGetting Started")
    const sectionMatch = line.match(/^(\d+)\s+(.+?)(?:\s*•|\s*$)/);
    if (sectionMatch) {
      console.log(`🔢 Found section match: ${sectionMatch[1]} - ${sectionMatch[2]}`);
      
      // Save previous section
      if (currentSection) {
        console.log(`💾 Saving previous section: ${currentSection.sectionName} with ${currentSection.topics.length} topics`);
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        sectionNumber: parseInt(sectionMatch[1]),
        sectionName: sectionMatch[2].trim(),
        topics: []
      };
      
      console.log(`🆕 Started new section: ${currentSection.sectionName}`);
      
      // Check if there's a topic on the same line after the section name
      const topicOnSameLine = line.match(/•\s*(.+)$/);
      if (topicOnSameLine) {
        const topic = topicOnSameLine[1].trim();
        currentSection.topics.push(topic);
        console.log(`➕ Added same-line topic: "${topic}"`);
      }
      continue;
    }
    
    // Parse topic lines (lines starting with • or bullet points)
    const topicMatch = line.match(/^[•·*-]\s*(.+)$/);
    if (topicMatch && currentSection) {
      const topic = topicMatch[1].trim();
      if (topic.length > 0) {
        currentSection.topics.push(topic);
        console.log(`➕ Added topic to ${currentSection.sectionName}: "${topic}"`);
      }
      continue;
    }
    
    // Log lines that don't match any pattern
    if (line.length > 0) {
      console.log(`❓ Unmatched line: "${line}"`);
    }
  }
  
  // Add the last section
  if (currentSection) {
    console.log(`💾 Saving final section: ${currentSection.sectionName} with ${currentSection.topics.length} topics`);
    sections.push(currentSection);
  }
  
  console.log(`✅ PARSING COMPLETE: ${sections.length} sections found`);
  sections.forEach((section, index) => {
    console.log(`📚 Section ${section.sectionNumber}: ${section.sectionName}`);
    section.topics.forEach((topic, topicIndex) => {
      console.log(`   🎯 Topic ${topicIndex + 1}: ${topic}`);
    });
  });
  
  const result = {
    courseTitle,
    sections,
    totalSections: sections.length
  };
  
  console.log("🎉 FINAL PARSED STRUCTURE:", JSON.stringify(result, null, 2));
  
  return result;
};

// Step 2: Create detailed course content using Hugging Face
const createDetailedCourseWithHuggingFace = async (courseStructure, originalGoal) => {
  try {
    console.log("🔄 Creating detailed course content with Hugging Face...");
    
    const { courseTitle, sections } = courseStructure;
    
    // Create days array from sections (each section = 1 day, each topic gets a video)
    const daysWithDetailedContent = await Promise.all(sections.map(async (section, index) => {
      const dayNumber = index + 1;
      
      console.log(`📅 Processing Day ${dayNumber}: ${section.sectionName}`);
      
      // Create project idea for this section using Hugging Face
      const projectPrompt = `Create a hands-on project idea for learning "${section.sectionName}" that covers these topics: ${section.topics.join(', ')}. 
      The project should be practical and help beginners practice these concepts. 
      Respond with just the project description in 1-2 sentences.`;
      
      let projectIdea = `Practice ${section.sectionName} concepts with hands-on exercises`;
      try {
        const projectResponse = await callHuggingFaceAPI(projectPrompt);
        if (projectResponse && projectResponse.trim().length > 0) {
          projectIdea = projectResponse.trim();
        }
      } catch (error) {
        console.warn(`⚠️ Could not generate project for section ${section.sectionName}, using fallback`);
      }
        // Get YouTube videos for each topic in this section
      console.log(`🎥 Fetching videos for ${section.topics.length} topics in section: ${section.sectionName}`);
      console.log(`📋 Topics to fetch videos for:`, section.topics);
        const videosForSection = await Promise.all(section.topics.map(async (topic, topicIndex) => {
        try {
          // Include course title for language-specific search results
          const searchQuery = `${courseTitle} ${topic} tutorial beginner guide`;
          console.log(`🔍 Topic ${topicIndex + 1}/${section.topics.length}: "${topic}"`);
          console.log(`🔍 YouTube search query: "${searchQuery}"`);
          
          const videos = await getYoutubeResources(searchQuery, 1); // Get 1 video per topic
          
          console.log(`✅ Found ${videos ? videos.length : 0} videos for topic: "${topic}"`);
          if (videos && videos.length > 0) {
            videos.forEach((video, vIndex) => {
              console.log(`   📺 Video ${vIndex + 1}: ${video.title}`);
            });
          }
          
          return {
            topicName: topic,
            videos: videos || []
          };
        } catch (error) {
          console.error(`❌ Error fetching video for topic "${topic}":`, error);
          return {
            topicName: topic,
            videos: []
          };
        }
      }));
        // Flatten videos array for this day
      const allVideosForDay = videosForSection.reduce((acc, topicVideo) => {
        return acc.concat(topicVideo.videos.map(video => ({
          ...video,
          topicName: topicVideo.topicName
        })));
      }, []);
      
      // Generate quiz questions for this section
      console.log(`🧩 Generating quiz questions for Day ${dayNumber}: ${section.sectionName}`);
      let quizQuestions = [];
      try {
        quizQuestions = await generateQuizQuestions(section.sectionName, section.topics);
      } catch (error) {
        console.warn(`⚠️ Could not generate quiz for section ${section.sectionName}, using fallback`);
        quizQuestions = createFallbackQuiz(section.sectionName, section.topics).questions;
      }
      
      console.log(`✅ Day ${dayNumber} processed: ${allVideosForDay.length} videos found, ${quizQuestions.length} quiz questions generated`);
      console.log(`📺 Final videos for Day ${dayNumber}:`, allVideosForDay.map(v => `"${v.title}" (for topic: ${v.topicName})`));
      
      return {
        day: dayNumber,
        topic: section.sectionName,
        topicsInSection: section.topics,
        project_idea: projectIdea,
        youtube_query: `${section.sectionName} tutorial guide`,
        videos: allVideosForDay,
        quizQuestions: quizQuestions // Add quiz questions to each day/section
      };
    }));
    
    // Create the complete learning plan object
    const learningPlan = {
      id: uuidv4(),
      title: courseTitle || originalGoal,
      type: "dynamic_learning_plan",
      days: daysWithDetailedContent,
      totalDays: sections.length,
      generationMethod: "gemini_huggingface_dynamic"
    };
    
    console.log(`🎉 Dynamic course generated: ${learningPlan.totalDays} days, ${learningPlan.days.reduce((acc, day) => acc + day.videos.length, 0)} total videos, ${learningPlan.days.reduce((acc, day) => acc + (day.quizQuestions?.length || 0), 0)} total quiz questions`);
    
    // Save to database
    let savedPlan = null;
    try {
      console.log("💾 Saving dynamic learning plan to database...");
      savedPlan = await saveLearningPlanToDatabase(learningPlan);
      if (savedPlan && savedPlan.id) {
        learningPlan.id = savedPlan.id;
        console.log(`✅ Saved with ID: ${savedPlan.id}`);
      }
    } catch (dbError) {
      console.error("❌ Error saving to database:", dbError);
    }
    
    // Format for display
    const formattedContent = formatDynamicLearningPlanResponse(learningPlan);
    
    return { success: true, data: learningPlan, content: formattedContent };
    
  } catch (error) {
    console.error("❌ Error creating detailed course with Hugging Face:", error);
    
    // Fallback to original method
    console.log("🔄 Falling back to original course generation method...");
    return await generateOriginalLearningPlan(originalGoal);
  }
};

// Format dynamic learning plan for display
const formatDynamicLearningPlanResponse = (learningPlan) => {
  let markdown = `# ${learningPlan.title}\n\n`;
  
  markdown += `## 🚀 [Start Your Learning Journey](/learning/${learningPlan.id})\n`;
  markdown += `I've created a personalized, dynamic learning experience with **${learningPlan.totalDays} comprehensive sections**. **[Click here to start learning](/learning/${learningPlan.id})** with curated videos for each topic.\n\n`;
  
  learningPlan.days.forEach(day => {
    markdown += `## Section ${day.day}: ${day.topic}\n\n`;
    
    // Show topics in this section
    if (day.topicsInSection && day.topicsInSection.length > 0) {
      markdown += `**Topics covered:**\n`;
      day.topicsInSection.forEach(topic => {
        markdown += `• ${topic}\n`;
      });
      markdown += '\n';
    }
    
    markdown += `**Project idea:** ${day.project_idea}\n\n`;
    
    if (day.videos && day.videos.length > 0) {
      markdown += `**Tutorial videos (${day.videos.length}):**\n`;
      day.videos.forEach(video => {
        const topicLabel = video.topicName ? ` [${video.topicName}]` : '';
        if (video.video_id || video.id) {
          const videoId = video.video_id || video.id;
          markdown += `- [${video.title}${topicLabel}](https://www.youtube.com/watch?v=${videoId})\n`;
        } else {
          markdown += `- ${video.title}${topicLabel}\n`;
        }
      });
      markdown += '\n';
    }
  });
  
  return markdown;
};

// Original learning plan generation as fallback
const generateOriginalLearningPlan = async (goal) => {
  try {
    console.log("🔄 Using original learning plan generation as fallback...");
    
    // Extract the subject and days from the goal
    const { subject, days: numDaysRequested } = extractSubjectAndDays(goal);
    console.log(`User requested a ${numDaysRequested}-day learning plan for: ${subject}`);
    
    // Create a prompt for the Hugging Face model that specifies the subject explicitly
    const prompt = `
    Create a detailed day-by-day learning plan for learning ${subject}.
    IMPORTANT: You must create EXACTLY ${numDaysRequested} days, no more and no less.
    
    For each day, include the following information:
    1. Day number (1 through ${numDaysRequested})
    2. A specific topic to focus on for that day (be detailed and concrete)
    3. A hands-on project idea that practices the day's topic
    4. A specific and detailed YouTube search query (5-8 words) that would find relevant tutorials
    
    Your response MUST be a properly formatted JSON array with ${numDaysRequested} objects.
    Each object MUST contain these exact keys: day (number), topic (string), project_idea (string), and youtube_query (string).
    The youtube_query must be very specific (e.g., "${subject} variables and data types tutorial" NOT just "${subject} basics").
    
    Example of expected format:
    [{
      "day": 1,
      "topic": "Introduction to ${subject} and Setting Up Environment",
      "project_idea": "Create a simple application using basic ${subject}",
      "youtube_query": "${subject} development environment setup beginners tutorial"
    },
    ...and so on for all ${numDaysRequested} days]
    `;    
    try {
      // Step 1: Call Hugging Face API to generate the learning plan structure
      console.log("Requesting learning plan from AI");
      const generatedText = await callHuggingFaceAPI(prompt);
      const learningPlanDays = parseHuggingFaceLearningPlan(generatedText, goal);
      
      // Step 2: Enrich each day with YouTube videos - get only one best video per day
      console.log("Enriching learning plan with YouTube videos - one best video per day");
      const daysWithVideos = await Promise.all(learningPlanDays.map(async (day) => {
        try {
          // Get only one best video per day
          const videos = await getYoutubeResources(day.youtube_query, 1);
          return { ...day, videos };
        } catch (error) {
          console.error(`Error fetching videos for day ${day.day}:`, error);
          return { ...day, videos: [] };
        }
      }));
      
      // Step 3: Create the complete learning plan object
      const learningPlan = {
        id: uuidv4(),
        title: goal,
        type: "learning_plan",
        days: daysWithVideos
      };
      
      // Step 4: Save the learning plan to the database and use returned ID
      let savedPlan = null;
      try {
        console.log("Saving learning plan to database");
        savedPlan = await saveLearningPlanToDatabase(learningPlan);
        console.log("Received saved learning plan from backend:");
        console.log("- ID:", savedPlan?.id);
        console.log("- Type:", savedPlan?.type);
        console.log("- Full response:", JSON.stringify(savedPlan, null, 2));
      } catch (dbError) {
        console.error("Error saving learning plan to database:", dbError);
      }
      
      // Update the learning plan with the backend-returned ID if save was successful
      if (savedPlan && savedPlan.id) {
        console.log(`Updating learning plan ID from ${learningPlan.id} to ${savedPlan.id}`);
        learningPlan.id = savedPlan.id;
      }
      
      // Step 5: Format the learning plan as markdown for display
      const formattedContent = formatLearningPlanResponse(learningPlan);
      
      return { success: true, data: learningPlan, content: formattedContent };
    } catch (apiError) {
      console.error("Error with AI API, using direct fallback:", apiError);
      
      // Create fallback plan using our predefined topics
      console.log(`Creating direct fallback plan for ${subject} with ${numDaysRequested} days`);
      
      // Generate topics for the subject
      const topics = generateTopicsForSubject(subject, numDaysRequested);
      
      // Create days array with the topic information
      const fallbackDays = topics.map((topic, index) => ({
        day: index + 1,
        topic: topic.title,
        project_idea: topic.project,
        youtube_query: `${subject} ${topic.searchTerm}`
      }));
      
      // Enrich with YouTube videos - get only one best video per day
      console.log("Adding YouTube videos to fallback plan - one best video per day");
      const daysWithVideos = await Promise.all(fallbackDays.map(async (day) => {
        try {
          // Get only one best video per day
          const videos = await getYoutubeResources(day.youtube_query, 1);
          return { ...day, videos };
        } catch (error) {
          console.error(`Error fetching videos for fallback day ${day.day}:`, error);
          return { ...day, videos: [] };
        }
      }));
      
      // Create complete learning plan
      const fallbackPlan = {
        id: uuidv4(),
        title: goal,
        type: "learning_plan",
        days: daysWithVideos
      };
      
      // Save the fallback learning plan to the database
      let savedFallbackPlan = null;
      try {
        console.log("Saving fallback learning plan to database");
        savedFallbackPlan = await saveLearningPlanToDatabase(fallbackPlan);
        console.log("Received saved fallback learning plan from backend:");
        console.log("- ID:", savedFallbackPlan?.id);
        console.log("- Type:", savedFallbackPlan?.type);
        console.log("- Full response:", JSON.stringify(savedFallbackPlan, null, 2));
      } catch (dbError) {
        console.error("Error saving fallback learning plan to database:", dbError);
        // Continue even if database save fails
      }
      
      // Update the fallback plan with the backend-returned ID if save was successful
      if (savedFallbackPlan && savedFallbackPlan.id) {
        console.log(`Updating fallback learning plan ID from ${fallbackPlan.id} to ${savedFallbackPlan.id}`);
        fallbackPlan.id = savedFallbackPlan.id;
      }
        const formattedContent = formatLearningPlanResponse(fallbackPlan);
      
      return { success: true, data: fallbackPlan, content: formattedContent };
    }
  } catch (error) {
    console.error("Error generating learning plan:", error);
    return { 
      success: false, 
      message: "Failed to generate a learning plan. Please try again later.",
      error: error.message
    };
  }
};

// Export the saveLearningPlanToDatabase function so it can be imported
export { saveLearningPlanToDatabase };