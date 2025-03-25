import React from 'react';

const LessonVideo = ({ videoUrl, title }) => {
  // Extract the src attribute from the iframe string
  const extractSrc = (iframeString) => {
    const srcMatch = iframeString.match(/src="([^"]+)"/);
    return srcMatch ? srcMatch[1] : '';
  };

  const videoSrc = extractSrc(videoUrl);

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