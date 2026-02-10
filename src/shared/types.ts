export type MediaType = 'video' | 'image';

export interface MediaFile {
  id: string;
  path: string;
  filename: string;
  type: MediaType;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  createdAt: number;
  modifiedAt: number;
  lastPlayed?: number;
  playCount?: number;
  tags: string[];
}

export interface Tag {
  id: number;
  mediaId: string;
  name: string;
  createdAt: number;
}
