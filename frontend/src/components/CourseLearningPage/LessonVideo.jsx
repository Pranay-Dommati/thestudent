import React from 'react';

const LessonVideo = ({ videoUrl, title }) => {
  return (
    <div className="aspect-w-16 aspect-h-9">
      <iframe
        src={videoUrl}
        title={title}
        className="w-full h-[450px]"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default LessonVideo;