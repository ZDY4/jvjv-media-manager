import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export class VideoProcessor {
  // 保留指定时间段
  async trimKeep(inputPath: string, outputPath: string, startTime: number, endTime: number): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  // 删除指定时间段（分成两段保留）
  async trimRemove(inputPath: string, outputPath: string, startTime: number, endTime: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // 获取视频信息
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        const duration = metadata.format.duration || 0;
        
        if (startTime <= 0 || endTime >= duration) {
          return reject(new Error('Invalid trim range'));
        }

        // 使用复杂滤镜删除中间段
        const filterComplex = [
          `[0:v]trim=start=0:end=${startTime},setpts=PTS-STARTPTS[v1]`,
          `[0:v]trim=start=${endTime}:end=${duration},setpts=PTS-STARTPTS[v2]`,
          `[v1][v2]concat=n=2:v=1:a=0[outv]`,
          `[0:a]atrim=start=0:end=${startTime},asetpts=PTS-STARTPTS[a1]`,
          `[0:a]atrim=start=${endTime}:end=${duration},asetpts=PTS-STARTPTS[a2]`,
          `[a1][a2]concat=n=2:v=0:a=1[outa]`
        ].join(';');

        ffmpeg(inputPath)
          .complexFilter(filterComplex, ['outv', 'outa'])
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });
    });
  }
}
