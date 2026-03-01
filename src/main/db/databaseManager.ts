import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { MediaFile, Playlist, PlaylistWithMedia } from '../../shared/types';

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

    // 创建播放列表表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sortOrder INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL
      )
    `);

    // 创建播放列表媒体关联表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS playlist_media (
        playlistId TEXT NOT NULL,
        mediaId TEXT NOT NULL,
        sortOrder INTEGER NOT NULL DEFAULT 0,
        addedAt INTEGER NOT NULL,
        PRIMARY KEY (playlistId, mediaId),
        FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (mediaId) REFERENCES media(id) ON DELETE CASCADE
      )
    `);

    // 创建播放列表索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_playlists_sortOrder ON playlists(sortOrder)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_playlist_media_playlistId ON playlist_media(playlistId)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_playlist_media_mediaId ON playlist_media(mediaId)
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

  // ========== 播放列表相关方法 ==========

  // 获取所有播放列表
  getAllPlaylists(): Playlist[] {
    const stmt = this.db.prepare(`
      SELECT id, name, sortOrder, createdAt
      FROM playlists
      ORDER BY sortOrder ASC, createdAt ASC
    `);

    const playlists: Playlist[] = [];
    for (const row of stmt.iterate() as IterableIterator<Playlist>) {
      playlists.push(row);
    }
    return playlists;
  }

  // 获取单个播放列表（包含媒体）
  getPlaylist(id: string): PlaylistWithMedia | null {
    const playlistStmt = this.db.prepare(`
      SELECT id, name, sortOrder, createdAt
      FROM playlists
      WHERE id = ?
    `);
    const playlist = playlistStmt.get(id) as Playlist | undefined;
    if (!playlist) return null;

    const mediaStmt = this.db.prepare(`
      SELECT mediaId
      FROM playlist_media
      WHERE playlistId = ?
      ORDER BY sortOrder ASC, addedAt ASC
    `);

    const mediaIds: string[] = [];
    for (const row of mediaStmt.iterate(id) as IterableIterator<{ mediaId: string }>) {
      mediaIds.push(row.mediaId);
    }

    return {
      ...playlist,
      mediaIds,
    };
  }

  // 创建播放列表
  createPlaylist(name: string): Playlist {
    const id = crypto.randomUUID();
    const createdAt = Date.now();

    // 获取当前最大排序号
    const maxOrderStmt = this.db.prepare(`
      SELECT MAX(sortOrder) as maxOrder FROM playlists
    `);
    const result = maxOrderStmt.get() as { maxOrder: number | null };
    const sortOrder = (result.maxOrder ?? 0) + 1;

    const stmt = this.db.prepare(`
      INSERT INTO playlists (id, name, sortOrder, createdAt)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, name, sortOrder, createdAt);

    return { id, name, sortOrder, createdAt };
  }

  // 重命名播放列表
  renamePlaylist(id: string, name: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE playlists SET name = ? WHERE id = ?
    `);
    const result = stmt.run(name, id) as { changes: number };
    return result.changes > 0;
  }

  // 删除播放列表
  deletePlaylist(id: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM playlists WHERE id = ?
    `);
    const result = stmt.run(id) as { changes: number };
    return result.changes > 0;
  }

  // 更新播放列表排序
  updatePlaylistOrder(orders: { id: string; sortOrder: number }[]): boolean {
    const stmt = this.db.prepare(`
      UPDATE playlists SET sortOrder = ? WHERE id = ?
    `);

    const updateMany = this.db.transaction(items => {
      for (const item of items as { id: string; sortOrder: number }[]) {
        stmt.run(item.sortOrder, item.id);
      }
    });

    updateMany(orders);
    return true;
  }

  // 添加媒体到播放列表
  addMediaToPlaylist(playlistId: string, mediaIds: string[]): boolean {
    const getMaxOrderStmt = this.db.prepare(`
      SELECT MAX(sortOrder) as maxOrder
      FROM playlist_media
      WHERE playlistId = ?
    `);
    const result = getMaxOrderStmt.get(playlistId) as { maxOrder: number | null };
    let currentOrder = (result.maxOrder ?? 0) + 1;

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO playlist_media (playlistId, mediaId, sortOrder, addedAt)
      VALUES (?, ?, ?, ?)
    `);

    const addMany = this.db.transaction(ids => {
      const now = Date.now();
      for (const mediaId of ids as string[]) {
        stmt.run(playlistId, mediaId, currentOrder++, now);
      }
    });

    addMany(mediaIds);
    return true;
  }

  // 从播放列表移除媒体
  removeMediaFromPlaylist(playlistId: string, mediaIds: string[]): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM playlist_media
      WHERE playlistId = ? AND mediaId = ?
    `);

    const removeMany = this.db.transaction(ids => {
      for (const mediaId of ids as string[]) {
        stmt.run(playlistId, mediaId);
      }
    });

    removeMany(mediaIds);
    return true;
  }

  // 更新播放列表内媒体排序
  updatePlaylistMediaOrder(playlistId: string, mediaIds: string[]): boolean {
    const stmt = this.db.prepare(`
      UPDATE playlist_media SET sortOrder = ?
      WHERE playlistId = ? AND mediaId = ?
    `);

    const updateMany = this.db.transaction(ids => {
      (ids as string[]).forEach((mediaId, index) => {
        stmt.run(index, playlistId, mediaId);
      });
    });

    updateMany(mediaIds);
    return true;
  }

  // 获取播放列表中的所有媒体
  getPlaylistMedia(playlistId: string): MediaFile[] {
    const stmt = this.db.prepare(`
      SELECT m.id, m.path, m.filename, m.type, m.size, m.width, m.height,
             m.duration, m.thumbnail, m.createdAt, m.modifiedAt
      FROM media m
      INNER JOIN playlist_media pm ON m.id = pm.mediaId
      WHERE pm.playlistId = ?
      ORDER BY pm.sortOrder ASC, pm.addedAt ASC
    `);

    const mediaList: MediaFile[] = [];
    for (const row of stmt.iterate(playlistId) as IterableIterator<Omit<MediaFile, 'tags'>>) {
      mediaList.push({
        ...row,
        tags: this.getTags(row.id),
      });
    }
    return mediaList;
  }
}

export { DatabaseManager };
