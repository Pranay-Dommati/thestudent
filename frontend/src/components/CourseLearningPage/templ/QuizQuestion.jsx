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
  if (!quizData || !quizData.questions) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quiz Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">{quizData.title}</h1>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
            <span>Time limit: {quizData.timeLimit}</span>
            <span>•</span>
            <span>Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
          </div>
        </header>

        {/* Question Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestionIndex + 1}.{' '}
            <span className="font-normal">{currentQuestion.question}</span>
          </h2>

          {/* Options */}
          <div className="space-y-3 pl-6">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
                  name={`question-${currentQuestion.id}`}
                  checked={selectedAnswers[currentQuestion.id] === index}
                  onChange={() => onAnswerSelect(index)}
                />
              </label>
            ))}
          </div>
          
          <div className="mt-3 text-sm text-gray-500">
            1 point
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between max-w-4xl mx-auto">
          <button
            onClick={onPrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-2 rounded-lg text-sm font-medium ${
              currentQuestionIndex === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>

          {currentQuestionIndex === quizData.questions.length - 1 ? (
            <button
              onClick={onSubmit}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={onNext}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;