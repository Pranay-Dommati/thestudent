// Quiz Content Generation Service
// Handles generating interactive quiz questions for learning assessment

/**
 * Generate quiz content for the given topic
 * @param {function} setContent - React setContent function
 * @param {string} topic - The topic to create quiz questions for
 * @param {string} readingContent - The reading content to base questions on
 */
export async function generateQuizContent(setContent, topic = '', readingContent = '') {
  // Generating interactive quiz questions
  
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
      throw new Error('No quiz questions generated');
    }
    
    setContent({
      quiz: quizQuestions,
      quizMetadata: {
        generatedAt: new Date().toISOString(),
        totalQuestions: quizQuestions.length,
        difficulty: calculateQuizDifficulty(quizQuestions),
        topics: extractQuizTopics(quizQuestions),
        estimatedTime: estimateQuizTime(quizQuestions)
      }
    });
    
    // Generated quiz questions
    
  } catch (error) {
    console.error('🚨 Quiz generation failed:', error);
    
    // Throw error instead of using fallback
    throw new Error('Quiz generation failed');
  }
}

// Generate AI-powered quiz questions based on content
async function generateAIQuizQuestions(topic, readingContent) {
  try {
  const response = await fetch('/ai/quiz/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, reading_content: readingContent })
    });
    if (!response.ok) throw new Error('Backend AI quiz endpoint failed');
    const result = await response.json();
    // Parse backend AI response
    const quizText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseQuizQuestions(quizText, topic);
    if (parsed && parsed.length > 0) {
      return parsed;
    } else {
      throw new Error('AI quiz generation failed');
    }
  } catch (error) {
    console.warn('AI quiz generation failed:', error.message);
    throw new Error('AI quiz generation failed');
  }
}

// Generate quiz questions for a topic without specific content
async function generateTopicQuizQuestions(topic) {
  // Just call the backend with topic and empty reading_content
  return await generateAIQuizQuestions(topic, '');
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
        userAnswer: null,
        code: '' // Add code field
      };
      
      let currentOptionIndex = 0;
      let codeBlock = '';
      let inCodeBlock = false;
      
      lines.forEach(line => {
        if (line.startsWith('CODE:')) {
          // Start of code block
          const codeLine = line.replace('CODE:', '').trim();
          if (codeLine.startsWith('```')) {
            inCodeBlock = true;
            codeBlock = codeLine + '\n';
          } else {
            question.code = codeLine;
          }
        } else if (inCodeBlock) {
          codeBlock += line + '\n';
          if (line.startsWith('```')) {
            inCodeBlock = false;
            question.code = codeBlock.trim();
          }
        } else if (line.match(/^[A-D]\)/)) {
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
    throw new Error('Failed to parse quiz questions');
  }
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
