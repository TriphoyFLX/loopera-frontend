/** Client-side audio trim for LoopTok (when file > 15MB). */

export const LOOPTOK_MAX_BYTES = 15 * 1024 * 1024;
export const LOOPTOK_MAX_TRIM_SEC = 60;

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i += 1) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Encode mono/stereo AudioBuffer as 16-bit PCM WAV. */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const samples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c += 1) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < samples; i += 1) {
    for (let c = 0; c < numChannels; c += 1) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const ctx = new AudioContext();
  try {
    const arrayBuffer = await file.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

export function sliceAudioBuffer(
  source: AudioBuffer,
  startSec: number,
  endSec: number,
): AudioBuffer {
  const start = Math.max(0, Math.min(source.duration, startSec));
  const end = Math.max(start + 0.05, Math.min(source.duration, endSec));
  const sampleRate = source.sampleRate;
  const startFrame = Math.floor(start * sampleRate);
  const endFrame = Math.floor(end * sampleRate);
  const frameCount = Math.max(1, endFrame - startFrame);
  const channels = Math.min(2, source.numberOfChannels);

  const ctx = new OfflineAudioContext(channels, frameCount, sampleRate);
  const sliced = ctx.createBuffer(channels, frameCount, sampleRate);
  for (let c = 0; c < channels; c += 1) {
    const input = source.getChannelData(c).subarray(startFrame, endFrame);
    sliced.copyToChannel(input, c);
  }
  return sliced;
}

export async function trimAudioFileToBlob(
  file: File,
  startSec: number,
  endSec: number,
): Promise<{ blob: Blob; duration: number; filename: string }> {
  const decoded = await decodeAudioFile(file);
  const maxEnd = Math.min(endSec, startSec + LOOPTOK_MAX_TRIM_SEC, decoded.duration);
  const sliced = sliceAudioBuffer(decoded, startSec, maxEnd);
  const blob = audioBufferToWavBlob(sliced);

  if (blob.size > LOOPTOK_MAX_BYTES) {
    throw new Error('TRIM_STILL_TOO_LARGE');
  }

  const base = file.name.replace(/\.[^.]+$/, '') || 'looptok';
  return {
    blob,
    duration: sliced.duration,
    filename: `${base}_trim.wav`,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
