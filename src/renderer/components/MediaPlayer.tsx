import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MediaFile } from '../../shared/types';

interface MediaPlayerProps {
  media: MediaFile;
}

export interface MediaPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
}

export const MediaPlayer = forwardRef<MediaPlayerRef, MediaPlayerProps>(({ media }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    play: () => {
      videoRef.current?.play();
    },
    pause: () => {
      videoRef.current?.pause();
    },
    seek: (seconds: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime += seconds;
      }
    },
  }));

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
});

MediaPlayer.displayName = 'MediaPlayer';
