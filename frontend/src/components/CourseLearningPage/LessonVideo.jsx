import React from 'react';

const LessonVideo = ({ videoUrl, title }) => {
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
    <div className="relative aspect-video w-full">
      {videoSrc ? (
        <iframe
          src={videoSrc}
          title={title}
          className="absolute top-0 left-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        ></iframe>
      ) : (
        <p className="text-center text-gray-500">Video not available</p>
      )}
    </div>
  );
};

export default LessonVideo;