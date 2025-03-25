import React, { useState } from 'react';
import { FaGraduationCap, FaUsers, FaCalendar, FaChalkboardTeacher, FaLightbulb, FaRocket, FaSearch, FaArrowRight, FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const MentoringPage = () => {
  const [activeSection, setActiveSection] = useState('mentors');

  const mentors = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Senior Software Engineer",
      company: "Google",
      expertise: ["Web Development", "System Design", "Cloud Architecture"],
      rating: 4.9,
      reviews: 124,
      image: "https://randomuser.me/api/portraits/women/1.jpg"
    },
    {
      id: 2,
      name: "Mike Zhang",
      role: "Startup Founder & CEO",
      company: "TechFlow AI",
      expertise: ["Entrepreneurship", "AI/ML", "Product Strategy"],
      rating: 4.8,
      reviews: 89,
      image: "https://randomuser.me/api/portraits/men/2.jpg"
    },
    {
      id: 3,
      name: "Priya Patel",
      role: "Product Manager",
      company: "Microsoft",
      expertise: ["Product Management", "UX Design", "Agile"],
      rating: 4.9,
      reviews: 156,
      image: "https://randomuser.me/api/portraits/women/3.jpg"
    },
    {
      id: 4,
      name: "David Anderson",
      role: "Investment Partner",
      company: "Tech Ventures Capital",
      expertise: ["Startup Investment", "Business Strategy", "Scaling"],
      rating: 4.7,
      reviews: 92,
      image: "https://randomuser.me/api/portraits/men/4.jpg"
    },
    {
      id: 5,
      name: "Lisa Chen",
      role: "Technical Lead",
      company: "Netflix",
      expertise: ["Distributed Systems", "Backend", "Team Leadership"],
      rating: 4.8,
      reviews: 143,
      image: "https://randomuser.me/api/portraits/women/5.jpg"
    },
    {
      id: 6,
      name: "James Wilson",
      role: "Startup Founder",
      company: "EduTech Solutions",
      expertise: ["EdTech", "Business Development", "Fundraising"],
      rating: 4.9,
      reviews: 78,
      image: "https://randomuser.me/api/portraits/men/6.jpg"
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Alex Chen",
      role: "Founder, TechLeap",
      text: "Starting as a student developer, my mentor helped me transform my final year project into a successful EdTech startup. Now we have over 50,000 users and recently raised Series A funding.",
      image: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    {
      id: 2,
      name: "Maya Patel",
      role: "Co-founder, HealthTech Innovation",
      text: "The mentorship program connected me with experienced healthcare entrepreneurs who guided me in building my healthcare startup. We've now partnered with 15 major hospitals.",
      image: "https://randomuser.me/api/portraits/women/2.jpg"
    },
    {
      id: 3,
      name: "Tom Anderson",
      role: "Founder, EcoSmart Solutions",
      text: "My mentor's guidance was crucial in pivoting my sustainable technology idea into a viable business. We're now helping hundreds of companies reduce their carbon footprint.",
      image: "https://randomuser.me/api/portraits/men/3.jpg"
    },
    {
      id: 4,
      name: "Sarah Zhang",
      role: "CEO, AI Analytics Pro",
      text: "From a college AI project to a company valued at $10M - my mentor's strategic advice and industry connections made this journey possible. We're now a team of 30 and growing.",
      image: "https://randomuser.me/api/portraits/women/4.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Navigation */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white min-h-[80vh] flex items-center">
        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 w-full">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                  S
                </div>
                <span className="font-bold text-xl text-white">Students Hub</span>
              </Link>

              {/* Section Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => setActiveSection('mentors')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === 'mentors'
                      ? 'bg-white text-blue-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Connect with Mentors
                </button>
                <button
                  onClick={() => setActiveSection('seniors')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === 'seniors'
                      ? 'bg-white text-blue-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Seniors & Alumni
                </button>
                <button
                  onClick={() => setActiveSection('insights')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === 'insights'
                      ? 'bg-white text-blue-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Mentor Insights
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 pt-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-8 leading-tight">
              Find Your Perfect Mentor
            </h1>
            <p className="text-2xl mb-12 text-blue-100 leading-relaxed max-w-2xl mx-auto">
              Connect with experienced professionals and get personalized guidance for your career journey
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
              <button className="px-12 py-5 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg">
                Connect with Mentors
              </button>
              <button className="px-12 py-5 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-all hover:shadow-lg text-lg">
                Become a Mentor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on active section */}
      <div className="container mx-auto px-4 py-12">
        {activeSection === 'mentors' && (
          <div>
            {/* Features Grid */}
            <div className="container mx-auto px-4 py-16">
              <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* 1-on-1 Mentoring */}
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <FaUsers className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">1-on-1 Mentoring</h3>
                  <p className="text-gray-600">Personal guidance sessions with experienced mentors tailored to your needs</p>
                </div>

                {/* Career Guidance */}
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <FaRocket className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Career Guidance</h3>
                  <p className="text-gray-600">Expert advice on career paths, job preparation, and professional development</p>
                </div>

                {/* Group Sessions */}
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <FaChalkboardTeacher className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Group Sessions</h3>
                  <p className="text-gray-600">Interactive group discussions and workshops on various topics</p>
                </div>

                {/* Industry Insights */}
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <FaLightbulb className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Industry Insights</h3>
                  <p className="text-gray-600">Real-world perspectives and insights from industry professionals</p>
                </div>

                {/* Skill Development */}
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <FaGraduationCap className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Skill Development</h3>
                  <p className="text-gray-600">Focused guidance on developing crucial academic and professional skills</p>
                </div>

                {/* Flexible Scheduling */}
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <FaCalendar className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
                  <p className="text-gray-600">Book sessions at your convenience with our easy scheduling system</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'seniors' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Connect with Seniors & Alumni</h2>
            {/* Add combined seniors and alumni content */}
          </div>
        )}

        {activeSection === 'insights' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Mentor Journals & Career Insights</h2>
            {/* Add insights content */}
          </div>
        )}
      </div>

      {/* Why Choose Our Mentorship */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose Our Mentorship?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <FaUsers className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Personalized Learning</h3>
              <p className="text-gray-600">One-on-one guidance tailored to your specific goals and learning pace</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <FaGraduationCap className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Expert Mentors</h3>
              <p className="text-gray-600">Learn from industry professionals with proven track records</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <FaCalendar className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600">Book sessions that fit your schedule and learning preferences</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <FaLightbulb className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-world Projects</h3>
              <p className="text-gray-600">Work on practical projects that enhance your portfolio</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-center items-start gap-8 max-w-5xl mx-auto">
            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl mb-4 mx-auto">1</div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Mentor</h3>
              <p className="text-gray-600">Browse profiles and find a mentor who matches your goals and interests</p>
            </div>

            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl mb-4 mx-auto">2</div>
              <h3 className="text-xl font-semibold mb-2">Schedule a Session</h3>
              <p className="text-gray-600">Book a time slot that works for both you and your mentor</p>
            </div>

            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl mb-4 mx-auto">3</div>
              <h3 className="text-xl font-semibold mb-2">Meet & Plan</h3>
              <p className="text-gray-600">Discuss your goals and create a personalized learning plan</p>
            </div>

            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl mb-4 mx-auto">4</div>
              <h3 className="text-xl font-semibold mb-2">Learn & Grow</h3>
              <p className="text-gray-600">Regular sessions, practical assignments, and continuous feedback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center mb-6">
                  <img src={testimonial.image} alt={testimonial.name} className="w-16 h-16 rounded-full mr-4 border-2 border-blue-100" />
                  <div>
                    <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                    <p className="text-blue-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Mentors */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-16">
            <h2 className="text-4xl font-bold">Explore Our Mentors</h2>
            <button className="flex items-center text-blue-600 hover:text-blue-700">
              View All Mentors <FaArrowRight className="ml-2" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {mentors.map(mentor => (
              <div key={mentor.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  <img src={mentor.image} alt={mentor.name} className="w-16 h-16 rounded-full mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg">{mentor.name}</h3>
                    <p className="text-gray-600 text-sm">{mentor.role} at {mentor.company}</p>
                  </div>
                </div>
                <div className="flex items-center mb-4">
                  <FaStar className="text-yellow-400" />
                  <span className="ml-1 font-medium">{mentor.rating}</span>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className="text-gray-600">{mentor.reviews} reviews</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.expertise.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Started CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            Join our community of learners and mentors to accelerate your growth
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg">
              Find a Mentor
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-all">
              Become a Mentor
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MentoringPage;
