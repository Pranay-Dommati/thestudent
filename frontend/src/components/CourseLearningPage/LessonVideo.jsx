import React from 'react';

const LessonVideo = ({ videoUrl, title, locked = false }) => {
  // Helper: convert plain YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    // If already an embed URL
    if (url.includes('youtube.com/embed/')) return url;
    // If it's a watch?v= URL
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|v\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return '';
  };

  // Extract src from iframe string if present
  const extractSrc = (iframeString) => {
    const srcMatch = iframeString.match(/src="([^"]+)"/);
    return srcMatch ? srcMatch[1] : '';
  };

  let videoSrc = '';
  // If input is an iframe string
  if (videoUrl && videoUrl.includes('<iframe')) {
    videoSrc = extractSrc(videoUrl);
  } else {
    // Assume it's a plain YouTube URL
    videoSrc = getYouTubeEmbedUrl(videoUrl);
  }

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-video">
      {videoSrc ? (
        <>
          <iframe
            src={videoSrc}
            title={title}
            className={`absolute top-0 left-0 w-full h-full ${locked ? 'filter blur-sm pointer-events-none select-none' : ''}`}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            loading="lazy"
            frameBorder="0"
          ></iframe>
          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm text-center p-6">
              <div className="text-gray-800 font-semibold text-lg mb-2">Login to access complete content</div>
              <p className="text-gray-600 text-sm max-w-md mb-4">Preview includes a few lessons only. Sign in to unlock all videos, resources and quizzes.</p>
              <a href="/login" className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition">Login</a>
            </div>
          )}
        </>
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-center text-gray-500">Video not available</p>
        </div>
      )}
    </div>
  );
};

export default LessonVideo;
