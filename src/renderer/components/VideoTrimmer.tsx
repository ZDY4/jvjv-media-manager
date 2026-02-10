import { useState, useRef } from 'react';
import { MediaFile } from '../../shared/types';

interface VideoTrimmerProps {
  media: MediaFile;
  onClose: () => void;
  onComplete: () => void;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({ media, onClose, onComplete }) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(media.duration || 0);
  const [mode, setMode] = useState<'keep' | 'remove'>('keep');
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleProcess = async () => {
    if (startTime >= endTime) {
      alert('开始时间必须小于结束时间');
      return;
    }

    setIsProcessing(true);
    try {
      const outputPath = media.path.replace(/\.[^.]+$/, `_trimmed.${mode}.${Date.now()}.mp4`);
      
      if (mode === 'keep') {
        await window.electronAPI.trimVideoKeep(media.path, outputPath, startTime, endTime);
      } else {
        await window.electronAPI.trimVideoRemove(media.path, outputPath, startTime, endTime);
      }
      
      alert(`剪辑完成！\n保存至: ${outputPath}`);
      onComplete();
      onClose();
    } catch (err: any) {
      alert('剪辑失败: ' + (err?.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[800px] max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-white text-lg">视频剪辑</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="p-4">
          <video
            ref={videoRef}
            src={`file://${media.path}`}
            className="w-full rounded mb-4"
            controls
          />
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  value="keep"
                  checked={mode === 'keep'}
                  onChange={() => setMode('keep')}
                />
                保留选中片段
              </label>
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  value="remove"
                  checked={mode === 'remove'}
                  onChange={() => setMode('remove')}
                />
                删除选中片段
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm">开始时间 (秒)</label>
                <input
                  type="number"
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value))}
                  min={0}
                  max={media.duration}
                  step={0.1}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
                <p className="text-gray-500 text-xs mt-1">{formatTime(startTime)}</p>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm">结束时间 (秒)</label>
                <input
                  type="number"
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value))}
                  min={0}
                  max={media.duration}
                  step={0.1}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
                <p className="text-gray-500 text-xs mt-1">{formatTime(endTime)}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => videoRef.current && (videoRef.current.currentTime = startTime)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                预览开始
              </button>
              <button
                onClick={() => videoRef.current && (videoRef.current.currentTime = endTime)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                预览结束
              </button>
            </div>
            
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded font-medium"
            >
              {isProcessing ? '处理中...' : mode === 'keep' ? '保留片段' : '删除片段'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
