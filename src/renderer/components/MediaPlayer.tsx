import React, { useRef, useEffect } from 'react';
import { MediaFile } from '../../shared/types';

interface MediaPlayerProps {
  media: MediaFile;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ media }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (media.type === 'video' && videoRef.current) {
      videoRef.current.play();
    }
  }, [media]);

  return (
    <div className="flex-1 flex flex-col bg-black">
      <div className="flex items-center p-2 bg-gray-800">
        <h2 className="text-white truncate flex-1">{media.filename}</h2>
      </div>
      
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {media.type === 'video' ? (
          <video
            ref={videoRef}
            src={`file://${media.path}`}
            controls
            className="max-w-full max-h-full rounded"
            autoPlay
          />
        ) : (
          <img
            src={`file://${media.path}`}
            alt={media.filename}
            className="max-w-full max-h-full object-contain rounded"
          />
        )}
      </div>
      
      <div className="p-2 bg-gray-800 text-sm text-gray-400">
        <span>路径: {media.path}</span>
      </div>
    </div>
  );
};
