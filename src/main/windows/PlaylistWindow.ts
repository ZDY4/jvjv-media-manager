import { BrowserWindow } from 'electron';
import path from 'path';

let playlistWindow: BrowserWindow | null = null;

export async function createPlaylistWindow(): Promise<BrowserWindow> {
  if (playlistWindow) {
    playlistWindow.focus();
    return playlistWindow;
  }

  const isDev = process.argv.includes('--dev');

  playlistWindow = new BrowserWindow({
    width: 400,
    height: 800,
    minWidth: 250,
    minHeight: 500,
    title: '媒体库',
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#202020',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, 'preload.js'),
      webSecurity: !isDev,
    },
    show: false,
  });

  // 加载媒体库页面
  if (isDev) {
    await playlistWindow.loadURL('http://localhost:5173/playlist.html');
  } else {
    await playlistWindow.loadFile(path.join(__dirname, '../../renderer/playlist.html'));
  }

  playlistWindow.show();

  // 监听窗口关闭
  playlistWindow.on('closed', () => {
    playlistWindow = null;
    // 这里无法直接通知主窗口，需要通过回调或者事件总线
    // 但我们可以通过 return 让调用者处理
  });

  return playlistWindow;
}

export function closePlaylistWindow(): void {
  if (playlistWindow) {
    playlistWindow.close();
    playlistWindow = null;
  }
}

export function getPlaylistWindow(): BrowserWindow | null {
  return playlistWindow;
}
