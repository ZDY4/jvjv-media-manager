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
      trimVideoKeep: (input: string, output: string, start: number, end: number) => Promise<boolean>;
      trimVideoRemove: (input: string, output: string, start: number, end: number) => Promise<boolean>;
      
      // 数据目录管理
      getDataDir: () => Promise<string>;
      setDataDir: (dirPath: string) => Promise<boolean>;
      selectDataDir: () => Promise<string | null>;
    };
  }
}

export {};
