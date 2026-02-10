import React, { useState, useEffect } from 'react';
import { MediaFile } from '../shared/types';
import { MediaGrid } from './components/MediaGrid';
import { MediaPlayer } from './components/MediaPlayer';
import { TagManager } from './components/TagManager';
import { SearchBar } from './components/SearchBar';
import { VideoTrimmer } from './components/VideoTrimmer';

function App() {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [showTrimmer, setShowTrimmer] = useState(false);

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    if (searchTags.length > 0) {
      searchByTags();
    } else {
      loadMedia();
    }
  }, [searchTags]);

  const loadMedia = async () => {
    const media = await window.electronAPI.getAllMedia();
    setMediaList(media);
  };

  const searchByTags = async () => {
    const media = await window.electronAPI.searchMediaByTags(searchTags);
    setMediaList(media);
  };

  const handleScanFolder = async () => {
    const newMedia = await window.electronAPI.scanMediaFolder();
    if (newMedia) {
      loadMedia();
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (confirm('确定要删除这个媒体文件吗？')) {
      await window.electronAPI.deleteMedia(mediaId);
      loadMedia();
      if (selectedMedia?.id === mediaId) {
        setSelectedMedia(null);
        setIsPlaying(false);
      }
    }
  };

  const handlePlayMedia = (media: MediaFile) => {
    setSelectedMedia(media);
    setIsPlaying(true);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* 侧边栏 */}
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

        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          共 {mediaList.length} 个文件
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {isPlaying && selectedMedia ? (
          <div className="flex-1 flex flex-col">
            <MediaPlayer 
              media={selectedMedia} 
              onClose={() => setIsPlaying(false)}
            />
            <div className="h-48 bg-gray-800 border-t border-gray-700 p-4">
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
          </div>
        ) : (
          <MediaGrid 
            mediaList={mediaList}
            onPlay={handlePlayMedia}
            onDelete={handleDeleteMedia}
          />
        )}
      </div>

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
