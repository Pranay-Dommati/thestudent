import React from "react";

const AIChatbotPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 text-white flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center p-4 bg-transparent">
        <h1 className="text-2xl font-bold">Students Hub</h1>
        <div>
          <button className="mr-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold">Log In</button>
          <button className="px-4 py-2 bg-blue-700 rounded-lg font-semibold">Sign Up</button>
        </div>
      </nav>
      
      {/* Chatbot Header */}
      <div className="text-center mt-10">
        <h2 className="text-4xl font-extrabold">AI Chatbot Assistant</h2>
        <p className="mt-2 text-lg">Ask anything about courses, learning paths, and career guidance!</p>
      </div>

      {/* Chat Interface */}
      <div className="w-full max-w-2xl bg-white text-gray-900 rounded-lg shadow-lg mt-8 p-6 flex flex-col min-h-[500px]">
        <div className="flex-1 overflow-y-auto p-2">{/* Chat Messages */}</div>
        <div className="mt-4 flex">
          <input type="text" placeholder="Type your message..." className="flex-1 p-2 border border-gray-300 rounded-lg" />
          <button className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg">Send</button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbotPage;
