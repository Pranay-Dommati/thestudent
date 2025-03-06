// VideoPlayer.js
import React from 'react';

const VideoPlayer = ({ videoUrl, title }) => {
  return (
    <div className="aspect-w-16 aspect-h-9">
      <iframe 
        src={videoUrl} 
        allowFullScreen
        className="w-full h-96"
        title={title}
      ></iframe>
    </div>
  );
};

export default VideoPlayer;