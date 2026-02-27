// 快捷键配置
export const SHORTCUTS = {
  SCAN_FOLDER: { key: 'o', ctrl: true, label: '扫描文件夹', desc: 'Ctrl + O' },
  FOCUS_SEARCH: { key: 'f', ctrl: true, label: '聚焦搜索框', desc: 'Ctrl + F' },
  PLAY_PAUSE: { key: ' ', label: '播放/暂停', desc: 'Space' },
  SEEK_BACKWARD: { key: 'ArrowLeft', label: '后退 5 秒', desc: '←' },
  SEEK_FORWARD: { key: 'ArrowRight', label: '前进 5 秒', desc: '→' },
  DELETE_MEDIA: { key: 'Delete', label: '删除选中媒体', desc: 'Delete' },
  ADD_TAG: { key: 't', ctrl: true, label: '添加 Tag', desc: 'Ctrl + T' },
  PREVIOUS_MEDIA: { key: 'PageUp', label: '上一个媒体', desc: 'Page Up' },
  NEXT_MEDIA: { key: 'PageDown', label: '下一个媒体', desc: 'Page Down' },
  ESCAPE: { key: 'Escape', label: '关闭弹窗', desc: 'Esc' },
} as const;

export type ShortcutKey = keyof typeof SHORTCUTS;
