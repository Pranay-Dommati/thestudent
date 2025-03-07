import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './AuthForm';

const AuthRoutes = () => {
  // You can add authentication state check here
  const isAuthenticated = false; // Replace with actual auth check

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <AuthForm /> : <Navigate to="/chat" />} />
      <Route path="/signup" element={!isAuthenticated ? <AuthForm /> : <Navigate to="/chat" />} />
    </Routes>
  );
};

export default AuthRoutes;