import { ipcMain, BrowserWindow } from 'electron';
import { Worker } from 'worker_threads';
import { validateTrimParams } from '../utils/validation';
import { getWorkerPath } from '../utils/paths';

const activeWorkers = new Map<string, Worker>();

export function registerVideoHandlers() {
  // 视频剪辑 - 使用 Worker 线程
  ipcMain.handle('trim-video-start', async (event, params) => {
    // Validate input
    const validation = validateTrimParams(params);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { mode, input, output, start, end } = params;
    const jobId = Date.now().toString();
    const sender = event.sender;
    const window = BrowserWindow.fromWebContents(sender);

    return new Promise<{
      success: boolean;
      output?: string;
      error?: string;
    }>(resolve => {
      const worker = new Worker(getWorkerPath());
      activeWorkers.set(jobId, worker);

      worker.on(
        'message',
        (data: {
          type: string;
          percent?: number;
          success?: boolean;
          output?: string;
          error?: string;
        }) => {
          if (data.type === 'progress') {
            if (window && !window.isDestroyed()) {
              sender.send('trim-progress', {
                percent: data.percent,
                mode,
              });
            }
          } else if (data.type === 'complete') {
            activeWorkers.delete(jobId);
            worker.terminate();

            if (window && !window.isDestroyed()) {
              sender.send('trim-complete', data);
            }
            resolve(data as { success: boolean; output?: string; error?: string });
          }
        }
      );

      worker.on('error', (err: Error) => {
        activeWorkers.delete(jobId);
        const errorData = { success: false, error: err.message };
        if (window && !window.isDestroyed()) {
          sender.send('trim-complete', errorData);
        }
        resolve(errorData);
      });

      worker.postMessage({ mode, input, output, start, end });
    });
  });

  ipcMain.handle('trim-video-cancel', async (_, jobId) => {
    const worker = activeWorkers.get(jobId);
    if (worker) {
      await worker.terminate();
      activeWorkers.delete(jobId);
      return { success: true };
    }
    return { success: false };
  });
}

export async function cleanupVideoWorkers() {
  for (const [, worker] of activeWorkers) {
    await worker.terminate();
  }
  activeWorkers.clear();
}
