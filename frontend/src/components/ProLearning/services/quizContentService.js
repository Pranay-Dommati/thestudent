// Quiz Content Generation Service
// Handles generating interactive quiz questions for learning assessment

/**
 * Generate quiz content for the given topic
 * @param {function} setContent - React setContent function
 * @param {string} topic - The topic to create quiz questions for
 * @param {string} readingContent - The reading content to base questions on
 */
export async function generateQuizContent(setContent, topic = '', readingContent = '') {
  console.log('✅ Generating interactive quiz questions...');
  
  try {
    let quizQuestions = [];
    
    // If we have reading content, generate questions based on it
    if (readingContent && readingContent.length > 200) {
      quizQuestions = await generateAIQuizQuestions(topic, readingContent);
    } else {
      // Generate general quiz questions for the topic
      quizQuestions = await generateTopicQuizQuestions(topic);
    }
    
    // Ensure we have at least some questions
    if (quizQuestions.length === 0) {
      quizQuestions = generateFallbackQuiz(topic);
    }
    
    setContent((prev) => ({
      ...prev,
      quiz: quizQuestions,
      quizMetadata: {
        generatedAt: new Date().toISOString(),
        totalQuestions: quizQuestions.length,
        difficulty: calculateQuizDifficulty(quizQuestions),
        topics: extractQuizTopics(quizQuestions),
        estimatedTime: estimateQuizTime(quizQuestions)
      }
    }));
    
    console.log(`✅ Generated ${quizQuestions.length} quiz questions`);
    
  } catch (error) {
    console.error('🚨 Quiz generation failed:', error);
    
    // Use fallback quiz on error
    const fallbackQuiz = generateFallbackQuiz(topic);
    setContent((prev) => ({
      ...prev,
      quiz: fallbackQuiz,
      quizMetadata: {
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        totalQuestions: fallbackQuiz.length,
        error: error.message
      }
    }));
  }
}

// Generate AI-powered quiz questions based on content
async function generateAIQuizQuestions(topic, readingContent) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return generateFallbackQuiz(topic);
  }

  try {
    const quizPrompt = createQuizPrompt(topic, readingContent);
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: quizPrompt }]
      }],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent quiz format
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 3072,
        stopSequences: []
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Quiz API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid quiz API response');
    }

    const quizText = result.candidates[0].content.parts[0].text.trim();
    return parseQuizQuestions(quizText, topic);
    
  } catch (error) {
    console.warn('AI quiz generation failed, using fallback:', error.message);
    return generateFallbackQuiz(topic);
  }
}

// Generate quiz questions for a topic without specific content
async function generateTopicQuizQuestions(topic) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return generateFallbackQuiz(topic);
  }

  try {
    const topicQuizPrompt = createTopicQuizPrompt(topic);
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: topicQuizPrompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 2048,
        stopSequences: []
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Topic quiz API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid topic quiz API response');
    }

    const quizText = result.candidates[0].content.parts[0].text.trim();
    return parseQuizQuestions(quizText, topic);
    
  } catch (error) {
    console.warn('Topic quiz generation failed, using fallback:', error.message);
    return generateFallbackQuiz(topic);
  }
}

// Create optimized prompt for quiz generation based on content
function createQuizPrompt(topic, readingContent) {
  return `
You are an expert educational assessment creator. Generate high-quality quiz questions based on the provided learning content about "${topic}".

**Source Content:**
${readingContent.substring(0, 3000)} // Limit content to prevent token overflow

**Requirements:**
Create 8-10 multiple-choice questions that test understanding of the content. Each question should:

**Question Format (use exactly this structure):**
QUESTION: [Question text here]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation of why this answer is correct]
DIFFICULTY: [Beginner/Intermediate/Advanced]
TOPIC: [Specific subtopic this question covers]

**Guidelines:**
- Cover different aspects of the content evenly
- Include 3-4 beginner, 3-4 intermediate, and 2-3 advanced questions
- Test both conceptual understanding and practical application
- Avoid trick questions or ambiguous wording
- Make incorrect options plausible but clearly wrong
- Include code-related questions if the content covers programming
- Ensure questions are directly based on the provided content
- Keep questions clear and concise
- Provide helpful explanations that reinforce learning

**Question Types to Include:**
- Definition/concept questions
- Application/scenario questions  
- Best practice questions
- Code analysis questions (if applicable)
- Comparison questions
- Problem-solving questions

Generate exactly 8-10 questions following the format above.
`;
}

// Create prompt for topic-based quiz without specific content
function createTopicQuizPrompt(topic) {
  return `
You are an expert educational assessment creator. Generate comprehensive quiz questions about "${topic}" for learners.

**Requirements:**
Create 8-10 multiple-choice questions that test fundamental to advanced knowledge of ${topic}.

**Question Format (use exactly this structure):**
QUESTION: [Question text here]
A) [Option A]
B) [Option B]
C) [Option C] 
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation of why this answer is correct]
DIFFICULTY: [Beginner/Intermediate/Advanced]
TOPIC: [Specific subtopic this question covers]

**Guidelines:**
- Cover the most important aspects of ${topic}
- Include 3-4 beginner, 3-4 intermediate, and 2-3 advanced questions
- Test both theoretical knowledge and practical understanding
- Include real-world application questions
- Make sure all options are plausible
- Focus on industry-standard knowledge and best practices
- Include questions about common use cases and implementations

**Topics to Cover:**
- Basic concepts and definitions
- Core principles and fundamentals  
- Practical applications and use cases
- Best practices and common patterns
- Advanced techniques and optimization
- Real-world scenarios and problem-solving
- Tools and ecosystem (if applicable)
- Common mistakes and troubleshooting

Generate exactly 8-10 questions following the format above.
`;
}

// Parse AI-generated quiz questions
function parseQuizQuestions(quizText, topic) {
  try {
    const questionBlocks = quizText.split(/QUESTION:/i).filter(block => block.trim().length > 0);
    const questions = [];
    
    questionBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      const question = {
        id: `q_${index + 1}`,
        question: '',
        options: ['', '', '', ''],
        correct: 0,
        explanation: '',
        difficulty: 'Beginner',
        topic: topic,
        userAnswer: null
      };
      
      let currentOptionIndex = 0;
      
      lines.forEach(line => {
        if (line.match(/^[A-D]\)/)) {
          const optionLetter = line.charAt(0);
          const optionText = line.substring(2).trim();
          const optionIndex = optionLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          if (optionIndex >= 0 && optionIndex < 4) {
            question.options[optionIndex] = optionText;
          }
        } else if (line.startsWith('CORRECT:')) {
          const correctLetter = line.replace('CORRECT:', '').trim().charAt(0);
          question.correct = correctLetter.charCodeAt(0) - 65;
        } else if (line.startsWith('EXPLANATION:')) {
          question.explanation = line.replace('EXPLANATION:', '').trim();
        } else if (line.startsWith('DIFFICULTY:')) {
          question.difficulty = line.replace('DIFFICULTY:', '').trim();
        } else if (line.startsWith('TOPIC:')) {
          question.topic = line.replace('TOPIC:', '').trim();
        } else if (!line.includes(':') && question.question === '' && line.length > 10) {
          question.question = line;
        }
      });
      
      // Validate question
      if (question.question && question.options.every(opt => opt.length > 0) && 
          question.correct >= 0 && question.correct < 4) {
        questions.push(question);
      }
    });
    
    return questions.slice(0, 5); // Limit to 5 questions
    
  } catch (error) {
    console.warn('Failed to parse quiz questions:', error);
    return generateFallbackQuiz(topic);
  }
}

// Generate fallback quiz when AI is not available
function generateFallbackQuiz(topic) {
  const fallbackQuestions = [
    {
      id: 'q_1',
      question: `What is the primary purpose of ${topic}?`,
      options: [
        'To solve complex computational problems',
        'To provide a structured approach to development',
        'To replace traditional programming methods',
        'To optimize system performance only'
      ],
      correct: 1,
      explanation: `${topic} primarily provides a structured approach that helps developers create more efficient and maintainable solutions.`,
      difficulty: 'Beginner',
      topic: topic,
      userAnswer: null
    },
    {
      id: 'q_2',
      question: `Which of the following is a key benefit of using ${topic}?`,
      options: [
        'Increased code complexity',
        'Reduced development time',
        'Limited scalability',
        'Higher memory usage'
      ],
      correct: 1,
      explanation: `${topic} typically reduces development time by providing efficient tools and methodologies.`,
      difficulty: 'Beginner',
      topic: topic,
      userAnswer: null
    },
    {
      id: 'q_3',
      question: `When implementing ${topic}, what should be your first step?`,
      options: [
        'Write the complete code immediately',
        'Understand the requirements and plan the approach',
        'Optimize for performance',
        'Deploy to production'
      ],
      correct: 1,
      explanation: 'Understanding requirements and planning is essential before implementation to ensure success.',
      difficulty: 'Beginner',
      topic: topic,
      userAnswer: null
    },
    {
      id: 'q_4',
      question: `Which practice is considered essential when working with ${topic}?`,
      options: [
        'Avoiding documentation',
        'Following established patterns and best practices',
        'Using only the latest features',
        'Ignoring testing procedures'
      ],
      correct: 1,
      explanation: 'Following established patterns and best practices ensures reliable and maintainable code.',
      difficulty: 'Intermediate',
      topic: topic,
      userAnswer: null
    },
    {
      id: 'q_5',
      question: `How can you improve performance when using ${topic}?`,
      options: [
        'Add more features',
        'Optimize algorithms and data structures',
        'Use more memory',
        'Avoid caching'
      ],
      correct: 1,
      explanation: 'Optimizing algorithms and data structures is key to improving performance in any implementation.',
      difficulty: 'Intermediate',
      topic: topic,
      userAnswer: null
    },
    {
      id: 'q_6',
      question: `What is a common mistake when learning ${topic}?`,
      options: [
        'Starting with fundamentals',
        'Practicing regularly',
        'Jumping to advanced concepts too quickly',
        'Reading documentation'
      ],
      correct: 2,
      explanation: 'Jumping to advanced concepts without mastering fundamentals often leads to confusion and gaps in understanding.',
      difficulty: 'Intermediate',
      topic: topic,
      userAnswer: null
    },
    {
      id: 'q_7',
      question: `For advanced ${topic} implementation, which approach is recommended?`,
      options: [
        'Use only basic features',
        'Implement custom solutions for everything',
        'Balance built-in features with custom optimizations',
        'Avoid any optimization'
      ],
      correct: 2,
      explanation: 'Balancing built-in features with custom optimizations provides the best of both worlds - reliability and performance.',
      difficulty: 'Advanced',
      topic: topic,
      userAnswer: null
    },
    {
      id: 'q_8',
      question: `What indicates mastery of ${topic}?`,
      options: [
        'Memorizing all syntax',
        'Ability to solve complex problems efficiently',
        'Using the most advanced features',
        'Writing the longest code'
      ],
      correct: 1,
      explanation: 'True mastery is demonstrated by the ability to solve complex problems efficiently and elegantly.',
      difficulty: 'Advanced',
      topic: topic,
      userAnswer: null
    }
  ];
  
  return fallbackQuestions.slice(0, 5); // Limit fallback to 5 questions
}

// Calculate overall quiz difficulty
function calculateQuizDifficulty(questions) {
  if (!questions || questions.length === 0) return 'Beginner';
  
  const difficultyScores = questions.map(q => {
    switch (q.difficulty?.toLowerCase()) {
      case 'advanced': return 3;
      case 'intermediate': return 2;
      case 'beginner': return 1;
      default: return 1;
    }
  });
  
  const averageScore = difficultyScores.reduce((sum, score) => sum + score, 0) / difficultyScores.length;
  
  if (averageScore >= 2.5) return 'Advanced';
  if (averageScore >= 1.5) return 'Intermediate';
  return 'Beginner';
}

// Extract topics covered in quiz
function extractQuizTopics(questions) {
  if (!questions || questions.length === 0) return [];
  
  const topics = new Set();
  questions.forEach(q => {
    if (q.topic) topics.add(q.topic);
  });
  
  return Array.from(topics);
}

// Estimate time needed to complete quiz
function estimateQuizTime(questions) {
  if (!questions || questions.length === 0) return 0;
  
  // Estimate based on question difficulty and count
  const timePerQuestion = questions.map(q => {
    switch (q.difficulty?.toLowerCase()) {
      case 'advanced': return 3; // 3 minutes
      case 'intermediate': return 2; // 2 minutes
      case 'beginner': return 1.5; // 1.5 minutes
      default: return 1.5;
    }
  });
  
  return Math.ceil(timePerQuestion.reduce((sum, time) => sum + time, 0));
}

// Utility functions for quiz interaction
export function calculateQuizScore(questions) {
  if (!questions || questions.length === 0) return 0;
  
  const correctAnswers = questions.filter(q => 
    q.userAnswer !== null && q.userAnswer === q.correct
  ).length;
  
  return Math.round((correctAnswers / questions.length) * 100);
}

export function getQuizResults(questions) {
  const total = questions.length;
  const answered = questions.filter(q => q.userAnswer !== null).length;
  const correct = questions.filter(q => q.userAnswer === q.correct).length;
  const score = Math.round((correct / total) * 100);
  
  return {
    total,
    answered,
    correct,
    incorrect: answered - correct,
    score,
    percentage: score,
    isComplete: answered === total
  };
}

export function resetQuiz(questions) {
  return questions.map(q => ({ ...q, userAnswer: null }));
}
