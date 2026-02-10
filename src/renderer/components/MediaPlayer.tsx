import React, { useRef, useEffect } from 'react';
import { MediaFile } from '../../shared/types';

interface MediaPlayerProps {
  media: MediaFile;
  onClose: () => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ media, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (media.type === 'video' && videoRef.current) {
      videoRef.current.play();
    }
  }, [media]);

  return (
    <div className="flex-1 flex flex-col bg-black relative">
      <div className="flex items-center justify-between p-2 bg-gray-800">
        <h2 className="text-white truncate flex-1 mr-4">{media.filename}</h2>
        <button
          onClick={onClose}
          className="text-white hover:bg-gray-700 px-3 py-1 rounded"
        >
          ✕ 关闭
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {media.type === 'video' ? (
          <video
            ref={videoRef}
            src={`file://${media.path}`}
            controls
            className="max-w-full max-h-full"
            autoPlay
          />
        ) : (
          <img
            ref={imageRef}
            src={`file://${media.path}`}
            alt={media.filename}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>
      
      <div className="p-2 bg-gray-800 text-sm text-gray-400">
        <span>路径: {media.path}</span>
      </div>
    </div>
  );
};
