import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAITopicContent } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const AITopicContent = () => {
  const [topicContents, setTopicContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = useAuth();

  useEffect(() => {
    const fetchTopicContents = async () => {
      try {
        if (!auth.token) {
          setError('Please log in to view your AI topic content');
          setLoading(false);
          return;
        }

        const response = await fetchAITopicContent(auth.token);
        setTopicContents(response.results || []);
      } catch (error) {
        setError('Failed to load AI topic content');
        console.error('Error fetching AI topic content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopicContents();
  }, [auth.token]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (topicContents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">AI Topic Content</h2>
        <div className="text-center text-gray-600">
          <p>You haven't created any AI topic content yet.</p>
          <Link
            to="/pro-learning"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            Create Your First Topic
          </Link>
        </div>
      </div>
    );
  }

  // Group topic contents by course title
  const groupedContents = topicContents.reduce((acc, content) => {
    if (!acc[content.course_title]) {
      acc[content.course_title] = [];
    }
    acc[content.course_title].push(content);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">AI Topic Content</h2>
        <Link
          to="/pro-learning"
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Create New Content
        </Link>
      </div>
      
      <div className="space-y-6">
        {Object.entries(groupedContents).map(([courseTitle, contents]) => (
          <div key={courseTitle} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">{courseTitle}</h3>
            <div className="space-y-3">
              {contents.map((content) => (
                <div
                  key={content.id}
                  className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <Link to={`/pro-learning?courseTitle=${encodeURIComponent(content.course_title)}&topic=${encodeURIComponent(content.topic_name)}`} className="block">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{content.topic_name}</h4>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Reading
                          </span>
                          {content.summary && (
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Summary
                            </span>
                          )}
                          {content.videos && content.videos.length > 0 && (
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Videos ({content.videos.length})
                            </span>
                          )}
                          {content.resources && content.resources.length > 0 && (
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              Resources ({content.resources.length})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2">
                        {new Date(content.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AITopicContent; 