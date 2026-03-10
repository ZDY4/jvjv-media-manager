import { parentPort } from 'worker_threads';
import ffmpeg from 'fluent-ffmpeg';

interface TrimSegment {
  start: number;
  end: number;
}

interface KeepRange {
  start: number;
  end?: number;
}

interface TrimMessage {
  mode: 'keep' | 'remove';
  input: string;
  output: string;
  segments: TrimSegment[];
  ffmpegPath?: string;
  ffprobePath?: string;
}

const roundTime = (value: number): number => Number(value.toFixed(3));

function normalizeSegments(segments: TrimSegment[]): TrimSegment[] {
  const sorted = [...segments]
    .map(segment => ({ start: Math.max(segment.start, 0), end: Math.max(segment.end, 0) }))
    .sort((a, b) => a.start - b.start);

  const merged: TrimSegment[] = [];
  for (const segment of sorted) {
    if (segment.start >= segment.end) continue;
    const last = merged[merged.length - 1];
    if (last && segment.start <= last.end) {
      last.end = Math.max(last.end, segment.end);
      continue;
    }
    merged.push(segment);
  }

  return merged;
}

function buildKeepRanges(mode: 'keep' | 'remove', segments: TrimSegment[]): KeepRange[] {
  const normalized = normalizeSegments(segments);
  if (normalized.length === 0) return [];

  if (mode === 'keep') {
    return normalized.map(segment => ({
      start: roundTime(segment.start),
      end: roundTime(segment.end),
    }));
  }

  const ranges: KeepRange[] = [];
  let cursor = 0;
  for (const segment of normalized) {
    if (segment.start > cursor) {
      ranges.push({ start: roundTime(cursor), end: roundTime(segment.start) });
    }
    cursor = segment.end;
  }

  ranges.push({ start: roundTime(cursor) });
  return ranges.filter(range => range.end === undefined || range.end > range.start);
}

async function hasAudioStream(input: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(input, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      const hasAudio = data.streams?.some(stream => stream.codec_type === 'audio') ?? false;
      resolve(hasAudio);
    });
  });
}

function buildFilterGraph(ranges: KeepRange[], hasAudio: boolean): {
  filters: string[];
  videoMap: string;
  audioMap?: string;
} {
  const filters: string[] = [];

  ranges.forEach((range, index) => {
    const endPart = typeof range.end === 'number' ? `:end=${range.end}` : '';
    filters.push(`[0:v]trim=start=${range.start}${endPart},setpts=PTS-STARTPTS[v${index}]`);
    if (hasAudio) {
      filters.push(`[0:a]atrim=start=${range.start}${endPart},asetpts=PTS-STARTPTS[a${index}]`);
    }
  });

  if (ranges.length === 1) {
    return {
      filters,
      videoMap: 'v0',
      audioMap: hasAudio ? 'a0' : undefined,
    };
  }

  const videoInputs = ranges.map((_, index) => `[v${index}]`).join('');
  if (hasAudio) {
    const audioInputs = ranges.map((_, index) => `[a${index}]`).join('');
    filters.push(`${videoInputs}${audioInputs}concat=n=${ranges.length}:v=1:a=1[vout][aout]`);
    return {
      filters,
      videoMap: 'vout',
      audioMap: 'aout',
    };
  }

  filters.push(`${videoInputs}concat=n=${ranges.length}:v=1:a=0[vout]`);
  return {
    filters,
    videoMap: 'vout',
  };
}

parentPort?.on('message', async (message: TrimMessage) => {
  const { mode, input, output, segments, ffmpegPath, ffprobePath } = message;

  try {
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
    }

    const ranges = buildKeepRanges(mode, segments);
    if (ranges.length === 0) {
      throw new Error('没有可输出的视频片段');
    }

    const hasAudio = await hasAudioStream(input);
    const filterGraph = buildFilterGraph(ranges, hasAudio);

    await new Promise<void>((resolve, reject) => {
      const outputOptions = [`-map [${filterGraph.videoMap}]`, '-movflags +faststart'];
      if (filterGraph.audioMap) {
        outputOptions.push(`-map [${filterGraph.audioMap}]`);
      }

      ffmpeg(input)
        .complexFilter(filterGraph.filters)
        .outputOptions(outputOptions)
        .output(output)
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
