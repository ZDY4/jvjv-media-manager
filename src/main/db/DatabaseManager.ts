import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { MediaFile } from '../../shared/types';

interface DatabaseSchema {
  media: MediaFile[];
  tags: { mediaId: string; tag: string }[];
}

const defaultData: DatabaseSchema = {
  media: [],
  tags: [],
};

export class DatabaseManager {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'db.json');
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf-8');
        return { ...defaultData, ...JSON.parse(content) };
      }
    } catch (error) {
      console.error('Failed to load database:', error);
    }
    return { ...defaultData };
  }

  private saveData(): void {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  async addMedia(media: MediaFile): Promise<void> {
    const existing = this.data.media.findIndex((m: MediaFile) => m.id === media.id);
    if (existing >= 0) {
      this.data.media[existing] = media;
    } else {
      this.data.media.push(media);
    }
    this.saveData();
  }

  async getAllMedia(): Promise<MediaFile[]> {
    return this.data.media
      .map((m: MediaFile) => ({ ...m, tags: this.getTagsSync(m.id) }))
      .sort((a: MediaFile, b: MediaFile) => b.createdAt - a.createdAt);
  }

  async getMediaById(id: string): Promise<MediaFile | null> {
    const media = this.data.media.find((m: MediaFile) => m.id === id);
    if (media) {
      return { ...media, tags: this.getTagsSync(id) };
    }
    return null;
  }

  async deleteMedia(id: string): Promise<void> {
    this.data.media = this.data.media.filter((m: MediaFile) => m.id !== id);
    this.data.tags = this.data.tags.filter((t: any) => t.mediaId !== id);
    this.saveData();
  }

  async addTag(mediaId: string, tag: string): Promise<void> {
    const exists = this.data.tags.find(
      (t: any) => t.mediaId === mediaId && t.tag === tag
    );
    if (!exists) {
      this.data.tags.push({ mediaId, tag });
      this.saveData();
    }
  }

  async removeTag(mediaId: string, tag: string): Promise<void> {
    this.data.tags = this.data.tags.filter(
      (t: any) => !(t.mediaId === mediaId && t.tag === tag)
    );
    this.saveData();
  }

  private getTagsSync(mediaId: string): string[] {
    return this.data.tags
      .filter((t: any) => t.mediaId === mediaId)
      .map((t: any) => t.tag)
      .sort();
  }

  async searchByTags(tags: string[]): Promise<MediaFile[]> {
    if (tags.length === 0) return this.getAllMedia();
    
    const mediaIds = new Set<string>();
    tags.forEach(tag => {
      this.data.tags
        .filter((t: any) => t.tag === tag)
        .forEach((t: any) => mediaIds.add(t.mediaId));
    });
    
    return this.data.media
      .filter((m: MediaFile) => mediaIds.has(m.id))
      .map((m: MediaFile) => ({ ...m, tags: this.getTagsSync(m.id) }))
      .sort((a: MediaFile, b: MediaFile) => b.createdAt - a.createdAt);
  }
}
