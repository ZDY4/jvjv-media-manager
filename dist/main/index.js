const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// 设置 FFmpeg 路径
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// 配置管理
const CONFIG_FILE = 'config.json';

function getConfig() {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {
    console.error('读取配置失败:', e);
  }
  return {};
}

function saveConfig(config) {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('保存配置失败:', e);
  }
}

function getDefaultDataDir() {
  const config = getConfig();
  if (config.dataDir) {
    return config.dataDir;
  }
  return process.cwd();
}

// Database
class DatabaseManager {
  constructor() {
    const dataDir = getDefaultDataDir();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'db.json');
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
    const idx = this.data.media.findIndex(m => m.id === media.id);
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

// Video Processor with FFmpeg
class VideoProcessor {
  // 获取视频时长
  async getDuration(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata.format.duration || 0);
      });
    });
  }

  // 保留片段
  async trimKeep(inputPath, outputPath, startTime, endTime, onProgress) {
    return new Promise((resolve, reject) => {
      const duration = endTime - startTime;
      
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('Spawned FFmpeg with command: ' + commandLine);
        })
        .on('progress', (progress) => {
          if (onProgress) {
            const percent = Math.min(100, Math.round((progress.timemark / duration) * 100));
            onProgress(percent);
          }
        })
        .on('end', () => {
          if (onProgress) onProgress(100);
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        })
        .run();
    });
  }

  // 删除片段（保留前后两段并合并）
  async trimRemove(inputPath, outputPath, startTime, endTime, onProgress) {
    const tempDir = path.join(app.getPath('temp'), 'video-trim-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    const part1Path = path.join(tempDir, 'part1.mp4');
    const part2Path = path.join(tempDir, 'part2.mp4');
    const listPath = path.join(tempDir, 'list.txt');

    try {
      // 获取视频总时长
      const totalDuration = await this.getDuration(inputPath);

      // 提取前段
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .setDuration(startTime)
          .output(part1Path)
          .on('progress', (progress) => {
            if (onProgress) onProgress(Math.min(40, Math.round((progress.percent || 0) * 0.4)));
          })
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // 提取后段
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .setStartTime(endTime)
          .setDuration(totalDuration - endTime)
          .output(part2Path)
          .on('progress', (progress) => {
            if (onProgress) onProgress(40 + Math.min(40, Math.round((progress.percent || 0) * 0.4)));
          })
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // 创建合并列表
      fs.writeFileSync(listPath, `file '${part1Path.replace(/'/g, "'\\''")}'\nfile '${part2Path.replace(/'/g, "'\\''")}'`);

      // 合并两段
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(listPath)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions('-c copy')
          .output(outputPath)
          .on('progress', () => {
            if (onProgress) onProgress(85);
          })
          .on('end', () => {
            if (onProgress) onProgress(100);
            resolve();
          })
          .on('error', reject)
          .run();
      });

    } finally {
      // 清理临时文件
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error('清理临时文件失败:', e);
      }
    }
  }
}

// Main
let mainWindow = null;
let dbManager;
let currentProcess = null;

async function createWindow() {
  dbManager = new DatabaseManager();
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1000, minHeight: 600,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }, show: false,
  });

  const isDev = process.argv.includes('--dev');
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => mainWindow = null);
}

// IPC
ipcMain.handle('scan-media-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'], title: '选择媒体文件夹',
  });
  if (result.canceled) return null;
  const scanner = new MediaScanner();
  const files = await scanner.scan(result.filePaths[0]);
  for (const f of files) dbManager.addMedia(f);
  return files;
});

ipcMain.handle('get-all-media', () => dbManager.getAllMedia());
ipcMain.handle('search-media-by-tags', (_, tags) => dbManager.searchByTags(tags));
ipcMain.handle('add-tag', (_, mediaId, tag) => { dbManager.addTag(mediaId, tag); return true; });
ipcMain.handle('remove-tag', (_, mediaId, tag) => { dbManager.removeTag(mediaId, tag); return true; });
ipcMain.handle('delete-media', (_, mediaId) => { dbManager.deleteMedia(mediaId); return true; });

// 视频剪辑 - 带进度
ipcMain.handle('trim-video-start', async (event, { mode, input, output, start, end }) => {
  try {
    const processor = new VideoProcessor();
    const onProgress = (percent) => {
      if (mainWindow) {
        mainWindow.webContents.send('trim-progress', { percent, mode });
      }
    };

    if (mode === 'keep') {
      await processor.trimKeep(input, output, start, end, onProgress);
    } else {
      await processor.trimRemove(input, output, start, end, onProgress);
    }

    if (mainWindow) {
      mainWindow.webContents.send('trim-complete', { success: true, output });
    }
    return { success: true, output };
  } catch (error) {
    if (mainWindow) {
      mainWindow.webContents.send('trim-complete', { success: false, error: error.message });
    }
    return { success: false, error: error.message };
  }
});

// 选择输出目录
ipcMain.handle('select-output-dir', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择输出目录',
  });
  return result.canceled ? null : result.filePaths[0];
});

// 获取/设置数据目录
ipcMain.handle('get-data-dir', () => getDefaultDataDir());
ipcMain.handle('set-data-dir', async (_, dirPath) => {
  const config = getConfig();
  config.dataDir = dirPath;
  saveConfig(config);
  return true;
});

// 选择数据目录
ipcMain.handle('select-data-dir', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择数据存储目录',
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

app.whenReady().then(createWindow).catch(console.error);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
