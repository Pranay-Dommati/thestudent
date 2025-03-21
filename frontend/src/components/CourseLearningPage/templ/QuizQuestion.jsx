import React from 'react';
import { FaRegCircle, FaRegDotCircle } from 'react-icons/fa';

const QuizQuestion = ({ 
  quizData,
  currentQuestion,
  currentQuestionIndex,
  selectedAnswers,
  onAnswerSelect,
  onNext,
  onPrevious,
  onSubmit,
  setCurrentQuestionIndex
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Quiz Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{quizData.title}</h1>
          <p className="text-gray-600">{quizData.description}</p>
          <div className="flex items-center mt-4 text-sm text-gray-500">
            <span>Time limit: {quizData.timeLimit}</span>
            <span className="mx-2">|</span>
            <span>Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
          </div>
        </header>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            {currentQuestionIndex + 1}. {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center h-5">
                  {selectedAnswers[currentQuestion.id] === index ? (
                    <FaRegDotCircle className="text-indigo-600 w-5 h-5" />
                  ) : (
                    <FaRegCircle className="text-gray-400 w-5 h-5" />
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <span className="text-gray-700">{option}</span>
                </div>
                <input
                  type="radio"
                  className="sr-only"
                  checked={selectedAnswers[currentQuestion.id] === index}
                  onChange={() => onAnswerSelect(index)}
                />
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={onPrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Previous
            </button>

            {currentQuestionIndex < quizData.questions.length - 1 ? (
              <button
                onClick={onNext}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="flex space-x-2">
          {quizData.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentQuestionIndex === index 
                  ? 'bg-indigo-600 text-white' 
                  : selectedAnswers[quizData.questions[index].id] !== undefined
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;