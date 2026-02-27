import { useState, useRef, useEffect } from 'react';

interface TagEditorProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  onSave: (tags: string[]) => void;
  mediaName: string;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  isOpen,
  onClose,
  tags: initialTags,
  onSave,
  mediaName,
}) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // 当isOpen变化时重置位置
  useEffect(() => {
    if (isOpen) {
      setTags(initialTags);
      // 居中显示
      const modalWidth = 320;
      const modalHeight = 400;
      setPosition({
        x: Math.max(20, (window.innerWidth - modalWidth) / 2),
        y: Math.max(20, (window.innerHeight - modalHeight) / 2),
      });
    }
  }, [isOpen, initialTags]);

  // 处理鼠标按下开始拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  // 处理鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, e.clientX - dragOffset.x),
          y: Math.max(0, e.clientY - dragOffset.y),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 保存
  const handleSave = () => {
    onSave(tags);
    onClose();
  };

  // 按回车添加标签
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 半透明背景遮罩 */}
      <div className="fixed inset-0 bg-[#1a1a1a]/30 z-40" onClick={onClose} />

      {/* 可拖动的浮窗 */}
      <div
        ref={modalRef}
        className="fixed z-50 w-80 bg-[#2D2D2D]/90 backdrop-blur-md rounded-xl border border-[#3D3D3D] shadow-2xl overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        {/* 标题栏（可拖动） */}
        <div
          className="px-4 py-3 bg-[#3D3D3D]/50 border-b border-[#4D4D4D] cursor-grab active:cursor-grabbing flex items-center justify-between"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span className="text-[#005FB8]">🏷️</span>
            <span className="text-[#e0e0e0] text-sm font-medium">编辑标签</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#e0e0e0] transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* 媒体文件名 */}
        <div className="px-4 py-2 bg-[#2D2D2D]/50">
          <p className="text-xs text-gray-400 truncate" title={mediaName}>
            {mediaName}
          </p>
        </div>

        {/* 标签列表 */}
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-gray-500 text-sm italic">暂无标签</p>
            ) : (
              tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-[#005FB8]/30 hover:bg-[#005FB8]/40 text-[#60CDFF] px-3 py-1.5 rounded-lg text-sm transition-all"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-[#60CDFF]/70 hover:text-[#e0e0e0] transition-colors"
                  >
                    ✕
                  </button>
                </span>
              ))
            )}
          </div>

          {/* 添加新标签 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入新标签..."
              className="flex-1 bg-[#3D3D3D]/50 text-gray-100 px-3 py-2 rounded-lg border border-[#4D4D4D] focus:border-[#005FB8] focus:bg-[#404040]/50 outline-none text-sm transition-all placeholder:text-gray-500"
              autoFocus
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className="bg-[#005FB8] hover:bg-[#0066CC] disabled:bg-[#3D3D3D] disabled:text-gray-500 text-[#e0e0e0] px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              添加
            </button>
          </div>

          {/* 提示文字 */}
          <p className="text-xs text-gray-500 mt-2">按 Enter 添加，点击 ✕ 移除，按 Esc 取消</p>
        </div>

        {/* 底部按钮 */}
        <div className="px-4 py-3 bg-[#3D3D3D]/30 border-t border-[#4D4D4D] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5 rounded-lg text-sm transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#005FB8] hover:bg-[#0066CC] text-[#e0e0e0] rounded-lg text-sm font-medium transition-all"
          >
            确认
          </button>
        </div>
      </div>
    </>
  );
};

TagEditor.displayName = 'TagEditor';
