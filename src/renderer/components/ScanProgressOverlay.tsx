import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMediaStore } from '../store/useMediaStore';

export const ScanProgressOverlay: React.FC = () => {
  const { scanProgress } = useAppStore();
  const { isLoading } = useMediaStore();

  if (!scanProgress && !isLoading) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#005FB8] text-[#e0e0e0] px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span>{scanProgress?.message || '加载中...'}</span>
        {scanProgress && (
          <span className="text-sm opacity-80">{scanProgress.percent}%</span>
        )}
      </div>
      {scanProgress && (
        <div className="w-full h-1 bg-[#e0e0e0]/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#e0e0e0] transition-all duration-300"
            style={{ width: `${scanProgress.percent}%` }}
          />
        </div>
      )}
    </div>
  );
};
