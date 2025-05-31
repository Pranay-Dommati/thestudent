import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Use environment variables for API keys
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const HUGGINGFACE_API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;

// Base URLs for APIs
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

// Debug API keys
console.log("API Configuration Status:", {
  youtube: YOUTUBE_API_KEY ? "✓" : "✗",
  huggingface: HUGGINGFACE_API_TOKEN ? "✓" : "✗"
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
export const getYoutubeResources = async (topic, maxResults = 5) => {
  try {
    console.log(`Fetching ${maxResults} YouTube videos for: ${topic}`);
    
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
    // Return empty array instead of throwing to make the app more resilient
    return [];
  }
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

// Generate relevant topics for common subjects
export const generateTopicsForSubject = (subject, days) => {
  console.log(`Generating ${days} topics for ${subject}`);
  
  // Normalize subject for better matching
  const subjectLower = subject.toLowerCase();
  
  // Prepare topic sets for common subjects
  let topicSet = [];
  
  // ReactJS learning path
  if (subjectLower.includes('react') || subjectLower.includes('reactjs')) {
    console.log('Using ReactJS learning path');
    topicSet = [
      { title: "React Fundamentals and Setup", project: "Create a simple React app with create-react-app", searchTerm: "setup create-react-app" },
      { title: "JSX and React Components", project: "Build a component-based UI for a simple app", searchTerm: "react components and jsx" },
      { title: "State and Props in React", project: "Create a counter app with multiple components sharing state", searchTerm: "react state props hooks" },
      { title: "React Hooks and Effects", project: "Build a data fetching app with useEffect", searchTerm: "react hooks useEffect useState" },
      { title: "Routing in React", project: "Create a multi-page React app with React Router", searchTerm: "react router navigation" },
      { title: "Forms and User Input", project: "Build a form validation system", searchTerm: "react forms controlled components" },
      { title: "State Management with Context API", project: "Create a theme switcher using Context", searchTerm: "react context api state management" },
      { title: "API Integration and Data Fetching", project: "Build a weather app that fetches data from an API", searchTerm: "react api fetch axios" },
      { title: "Redux for State Management", project: "Convert a React app to use Redux", searchTerm: "redux react state management" },
      { title: "Testing and Deployment", project: "Write tests and deploy your React app", searchTerm: "react testing jest deployment" }
    ];
  }
  
  // Python learning path
  else if (subjectLower.includes('python')) {
    console.log('Using Python learning path');
    topicSet = [
      { title: "Python Basics and Setup", project: "Create a simple calculator program", searchTerm: "python basics for beginners" },
      { title: "Data Types and Variables", project: "Build a temperature converter", searchTerm: "python data types variables" },
      { title: "Control Flow and Loops", project: "Create a number guessing game", searchTerm: "python if else loops" },
      { title: "Functions and Modules", project: "Build a utility toolkit with custom functions", searchTerm: "python functions modules" },
      { title: "Data Structures: Lists and Dictionaries", project: "Create a contact management system", searchTerm: "python lists dictionaries" },
      { title: "File Handling and Exceptions", project: "Build a log parser program", searchTerm: "python file handling exceptions" },
      { title: "Object-Oriented Programming", project: "Create a banking system with classes", searchTerm: "python classes objects OOP" },
      { title: "Working with External Libraries", project: "Build a data visualization tool with matplotlib", searchTerm: "python libraries pip matplotlib" },
      { title: "Web Development with Flask", project: "Create a simple web API", searchTerm: "python flask web development" },
      { title: "Data Analysis with Pandas", project: "Build a data analysis dashboard", searchTerm: "python pandas data analysis" }
    ];
  }
  
  // AI/Machine Learning path
  else if (subjectLower.includes('ai') || subjectLower.includes('machine learning')) {
    console.log('Using AI/ML learning path');
    topicSet = [
      { title: "Introduction to AI and ML", project: "Research different AI applications", searchTerm: "introduction to artificial intelligence machine learning" },
      { title: "Python for AI and Data Science", project: "Set up a data science environment", searchTerm: "python numpy pandas for machine learning" },
      { title: "Data Preprocessing and Analysis", project: "Clean and analyze a dataset", searchTerm: "data preprocessing machine learning" },
      { title: "Supervised Learning Algorithms", project: "Build a simple classification model", searchTerm: "supervised learning algorithms" },
      { title: "Neural Networks Fundamentals", project: "Implement a simple neural network", searchTerm: "neural networks basics tensorflow" },
      { title: "Deep Learning with TensorFlow", project: "Create an image classifier", searchTerm: "deep learning tensorflow tutorial" },
      { title: "Natural Language Processing", project: "Build a text classifier", searchTerm: "natural language processing python" },
      { title: "Computer Vision", project: "Create a face detection system", searchTerm: "computer vision opencv python" },
      { title: "Reinforcement Learning", project: "Build a simple game-playing AI", searchTerm: "reinforcement learning basics" },
      { title: "AI Ethics and Future Trends", project: "Analyze bias in an AI system", searchTerm: "AI ethics bias fairness" }
    ];
  }
  
  // JavaScript learning path
  else if (subjectLower.includes('javascript') || subjectLower === 'js') {
    console.log('Using JavaScript learning path');
    topicSet = [
      { title: "JavaScript Fundamentals", project: "Create a simple interactive webpage", searchTerm: "javascript basics for beginners" },
      { title: "DOM Manipulation", project: "Build a dynamic to-do list", searchTerm: "javascript DOM manipulation" },
      { title: "Functions and Scope", project: "Create a calculator with complex functions", searchTerm: "javascript functions scope closures" },
      { title: "Async JavaScript and Promises", project: "Build a weather app using APIs", searchTerm: "javascript async await promises" },
      { title: "ES6+ Features", project: "Refactor code using modern JavaScript", searchTerm: "javascript es6 modern features" },
      { title: "Error Handling and Debugging", project: "Create a robust form validation system", searchTerm: "javascript error handling debugging" },
      { title: "Object-Oriented JavaScript", project: "Build a library management system", searchTerm: "javascript OOP classes prototype" },
      { title: "Working with APIs", project: "Create a data dashboard with multiple APIs", searchTerm: "javascript api fetch axios" },
      { title: "JavaScript Frameworks Introduction", project: "Convert a vanilla JS app to a framework", searchTerm: "javascript frameworks comparison" },
      { title: "Testing and Best Practices", project: "Write tests for a JavaScript application", searchTerm: "javascript testing jest mocha" }
    ];
  }
  
  // Generic fallback plan
  else {
    console.log('Using generic learning path');
    const genericPlan = [];
    const stages = ["Fundamentals", "Core Concepts", "Intermediate Topics", "Advanced Techniques", "Practical Projects", 
                    "Best Practices", "Tools and Libraries", "Real-world Applications", "Performance Optimization", "Mastery and Specialization"];
    
    for (let i = 0; i < days; i++) {
      const stageIndex = Math.min(i, stages.length - 1);
      genericPlan.push({
        title: `${subject} ${stages[stageIndex]} - Day ${i+1}`,
        project: `Build a ${subject} project focusing on ${stages[stageIndex].toLowerCase()}`,
        searchTerm: `${subject} ${stages[stageIndex].toLowerCase()} tutorial`
      });
    }
    
    // For generic subjects, we return the plan directly since it's already sized correctly
    topicSet = genericPlan;
  }
  
  // If no match found, default to a general programming path
  if (topicSet.length === 0) {
    console.log('Using default learning path for:', subject);
    const defaultTopics = [
      { title: "Programming Fundamentals", project: "Create a simple command-line application", searchTerm: "programming fundamentals" },
      { title: "Variables and Data Types", project: "Build a data entry and validation system", searchTerm: "programming variables data types" },
      { title: "Control Flow and Logic", project: "Create a decision-making program", searchTerm: "programming control flow logic" },
      { title: "Functions and Modular Code", project: "Build a utility library", searchTerm: "programming functions modules" },
      { title: "Data Structures", project: "Implement common data structures", searchTerm: "programming data structures" },
      { title: "Algorithms and Problem Solving", project: "Solve algorithmic challenges", searchTerm: "programming algorithms problems" },
      { title: "Error Handling and Debugging", project: "Create a robust application with error handling", searchTerm: "programming error handling debugging" },
      { title: "Working with External Data", project: "Build a data processing pipeline", searchTerm: "programming external data APIs" },
      { title: "User Interface Development", project: "Create a simple user interface", searchTerm: "programming user interface" },
      { title: "Software Architecture", project: "Design and implement a complete application", searchTerm: "programming software architecture" }
    ];
    topicSet = defaultTopics;
  }
  
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
  const topicLower = goal.toLowerCase();
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
      const match = goal.match(/[Ll]earn\s+([^\d]+?)(?:\s+in\s+|$)/i);
      if (match && match[1]) {
        extractedSubject = match[1].trim();
        console.log(`Extracted subject from 'learn' pattern: ${extractedSubject}`);
      }
    } else if (topicLower.includes('master')) {
      const match = goal.match(/[Mm]aster\s+([^\d]+?)(?:\s+in\s+|$)/i);
      if (match && match[1]) {
        extractedSubject = match[1].trim();
        console.log(`Extracted subject from 'master' pattern: ${extractedSubject}`);
      }
    }
    
    // If no subject found, check for learning plan directly
    if (!extractedSubject && topicLower.includes('learning plan')) {
      const match = goal.match(/([^\s]+)\s+learning\s+plan/i);
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
  
  return { subject, days };
};

// Compatibility function to replace Gemini API
export const callGeminiAPI = async (userMessage) => {
  try {
    console.log("Chat request received:", userMessage);
    
    // Create a prompt for the Hugging Face model
    const prompt = `You are a helpful AI assistant. Please respond to the following request from a user: "${userMessage}"`;
    
    // Call Hugging Face API using the same function we use for learning plans
    const generatedText = await callHuggingFaceAPI(prompt);
    console.log("Generated chat response successfully");
    
    return generatedText;
  } catch (error) {
    console.error("Error in chat response:", error);
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
    
    // If no subject found, check for learning plan directly
    if (!extractedSubject && topicLower.includes('learning plan')) {
      const match = topic.match(/([^\s]+)\s+learning\s+plan/i);
      if (match && match[1]) {
        extractedSubject = match[1].trim();
        console.log(`Learning plan pattern match: ${extractedSubject}`);
      }
    }
    
    console.log(`Final extracted subject: ${extractedSubject || 'none'}`);
  }
  
  console.log(`Final result: Subject=${subject || 'none'}, Days=${days}`);
  console.log("============ END TESTING ============");
  
  return { subject, days };
};

// Function to format the learning plan response as markdown text for display
const formatLearningPlanResponse = (learningPlan) => {
  // Create markdown text from the learning plan structure
  let markdown = `# ${learningPlan.title}\n\n`;
  
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

// Function to generate a learning plan using Hugging Face API directly
export const generateLearningPlan = async (goal) => {
  try {
    console.log("Generating learning plan for:", goal);
    
    if (!goal.toLowerCase().includes('learn') && !goal.toLowerCase().includes('master') && !goal.toLowerCase().includes('study')) {
      return { success: false, message: "Please specify what you want to learn. For example: 'Learn ReactJS in 30 days'" };
    }
    
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
      
      // Step 2: Enrich each day with YouTube videos
      console.log("Enriching learning plan with YouTube videos");
      const daysWithVideos = await Promise.all(learningPlanDays.map(async (day) => {
        try {
          const videos = await getYoutubeResources(day.youtube_query, 3);
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
      
      // Step 4: Format the learning plan as markdown for display
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
      
      // Enrich with YouTube videos
      console.log("Adding YouTube videos to fallback plan");
      const daysWithVideos = await Promise.all(fallbackDays.map(async (day) => {
        try {
          const videos = await getYoutubeResources(day.youtube_query, 3);
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