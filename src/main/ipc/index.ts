import { registerMediaHandlers } from './media';
import { registerTagHandlers } from './tags';
import { registerSettingsHandlers } from './settings';
import { registerVideoHandlers, cleanupVideoWorkers } from './video';
import { registerWindowHandlers } from './window';
import { registerPlaylistHandlers } from './playlist';
import { registerUpdateHandlers } from './update';
import type { DatabaseManager } from '../db/databaseManager';

export function registerAllHandlers(dbManager: DatabaseManager) {
  registerMediaHandlers(dbManager);
  registerTagHandlers(dbManager);
  registerSettingsHandlers(dbManager);
  registerVideoHandlers();
  registerWindowHandlers();
  registerPlaylistHandlers(dbManager);
  registerUpdateHandlers();
}

export { cleanupVideoWorkers };
