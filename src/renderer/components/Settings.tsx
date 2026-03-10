import React, { useState, useEffect } from 'react';
import {
  AutoUpdateStatus,
  CacheClearScope,
  CacheStatus,
  PortableModeStatus,
  WatchedFolder,
} from '@/shared/types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onDataDirChanged: () => void;
  watchedFolders: WatchedFolder[];
  onWatchedFoldersChange: (folders: WatchedFolder[]) => void;
  unlockedFolders: string[];
  onUnlockFolder: (path: string) => void;
  lockPassword: string;
  onSetLockPassword: (password: string) => void;
}

type SettingsTab = 'general' | 'folders' | 'shortcuts';

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  onDataDirChanged,
  watchedFolders,
  onWatchedFoldersChange,
  unlockedFolders,
  onUnlockFolder,
  lockPassword,
  onSetLockPassword,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [currentDir, setCurrentDir] = useState('');
  const [newDir, setNewDir] = useState('');
  const [unlockingFolder, setUnlockingFolder] = useState<WatchedFolder | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [autoUpdateStatus, setAutoUpdateStatus] = useState<AutoUpdateStatus>({
    status: 'idle',
    message: '尚未检查更新',
  });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [portableMode, setPortableMode] = useState<PortableModeStatus>({
    enabled: false,
    dataDir: '',
    writable: false,
  });
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    dataDir: '',
    writable: false,
    sizeBytes: 0,
  });
  const [cacheScope, setCacheScope] = useState<CacheClearScope>('cache_only');
  const [isClearingCache, setIsClearingCache] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const loadCurrentDir = async () => {
    try {
      const dir = await window.electronAPI.getDataDir();
      setCurrentDir(dir);
      setNewDir(dir);
    } catch (error) {
      console.error('加载目录失败:', error);
    }
  };

  const loadUpdateInfo = async () => {
    try {
      const [version, status] = await Promise.all([
        window.electronAPI.getAppVersion(),
        window.electronAPI.getAutoUpdateStatus(),
      ]);
      setAppVersion(version);
      setAutoUpdateStatus(status);
    } catch (error) {
      console.error('加载更新信息失败:', error);
    }
  };

  const loadPortableModeStatus = async () => {
    try {
      const status = await window.electronAPI.getPortableModeStatus();
      setPortableMode(status);
    } catch (error) {
      console.error('加载便携模式状态失败:', error);
    }
  };

  const loadCacheStatus = async () => {
    try {
      const status = await window.electronAPI.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error('加载缓存状态失败:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void Promise.all([
        loadCurrentDir(),
        loadUpdateInfo(),
        loadPortableModeStatus(),
        loadCacheStatus(),
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onAutoUpdateStatus(data => {
      setAutoUpdateStatus(data);
      if (data.status !== 'checking') {
        setIsCheckingUpdate(false);
      }
      if (data.status === 'downloaded') {
        window.showToast?.({ message: data.message, type: 'success', duration: 5000 });
      }
      if (data.status === 'error') {
        window.showToast?.({ message: data.message, type: 'error', duration: 5000 });
      }
    });

    return unsubscribe;
  }, []);

  const handleSelectDir = async () => {
    if (portableMode.enabled) {
      window.showToast?.({ message: '便携模式已启用，数据目录固定为安装目录/data', type: 'info' });
      return;
    }

    try {
      const selected = await window.electronAPI.selectDataDir();
      if (selected) {
        setNewDir(selected);
      }
    } catch (error) {
      console.error('选择目录失败:', error);
      window.showToast?.({ message: '选择目录失败', type: 'error' });
    }
  };

  const handleSave = async () => {
    if (portableMode.enabled) {
      onClose();
      return;
    }

    if (newDir !== currentDir) {
      try {
        await window.electronAPI.setDataDir(newDir);
        onDataDirChanged();
        await loadCacheStatus();
        window.showToast?.({ message: '数据目录已更新', type: 'success' });
      } catch (error) {
        console.error('保存目录失败:', error);
        window.showToast?.({ message: '保存目录失败', type: 'error' });
        return;
      }
    }
    onClose();
  };

  const handleTogglePortableMode = async () => {
    const nextEnabled = !portableMode.enabled;
    try {
      const result = await window.electronAPI.setPortableMode(nextEnabled);
      if (!result.success) {
        window.showToast?.({ message: result.message, type: 'error', duration: 5000 });
        return;
      }

      window.showToast?.({ message: result.message, type: 'success', duration: 5000 });
      await Promise.all([loadPortableModeStatus(), loadCurrentDir(), loadCacheStatus()]);
      onDataDirChanged();
    } catch (error) {
      console.error('切换便携模式失败:', error);
      window.showToast?.({
        message: `切换便携模式失败: ${(error as Error).message}`,
        type: 'error',
      });
    }
  };

  const handleClearCache = async () => {
    const scopeLabel =
      cacheScope === 'cache_only'
        ? '仅缩略图与临时缓存'
        : cacheScope === 'cache_and_library'
          ? '缓存 + 重置媒体库'
          : '全部应用数据';
    const confirmed = confirm(`确认执行缓存清理？\n清理范围：${scopeLabel}`);
    if (!confirmed) return;

    setIsClearingCache(true);
    try {
      const result = await window.electronAPI.clearCache(cacheScope);
      if (result.success) {
        await Promise.all([loadCacheStatus(), loadCurrentDir()]);
        onDataDirChanged();
        window.showToast?.({
          message: `${result.message}（释放 ${formatBytes(result.freedBytes)}）`,
          type: 'success',
          duration: 5000,
        });
      } else {
        window.showToast?.({ message: result.message, type: 'error', duration: 5000 });
      }
    } catch (error) {
      console.error('清理缓存失败:', error);
      window.showToast?.({ message: '清理缓存失败', type: 'error' });
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleRemoveFolder = (folderPath: string) => {
    const updated = watchedFolders.filter(f => f.path !== folderPath);
    onWatchedFoldersChange(updated);
    window.showToast?.({ message: '已移除监控文件夹', type: 'success' });
  };

  const handleClearAllFolders = () => {
    if (confirm('确定要清除所有监控的文件夹吗？')) {
      onWatchedFoldersChange([]);
      window.showToast?.({ message: '已清除所有监控文件夹', type: 'success' });
    }
  };

  const handleAddFolder = async () => {
    if (!window.electronAPI) {
      window.showToast?.({ message: '错误: Electron API 未初始化', type: 'error' });
      return;
    }
    try {
      const newMedia = await window.electronAPI.addMediaFolder();
      if (newMedia && newMedia.length > 0) {
        // Extract folder paths from added media
        const addedFolderPaths = new Set<string>();
        for (const media of newMedia) {
          const folderPath = media.path.substring(
            0,
            media.path.lastIndexOf('/') !== -1
              ? media.path.lastIndexOf('/')
              : media.path.lastIndexOf('\\')
          );
          if (folderPath) {
            addedFolderPaths.add(folderPath);
          }
        }

        // Check for duplicates and add folders with deduplication
        let updatedFolders = [...watchedFolders];
        for (const folderPath of addedFolderPaths) {
          const isDuplicate = updatedFolders.some(
            f => f.path.toLowerCase() === folderPath.toLowerCase()
          );
          if (!isDuplicate) {
            updatedFolders.push({ path: folderPath, locked: false });
          }
        }

        onWatchedFoldersChange(updatedFolders);
        window.showToast?.({ message: `已添加 ${newMedia.length} 个文件`, type: 'success' });
        onDataDirChanged(); // Refresh media list
      } else {
        window.showToast?.({ message: '未找到媒体文件', type: 'info' });
      }
    } catch (error) {
      console.error('添加文件夹失败:', error);
      window.showToast?.({ message: '添加文件夹失败: ' + (error as Error).message, type: 'error' });
    }
  };

  const handleUnlock = () => {
    if (!unlockingFolder) return;

    if (passwordInput === lockPassword) {
      onUnlockFolder(unlockingFolder.path);
      setUnlockingFolder(null);
      setPasswordInput('');
      window.showToast?.({ message: '文件夹已解锁', type: 'success' });
    } else {
      window.showToast?.({ message: '密码错误', type: 'error' });
    }
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 4) {
      window.showToast?.({ message: '密码至少需要4位', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      window.showToast?.({ message: '两次输入的密码不一致', type: 'error' });
      return;
    }

    // 保存到 Data 目录
    try {
      await window.electronAPI.setLockPassword(newPassword);
      onSetLockPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      window.showToast?.({ message: '密码设置成功', type: 'success' });
    } catch {
      window.showToast?.({ message: '保存密码失败', type: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (oldPassword !== lockPassword) {
      window.showToast?.({ message: '原密码错误', type: 'error' });
      return;
    }

    if (newPassword.length < 4) {
      window.showToast?.({ message: '新密码至少需要4位', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      window.showToast?.({ message: '两次输入的新密码不一致', type: 'error' });
      return;
    }

    // 保存到 Data 目录
    try {
      await window.electronAPI.setLockPassword(newPassword);
      onSetLockPassword(newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      window.showToast?.({ message: '密码修改成功', type: 'success' });
    } catch {
      window.showToast?.({ message: '保存密码失败', type: 'error' });
    }
  };

  const handleClearPassword = async () => {
    if (confirm('确定要清除密码吗？这将解锁所有已锁定的文件夹。')) {
      try {
        await window.electronAPI.setLockPassword('');
        onSetLockPassword('');
        setIsChangingPassword(false);
        window.showToast?.({ message: '密码已清除', type: 'success' });
      } catch {
        window.showToast?.({ message: '清除密码失败', type: 'error' });
      }
    }
  };

  const handleToggleLock = (folder: WatchedFolder) => {
    if (folder.locked) {
      // 解锁：显示密码输入对话框
      setUnlockingFolder(folder);
      setPasswordInput('');
    } else {
      // 加锁：直接使用全局密码
      const updated = watchedFolders.map(f =>
        f.path === folder.path ? { ...f, locked: true } : f
      );
      onWatchedFoldersChange(updated);
      window.showToast?.({ message: '文件夹已加锁', type: 'success' });
    }
  };

  const isFolderUnlocked = (folder: WatchedFolder): boolean => {
    return !folder.locked || unlockedFolders.includes(folder.path);
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (!result.success) {
        setIsCheckingUpdate(false);
        const toastType = result.message.includes('开发环境') ? 'info' : 'error';
        window.showToast?.({ message: result.message, type: toastType });
      } else {
        window.showToast?.({ message: result.message, type: 'info' });
      }
    } catch (error) {
      setIsCheckingUpdate(false);
      window.showToast?.({ message: `检查更新失败: ${(error as Error).message}`, type: 'error' });
    }
  };

  const handleInstallUpdate = async () => {
    try {
      const result = await window.electronAPI.quitAndInstallUpdate();
      window.showToast?.({ message: result.message, type: result.success ? 'success' : 'error' });
    } catch (error) {
      window.showToast?.({ message: `安装更新失败: ${(error as Error).message}`, type: 'error' });
    }
  };

  const getUpdateStatusClassName = (status: AutoUpdateStatus['status']): string => {
    switch (status) {
      case 'downloaded':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'available':
      case 'download-progress':
      case 'checking':
        return 'text-blue-400';
      case 'not-available':
      case 'disabled':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const hasPassword = lockPassword.length > 0;

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + O', action: '添加文件夹' },
    { key: 'Ctrl + F', action: '聚焦搜索框' },
    { key: 'Space', action: '播放/暂停' },
    { key: '← / →', action: '后退/前进 5 秒' },
    { key: 'Page Up / Page Down', action: '上一个/下一个媒体' },
    { key: 'Delete', action: '删除选中媒体' },
    { key: 'Ctrl + T', action: '添加 Tag' },
    { key: 'Esc', action: '关闭弹窗' },
  ];

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#2D2D2D] rounded-2xl w-[700px] h-[550px] flex flex-col shadow-2xl border border-[#3D3D3D]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3D3D3D] flex-shrink-0">
          <h2 className="text-[#e0e0e0] text-xl font-semibold flex items-center gap-2">
            <span>⚙️</span> 设置
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#e0e0e0] text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#3D3D3D] flex-shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'general'
                ? 'text-[#e0e0e0] border-b-2 border-[#005FB8]'
                : 'text-gray-400 hover:text-[#e0e0e0]'
            }`}
          >
            常规设置
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'folders'
                ? 'text-[#e0e0e0] border-b-2 border-[#005FB8]'
                : 'text-gray-400 hover:text-[#e0e0e0]'
            }`}
          >
            媒体库
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'shortcuts'
                ? 'text-[#e0e0e0] border-b-2 border-[#005FB8]'
                : 'text-gray-400 hover:text-[#e0e0e0]'
            }`}
          >
            快捷键
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 relative">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[#e0e0e0] font-medium mb-3">便携模式</h3>
                <div className="bg-[#1D1D1D] rounded-lg p-4 border border-[#3D3D3D] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-gray-200 text-sm">
                        {portableMode.enabled ? '已启用便携模式' : '未启用便携模式'}
                      </div>
                      <div className="text-gray-400 text-xs break-all font-mono">
                        目标目录: {portableMode.dataDir || '加载中...'}
                      </div>
                    </div>
                    <button
                      onClick={handleTogglePortableMode}
                      disabled={!portableMode.enabled && !portableMode.writable}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        portableMode.enabled
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : portableMode.writable
                            ? 'bg-[#005FB8] hover:bg-[#0066CC] text-white'
                            : 'bg-[#3D3D3D] text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {portableMode.enabled ? '关闭' : '启用'}
                    </button>
                  </div>
                  <div
                    className={`text-xs ${portableMode.writable ? 'text-gray-400' : 'text-red-400'}`}
                  >
                    {portableMode.writable
                      ? '安装目录可写。启用后数据将保存到安装目录/data。'
                      : `安装目录不可写，无法启用便携模式。${portableMode.reason ? ` (${portableMode.reason})` : ''}`}
                  </div>
                  <div className="text-xs text-yellow-400">
                    切换便携模式后建议重启应用，以确保数据库与缓存目录完全切换。
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[#e0e0e0] font-medium mb-3">数据存储目录</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">当前数据目录</label>
                    <div className="bg-[#1D1D1D] p-3 rounded-lg text-gray-300 text-sm break-all font-mono">
                      {currentDir || '加载中...'}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">新数据目录</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDir}
                        onChange={e => setNewDir(e.target.value)}
                        disabled={portableMode.enabled}
                        className="flex-1 bg-[#3D3D3D] text-[#e0e0e0] px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:outline-none transition-colors"
                        placeholder="选择或输入目录路径"
                      />
                      <button
                        onClick={handleSelectDir}
                        disabled={portableMode.enabled}
                        className="bg-[#3D3D3D] hover:bg-[#4D4D4D] text-[#e0e0e0] px-4 py-2 rounded-lg transition-colors"
                      >
                        浏览...
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      {portableMode.enabled
                        ? '便携模式已启用，数据目录由安装目录/data 固定。'
                        : '数据文件将存储在此目录。'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[#e0e0e0] font-medium mb-3">缓存管理</h3>
                <div className="bg-[#1D1D1D] rounded-lg p-4 border border-[#3D3D3D] space-y-3">
                  <div className="text-sm flex items-center justify-between gap-3">
                    <span className="text-gray-400">缓存目录</span>
                    <span className="text-gray-300 break-all text-right font-mono">
                      {cacheStatus.dataDir || '加载中...'}
                    </span>
                  </div>
                  <div className="text-sm flex items-center justify-between gap-3">
                    <span className="text-gray-400">目录可写</span>
                    <span className={cacheStatus.writable ? 'text-green-400' : 'text-red-400'}>
                      {cacheStatus.writable ? '可写' : '不可写'}
                    </span>
                  </div>
                  <div className="text-sm flex items-center justify-between gap-3">
                    <span className="text-gray-400">缓存占用</span>
                    <span className="text-gray-200">{formatBytes(cacheStatus.sizeBytes)}</span>
                  </div>
                  {!cacheStatus.writable && cacheStatus.reason && (
                    <div className="text-xs text-red-400">原因：{cacheStatus.reason}</div>
                  )}

                  <div className="pt-2 border-t border-[#3D3D3D] space-y-2">
                    <label className="text-gray-400 text-sm block">清理范围</label>
                    <select
                      value={cacheScope}
                      onChange={e => setCacheScope(e.target.value as CacheClearScope)}
                      className="w-full bg-[#3D3D3D] text-[#e0e0e0] px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:outline-none"
                    >
                      <option value="cache_only">仅缩略图与临时缓存</option>
                      <option value="cache_and_library">缩略图与临时缓存 + 重置媒体库</option>
                      <option value="all_data">全部应用数据（高风险）</option>
                    </select>
                    <button
                      onClick={handleClearCache}
                      disabled={isClearingCache || !cacheStatus.writable}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-[#3D3D3D] disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      {isClearingCache ? '清理中...' : '执行清理'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[#e0e0e0] font-medium mb-3">应用更新</h3>
                <div className="bg-[#1D1D1D] rounded-lg p-4 border border-[#3D3D3D] space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">当前版本</span>
                    <span className="text-[#e0e0e0] font-mono">v{appVersion || '加载中...'}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-gray-400 text-sm">更新状态</div>
                    <div className={`text-sm ${getUpdateStatusClassName(autoUpdateStatus.status)}`}>
                      {autoUpdateStatus.message}
                    </div>
                    {typeof autoUpdateStatus.percent === 'number' &&
                      autoUpdateStatus.status === 'download-progress' && (
                        <div className="w-full bg-[#3D3D3D] rounded-full h-2 mt-2">
                          <div
                            className="bg-[#005FB8] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${autoUpdateStatus.percent}%` }}
                          />
                        </div>
                      )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCheckUpdates}
                      disabled={isCheckingUpdate || autoUpdateStatus.status === 'download-progress'}
                      className="bg-[#005FB8] hover:bg-[#0066CC] disabled:bg-[#3D3D3D] disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      {isCheckingUpdate ? '检查中...' : '检查更新'}
                    </button>

                    {autoUpdateStatus.status === 'downloaded' && (
                      <button
                        onClick={handleInstallUpdate}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        重启并安装更新
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'folders' && (
            <div className="space-y-4">
              {/* 密码设置区域 */}
              <div className="bg-[#1D1D1D] rounded-lg p-4 border border-[#3D3D3D]">
                <h3 className="text-[#e0e0e0] font-medium mb-3 flex items-center gap-2">
                  <span>🔐</span> 文件夹加锁密码
                </h3>

                {hasPassword ? (
                  <div>
                    {!isChangingPassword ? (
                      <div className="space-y-3">
                        <p className="text-green-400 text-sm">✓ 密码已设置</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsChangingPassword(true)}
                            className="flex-1 bg-[#005FB8] hover:bg-[#0066CC] text-white text-sm px-4 py-2 rounded-lg transition-colors"
                          >
                            修改密码
                          </button>
                          <button
                            onClick={handleClearPassword}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors px-3"
                          >
                            清除密码
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={e => setOldPassword(e.target.value)}
                          className="w-full bg-[#3D3D3D] text-[#e0e0e0] px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:outline-none transition-colors"
                          placeholder="输入原密码"
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-[#3D3D3D] text-[#e0e0e0] px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:outline-none transition-colors"
                          placeholder="设置新密码（至少4位）"
                        />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#3D3D3D] text-[#e0e0e0] px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:outline-none transition-colors"
                          placeholder="确认新密码"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsChangingPassword(false);
                              setOldPassword('');
                              setNewPassword('');
                              setConfirmPassword('');
                            }}
                            className="flex-1 text-gray-400 hover:text-[#e0e0e0] py-2 rounded-lg transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleChangePassword}
                            disabled={!oldPassword || !newPassword || !confirmPassword}
                            className="flex-1 bg-[#005FB8] hover:bg-[#0066CC] disabled:bg-[#3D3D3D] disabled:text-gray-500 text-white py-2 rounded-lg transition-colors"
                          >
                            确认修改
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm">设置密码后，可以对文件夹进行加锁保护</p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="flex-1 bg-[#3D3D3D] text-[#e0e0e0] px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:outline-none transition-colors"
                        placeholder="设置密码（至少4位）"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="flex-1 bg-[#3D3D3D] text-[#e0e0e0] px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:outline-none transition-colors"
                        placeholder="确认密码"
                      />
                    </div>
                    <button
                      onClick={handleSetPassword}
                      disabled={!newPassword || !confirmPassword}
                      className="w-full bg-[#005FB8] hover:bg-[#0066CC] disabled:bg-[#3D3D3D] disabled:text-gray-500 text-[#e0e0e0] px-4 py-2 rounded-lg transition-colors"
                    >
                      设置密码
                    </button>
                  </div>
                )}
              </div>

              {/* 文件夹列表 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#e0e0e0] font-medium">监控文件夹</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddFolder}
                      className="text-xs bg-[#005FB8] hover:bg-[#0066CC] text-white px-3 py-1.5 rounded transition-colors"
                    >
                      + 添加文件夹
                    </button>
                    {watchedFolders.length > 0 && (
                      <button
                        onClick={handleClearAllFolders}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        清除全部
                      </button>
                    )}
                  </div>
                </div>

                {!hasPassword && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                    <p className="text-yellow-400 text-sm">💡 请先设置密码，才能对文件夹进行加锁</p>
                  </div>
                )}

                {watchedFolders.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-8">
                    暂无监控的文件夹
                    <br />
                    <span className="text-xs">添加文件夹后会自动记录</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {watchedFolders.map(folder => (
                      <div
                        key={folder.path}
                        className="flex items-center justify-between p-3 bg-[#1D1D1D] rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-gray-300 text-sm break-all font-mono flex-1">
                            {folder.path}
                          </span>
                          {folder.locked && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${
                                isFolderUnlocked(folder)
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {isFolderUnlocked(folder) ? '🔓 已解锁' : '🔒 已锁定'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleToggleLock(folder)}
                            disabled={!hasPassword && !folder.locked}
                            className={`text-xs px-2 py-1 rounded transition-colors whitespace-nowrap ${
                              folder.locked
                                ? isFolderUnlocked(folder)
                                  ? 'text-green-400 hover:bg-green-500/10'
                                  : 'text-yellow-400 hover:bg-yellow-500/10'
                                : hasPassword
                                  ? 'text-gray-400 hover:bg-gray-500/10'
                                  : 'text-gray-600 cursor-not-allowed'
                            }`}
                            title={
                              !hasPassword && !folder.locked
                                ? '请先设置密码'
                                : folder.locked
                                  ? isFolderUnlocked(folder)
                                    ? '点击锁定'
                                    : '点击解锁'
                                  : '点击加锁'
                            }
                          >
                            {folder.locked ? (isFolderUnlocked(folder) ? '锁定' : '解锁') : '加锁'}
                          </button>
                          <button
                            onClick={() => handleRemoveFolder(folder.path)}
                            className="text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
                            title="移除"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-gray-500 text-xs mt-4">
                  加锁的文件夹中的媒体不会显示在媒体库中，需要解锁后才能查看。
                </p>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div>
              <h3 className="text-[#e0e0e0] font-medium mb-4">键盘快捷键</h3>
              <div className="space-y-1">
                {shortcuts.map(({ key, action }) => (
                  <div
                    key={key}
                    className="grid grid-cols-2 gap-4 py-3 px-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-gray-400 font-mono text-sm bg-[#3D3D3D] px-2 py-1 rounded w-fit">
                      {key}
                    </span>
                    <span className="text-gray-200">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 解锁密码对话框 */}
          {unlockingFolder && (
            <div className="absolute inset-0 bg-[#1a1a1a]/80 flex items-center justify-center z-10">
              <div className="bg-[#2D2D2D] p-6 rounded-xl border border-[#3D3D3D] w-80">
                <h3 className="text-[#e0e0e0] font-medium mb-4">输入密码解锁</h3>
                <p className="text-gray-400 text-sm mb-4 break-all">{unlockingFolder.path}</p>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full bg-[#3D3D3D] text-[#e0e0e0] px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:outline-none transition-colors mb-4"
                  placeholder="输入密码"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setUnlockingFolder(null);
                      setPasswordInput('');
                    }}
                    className="flex-1 text-gray-400 hover:text-[#e0e0e0] py-2 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUnlock}
                    className="flex-1 bg-[#005FB8] hover:bg-[#0066CC] text-[#e0e0e0] py-2 rounded-lg transition-colors"
                  >
                    解锁
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-[#3D3D3D] flex-shrink-0 h-[72px]">
          {activeTab === 'general' ? (
            <>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#e0e0e0] px-4 py-2 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="bg-[#005FB8] hover:bg-[#0066CC] text-[#e0e0e0] px-6 py-2 rounded-lg font-medium transition-colors"
              >
                保存
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-[#e0e0e0] px-4 py-2 rounded-lg transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
