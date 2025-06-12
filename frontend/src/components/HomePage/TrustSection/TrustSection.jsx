import React from 'react';

const TrustSection = () => {
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      title: "AI + Human Curation",
      description: "Best free content, structured properly by our AI and validated by experts"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "No Ads, No Clutter",
      description: "Pure learning experience without distractions or paywalls"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Personalized Playlists",
      description: "Custom learning paths based on your interests and skill level"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2" />
        </svg>
      ),
      title: "Track Your Progress",
      description: "Save playlists & continue later with seamless progress tracking"
    }
  ];

  return (
    <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden bg-gradient-to-b from-white to-gray-50 px-4">
      {/* Decorative elements with improved mobile visibility */}
      <div className="absolute -top-10 -right-10 w-28 sm:w-40 h-28 sm:h-40 bg-blue-100 rounded-full opacity-70 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 sm:w-60 h-40 sm:h-60 bg-indigo-100 rounded-full opacity-70 blur-3xl"></div>
      
      {/* Floating educational symbols - hidden on mobile */}
      <div className="hidden lg:block absolute top-1/4 left-10 opacity-5">
        <svg className="h-24 sm:h-32 w-24 sm:w-32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M9.75 12.75L4.75 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M14.25 12.75L19.25 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 13.25V19.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </div>
      <div className="hidden lg:block absolute bottom-1/4 right-10 opacity-5">
        <svg className="h-20 sm:h-24 w-20 sm:w-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6.75C13.6569 6.75 15 5.40685 15 3.75C15 2.09315 13.6569 0.75 12 0.75C10.3431 0.75 9 2.09315 9 3.75C9 5.40685 10.3431 6.75 12 6.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M6 20.25C7.65685 20.25 9 18.9069 9 17.25C9 15.5931 7.65685 14.25 6 14.25C4.34315 14.25 3 15.5931 3 17.25C3 18.9069 4.34315 20.25 6 20.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M18 20.25C19.6569 20.25 21 18.9069 21 17.25C21 15.5931 19.6569 14.25 18 14.25C16.3431 14.25 15 15.5931 15 17.25C15 18.9069 16.3431 20.25 18 20.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 6.75V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M6 14.25V10.5H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 10.5L18 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 10.5L6 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </div>
      
      <div className="container mx-auto relative z-10">
        {/* Section header with improved mobile spacing */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-block mb-3 sm:mb-4">
            <div className="flex items-center justify-center bg-blue-50 rounded-full px-3 sm:px-4 py-1 text-blue-600 font-medium text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Quality Learning, Guaranteed
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 px-4">
            Why Students <span className="text-indigo-600">Choose Us</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            We've built a learning platform focused on quality, accessibility, and personalization to help you achieve your educational goals.
          </p>
        </div>
        
        {/* Features grid with improved mobile layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-0">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              {/* Decorative gradient circle behind icon */}
              <div className="absolute -right-3 -top-3 sm:-right-4 sm:-top-4 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              <div className="relative">
                {/* Icon with animated background */}
                <div className="bg-indigo-50 group-hover:bg-indigo-100 rounded-xl p-2.5 sm:p-3 inline-flex mb-4 sm:mb-6 transition-colors duration-300">
                  <div className="text-indigo-500">{feature.icon}</div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
              
              {/* Card shine effect on hover */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;