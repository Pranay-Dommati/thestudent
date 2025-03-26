function Step({ number, title, description }) {
    return (
      <div className="bg-gray-100 shadow p-6 rounded-xl text-center">
        <div className="text-3xl font-bold text-blue-600">{number}</div>
        <h3 className="text-xl font-semibold mt-2">{title}</h3>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>
    );
  }
  
  export default function HowItWorks() {
    return (
      <section className="bg-white py-16 px-8">
        <h2 className="text-3xl font-semibold text-center mb-8">How It Works</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          <Step number="1" title="Browse Mentors" description="Choose a mentor based on category & expertise." />
          <Step number="2" title="Book a Session" description="Schedule a session for personalized guidance." />
          <Step number="3" title="Get Mentored" description="Gain valuable insights & career direction." />
        </div>
      </section>
    );
  }
  