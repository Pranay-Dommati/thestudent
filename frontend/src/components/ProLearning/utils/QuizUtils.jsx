import React from 'react';
import { FaQuestionCircle } from 'react-icons/fa';

// ============================================
// QUIZ VALIDATION HELPERS
// ============================================

/**
 * Check if quiz data exists and has items
 * Supports both array format and object-with-questions format
 */
export const quizHasItems = (quiz) => {
  if (!quiz) return false;
  if (Array.isArray(quiz)) return quiz.length > 0;
  if (quiz.questions && Array.isArray(quiz.questions)) return quiz.questions.length > 0;
  return false;
};

/**
 * Get quiz array from content (handles both formats)
 */
export const getQuizArray = (quiz) => {
  if (Array.isArray(quiz)) return quiz;
  if (quiz?.questions && Array.isArray(quiz.questions)) return quiz.questions;
  return [];
};

/**
 * Check if a question has been answered
 */
export const isQuestionAnswered = (question) => {
  return question.userAnswer !== null && question.userAnswer !== undefined;
};

/**
 * Check if all questions have been answered
 */
export const areAllQuestionsAnswered = (quiz) => {
  const quizArray = getQuizArray(quiz);
  return quizArray.length > 0 && quizArray.every(q => isQuestionAnswered(q));
};

/**
 * Calculate quiz statistics
 */
export const calculateQuizStats = (quiz) => {
  const quizArray = getQuizArray(quiz);
  const total = quizArray.length;
  const answered = quizArray.filter(q => isQuestionAnswered(q)).length;
  const correct = quizArray.filter(q => q.userAnswer === q.correct).length;
  const progress = total > 0 ? (answered / total) * 100 : 0;
  const score = total > 0 ? (correct / total) * 100 : 0;
  
  return {
    total,
    answered,
    correct,
    progress,
    score
  };
};

/**
 * Get performance feedback message based on score
 */
export const getPerformanceFeedback = (score) => {
  if (score >= 80) return 'Excellent work! 🎉';
  if (score >= 60) return 'Good job! Review explanations to improve. 📚';
  return 'Keep practicing and try again! 💪';
};

/**
 * Reset all user answers in quiz
 */
export const resetQuizAnswers = (quiz) => {
  const quizArray = getQuizArray(quiz);
  return quizArray.map(q => ({ ...q, userAnswer: null }));
};

// ============================================
// QUIZ RENDERING COMPONENTS
// ============================================

/**
 * Quiz Header Component
 * Displays quiz title, question count, and restart button
 */
export const QuizHeader = ({ quizLength, quizSubmitted, correctAnswers, answeredQuestions, onRestart }) => {
  return (
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
            <span className="text-green-600 font-medium">{quizLength} questions</span>
          </div>
          {quizSubmitted && (
            <>
              <div className="bg-white px-2 py-1 rounded-full shadow-sm">
                <span className="text-gray-600">{correctAnswers}/{answeredQuestions} correct</span>
              </div>
              <button 
                onClick={onRestart}
                className="flex items-center border border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 font-medium rounded px-3 py-1 transition-colors duration-150 ml-2 cursor-pointer"
                style={{gap: '0.4em'}}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.582 9A7.003 7.003 0 0112 5c3.314 0 6.127 2.163 6.918 5M18.418 15A7.003 7.003 0 0112 19c-3.314 0-6.127-2.163-6.918-5" />
                </svg>
                Restart Quiz
              </button>
            </>
          )}
        </div>
      </div>
      
      <QuizProgressBar 
        progress={quizSubmitted ? 100 : (answeredQuestions / quizLength) * 100}
        quizSubmitted={quizSubmitted}
      />
    </div>
  );
};

/**
 * Quiz Progress Bar Component
 */
export const QuizProgressBar = ({ progress, quizSubmitted }) => {
  return (
    <>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-gray-600">
          {quizSubmitted ? `Quiz completed: ${Math.round(progress)}%` : `Progress: ${Math.round(progress)}% complete`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500"
          style={{width: `${progress}%`}}
        />
      </div>
    </>
  );
};

/**
 * Quiz Question Card Component
 */
export const QuizQuestionCard = ({ question, index, quizSubmitted, onAnswerSelect }) => {
  const isAnswered = isQuestionAnswered(question);
  const isCorrect = question.userAnswer === question.correct;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">
          Question {index + 1}
        </h3>
        {quizSubmitted && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCorrect 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </div>
        )}
      </div>
      
      <p className="text-gray-800 mb-4 leading-relaxed">{question.question}</p>
      
      {question.code && (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto text-sm">
          <code>{question.code}</code>
        </pre>
      )}
      
      <div className="space-y-3">
        {question.options.map((option, optionIndex) => {
          const isSelected = question.userAnswer === optionIndex;
          const isCorrectOption = question.correct === optionIndex;
          const showCorrectAnswer = quizSubmitted && isCorrectOption;
          const showIncorrectAnswer = quizSubmitted && isSelected && !isCorrect;
          
          return (
            <button
              key={optionIndex}
              onClick={() => !quizSubmitted && onAnswerSelect(question, optionIndex)}
              disabled={quizSubmitted}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                quizSubmitted
                  ? showCorrectAnswer
                    ? 'border-green-500 bg-green-50'
                    : showIncorrectAnswer
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  : isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              } ${quizSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`${
                  quizSubmitted
                    ? showCorrectAnswer
                      ? 'text-green-700 font-medium'
                      : showIncorrectAnswer
                        ? 'text-red-700'
                        : 'text-gray-700'
                    : isSelected
                      ? 'text-blue-700 font-medium'
                      : 'text-gray-700'
                }`}>
                  {option}
                </span>
                {quizSubmitted && (showCorrectAnswer || showIncorrectAnswer) && (
                  <span className="ml-2">
                    {showCorrectAnswer ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {quizSubmitted && question.explanation && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong className="text-blue-700">Explanation:</strong> {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Submit Quiz Card Component
 */
export const SubmitQuizCard = ({ quizLength, onSubmit }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-blue-100">
        <FaQuestionCircle className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Submit?</h3>
      <p className="text-gray-600 mb-4">
        You've answered all {quizLength} questions. You can still change your answers before submitting.
      </p>
      <button 
        onClick={onSubmit}
        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        Submit Quiz
      </button>
    </div>
  );
};

/**
 * Quiz Results Card Component
 */
export const QuizResultsCard = ({ stats, quiz, onRestart }) => {
  const { correct, total, score } = stats;
  const quizArray = getQuizArray(quiz);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-green-100">
        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-1">Quiz Results</h3>
      <div className="text-2xl font-bold text-green-600 mb-1">
        {correct}/{total} correct
      </div>
      <div className="text-gray-600 mb-4">
        Score: {score.toFixed(0)}%
      </div>
      <div className="mb-4 text-gray-700 font-medium">
        {getPerformanceFeedback(score)}
      </div>
      
      <div className="text-left mt-6">
        <h4 className="font-semibold text-gray-800 mb-4">Question Review</h4>
        <div className="space-y-4">
          {quizArray.map((question, idx) => {
            const isCorrect = question.userAnswer === question.correct;
            return (
              <div 
                key={question.id || idx}
                className={`p-4 rounded-lg border-2 ${
                  isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-gray-900">Question {idx + 1}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isCorrect 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{question.question}</p>
                {!isCorrect && (
                  <div className="text-sm">
                    <p className="text-red-600 mb-1">
                      Your answer: {question.options[question.userAnswer]}
                    </p>
                    <p className="text-green-600">
                      Correct answer: {question.options[question.correct]}
                    </p>
                  </div>
                )}
                {question.explanation && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <p className="text-xs text-gray-600">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <button 
        onClick={onRestart}
        className="px-5 py-2 mt-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
      >
        Try Again
      </button>
    </div>
  );
};

/**
 * Main Quiz Renderer Component
 * Complete quiz interface with all functionality
 */
export const QuizRenderer = ({ content, quizSubmitted, setQuizSubmitted, setContent }) => {
  if (!quizHasItems(content?.quiz)) {
    return null;
  }

  const quizArray = getQuizArray(content.quiz);
  const stats = calculateQuizStats(content.quiz);
  const allQuestionsAnswered = areAllQuestionsAnswered(content.quiz);

  // Handle answer selection
  const handleAnswerSelect = (question, optionIndex) => {
    setContent(prev => ({
      ...prev,
      quiz: prev.quiz.map(q => 
        q.id === question.id 
          ? { ...q, userAnswer: optionIndex } 
          : q
      )
    }));
  };

  // Handle quiz restart
  const handleRestart = () => {
    setContent(prev => ({
      ...prev,
      quiz: resetQuizAnswers(prev.quiz)
    }));
    setQuizSubmitted(false);
  };

  // Handle quiz submit
  const handleSubmit = () => {
    setQuizSubmitted(true);
  };

  return (
    <div className="pt-6">
      <QuizHeader 
        quizLength={stats.total}
        quizSubmitted={quizSubmitted}
        correctAnswers={stats.correct}
        answeredQuestions={stats.answered}
        onRestart={handleRestart}
      />
      
      <div className="space-y-6">
        {quizArray.map((question, index) => (
          <QuizQuestionCard
            key={question.id || index}
            question={question}
            index={index}
            quizSubmitted={quizSubmitted}
            onAnswerSelect={handleAnswerSelect}
          />
        ))}
        
        {allQuestionsAnswered && !quizSubmitted && (
          <SubmitQuizCard 
            quizLength={stats.total}
            onSubmit={handleSubmit}
          />
        )}
        
        {quizSubmitted && (
          <QuizResultsCard 
            stats={stats}
            quiz={content.quiz}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
};

export default QuizRenderer;
