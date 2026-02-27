import { useState, useEffect, useRef } from 'react';
import type { MediaFile } from '../shared/types';
import { MediaGrid } from './components/MediaGrid';
import { MediaPlayer } from './components/MediaPlayer';
import { TagManager } from './components/TagManager';
import { SearchBar } from './components/SearchBar';
import { VideoTrimmer } from './components/VideoTrimmer';
import { DataDirSetting } from './components/DataDirSetting';
import { Toast } from './components/Toast';
import { useKeyboard } from './hooks/useKeyboard';

interface AppRefs {
  searchInput?: HTMLInputElement | null | undefined;
  tagInput?: HTMLInputElement | null | undefined;
}

function App() {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [iconSize, setIconSize] = useState(120); // 图标大小，默认 120px
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const playerRef = useRef<{
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
  } | null>(null);
  const appRefsRef = useRef<AppRefs>({});
  const sidebarRef = useRef<HTMLDivElement>(null);

  const selectedMedia = mediaList.find(m => m.id === selectedMediaId) || null;
  const selectedIndex = mediaList.findIndex(m => m.id === selectedMediaId);

  useEffect(() => {
    // 轮询检查 window.electronAPI 是否准备好
    const checkApi = () => {
      if (window.electronAPI) {
        console.log('[App] Electron API 已加载');
        setApiReady(true);
        loadMedia();
        return true;
      }
      return false;
    };

    // 立即检查一次
    if (checkApi()) return;

    console.log('[App] 等待 Electron API 加载...');

    // 如果没准备好，每 200ms 检查一次，最多检查 100 次（20秒）
    let attempts = 0;
    const maxAttempts = 100;
    const interval = setInterval(() => {
      attempts++;
      if (checkApi() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.error('[App] Electron API 初始化超时，尝试次数:', attempts);
          console.error('[App] window.electronAPI:', window.electronAPI);
          console.error('[App] window 对象键:', Object.keys(window));
          window.showToast?.({
            message: '初始化失败: Electron API 未加载，请重启应用',
            type: 'error',
          });
        }
      }
    }, 200);

    return () => clearInterval(interval);
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
    setIsLoading(true);
    try {
      const media = await window.electronAPI.getAllMedia();
      setMediaList(media);
    } catch (error) {
      console.error('加载媒体失败:', error);
      window.showToast?.({ message: '加载媒体失败', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const searchByTags = async () => {
    if (!window.electronAPI) return;
    setIsLoading(true);
    try {
      const media = await window.electronAPI.searchMediaByTags(searchTags);
      setMediaList(media);
    } catch (error) {
      console.error('搜索失败:', error);
      window.showToast?.({ message: '搜索失败', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFiles = async () => {
    if (!window.electronAPI) {
      window.showToast?.({ message: '错误: Electron API 未初始化，请重启应用', type: 'error' });
      return;
    }
    try {
      const newMedia = await window.electronAPI.addMediaFiles();
      if (newMedia && newMedia.length > 0) {
        window.showToast?.({ message: `已添加 ${newMedia.length} 个文件`, type: 'success' });
        loadMedia();
      }
    } catch (error) {
      console.error('添加文件失败:', error);
      window.showToast?.({ message: '添加文件失败: ' + (error as Error).message, type: 'error' });
    }
  };

  const handleAddFolder = async () => {
    if (!window.electronAPI) {
      window.showToast?.({ message: '错误: Electron API 未初始化，请重启应用', type: 'error' });
      return;
    }
    try {
      const newMedia = await window.electronAPI.addMediaFolder();
      if (newMedia && newMedia.length > 0) {
        window.showToast?.({ message: `已添加 ${newMedia.length} 个文件`, type: 'success' });
        loadMedia();
      }
    } catch (error) {
      console.error('添加文件夹失败:', error);
      window.showToast?.({ message: '添加文件夹失败: ' + (error as Error).message, type: 'error' });
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!window.electronAPI) return;
    if (confirm('确定要删除这个媒体文件吗？')) {
      try {
        const result = await window.electronAPI.deleteMedia(mediaId);
        if (result.success) {
          loadMedia();
          if (selectedMediaId === mediaId) {
            setSelectedMediaId(null);
          }
          window.showToast?.({ message: result.message || '删除成功', type: 'success' });
        } else {
          window.showToast?.({ message: result.error || '删除失败', type: 'error' });
        }
      } catch (error) {
        console.error('删除失败:', error);
        window.showToast?.({ message: '删除失败', type: 'error' });
      }
    }
  };

  const handlePlayMedia = (media: MediaFile) => {
    setSelectedMediaId(media.id);
  };

  const handlePreviousMedia = () => {
    if (selectedIndex > 0) {
      const prevMedia = mediaList[selectedIndex - 1];
      if (prevMedia) setSelectedMediaId(prevMedia.id);
    }
  };

  const handleNextMedia = () => {
    if (selectedIndex < mediaList.length - 1) {
      const nextMedia = mediaList[selectedIndex + 1];
      if (nextMedia) setSelectedMediaId(nextMedia.id);
    }
  };

  const handleDataDirChanged = () => {
    loadMedia();
  };

  // 注册键盘快捷键
  useKeyboard({
    onScanFolder: handleAddFolder,
    onFocusSearch: () => {
      appRefsRef.current.searchInput?.focus();
    },
    onPlayPause: () => {
      if (selectedMedia?.type === 'video') {
        playerRef.current?.play();
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
      appRefsRef.current.tagInput?.focus();
    },
    onPrevious: handlePreviousMedia,
    onNext: handleNextMedia,
    onEscape: () => {
      if (showTrimmer) {
        setShowTrimmer(false);
      } else if (showSettings) {
        setShowSettings(false);
      } else if (showShortcuts) {
        setShowShortcuts(false);
      }
    },
  });

  // 侧边栏自动隐藏逻辑
  useEffect(() => {
    if (sidebarPinned || !selectedMedia) {
      setSidebarVisible(true);
      return;
    }

    // 有选中媒体且未 pin 时，默认隐藏
    setSidebarVisible(false);
  }, [selectedMedia, sidebarPinned]);

  // 处理鼠标进入侧边栏
  const handleSidebarMouseEnter = () => {
    if (!sidebarPinned && selectedMedia) {
      setSidebarVisible(true);
    }
  };

  // 处理鼠标离开侧边栏
  const handleSidebarMouseLeave = () => {
    if (!sidebarPinned && selectedMedia) {
      setSidebarVisible(false);
    }
  };

  // API 未就绪时显示加载中界面
  if (!apiReady) {
    return (
      <div className="flex h-screen bg-[#202020] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#005FB8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg mb-2">正在初始化...</p>
          <p className="text-gray-400 text-sm">等待 Electron API 加载</p>
        </div>
      </div>
    );
  }

  return (
