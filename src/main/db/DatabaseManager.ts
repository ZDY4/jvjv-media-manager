import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { MediaFile, MediaType } from '../../shared/types';

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'media-library.db');
    this.db = new Database(dbPath);
    this.initTables();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        path TEXT UNIQUE NOT NULL,
        filename TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER,
        duration REAL,
        width INTEGER,
        height INTEGER,
        thumbnail TEXT,
        created_at INTEGER,
        modified_at INTEGER,
        last_played INTEGER,
        play_count INTEGER DEFAULT 0
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        media_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
        UNIQUE(media_id, tag)
      )
    `);

    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tags_media ON tags(media_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag)');
  }

  addMedia(media: MediaFile): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO media 
      (id, path, filename, type, size, duration, width, height, thumbnail, created_at, modified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      media.id, media.path, media.filename, media.type, media.size,
      media.duration || null, media.width || null, media.height || null,
      media.thumbnail || null, media.createdAt, media.modifiedAt
    );
  }

  getAllMedia(): MediaFile[] {
    const stmt = this.db.prepare('SELECT * FROM media ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToMediaFile(row));
  }

  getMediaById(id: string): MediaFile | null {
    const stmt = this.db.prepare('SELECT * FROM media WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToMediaFile(row) : null;
  }

  deleteMedia(id: string): void {
    this.db.prepare('DELETE FROM media WHERE id = ?').run(id);
  }

  addTag(mediaId: string, tag: string): void {
    try {
      this.db.prepare('INSERT INTO tags (media_id, tag) VALUES (?, ?)').run(mediaId, tag);
    } catch (e) {}
  }

  removeTag(mediaId: string, tag: string): void {
    this.db.prepare('DELETE FROM tags WHERE media_id = ? AND tag = ?').run(mediaId, tag);
  }

  getTags(mediaId: string): string[] {
    const stmt = this.db.prepare('SELECT tag FROM tags WHERE media_id = ? ORDER BY tag');
    const rows = stmt.all(mediaId) as any[];
    return rows.map(row => row.tag);
  }

  searchByTags(tags: string[]): MediaFile[] {
    if (tags.length === 0) return this.getAllMedia();
    const placeholders = tags.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT m.* FROM media m
      INNER JOIN tags t ON m.id = t.media_id
      WHERE t.tag IN (${placeholders})
      GROUP BY m.id
      HAVING COUNT(DISTINCT t.tag) = ?
      ORDER BY m.created_at DESC
    `);
    const rows = stmt.all(...tags, tags.length) as any[];
    return rows.map(row => this.rowToMediaFile(row));
  }

  private rowToMediaFile(row: any): MediaFile {
    return {
      id: row.id, path: row.path, filename: row.filename, type: row.type as MediaType,
      size: row.size, duration: row.duration, width: row.width, height: row.height,
      thumbnail: row.thumbnail, createdAt: row.created_at, modifiedAt: row.modified_at,
      lastPlayed: row.last_played, playCount: row.play_count,
      tags: this.getTags(row.id),
    };
  }
}
