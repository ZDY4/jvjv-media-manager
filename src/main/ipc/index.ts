import { registerMediaHandlers } from './media';
import { registerTagHandlers } from './tags';
import { registerSettingsHandlers } from './settings';
import { registerVideoHandlers, cleanupVideoWorkers } from './video';
import { registerWindowHandlers } from './window';
import { registerPlaylistHandlers } from './playlist';
import { DatabaseManager } from '../db/databaseManager';

export function registerAllHandlers(dbManager: DatabaseManager) {
  registerMediaHandlers(dbManager);
  registerTagHandlers(dbManager);
  registerSettingsHandlers();
  registerVideoHandlers();
  registerWindowHandlers();
  registerPlaylistHandlers(dbManager);
}

export { cleanupVideoWorkers };
