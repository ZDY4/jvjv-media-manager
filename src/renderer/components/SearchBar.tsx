import { useState, useEffect, useRef, useCallback } from 'react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  inputRef?: (el: HTMLInputElement | null | undefined) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  inputRef,
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const inputElementRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (inputRef) {
      inputRef(inputElementRef.current);
    }
  }, [inputRef]);

  // 防抖搜索
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      // 检查是否以 # 开头，如果是则添加为标签
      const trimmedValue = inputValue.trim();
      if (trimmedValue.startsWith('#')) {
        const tagName = trimmedValue.slice(1);
        if (tagName && !selectedTags.includes(tagName)) {
          onTagsChange([...selectedTags, tagName]);
          // 清除输入框
          setInputValue('');
          onSearchChange('');
        }
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const clearSearch = () => {
    setInputValue('');
    onSearchChange('');
    inputElementRef.current?.focus();
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  return (
    <div className="space-y-3">
      {/* 统一搜索栏 */}
      <div className="space-y-1">
        <label className="text-gray-400 text-xs">搜索</label>
        <div className="relative">
          <input
            ref={inputElementRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="搜索文件名或输入 #标签名 添加标签..."
            className="w-full bg-[#3D3D3D] text-gray-100 px-3 py-2 pr-8 rounded-lg border border-transparent focus:border-[#005FB8] focus:bg-[#404040] outline-none text-sm transition-all duration-200 placeholder:text-gray-500"
          />
          {inputValue && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#e0e0e0] text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-gray-500 text-xs">提示：输入 #标签名 按回车可添加标签筛选</p>
      </div>

      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">已选标签:</span>
            <button
              onClick={clearAllTags}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              清除全部
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-[#005FB8]/20 hover:bg-[#005FB8]/30 text-[#60CDFF] px-2.5 py-1 rounded-md text-xs cursor-pointer transition-all duration-200 border border-[#005FB8]/30"
                onClick={() => handleRemoveTag(tag)}
              >
                #{tag}
                <span className="opacity-60 hover:opacity-100">×</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

SearchBar.displayName = 'SearchBar';
