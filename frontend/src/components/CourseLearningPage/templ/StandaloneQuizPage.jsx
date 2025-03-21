import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuizQuestion from './QuizQuestion';
import Navbar from '../../Navbar/Navbar';

const StandaloneQuizPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  // Mock quiz data - in a real app, you would fetch this based on courseId
  const quizData = {
    title: "Next.js Fundamentals Quiz",
    description: "Test your understanding of key Next.js concepts covered in this lesson",
    timeLimit: "10 minutes",
    totalQuestions: 5,
    passingScore: 80,
    attempts: "Unlimited",
    questions: [
      {
        id: 1,
        question: "What is the primary benefit of using Next.js over vanilla React?",
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
        question: "What does the 'pages' directory in a Next.js project determine?",
        options: [
          "Component organization",
          "Styling structure",
          "Application routing",
          "Data fetching methods"
        ],
        correctAnswer: 2
      },
      {
        id: 5,
        question: "Which of the following is NOT a benefit of using Next.js Image component?",
        options: [
          "Automatic image optimization",
          "Responsive images",
          "Automatic WebP conversion",
          "Built-in image editing capabilities"
        ],
        correctAnswer: 3
      }
    ]
  };

  const handleSingleSelection = (index) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [quizData.questions[currentQuestionIndex].id]: index
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
    // In a real app, you would calculate score and submit to server here
    alert("Quiz submitted successfully!");
    // Navigate to results page or show results component
  };

  return (
    <>
      <Navbar initialStyle="light" />
      <div className="min-h-screen bg-gray-50 pt-24"> {/* Added pt-24 for proper spacing after navbar */}
        <div className="container mx-auto px-4">
          {showResults ? (
            <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-sm my-8">
              <h2 className="text-2xl font-bold text-center mb-6">Quiz Results</h2>
              <p className="text-center text-lg mb-8">Thank you for completing the quiz!</p>
              <div className="text-center">
                <button 
                  onClick={() => navigate(`/courses/engineering/${courseId}/learning`)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Return to Course
                </button>
              </div>
            </div>
          ) : (
            <QuizQuestion
              quizData={quizData}
              currentQuestion={quizData.questions[currentQuestionIndex]}
              currentQuestionIndex={currentQuestionIndex}
              selectedAnswers={selectedAnswers}
              onAnswerSelect={handleSingleSelection}
              onNext={handleNextQuestion}
              onPrevious={handlePrevQuestion}
              onSubmit={handleSubmit}
              setCurrentQuestionIndex={setCurrentQuestionIndex}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default StandaloneQuizPage;