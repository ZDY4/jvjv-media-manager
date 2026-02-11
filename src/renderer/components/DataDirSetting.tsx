import React, { useState, useEffect } from 'react';

interface DataDirSettingProps {
  onClose: () => void;
  onDataDirChanged: () => void;
}

export const DataDirSetting: React.FC<DataDirSettingProps> = ({ onClose, onDataDirChanged }) => {
  const [currentDir, setCurrentDir] = useState('');
  const [newDir, setNewDir] = useState('');

  useEffect(() => {
    loadCurrentDir();
  }, []);

  const loadCurrentDir = async () => {
    const dir = await window.electronAPI.getDataDir();
    setCurrentDir(dir);
    setNewDir(dir);
  };

  const handleSelectDir = async () => {
    const selected = await window.electronAPI.selectDataDir();
    if (selected) {
      setNewDir(selected);
    }
  };

  const handleSave = async () => {
    if (newDir !== currentDir) {
      await window.electronAPI.setDataDir(newDir);
      onDataDirChanged();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[600px] p-6">
        <h2 className="text-white text-xl mb-4">设置数据存储目录</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">当前数据目录</label>
            <div className="bg-gray-900 p-3 rounded text-gray-300 text-sm break-all">
              {currentDir}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">新数据目录</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDir}
                onChange={(e) => setNewDir(e.target.value)}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                placeholder="选择或输入目录路径"
              />
              <button
                onClick={handleSelectDir}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                浏览...
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              数据文件 db.json 将存储在此目录
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-4 py-2"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
