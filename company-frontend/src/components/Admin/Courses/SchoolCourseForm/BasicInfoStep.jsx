import React from 'react';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';

// Board options
const BOARD_OPTIONS = [
    { id: 'cbse', name: 'CBSE' },
    { id: 'state', name: 'State Board' },
    { id: 'icse', name: 'ICSE' },
    { id: 'nios', name: 'NIOS' },
];

// State options for state board
const STATE_OPTIONS = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal'
];

// Subject options based on class
const SUBJECT_OPTIONS = {
    '6th': [
        'English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Physics', 'Chemistry',
        'Biology', 'Social', 'Sanskrit', 'Computer Science', 'Other'
    ],
    '7th': [
        'English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Physics', 'Chemistry',
        'Biology', 'Social', 'Sanskrit', 'Computer Science', 'Other'
    ],
    '8th': [
        'English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Physics', 'Chemistry',
        'Biology', 'Social', 'Sanskrit', 'Computer Science', 'Other'
    ],
    '9th': [
        'English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Physics', 'Chemistry',
        'Biology', 'Social', 'Sanskrit', 'Computer Science', 'Other'
    ],
    '10th': [
        'English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Physics', 'Chemistry',
        'Biology', 'Social', 'Sanskrit', 'Computer Science', 'Other'
    ],
    '11th': [
        'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi', 'Telugu',
        'Computer Science', 'Economics', 'Business Studies', 'Accountancy', 'Political Science',
        'History', 'Geography', 'Psychology', 'Sociology', 'Physical Education', 'Other'
    ],
    '12th': [
        'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi', 'Telugu',
        'Computer Science', 'Economics', 'Business Studies', 'Accountancy', 'Political Science',
        'History', 'Geography', 'Psychology', 'Sociology', 'Physical Education', 'Other'
    ]
};

const BasicInfoStep = ({
    courseInfo,
    setCourseInfo,
    errors,
    thumbnailPreview,
    handleThumbnailChange,
    handleCourseInfoChange,
    handleArrayFieldChange,
    addArrayField,
    removeArrayField,
    handleChapterCountChange,
    classLevel
}) => {
    return (
        <div className="space-y-8">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Basic Course Information</h2>

            {/* Thumbnail */}
            <div className="space-y-2">
                <label className="block text-gray-700 font-medium">
                    Course Thumbnail <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-6">
                    <div
                        className={`w-32 h-32 border-2 ${errors.thumbnail ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50`}
                        onClick={() => document.getElementById('thumbnail-upload').click()}
                    >
                        {thumbnailPreview ? (
                            <img
                                src={thumbnailPreview}
                                alt="Thumbnail preview"
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <>
                                <FaUpload className="text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">Upload image</span>
                            </>
                        )}
                        <input
                            type="file"
                            id="thumbnail-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                        />
                    </div>
                    <div className="text-sm text-gray-500">
                        <p>Recommended size: 1280 x 720 pixels</p>
                        <p>Max file size: 5MB</p>
                        <p>Formats: JPG, PNG</p>
                    </div>
                </div>
                {errors.thumbnail && <p className="text-red-500 text-sm">{errors.thumbnail}</p>}
            </div>

            {/* Title */}
            <div className="space-y-2">
                <label className="block text-gray-700 font-medium">
                    Course Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="title"
                    value={courseInfo.title}
                    onChange={handleCourseInfoChange}
                    className={`w-full p-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                    placeholder={`e.g., Complete ${classLevel} ${courseInfo.subject || 'Subject'} Course - CBSE`}
                />
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            {/* Board Selection */}
            <div className="space-y-2">
                <label className="block text-gray-700 font-medium">
                    Board <span className="text-red-500">*</span>
                </label>
                <select
                    name="board"
                    value={courseInfo.board}
                    onChange={handleCourseInfoChange}
                    className={`w-full p-2 border ${errors.board ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                >
                    <option value="">Select a board</option>
                    {BOARD_OPTIONS.map(board => (
                        <option key={board.id} value={board.id}>{board.name}</option>
                    ))}
                </select>
                {errors.board && <p className="text-red-500 text-sm">{errors.board}</p>}
            </div>

            {/* State Selection (only for State Board) */}
            {courseInfo.board === 'state' && (
                <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">
                        State <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="state"
                        value={courseInfo.state}
                        onChange={handleCourseInfoChange}
                        className={`w-full p-2 border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                    >
                        <option value="">Select a state</option>
                        {STATE_OPTIONS.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                    {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
                </div>
            )}


            {/* Subject Selection */}
            <div className="space-y-2">
                <label className="block text-gray-700 font-medium">
                    Subject <span className="text-red-500">*</span>
                </label>
                <select
                    name="subject"
                    value={courseInfo.subject}
                    onChange={handleCourseInfoChange}
                    className={`w-full p-2 border ${errors.subject ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                >
                    <option value="">Select a subject</option>
                    {SUBJECT_OPTIONS[classLevel].map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                </select>
                {errors.subject && <p className="text-red-500 text-sm">{errors.subject}</p>}
            </div>

            {/* Course Source Type Selection */}
            <div className="space-y-2">
                <label className="block text-gray-700 font-medium">
                    Course Type <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4 mt-2">
                    <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${courseInfo.source_type === 'youtube' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="source_type"
                            value="youtube"
                            checked={courseInfo.source_type === 'youtube'}
                            onChange={handleCourseInfoChange}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">YouTube Curated</span>
                            <span className="text-xs text-gray-500">Curated from best YouTube channels</span>
                        </div>
                    </label>

                    <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${courseInfo.source_type === 'original' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="source_type"
                            value="original"
                            checked={courseInfo.source_type === 'original'}
                            onChange={handleCourseInfoChange}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">EasyLearnova Originals</span>
                            <span className="text-xs text-gray-500">Premium original content</span>
                        </div>
                    </label>

                    <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${courseInfo.source_type === 'exam_ready' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="source_type"
                            value="exam_ready"
                            checked={courseInfo.source_type === 'exam_ready'}
                            onChange={handleCourseInfoChange}
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">Exam Ready</span>
                            <span className="text-xs text-gray-500">Intensive exam preparation</span>
                        </div>
                    </label>
                </div>
            </div>

            {/* Sources */}
            <div className="space-y-2">
                <label className="block text-gray-700 font-medium">
                    Source Names <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="sources"
                    value={courseInfo.sources}
                    onChange={handleCourseInfoChange}
                    className={`w-full p-2 border ${errors.sources ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                    placeholder="e.g., YouTube, NCERT, etc."
                />
                {errors.sources && <p className="text-red-500 text-sm">{errors.sources}</p>}
            </div>

            {/* Duration */}
            <div className="space-y-2">
                <label className="block text-gray-700 font-medium">
                    Course Duration <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="duration"
                    value={courseInfo.duration}
                    onChange={handleCourseInfoChange}
                    className={`w-full p-2 border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                    placeholder="e.g., 40 hours"
                />
                {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
            </div>

            {/* Last Updated */}
            <div className="space-y-2">
                <label className="block text-gray-700 font-medium">Last Updated</label>
                <input
                    type="date"
                    name="lastUpdated"
                    value={courseInfo.lastUpdated}
                    onChange={handleCourseInfoChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                />
            </div>

            {/* Key Topics */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="block text-gray-700 font-medium">
                        Key Topics Covered <span className="text-red-500">*</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => addArrayField('keyTopics')}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
                    >
                        <FaPlus className="mr-1" /> Add Topic
                    </button>
                </div>

                {courseInfo.keyTopics.map((topic, index) => (
                    <div key={`topic-${index}`} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => handleArrayFieldChange('keyTopics', index, e.target.value)}
                            className={`flex-1 p-2 border ${errors.keyTopics ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                            placeholder={`Topic ${index + 1}`}
                        />
                        <button
                            type="button"
                            onClick={() => removeArrayField('keyTopics', index)}
                            className="p-2 text-red-500 hover:text-red-700"
                            disabled={courseInfo.keyTopics.length <= 1}
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}
                {errors.keyTopics && <p className="text-red-500 text-sm">{errors.keyTopics}</p>}
            </div>

            {/* What You'll Learn */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="block text-gray-700 font-medium">
                        What You'll Learn <span className="text-red-500">*</span> <span className="text-sm text-gray-500">(minimum 2)</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => addArrayField('learningPoints')}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
                    >
                        <FaPlus className="mr-1" /> Add Point
                    </button>
                </div>

                {courseInfo.learningPoints.map((point, index) => (
                    <div key={`learn-${index}`} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={point}
                            onChange={(e) => handleArrayFieldChange('learningPoints', index, e.target.value)}
                            className={`flex-1 p-2 border ${errors.learningPoints ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                            placeholder={`Learning point ${index + 1}`}
                        />
                        <button
                            type="button"
                            onClick={() => removeArrayField('learningPoints', index)}
                            className="p-2 text-red-500 hover:text-red-700"
                            disabled={courseInfo.learningPoints.length <= 2}
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}
                {errors.learningPoints && <p className="text-red-500 text-sm">{errors.learningPoints}</p>}
            </div>

            {/* Number of Chapters */}
            <div className="space-y-2">
                <label className="block text-gray-700 font-medium">
                    Number of Chapters <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    name="chapterCount"
                    value={courseInfo.chapterCount}
                    onChange={handleChapterCountChange}
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                />
            </div>
        </div>
    );
};

export default BasicInfoStep;