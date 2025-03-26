export default function MentorCard({ mentor }) {
    return (
      <div className="bg-white shadow-lg p-6 rounded-xl text-center hover:shadow-xl transition">
        <h3 className="text-xl font-semibold">{mentor.name}</h3>
        <p className="text-gray-600">{mentor.role}</p>
        <p className="text-yellow-500 font-semibold mt-2">{mentor.rating}</p>
        <p className="text-gray-800 font-semibold mt-2">{mentor.price}</p>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-500">
          Book Session
        </button>
      </div>
    );
  }
  