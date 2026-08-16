import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PackList from './PackList';
import PackDetail from './PackDetail';

const InterviewPrepAdmin = ({ isDarkMode }) => {
  return (
    <Routes>
      <Route index element={<PackList isDarkMode={isDarkMode} />} />
      <Route path=":packId" element={<PackDetail isDarkMode={isDarkMode} />} />
    </Routes>
  );
};

export default InterviewPrepAdmin;
