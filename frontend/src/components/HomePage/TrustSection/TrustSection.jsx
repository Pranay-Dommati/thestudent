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
    <section className="relative pt-8 pb-4 sm:pt-20 sm:pb-8 xl:pt-24 xl:pb-12 overflow-hidden bg-gradient-to-b from-white to-gray-50 px-3 sm:px-4">
      {/* Mobile version - simplified and compact */}
      <div className="block sm:hidden">
        <div className="container mx-auto max-w-lg relative z-10">
          {/* Mobile header - compact */}
          <div className="text-center mb-6">
            <div className="inline-block mb-2">
              <div className="flex items-center justify-center bg-blue-50 rounded-full px-2.5 py-1 text-blue-600 font-medium text-xs">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Why Choose Us
              </div>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight mb-2 px-2">
              Quality <span className="text-indigo-600">Learning</span>
            </h2>
            <p className="text-sm text-gray-600 max-w-sm mx-auto px-2">
              Focused on quality, accessibility, and personalization.
            </p>
          </div>
          
          {/* Mobile features - 2 column grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.slice(0, 4).map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mb-3">
                    {React.cloneElement(feature.icon, { className: "h-5 w-5 text-white" })}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop version - full experience */}
      <div className="hidden sm:block">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-28 h-28 md:w-40 md:h-40 bg-blue-100 rounded-full opacity-70 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 md:w-60 md:h-60 bg-indigo-100 rounded-full opacity-70 blur-3xl"></div>
        
        {/* Floating educational symbols */}
        <div className="hidden lg:block absolute top-1/4 left-10 opacity-5">
          <svg className="h-24 md:h-32 w-24 md:w-32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M9.75 12.75L4.75 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M14.25 12.75L19.25 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M12 13.25V19.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </div>
        <div className="hidden lg:block absolute bottom-1/4 right-10 opacity-5">
          <svg className="h-20 md:h-24 w-20 md:w-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          {/* Desktop header */}
          <div className="text-center mb-8 md:mb-10 lg:mb-16">
            <div className="inline-block mb-3 md:mb-4">
              <div className="flex items-center justify-center bg-blue-50 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-blue-600 font-medium text-sm">
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Quality Learning, Guaranteed
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 md:mb-4 px-4">
              Why Students <span className="text-indigo-600">Choose Us</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-xl sm:max-w-2xl mx-auto px-4">
              We've built a learning platform focused on quality, accessibility, and personalization to help you achieve your educational goals.
            </p>
          </div>
          
          {/* Desktop features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    {React.cloneElement(feature.icon, { className: "h-7 w-7 text-white relative z-10" })}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-indigo-700 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;