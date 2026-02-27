import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMediaActions } from '../hooks/useMediaActions';

export const TitleBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setShowSettings } = useAppStore();
  const { handleAddFiles, handleAddFolder } = useMediaActions();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [activeMenu]);

  return (
    <div
      className="h-9 bg-[#2D2D2D] flex items-center justify-between select-none z-50"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Left: Menu */}
      <div className="flex items-center gap-1 px-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <span className="text-[#e0e0e0] text-sm font-semibold mr-3">媒体管理器</span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
            className={`w-9 h-7 flex items-center justify-center rounded transition-colors ${
              activeMenu === 'file'
                ? 'bg-[#005FB8] text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
            title="文件"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {activeMenu === 'file' && (
            <div className="absolute top-full left-0 mt-1 bg-[#2D2D2D] border border-[#3D3D3D] rounded-lg shadow-xl py-1 min-w-[160px] z-50">
              <button
                onClick={() => {
                  handleAddFiles();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                添加文件... <span className="text-gray-500 ml-2">Ctrl+O</span>
              </button>
              <button
                onClick={() => {
                  handleAddFolder();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                添加文件夹... <span className="text-gray-500 ml-2">Ctrl+Shift+O</span>
              </button>
              <div className="border-t border-[#3D3D3D] my-1"></div>
              <button
                onClick={() => {
                  if (window.electronAPI) {
                    window.close();
                  }
                  setActiveMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                退出 <span className="text-gray-500 ml-2">Ctrl+Q</span>
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="w-9 h-7 flex items-center justify-center rounded transition-colors text-gray-300 hover:bg-white/10 hover:text-white"
          title="设置 (Ctrl+,)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={() => window.electronAPI?.minimizeWindow?.()}
          className="w-10 h-9 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          title="最小化"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => window.electronAPI?.maximizeWindow?.()}
          className="w-10 h-9 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          title="最大化"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
        <button
          onClick={() => window.electronAPI?.closeWindow?.()}
          className="w-10 h-9 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
          title="关闭"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
