import React from 'react';

const CourseFilters = ({ filters, onFilterChange }) => {
    const skillLevels = [
        { value: 'all', label: 'All Levels' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
    ];

    const durations = [
        { value: 'all', label: 'Any Duration' },
        { value: 'short', label: 'Short (<10h)' },
        { value: 'medium', label: 'Medium (10-50h)' },
        { value: 'long', label: 'Long (>50h)' }
    ];

    const sortOptions = [
        { value: 'popular', label: 'Most Popular' },
        { value: 'newest', label: 'Newest' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'duration', label: 'Duration (Shortest First)' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Filters</h2>
            
            {/* Skill Level */}
            <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Skill Level</h3>
                <div className="space-y-2">
                    {skillLevels.map(level => (
                        <div key={level.value} className="flex items-center">
                            <input
                                type="radio"
                                id={`skill-${level.value}`}
                                name="skillLevel"
                                value={level.value}
                                checked={filters.skillLevel === level.value}
                                onChange={() => onFilterChange({ skillLevel: level.value })}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label
                                htmlFor={`skill-${level.value}`}
                                className="ml-2 text-gray-700 cursor-pointer"
                            >
                                {level.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Duration */}
            <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Duration</h3>
                <div className="space-y-2">
                    {durations.map(duration => (
                        <div key={duration.value} className="flex items-center">
                            <input
                                type="radio"
                                id={`duration-${duration.value}`}
                                name="duration"
                                value={duration.value}
                                checked={filters.duration === duration.value}
                                onChange={() => onFilterChange({ duration: duration.value })}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label
                                htmlFor={`duration-${duration.value}`}
                                className="ml-2 text-gray-700 cursor-pointer"
                            >
                                {duration.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Sort By */}
            <div>
                <h3 className="font-medium text-gray-700 mb-2">Sort By</h3>
                <select
                    value={filters.sortBy}
                    onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default CourseFilters;