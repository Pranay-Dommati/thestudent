import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import { useAuth } from '../../context/AuthContext';

const AuthRoutes = () => {
  const { isLoggedIn } = useAuth();  return (
    <Routes>
      <Route path="/login" element={!isLoggedIn ? <AuthForm /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!isLoggedIn ? <AuthForm /> : <Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default AuthRoutes;