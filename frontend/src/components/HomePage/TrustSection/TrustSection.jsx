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
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-white to-gray-50">
      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full opacity-70 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-100 rounded-full opacity-70 blur-3xl"></div>
      
      {/* Floating educational symbols */}
      <div className="hidden md:block absolute top-1/4 left-10 opacity-5">
        <svg className="h-32 w-32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M9.75 12.75L4.75 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M14.25 12.75L19.25 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 13.25V19.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </div>
      <div className="hidden md:block absolute bottom-1/4 right-10 opacity-5">
        <svg className="h-24 w-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6.75C13.6569 6.75 15 5.40685 15 3.75C15 2.09315 13.6569 0.75 12 0.75C10.3431 0.75 9 2.09315 9 3.75C9 5.40685 10.3431 6.75 12 6.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M6 20.25C7.65685 20.25 9 18.9069 9 17.25C9 15.5931 7.65685 14.25 6 14.25C4.34315 14.25 3 15.5931 3 17.25C3 18.9069 4.34315 20.25 6 20.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M18 20.25C19.6569 20.25 21 18.9069 21 17.25C21 15.5931 19.6569 14.25 18 14.25C16.3431 14.25 15 15.5931 15 17.25C15 18.9069 16.3431 20.25 18 20.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 6.75V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M6 14.25V10.5H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 10.5L18 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 10.5L6 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header with badge */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <div className="flex items-center justify-center bg-blue-50 rounded-full px-4 py-1 text-blue-600 font-medium text-sm">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Quality Learning, Guaranteed
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Why Students <span className="text-indigo-600">Choose Us</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We've built a learning platform focused on quality, accessibility, and personalization to help you achieve your educational goals.
          </p>
        </div>
        
        {/* Features grid with modern cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl p-8 transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              {/* Decorative gradient circle behind icon */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              <div className="relative">
                {/* Icon with animated background */}
                <div className="bg-indigo-50 group-hover:bg-indigo-100 rounded-xl p-3 inline-flex mb-6 transition-colors duration-300">
                  <div className="text-indigo-600">
                    {feature.icon}
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="font-bold text-xl mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
                
                {/* Interactive learn more link */}
                <div className="mt-6 group-hover:opacity-100 opacity-0 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <a href="#" className="inline-flex items-center text-indigo-600 font-medium">
                    Learn more
                    <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Social proof section */}
        <div className="mt-20 text-center">
          <p className="text-sm uppercase font-medium text-gray-500 tracking-wider mb-6">Sourced from Top Learning Platforms</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-70">
            <img className="h-8" src="https://via.placeholder.com/120x30" alt="University logo" />

          </div>
        </div>
        
        {/* Stats counter */}
        <div className="mt-20 bg-indigo-600 text-white rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="p-8 text-center border-b md:border-b-0 md:border-r border-indigo-500">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-indigo-200">Active Students</div>
            </div>
            <div className="p-8 text-center border-b md:border-b-0 md:border-r border-indigo-500">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-indigo-200">Curated Playlists</div>
            </div>
            <div className="p-8 text-center">
              <div className="text-4xl font-bold mb-2">4.9/5</div>
              <div className="text-indigo-200">Student Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;