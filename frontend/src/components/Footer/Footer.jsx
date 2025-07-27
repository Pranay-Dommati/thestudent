import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-10 px-4">
      <div className="max-w-6xl mx-auto text-center space-y-6">
        {/* Subscribe Section */}
        <h3 className="text-2xl font-semibold">Start Learning Today!</h3>
        <div className="flex flex-col items-center gap-3">
          <input
            type="email"
            placeholder="Enter your email for updates"
            className="p-3 border border-gray-500 rounded-md w-full md:w-1/3 bg-gray-800 text-white focus:outline-none text-left"
          />
          <button className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-md font-medium transition w-32">
            Subscribe
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
          <Link to="/feedback" className="hover:text-white">Feedback</Link>
          <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="hover:text-white">Terms of Service</Link>
        </div>

        {/* Social Media Icons */}
        <div className="flex justify-center space-x-6 text-xl mt-4">
          <a href="#" className="hover:text-blue-500"><FaFacebook /></a>
          <a href="#" className="hover:text-blue-400"><FaTwitter /></a>
          <a href="#" className="hover:text-blue-600"><FaLinkedin /></a>
          <a href="#" className="hover:text-red-600"><FaYoutube /></a>
        </div>

        {/* Copyright */}
        <p className="text-gray-400 text-sm mt-4">
          © {new Date().getFullYear()} Students Hub. Powered by AI + YouTube.
        </p>
      </div>
    </footer>
  );
};

export default Footer;