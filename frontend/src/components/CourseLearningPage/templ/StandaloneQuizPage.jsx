import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaRegCircle, FaRegDotCircle, FaExclamationCircle } from 'react-icons/fa';
import axiosInstance from '../../../utils/axios';
import { toast } from 'react-hot-toast';

const StandaloneQuizPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [returnPath, setReturnPath] = useState('');  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);  // Capture the return path and quiz data when component mounts
  useEffect(() => {
    // Get the quiz data and previous path from location state
    const passedQuizData = location.state?.quizData;
    
    // Debug the quiz data being received
    console.log('Quiz data received:', passedQuizData);
    console.log('Location state:', location.state);
    console.log('Questions available:', 
      passedQuizData?.questions && Array.isArray(passedQuizData.questions) ? 
      passedQuizData.questions.length : 0);
      // Construct return path based on current URL pattern
    let defaultReturnPath;
    const currentPath = location.pathname;
    
    if (currentPath.includes('/learning/') && currentPath.includes('/quiz')) {
      // AI Learning Plan path: /learning/:learningPlanId/quiz
      const learningPlanId = params.learningPlanId;
      defaultReturnPath = `/learning/${learningPlanId}`;
    } else if (currentPath.includes('/engineering/')) {
      // Engineering course path
      defaultReturnPath = `/courses/engineering/${params.courseId}/learning`;
    } else {
      // School course path - remove /quiz from current path
      defaultReturnPath = currentPath.replace('/quiz', '');
    }
    
    const previousPath = location.state?.from || defaultReturnPath;
    
    setReturnPath(previousPath);
      if (passedQuizData && passedQuizData.questions && passedQuizData.questions.length > 0) {
      // Transform backend quiz data to the format expected by the UI
      const transformedQuizData = {
        title: passedQuizData.title,
        description: passedQuizData.description,
        timeLimit: passedQuizData.timeLimit,
        totalQuestions: passedQuizData.totalQuestions,
        passingScore: passedQuizData.passingScore,
        attempts: passedQuizData.attempts,
        questions: passedQuizData.questions.map((question, index) => {
          // Handle the case when backend data is already transformed
          if (typeof question !== 'object') {
            return {
              id: index + 1,
              question: `Question ${index + 1}`,
              options: ["Option 1", "Option 2", "Option 3", "Option 4"],
              correctAnswer: 0
            };
          }
          
          // Ensure options exists and is an array
          const options = Array.isArray(question.options) ? question.options : [];
          
          // Find the correct answer index based on the correct_answer field
          let correctAnswer = 0;
          if (question.correct_answer && options.length > 0) {
            const index = options.findIndex(option => option === question.correct_answer);
            correctAnswer = index >= 0 ? index : 0;
          }
          
          return {
            id: question.id || index + 1,
            question: question.question || `Question ${index + 1}`,
            options: options,
            correctAnswer: correctAnswer
          };
        })
      };
      setQuizData(transformedQuizData);
    } else {
      // Fallback to mock data if no quiz data is provided
      setQuizData({
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
          }        ]
      });
    }
  }, [params, location]);

  const handleSingleSelection = (questionId, index) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: index
    });
  };  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Get the lesson ID from the quiz data or location state
      const lessonId = location.state?.lessonId;
      
      console.log('Submitting quiz with lesson ID:', lessonId);
      console.log('Selected answers:', selectedAnswers);
      console.log('Quiz data questions:', quizData?.questions);
      
      // Log the actual answers being sent
      Object.keys(selectedAnswers).forEach(questionId => {
        const answerIndex = selectedAnswers[questionId];
        const question = quizData?.questions?.find(q => q.id.toString() === questionId);
        if (question && question.options) {
          console.log(`Question ${questionId}: Selected "${question.options[answerIndex]}" (index ${answerIndex})`);
        }
      });
      
      if (!lessonId) {
        toast.error('Lesson ID not found. Unable to submit quiz.');
        setSubmitting(false);
        return;
      }

      // Determine if this is an AI learning plan based on URL pattern
      const currentPath = location.pathname;
      const isAILearningPlan = currentPath.includes('/learning/') && currentPath.includes('/quiz');
      
      let response;
      
      if (isAILearningPlan) {
        // Use AI learning plan endpoint for string-based lesson IDs
        const learningPlanId = params.learningPlanId;
        console.log('Submitting AI learning plan quiz:', { learningPlanId, lessonId });
        
        response = await axiosInstance.post(
          `http://127.0.0.1:8000/api/learning/submit-quiz/${learningPlanId}/${lessonId}/`,
          { answers: selectedAnswers }
        );
      } else {
        // Use regular course endpoint for integer lesson IDs
        console.log('Submitting regular course quiz');
        
        response = await axiosInstance.post(
          `http://127.0.0.1:8000/api/quiz/submit/${lessonId}/`,
          { answers: selectedAnswers }
        );
      }

      const result = response.data;
      setQuizResult(result);
      setShowResults(true);
        if (result.passed) {
        toast(`🎉 Congratulations! You scored ${result.score.toFixed(1)}% and passed the quiz!`, {
          style: {
            backgroundColor: '#10B981',
            color: 'white',
          },
          duration: 4000
        });
      } else {
        toast(`You scored ${result.score.toFixed(1)}%. You need 80% to pass. Try again!`, {
          icon: '📊',
          duration: 4000
        });
      }
      
    } catch (error) {      console.error('Error submitting quiz:', error);
      toast('Failed to submit quiz. Please try again.', {
        icon: '❌',
        style: {
          backgroundColor: '#EF4444',
          color: 'white',
        },
        duration: 4000
      });
    } finally {
      setSubmitting(false);
    }
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
    if (submitting) return; // Prevent multiple submissions
    
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
      {!quizData ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quiz...</p>
          </div>
        </div>
      ) : (
        <>
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
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                  <span className="text-2xl text-green-600">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
                <p className="text-gray-600">Great job completing the quiz</p>
              </div>              {/* Score Summary */}
              <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Your Score</span>
                  <span className={`text-2xl font-bold ${quizResult?.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {quizResult?.score?.toFixed(1) || 0}%
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Questions Attempted</span>
                    <span className="font-medium">{Object.keys(selectedAnswers).length} of {quizData?.questions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Correct Answers</span>
                    <span className="font-medium text-green-600">{quizResult?.correct_answers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Incorrect Answers</span>
                    <span className="font-medium text-red-600">
                      {(quizResult?.total_questions || 0) - (quizResult?.correct_answers || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${quizResult?.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {quizResult?.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">                <button 
                  onClick={() => {
                    setShowResults(false);
                    setSelectedAnswers({});
                    setQuizResult(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Try Again
                </button>
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
                    </div>                    {/* Options */}
                    <div className="space-y-3 pl-6">
                      {Array.isArray(question.options) && question.options.length > 0 ? (
                        question.options.map((option, index) => (
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
                        ))
                      ) : (
                        <div className="text-red-500 p-2 bg-red-50 rounded">
                          No options available for this question. Please contact the administrator.
                        </div>
                      )}
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
                )}                {/* Submit Button */}
                <button
                  onClick={handleSubmitClick}
                  disabled={submitting}
                  className={`px-8 py-3 rounded-lg text-lg font-medium transition-colors w-full max-w-md flex items-center justify-center
                    ${allQuestionsAnswered() && !submitting
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-75'
                    }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Quiz'
                  )}
                </button></div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default StandaloneQuizPage;