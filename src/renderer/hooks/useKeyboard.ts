import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onScanFolder?: () => void;
  onFocusSearch?: () => void;
  onPlayPause?: () => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
  onDelete?: () => void;
  onAddTag?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onEscape?: () => void;
}

export function useKeyboard(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey } = event;
    
    // Ctrl/Cmd + O: 扫描文件夹
    if ((ctrlKey || metaKey) && key.toLowerCase() === 'o') {
      event.preventDefault();
      shortcuts.onScanFolder?.();
      return;
    }
    
    // Ctrl/Cmd + F: 聚焦搜索
    if ((ctrlKey || metaKey) && key.toLowerCase() === 'f') {
      event.preventDefault();
      shortcuts.onFocusSearch?.();
      return;
    }
    
    // Ctrl/Cmd + T: 添加 Tag
    if ((ctrlKey || metaKey) && key.toLowerCase() === 't') {
      event.preventDefault();
      shortcuts.onAddTag?.();
      return;
    }
    
    // Space: 播放/暂停
    if (key === ' ') {
      event.preventDefault();
      shortcuts.onPlayPause?.();
      return;
    }
    
    // Arrow Left: 后退 5 秒
    if (key === 'ArrowLeft') {
      event.preventDefault();
      shortcuts.onSeekBackward?.();
      return;
    }
    
    // Arrow Right: 前进 5 秒
    if (key === 'ArrowRight') {
      event.preventDefault();
      shortcuts.onSeekForward?.();
      return;
    }
    
    // Delete: 删除
    if (key === 'Delete') {
      event.preventDefault();
      shortcuts.onDelete?.();
      return;
    }
    
    // Page Up: 上一个媒体
    if (key === 'PageUp') {
      event.preventDefault();
      shortcuts.onPrevious?.();
      return;
    }
    
    // Page Down: 下一个媒体
    if (key === 'PageDown') {
      event.preventDefault();
      shortcuts.onNext?.();
      return;
    }
    
    // Escape: 关闭/取消
    if (key === 'Escape') {
      shortcuts.onEscape?.();
      return;
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
