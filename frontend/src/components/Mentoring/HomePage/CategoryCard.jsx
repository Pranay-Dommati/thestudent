import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

export default function CategoryCard({ icon, title, description, path, stats }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 p-4 bg-blue-50 rounded-full">{icon}</div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        {/* Stats */}
        <div className="flex justify-around w-full mb-6 py-4 border-y border-gray-100">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <Link 
          to={path}
          className="group flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Now
          <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
