import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InfluencersList from './InfluencersList';
import InfluencerDetails from './InfluencerDetails';

const AdminInfluencers = ({ isDarkMode }) => {
  return (
    <Routes>
      <Route index element={<InfluencersList isDarkMode={isDarkMode} />} />
      <Route path=":id" element={<InfluencerDetails isDarkMode={isDarkMode} />} />
    </Routes>
  );
};

export default AdminInfluencers;
