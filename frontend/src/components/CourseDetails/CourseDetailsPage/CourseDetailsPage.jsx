import React from 'react';
import { useParams } from 'react-router-dom';
import CourseDetails from '../CourseDetails';
import Navbar from '../../Navbar/Navbar';
import Footer from '../../Footer/Footer';

const CourseDetailsPage = () => {
  // Get the courseId from URL parameters
  const { courseId } = useParams();
  
  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-gray-50">
        <CourseDetails courseId={courseId} />
      </div>
      <Footer />
    </>
  );
};

export default CourseDetailsPage;