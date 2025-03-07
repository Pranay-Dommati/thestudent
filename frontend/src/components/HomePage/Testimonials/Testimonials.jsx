import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    text: "Functional tool with lots of flexible solutions for your business. I can’t recommend it enough. It has helped my business tremendously!",
    name: "Olivia Wilson",
    title: "CEO and Founder at Borcelle",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    text: "An amazing platform that changed the way we manage online courses. Highly recommend!",
    name: "John Doe",
    title: "Tech Entrepreneur",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  const nextTestimonial = () => {
    setIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="w-full py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex flex-col items-center">
      <h2 className="text-center text-3xl font-bold mb-6">What Our Users Say</h2>

      <div className="relative max-w-4xl w-full flex items-center justify-between px-8">
        {/* Left Arrow */}
        <button
          onClick={prevTestimonial}
          className="text-4xl text-white/70 hover:text-white transition"
        >
          <FaChevronLeft />
        </button>

        {/* Testimonial Content with Fixed Height */}
        <div className="flex flex-col items-center text-center max-w-xl min-h-[250px] justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <p className="text-xl italic text-white/90 mb-4">
                "{testimonials[index].text}"
              </p>
              <img
                src={testimonials[index].image}
                alt={testimonials[index].name}
                className="w-20 h-20 rounded-full border-4 border-white mb-3"
              />
              <h3 className="text-lg font-semibold">{testimonials[index].name}</h3>
              <p className="text-sm text-white/80">{testimonials[index].title}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        <button
          onClick={nextTestimonial}
          className="text-4xl text-white/70 hover:text-white transition"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}
