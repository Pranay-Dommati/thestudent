import { useState } from "react";

const collegeSeniors = [
  {
    id: 1,
    name: "Sophia Lee",
    role: "Senior Mentor",
    company: "XYZ University",
    rating: 4.7,
    price: 0,
    image: "/sophia.jpg",
  },
  {
    id: 2,
    name: "Ryan Patel",
    role: "Final Year Student",
    company: "ABC University",
    rating: 4.8,
    price: 0,
    image: "/ryan.jpg",
  },
];

const CollegeSeniors = () => {
  const [search, setSearch] = useState("");

  const filteredMentors = collegeSeniors.filter((mentor) =>
    mentor.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">College Seniors</h1>
      <p className="text-center text-gray-600 mb-6">
        Seniors guide you in exams, placements, and study plans.
      </p>

      <input
        type="text"
        placeholder="Search mentors..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md p-3 border rounded-lg mx-auto block"
      />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {filteredMentors.map((mentor) => (
          <div key={mentor.id} className="p-5 border rounded-xl shadow-md">
            <div className="flex gap-4 items-center">
              <img src={mentor.image} alt={mentor.name} className="w-16 h-16 rounded-full" />
              <div>
                <h3 className="text-lg font-semibold">{mentor.name}</h3>
                <p className="text-gray-500">{mentor.role} at {mentor.company}</p>
                <p className="text-yellow-500 font-semibold">⭐ {mentor.rating} / 5</p>
                <p className="text-gray-700 font-medium">Free</p>
              </div>
            </div>
            <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
              Book Session
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollegeSeniors;