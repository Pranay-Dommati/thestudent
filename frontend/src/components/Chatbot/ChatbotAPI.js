import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔹 Initialize Gemini API Client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// 🔹 Map user queries to relevant tutorial searches
const CATEGORY_MAP = {
  html: "html tutorial beginner",
  css: "css tutorial for beginners",
  javascript: "javascript fundamentals tutorial",
  react: "react js tutorial for beginners",
  python: "python programming tutorial",
  java: "java programming tutorial",
  "machine learning": "machine learning tutorial for beginners",
  "data science": "data science tutorial",
  "web development": "web development tutorial full stack",
  "mobile development": "mobile app development tutorial",
  database: "database management tutorial",
  sql: "sql tutorial for beginners",
  git: "git and github tutorial",
  devops: "devops tutorial for beginners",
  "cloud computing": "cloud computing basics tutorial",
  cybersecurity: "cybersecurity fundamentals",
};

// 🔹 YouTube API settings
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

// 🔹 Fetch YouTube tutorials
export const getYoutubeResources = async (query, maxResults = 3) => {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      key: YOUTUBE_API_KEY,
      maxResults: maxResults,
      type: "video",
      videoDefinition: "high",
      relevanceLanguage: "en",
      order: "relevance",
    });

    const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);
    if (!response.ok) throw new Error("YouTube API request failed");

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items.map((video) => ({
        title: video.snippet.title,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        thumbnail: video.snippet.thumbnails.default.url,
        channelTitle: video.snippet.channelTitle,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching YouTube resources:", error);
    return [];
  }
};

// 🔹 Fetch official documentation
export const getOfficialDocs = (topic) => {
  const docsMap = {
    html: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    css: "https://developer.mozilla.org/en-US/docs/Web/CSS",
    javascript: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    react: "https://react.dev/learn",
    python: "https://docs.python.org/3/tutorial/",
    java: "https://docs.oracle.com/javase/tutorial/",
    "machine learning": "https://scikit-learn.org/stable/tutorial/",
    "data science": "https://pandas.pydata.org/docs/user_guide/index.html",
    "node.js": "https://nodejs.org/en/docs/",
    sql: "https://www.w3schools.com/sql/",
    git: "https://git-scm.com/doc",
  };

  const lowerTopic = topic.toLowerCase();
  for (const [key, url] of Object.entries(docsMap)) {
    if (lowerTopic.includes(key)) {
      return { name: `${key.charAt(0).toUpperCase() + key.slice(1)} Documentation`, url };
    }
  }
  return null;
};

// 🔹 Fetch open-source courses
export const getOpenSourceCourses = async (topic) => {
  const coursesMap = {
    "machine learning": [
      { name: "MIT OpenCourseWare - Machine Learning", url: "https://ocw.mit.edu/courses/machine-learning/" },
      { name: "Fast.ai - Practical Deep Learning", url: "https://course.fast.ai/" },
    ],
    "data science": [
      { name: "Kaggle - Data Science Courses", url: "https://www.kaggle.com/learn" },
      { name: "Harvard - Data Science Online", url: "https://cs50.harvard.edu/x/" },
    ],
    "web development": [
      { name: "freeCodeCamp - Full Stack Development", url: "https://www.freecodecamp.org/" },
      { name: "The Odin Project", url: "https://www.theodinproject.com/" },
    ],
  };

  return coursesMap[topic.toLowerCase()] || [];
};

// 🔹 Generate structured learning paths using Gemini AI
export const callGeminiAPI = async (userMessage) => {
  try {
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    const prompt = `
You are an AI that creates **structured learning paths** for students.  
**Rules:**  
- Divide topics into **Beginner → Intermediate → Advanced** sections.  
- Each section must include:  
  1. 📌 *Goal*  
  2. 🎥 **YouTube Video**  
  3. 📖 **Documentation**  
  4. 🔹 *Mini-task*  
- End with a **real-world project**.  

**Example Output:**

# 🚀 *Structured Web Development Learning Path*  
✅ *Goal*: Learn step by step with curated resources, mini-projects, and real-world applications.  

## *1️⃣ HTML & CSS - Foundations*  
📌 *Goal*: Learn HTML structure, semantic elements, and CSS styling.  

### *1.1 HTML Basics*  
- 📖 [MDN HTML Docs](https://developer.mozilla.org/en-US/docs/Web/HTML)  
- 🎥 [Traversy Media - HTML Crash Course](https://www.youtube.com/watch?v=UB1O30fR-EE)  
🔹 *Mini-task*: Create a simple webpage with headings, paragraphs, and lists.  

### *1.2 CSS Fundamentals*  
- 📖 [MDN CSS Docs](https://developer.mozilla.org/en-US/docs/Web/CSS)  
- 🎥 [CSS Crash Course](https://www.youtube.com/watch?v=yfoY53QXEnI)  
🔹 *Mini-task*: Style an HTML page using colors, fonts, and margins.  

## Now, generate a structured learning path for: **${userMessage}**`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();

    // Log the raw AI response to the terminal
    const responseText = data.candidates[0]?.content?.parts?.[0]?.text;
    console.log("Raw AI Response:", responseText);

    // Return the raw response for now
    return responseText;
  } catch (error) {
    console.error("Error generating learning path with Gemini:", error);
    return "Sorry, I couldn't generate the learning path at this moment.";
  }
};

// 🔹 Helper function to parse the response text into a structured object
const parseLearningPath = (responseText) => {
  const sections = responseText.split("##").slice(1).map((sectionText) => {
    const [title, ...descriptionLines] = sectionText.trim().split("\n");
    return {
      title: title.trim(),
      description: descriptionLines.join(" ").trim(),
    };
  });

  return {
    title: "Generated Learning Path",
    sections,
  };
};
