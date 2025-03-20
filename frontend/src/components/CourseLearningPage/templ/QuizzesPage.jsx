import React, { useState } from 'react';
import { FaCheck, FaTimes, FaRegCircle, FaRegDotCircle } from 'react-icons/fa';

const QuizzesPage = () => {
  // Sample quiz data - would come from API in real implementation
  const quizData = {
    title: "Next.js Fundamentals Quiz",
    description: "Test your understanding of key Next.js concepts covered in this lesson",
    timeLimit: "10 minutes",
    questions: [
      {
        id: 1,
        question: "What is the primary benefit of using Next.js over vanilla React?",
        type: "multiple-choice",
        options: [
          "Easier state management",
          "Server-side rendering capabilities",
          "Better component structure",
          "Reduced bundle size"
        ],
        correctAnswer: 1
      },
      {
        id: 2,
        question: "Which file would you create to add custom CSS for the entire application?",
        type: "multiple-choice",
        options: [
          "styles.css",
          "global.css",
          "app.css",
          "index.css"
        ],
        correctAnswer: 1
      },
      {
        id: 3,
        question: "In Next.js, which of the following methods is used for server-side rendering?",
        type: "multiple-choice",
        options: [
          "getInitialProps",
          "getServerSideProps",
          "getStaticProps",
          "getPageProps"
        ],
        correctAnswer: 1
      },
      {
        id: 4,
        question: "Mark all the data fetching methods available in Next.js:",
        type: "multiple-select",
        options: [
          "getServerSideProps",
          "getStaticProps",
          "getInitialProps",
          "getFetchProps"
        ],
        correctAnswers: [0, 1, 2]
      },
      {
        id: 5,
        question: "Explain the difference between getStaticProps and getServerSideProps in Next.js.",
        type: "open-ended"
      }
    ]
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = quizData.questions[currentQuestionIndex];

  const handleSingleSelection = (optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex
    });
  };

  const handleMultipleSelection = (optionIndex) => {
    const currentSelections = selectedAnswers[currentQuestion.id] || [];
    
    if (currentSelections.includes(optionIndex)) {
      setSelectedAnswers({
        ...selectedAnswers,
        [currentQuestion.id]: currentSelections.filter(idx => idx !== optionIndex)
      });
    } else {
      setSelectedAnswers({
        ...selectedAnswers,
        [currentQuestion.id]: [...currentSelections, optionIndex]
      });
    }
  };

  const handleTextAnswer = (text) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: text
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // In a real app, you would send answers to the server here
    setShowResults(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {!showResults ? (
        <>
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{quizData.title}</h1>
            <p className="text-gray-600">{quizData.description}</p>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">Time limit: {quizData.timeLimit}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
            </div>
          </header>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                {currentQuestionIndex + 1}. {currentQuestion.question}
              </h2>

              {currentQuestion.type === 'multiple-choice' && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center h-5">
                        {selectedAnswers[currentQuestion.id] === index ? (
                          <FaRegDotCircle className="text-indigo-600" />
                        ) : (
                          <FaRegCircle className="text-gray-400" />
                        )}
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">{option}</span>
                      </div>
                      <input
                        type="radio"
                        className="hidden"
                        checked={selectedAnswers[currentQuestion.id] === index}
                        onChange={() => handleSingleSelection(index)}
                      />
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'multiple-select' && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = (selectedAnswers[currentQuestion.id] || []).includes(index);
                    return (
                      <label key={index} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={isSelected}
                            onChange={() => handleMultipleSelection(index)}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <span className="text-gray-700">{option}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'open-ended' && (
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="5"
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleTextAnswer(e.target.value)}
                ></textarea>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrevQuestion}
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
                  onClick={handleNextQuestion}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex">
              {quizData.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full mx-1 text-sm font-medium ${
                    currentQuestionIndex === index
                      ? 'bg-indigo-600 text-white'
                      : selectedAnswers[quizData.questions[index].id] !== undefined || answers[quizData.questions[index].id]
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
          <p className="text-gray-600 mb-6">
            Your answers have been submitted successfully. Check back later for your results.
          </p>
          
          <div className="flex justify-center">
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Review Answers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;