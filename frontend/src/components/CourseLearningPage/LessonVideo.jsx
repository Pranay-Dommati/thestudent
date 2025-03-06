import React from 'react';

const LessonVideo = ({ videoUrl, title }) => {
  return (
    <div className="relative aspect-video w-full">
      <iframe
        src={videoUrl}
        title={title}
        className="absolute top-0 left-0 w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        loading="lazy"
      ></iframe>
    </div>
  );
};

export default LessonVideo;