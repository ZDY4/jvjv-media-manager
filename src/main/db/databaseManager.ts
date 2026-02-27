import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { MediaFile } from '../../shared/types';

type MediaRow = Omit<MediaFile, 'tags'>;

class DatabaseManager {
  private db: Database;
  private dbPath: string;

  constructor(dataDir: string) {
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, 'media.db');
    this.db = new Database(this.dbPath);

    // 初始化数据库
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // 启用 WAL 模式以提高并发性能
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 10000'); // 10MB 缓存

    // 创建媒体表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        filename TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        duration REAL,
        thumbnail TEXT,
        createdAt INTEGER NOT NULL,
        modifiedAt INTEGER NOT NULL
      )
    `);

    // 创建标签表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        mediaId TEXT NOT NULL,
        name TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        PRIMARY KEY (mediaId, name),
        FOREIGN KEY (mediaId) REFERENCES media(id) ON DELETE CASCADE
      )
    `);

    // 创建索引以提高查询性能
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tags_mediaId ON tags(mediaId)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)
    `);
  }

  addMedia(media: MediaFile): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO media (
        id, path, filename, type, size, width, height, duration, thumbnail, createdAt, modifiedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      media.id,
      media.path,
      media.filename,
      media.type,
      media.size,
      media.width,
      media.height,
      media.duration,
      media.thumbnail,
      media.createdAt,
      media.modifiedAt
    );
  }

  getAllMedia(): MediaFile[] {
    const stmt = this.db.prepare(`
      SELECT id, path, filename, type, size, width, height, duration, thumbnail, createdAt, modifiedAt
      FROM media
      ORDER BY createdAt DESC
    `);

    const mediaList: MediaFile[] = [];
    for (const row of stmt.iterate() as IterableIterator<MediaRow>) {
      mediaList.push({
        ...row,
        tags: this.getTags(row.id),
      });
    }

    return mediaList;
  }

  getMediaById(id: string): MediaFile | undefined {
    const stmt = this.db.prepare(`
      SELECT id, path, filename, type, size, width, height, duration, thumbnail, createdAt, modifiedAt
      FROM media
      WHERE id = ?
    `);

    const row = stmt.get(id) as MediaRow | undefined;
    if (!row) return undefined;

    return {
      ...row,
      tags: this.getTags(row.id),
    };
  }

  deleteMedia(id: string): void {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM tags WHERE mediaId = ?').run(id);
      this.db.prepare('DELETE FROM media WHERE id = ?').run(id);
    })();
  }

  clearAllMedia(): void {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM tags').run();
      this.db.prepare('DELETE FROM media').run();
    })();
  }

  addTag(mediaId: string, tag: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO tags (mediaId, name, createdAt)
      VALUES (?, ?, ?)
    `);

    stmt.run(mediaId, tag, Date.now());
  }

  removeTag(mediaId: string, tag: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM tags WHERE mediaId = ? AND name = ?
    `);

    stmt.run(mediaId, tag);
  }

  getTags(mediaId: string): string[] {
    const stmt = this.db.prepare(`
      SELECT name FROM tags WHERE mediaId = ? ORDER BY name
    `);

    const tags: string[] = [];
    for (const row of stmt.iterate(mediaId) as IterableIterator<{ name: string }>) {
      tags.push(row.name);
    }

    return tags;
  }

  searchByTags(tags: string[]): MediaFile[] {
    if (tags.length === 0) {
      return this.getAllMedia();
    }

    // 使用 INTERSECT 查找包含所有标签的媒体
    let query = `
      SELECT id, path, filename, type, size, width, height, duration, thumbnail, createdAt, modifiedAt
      FROM media
      WHERE id IN (
    `;

    const params: string[] = [];

    tags.forEach((tag, index) => {
      if (index > 0) {
        query += ' INTERSECT ';
      }
      query += `
        SELECT mediaId FROM tags WHERE name = ?
      `;
      params.push(tag);
    });

    query += `
      ) ORDER BY createdAt DESC
    `;

    const stmt = this.db.prepare(query);
    const mediaList: MediaFile[] = [];

    for (const row of stmt.iterate(...params) as IterableIterator<MediaRow>) {
      mediaList.push({
        ...row,
        tags: this.getTags(row.id),
      });
    }

    return mediaList;
  }

  // 获取所有唯一标签
  getAllTags(): string[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT name FROM tags ORDER BY name
    `);

    const tags: string[] = [];
    for (const row of stmt.iterate() as IterableIterator<{ name: string }>) {
      tags.push(row.name);
    }

    return tags;
  }

  // 关闭数据库连接
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

export { DatabaseManager };
