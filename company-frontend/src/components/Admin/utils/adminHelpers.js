export const validateCourseForm = (form) => {
  const errors = {};
  
  if (!form.title?.trim()) {
    errors.title = 'Course title is required';
  }
  
  if (!form.category) {
    errors.category = 'Please select a category';
  }
  
  if (!form.subject) {
    errors.subject = 'Please select a subject';
  }
  
  if (!form.description?.trim()) {
    errors.description = 'Course description is required';
  }
  
  if (form.subtopics.length === 0) {
    errors.subtopics = 'At least one subtopic is required';
  }
  
  return errors;
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const generateCourseSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};