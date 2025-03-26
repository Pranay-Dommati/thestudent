import React from 'react';
import MentoringNavbar from '../MentoringNavbar';
import HeroSection from "./HeroSection";
import HowItWorks from "./HowItWorks";
import CollegeMentorship from "./CollegeMentorship";
import CTASection from "./CTASection";
import CategoryCard from "./CategoryCard";
import Footer from "../../Footer/Footer";
import { FaUserGraduate, FaChalkboardTeacher, FaUsers } from "react-icons/fa";

export default function MentoringHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MentoringNavbar />
      <main>
        <HeroSection />

        {/* Mentorship Categories */}
        <section className="py-20 px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Choose Your Mentorship Path</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select the mentorship category that best fits your needs and connect with experienced mentors
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <CategoryCard 
                icon={<FaChalkboardTeacher className="text-4xl text-blue-600" />}
                title="Industry Experts"
                description="One-on-one career guidance from professionals in top companies."
                path="/mentoring/industry-experts"
                stats={[
                  { value: "500+", label: "Experts" },
                  { value: "4.9", label: "Rating" }
                ]}
              />
              <CategoryCard 
                icon={<FaUserGraduate className="text-4xl text-green-600" />}
                title="Alumni Mentorship"
                description="Get career advice and placement guidance from experienced alumni."
                path="/mentoring/alumni-mentorship"
                stats={[
                  { value: "200+", label: "Alumni" },
                  { value: "98%", label: "Success" }
                ]}
              />
              <CategoryCard 
                icon={<FaUsers className="text-4xl text-purple-600" />}
                title="College Seniors"
                description="Seniors guide you in exams, placements, and study plans."
                path="/mentoring/college-seniors"
                stats={[
                  { value: "300+", label: "Seniors" },
                  { value: "Free", label: "Sessions" }
                ]}
              />
            </div>
          </div>
        </section>

        <HowItWorks />

        <CollegeMentorship />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
