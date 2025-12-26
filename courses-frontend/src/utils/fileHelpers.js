/**
 * Utility functions for file operations
 */

/**
 * Sanitizes a filename to ensure it meets length requirements
 * @param {File} file - The file object to sanitize
 * @param {number} maxLength - Maximum allowed filename length (default: 100)
 * @returns {File} - A new File object with sanitized name
 */
export const sanitizeFileName = (file, maxLength = 100) => {
  if (!file) return null;
  
  // Extract file extension
  const lastDot = file.name.lastIndexOf('.');
  const extension = lastDot !== -1 ? file.name.substring(lastDot) : '';
  const fileName = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
  
  // Calculate how much we need to truncate
  // We need to leave space for the extension
  const maxNameLength = maxLength - extension.length;
  
  // Truncate the filename if it's too long
  const truncatedName = fileName.length > maxNameLength 
    ? fileName.substring(0, maxNameLength - 3) + '...' 
    : fileName;
  
  // Create a new file with the sanitized name
  return new File([file], truncatedName + extension, { type: file.type });
};
