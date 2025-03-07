import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Functional tool with lots of flexible solutions for your business. I can’t recommend it enough. It has helped my business tremendously!",
    name: "Olivia Wilson",
    role: "CEO and Founder at Borcelle",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    quote:
      "Absolutely love the structured learning paths! The AI-powered curation is a game-changer.",
    name: "David Miller",
    role: "Software Engineer at TechCorp",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  
  const nextTestimonial = () => {
    setIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-6 text-center">
      <h2 className="text-3xl font-bold mb-6">What Our Users Say</h2>
      <div className="relative max-w-2xl mx-auto">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-lg"
        >
          <p className="text-lg mb-4">"{testimonials[index].quote}"</p>
          <div className="flex flex-col items-center">
            <img
              src={testimonials[index].image}
              alt={testimonials[index].name}
              className="w-16 h-16 rounded-full border-2 border-white"
            />
            <h3 className="text-xl font-semibold mt-3">{testimonials[index].name}</h3>
            <p className="text-sm opacity-80">{testimonials[index].role}</p>
          </div>
        </motion.div>
        <button onClick={prevTestimonial} className="absolute left-0 top-1/2 -translate-y-1/2 text-white p-3">
          <FaChevronLeft size={24} />
        </button>
        <button onClick={nextTestimonial} className="absolute right-0 top-1/2 -translate-y-1/2 text-white p-3">
          <FaChevronRight size={24} />
        </button>
      </div>
    </section>
  );
}
