import React, { useState } from 'react';
import CourseForm from './CourseForm';
import CourseList from './CourseList';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { useNavigate } from 'react-router-dom';
import universalToast from '../../../utils/universalToast';
import { deleteCourse } from '../../../services/courseApi';

const CourseManagement = ({ isDarkMode }) => {
    const [view, setView] = useState('list'); // 'list' or 'add'
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, course: null });
    const navigate = useNavigate();

    const handleAddNew = () => {
        navigate('/admin-p/add-course?new=true');
    };

    const handleEditCourse = (courseId, courseType) => {
        console.log(`Editing ${courseType} course with ID: ${courseId}`);
        navigate(`/admin-p/edit-course/${courseId}`);
    };

    const handleDeleteCourse = (courseId, courseType, courseName) => {
        setDeleteModal({
            isOpen: true,
            course: {
                id: courseId,
                type: courseType,
                name: courseName
            }
        });
    };

    const confirmDelete = async () => {
        const { course } = deleteModal;

        try {
            const response = await deleteCourse(course.id);

            if (response.success) {
                universalToast.success(response.message || 'Course deleted successfully!');
                // Refresh the course list
                setRefreshTrigger(prev => prev + 1);
                setDeleteModal({ isOpen: false, course: null });
            } else {
                throw new Error(response.error || 'Failed to delete course');
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            universalToast.error(error.message || 'Failed to delete course');
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ isOpen: false, course: null });
    };
    return (
        <div className={`p-0 ${isDarkMode ? 'text-white' : ''}`}>
            <div className={`rounded-lg sm:rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-lg'} transition-all`}>
                <CourseList
                    onAddNew={handleAddNew}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteCourse}
                    isDarkMode={isDarkMode}
                    refreshTrigger={refreshTrigger}
                />
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                courseName={deleteModal.course?.name}
                courseType={deleteModal.course?.type}
                isDarkMode={isDarkMode}
            />
        </div>
    );
};

export default CourseManagement;