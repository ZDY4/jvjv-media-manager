import React, { useState, useEffect, useRef } from 'react';
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
  const [outputDir, setOutputDir] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const dir = media.path.substring(0, media.path.lastIndexOf('\\\\') + 1);
    setOutputDir(dir);

    window.electronAPI.onTrimProgress((data) => {
      setProgress(data.percent);
    });

    window.electronAPI.onTrimComplete((data) => {
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
  }, [media, onComplete, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleSelectOutputDir = async () => {
    const selected = await window.electronAPI.selectOutputDir();
    if (selected) setOutputDir(selected + '\\\\');
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
      alert('开始时间必须小于结束时间');
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    setStatus('开始剪辑...');

    await window.electronAPI.trimVideoStart({
      mode, input: media.path, output: generateOutputPath(),
      start: startTime, end: endTime,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[900px] max-h-[95vh] overflow-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-white text-lg">视频剪辑</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="p-4">
          <video ref={videoRef} src={`file://${media.path}`} className="w-full rounded mb-4" controls />
          
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">输出目录</label>
              <div className="flex gap-2">
                <input type="text" value={outputDir} readOnly className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600" />
                <button onClick={handleSelectOutputDir} disabled={isProcessing} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">浏览...</button>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input type="radio" value="keep" checked={mode === 'keep'} onChange={() => setMode('keep')} disabled={isProcessing} />
                <span>保留</span><span className="text-gray-500 text-sm">（只保留选中片段）</span>
              </label>
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input type="radio" value="remove" checked={mode === 'remove'} onChange={() => setMode('remove')} disabled={isProcessing} />
                <span>删除</span><span className="text-gray-500 text-sm">（删除选中片段，保留其余）</span>
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">开始时间 (秒)</label>
                <input type="number" value={startTime} onChange={(e) => setStartTime(parseFloat(e.target.value))} min={0} max={media.duration} step={0.1} disabled={isProcessing} className="w-full bg-gray-700 text-white px-3 py-2 rounded" />
                <p className="text-gray-500 text-xs mt-1">{formatTime(startTime)}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">结束时间 (秒)</label>
                <input type="number" value={endTime} onChange={(e) => setEndTime(parseFloat(e.target.value))} min={0} max={media.duration} step={0.1} disabled={isProcessing} className="w-full bg-gray-700 text-white px-3 py-2 rounded" />
                <p className="text-gray-500 text-xs mt-1">{formatTime(endTime)}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => videoRef.current && (videoRef.current.currentTime = startTime)} disabled={isProcessing} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">预览开始位置</button>
              <button onClick={() => videoRef.current && (videoRef.current.currentTime = endTime)} disabled={isProcessing} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">预览结束位置</button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400"><span>{status || '正在处理...'}</span><span>{progress}%</span></div>
                <div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            {!isProcessing && status && (
              <div className={`p-3 rounded text-sm ${status.includes('失败') ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>{status}</div>
            )}
            
            <button onClick={handleProcess} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded font-medium">
              {isProcessing ? '处理中...' : mode === 'keep' ? '保留片段' : '删除片段'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
