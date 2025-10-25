import React from 'react';
import { FaClock, FaListAlt, FaRedo, FaCheck } from 'react-icons/fa';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const QuizIntro = ({ quizData, lessonId, onStart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Log debugging information
  console.log('QuizIntro props:', { quizData, lessonId });
  console.log('URL params:', params);
  console.log('Current path:', location.pathname);
  console.log('Quiz questions available:', 
    Array.isArray(quizData?.questions) && quizData.questions.length > 0);    const handleStartQuiz = () => {
    // Determine the correct quiz URL based on the current path
    const currentPath = location.pathname;
    let quizPath;
    
    console.log('Building quiz path from current path:', currentPath);
    
    if (currentPath.includes('/engineering/')) {
      // Engineering course path
      quizPath = `/courses/engineering/${params.courseId}/learning/quiz`;
    } else if (currentPath.includes('/10th/')) {
      // 10th class course paths
      if (currentPath.includes('/state/')) {
        quizPath = `/courses/10th/state/${params.stateId}/${params.subjectId}/learning/quiz`;
      } else {
        quizPath = `/courses/10th/cbse/${params.subjectId}/learning/quiz`;
      }
    } else if (currentPath.includes('/11th/')) {
      // 11th class course paths
      if (currentPath.includes('/state/')) {
        quizPath = `/courses/11th/state/${params.stateId}/${params.subjectId}/learning/quiz`;
      } else {
        quizPath = `/courses/11th/cbse/${params.subjectId}/learning/quiz`;
      }
    } else if (currentPath.includes('/12th/')) {
      // 12th class course paths
      if (currentPath.includes('/state/')) {
        quizPath = `/courses/12th/state/${params.stateId}/${params.subjectId}/learning/quiz`;
      } else {
        quizPath = `/courses/12th/cbse/${params.subjectId}/learning/quiz`;
      }
    } else {
      // Default fallback - append /quiz to current learning path
      quizPath = `${currentPath}/quiz`;
    }
    
    // Preserve any query parameters such as ?courseId=... to keep course context
    if (location.search) {
      quizPath = `${quizPath}${location.search}`;
    }
    console.log('Navigating to quiz path:', quizPath);
    
    // Prepare quiz questions data
    const preparedQuizData = {
      ...quizData,
      questions: Array.isArray(quizData.questions) ? 
        quizData.questions.map(q => ({
          ...q,
          // Ensure each question has an id
          id: q.id || Math.random().toString(36).substr(2, 9)
        })) : []
    };
    
    // Navigate to the standalone quiz page with quiz data
    navigate(quizPath, {
      state: { 
        quizData: preparedQuizData,
        lessonId: lessonId,
        from: location.pathname 
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="relative px-8 py-10 bg-gradient-to-r from-indigo-500/5 to-blue-500/5">
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
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
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
            onClick={handleStartQuiz}
            className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
          >
            <span className="mr-2">Start Quiz</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizIntro;