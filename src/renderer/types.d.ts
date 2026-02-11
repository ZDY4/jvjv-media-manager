import { MediaFile } from '../shared/types';

declare global {
  interface Window {
    electronAPI: {
      scanMediaFolder: () => Promise<MediaFile[] | null>;
      getAllMedia: () => Promise<MediaFile[]>;
      searchMediaByTags: (tags: string[]) => Promise<MediaFile[]>;
      addTag: (mediaId: string, tag: string) => Promise<boolean>;
      removeTag: (mediaId: string, tag: string) => Promise<boolean>;
      deleteMedia: (mediaId: string) => Promise<boolean>;
      
      // 视频剪辑（新版）
      trimVideoStart: (params: {
        mode: 'keep' | 'remove';
        input: string;
        output: string;
        start: number;
        end: number;
      }) => Promise<{ success: boolean; output?: string; error?: string }>;
      selectOutputDir: () => Promise<string | null>;
      onTrimProgress: (callback: (data: { percent: number; mode: string }) => void) => void;
      onTrimComplete: (callback: (data: { success: boolean; output?: string; error?: string }) => void) => void;
      
      // 数据目录管理
      getDataDir: () => Promise<string>;
      setDataDir: (dirPath: string) => Promise<boolean>;
      selectDataDir: () => Promise<string | null>;
    };
  }
}

export {};
