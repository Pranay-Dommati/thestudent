import React, { useState } from 'react';
import { FaCheck, FaTimes, FaRegCircle, FaRegDotCircle, FaClock, FaListAlt, FaRedo } from 'react-icons/fa';

const QuizzesPage = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [answers, setAnswers] = useState({});

  // Quiz metadata and questions
  const quizData = {
    title: "Next.js Fundamentals Quiz",
    description: "Test your understanding of key Next.js concepts covered in this lesson",
    timeLimit: "10 minutes",
    totalQuestions: 5,
    passingScore: 80,
    attempts: "Unlimited",
    instructions: [
      "You can attempt this quiz multiple times",
      "Each question has only one correct answer",
      "Read each question carefully before answering",
      "You can review your answers before final submission"
    ],
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

  const renderQuizIntro = () => {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="relative px-8 py-10 bg-gradient-to-r from-indigo-500/5 to-blue-500/5">
            {/* Decorative pattern - Moved behind content */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{quizData.title}</h1>
                <p className="text-lg text-gray-600">{quizData.description}</p>
              </div>
            </div>
          </div>

          {/* Quiz Details Grid */}
          <div className="grid grid-cols-2 gap-6 p-8 bg-white">
            {[
              { icon: <FaClock />, title: "Time Limit", value: quizData.timeLimit },
              { icon: <FaListAlt />, title: "Questions", value: `${quizData.totalQuestions} questions` },
              { icon: <FaRedo />, title: "Attempts", value: quizData.attempts },
              { icon: <FaCheck />, title: "Passing Score", value: `${quizData.passingScore}%` }
            ].map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="p-3 rounded-full bg-indigo-50 mr-4">
                  <span className="text-indigo-600 text-lg">{item.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  <p className="text-gray-600">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions Section */}
          <div className="p-8 bg-gray-50 border-t border-gray-200">
            <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Instructions
            </h2>
            <div className="space-y-3">
              {quizData.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-600">{instruction}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start Button Section */}
          <div className="p-8 bg-white border-t border-gray-200">
            <button
              onClick={() => setHasStarted(true)}
              className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center group"
            >
              <span className="mr-2">Start Quiz</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  const renderQuizContent = () => {
    const currentQuestion = quizData.questions[currentQuestionIndex];

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

  return (
    <div className="p-6">
      {!hasStarted ? renderQuizIntro() : renderQuizContent()}
    </div>
  );
};

export default QuizzesPage;