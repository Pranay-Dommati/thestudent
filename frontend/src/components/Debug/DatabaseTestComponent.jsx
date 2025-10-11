/**
 * Test Component for Database Fetch Issues
 * Use this to test if API calls are working from frontend to backend
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const DatabaseTestComponent = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoints = [
    { name: 'School Courses', endpoint: '/courses/school/' },
    { name: 'Engineering Courses', endpoint: '/courses/engineering/' },
    { name: 'Google Auth URL', endpoint: '/auth/google/auth-url/' },
  ];

  const testEndpoint = async (endpoint) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      return {
        success: true,
        status: response.status,
        data: Array.isArray(response.data) ? `${response.data.length} items` : 'Response received',
        error: null
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 'Network Error',
        data: null,
        error: error.message || 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    const results = {};

    for (const test of testEndpoints) {
      console.log(`Testing ${test.name}...`);
      results[test.name] = await testEndpoint(test.endpoint);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Database Fetch Test</h2>
      <p className="text-gray-600 mb-4">
        Testing API endpoints from frontend to backend
      </p>

      <div className="mb-4">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {testEndpoints.map((test) => {
          const result = testResults[test.name];
          if (!result) {
            return (
              <div key={test.name} className="p-3 bg-gray-100 rounded">
                <h3 className="font-semibold">{test.name}</h3>
                <p className="text-gray-500">Not tested yet</p>
              </div>
            );
          }

          return (
            <div
              key={test.name}
              className={`p-3 rounded ${result.success ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border`}
            >
              <h3 className="font-semibold flex items-center">
                {result.success ? '✅' : '❌'} {test.name}
                <span className={`ml-2 px-2 py-1 text-xs rounded ${result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {result.status}
                </span>
              </h3>
              <p className="text-sm mt-1">
                <strong>Endpoint:</strong> {API_BASE_URL}{test.endpoint}
              </p>
              {result.data && (
                <p className="text-sm mt-1">
                  <strong>Result:</strong> {result.data}
                </p>
              )}
              {result.error && (
                <p className="text-sm mt-1 text-red-600">
                  <strong>Error:</strong> {result.error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800">Configuration Check</h3>
        <p className="text-sm text-blue-700 mt-1">
          <strong>API Base URL:</strong> {API_BASE_URL}
        </p>
        <p className="text-sm text-blue-700">
          <strong>Current Origin:</strong> {window.location.origin}
        </p>
        <p className="text-sm text-blue-700">
          <strong>Google Client ID:</strong> {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Set' : 'Not Set'}
        </p>
      </div>
    </div>
  );
};

export default DatabaseTestComponent;