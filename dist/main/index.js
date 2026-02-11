const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');

// Database
class DatabaseManager {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'db.json');
    this.data = this.loadData();
  }
  loadData() {
    try {
      if (fs.existsSync(this.dbPath)) {
        return { media: [], tags: [], ...JSON.parse(fs.readFileSync(this.dbPath, 'utf-8')) };
      }
    } catch (e) { console.error(e); }
    return { media: [], tags: [] };
  }
  saveData() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (e) { console.error(e); }
  }
  addMedia(media) {
    const idx = { media: m.id === media.id };
    if (idx >= 0) this.data.media[idx] = media;
    else this.data.media.push(media);
    this.saveData();
  }
  getAllMedia() {
    return this.data.media.map(m => ({ ...m, tags: this.getTags(m.id) }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  deleteMedia(id) {
    this.data.media = this.data.media.filter(m => m.id !== id);
    this.data.tags = this.data.tags.filter(t => t.mediaId !== id);
    this.saveData();
  }
  addTag(mediaId, tag) {
    if (!this.data.tags.find(t => t.mediaId === mediaId && t.tag === tag)) {
      this.data.tags.push({ mediaId, tag });
      this.saveData();
    }
  }
  removeTag(mediaId, tag) {
    this.data.tags = this.data.tags.filter(t => !(t.mediaId === mediaId && t.tag === tag));
    this.saveData();
  }
  getTags(mediaId) {
    return this.data.tags.filter(t => t.mediaId === mediaId).map(t => t.tag).sort();
  }
  searchByTags(tags) {
    if (tags.length === 0) return this.getAllMedia();
    const ids = new Set();
    tags.forEach(tag => {
      this.data.tags.filter(t => t.tag === tag).forEach(t => ids.add(t.mediaId));
    });
    return this.data.media.filter(m => ids.has(m.id))
      .map(m => ({ ...m, tags: this.getTags(m.id) }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

// Scanner
const VIDEO_EXT = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

class MediaScanner {
  async scan(folderPath) {
    const results = [];
    await this.scanDir(folderPath, results);
    return results;
  }
  async scanDir(dirPath, results) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) await this.scanDir(fullPath, results);
      else if (entry.isFile()) {
        const media = this.processFile(fullPath);
        if (media) results.push(media);
      }
    }
  }
  processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const stats = fs.statSync(filePath);
    let type = null;
    if (VIDEO_EXT.includes(ext)) type = 'video';
    else if (IMAGE_EXT.includes(ext)) type = 'image';
    if (!type) return null;
    return {
      id: crypto.createHash('md5').update(filePath).digest('hex'),
      path: filePath, filename: path.basename(filePath), type,
      size: stats.size, createdAt: Math.floor(stats.birthtimeMs / 1000),
      modifiedAt: Math.floor(stats.mtimeMs / 1000), tags: [],
    };
  }
}

// Video Processor
class VideoProcessor {
  async trimKeep(input, output, start, end) {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', input,
        '-ss', String(start),
        '-to', String(end - start),
        '-c', 'copy',
        '-y',
        output
      ]);
      
      let stderr = '';
      ffmpeg.stderr.on('data', (data) => { stderr += data; });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve(true);
        else reject(new Error('FFmpeg failed: ' + stderr));
      });
      
      ffmpeg.on('error', reject);
    });
  }
  
  async trimRemove(input, output, start, end) {
    return new Promise((resolve, reject) => {
      const temp1 = input + '.temp1.mp4';
      const temp2 = input + '.temp2.mp4';
      
      const commands = [
        ['-i', input, '-to', String(start), '-c', 'copy', '-y', temp1],
        ['-i', input, '-ss', String(end), '-c', 'copy', '-y', temp2],
        ['-i', temp1, '-i', temp2, '-filter_complex', '[0:v][1:v]concat=v=1:n=2[outv];[0:a][1:a]concat=a=1:n=2[outa]', '-map', '[outv]', '-map', '[outa]', '-y', output]
      ];
      
      let current = 0;
      
      const runNext = () => {
        if (current >= commands.length) {
          try { fs.unlinkSync(temp1); } catch (e) {}
          try { fs.unlinkSync(temp2); } catch (e) {}
          resolve(true);
          return;
        }
        
        const cmd = commands[current];
        const ffmpeg = spawn('ffmpeg', cmd);
        
        let stderr = '';
        ffmpeg.stderr.on('data', (data) => { stderr += data; });
        
        ffmpeg.on('close', (code) => {
          if (code === 0) {
            current++;
            runNext();
          } else {
            reject(new Error('FFmpeg failed: ' + stderr));
          }
        });
        
        ffmpeg.on('error', reject);
      };
      
      runNext();
    });
  }
}

// Main
let mainWindow = null;
let dbManager = null;

async function createWindow() {
  dbManager = new DatabaseManager();
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1000, minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
  
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.handle('scan-media-folder', async () => {
  console.log('[IPC] scan-media-folder called');
  if (!mainWindow) {
    console.error('[IPC] No main window');
    return null;
  }
  
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择媒体文件夹',
    });
    
    console.log('[IPC] Dialog result:', result.canceled, result.filePaths);
    
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    
    const scanner = new MediaScanner();
    const files = await scanner.scan(result.filePaths[0]);
    console.log('[IPC] Scanned', files.length, 'files');
    
    for (const f of files) {
      dbManager.addMedia(f);
    }
    
    return files;
  } catch (error) {
    console.error('[IPC] Error in scan-media-folder:', error);
    throw error;
  }
});

ipcMain.handle('get-all-media', () => {
  return dbManager.getAllMedia();
});

ipcMain.handle('search-media-by-tags', (_, tags) => {
  return dbManager.searchByTags(tags);
});

ipcMain.handle('add-tag', (_, mediaId, tag) => {
  dbManager.addTag(mediaId, tag);
  return true;
});

ipcMain.handle('remove-tag', (_, mediaId, tag) => {
  dbManager.removeTag(mediaId, tag);
  return true;
});

ipcMain.handle('delete-media', (_, mediaId) => {
  dbManager.deleteMedia(mediaId);
  return true;
});

ipcMain.handle('trim-video-keep', async (_, input, output, start, end) => {
  await new VideoProcessor().trimKeep(input, output, start, end);
  return true;
});

ipcMain.handle('trim-video-remove', async (_, input, output, start, end) => {
  await new VideoProcessor().trimRemove(input, output, start, end);
  return true;
});

app.whenReady().then(createWindow).catch((err) => {
  console.error('Failed to create window:', err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
