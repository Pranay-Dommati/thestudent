import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaSearch, 
    FaFilter, 
    FaSortAmountDown, 
    FaGrid3X3, 
    FaList,
    FaBookmark,
    FaPlay,
    FaChevronDown
} from 'react-icons/fa';
import MobileCourseCard from './MobileCourseCard';

const MobileCourseList = ({ 
    courses = [], 
    onCourseSelect,
    showSearch = true,
    showFilters = true,
    initialViewMode = 'grid' // 'grid' or 'list'
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState(initialViewMode);
    const [sortBy, setSortBy] = useState('name'); // 'name', 'difficulty', 'popularity', 'recent'
    const [filterBy, setFilterBy] = useState('all'); // 'all', 'bookmarked', 'in-progress', 'completed'
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);

    // Filter and search logic
    const filteredAndSortedCourses = useMemo(() => {
        let filtered = courses;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(course =>
                course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.subjects?.some(subject => 
                    subject.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }

        // Apply status filter
        if (filterBy !== 'all') {
            filtered = filtered.filter(course => {
                switch (filterBy) {
                    case 'bookmarked':
                        return course.bookmarked;
                    case 'in-progress':
                        return course.status === 'in-progress';
                    case 'completed':
                        return course.status === 'completed';
                    default:
                        return true;
                }
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'difficulty':
                    const difficultyOrder = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2, 'Expert': 3 };
                    return (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
                case 'popularity':
                    return (b.students || 0) - (a.students || 0);
                case 'recent':
                    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                default: // name
                    return (a.name || a.title || '').localeCompare(b.name || b.title || '');
            }
        });

        return filtered;
    }, [courses, searchQuery, sortBy, filterBy]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const filterOptions = [
        { value: 'all', label: 'All Courses', count: courses.length },
        { value: 'bookmarked', label: 'Bookmarked', count: courses.filter(c => c.bookmarked).length },
        { value: 'in-progress', label: 'In Progress', count: courses.filter(c => c.status === 'in-progress').length },
        { value: 'completed', label: 'Completed', count: courses.filter(c => c.status === 'completed').length }
    ];

    const sortOptions = [
        { value: 'name', label: 'Name A-Z' },
        { value: 'difficulty', label: 'Difficulty' },
        { value: 'popularity', label: 'Most Popular' },
        { value: 'recent', label: 'Recently Updated' }
    ];

    const SearchBar = () => (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         bg-white shadow-sm text-sm"
            />
        </div>
    );

    const FiltersHeader = () => (
        <div className="flex items-center justify-between bg-white p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
                <button
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg 
                             hover:bg-gray-200 transition-colors"
                >
                    <FaFilter className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Filters</span>
                    <FaChevronDown className={`w-3 h-3 text-gray-500 transition-transform 
                                             ${showFiltersPanel ? 'rotate-180' : ''}`} />
                </button>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 
                             border-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                    {filteredAndSortedCourses.length} course{filteredAndSortedCourses.length !== 1 ? 's' : ''}
                </span>
                
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    >
                        <FaGrid3X3 className={`w-3 h-3 ${viewMode === 'grid' ? 'text-gray-700' : 'text-gray-400'}`} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                    >
                        <FaList className={`w-3 h-3 ${viewMode === 'list' ? 'text-gray-700' : 'text-gray-400'}`} />
                    </button>
                </div>
            </div>
        </div>
    );

    const FiltersPanel = () => (
        <AnimatePresence>
            {showFiltersPanel && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white border-b border-gray-100 overflow-hidden"
                >
                    <div className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {filterOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setFilterBy(option.value)}
                                    className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                                        filterBy === option.value
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="font-medium text-sm">{option.label}</div>
                                    <div className="text-xs text-gray-500 mt-1">{option.count} courses</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const EmptyState = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 px-4"
        >
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FaSearch className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500 text-sm mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'No courses match your current filters'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium 
                                 hover:bg-indigo-700 transition-colors"
                    >
                        Clear Search
                    </button>
                )}
                {filterBy !== 'all' && (
                    <button
                        onClick={() => setFilterBy('all')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium 
                                 hover:bg-gray-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Search Section */}
            {showSearch && (
                <div className="bg-white p-4 shadow-sm">
                    <SearchBar />
                </div>
            )}

            {/* Filters and Controls */}
            {showFilters && (
                <>
                    <FiltersHeader />
                    <FiltersPanel />
                </>
            )}

            {/* Course List */}
            <div className="p-4">
                {filteredAndSortedCourses.length === 0 ? (
                    <EmptyState />
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={`${
                            viewMode === 'grid'
                                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                                : 'space-y-3'
                        }`}
                    >
                        {filteredAndSortedCourses.map((course, index) => (
                            <MobileCourseCard
                                key={course.id || index}
                                course={course}
                                onSelect={onCourseSelect}
                                index={index}
                                variant={viewMode === 'list' ? 'compact' : 'default'}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Quick Actions Bar */}
            {filteredAndSortedCourses.length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-lg border 
                              border-gray-200 p-3 flex items-center justify-center space-x-4 z-10">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white 
                                     rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                        <FaPlay className="w-4 h-4" />
                        <span>Continue Learning</span>
                    </button>
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <FaBookmark className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default MobileCourseList;
