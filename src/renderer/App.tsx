import { useState, useEffect, useRef } from 'react';
import { MediaFile } from '../shared/types';
import { MediaGrid } from './components/MediaGrid';
import { MediaPlayer } from './components/MediaPlayer';
import { TagManager } from './components/TagManager';
import { SearchBar } from './components/SearchBar';
import { VideoTrimmer } from './components/VideoTrimmer';
import { DataDirSetting } from './components/DataDirSetting';
import { useKeyboard } from './hooks/useKeyboard';

function App() {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<{ play: () => void; pause: () => void; seek: (time: number) => void } | null>(null);

  const selectedMedia = mediaList.find(m => m.id === selectedMediaId) || null;
  const selectedIndex = mediaList.findIndex(m => m.id === selectedMediaId);

  useEffect(() => {
    if (window.electronAPI) {
      setApiReady(true);
      loadMedia();
    }
  }, []);

  useEffect(() => {
    if (!apiReady) return;
    if (searchTags.length > 0) {
      searchByTags();
    } else {
      loadMedia();
    }
  }, [searchTags, apiReady]);

  const loadMedia = async () => {
    if (!window.electronAPI) return;
    const media = await window.electronAPI.getAllMedia();
    setMediaList(media);
  };

  const searchByTags = async () => {
    if (!window.electronAPI) return;
    const media = await window.electronAPI.searchMediaByTags(searchTags);
    setMediaList(media);
  };

  const handleScanFolder = async () => {
    if (!window.electronAPI) return;
    try {
      const newMedia = await window.electronAPI.scanMediaFolder();
      if (newMedia) {
        loadMedia();
      }
    } catch (error) {
      console.error('扫描文件夹失败:', error);
      alert('扫描文件夹失败: ' + (error as Error).message);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!window.electronAPI) return;
    if (confirm('确定要删除这个媒体文件吗？')) {
      await window.electronAPI.deleteMedia(mediaId);
      loadMedia();
      if (selectedMediaId === mediaId) {
        setSelectedMediaId(null);
      }
    }
  };

  const handlePlayMedia = (media: MediaFile) => {
    setSelectedMediaId(media.id);
  };

  const handlePreviousMedia = () => {
    if (selectedIndex > 0) {
      setSelectedMediaId(mediaList[selectedIndex - 1].id);
    }
  };

  const handleNextMedia = () => {
    if (selectedIndex < mediaList.length - 1) {
      setSelectedMediaId(mediaList[selectedIndex + 1].id);
    }
  };

  const handleDataDirChanged = () => {
    loadMedia();
  };

  // 注册键盘快捷键
  useKeyboard({
    onScanFolder: handleScanFolder,
    onFocusSearch: () => {
      // 聚焦到搜索框
      const searchInput = document.querySelector('input[placeholder*=\"标签\"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onPlayPause: () => {
      if (selectedMedia?.type === 'video') {
        playerRef.current?.play ? playerRef.current.play() : null;
      }
    },
    onSeekBackward: () => {
      if (selectedMedia?.type === 'video') {
        playerRef.current?.seek(-5);
      }
    },
    onSeekForward: () => {
      if (selectedMedia?.type === 'video') {
        playerRef.current?.seek(5);
      }
    },
    onDelete: () => {
      if (selectedMediaId) {
        handleDeleteMedia(selectedMediaId);
      }
    },
    onAddTag: () => {
      // 聚焦到标签输入框
      const tagInput = document.querySelector('input[placeholder*=\"标签\"]') as HTMLInputElement;
      tagInput?.focus();
    },
    onPrevious: handlePreviousMedia,
    onNext: handleNextMedia,
    onEscape: () => {
      if (showTrimmer) setShowTrimmer(false);
      else if (showSettings) setShowSettings(false);
      else if (showShortcuts) setShowShortcuts(false);
    },
  });

  return (
    <div className="flex h-screen bg-gray-900">
      {/* 左侧边栏 */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">媒体管理器</h1>
        </div>
        
        <div className="p-4">
          <button
            onClick={handleScanFolder}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
            title="快捷键: Ctrl+O"
          >
            扫描文件夹
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <SearchBar 
            selectedTags={searchTags} 
            onTagsChange={setSearchTags} 
          />
        </div>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <div className="text-sm text-gray-400">
            共 {mediaList.length} 个文件
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-full text-left text-sm text-gray-400 hover:text-white py-1"
          >
            ⚙️ 设置数据目录
          </button>
          <button
            onClick={() => setShowShortcuts(true)}
            className="w-full text-left text-sm text-gray-400 hover:text-white py-1"
          >
            ⌨️ 快捷键说明
          </button>
        </div>
      </div>

      {/* 中间：媒体列表 */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
          <h2 className="text-white font-medium">媒体库</h2>
          <span className="text-xs text-gray-400">
            {selectedIndex >= 0 ? `${selectedIndex + 1} / ${mediaList.length}` : ''}
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          <MediaGrid 
            mediaList={mediaList}
            selectedId={selectedMediaId}
            onPlay={handlePlayMedia}
            onDelete={handleDeleteMedia}
          />
        </div>
      </div>

      {/* 右侧：播放器区域 */}
      <div className="flex-1 flex flex-col">
        {selectedMedia ? (
          <>
            <div className="flex-1 flex flex-col">
              <MediaPlayer 
                media={selectedMedia}
                ref={playerRef}
              />
            </div>
            <div className="h-48 bg-gray-800 border-t border-gray-700 p-4 overflow-auto">
              <TagManager 
                media={selectedMedia}
                onUpdate={loadMedia}
              />
              {selectedMedia.type === 'video' && (
                <button
                  onClick={() => setShowTrimmer(true)}
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm"
                >
                  剪辑视频
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-4xl mb-4">▶️</p>
              <p>选择一个媒体文件开始播放</p>
              <p className="text-sm mt-2 text-gray-600">按 PageUp/PageDown 切换上一个/下一个</p>
            </div>
          </div>
        )}
      </div>

      {/* 设置对话框 */}
      {showSettings && (
        <DataDirSetting
          onClose={() => setShowSettings(false)}
          onDataDirChanged={handleDataDirChanged}
        />
      )}

      {/* 剪辑对话框 */}
      {showTrimmer && selectedMedia && (
        <VideoTrimmer
          media={selectedMedia}
          onClose={() => setShowTrimmer(false)}
          onComplete={loadMedia}
        />
      )}

      {/* 快捷键说明对话框 */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg w-[500px] p-6">
            <h2 className="text-white text-xl mb-4">⌨️ 快捷键说明</h2>
            
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-700">
                <span className="text-gray-400">Ctrl + O</span>
                <span className="text-white">扫描文件夹</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-700">
                <span className="text-gray-400">Ctrl + F</span>
                <span className="text-white">聚焦搜索框</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-700">
                <span className="text-gray-400">Space</span>
                <span className="text-white">播放/暂停</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-700">
                <span className="text-gray-400">← / →</span>
                <span className="text-white">后退/前进 5 秒</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-700">
                <span className="text-gray-400">Page Up / Page Down</span>
                <span className="text-white">上一个/下一个媒体</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-700">
                <span className="text-gray-400">Delete</span>
                <span className="text-white">删除选中媒体</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-700">
                <span className="text-gray-400">Ctrl + T</span>
                <span className="text-white">添加 Tag</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2">
                <span className="text-gray-400">Esc</span>
                <span className="text-white">关闭弹窗</span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowShortcuts(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
