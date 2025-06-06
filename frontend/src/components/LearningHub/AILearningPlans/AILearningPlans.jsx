import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../utils/axios';

const AILearningPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get('/learning/user-plans/');
        setPlans(response.data.plans || []);
      } catch (error) {
        setError('Failed to load learning plans');
        console.error('Error fetching learning plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

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

  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">AI Learning Plans</h2>
        <div className="text-center text-gray-600">
          <p>You haven't created any AI learning plans yet.</p>
          <Link
            to="/chat"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            Create Your First Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">AI Learning Plans</h2>
        <Link
          to="/chat"
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Create New Plan
        </Link>
      </div>
      
      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <Link to={`/learning/${plan.id}`} className="block">
              <h3 className="font-medium text-gray-900 mb-1">{plan.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {plan.description || 'AI-generated learning plan'}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  {plan.days?.length || 0} days
                </span>
                <span className="mx-2">•</span>
                <span className={`${plan.is_completed ? 'text-green-600' : 'text-blue-600'}`}>
                  {plan.is_completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AILearningPlans;