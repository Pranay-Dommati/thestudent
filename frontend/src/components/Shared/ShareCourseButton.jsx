import React from 'react';
import { IoShareSocial } from 'react-icons/io5';
import universalToast from '../../utils/universalToast';
import apiAxios from '../../utils/axios';

/**
 * ShareCourseButton
 * Reusable share action for Pro Learning courses.
 *
 * Props:
 * - courseId: string (required)
 * - courseTitle: string (optional, used for Web Share title)
 * - className: string (optional, styling for the button)
 * - title: string (optional, tooltip/title attribute for the button)
 * - onShared: function(share) (optional) => called with { id, url }
 * - preventDefault: boolean (default true) => if true, prevents default/propagation on click
 */
const ShareCourseButton = ({
  courseId,
  courseTitle,
  className = '',
  title = 'Share course',
  onShared,
  preventDefault = true,
}) => {
  const handleClick = async (e) => {
    if (preventDefault && e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!courseId) {
      universalToast.error('Missing course ID to share');
      return;
    }

    try {
      // Create or fetch an active share link for this course
      const { data } = await apiAxios.post(`/courses/pro-learning/${courseId}/share/`);
      const shareId = data?.id || (typeof data?.web_url === 'string' ? data.web_url.split('/').pop() : null);
      const shareUrl = shareId ? `${window.location.origin}/pro-learning/share/${shareId}` : null;

      if (!shareUrl) {
        throw new Error('Share URL not available');
      }

      if (typeof onShared === 'function') {
        try { onShared({ id: shareId, url: shareUrl }); } catch {}
      }

      // Prefer native share if available, fallback to clipboard
      if (navigator.share) {
        try {
          await navigator.share({
            title: courseTitle || 'Shared Course',
            text: courseTitle ? `Check out this course: ${courseTitle}` : undefined,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return; // user cancelled
          // continue to clipboard if share failed
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      universalToast.success('Share link copied to clipboard', { duration: 2000 });
    } catch (err) {
      console.error('Failed to create share link:', err);
      universalToast.error('Could not create a shareable link. Please try again.', { duration: 2500 });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className || 'p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 flex-shrink-0'}
      title={title}
      aria-label={title}
    >
      <IoShareSocial size={16} />
    </button>
  );
};

export default ShareCourseButton;
