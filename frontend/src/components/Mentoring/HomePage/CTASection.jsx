export default function CTASection() {
    return (
      <section className="text-center py-16 px-8">
        <h2 className="text-3xl font-semibold">Start Your Mentorship Journey Today</h2>
        <div className="mt-6 flex justify-center gap-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-500">
            Find a Mentor
          </button>
          <button className="bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700">
            Become a Mentor
          </button>
        </div>
      </section>
    );
  }
  