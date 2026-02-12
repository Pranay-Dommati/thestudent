// Logic and helper functions for ProLearningPage

// Import modular content generation services
import { 
  generateReadingContent,
  generateSummaryContent,
  generateVideosContent,
  generateQuizContent,
  generateResourcesContent
} from './services/index.js';

// Helper to split markdown into sections by '## '
export function splitMarkdownSections(markdown) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  let sections = [];
  let current = [];
  let header = '';
  for (let line of lines) {
    if (line.startsWith('## ')) {
      if (current.length > 0) {
        sections.push({ header, content: current.join('\n') });
      }
      header = line;
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    sections.push({ header, content: current.join('\n') });
  }
  return sections;
}

// Content generation and quiz logic using modular services
export async function generateProContent({ topic, setIsLoading, setLoadingProgress, setShowSkeletons, setLoadingStep, setContent, setStats, content }) {
  setIsLoading(true);
  setLoadingProgress(0);
  setShowSkeletons(true);
  
  // Use local content variable to avoid calling setContent multiple times
  let localContent = content || {
    reading: '',
    summary: '',
    videos: [],
    quiz: [],
    resources: [],
    metadata: {}
  };
  
  // Reduced logging for content generation start
  
  try {
    // Step 1: Generate Reading Content
    setLoadingStep('📘 Generating comprehensive reading material...');
    setLoadingProgress(10);
    // Only log for debugging when needed
    // console.log('🔧 ProLearningLogic: About to call generateReadingContent for topic:', topic);
    
    // Create a wrapper setContent that updates local content properly
    const localSetContent = (updater) => {
      if (typeof updater === 'function') {
        localContent = updater(localContent);
      } else {
        // Merge the new content with existing content
        localContent = { ...localContent, ...updater };
      }
      
      // CRITICAL: Update the UI in real-time for streaming content
      // This ensures the user sees the typing effect
      setContent(localContent);
    };
    
    await generateReadingContent(topic, localSetContent);
    // Reduced completion logging
    // console.log('🔧 ProLearningLogic: generateReadingContent completed for topic:', topic);
    // Wait a bit to ensure content is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 2: Generate Summary (with updated content)
    setLoadingStep('🧠 Creating summary and key points...');
    setLoadingProgress(30);
    // Get the latest content state
    const currentReading = localContent.reading || '';
    await generateSummaryContent(localSetContent, topic, currentReading);
    
    // Step 3: Generate Videos
    setLoadingStep('🎥 Finding best educational videos...');
    setLoadingProgress(50);
    await generateVideosContent(localSetContent, topic);
    
    // Step 4: Generate Quiz
    setLoadingStep('✅ Designing interactive quiz questions...');
    setLoadingProgress(70);
    const quizReading = localContent.reading || '';
    await generateQuizContent(localSetContent, topic, quizReading);
    
    // Step 5: Generate Resources
    setLoadingStep('📚 Curating additional learning resources...');
    setLoadingProgress(85);
    await generateResourcesContent(localSetContent, topic);
    
    // Step 6: Finalize and calculate stats
    setLoadingStep('✨ Finalizing your learning experience...');
    setLoadingProgress(95);
    
    // Calculate stats
    const readingWordCount = localContent.reading ? localContent.reading.split(' ').length : 0;
    const stats = {
      estimatedReadTime: Math.ceil(readingWordCount / 200),
      totalQuestions: localContent.quiz ? localContent.quiz.length : 0,
      totalVideos: localContent.videos ? localContent.videos.length : 0,
      totalResources: localContent.resources ? localContent.resources.length : 0,
      difficulty: readingWordCount > 1500 ? 'Advanced' : readingWordCount > 800 ? 'Intermediate' : 'Beginner',
      completionRate: 0
    };
    
    // Set stats if the function is provided
    if (setStats) {
      setStats(stats);
    }
    
    setLoadingProgress(100);
    
    // Final setContent call with complete content - this resolves the Promise in ProContentManager
    console.log('✅ ProLearningLogic: Content generation complete, calling setContent with final result');
    console.log('🔧 ProLearningLogic: Final content structure:', {
      hasReading: !!localContent.reading,
      hasSummary: !!localContent.summary,
      hasQuiz: localContent.quiz && localContent.quiz.length > 0,
      hasVideos: localContent.videos && localContent.videos.length > 0,
      hasResources: localContent.resources && localContent.resources.length > 0,
      readingLength: localContent.reading ? localContent.reading.length : 0
    });
    setContent(localContent);
    
  } catch (error) {
    setLoadingStep('❌ Error loading content. Please refresh and try again.');
    console.error('ProContent generation error:', error);
    
    // Even on error, call setContent to prevent timeout in ProContentManager
    console.log('❌ ProLearningLogic: Error occurred, calling setContent with current content');
    setContent(localContent || {
      reading: '',
      summary: '',
      videos: [],
      quiz: [],
      resources: [],
      metadata: { error: error.message }
    });
  } finally {
    setTimeout(() => {
      setIsLoading(false);
      setShowSkeletons(false);
    }, 1500);
  }
}

// Export the modular content generation functions
export { 
  generateReadingContent,
  generateSummaryContent,
  generateVideosContent,
  generateQuizContent,
  generateResourcesContent
} from './services/index.js';

export function handleQuizAnswer(questionId, answerIndex, content, setContent, setQuizScore, setShowQuizResults) {
  setContent(prev => ({
    ...prev,
    quiz: prev.quiz.map(q =>
      q.id === questionId ? { ...q, userAnswer: answerIndex } : q
    )
  }));
  const updatedQuiz = content.quiz.map(q =>
    q.id === questionId ? { ...q, userAnswer: answerIndex } : q
  );
  const correctAnswers = updatedQuiz.filter(q => q.userAnswer === q.correct).length;
  const answeredQuestions = updatedQuiz.filter(q => q.userAnswer !== null).length;
  setQuizScore(correctAnswers);
  if (answeredQuestions === content.quiz.length) {
    setTimeout(() => setShowQuizResults(true), 500);
  }
}

export function restartQuiz(setContent, setQuizScore, setCurrentQuestionIndex, setShowQuizResults, content) {
  setContent(prev => ({
    ...prev,
    quiz: prev.quiz.map(q => ({ ...q, userAnswer: null }))
  }));
  setQuizScore(0);
  setCurrentQuestionIndex(0);
  setShowQuizResults(false);
}

export function nextQuestion(currentQuestionIndex, setCurrentQuestionIndex, content) {
  if (currentQuestionIndex < content.quiz.length - 1) {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  }
}

export function prevQuestion(currentQuestionIndex, setCurrentQuestionIndex) {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  }
}

export function toggleBookmark(bookmarked, setBookmarked) {
  setBookmarked(!bookmarked);
  // Here you could save to localStorage or send to backend
}

// UI-focused helper functions for better code display

// Format code blocks with enhanced UI elements
export function formatCodeBlock(code, language, title = '', output = '', description = '') {
  let formattedBlock = '';
  
  if (title) {
    formattedBlock += `#### ${title}\n\n`;
  }
  
  if (description) {
    formattedBlock += `${description}\n\n`;
  }
  
  formattedBlock += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  
  if (output) {
    formattedBlock += `**Output:**\n\`\`\`\n${output}\n\`\`\`\n\n`;
  }
  
  return formattedBlock;
}

// Create interactive code examples with copy functionality
export function createInteractiveExample(examples) {
  return examples.map((example, index) => {
    const { title, code, language, output, description, difficulty = 'Basic' } = example;
    
    let formatted = `#### ${difficulty} Level: ${title}\n\n`;
    
    if (description) {
      formatted += `${description}\n\n`;
    }
    
    formatted += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    
    if (output) {
      formatted += `**Output:**\n\`\`\`\n${output}\n\`\`\`\n\n`;
    }
    
    return formatted;
  }).join('---\n\n');
}

// Generate syntax highlighting hints for better display
export function addSyntaxHighlights(content) {
  // Clean professional code block formatting without background colors
  return content
    .replace(/```(\w+)/g, '```$1')
    .replace(/```output/g, '```');
}

// Create step-by-step code tutorials
export function createStepByStepTutorial(steps) {
  return steps.map((step, index) => {
    const { title, explanation, code, language, output, tips } = step;
    
    let formatted = `### Step ${index + 1}: ${title}\n\n`;
    formatted += `${explanation}\n\n`;
    
    if (code) {
      formatted += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
    
    if (output) {
      formatted += `**Output:**\n\`\`\`\n${output}\n\`\`\`\n\n`;
    }
    
    if (tips) {
      formatted += `💡 **Tip:** ${tips}\n\n`;
    }
    
    return formatted;
  }).join('\n');
}

// Professional code block formatter without background coloring
export function createCleanCodeBlock(code, language, title = '', description = '') {
  let block = '';
  
  if (title) {
    block += `#### ${title}\n\n`;
  }
  
  if (description) {
    block += `${description}\n\n`;
  }
  
  // Clean code block without special styling
  block += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  
  return block;
}

// Create professional code examples with clean output
export function createProfessionalExample(title, code, language, output = '', explanation = '') {
  let example = `#### ${title}\n\n`;
  
  if (explanation) {
    example += `${explanation}\n\n`;
  }
  
  example += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  
  if (output) {
    example += `**Output:**\n\`\`\`\n${output}\n\`\`\`\n\n`;
  }
  
  return example;
}

// Create multi-level difficulty examples
export function createProgressiveExamples(topic, examples) {
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  let content = '';
  
  examples.forEach((example, index) => {
    const level = levels[index] || 'Example';
    content += `#### ${level} Level\n\n`;
    content += `${example.description}\n\n`;
    content += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
    
    if (example.output) {
      content += `**Result:**\n\`\`\`\n${example.output}\n\`\`\`\n\n`;
    }
    
    if (index < examples.length - 1) {
      content += '---\n\n';
    }
  });
  
  return content;
}

// Create properly formatted comparison tables
export function createComparisonTable(data, headers) {
  if (!data || !headers) return '';
  
  let table = '\n';
  
  // Create header row
  table += '| ' + headers.join(' | ') + ' |\n';
  
  // Create separator row
  table += '|' + headers.map(() => '---').join('|') + '|\n';
  
  // Create data rows
  data.forEach(row => {
    table += '| ' + row.join(' | ') + ' |\n';
  });
  
  table += '\n';
  return table;
}

// Format table data with proper spacing and alignment
export function formatTableData(tableContent) {
  // Ensure proper spacing in table content
  return tableContent
    .replace(/\|\s*\|/g, '| |') // Fix empty cells
    .replace(/\|([^|]+)\|/g, (match, content) => {
      // Trim and ensure consistent spacing
      return '| ' + content.trim() + ' |';
    });
}

// Create professional tables for variations/types with enhanced formatting
export function createTypesVariationsTable(topic, variations) {
  let content = `### 🔹 Types & Variations\n\n`;
  
  if (variations && variations.length > 0) {
    // Enhanced table with better spacing and formatting
    content += `| Type | Description | Pros | Cons | Use Cases |\n`;
    content += `|------|-------------|------|------|----------|\n`;
    
    variations.forEach(variation => {
      // Ensure proper cell formatting with limited text length
      const name = variation.name || 'Type';
      const description = (variation.description || 'Description').substring(0, 80) + (variation.description?.length > 80 ? '...' : '');
      const pros = (variation.pros || 'Advantages').substring(0, 60) + (variation.pros?.length > 60 ? '...' : '');
      const cons = (variation.cons || 'Limitations').substring(0, 60) + (variation.cons?.length > 60 ? '...' : '');
      const useCases = (variation.useCases || 'General purpose').substring(0, 60) + (variation.useCases?.length > 60 ? '...' : '');
      
      content += `| **${name}** | ${description} | ${pros} | ${cons} | ${useCases} |\n`;
    });
    
    content += '\n';
  } else {
    // Enhanced fallback table structure with proper formatting
    content += `| Type | Description | Pros | Cons | Use Cases |\n`;
    content += `|------|-------------|------|------|----------|\n`;
    content += `| **Basic ${topic}** | Standard implementation with core features | Simple to learn and implement | Limited advanced functionality | General purpose applications |\n`;
    content += `| **Advanced ${topic}** | Enhanced version with additional features | More powerful and flexible | Steeper learning curve | Complex enterprise projects |\n`;
    content += `| **Lightweight ${topic}** | Minimal implementation for efficiency | Fast performance, low resource usage | Reduced feature set | Resource-constrained environments |\n`;
    content += `| **Enterprise ${topic}** | Full-featured enterprise solution | Comprehensive toolset, scalable | Higher complexity and cost | Large-scale business applications |\n\n`;
  }
  
  // Add formatting guidelines
  content += `**💡 Selection Guide:**\n`;
  content += `- **Beginners**: Start with Basic ${topic} for foundational understanding\n`;
  content += `- **Performance-focused**: Choose Lightweight ${topic} for speed-critical applications\n`;
  content += `- **Feature-rich**: Select Advanced ${topic} when you need comprehensive functionality\n`;
  content += `- **Enterprise**: Use Enterprise ${topic} for large-scale, mission-critical systems\n\n`;
  
  return content;
}

// Configuration constants for AI model handling