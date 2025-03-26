import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import CollegeMentorship from "./components/CollegeMentorship";
import CTASection from "./components/CTASection";
import CategoryCard from "./components/CategoryCard";
import MentorCard from "./components/MentorCard";
import { FaUserGraduate, FaChalkboardTeacher, FaUsers } from "react-icons/fa";

const mentors = [
  { name: "John Doe", role: "Software Engineer at Google", rating: "⭐⭐⭐⭐⭐", price: "$20/hr" },
  { name: "Sarah Lee", role: "Product Manager at Amazon", rating: "⭐⭐⭐⭐", price: "$15/hr" },
  { name: "Mike Smith", role: "Alumni | Career Mentor", rating: "⭐⭐⭐⭐⭐", price: "Free" }
];

export default function MentoringHome() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <HeroSection />

      {/* Mentorship Categories */}
      <section className="py-16 px-8">
        <h2 className="text-3xl font-semibold text-center mb-8">Choose Your Mentorship Path</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <CategoryCard 
            icon={<FaChalkboardTeacher className="text-4xl text-blue-600" />}
            title="Industry Experts"
            description="One-on-one career guidance from professionals in top companies."
          />
          <CategoryCard 
            icon={<FaUserGraduate className="text-4xl text-green-600" />}
            title="Alumni Mentorship"
            description="Get career advice and placement guidance from experienced alumni."
          />
          <CategoryCard 
            icon={<FaUsers className="text-4xl text-purple-600" />}
            title="College Seniors"
            description="Seniors guide you in exams, placements, and study plans."
          />
        </div>
      </section>

      <HowItWorks />

      {/* Featured Mentors */}
      <section className="py-16 px-8">
        <h2 className="text-3xl font-semibold text-center mb-8">Top Mentors</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {mentors.map((mentor, index) => (
            <MentorCard key={index} mentor={mentor} />
          ))}
        </div>
      </section>

      <CollegeMentorship />
      <CTASection />
    </div>
  );
}
