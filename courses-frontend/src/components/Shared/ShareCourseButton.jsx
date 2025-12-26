import React, { useRef, useState } from 'react';
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
    customLabel = null,
    showIcon = true,
}) => {
    // Track in-flight requests to prevent duplicate share generation
    const inFlightRef = useRef(false);
    const [isSharing, setIsSharing] = useState(false);

    // Simple per-course cache to avoid re-hitting API repeatedly
    const cacheRef = useRef({});

    const handleClick = async (e) => {
        if (preventDefault && e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!courseId) {
            universalToast.error('Missing course ID to share');
            return;
        }

        // Guard: prevent rapid multi-clicks and concurrent requests
        if (inFlightRef.current) {
            universalToast.info('Generating share link… please wait', { duration: 1500 });
            return;
        }

        try {
            inFlightRef.current = true;
            setIsSharing(true);

            // If we already have a link for this course in this session, reuse it
            let shareUrl;
            if (cacheRef.current[courseId]) {
                shareUrl = cacheRef.current[courseId];
            } else {
                // Create or fetch an active share link for this course
                const { data } = await apiAxios.post(`/courses/pro-learning/${courseId}/share/`);
                const shareId = data?.id || (typeof data?.web_url === 'string' ? data.web_url.split('/').pop() : null);
                shareUrl = shareId ? `${window.location.origin}/pro-learning/share/${shareId}` : null;
                if (shareUrl) cacheRef.current[courseId] = shareUrl;
            }

            if (!shareUrl) {
                throw new Error('Share URL not available');
            }

            if (typeof onShared === 'function') {
                try { onShared({ id: shareId, url: shareUrl }); } catch { }
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
        finally {
            inFlightRef.current = false;
            setIsSharing(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isSharing}
            className={
                (className || 'p-1.5 rounded-lg transition-all duration-200 flex-shrink-0') +
                (isSharing ? ' cursor-not-allowed bg-indigo-50 text-indigo-500' : ' text-gray-400 hover:text-indigo-600 hover:bg-indigo-50')
            }
            title={title}
            aria-label={title}
        >
            {isSharing ? (
                // Minimal inline spinner for both desktop and mobile
                <div className="flex items-center">
                    <span className={`inline-block h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin ${customLabel ? 'mr-3' : ''}`} aria-hidden="true"></span>
                    {customLabel && <span>{customLabel}</span>}
                </div>
            ) : (
                <div className="flex items-center">
                    {showIcon && <IoShareSocial size={16} className={customLabel ? 'mr-3 opacity-70' : ''} />}
                    {customLabel && <span>{customLabel}</span>}
                </div>
            )}
        </button>
    );
};

export default ShareCourseButton;
