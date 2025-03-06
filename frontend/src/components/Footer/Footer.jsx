import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center">
      <div className="mb-4">
        <h3 className="text-xl font-bold">Start Learning Today!</h3>
        <input
          type="email"
          placeholder="Get curated course updates"
          className="p-2 border border-gray-300 rounded mb-4 w-full max-w-md"
        />
        <br />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Subscribe</button>
      </div>
      <div className="space-x-4">
        <a href="#about" className="hover:underline">About Us</a>
        <a href="#contact" className="hover:underline">Contact</a>
        <a href="#privacy" className="hover:underline">Privacy Policy</a>
      </div>
      <div className="mt-4">
        <p>Powered by AI + YouTube</p>
      </div>
    </footer>
  );
};

export default Footer;