import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MediaFile } from '../../shared/types';
import { formatDurationWithMs } from '../utils/format';

interface VideoTrimmerProps {
  media: MediaFile;
  onClose: () => void;
  onComplete: () => void;
}

const MIN_WIDTH = 500;
const MIN_HEIGHT = 400;
const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 600;

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({ media, onClose, onComplete }) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(media.duration || 0);
  const [mode, setMode] = useState<'keep' | 'remove'>('keep');
  const [outputDir, setOutputDir] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  // Position and size state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });

  // Center the modal on initial render
  useEffect(() => {
    if (modalRef.current) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      setPosition({
        x: (viewportWidth - DEFAULT_WIDTH) / 2,
        y: (viewportHeight - DEFAULT_HEIGHT) / 2,
      });
    }
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, direction: string = '') => {
      if (direction) {
        // Resize
        setIsResizing(true);
        setResizeDirection(direction);
        resizeStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          width: size.width,
          height: size.height,
          left: position.x,
          top: position.y,
        };
      } else {
        // Drag
        setIsDragging(true);
        dragStartRef.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };
      }
      e.preventDefault();
    },
    [position, size]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;
        let newX = resizeStartRef.current.left;
        let newY = resizeStartRef.current.top;

        if (resizeDirection.includes('e')) {
          newWidth = Math.max(MIN_WIDTH, resizeStartRef.current.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          const proposedWidth = Math.max(MIN_WIDTH, resizeStartRef.current.width - deltaX);
          newX = resizeStartRef.current.left + (resizeStartRef.current.width - proposedWidth);
          newWidth = proposedWidth;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(MIN_HEIGHT, resizeStartRef.current.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          const proposedHeight = Math.max(MIN_HEIGHT, resizeStartRef.current.height - deltaY);
          newY = resizeStartRef.current.top + (resizeStartRef.current.height - proposedHeight);
          newHeight = proposedHeight;
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, isResizing, resizeDirection]);

  useEffect(() => {
    const dir = media.path.substring(0, media.path.lastIndexOf('\\') + 1);
    setOutputDir(dir);
  }, [media]);

  useEffect(() => {
    window.electronAPI.onTrimProgress(data => {
      setProgress(data.percent);
    });

    window.electronAPI.onTrimComplete(data => {
      setIsProcessing(false);
      if (data.success) {
        setStatus(`剪辑完成！保存至: ${data.output}`);
        setTimeout(() => {
          onComplete();
          onClose();
        }, 2000);
      } else {
        setStatus(`剪辑失败: ${data.error}`);
      }
    });
  }, [onComplete, onClose]);

  const formatTime = formatDurationWithMs;

  const handleSelectOutputDir = async () => {
    const selected = await window.electronAPI.selectOutputDir();
    if (selected) setOutputDir(selected + '\\');
  };

  const generateOutputPath = () => {
    const ext = media.filename.split('.').pop() || 'mp4';
    const baseName = media.filename.replace(/\.[^.]+$/, '');
    const timestamp = new Date().getTime();
    const modeSuffix = mode === 'keep' ? 'keep' : 'remove';
    return `${outputDir}${baseName}_${modeSuffix}_${startTime.toFixed(1)}-${endTime.toFixed(1)}_${timestamp}.${ext}`;
  };

  const handleProcess = async () => {
    if (startTime >= endTime) {
      window.showToast?.({ message: '开始时间必须小于结束时间', type: 'error' });
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    setStatus('开始剪辑...');

    try {
      await window.electronAPI.trimVideoStart({
        mode,
        input: media.path,
        output: generateOutputPath(),
        start: startTime,
        end: endTime,
      });
    } catch (error) {
      console.error('剪辑失败:', error);
      setStatus('剪辑失败');
      setIsProcessing(false);
      window.showToast?.({ message: '剪辑失败', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/60 z-40" onClick={onClose}>
      <div
        ref={modalRef}
        className="absolute bg-gray-800 rounded-lg overflow-hidden shadow-2xl flex flex-col"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Draggable header */}
        <div
          className="p-4 border-b border-gray-700 flex justify-between items-center cursor-move select-none bg-gray-800"
          onMouseDown={e => handleMouseDown(e)}
        >
          <h2 className="text-[#e0e0e0] text-lg">视频剪辑</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#e0e0e0]">
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <video
            ref={videoRef}
            src={`file://${media.path}`}
            className="w-full rounded mb-4 max-h-[200px] object-contain"
            controls
          />

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">输出目录</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={outputDir}
                  readOnly
                  className="flex-1 bg-gray-700 text-[#e0e0e0] px-3 py-2 rounded border border-gray-600"
                />
                <button
                  onClick={handleSelectOutputDir}
                  disabled={isProcessing}
                  className="bg-gray-700 hover:bg-gray-600 text-[#e0e0e0] px-4 py-2 rounded"
                >
                  浏览...
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  value="keep"
                  checked={mode === 'keep'}
                  onChange={() => setMode('keep')}
                  disabled={isProcessing}
                />
                <span>保留</span>
                <span className="text-gray-500 text-sm">（只保留选中片段）</span>
              </label>
              <label className="flex items-center gap-2 text-[#e0e0e0] cursor-pointer">
                <input
                  type="radio"
                  value="remove"
                  checked={mode === 'remove'}
                  onChange={() => setMode('remove')}
                  disabled={isProcessing}
                />
                <span>删除</span>
                <span className="text-gray-500 text-sm">（删除选中片段，保留其余）</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">开始时间 (秒)</label>
                <input
                  type="number"
                  value={startTime}
                  onChange={e => setStartTime(parseFloat(e.target.value))}
                  min={0}
                  max={media.duration}
                  step={0.1}
                  disabled={isProcessing}
                  className="w-full bg-gray-700 text-[#e0e0e0] px-3 py-2 rounded"
                />
                <p className="text-gray-500 text-xs mt-1">{formatTime(startTime)}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">结束时间 (秒)</label>
                <input
                  type="number"
                  value={endTime}
                  onChange={e => setEndTime(parseFloat(e.target.value))}
                  min={0}
                  max={media.duration}
                  step={0.1}
                  disabled={isProcessing}
                  className="w-full bg-gray-700 text-[#e0e0e0] px-3 py-2 rounded"
                />
                <p className="text-gray-500 text-xs mt-1">{formatTime(endTime)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => videoRef.current && (videoRef.current.currentTime = startTime)}
                disabled={isProcessing}
                className="bg-gray-700 hover:bg-gray-600 text-[#e0e0e0] px-4 py-2 rounded text-sm"
              >
                预览开始位置
              </button>
              <button
                onClick={() => videoRef.current && (videoRef.current.currentTime = endTime)}
                disabled={isProcessing}
                className="bg-gray-700 hover:bg-gray-600 text-[#e0e0e0] px-4 py-2 rounded text-sm"
              >
                预览结束位置
              </button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{status || '正在处理...'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {!isProcessing && status && (
              <div
                className={`p-3 rounded text-sm ${status.includes('失败') ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}
              >
                {status}
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-[#e0e0e0] py-3 rounded font-medium"
            >
              {isProcessing ? '处理中...' : mode === 'keep' ? '保留片段' : '删除片段'}
            </button>
          </div>
        </div>

        {/* Resize handles */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
          onMouseDown={e => handleMouseDown(e, 'se')}
        >
          <svg
            viewBox="0 0 16 16"
            className="w-full h-full text-gray-500 opacity-50 hover:opacity-100"
            fill="currentColor"
          >
            <path d="M11 11h4v4h-4zM6 11h4v4H6zM11 6h4v4h-4z" />
          </svg>
        </div>
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50"
          onMouseDown={e => handleMouseDown(e, 'sw')}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-50"
          onMouseDown={e => handleMouseDown(e, 'ne')}
        />
        <div
          className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-50"
          onMouseDown={e => handleMouseDown(e, 'nw')}
        />
        <div
          className="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-50"
          onMouseDown={e => handleMouseDown(e, 'n')}
        />
        <div
          className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-50"
          onMouseDown={e => handleMouseDown(e, 's')}
        />
        <div
          className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-50"
          onMouseDown={e => handleMouseDown(e, 'w')}
        />
        <div
          className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize z-50"
          onMouseDown={e => handleMouseDown(e, 'e')}
        />
      </div>
    </div>
  );
};
