import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { 
  IoHome, IoChevronBack, IoPlayCircle, IoBookmark, IoDownload, 
  IoCheckmarkCircle, IoTime, IoEye, IoStar, IoSparkles, IoRocket, 
  IoTrendingUp, IoMenu, IoClose, IoChevronDown, IoShare 
} from "react-icons/io5";
import { 
  FaRobot, FaYoutube, FaGithub, FaFilePdf, FaExternalLinkAlt, 
  FaBookOpen, FaBrain, FaVideo, FaQuestionCircle, FaLink, 
  FaGraduationCap, FaClock, FaUsers, FaChartLine, FaLightbulb,
  FaBolt, FaBullseye, FaCheck, FaTrophy
} from "react-icons/fa";
import { 
  BiLoaderAlt, BiTrophy, BiCode, BiTargetLock, BiCheckShield,
  BiBookReader, BiStats, BiTime, BiPlay
} from "react-icons/bi";
import { 
  HiSparkles, HiAcademicCap, HiLightningBolt, HiFire, 
  HiChartBar, HiLightBulb, HiOutlineSparkles, HiOutlineFire
} from "react-icons/hi";
import { 
  MdOutlineAutoAwesome, MdTrendingUp, MdTimer, MdPlayArrow,
  MdSchool, MdAutoAwesome, MdTimeline, MdExplore
} from "react-icons/md";
import ReactMarkdown from "react-markdown";
import { callGeminiAPI } from "../Chatbot/ChatbotAPI";

const ProLearningPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get("topic") || "Learning Topic";
  
  const [activeTab, setActiveTab] = useState("reading");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Initializing...");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  
  const [content, setContent] = useState({
    reading: "",
    summary: "",
    videos: [],
    quiz: [],
    resources: []
  });
  
  const [stats, setStats] = useState({
    estimatedReadTime: 0,
    totalQuestions: 0,
    totalVideos: 0,
    totalResources: 0,
    difficulty: "Intermediate",
    completionRate: 0
  });

  const tabs = [
    { 
      id: "reading", 
      label: "Reading", 
      icon: FaBookOpen,
      description: "Comprehensive study material",
      color: "blue",
      gradient: "from-blue-500 to-indigo-600"
    },
    { 
      id: "summary", 
      label: "Summary", 
      icon: FaBrain,
      description: "Key points & concepts",
      color: "purple",
      gradient: "from-purple-500 to-pink-600"
    },
    { 
      id: "videos", 
      label: "Videos", 
      icon: FaVideo,
      description: "Curated video content",
      color: "red",
      gradient: "from-red-500 to-pink-600"
    },
    { 
      id: "quiz", 
      label: "Quiz", 
      icon: FaQuestionCircle,
      description: "Test your knowledge",
      color: "green",
      gradient: "from-green-500 to-emerald-600"
    },
    { 
      id: "resources", 
      label: "Resources", 
      icon: FaLink,
      description: "Additional materials",
      color: "orange",
      gradient: "from-orange-500 to-amber-600"
    }
  ];

  useEffect(() => {
    if (topic) {
      generateProContent();
    }
  }, [topic]);

  const generateProContent = async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setShowSkeletons(true);
    
    try {
      // Generate comprehensive content for all sections with progress updates
      setLoadingStep("📘 Generating comprehensive reading material...");
      setLoadingProgress(10);
      await generateReadingContent();
      
      setLoadingStep("🧠 Creating summary and key points...");
      setLoadingProgress(30);
      await generateSummaryContent();
      
      setLoadingStep("🎥 Finding best educational videos...");
      setLoadingProgress(50);
      await generateVideosContent();
      
      setLoadingStep("✅ Designing interactive quiz questions...");
      setLoadingProgress(70);
      await generateQuizContent();
      
      setLoadingStep("📚 Curating additional learning resources...");
      setLoadingProgress(85);
      await generateResourcesContent();
      
      setLoadingStep("✨ Finalizing your learning experience...");
      setLoadingProgress(95);
      
      // Calculate stats with enhanced metrics
      const readingWordCount = content.reading.split(' ').length;
      setStats({
        estimatedReadTime: Math.ceil(readingWordCount / 200),
        totalQuestions: content.quiz.length,
        totalVideos: content.videos.length,
        totalResources: content.resources.length,
        difficulty: readingWordCount > 1500 ? "Advanced" : readingWordCount > 800 ? "Intermediate" : "Beginner",
        completionRate: 0
      });
      
      setLoadingProgress(100);
      
    } catch (error) {
      console.error("Error generating pro content:", error);
      setLoadingStep("❌ Error loading content. Please refresh and try again.");
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setShowSkeletons(false);
      }, 1500); // Smoother transition
    }
  };

  const generateReadingContent = async () => {
    try {
      const prompt = `Generate a comprehensive technical educational article about "${topic}".

STRUCTURE REQUIRED:
# ${topic} - Complete Technical Guide

## 1. Introduction and Overview
- Clear definition and explanation
- Why this topic is important
- Brief history and evolution

## 2. Fundamental Concepts
- Core principles and theory
- Key terminology and definitions
- Basic building blocks

## 3. Technical Specifications and Details
- Technical architecture/structure
- Important features and characteristics
- How it works under the hood

## 4. Practical Implementation
- Step-by-step examples with code
- Common patterns and best practices
- Real-world implementation details

## 5. Advanced Concepts
- Complex scenarios and use cases
- Performance considerations
- Advanced techniques and optimization

## 6. Real-World Applications
- Industry use cases
- Popular frameworks/tools
- Case studies and examples

## 7. Best Practices and Common Pitfalls
- Do's and don'ts
- Common mistakes to avoid
- Professional recommendations

REQUIREMENTS:
- Use proper markdown formatting with headers, subheaders, lists
- Include code examples where relevant (wrap in \`\`\` blocks)
- Add practical examples and explanations
- Make it comprehensive and educational
- Use professional technical writing style
- Include at least 1500 words of detailed content

Write this as a complete technical educational article that a student or professional could use to master ${topic}.`;
      
      const response = await callGeminiAPI(prompt, { createCourse: false });
      
      // If response is generic or too short, try a more specific prompt
      if (response.length < 500 || response.includes("I recommend checking") || response.includes("limited")) {
        const fallbackPrompt = `Write a detailed technical tutorial about ${topic}. Include:

## What is ${topic}?
${topic} is a fundamental technology used in...

## Core Concepts
The main principles include:
- Concept 1: Explanation with examples
- Concept 2: Explanation with examples  
- Concept 3: Explanation with examples

## Technical Implementation
Here's how to implement ${topic}:
\`\`\`
// Code example here
\`\`\`

## Best Practices
1. Practice 1 - explanation
2. Practice 2 - explanation
3. Practice 3 - explanation

## Real-World Applications
${topic} is used in:
- Application 1: Description
- Application 2: Description
- Application 3: Description

Write at least 1000 words with technical depth and practical examples.`;
        
        const fallbackResponse = await callGeminiAPI(fallbackPrompt, { createCourse: false });
        setContent(prev => ({ ...prev, reading: fallbackResponse }));
      } else {
        setContent(prev => ({ ...prev, reading: response }));
      }
    } catch (error) {
      console.error("Error generating reading content:", error);
      // Provide a comprehensive fallback
      const fallbackContent = `# ${topic} - Complete Technical Guide

## 1. Introduction and Overview

${topic} represents a fundamental technology in modern development. This comprehensive guide will provide you with deep technical knowledge and practical implementation skills.

## 2. Core Concepts and Principles

### Key Fundamentals
- **Concept 1**: Core principle that forms the foundation
- **Concept 2**: Essential building block for implementation
- **Concept 3**: Advanced feature for optimization

### Technical Architecture
The underlying structure follows these principles:
1. Modular design approach
2. Scalable implementation patterns
3. Performance-optimized execution

## 3. Technical Implementation

### Basic Implementation
\`\`\`javascript
// Example implementation
const example = {
  property1: 'value1',
  property2: 'value2',
  method: function() {
    return 'implementation details';
  }
};
\`\`\`

### Advanced Techniques
\`\`\`javascript
// Advanced pattern
class AdvancedImplementation {
  constructor(options) {
    this.options = options;
    this.initialize();
  }
  
  initialize() {
    // Setup and configuration
  }
  
  execute() {
    // Main execution logic
  }
}
\`\`\`

## 4. Real-World Applications

### Industry Use Cases
- **Web Development**: Frontend and backend implementations
- **Mobile Applications**: Cross-platform solutions
- **Enterprise Systems**: Large-scale deployments

### Popular Frameworks and Tools
1. Framework A - Description and use cases
2. Framework B - Description and use cases
3. Tool C - Description and use cases

## 5. Best Practices

### Performance Optimization
- Optimize for speed and efficiency
- Implement caching strategies
- Use lazy loading techniques

### Security Considerations
- Validate all inputs
- Implement proper authentication
- Use encryption for sensitive data

### Code Quality
- Follow naming conventions
- Write comprehensive documentation
- Implement proper error handling

## 6. Common Pitfalls and Solutions

### Mistake 1: Improper Implementation
**Problem**: Description of the issue
**Solution**: Proper approach and code example

### Mistake 2: Performance Issues
**Problem**: Description of the issue
**Solution**: Optimization techniques

### Mistake 3: Security Vulnerabilities
**Problem**: Description of the issue
**Solution**: Security best practices

## 7. Advanced Topics

### Scalability Considerations
- Horizontal vs vertical scaling
- Load balancing strategies
- Database optimization

### Integration Patterns
- API design principles
- Microservices architecture
- Event-driven systems

## 8. Future Trends and Evolution

The technology continues to evolve with:
- Emerging standards and specifications
- New tools and frameworks
- Industry adoption trends

## Conclusion

${topic} is a powerful technology that requires understanding of both theoretical concepts and practical implementation. By following the principles and practices outlined in this guide, you'll be able to effectively implement and optimize solutions.`;

      setContent(prev => ({ ...prev, reading: fallbackContent }));
    }
  };

  const generateSummaryContent = async () => {
    try {
      const prompt = `Create a comprehensive summary for "${topic}" in the following format:

# ${topic} - Quick Reference Summary

## 🔑 Key Definitions
• **Definition 1**: Clear explanation
• **Definition 2**: Clear explanation  
• **Definition 3**: Clear explanation

## 💡 Core Concepts
• **Concept 1**: Brief but complete explanation
• **Concept 2**: Brief but complete explanation
• **Concept 3**: Brief but complete explanation

## ⚙️ Technical Specifications
• **Feature 1**: Technical details
• **Feature 2**: Technical details
• **Feature 3**: Technical details

## 🎯 Common Use Cases
• **Use Case 1**: When and why to use
• **Use Case 2**: When and why to use
• **Use Case 3**: When and why to use

## ⚠️ Common Pitfalls
• **Pitfall 1**: What to avoid and why
• **Pitfall 2**: What to avoid and why
• **Pitfall 3**: What to avoid and why

## 🏆 Best Practices
• **Practice 1**: Recommendation with reasoning
• **Practice 2**: Recommendation with reasoning
• **Practice 3**: Recommendation with reasoning

## 📊 Quick Comparison (if applicable)
| Feature | Option A | Option B |
|---------|----------|----------|
| Aspect 1| Details  | Details  |
| Aspect 2| Details  | Details  |

Make this comprehensive and suitable for quick revision. Include specific details, not generic statements.`;
      
      const response = await callGeminiAPI(prompt, { createCourse: false });
      setContent(prev => ({ ...prev, summary: response }));
    } catch (error) {
      console.error("Error generating summary content:", error);
      
      // Comprehensive fallback summary
      const fallbackSummary = `# ${topic} - Quick Reference Summary

## 🔑 Key Definitions
• **${topic}**: A fundamental technology/concept used for building and implementing solutions
• **Core Architecture**: The underlying structure and design principles
• **Implementation**: The practical application and execution methods

## 💡 Core Concepts
• **Modularity**: Breaking down complex systems into manageable components
• **Scalability**: Designing solutions that can grow and adapt
• **Performance**: Optimizing for speed, efficiency, and resource usage
• **Maintainability**: Writing clean, documented, and testable code

## ⚙️ Technical Specifications
• **Syntax**: Follows standard conventions and best practices
• **Compatibility**: Works across different platforms and environments
• **Dependencies**: Minimal external requirements for implementation
• **Performance**: Optimized execution with efficient resource usage

## 🎯 Common Use Cases
• **Web Development**: Frontend user interfaces and backend services
• **Mobile Applications**: Cross-platform mobile solutions
• **Enterprise Systems**: Large-scale business applications
• **Data Processing**: Handling and manipulating information

## ⚠️ Common Pitfalls
• **Overengineering**: Adding unnecessary complexity to simple solutions
• **Performance Issues**: Not optimizing for scale and efficiency
• **Security Gaps**: Failing to implement proper security measures
• **Poor Documentation**: Insufficient comments and documentation

## 🏆 Best Practices
• **Code Organization**: Structure code logically with clear separation of concerns
• **Error Handling**: Implement comprehensive error checking and recovery
• **Testing**: Write unit tests and integration tests for reliability
• **Documentation**: Maintain clear documentation and comments

## 📊 Key Advantages
| Aspect | Benefit | Impact |
|--------|---------|--------|
| Performance | Fast execution | Better user experience |
| Scalability | Handles growth | Future-proof solutions |
| Maintainability | Easy updates | Reduced development time |
| Security | Protected data | User trust and compliance |`;

      setContent(prev => ({ ...prev, summary: fallbackSummary }));
    }
  };

  const generateVideosContent = async () => {
    try {
      const prompt = `You are an expert technical educator and curriculum designer.

Given the topic: **${topic}**

Generate the 🎥 **Videos** section only. List the top 5 most relevant YouTube videos about **${topic}**. For each video, provide:
- Title (realistic and specific)
- Channel name
- Estimated view count
- Duration
- Why it's relevant or recommended
- Rating (4.5-5.0)

Format as a structured list with all details. Make the video titles and channels realistic and educational.`;
      
      const aiResponse = await callGeminiAPI(prompt, { createCourse: false });
      
      // Parse AI response and create video objects
      const videoLines = aiResponse.split('\n').filter(line => line.trim());
      const videos = [];
      let currentVideo = {};
      
      videoLines.forEach(line => {
        if (line.includes('Title:') || line.includes('**Title:**')) {
          if (Object.keys(currentVideo).length > 0) {
            videos.push(currentVideo);
          }
          currentVideo = {
            id: videos.length + 1,
            title: line.replace(/.*Title:\*?\*?|Title:|[**]/g, '').trim(),
            channel: "Educational Channel",
            duration: "15:30",
            views: "1.2M",
            rating: "4.8",
            thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(currentVideo.title || topic)}`
          };
        } else if (line.includes('Channel:') && currentVideo.title) {
          currentVideo.channel = line.replace(/.*Channel:\*?\*?|Channel:|[**]/g, '').trim();
        } else if (line.includes('Views:') && currentVideo.title) {
          currentVideo.views = line.replace(/.*Views:\*?\*?|Views:|[**]/g, '').trim();
        } else if (line.includes('Duration:') && currentVideo.title) {
          currentVideo.duration = line.replace(/.*Duration:\*?\*?|Duration:|[**]/g, '').trim();
        } else if (line.includes('Rating:') && currentVideo.title) {
          currentVideo.rating = line.replace(/.*Rating:\*?\*?|Rating:|[**]/g, '').trim();
        }
      });
      
      // Add the last video
      if (Object.keys(currentVideo).length > 0) {
        videos.push(currentVideo);
      }
      
      // Fallback to default videos if parsing fails
      if (videos.length === 0) {
        const defaultVideos = [
          {
            id: 1,
            title: `${topic} - Complete Tutorial and Explanation`,
            channel: "Educational Channel",
            duration: "15:30",
            views: "1.2M",
            rating: "4.8",
            thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " tutorial")}`
          },
          {
            id: 2, 
            title: `Understanding ${topic} - Practical Applications`,
            channel: "Tech Education",
            duration: "22:45",
            views: "856K",
            rating: "4.7",
            thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " applications")}`
          },
          {
            id: 3,
            title: `${topic} Fundamentals and Advanced Concepts`,
            channel: "Engineering Hub",
            duration: "18:20",
            views: "623K", 
            rating: "4.9",
            thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " fundamentals")}`
          }
        ];
        setContent(prev => ({ ...prev, videos: defaultVideos }));
      } else {
        setContent(prev => ({ ...prev, videos: videos.slice(0, 5) }));
      }
      
    } catch (error) {
      console.error("Error generating videos content:", error);
      setContent(prev => ({ ...prev, videos: [] }));
    }
  };

  const generateQuizContent = async () => {
    try {
      const prompt = `Create 5 professional multiple-choice questions about "${topic}". 

Format each question exactly like this:

QUESTION 1
What is the primary purpose of ${topic}?
A) Option A with specific technical detail
B) Option B with specific technical detail  
C) Option C with specific technical detail
D) Option D with specific technical detail
CORRECT: A
EXPLANATION: Detailed explanation of why A is correct and why others are wrong.

QUESTION 2
Which statement about ${topic} is most accurate?
A) Technical statement A
B) Technical statement B
C) Technical statement C  
D) Technical statement D
CORRECT: B
EXPLANATION: Detailed technical explanation.

Continue this format for all 5 questions. Make questions challenging but fair, covering different aspects: basics, implementation, best practices, common issues, and advanced concepts.`;
      
      const aiResponse = await callGeminiAPI(prompt, { createCourse: false });
      
      // Enhanced parsing logic
      const questions = [];
      const questionBlocks = aiResponse.split(/QUESTION \d+/);
      
      questionBlocks.forEach((block, index) => {
        if (index === 0) return; // Skip first empty element
        
        const lines = block.trim().split('\n').filter(line => line.trim());
        if (lines.length < 6) return;
        
        let questionText = '';
        const options = [];
        let correctAnswer = 0;
        let explanation = '';
        
        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();
          
          if (lineIndex === 0 && !trimmedLine.match(/^[A-D]\)/)) {
            questionText = trimmedLine;
          } else if (trimmedLine.match(/^[A-D]\)/)) {
            const optionText = trimmedLine.substring(2).trim();
            options.push(optionText);
          } else if (trimmedLine.startsWith('CORRECT:')) {
            const correctLetter = trimmedLine.replace('CORRECT:', '').trim();
            correctAnswer = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0);
          } else if (trimmedLine.startsWith('EXPLANATION:')) {
            explanation = trimmedLine.replace('EXPLANATION:', '').trim();
          } else if (lineIndex > 0 && !questionText && !trimmedLine.match(/^[A-D]\)/)) {
            questionText = trimmedLine;
          }
        });
        
        if (questionText && options.length === 4) {
          questions.push({
            id: index,
            question: questionText,
            options: options,
            correct: Math.max(0, Math.min(3, correctAnswer)),
            explanation: explanation || `The correct answer demonstrates a key principle of ${topic}.`,
            userAnswer: null
          });
        }
      });
      
      // Enhanced fallback questions if parsing fails
      if (questions.length === 0) {
        const fallbackQuestions = [
          {
            id: 1,
            question: `What is the primary advantage of using ${topic} in modern development?`,
            options: [
              "Improved performance and efficiency",
              "Reduced development complexity",
              "Better cross-platform compatibility", 
              "Enhanced security features"
            ],
            correct: 0,
            explanation: `${topic} primarily offers improved performance and efficiency, making it the preferred choice for modern applications.`,
            userAnswer: null
          },
          {
            id: 2,
            question: `Which best practice is most important when implementing ${topic}?`,
            options: [
              "Always use the latest version",
              "Follow established design patterns",
              "Minimize code comments",
              "Avoid third-party libraries"
            ],
            correct: 1,
            explanation: `Following established design patterns ensures maintainable, scalable, and reliable implementations of ${topic}.`,
            userAnswer: null
          },
          {
            id: 3,
            question: `What is the most common mistake developers make with ${topic}?`,
            options: [
              "Using too many external dependencies",
              "Not implementing proper error handling", 
              "Over-optimizing for performance",
              "Writing excessive documentation"
            ],
            correct: 1,
            explanation: `Proper error handling is crucial for robust applications using ${topic}, and its absence is a common source of production issues.`,
            userAnswer: null
          },
          {
            id: 4,
            question: `In which scenario would ${topic} be most beneficial?`,
            options: [
              "Small prototype applications",
              "Large-scale enterprise systems",
              "Simple static websites",
              "Basic data storage needs"
            ],
            correct: 1,
            explanation: `${topic} shows its greatest value in large-scale enterprise systems where its features and capabilities can be fully utilized.`,
            userAnswer: null
          },
          {
            id: 5,
            question: `What should be prioritized when optimizing ${topic} implementations?`,
            options: [
              "Code readability over performance",
              "Performance over maintainability",
              "Balance between performance and maintainability",
              "Quick implementation over best practices"
            ],
            correct: 2,
            explanation: `The best approach is to balance performance and maintainability, ensuring both efficient execution and long-term code sustainability.`,
            userAnswer: null
          }
        ];
        setContent(prev => ({ ...prev, quiz: fallbackQuestions }));
      } else {
        setContent(prev => ({ ...prev, quiz: questions.slice(0, 5) }));
      }
      
    } catch (error) {
      console.error("Error generating quiz content:", error);
      setContent(prev => ({ ...prev, quiz: [] }));
    }
  };

  const generateResourcesContent = async () => {
    try {
      const prompt = `You are an expert technical educator and curriculum designer.

Given the topic: **${topic}**

Generate the 📚 **Resources** section only. List 5+ external resources to go deeper into the topic. Include:
- Free learning platforms (e.g., MDN, freeCodeCamp, GeeksforGeeks, etc.)
- PDF guides or docs
- GitHub projects or playgrounds  
- Practice project ideas (if applicable)
- Official documentation
- Research papers or academic sources

For each resource, provide:
- Title
- Type (documentation, course, tutorial, project, etc.)
- Description (why it's useful)
- URL or where to find it

Format as a structured list with clear categories.`;
      
      const aiResponse = await callGeminiAPI(prompt, { createCourse: false });
      
      // Parse AI response and create resource objects
      const resourceLines = aiResponse.split('\n').filter(line => line.trim());
      const resources = [];
      let currentResource = {};
      
      resourceLines.forEach(line => {
        if (line.includes('Title:') || line.includes('**Title:**') || line.match(/^\d+\./)) {
          if (Object.keys(currentResource).length > 0) {
            resources.push(currentResource);
          }
          currentResource = {
            id: resources.length + 1,
            title: line.replace(/.*Title:\*?\*?|Title:|[**]|\d+\./g, '').trim(),
            type: "documentation",
            description: "Comprehensive resource for learning and reference",
            url: `https://www.google.com/search?q=${encodeURIComponent(topic + " " + (currentResource.title || ""))}`,
            icon: FaFilePdf
          };
        } else if (line.includes('Type:') && currentResource.title) {
          const type = line.replace(/.*Type:\*?\*?|Type:|[**]/g, '').trim().toLowerCase();
          currentResource.type = type;
          // Set appropriate icon based on type
          if (type.includes('github') || type.includes('code') || type.includes('project')) {
            currentResource.icon = FaGithub;
          } else if (type.includes('course') || type.includes('tutorial')) {
            currentResource.icon = FaExternalLinkAlt;
          } else {
            currentResource.icon = FaFilePdf;
          }
        } else if (line.includes('Description:') && currentResource.title) {
          currentResource.description = line.replace(/.*Description:\*?\*?|Description:|[**]/g, '').trim();
        } else if (line.includes('URL:') && currentResource.title) {
          const url = line.replace(/.*URL:\*?\*?|URL:|[**]/g, '').trim();
          if (url.startsWith('http')) {
            currentResource.url = url;
          }
        }
      });
      
      // Add the last resource
      if (Object.keys(currentResource).length > 0) {
        resources.push(currentResource);
      }
      
      // Fallback to default resources if parsing fails
      if (resources.length === 0) {
        const defaultResources = [
          {
            id: 1,
            title: `${topic} - Official Documentation`,
            type: "documentation",
            url: `https://www.google.com/search?q=${encodeURIComponent(topic + " documentation")}`,
            description: "Official technical documentation and specifications",
            icon: FaFilePdf
          },
          {
            id: 2,
            title: `${topic} - GitHub Repository`,
            type: "code",
            url: `https://github.com/search?q=${encodeURIComponent(topic)}`,
            description: "Open source implementations and examples",
            icon: FaGithub
          },
          {
            id: 3,
            title: `${topic} - Research Papers`,
            type: "research",
            url: `https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}`,
            description: "Academic papers and research studies",
            icon: FaFilePdf
          },
          {
            id: 4,
            title: `${topic} - Online Course`,
            type: "course",
            url: `https://www.coursera.org/search?query=${encodeURIComponent(topic)}`,
            description: "Structured online learning course",
            icon: FaExternalLinkAlt
          }
        ];
        setContent(prev => ({ ...prev, resources: defaultResources }));
      } else {
        setContent(prev => ({ ...prev, resources: resources.slice(0, 6) }));
      }
      
    } catch (error) {
      console.error("Error generating resources content:", error);
      setContent(prev => ({ ...prev, resources: [] }));
    }
  };

  const handleQuizAnswer = (questionId, answerIndex) => {
    setContent(prev => ({
      ...prev,
      quiz: prev.quiz.map(q => 
        q.id === questionId ? { ...q, userAnswer: answerIndex } : q
      )
    }));
    
    // Calculate score and update stats
    const updatedQuiz = content.quiz.map(q => 
      q.id === questionId ? { ...q, userAnswer: answerIndex } : q
    );
    const correctAnswers = updatedQuiz.filter(q => q.userAnswer === q.correct).length;
    const answeredQuestions = updatedQuiz.filter(q => q.userAnswer !== null).length;
    
    setQuizScore(correctAnswers);
    
    // Show results if all questions answered
    if (answeredQuestions === content.quiz.length) {
      setTimeout(() => setShowQuizResults(true), 500);
    }
  };

  const restartQuiz = () => {
    setContent(prev => ({
      ...prev,
      quiz: prev.quiz.map(q => ({ ...q, userAnswer: null }))
    }));
    setQuizScore(0);
    setCurrentQuestionIndex(0);
    setShowQuizResults(false);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < content.quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    // Here you could save to localStorage or send to backend
  };

  // Enhanced loading component
  const LoadingComponent = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 opacity-50"></div>
          
          {/* Main loading icon */}
          <div className="relative z-10 mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BiLoaderAlt className="text-2xl text-white animate-spin" />
            </div>
            {/* Floating particles */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="flex space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">
            Creating Your Learning Experience
          </h3>
          
          <p className="text-sm text-gray-600 mb-6 relative z-10">
            Generating materials for <span className="font-semibold text-blue-600">{topic}</span>
          </p>

          {/* Enhanced progress bar */}
          <div className="mb-6 relative z-10">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="font-medium">{loadingStep.replace(/[📘🧠🎥✅📚✨❌]/g, '').trim()}</span>
              <span className="font-bold text-blue-600">{loadingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{width: `${loadingProgress}%`}}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Enhanced status indicators */}
          <div className="flex justify-center space-x-3 mb-4 relative z-10">
            {tabs.slice(0, 5).map((tab, index) => {
              const IconComponent = tab.icon;
              const isCompleted = loadingProgress > (index + 1) * 20;
              const isActive = loadingProgress >= index * 20 && loadingProgress <= (index + 1) * 20;
              
              return (
                <div key={tab.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110' 
                      : isActive
                        ? 'bg-gradient-to-br from-blue-400 to-purple-600 text-white animate-pulse scale-105'
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <FaCheck className="text-xs" />
                    ) : (
                      <IconComponent className="text-xs" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 transition-colors ${
                    isCompleted ? 'text-green-600 font-medium' : 
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}>
                    {tab.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="text-xs text-gray-400 relative z-10">
            Powered by AI • Personalized Content
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return <LoadingComponent />;
    }

    switch (activeTab) {
      case "reading":
        return (
          <div className="max-w-none">
            {/* Compact Reading Header */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaBookOpen className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Reading Material</h2>
                    <p className="text-sm text-gray-600">Comprehensive study content</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs text-gray-600">
                  <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
                    <BiTime className="mr-1 text-blue-500" />
                    <span>{stats.estimatedReadTime}m read</span>
                  </div>
                  <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
                    <FaBullseye className="mr-1 text-purple-500" />
                    <span>{stats.difficulty}</span>
                  </div>
                  <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                    <IoBookmark className="mr-1" />
                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Enhanced Content with better typography */}
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown 
                components={{
                  h1: ({children}) => (
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {children}
                    </h1>
                  ),
                  h2: ({children}) => (
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8 flex items-center">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6 flex items-center">
                      <FaLightbulb className="text-yellow-500 mr-2" />
                      {children}
                    </h3>
                  ),
                  p: ({children}) => (
                    <p className="text-gray-700 leading-relaxed mb-4 text-base">
                      {children}
                    </p>
                  ),
                  code: ({children}) => (
                    <code className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-2 py-1 rounded-md text-sm font-mono border">
                      {children}
                    </code>
                  ),
                  pre: ({children}) => (
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto mb-6 shadow-lg border">
                      <div className="flex items-center justify-between mb-2 text-xs">
                        <span className="text-gray-400">Code</span>
                        <button className="text-gray-400 hover:text-white">
                          <IoShare />
                        </button>
                      </div>
                      <pre className="text-sm">{children}</pre>
                    </div>
                  ),
                  ul: ({children}) => <ul className="space-y-2 mb-6 ml-6">{children}</ul>,
                  li: ({children}) => (
                    <li className="flex items-start text-gray-700">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <span>{children}</span>
                    </li>
                  ),
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-6 py-4 my-6 rounded-r-lg">
                      <div className="flex items-start">
                        <FaLightbulb className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                        <div className="text-blue-800 italic">{children}</div>
                      </div>
                    </blockquote>
                  )
                }}
              >
                {content.reading}
              </ReactMarkdown>
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="max-w-none">
            {/* Compact Summary Header */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaBrain className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Quick Summary</h2>
                    <p className="text-sm text-gray-600">Key points and concepts</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-purple-600 font-medium">Quick Review</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaBolt className="text-yellow-500 mr-1" />
                    <span>5-min read</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Summary Content */}
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown 
                components={{
                  h1: ({children}) => (
                    <h1 className="text-3xl font-bold mb-6 pb-4 border-b-2 border-purple-200 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {children}
                    </h1>
                  ),
                  h2: ({children}) => (
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8 flex items-center">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-3"></div>
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6">
                      {children}
                    </h3>
                  ),
                  p: ({children}) => (
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({children}) => <ul className="space-y-3 mb-6 ml-6">{children}</ul>,
                  li: ({children}) => (
                    <li className="flex items-start text-gray-700">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <span className="leading-relaxed">{children}</span>
                    </li>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto my-6">
                      <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({children}) => (
                    <th className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-100">
                      {children}
                    </td>
                  )
                }}
              >
                {content.summary}
              </ReactMarkdown>
            </div>
          </div>
        );

      case "videos":
        return (
          <div>
            {/* Compact Videos Header */}
            <div className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaVideo className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Video Learning</h2>
                    <p className="text-sm text-gray-600">Curated educational content</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-red-600 font-medium">{content.videos.length} videos</span>
                  </div>
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-gray-600">HD Quality</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaYoutube className="text-red-500 mr-1" />
                    <span>YouTube Curated</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Video Grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
              {content.videos.map((video, index) => (
                <div key={video.id} className="group bg-white border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  <div className="flex flex-col lg:flex-row">
                    {/* Video Thumbnail */}
                    <div className="relative lg:w-80 h-48 lg:h-auto overflow-hidden">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <IoPlayCircle className="text-red-500 text-2xl ml-1" />
                        </div>
                      </div>
                      {/* Duration badge */}
                      <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded-lg text-sm font-medium">
                        {video.duration}
                      </div>
                      {/* Quality badge */}
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        HD
                      </div>
                    </div>
                    
                    {/* Video Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-red-600 transition-colors">
                          {video.title}
                        </h3>
                        <div className="ml-4 flex-shrink-0">
                          <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                            <IoStar className="text-yellow-500 mr-1" />
                            <span className="text-sm font-semibold text-yellow-700">{video.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-600 mb-4">
                        <FaYoutube className="text-red-500 mr-2" />
                        <span className="font-medium">{video.channel}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <IoEye className="mr-1" />
                            <span>{video.views} views</span>
                          </div>
                          <div className="flex items-center">
                            <BiTime className="mr-1" />
                            <span>{video.duration}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-3">
                        <a 
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <IoPlayCircle className="mr-2" />
                          Watch Now
                        </a>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <IoBookmark className="text-lg" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                          <IoShare className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Video learning tips */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <FaLightbulb className="text-yellow-500 mr-3 text-xl" />
                <h3 className="text-lg font-semibold text-gray-900">Video Learning Tips</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Take notes while watching</span>
                </div>
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Practice along with examples</span>
                </div>
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Pause and replay difficult sections</span>
                </div>
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Apply concepts immediately</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "quiz":
        const answeredQuestions = content.quiz.filter(q => q.userAnswer !== null).length;
        const correctAnswers = content.quiz.filter(q => q.userAnswer === q.correct).length;
        const quizProgress = (answeredQuestions / content.quiz.length) * 100;
        
        return (
          <div>
            {/* Compact Quiz Header */}
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaQuestionCircle className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Knowledge Quiz</h2>
                    <p className="text-sm text-gray-600">Test your understanding</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-green-600 font-medium">{content.quiz.length} questions</span>
                  </div>
                  {answeredQuestions > 0 && (
                    <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                      <span className="text-gray-600">{correctAnswers}/{answeredQuestions} correct</span>
                    </div>
                  )}
                  {answeredQuestions === content.quiz.length && (
                    <button 
                      onClick={restartQuiz}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Restart Quiz
                    </button>
                  )}
                </div>
              </div>
              
              {/* Compact Quiz Progress */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-600">Progress: {Math.round(quizProgress)}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500"
                  style={{width: `${quizProgress}%`}}
                />
              </div>
            </div>
            
            {/* Quiz Questions */}
            <div className="space-y-6">
              {content.quiz.map((question, index) => {
                const isAnswered = question.userAnswer !== null;
                const isCorrect = question.userAnswer === question.correct;
                
                return (
                  <div key={question.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    {/* Question Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white mr-4 ${
                            isAnswered 
                              ? isCorrect 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                                : 'bg-gradient-to-br from-red-500 to-pink-600'
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Question {index + 1} of {content.quiz.length}</span>
                            {isAnswered && (
                              <div className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block ${
                                isCorrect 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isAnswered && (
                          <div className="text-right">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCorrect ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {isCorrect ? (
                                <FaCheck className="text-green-600" />
                              ) : (
                                <span className="text-red-600 font-bold">×</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
                        {question.question}
                      </h3>
                    </div>
                    
                    {/* Answer Options */}
                    <div className="p-6">
                      <div className="space-y-3 mb-6">
                        {question.options.map((option, optionIndex) => {
                          let buttonStyle = "border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700";
                          let iconStyle = "border-gray-300 text-gray-600";
                          
                          if (isAnswered) {
                            if (optionIndex === question.correct) {
                              buttonStyle = "border-2 border-green-500 bg-green-50 text-green-800";
                              iconStyle = "border-green-500 bg-green-500 text-white";
                            } else if (question.userAnswer === optionIndex) {
                              buttonStyle = "border-2 border-red-500 bg-red-50 text-red-800";
                              iconStyle = "border-red-500 bg-red-500 text-white";
                            } else {
                              buttonStyle = "border-2 border-gray-200 bg-gray-50 text-gray-500";
                              iconStyle = "border-gray-300 text-gray-400";
                            }
                          } else if (question.userAnswer === optionIndex) {
                            buttonStyle = "border-2 border-blue-500 bg-blue-50 text-blue-800";
                            iconStyle = "border-blue-500 bg-blue-500 text-white";
                          }
                          
                          return (
                            <button
                              key={optionIndex}
                              onClick={() => handleQuizAnswer(question.id, optionIndex)}
                              disabled={isAnswered}
                              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${buttonStyle} ${
                                isAnswered ? 'cursor-default' : 'cursor-pointer transform hover:scale-[1.02]'
                              }`}
                            >
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold text-sm transition-all duration-200 ${iconStyle}`}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </div>
                                <span className="font-medium leading-relaxed">{option}</span>
                                {isAnswered && optionIndex === question.correct && (
                                  <div className="ml-auto">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <FaCheck className="text-white text-xs" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Explanation */}
                      {isAnswered && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-start">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <HiLightBulb className="text-white text-sm" />
                            </div>
                            <div>
                              <div className="font-semibold text-blue-800 mb-2">Explanation</div>
                              <p className="text-blue-700 leading-relaxed">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Quiz Summary */}
              {answeredQuestions === content.quiz.length && (
                <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-2xl p-8 text-center shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FaTrophy className="text-white text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h3>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {correctAnswers}/{content.quiz.length}
                  </div>
                  <p className="text-gray-600 mb-4">
                    Score: {((correctAnswers / content.quiz.length) * 100).toFixed(0)}%
                  </p>
                  
                  {/* Performance message */}
                  <div className="mb-6">
                    {((correctAnswers / content.quiz.length) * 100) >= 80 ? (
                      <div className="bg-green-100 border border-green-300 rounded-xl p-4">
                        <p className="text-green-800 font-medium">🎉 Excellent work! You have a strong understanding of {topic}.</p>
                      </div>
                    ) : ((correctAnswers / content.quiz.length) * 100) >= 60 ? (
                      <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4">
                        <p className="text-yellow-800 font-medium">👍 Good job! Review the explanations to strengthen your knowledge.</p>
                      </div>
                    ) : (
                      <div className="bg-blue-100 border border-blue-300 rounded-xl p-4">
                        <p className="text-blue-800 font-medium">📚 Keep learning! Consider reviewing the reading material and trying again.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button 
                      onClick={restartQuiz}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <IoRocket className="mr-2" />
                      Try Again
                    </button>
                    <button 
                      onClick={() => setActiveTab('reading')}
                      className="flex items-center px-6 py-3 bg-white text-green-600 border-2 border-green-200 hover:bg-green-50 rounded-xl font-semibold transition-all duration-300"
                    >
                      <FaBookOpen className="mr-2" />
                      Review Material
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "resources":
        return (
          <div>
            {/* Compact Resources Header */}
            <div className="bg-gradient-to-r from-cyan-50 via-blue-50 to-cyan-100 border border-cyan-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <FaLink className="text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Additional Resources</h2>
                    <p className="text-sm text-gray-600">Curated links and materials for deeper learning</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3 text-xs">
                  <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                    <span className="text-cyan-600 font-medium">{content.resources.length} resources</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <IoSparkles className="mr-1 text-blue-500" />
                    <span>Handpicked</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaGithub className="mr-1 text-cyan-600" />
                    <span>GitHub</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaFilePdf className="mr-1 text-blue-600" />
                    <span>Docs</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Compact Resources Grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {content.resources.map((resource, index) => {
                const IconComponent = resource.icon;
                return (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-cyan-200 transform hover:-translate-y-2"
                  >
                    {/* Resource Header */}
                    <div className="flex items-start mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="text-2xl" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-xs font-bold">#{index + 1}</span>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                          resource.type === 'documentation' ? 'bg-blue-100 text-blue-800' :
                          resource.type === 'tutorial' ? 'bg-green-100 text-green-800' :
                          resource.type === 'course' ? 'bg-purple-100 text-purple-800' :
                          resource.type === 'project' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {resource.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Resource Content */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors leading-tight line-clamp-2">
                        {resource.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed line-clamp-4 mb-4">
                        {resource.description}
                      </p>
                    </div>
                    
                    {/* Resource Footer */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                      <div className="flex items-center text-gray-500 text-sm">
                        <FaExternalLinkAlt className="mr-2" />
                        <span>External Link</span>
                      </div>
                      
                      <div className="flex items-center text-cyan-600 font-bold group-hover:text-cyan-700">
                        <span className="mr-2">Explore</span>
                        <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                          <FaExternalLinkAlt className="text-sm" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </a>
                );
              })}
            </div>
            
            {/* Call to Action */}
            <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <IoBookmark className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Want More Resources?</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Bookmark this page and check back regularly. We continuously update our resource collection 
                with the latest and most relevant materials for {topic}.
              </p>
              <div className="flex justify-center space-x-4">
                <button className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
                  <IoBookmark className="mr-2" />
                  Bookmark Page
                </button>
                <button className="flex items-center px-6 py-3 bg-white text-purple-600 border-2 border-purple-200 rounded-2xl font-semibold hover:bg-purple-50 transition-all duration-300 transform hover:-translate-y-1">
                  <IoDownload className="mr-2" />
                  Download Resources
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <IoChevronBack size={20} />
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <FaRobot className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Pro Learning</h1>
                  <p className="text-sm text-gray-600 line-clamp-1">{topic}</p>
                </div>
              </div>
            </div>
            
            {/* Center section - Mobile tab indicator */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <IoMenu size={20} />
              </button>
            </div>
            
            {/* Right section */}
            <div className="flex items-center space-x-4">
              {!isLoading && (
                <div className="hidden lg:flex items-center space-x-4 text-sm">
                  <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <FaClock className="mr-1 text-blue-500" />
                    <span className="text-gray-700">{stats.estimatedReadTime}m</span>
                  </div>
                  <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <FaVideo className="mr-1 text-red-500" />
                    <span className="text-gray-700">{stats.totalVideos}</span>
                  </div>
                  <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <FaQuestionCircle className="mr-1 text-green-500" />
                    <span className="text-gray-700">{stats.totalQuestions}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-xl transition-colors ${
                  bookmarked 
                    ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' 
                    : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                <IoBookmark size={20} />
              </button>
              
              <Link
                to="/"
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <IoHome className="mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-xl"
                >
                  <IoClose size={20} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLoading}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.gradient} text-white`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent className="mr-3" />
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className={`text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-gray-500'}`}>
                          {tab.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border mb-8 hidden md:block">
          <div className="p-2">
            <nav className="flex space-x-2" aria-label="Tabs">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    disabled={isLoading}
                    className={`group flex-1 p-4 rounded-xl font-medium transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`p-2 rounded-lg transition-colors ${
                        isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <IconComponent className="text-lg" />
                      </div>
                      <span className="text-sm font-semibold">{tab.label}</span>
                      <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {tab.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Tab Indicator */}
        <div className="md:hidden mb-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon, { 
                  className: "mr-2 text-lg text-blue-600" 
                })}
                <div>
                  <div className="font-semibold text-gray-900">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <IoChevronDown />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-6 lg:p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProLearningPage;
