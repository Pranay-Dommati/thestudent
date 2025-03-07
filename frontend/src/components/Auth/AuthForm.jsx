import { useState } from "react";
import { FaGoogle, FaFacebook, FaGraduationCap } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50 px-4">
      <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Welcome Section - Left Side */}
        <div 
          className={`flex flex-col items-center justify-center p-10 text-white w-full md:w-1/2 transition-all duration-500 ${isSignUp ? 'bg-blue-600' : 'bg-blue-600'}`}
        >
          <FaGraduationCap className="text-5xl mb-6" />
          <h2 className="text-3xl font-bold mb-4 text-center">
            {isSignUp ? 'Welcome to Students Hub!' : 'Welcome Back!'}
          </h2>
          <p className="text-sm text-center mb-6 max-w-xs">
            {isSignUp 
              ? 'Join our community to access free courses, learning paths, and educational resources.' 
              : 'Sign in to continue your learning journey and access your saved courses.'}
          </p>
          <button 
            onClick={toggleForm}
            className="mt-4 px-8 py-2 border-2 border-white text-white rounded-full hover:bg-white hover:text-blue-600 transition-colors"
          >
            {isSignUp ? 'Already have an account' : 'Create an account'}
          </button>
        </div>

        {/* Form Side - Right Side */}
        <div className="flex w-full md:w-1/2 flex-col items-center justify-center px-10 py-16">
          {isSignUp ? (
            <>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Sign Up</h2>
              <form className="w-full max-w-sm space-y-5">
                <input className="w-full p-3 border rounded-lg" type="text" placeholder="Full Name" />
                <input className="w-full p-3 border rounded-lg" type="email" placeholder="Email Address" />
                <input className="w-full p-3 border rounded-lg" type="password" placeholder="Create Password" />
                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
                  Create Account
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Login</h2>
              <form className="w-full max-w-sm space-y-5">
                <input className="w-full p-3 border rounded-lg" type="email" placeholder="Email Address" />
                <input className="w-full p-3 border rounded-lg" type="password" placeholder="Password" />
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-1" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
                  Login
                </button>
              </form>
            </>
          )}

          <div className="w-full max-w-sm">
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-gray-500 text-sm">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button className="flex-1 p-3 border rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
                <FaGoogle className="text-red-500 mr-2" />
                <span className="text-sm">Google</span>
              </button>
              <button className="flex-1 p-3 border rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
                <FaFacebook className="text-blue-700 mr-2" />
                <span className="text-sm">Facebook</span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-600">
            <span>By continuing, you agree to our </span>
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            <span> & </span>
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}