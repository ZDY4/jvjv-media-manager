import { useState } from 'react';

interface SearchBarProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ selectedTags, onTagsChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    if (!inputValue.trim()) return;
    const tag = inputValue.trim();
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-white font-medium">按标签搜索</h3>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入标签..."
          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 outline-none text-sm"
        />
        <button
          onClick={handleAddTag}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded"
        >
          🔍
        </button>
      </div>
      
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-green-600/50 hover:bg-green-600 px-2 py-1 rounded text-xs cursor-pointer transition"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag}
                <span>×</span>
              </span>
            ))}
          </div>
          
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-white"
          >
            清除所有
          </button>
        </div>
      )}
    </div>
  );
};
