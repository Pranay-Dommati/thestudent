import React from 'react';

const CourseCategories = ({ selectedCategory, onCategoryChange, categories }) => {
    // If no categories prop is provided, use these defaults
    const defaultCategories = [
        { id: 'all', name: 'All Categories' },
        { id: 'webdev', name: 'Web Development', icon: '💻' },
        { id: 'datascience', name: 'Data Science & AI', icon: '🤖' },
        { id: 'uiux', name: 'UI/UX & Graphic Design', icon: '🎨' },
        { id: 'marketing', name: 'Marketing & Business', icon: '📊' },
        { id: 'personal', name: 'Personal Development', icon: '🚀' }
    ];
    
    // Use provided categories or fall back to defaults
    const displayCategories = categories || defaultCategories;

    return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
            <ul className="space-y-2">
                {displayCategories.map(category => (
                    <li key={category.id}>
                        <button
                            onClick={() => onCategoryChange(category.id)}
                            className={`w-full text-left py-2 px-3 rounded-lg flex items-center ${
                                selectedCategory === category.id
                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {category.icon && <span className="mr-2">{category.icon}</span>}
                            {category.name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CourseCategories;