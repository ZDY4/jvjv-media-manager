import { useState, useEffect, useRef, useCallback } from 'react';
import { getMediaUrl } from '../utils/mediaUrl';

export function useImagePreload(mediaPaths: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const preloadedRef = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((path: string) => {
    if (preloadedRef.current.has(path)) return;

    const img = new Image();
    img.onload = () => {
      setLoadedImages(prev => new Set([...prev, path]));
    };
    img.src = getMediaUrl(path);
    preloadedRef.current.add(path);
  }, []);

  useEffect(() => {
    // 预加载所有指定的图片
    mediaPaths.forEach(preloadImage);
  }, [mediaPaths, preloadImage]);

  const isLoaded = useCallback(
    (path: string) => {
      return loadedImages.has(path);
    },
    [loadedImages]
  );

  return { loaded: loadedImages, isLoaded, preloadImage };
}
