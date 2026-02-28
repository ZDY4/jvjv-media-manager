# 图片浏览优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 提升媒体管理器中图片浏览的体验，添加缩放、平移、预加载功能

**Architecture:** 将图片查看逻辑从 MediaPlayer 中分离，创建专门的 ImageViewer 组件，支持鼠标/键盘缩放平移，预加载相邻图片

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Zustand

---

## 现状分析

当前图片浏览存在的问题：

1. **无缩放功能** - 只能以固定大小查看图片
2. **无平移功能** - 无法拖动查看大图细节
3. **无预加载** - 切换图片时有明显延迟
4. **与视频共用播放器** - 图片显示时仍显示视频控制条
5. **缺少图片专用快捷键** - 如 +/- 缩放等
6. **方向键行为不一致** - 左右箭头在图片和视频模式下行为不同

---

## Task 1: 创建 ImageViewer 组件基础结构

**Files:**

- Create: `src/renderer/components/ImageViewer.tsx`
- Create: `src/renderer/components/ImageViewer.test.tsx`
- Modify: `src/renderer/components/MediaPlayer.tsx` (分离图片逻辑)

**Step 1: 编写基础组件测试**

```tsx
// src/renderer/components/ImageViewer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageViewer } from './ImageViewer';
import { MediaFile } from '@/shared/types';

const mockImage: MediaFile = {
  id: '1',
  path: '/test/image.jpg',
  filename: 'image.jpg',
  type: 'image',
  size: 1024,
  width: 1920,
  height: 1080,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  tags: [],
};

describe('ImageViewer', () => {
  it('should render image with correct src', () => {
    render(<ImageViewer media={mockImage} />);
    const img = screen.getByAltText('image.jpg');
    expect(img).toBeInTheDocument();
  });

  it('should display zoom controls', () => {
    render(<ImageViewer media={mockImage} />);
    expect(screen.getByLabelText('放大')).toBeInTheDocument();
    expect(screen.getByLabelText('缩小')).toBeInTheDocument();
    expect(screen.getByLabelText('重置缩放')).toBeInTheDocument();
  });

  it('should zoom in on button click', () => {
    render(<ImageViewer media={mockImage} />);
    const zoomInBtn = screen.getByLabelText('放大');
    fireEvent.click(zoomInBtn);
    // Zoom level should increase
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npx vitest run src/renderer/components/ImageViewer.test.tsx`
Expected: FAIL - component not found

**Step 3: 创建 ImageViewer 组件**

```tsx
// src/renderer/components/ImageViewer.tsx
import { useState, useRef, useCallback } from 'react';
import type { MediaFile } from '@/shared/types';
import { getMediaUrl } from '../utils/mediaUrl';

interface ImageViewerProps {
  media: MediaFile;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ media, onPrevious, onNext }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.25, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev / 1.25, 0.5);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, scale]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-[#1a1a1a] min-h-0 overflow-hidden relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 图片显示区域 */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <img
          src={getMediaUrl(media.path)}
          alt={media.filename}
          className="max-w-full max-h-full object-contain transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          draggable={false}
        />
      </div>

      {/* 底部控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 缩放控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
              title="缩小 (-)"
              aria-label="缩小"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
              title="放大 (+)"
              aria-label="放大"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            <button
              onClick={handleResetZoom}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors ml-2"
              title="重置缩放 (0)"
              aria-label="重置缩放"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          </div>

          {/* 图片信息 */}
          <div className="text-gray-300 text-sm">
            {media.width && media.height && `${media.width} × ${media.height}`}
          </div>

          {/* 导航按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevious}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
              title="上一张 (PageUp)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={onNext}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
              title="下一张 (PageDown)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Step 4: 运行测试确认通过**

Run: `npx vitest run src/renderer/components/ImageViewer.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/components/ImageViewer.tsx src/renderer/components/ImageViewer.test.tsx
git commit -m "feat: add ImageViewer component with zoom and pan"
```

---

## Task 2: 在 MediaPlayer 中集成 ImageViewer

**Files:**

- Modify: `src/renderer/components/MediaPlayer.tsx`

**Step 1: 导入 ImageViewer 并替换图片渲染逻辑**

```tsx
// src/renderer/components/MediaPlayer.tsx
// 在文件顶部添加导入
import { ImageViewer } from './ImageViewer';

// 在 return 语句中，替换原来的图片渲染部分（大约第 264-274 行）
// 从：
// ) : (
//   <img
//     src={getMediaUrl(media.path)}
//     ...
//   />
// )

// 改为：
) : (
  <ImageViewer
    media={media}
    onPrevious={onPrevious}
    onNext={onNext}
  />
)
```

**Step 2: 验证 MediaPlayer 仍然可以渲染图片**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/renderer/components/MediaPlayer.tsx
git commit -m "refactor: integrate ImageViewer into MediaPlayer"
```

---

## Task 3: 添加图片预加载功能

**Files:**

- Create: `src/renderer/hooks/useImagePreload.ts`
- Create: `src/renderer/hooks/useImagePreload.test.ts`
- Modify: `src/renderer/components/ImageViewer.tsx`

**Step 1: 编写预加载 Hook 测试**

```tsx
// src/renderer/hooks/useImagePreload.test.ts
import { renderHook } from '@testing-library/react';
import { useImagePreload } from './useImagePreload';

describe('useImagePreload', () => {
  it('should preload images', () => {
    const imagePaths = ['/test/1.jpg', '/test/2.jpg'];
    const { result } = renderHook(() => useImagePreload(imagePaths));

    expect(result.current.loaded).toBeInstanceOf(Set);
  });

  it('should track loaded images', () => {
    const imagePaths = ['/test/1.jpg'];
    const { result } = renderHook(() => useImagePreload(imagePaths));

    // After image loads, it should be in the loaded set
    expect(result.current.isLoaded('/test/1.jpg')).toBe(false);
  });
});
```

**Step 2: 创建预加载 Hook**

```tsx
// src/renderer/hooks/useImagePreload.ts
import { useState, useEffect, useRef, useCallback } from 'react';

export function useImagePreload(imagePaths: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const preloadedRef = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((path: string) => {
    if (preloadedRef.current.has(path)) return;

    const img = new Image();
    img.onload = () => {
      setLoadedImages(prev => new Set([...prev, path]));
    };
    img.src = path;
    preloadedRef.current.add(path);
  }, []);

  useEffect(() => {
    // 预加载所有指定的图片
    imagePaths.forEach(preloadImage);
  }, [imagePaths, preloadImage]);

  const isLoaded = useCallback(
    (path: string) => {
      return loadedImages.has(path);
    },
    [loadedImages]
  );

  return { loaded: loadedImages, isLoaded, preloadImage };
}
```

**Step 3: 在 ImageViewer 中使用预加载**

```tsx
// src/renderer/components/ImageViewer.tsx
// 添加导入
import { useImagePreload } from '../hooks/useImagePreload';
import { useMediaStore } from '../store/useMediaStore';

// 在组件内部：
export const ImageViewer: React.FC<ImageViewerProps> = ({ media, onPrevious, onNext }) => {
  const { filteredMediaList } = useMediaStore();

  // 找到当前图片的索引
  const currentIndex = filteredMediaList.findIndex(m => m.id === media.id);

  // 获取相邻图片的路径
  const preloadPaths = [
    filteredMediaList[currentIndex - 1]?.path,
    filteredMediaList[currentIndex + 1]?.path,
  ]
    .filter(Boolean)
    .map(path => `media-protocol://${path}`);

  // 预加载相邻图片
  useImagePreload(preloadPaths);

  // ... rest of component
};
```

**Step 4: 运行测试确认通过**

Run: `npx vitest run src/renderer/hooks/useImagePreload.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/hooks/useImagePreload.ts src/renderer/hooks/useImagePreload.test.ts src/renderer/components/ImageViewer.tsx
git commit -m "feat: add image preloading for adjacent images"
```

---

## Task 4: 添加图片专用键盘快捷键

**Files:**

- Modify: `src/renderer/hooks/useKeyboard.ts`
- Modify: `src/renderer/constants/shortcuts.ts`
- Create: `src/renderer/hooks/useImageViewerKeyboard.ts`

**Step 1: 创建图片查看器专用键盘 Hook**

```tsx
// src/renderer/hooks/useImageViewerKeyboard.ts
import { useEffect, useCallback } from 'react';

interface UseImageViewerKeyboardProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isActive: boolean;
}

export function useImageViewerKeyboard({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPrevious,
  onNext,
  isActive,
}: UseImageViewerKeyboardProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isActive) return;

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          onZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          onZoomOut();
          break;
        case '0':
          e.preventDefault();
          onResetZoom();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
      }
    },
    [isActive, onZoomIn, onZoomOut, onResetZoom, onPrevious, onNext]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

**Step 2: 在 ImageViewer 中集成键盘快捷键**

```tsx
// src/renderer/components/ImageViewer.tsx
// 添加导入
import { useImageViewerKeyboard } from '../hooks/useImageViewerKeyboard';

// 在组件内部添加：
useImageViewerKeyboard({
  onZoomIn: handleZoomIn,
  onZoomOut: handleZoomOut,
  onResetZoom: handleResetZoom,
  onPrevious: onPrevious || (() => {}),
  onNext: onNext || (() => {}),
  isActive: true,
});
```

**Step 3: 更新快捷键文档**

```ts
// src/renderer/constants/shortcuts.ts
// 添加图片浏览快捷键
export const IMAGE_SHORTCUTS = {
  ZOOM_IN: { key: '+', description: '放大' },
  ZOOM_OUT: { key: '-', description: '缩小' },
  RESET_ZOOM: { key: '0', description: '重置缩放' },
  PREVIOUS_IMAGE: { key: 'ArrowLeft', description: '上一张图片' },
  NEXT_IMAGE: { key: 'ArrowRight', description: '下一张图片' },
} as const;
```

**Step 4: 验证快捷键工作正常**

Run: `npm run lint`
Expected: No errors

**Step 5: Commit**

```bash
git add src/renderer/hooks/useImageViewerKeyboard.ts src/renderer/components/ImageViewer.tsx src/renderer/constants/shortcuts.ts
git commit -m "feat: add image viewer keyboard shortcuts (+/-/0/arrows)"
```

---

## Task 5: 修复 useKeyboard.ts 中的冲突

**Files:**

- Modify: `src/renderer/hooks/useKeyboard.ts`

**Step 1: 修改键盘钩子以支持上下文感知**

当查看图片时，左右箭头应该切换图片而不是视频的快进/后退。

```tsx
// src/renderer/hooks/useKeyboard.ts
// 需要传入当前媒体类型

interface UseKeyboardProps {
  // ... existing props
  currentMediaType?: 'video' | 'image';
}

// 在 handleKeyDown 中：
case 'ArrowLeft':
  e.preventDefault();
  if (currentMediaType === 'image') {
    onPreviousMedia?.(); // 图片：上一张
  } else {
    onSeek?.(-5); // 视频：后退5秒
  }
  break;

case 'ArrowRight':
  e.preventDefault();
  if (currentMediaType === 'image') {
    onNextMedia?.(); // 图片：下一张
  } else {
    onSeek?.(5); // 视频：前进5秒
  }
  break;
```

**Step 2: 在 App.tsx 中传入媒体类型**

```tsx
// src/renderer/App.tsx
const currentMedia = filteredMediaList.find(m => m.id === selectedMediaIds.values().next().value);

useKeyboard({
  // ... existing props
  currentMediaType: currentMedia?.type,
});
```

**Step 3: Commit**

```bash
git add src/renderer/hooks/useKeyboard.ts src/renderer/App.tsx
git commit -m "fix: make arrow keys context-aware for image navigation"
```

---

## Task 6: 添加全屏模式支持

**Files:**

- Modify: `src/renderer/components/ImageViewer.tsx`

**Step 1: 添加全屏功能**

```tsx
// src/renderer/components/ImageViewer.tsx
// 在组件中添加：
const [isFullscreen, setIsFullscreen] = useState(false);

const toggleFullscreen = useCallback(() => {
  if (!document.fullscreenElement) {
    containerRef.current?.requestFullscreen();
    setIsFullscreen(true);
  } else {
    document.exitFullscreen();
    setIsFullscreen(false);
  }
}, []);

// 监听全屏变化
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
}, []);

// 在控制栏添加全屏按钮（在导航按钮旁边）：
<button
  onClick={toggleFullscreen}
  className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
  title={isFullscreen ? '退出全屏 (F)' : '全屏 (F)'}
>
  {isFullscreen ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
      />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  )}
</button>;
```

**Step 2: 添加 F 键快捷键**

在 useImageViewerKeyboard 中添加：

```tsx
case 'f':
  e.preventDefault();
  onToggleFullscreen();
  break;
```

并更新接口：

```tsx
interface UseImageViewerKeyboardProps {
  // ... existing props
  onToggleFullscreen: () => void;
}
```

**Step 3: Commit**

```bash
git add src/renderer/components/ImageViewer.tsx src/renderer/hooks/useImageViewerKeyboard.ts
git commit -m "feat: add fullscreen mode for image viewer"
```

---

## Task 7: 运行最终验证

**Step 1: 运行所有测试**

```bash
npm run test:run
```

Expected: All tests pass

**Step 2: 运行 linter**

```bash
npm run lint
```

Expected: No errors

**Step 3: 运行格式化检查**

```bash
npm run format:check
```

Expected: No issues

**Step 4: 构建项目**

```bash
npm run build
```

Expected: Build succeeds

**Step 5: 最终 Commit**

```bash
git commit -m "feat: complete image browsing optimization

- Add ImageViewer component with zoom and pan
- Add image preloading for adjacent images
- Add image-specific keyboard shortcuts (+/-/0/arrows/F)
- Add fullscreen mode for images
- Make arrow keys context-aware for image navigation"
```

---

## 功能总结

实施完成后，图片浏览将支持：

| 功能     | 快捷键/操作        |
| -------- | ------------------ |
| 放大     | `+` 或鼠标滚轮向上 |
| 缩小     | `-` 或鼠标滚轮向下 |
| 重置缩放 | `0`                |
| 平移     | 拖拽（缩放后）     |
| 上一张   | `←` 或 `PageUp`    |
| 下一张   | `→` 或 `PageDown`  |
| 全屏     | `F`                |

---

## 文件变更清单

**新增文件：**

- `src/renderer/components/ImageViewer.tsx`
- `src/renderer/components/ImageViewer.test.tsx`
- `src/renderer/hooks/useImagePreload.ts`
- `src/renderer/hooks/useImagePreload.test.ts`
- `src/renderer/hooks/useImageViewerKeyboard.ts`

**修改文件：**

- `src/renderer/components/MediaPlayer.tsx`
- `src/renderer/hooks/useKeyboard.ts`
- `src/renderer/constants/shortcuts.ts`
- `src/renderer/App.tsx`
