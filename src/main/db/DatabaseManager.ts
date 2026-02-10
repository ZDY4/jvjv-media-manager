import { JSONFilePreset } from 'lowdb/node';
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
  private db: any;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'db.json');
    this.init(dbPath);
  }

  private async init(dbPath: string) {
    this.db = await JSONFilePreset(dbPath, defaultData);
    await this.db.read();
  }

  async addMedia(media: MediaFile): Promise<void> {
    await this.db.read();
    const existing = this.db.data.media.findIndex((m: MediaFile) => m.id === media.id);
    if (existing >= 0) {
      this.db.data.media[existing] = media;
    } else {
      this.db.data.media.push(media);
    }
    await this.db.write();
  }

  async getAllMedia(): Promise<MediaFile[]> {
    await this.db.read();
    return this.db.data.media.map((m: MediaFile) => ({
      ...m,
      tags: this.getTagsSync(m.id),
    })).sort((a: MediaFile, b: MediaFile) => b.createdAt - a.createdAt);
  }

  async getMediaById(id: string): Promise<MediaFile | null> {
    await this.db.read();
    const media = this.db.data.media.find((m: MediaFile) => m.id === id);
    if (media) {
      return { ...media, tags: this.getTagsSync(id) };
    }
    return null;
  }

  async deleteMedia(id: string): Promise<void> {
    await this.db.read();
    this.db.data.media = this.db.data.media.filter((m: MediaFile) => m.id !== id);
    this.db.data.tags = this.db.data.tags.filter((t: any) => t.mediaId !== id);
    await this.db.write();
  }

  async addTag(mediaId: string, tag: string): Promise<void> {
    await this.db.read();
    const exists = this.db.data.tags.find(
      (t: any) => t.mediaId === mediaId && t.tag === tag
    );
    if (!exists) {
      this.db.data.tags.push({ mediaId, tag });
      await this.db.write();
    }
  }

  async removeTag(mediaId: string, tag: string): Promise<void> {
    await this.db.read();
    this.db.data.tags = this.db.data.tags.filter(
      (t: any) => !(t.mediaId === mediaId && t.tag === tag)
    );
    await this.db.write();
  }

  private getTagsSync(mediaId: string): string[] {
    return this.db.data.tags
      .filter((t: any) => t.mediaId === mediaId)
      .map((t: any) => t.tag)
      .sort();
  }

  async searchByTags(tags: string[]): Promise<MediaFile[]> {
    await this.db.read();
    if (tags.length === 0) return this.getAllMedia();
    
    const mediaIds = new Set<string>();
    tags.forEach(tag => {
      this.db.data.tags
        .filter((t: any) => t.tag === tag)
        .forEach((t: any) => mediaIds.add(t.mediaId));
    });
    
    return this.db.data.media
      .filter((m: MediaFile) => mediaIds.has(m.id))
      .map((m: MediaFile) => ({ ...m, tags: this.getTagsSync(m.id) }))
      .sort((a: MediaFile, b: MediaFile) => b.createdAt - a.createdAt);
  }
}
