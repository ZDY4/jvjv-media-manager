import { ipcMain } from 'electron';
import { DatabaseManager } from '../db/databaseManager';
import { validateMediaId } from '../utils/validation';

export function registerTagHandlers(dbManager: DatabaseManager) {
  ipcMain.handle('search-media-by-tags', (_event, tags: string[]) =>
    dbManager.searchByTags(tags)
  );

  ipcMain.handle('add-tag', (_event, mediaId: string, tag: string) => {
    // Validate input
    if (!validateMediaId(mediaId)) {
      return { success: false, error: 'Invalid mediaId' };
    }
    if (!tag || typeof tag !== 'string' || tag.length === 0 || tag.length > 50) {
      return { success: false, error: 'Invalid tag' };
    }
    dbManager.addTag(mediaId, tag.trim());
    return { success: true };
  });

  ipcMain.handle(
    'remove-tag',
    (_event, mediaId: string, tag: string) => {
      // Validate input
      if (!validateMediaId(mediaId)) {
        return { success: false, error: 'Invalid mediaId' };
      }
      if (!tag || typeof tag !== 'string' || tag.length === 0 || tag.length > 50) {
        return { success: false, error: 'Invalid tag' };
      }
      dbManager.removeTag(mediaId, tag.trim());
      return { success: true };
    }
  );
}
