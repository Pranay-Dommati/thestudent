import React from 'react';

const Testimonials = () => {
  const testimonials = [
    { name: 'John Doe', feedback: 'This platform helped me learn web development from scratch!' },
    { name: 'Jane Smith', feedback: 'The AI-generated playlists are amazing and very helpful.' },
  ];

  return (
    <section className="p-10 bg-gray-100 text-center">
      <h2 className="text-3xl font-bold mb-6">Testimonials & Success Stories</h2>
      <div className="space-y-6">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="bg-white p-4 rounded shadow">
            <p className="text-xl font-bold mb-2">{testimonial.name}</p>
            <p className="text-gray-600">{testimonial.feedback}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;