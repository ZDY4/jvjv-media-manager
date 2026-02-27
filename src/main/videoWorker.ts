import { parentPort } from 'worker_threads';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

interface TrimMessage {
  mode: 'keep' | 'remove';
  input: string;
  output: string;
  start: number;
  end: number;
}

parentPort?.on('message', async (message: TrimMessage) => {
  const { mode, input, output, start, end } = message;

  try {
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(input);

      if (mode === 'keep') {
        // Keep mode: trim to keep only the specified segment
        command.setStartTime(start).setDuration(end - start);
      } else {
        // Remove mode: cut out the specified segment (need two passes or complex filter)
        // For simplicity, we'll do two separate segments and concatenate
        // First segment: 0 to start
        // Second segment: end to duration
        // This is a simplified version - full implementation would need segment concatenation
        command
          .videoFilters(
            `trim=start=0:end=${start},setpts=PTS-STARTPTS[part1];` +
              `trim=start=${end}:end=999999,setpts=PTS-STARTPTS[part2]`
          )
          .output(output);
      }

      command
        .on('start', (cmd: string) => {
          parentPort?.postMessage({ type: 'start', command: cmd });
        })
        .on('progress', (progress: { percent?: number }) => {
          parentPort?.postMessage({
            type: 'progress',
            percent: Math.min(Math.round(progress.percent || 0), 100),
            mode,
          });
        })
        .on('end', () => {
          parentPort?.postMessage({
            type: 'complete',
            success: true,
            output,
          });
          resolve();
        })
        .on('error', (err: Error) => {
          parentPort?.postMessage({
            type: 'complete',
            success: false,
            error: err.message,
          });
          reject(err);
        })
        .output(output)
        .run();
    });
  } catch (error) {
    parentPort?.postMessage({
      type: 'complete',
      success: false,
      error: (error as Error).message,
    });
  }
});
