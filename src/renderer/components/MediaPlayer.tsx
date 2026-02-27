import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { MediaFile } from '../../shared/types';
import { getMediaUrl } from '../utils/mediaUrl';

export interface MediaPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  togglePlayPause: () => void;
}

export interface MediaPlayerProps {
  media: MediaFile;
  onEnded?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onEditTags?: () => void;
  onTrimVideo?: () => void;
  playMode?: 'list' | 'single' | 'random';
  onTogglePlayMode?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const MediaPlayer = forwardRef<MediaPlayerRef, MediaPlayerProps>(
  ({ media, onEnded, onContextMenu, playMode, onTogglePlayMode }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showCenterIcon, setShowCenterIcon] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const centerIconTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);

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
      togglePlayPause: () => {
        if (videoRef.current) {
          if (isPlaying) {
            videoRef.current.pause();
          } else {
            videoRef.current.play();
          }
        }
      },
    }));

    useEffect(() => {
      if (media.type === 'video' && videoRef.current) {
        videoRef.current.play();
      }
    }, [media]);

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        setDuration(videoRef.current.duration || 0);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      showCenterIconTemporarily();
    };
    const handlePause = () => {
      setIsPlaying(false);
      showCenterIconTemporarily();
    };

    const showCenterIconTemporarily = () => {
      setShowCenterIcon(true);
      if (centerIconTimeoutRef.current) {
        clearTimeout(centerIconTimeoutRef.current);
      }
      centerIconTimeoutRef.current = setTimeout(() => {
        setShowCenterIcon(false);
      }, 800);
    };

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (progressRef.current && videoRef.current && duration > 0) {
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = Math.max(0, Math.min(duration, percent * duration));
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
      }
      setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
      if (videoRef.current) {
        if (isMuted) {
          videoRef.current.volume = volume || 1;
          setIsMuted(false);
        } else {
          videoRef.current.volume = 0;
          setIsMuted(true);
        }
      }
    };

    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getPlayModeIcon = () => {
      switch (playMode) {
        case 'single':
          // 单曲循环：带循环箭头的数字 1
          return (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
              <text
                x="12"
                y="15"
                textAnchor="middle"
                fontSize="8"
                fill="currentColor"
                stroke="none"
              >
                1
              </text>
            </svg>
          );
        case 'random':
          // 随机播放：交叉箭头
          return (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l7 7"
              />
            </svg>
          );
        default:
          // 列表循环：简单循环箭头
          return (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          );
      }
    };

    const getPlayModeTooltip = () => {
      switch (playMode) {
        case 'single':
          return '单曲循环';
        case 'random':
          return '随机播放';
        default:
          return '列表循环';
      }
    };

    return (
      <div
        className="flex-1 flex flex-col bg-[#1a1a1a] min-h-0 overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <div
          className="flex-1 flex items-center justify-center overflow-hidden p-4 relative"
          onContextMenu={e => {
            e.preventDefault();
            onContextMenu?.(e);
          }}
          onDoubleClick={togglePlay}
        >
          {media.type === 'video' ? (
            <video
              ref={videoRef}
              src={getMediaUrl(media.path)}
              className="rounded max-w-full max-h-full"
              style={{
                objectFit: 'contain',
              }}
              autoPlay
              onEnded={onEnded}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
            />
          ) : (
            <img
              src={getMediaUrl(media.path)}
              alt={media.filename}
              className="max-w-full max-h-full object-contain rounded"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            />
          )}

          {/* 中央播放/暂停图标 */}
          {showCenterIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center animate-pulse">
                {isPlaying ? (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部控制条 - 固定在播放窗口底部 */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/50 px-4 py-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* 进度条 */}
          <div
            ref={progressRef}
            className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-3 relative group"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-[#005FB8] rounded-full relative"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* 控制按钮区域 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 播放/暂停按钮 */}
              <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* 时间显示 */}
              <span className="text-white text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 音量控制 */}
              <button
                onClick={toggleMute}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
                title={isMuted ? '取消静音' : '静音'}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                    />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                    />
                  </svg>
                )}
              </button>

              {/* 音量滑块 */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
              />

              {/* 播放模式切换按钮 */}
              <button
                onClick={onTogglePlayMode}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
                title={`切换播放模式 (${getPlayModeTooltip()})`}
              >
                {getPlayModeIcon()}
              </button>

              {/* 全屏按钮 */}
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      videoRef.current.requestFullscreen();
                    }
                  }
                }}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
                title="全屏"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MediaPlayer.displayName = 'MediaPlayer';
