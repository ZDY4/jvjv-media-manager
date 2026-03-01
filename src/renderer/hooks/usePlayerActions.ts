import { useCallback } from 'react';
import { useMediaStore } from '../store/useMediaStore';
import { useAppStore } from '../store/useAppStore';

export const usePlayerActions = () => {
  const { 
    filteredMediaList, 
    lastSelectedId, 
    setLastSelectedId, 
    setSelectedMediaIds 
  } = useMediaStore();
  
  const { playMode, setPlayMode } = useAppStore();

  const selectedIndex = lastSelectedId
    ? filteredMediaList.findIndex(m => m.id === lastSelectedId)
    : -1;

  const togglePlayMode = useCallback(() => {
    let nextMode: 'list' | 'single' | 'random';

    if (playMode === 'list') {
      nextMode = 'single';
    } else if (playMode === 'single') {
      nextMode = 'random';
    } else {
      nextMode = 'list';
    }

    setPlayMode(nextMode);

    const modeNames: Record<'list' | 'single' | 'random', string> = {
      list: '列表循环',
      single: '单个循环',
      random: '随机播放',
    };
    window.showToast?.({ message: `播放模式：${modeNames[nextMode]}`, type: 'info' });
  }, [playMode, setPlayMode]);

  const handlePreviousMedia = useCallback(() => {
    if (selectedIndex > 0) {
      const prevMedia = filteredMediaList[selectedIndex - 1];
      if (prevMedia) {
        setLastSelectedId(prevMedia.id);
        setSelectedMediaIds(new Set([prevMedia.id]));
      }
    } else if (selectedIndex === 0 && filteredMediaList.length > 0) {
      // Loop to last
      const lastMedia = filteredMediaList[filteredMediaList.length - 1];
      if (lastMedia) {
        setLastSelectedId(lastMedia.id);
        setSelectedMediaIds(new Set([lastMedia.id]));
      }
    }
  }, [selectedIndex, filteredMediaList, setLastSelectedId, setSelectedMediaIds]);

  const handlePreviousManual = useCallback(() => {
    if (filteredMediaList.length <= 1) return;
    if (selectedIndex > 0) {
      const prevMedia = filteredMediaList[selectedIndex - 1];
      if (prevMedia) {
        setLastSelectedId(prevMedia.id);
        setSelectedMediaIds(new Set([prevMedia.id]));
      }
    } else if (selectedIndex === 0) {
      const lastMedia = filteredMediaList[filteredMediaList.length - 1];
      if (lastMedia) {
        setLastSelectedId(lastMedia.id);
        setSelectedMediaIds(new Set([lastMedia.id]));
      }
    }
  }, [filteredMediaList, selectedIndex, setLastSelectedId, setSelectedMediaIds]);

  const handleNextManual = useCallback(() => {
    if (filteredMediaList.length <= 1) return;
    if (selectedIndex >= 0 && selectedIndex < filteredMediaList.length - 1) {
      const nextMedia = filteredMediaList[selectedIndex + 1];
      if (nextMedia) {
        setLastSelectedId(nextMedia.id);
        setSelectedMediaIds(new Set([nextMedia.id]));
      }
    } else if (selectedIndex === filteredMediaList.length - 1 || selectedIndex === -1) {
      const firstMedia = filteredMediaList[0];
      if (firstMedia) {
        setLastSelectedId(firstMedia.id);
        setSelectedMediaIds(new Set([firstMedia.id]));
      }
    }
  }, [filteredMediaList, selectedIndex, setLastSelectedId, setSelectedMediaIds]);

  const handleNextMedia = useCallback(() => {
    if (filteredMediaList.length === 0) return;

    switch (playMode) {
      case 'single':
        // Single loop: Replay current media
        // We need to trigger a replay. This is tricky because the ID doesn't change.
        // The MediaPlayer component might need a way to know "replay".
        // But usually setting ID to null then back works, or MediaPlayer handles 'ended' event by replaying if loop is on.
        // In App.tsx:
        /*
        if (selectedMedia) {
          setLastSelectedId(null);
          setTimeout(() => setLastSelectedId(selectedMedia.id), 10);
        }
        */
       // We can reproduce this hack for now.
       if (lastSelectedId) {
         setLastSelectedId(null);
         setTimeout(() => setLastSelectedId(lastSelectedId), 10);
       }
        break;

      case 'random': {
        const randomIndex = Math.floor(Math.random() * filteredMediaList.length);
        const randomMedia = filteredMediaList[randomIndex];
        if (randomMedia) {
          setLastSelectedId(randomMedia.id);
          setSelectedMediaIds(new Set([randomMedia.id]));
        }
        break;
      }

      case 'list':
      default:
        if (selectedIndex >= 0 && selectedIndex < filteredMediaList.length - 1) {
          const nextMedia = filteredMediaList[selectedIndex + 1];
          if (nextMedia) {
            setLastSelectedId(nextMedia.id);
            setSelectedMediaIds(new Set([nextMedia.id]));
          }
        } else if (selectedIndex === filteredMediaList.length - 1) {
          // Loop to first
          const firstMedia = filteredMediaList[0];
          if (firstMedia) {
            setLastSelectedId(firstMedia.id);
            setSelectedMediaIds(new Set([firstMedia.id]));
          }
        }
        break;
    }
  }, [filteredMediaList, selectedIndex, playMode, lastSelectedId, setLastSelectedId, setSelectedMediaIds]);

  return {
    togglePlayMode,
    handlePreviousMedia,
    handlePreviousManual,
    handleNextManual,
    handleNextMedia,
  };
};
