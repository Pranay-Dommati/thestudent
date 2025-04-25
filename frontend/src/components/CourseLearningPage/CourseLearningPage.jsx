import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import CourseLearning from './CourseLearning';

const CourseLearningPage = () => {
  // Extract all route parameters
  const params = useParams();
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Callback to receive sidebar visibility changes from CourseLearning component
  const handleSidebarToggle = (isVisible) => {
    setSidebarVisible(isVisible);
  };

  return (
    <>
      <Navbar initialStyle="light" />
      <div className="pt-16 min-h-screen bg-gray-50">
        <CourseLearning 
          params={params}
          pathname={location.pathname}
          onSidebarToggle={handleSidebarToggle}
        />
      </div>
      {/* Footer now responds to sidebar visibility */}
      <div className={`transition-all duration-300 ${sidebarVisible ? 'mr-[400px]' : ''}`}>
        <Footer />
      </div>
    </>
  );
};

export default CourseLearningPage;