import { useState } from 'react';
import { MediaFile } from '../../shared/types';

interface TagManagerProps {
  media: MediaFile;
  onUpdate: () => void;
}

export const TagManager: React.FC<TagManagerProps> = ({ media, onUpdate }) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = async () => {
    if (!newTag.trim() || !window.electronAPI) return;
    await window.electronAPI.addTag(media.id, newTag.trim());
    setNewTag('');
    onUpdate();
  };

  const handleRemoveTag = async (tag: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.removeTag(media.id, tag);
    onUpdate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <div>
      <h3 className="text-white font-medium mb-2">标签管理</h3>
      
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加标签..."
          className="flex-1 bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-500 outline-none"
        />
        <button
          onClick={handleAddTag}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        >
          添加
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {media.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-blue-600/50 hover:bg-blue-600 px-2 py-1 rounded text-sm cursor-pointer transition"
            onClick={() => handleRemoveTag(tag)}
            title="点击删除"
          >
            {tag}
            <span className="text-xs opacity-70">×</span>
          </span>
        ))}
        {media.tags.length === 0 && (
          <span className="text-gray-500 text-sm">暂无标签</span>
        )}
      </div>
    </div>
  );
};
