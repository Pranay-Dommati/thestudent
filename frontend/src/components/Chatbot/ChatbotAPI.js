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

// 🔹 Generate a mock curated course based on keywords
export const generateMockCourse = (query) => {
  // Detect course topic from query
  const topic = detectTopic(query.toLowerCase());
  
  // Generate mock course structure based on topic
  return {
    id: crypto.randomUUID(),
    title: `Complete ${topic.name} Course`,
    short_description: `Learn ${topic.name} from scratch to advanced concepts`,
    description: `A comprehensive curriculum to master ${topic.name}. This course covers all essential concepts and practical skills needed to become proficient.`,
    thumbnail: topic.image,
    duration: "25",
    sources: "YouTube & Open Source",
    proficiency: "beginner",
    certificate_given: false,
    project_based: true,
    learning_points: topic.learningPoints,
    requirements: topic.requirements,
    category: topic.category,
    last_updated: new Date().toISOString().split('T')[0],
    is_published: true,
    sections: topic.sections
  };
};

// Helper function to detect course topic from query
function detectTopic(query) {
  // Default topic is web development
  const webDev = {
    name: "Web Development",
    category: "webdev",
    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    learningPoints: [
      "Build responsive websites with HTML5 and CSS3",
      "Create interactive web applications using JavaScript",
      "Work with modern frameworks like React",
      "Implement backend functionality with Node.js"
    ],
    requirements: ["Basic computer skills", "Internet connection"],
    sections: [
      {
        id: 1,
        name: "HTML & CSS Fundamentals",
        order: 0,
        subsections: [
          {
            id: 1,
            name: "Getting Started with HTML",
            lessons: [
              {
                id: 1,
                title: "Introduction to HTML",
                type: "video",
                video_url: "<iframe width='560' height='315' src='https://www.youtube.com/embed/UB1O30fR-EE' frameborder='0' allowfullscreen></iframe>"
              },
              {
                id: 2,
                title: "HTML Document Structure",
                type: "video",
                video_url: "<iframe width='560' height='315' src='https://www.youtube.com/embed/9gTw2EDkaDQ' frameborder='0' allowfullscreen></iframe>"
              }
            ]
          },
          {
            id: 2,
            name: "CSS Styling",
            lessons: [
              {
                id: 1,
                title: "CSS Basics",
                type: "video",
                video_url: "<iframe width='560' height='315' src='https://www.youtube.com/embed/yfoY53QXEnI' frameborder='0' allowfullscreen></iframe>"
              }
            ]
          }
        ]
      },
      {
        id: 2,
        name: "JavaScript Essentials",
        order: 1,
        subsections: [
          {
            id: 1,
            name: "JavaScript Fundamentals",
            lessons: [
              {
                id: 1,
                title: "JavaScript Crash Course",
                type: "video",
                video_url: "<iframe width='560' height='315' src='https://www.youtube.com/embed/hdI2bqOjy3c' frameborder='0' allowfullscreen></iframe>"
              }
            ]
          }
        ]
      }
    ]
  };
  
  // Add more topics here as needed
  const topics = {
    "web development": webDev,
    "web dev": webDev,
    "website": webDev,
    "frontend": webDev,
    "html": webDev,
    "css": webDev,
    "react": {
      ...webDev, 
      name: "React",
      image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    },
    "python": {
      name: "Python Programming",
      category: "programming",
      image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      learningPoints: [
        "Master Python syntax and core concepts",
        "Work with libraries like NumPy and Pandas",
        "Build real-world applications",
        "Understand object-oriented programming"
      ],
      requirements: ["No prior programming knowledge required", "Computer with internet access"],
      sections: [
        {
          id: 1,
          name: "Python Basics",
          order: 0,
          subsections: [
            {
              id: 1,
              name: "Getting Started with Python",
              lessons: [
                {
                  id: 1,
                  title: "Python Crash Course",
                  type: "video",
                  video_url: "<iframe width='560' height='315' src='https://www.youtube.com/embed/JJmcL1N2KQs' frameborder='0' allowfullscreen></iframe>"
                }
              ]
            }
          ]
        }
      ]
    }
  };
  
  // Find matching topic
  for (const [key, value] of Object.entries(topics)) {
    if (query.includes(key)) {
      return value;
    }
  }
  
  // Default to web development if no match
  return webDev;
}

// Sample course topics for random selection
const COURSE_TOPICS = [
  {
    name: "Web Development",
    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479",
    tags: ["HTML", "CSS", "JavaScript"]
  },
  {
    name: "Machine Learning",
    image: "https://images.unsplash.com/photo-1555255707-c07966088b7b",
    tags: ["Python", "AI", "Data Science"]
  },
  {
    name: "Mobile Development",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
    tags: ["React Native", "iOS", "Android"]
  }
];

export const callGeminiAPI = async (userMessage) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate random course data
    const topic = COURSE_TOPICS[Math.floor(Math.random() * COURSE_TOPICS.length)];
    
    // Return both chat response and course card
    return {
      type: 'course',
      content: {
        id: crypto.randomUUID(),
        title: `Complete ${topic.name} Course`,
        short_description: `Master ${topic.name} from scratch to advanced level`,
        description: `A comprehensive curriculum to learn ${topic.name}. Perfect for beginners and intermediate learners.`,
        thumbnail: `${topic.image}?w=800&auto=format&fit=crop`,
        duration: "25",
        sources: "Curated from top resources",
        proficiency: "beginner",
        certificate_given: Math.random() > 0.5,
        project_based: true,
        learning_points: [
          `Learn ${topic.name} fundamentals`,
          "Build real-world projects",
          "Master industry best practices",
          "Get hands-on experience"
        ],
        requirements: [
          "Basic computer skills",
          "Internet connection",
          "Enthusiasm to learn"
        ],
        category: topic.name.toLowerCase().replace(" ", "-"),
        last_updated: new Date().toISOString().split('T')[0],
        is_published: true,
        sections: [
          {
            id: 1,
            name: "Getting Started",
            order: 0,
            subsections: [
              {
                id: 1,
                name: "Introduction",
                lessons: [
                  {
                    id: 1,
                    title: `Introduction to ${topic.name}`,
                    type: "video",
                    video_url: "<iframe width='560' height='315' src='https://www.youtube.com/embed/placeholder' frameborder='0' allowfullscreen></iframe>"
                  }
                ]
              }
            ]
          },
          {
            id: 2,
            name: "Core Concepts",
            order: 1,
            subsections: topic.tags.map((tag, index) => ({
              id: index + 1,
              name: tag,
              lessons: [
                {
                  id: 1,
                  title: `${tag} Fundamentals`,
                  type: "video",
                  video_url: "<iframe width='560' height='315' src='https://www.youtube.com/embed/placeholder' frameborder='0' allowfullscreen></iframe>"
                }
              ]
            }))
          }
        ]
      },
      chatResponse: `I've found a great ${topic.name} course for you! This comprehensive course covers everything from basics to advanced concepts. Would you like me to add it to your learning dashboard?`
    };
  } catch (error) {
    console.error("Error in chat response:", error);
    return {
      type: 'text',
      content: "Sorry, I encountered an error processing your request. Please try again."
    };
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
