import { useState, useEffect } from 'react';
import { MediaFile } from '../shared/types';
import { MediaGrid } from './components/MediaGrid';
import { MediaPlayer } from './components/MediaPlayer';
import { TagManager } from './components/TagManager';
import { SearchBar } from './components/SearchBar';
import { VideoTrimmer } from './components/VideoTrimmer';
import { DataDirSetting } from './components/DataDirSetting';

function App() {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  const selectedMedia = mediaList.find(m => m.id === selectedMediaId) || null;

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

  const handleDataDirChanged = () => {
    // 数据目录改变后重新加载
    loadMedia();
  };

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
        </div>
      </div>

      {/* 中间：媒体列表 */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 bg-gray-800">
          <h2 className="text-white font-medium">媒体库</h2>
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
    </div>
  );
}

export default App;
