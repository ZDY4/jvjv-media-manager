import React, { useState, useEffect } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onDataDirChanged: () => void;
  watchedFolders: string[];
  onWatchedFoldersChange: (folders: string[]) => void;
}

type SettingsTab = 'general' | 'folders' | 'shortcuts';

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  onDataDirChanged,
  watchedFolders,
  onWatchedFoldersChange,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [currentDir, setCurrentDir] = useState('');
  const [newDir, setNewDir] = useState('');

  const loadCurrentDir = async () => {
    try {
      const dir = await window.electronAPI.getDataDir();
      setCurrentDir(dir);
      setNewDir(dir);
    } catch (error) {
      console.error('加载目录失败:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCurrentDir();
    }
  }, [isOpen]);

  const handleSelectDir = async () => {
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
    if (newDir !== currentDir) {
      try {
        await window.electronAPI.setDataDir(newDir);
        onDataDirChanged();
        window.showToast?.({ message: '数据目录已更新', type: 'success' });
      } catch (error) {
        console.error('保存目录失败:', error);
        window.showToast?.({ message: '保存目录失败', type: 'error' });
        return;
      }
    }
    onClose();
  };

  const handleRemoveFolder = (folderPath: string) => {
    const updated = watchedFolders.filter(f => f !== folderPath);
    onWatchedFoldersChange(updated);
    window.showToast?.({ message: '已移除监控文件夹', type: 'success' });
  };

  const handleClearAllFolders = () => {
    if (confirm('确定要清除所有监控的文件夹吗？')) {
      onWatchedFoldersChange([]);
      window.showToast?.({ message: '已清除所有监控文件夹', type: 'success' });
    }
  };

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
      <div className="bg-[#2D2D2D] rounded-2xl w-[600px] h-[500px] flex flex-col shadow-2xl border border-[#3D3D3D]">
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
            监控文件夹
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
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
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
                        className="flex-1 bg-[#3D3D3D] text-[#e0e0e0] px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:outline-none transition-colors"
                        placeholder="选择或输入目录路径"
                      />
                      <button
                        onClick={handleSelectDir}
                        className="bg-[#3D3D3D] hover:bg-[#4D4D4D] text-[#e0e0e0] px-4 py-2 rounded-lg transition-colors"
                      >
                        浏览...
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">数据文件 db.json 将存储在此目录</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'folders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#e0e0e0] font-medium">监控文件夹</h3>
                {watchedFolders.length > 0 && (
                  <button
                    onClick={handleClearAllFolders}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    清除全部
                  </button>
                )}
              </div>

              {watchedFolders.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  暂无监控的文件夹
                  <br />
                  <span className="text-xs">添加文件夹后会自动记录</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {watchedFolders.map(folderPath => (
                    <div
                      key={folderPath}
                      className="flex items-center justify-between p-3 bg-[#1D1D1D] rounded-lg"
                    >
                      <span className="text-gray-300 text-sm break-all flex-1 mr-3 font-mono">
                        {folderPath}
                      </span>
                      <button
                        onClick={() => handleRemoveFolder(folderPath)}
                        className="text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
                        title="移除"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-gray-500 text-xs mt-4">
                这些文件夹会在应用启动时自动刷新，也可以点击播放列表的 🔄 按钮手动刷新。
              </p>
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
