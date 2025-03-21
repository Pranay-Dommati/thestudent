import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaRegCircle, FaRegDotCircle, FaExclamationCircle } from 'react-icons/fa';

const StandaloneQuizPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [returnPath, setReturnPath] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Capture the return path when component mounts
  useEffect(() => {
    // Get the previous path from location state, or default to the standard path
    const previousPath = location.state?.from || `/courses/engineering/${courseId}/learning`;
    setReturnPath(previousPath);
  }, [courseId, location]);

  // Mock quiz data - in a real app, you would fetch this based on courseId
  const quizData = {
    title: "Knowledge Check - Getting started with HTML",
    description: "Practice Assignment • 15 min",
    timeLimit: "15 minutes",
    totalQuestions: 5,
    passingScore: 80,
    attempts: "Unlimited",
    questions: [
      {
        id: 1,
        question: "A HTML document begins with ______________.",
        options: [
          "The html tag",
          "The DOCTYPE declaration",
          "The head tag",
          "The body tag"
        ],
        correctAnswer: 1
      },
      {
        id: 2,
        question: "To display a link to another HTML document, the ______________ tag is used.",
        options: [
          "link",
          "html",
          "anchor (a)",
          "img"
        ],
        correctAnswer: 2
      },
      {
        id: 3,
        question: "To add an image to a webpage, the ______________ tag is used.",
        options: [
          "img",
          "image",
          "anchor (a)",
          "link"
        ],
        correctAnswer: 0
      },
      {
        id: 4,
        question: "To represent the HTML document in JavaScript, the browser builds a _____________.",
        options: [
          "HTML Element Model",
          "HTML Script",
          "Document Object Model"
        ],
        correctAnswer: 2
      },
      {
        id: 5,
        question: "Which of the following improve web accessibility for people with disabilities?",
        options: [
          "Correct HTML structure",
          "Accessible Rich Internet Application (ARIA) techniques",
          "Appropriate use of HTML elements"
        ],
        correctAnswer: 1
      }
    ]
  };

  const handleSingleSelection = (questionId, index) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: index
    });
  };

  const handleSubmit = () => {
    setShowResults(true);
    // In a real app, you would calculate score and submit to server here
    alert("Quiz submitted successfully!");
    // Navigate to results page or show results component
  };

  const handleBack = () => {
    navigate(returnPath);
  };

  // Add this function to check if all questions have been answered
  const allQuestionsAnswered = () => {
    // Check if we have an answer for each question
    return quizData.questions.every(question => 
      selectedAnswers[question.id] !== undefined
    );
  };

  // Handle clicks on the disabled submit button
  const handleSubmitClick = () => {
    if (!allQuestionsAnswered()) {
      setSubmitAttempted(true);
      
      // Auto-hide the message after 5 seconds
      setTimeout(() => {
        setSubmitAttempted(false);
      }, 5000);
    } else {
      handleSubmit();
    }
  };
  
  // Find unanswered questions to show in the message
  const getUnansweredQuestions = () => {
    return quizData.questions
      .filter(question => selectedAnswers[question.id] === undefined)
      .map(q => quizData.questions.findIndex(question => question.id === q.id) + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Quiz Navbar */}
      <div className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <button 
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4 cursor-pointer"
            >
              <FaChevronLeft className="mr-2" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-sm font-medium text-gray-800">
              {quizData.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main content with proper spacing */}
      <div className="pt-20 pb-12 border-t border-gray-100">
        <div className="container mx-auto px-4">
          {showResults ? (
            <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-sm my-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-center mb-6">Quiz Results</h2>
              <p className="text-center text-lg mb-8">Thank you for completing the quiz!</p>
              <div className="text-center">
                <button 
                  onClick={handleBack}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Return to Course
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* All Questions */}
              <div className="space-y-12 mb-10">
                {quizData.questions.map((question, qIndex) => (
                  <div key={question.id} className="p-4">
                    <div className="flex justify-between items-start mb-5">
                      <h2 className="text-lg font-medium text-gray-900">
                        {qIndex + 1}.{' '}
                        <span className="font-normal">{question.question}</span>
                      </h2>
                      <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                        1 point
                      </span>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 pl-6">
                      {question.options.map((option, index) => (
                        <label
                          key={index}
                          className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center h-5">
                            {selectedAnswers[question.id] === index ? (
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
                            name={`question-${question.id}`}
                            checked={selectedAnswers[question.id] === index}
                            onChange={() => handleSingleSelection(question.id, index)}
                          />
                        </label>
                      ))}
                    </div>
                    
                    {qIndex < quizData.questions.length - 1 && (
                      <div className="mt-8 border-b border-gray-200"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button and Warning Message */}
              <div className="flex flex-col items-center space-y-4 mt-10">
                {/* Warning Message */}
                {submitAttempted && !allQuestionsAnswered() && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 w-full max-w-md mb-4 animate-fadeIn">
                    <div className="flex items-center">
                      <FaExclamationCircle className="text-red-500 mr-2" />
                      <div>
                        <p className="text-red-700 font-medium">Please answer all questions</p>
                        <p className="text-red-600 text-sm">
                          Missing answers for question{getUnansweredQuestions().length > 1 ? 's' : ''}: {getUnansweredQuestions().join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmitClick}
                  className={`px-8 py-3 rounded-lg text-lg font-medium transition-colors w-full max-w-md
                    ${allQuestionsAnswered() 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-75'
                    }`}
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandaloneQuizPage;