import React from 'react';
import { useParams } from 'react-router-dom';
import CourseDetails from '../CourseDetails';
import Navbar from '../../Navbar/Navbar';
import Footer from '../../Footer/Footer';

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  
  return (
    <>
      <Navbar initialStyle="gradient" />
      <div className="pt-16">
        <CourseDetails courseId={courseId} />
      </div>
      <Footer />
    </>
  );
};

export default CourseDetailsPage;