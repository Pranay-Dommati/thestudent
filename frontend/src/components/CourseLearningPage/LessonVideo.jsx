import React from 'react';

const LessonVideo = ({ videoUrl, title }) => {
  // Format YouTube URLs to embed format
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // If it's already an iframe, extract the src
    if (url.includes('<iframe')) {
      const srcMatch = url.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : '';
    }
    
    // Handle YouTube URLs in various formats
    let videoId = '';
    
    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v');
    } 
    // Format: https://youtu.be/VIDEO_ID
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    // Format: https://www.youtube.com/embed/VIDEO_ID
    else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1].split('?')[0];
    }
    // If it seems to be just a video ID
    else if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
      videoId = url;
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  const videoSrc = getYouTubeEmbedUrl(videoUrl);

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
          frameBorder="0"
        ></iframe>
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-center text-gray-500">Video not available</p>
        </div>
      )}
    </div>
  );
};

export default LessonVideo;