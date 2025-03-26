import { OpenAI } from "openai";

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
    let searchQuery = query;
    const lowerQuery = query.toLowerCase();

    // 🔍 Match query with predefined categories
    Object.keys(CATEGORY_MAP).forEach((key) => {
      if (lowerQuery.includes(key)) {
        searchQuery = CATEGORY_MAP[key];
        return;
      }
    });

    if (!searchQuery.includes("tutorial") && !searchQuery.includes("course")) {
      searchQuery += " tutorial";
    }

    // 🔹 Build API request
    const params = new URLSearchParams({
      part: "snippet",
      q: searchQuery,
      key: YOUTUBE_API_KEY,
      maxResults: maxResults * 2,
      type: "video",
      videoDefinition: "high",
      relevanceLanguage: "en",
      order: "relevance",
    });

    const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);
    if (!response.ok) throw new Error("YouTube API request failed");

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const filteredResults = data.items
        .filter((video) => {
          const title = video.snippet.title.toLowerCase();
          return (
            !title.includes("shorts") &&
            !title.includes("tiktok") &&
            !title.includes("trailer")
          );
        })
        .slice(0, maxResults);

      return filteredResults.map((video) => ({
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
      return {
        name: `${key.charAt(0).toUpperCase() + key.slice(1)} Documentation`,
        url,
      };
    }
  }
  return null;
};

// 🔹 Fetch open-source courses
export const getOpenSourceCourses = async (topic) => {
  const coursesMap = {
    "machine learning": [
      {
        name: "MIT OpenCourseWare - Machine Learning",
        url: "https://ocw.mit.edu/courses/machine-learning/",
      },
      {
        name: "Fast.ai - Practical Deep Learning",
        url: "https://course.fast.ai/",
      },
    ],
    "data science": [
      {
        name: "Kaggle - Data Science Courses",
        url: "https://www.kaggle.com/learn",
      },
      {
        name: "Harvard - Data Science Online",
        url: "https://cs50.harvard.edu/x/",
      },
    ],
    "web development": [
      {
        name: "freeCodeCamp - Full Stack Development",
        url: "https://www.freecodecamp.org/",
      },
      {
        name: "The Odin Project",
        url: "https://www.theodinproject.com/",
      },
    ],
  };

  return coursesMap[topic.toLowerCase()] || [];
};

// 🔹 Generate structured learning paths using DeepSeek AI
export const callDeepSeekAPI = async (userMessage) => {
  try {
    // DeepSeek API client
    const client = new OpenAI({
      apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
      dangerouslyAllowBrowser: true,
    });

    // System message to enforce structured format
    const messages = [
      {
        role: "system",
        content: `You are an AI that creates *structured learning paths*. 

        *Rules:*
        - Follow the *Web Development Example* format.
        - Divide topics into *Beginner → Intermediate → Advanced* sections.
        - Each section must include:
          1. 📌 Goal
          2. 📖 *Documentation*
          3. 🎥 *YouTube Video*
          4. 🔹 Mini-task  
        - End with a *real-world project*.

        ---  

        ## 🔥 *Example: Web Development Learning Path*  

        ## 1️⃣ HTML & CSS - Foundations  
        📌 Goal: Learn the basics of HTML structure and CSS styling.  

        ### 1.1 HTML Basics  
        - 📖 [MDN HTML Docs](https://developer.mozilla.org/en-US/docs/Web/HTML)  
        - 🎥 [HTML Crash Course by Traversy Media](https://www.youtube.com/watch?v=UB1O30fR-EE)  
        🔹 Mini-task: Create a simple webpage with headings, paragraphs, and lists.  

        ### 1.2 CSS Basics  
        - 📖 [MDN CSS Docs](https://developer.mozilla.org/en-US/docs/Web/CSS)  
        - 🎥 [CSS Crash Course](https://www.youtube.com/watch?v=yfoY53QXEnI)  
        🔹 Mini-task: Style your webpage with colors and fonts.  

        ## 2️⃣ JavaScript - The Brain of Web Pages  
        📌 Goal: Learn JavaScript fundamentals to add interactivity.  

        ### 2.1 JavaScript Basics  
        - 📖 [MDN JavaScript Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)  
        - 🎥 [JavaScript Crash Course](https://www.youtube.com/watch?v=hdI2bqOjy3c)  
        🔹 Mini-task: Create a button that changes text when clicked.  

        ## 3️⃣ Frontend Development - React  
        📌 Goal: Build dynamic UI components using React.  

        ### 3.1 React Basics  
        - 📖 [React Docs](https://react.dev/learn)  
        - 🎥 [React Crash Course](https://www.youtube.com/watch?v=w7ejDZ8SWv8)  
        🔹 Mini-task: Create a counter app in React.  

        ## 4️⃣ Backend Development - Node.js & Express  
        📌 Goal: Learn to build REST APIs using Node.js.  

        ### 4.1 Node.js & Express  
        - 📖 [Node.js Docs](https://nodejs.org/en/docs/)  
        - 🎥 [Node.js Crash Course](https://www.youtube.com/watch?v=Oe421EPjeBE)  
        🔹 Mini-task: Create an API that returns a list of products.  

        ## 🏆 Final Project: Full-Stack Web App  
        - 📌 Goal: Build a *To-Do App* with React, Node.js, and MongoDB.  
        - 🔹 Steps:  
          - Create UI with React  
          - Build API with Node.js  
          - Store tasks in MongoDB  
          - Deploy the app  

        ---  

        *Now, generate a structured learning path for:* ${userMessage}  
        `,
      },
      {
        role: "user",
        content: `Create a structured learning path for: *${userMessage}*  
        
        Ensure it follows the *Web Development Example* format with:
        - *Sections* (Beginner → Intermediate → Advanced)
        - *Goals, Documentation, YouTube videos, and Mini-tasks*
        - *A final real-world project*  
        `,
      },
    ];

    // AI Response
    const response = await client.chat.completions.create({
      model: "deepseek-reasoner",
      messages: messages,
    });

    return response.choices[0]?.message?.content || "No response from DeepSeek";
  } catch (error) {
    console.error("Error generating learning path:", error);
    return "Sorry, I couldn't generate the learning path at this moment.";
  }
};