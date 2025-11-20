import React from 'react';
import { FaClock, FaListAlt, FaRedo, FaCheck } from 'react-icons/fa';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

/**
 * QuizIntro
 * Canonicalizes quiz navigation to ID-based learning route only.
 * Previous implementation rebuilt many hierarchical class / board / state paths
 * which led to inconsistent loading when refreshing or deep-linking.
 * Now we ALWAYS navigate to: /courses/:courseId/learning/quiz
 * where courseId is sourced from either route params or ?courseId= query param.
 */

const QuizIntro = ({ quizData, lessonId, onStart, isLoading }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Log debugging information
  console.log('QuizIntro props:', { quizData, lessonId });
  console.log('URL params:', params);
  console.log('Current path:', location.pathname);
  console.log('Quiz questions available:', 
    Array.isArray(quizData?.questions) && quizData.questions.length > 0);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="px-8 py-10 bg-gray-50">
            <div className="max-w-2xl">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>

          {/* Quiz Details Grid */}
          <div className="grid grid-cols-2 gap-6 p-8 bg-white">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions Section */}
          <div className="p-8 bg-gray-50 border-t border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-200 mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Button Section */}
          <div className="p-8 bg-white border-t border-gray-200">
            <div className="w-full h-14 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleStartQuiz = () => {
    // Derive courseId strictly from param or query string (canonical ID approach)
    const searchParams = new URLSearchParams(location.search || '');
    const courseId = params.courseId || searchParams.get('courseId');

    if (!courseId) {
      console.error('QuizIntro: Missing courseId; cannot start quiz.');
      // Optionally we could navigate back or show a toast here.
      return;
    }

    // Build canonical quiz path
    let quizPath = `/courses/${courseId}/learning/quiz`;

    // Preserve other query params EXCEPT courseId to avoid duplication
    const preserved = [];
    searchParams.forEach((value, key) => {
      if (key !== 'courseId') preserved.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
    if (preserved.length) {
      quizPath += `?${preserved.join('&')}`;
    }

    console.log('Navigating (canonical) to quiz path:', quizPath);

    // Normalize / enrich quiz questions ensuring each has an id
    const preparedQuizData = {
      ...quizData,
      questions: Array.isArray(quizData?.questions)
        ? quizData.questions.map(q => ({
            ...q,
            id: q.id || Math.random().toString(36).slice(2, 11)
          }))
        : []
    };

    navigate(quizPath, {
      state: {
        quizData: preparedQuizData,
        lessonId,
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