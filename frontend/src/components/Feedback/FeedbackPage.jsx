import React, { useState } from "react";
import { FaPaperPlane, FaUser, FaCommentDots, FaCheckCircle } from "react-icons/fa";
import { IoHome, IoArrowBack } from "react-icons/io5";
import { Link } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import api from "../../utils/axios";

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    if (!formData.message.trim()) {
      setError("Please enter your feedback");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { data } = await api.post('/feedback/', {
        name: formData.name.trim(),
        message: formData.message.trim()
      });

      if (data) {
        setIsSubmitted(true);
        setFormData({ name: "", message: "" });
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to submit feedback. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData({ name: "", message: "" });
    setError("");
  };

  if (isSubmitted) {
    return (
      <>
        <Navbar initialStyle="light" />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden pt-20">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-green-300/20 to-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-blue-300/20 to-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
          </div>

          <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
              <div className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <FaCheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                    Thank You!
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Your feedback has been submitted successfully. We appreciate you taking the time to help us improve!
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={resetForm}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Submit Another Feedback
                  </button>
                  
                  <Link
                    to="/"
                    className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                  >
                    <IoHome size={20} />
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar initialStyle="light" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden pt-20">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-300/20 to-indigo-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-gradient-to-br from-indigo-300/20 to-purple-400/20 rounded-full blur-xl"></div>
        </div>

        <div className="relative z-10 min-h-screen py-8 px-4">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
              >
                <IoArrowBack size={20} />
                Back to Home
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                We'd Love Your Feedback
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
                Your thoughts and suggestions help us improve our platform. Share your experience with us!
              </p>
            </div>

            {/* Feedback Form */}
            <div className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="flex items-center text-gray-700 font-semibold mb-3">
                    <FaUser className="mr-2 text-indigo-500" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="flex items-center text-gray-700 font-semibold mb-3">
                    <FaCommentDots className="mr-2 text-indigo-500" />
                    Your Feedback
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your experience, suggestions, or any issues you've encountered..."
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim() || !formData.message.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Your feedback is important to us and will be reviewed by our team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackPage;
