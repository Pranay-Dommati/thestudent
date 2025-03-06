import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import CourseLearning from './CourseLearning';

const CourseLearningPage = () => {
  const { courseId } = useParams();

  return (
    <>
      <Navbar  initialStyle="light" />
      <div className="pt-16 min-h-screen bg-gray-50">
        <CourseLearning courseId={courseId} />
      </div>
      <Footer />
    </>
  );
};

export default CourseLearningPage;