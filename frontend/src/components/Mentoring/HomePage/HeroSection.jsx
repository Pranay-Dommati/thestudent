export default function HeroSection() {
    return (
      <section className="bg-blue-600 text-white text-center py-16">
        <h1 className="text-4xl font-bold">Find the Right Mentor for Your Career</h1>
        <p className="mt-2 text-lg">Industry Experts, Alumni, and Seniors to guide your journey</p>
        <div className="mt-6 flex justify-center gap-4">
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200">
            Find a Mentor
          </button>
          <button className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Become a Mentor
          </button>
        </div>
      </section>
    );
  }
  