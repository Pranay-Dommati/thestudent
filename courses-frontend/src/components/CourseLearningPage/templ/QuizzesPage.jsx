import React, { useState } from 'react';
import QuizIntro from './QuizIntro';
import QuizQuestion from './QuizQuestion';

const QuizzesPage = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

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
      }    ]
  };

  // Get current question
  const currentQuestion = quizData.questions[currentQuestionIndex];

  const handleSingleSelection = (optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex
    });
  };
  const _handleMultipleSelection = (optionIndex) => {
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
  const _handleTextAnswer = (text) => {
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
    <div className="min-h-screen bg-gray-50">
      {!hasStarted ? (
        <QuizIntro 
          quizData={quizData} 
          onStart={() => setHasStarted(true)} 
        />
      ) : !showResults ? (
        <QuizQuestion
          quizData={quizData}
          currentQuestion={quizData.questions[currentQuestionIndex]}
          currentQuestionIndex={currentQuestionIndex}
          selectedAnswers={selectedAnswers}
          onAnswerSelect={(index) => handleSingleSelection(index)}
          onNext={handleNextQuestion}
          onPrevious={handlePrevQuestion}
          onSubmit={handleSubmit}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
        />
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