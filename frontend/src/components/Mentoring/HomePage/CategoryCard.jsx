import { FaArrowRight } from "react-icons/fa";

export default function CategoryCard({ icon, title, description }) {
  return (
    <div className="bg-white shadow-lg p-6 rounded-xl text-center hover:shadow-xl transition">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-600 mt-2">{description}</p>
      <button className="mt-4 text-blue-600 font-semibold flex items-center justify-center">
        Learn More <FaArrowRight className="ml-2" />
      </button>
    </div>
  );
}
