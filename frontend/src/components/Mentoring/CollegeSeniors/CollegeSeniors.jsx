// Deprecated: Mentoring feature removed.
// export default function Removed() { return null; }

import React, { useState } from "react";
import MentoringNavbar from "../MentoringNavbar";
import Footer from "../../Footer/Footer";
import { FaStar, FaSearch } from "react-icons/fa";

const collegeSeniors = [
	{
		id: 1,
		name: "Sophia Lee",
		role: "Senior Mentor",
		university: "XYZ University",
		rating: 4.7,
		price: 0,
		image: "https://randomuser.me/api/portraits/women/5.jpg",
	},
	{
		id: 2,
		name: "Ryan Patel",
		role: "Final Year Student",
		university: "ABC University",
		rating: 4.8,
		price: 0,
		image: "https://randomuser.me/api/portraits/men/6.jpg",
	},
];

const CollegeSeniors = () => {
	const [search, setSearch] = useState("");

	const filteredMentors = collegeSeniors.filter((mentor) =>
		mentor.name.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div className="min-h-screen bg-gray-50">
			<MentoringNavbar />

			{/* Hero Section */}
			<div className="bg-gradient-to-r from-blue-600 to-blue-800 pt-24 pb-12 px-4">
				<div className="max-w-7xl mx-auto text-center text-white">
					<h1 className="text-5xl font-bold mb-4">
						Connect with College Seniors
					</h1>
					<p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
						Get guidance from experienced seniors for exams, placements, and study
						plans.
					</p>
				</div>
			</div>

			{/* Search Section */}
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="bg-white rounded-lg shadow-md p-6 -mt-16 mb-8">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								placeholder="Search seniors by name..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>
				</div>

				{/* Mentors Grid */}
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredMentors.map((mentor) => (
						<div
							key={mentor.id}
							className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
						>
							<div className="p-6">
								<div className="flex items-start gap-4">
									<img
										src={mentor.image}
										alt={mentor.name}
										className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
									/>
									<div>
										<h3 className="text-lg font-semibold">{mentor.name}</h3>
										<p className="text-blue-600 font-medium">
											{mentor.role}
										</p>
										<p className="text-gray-600">{mentor.university}</p>
										<div className="flex items-center gap-2 mt-1">
											<div className="flex items-center text-yellow-400">
												<FaStar />
												<span className="ml-1 text-gray-700">
													{mentor.rating}
												</span>
											</div>
											<span className="text-gray-500">
												({mentor.rating} / 5)
											</span>
										</div>
									</div>
								</div>

								<div className="mt-4">
									<p className="text-gray-700 font-medium">Free</p>
								</div>

								<button className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
									Book Session
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			<Footer />
		</div>
	);
};

export default CollegeSeniors;