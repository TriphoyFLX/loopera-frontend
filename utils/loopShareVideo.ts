export type LoopShareMeta = {
  id: number | string;
  title: string;
  author?: string;
  bpm?: number | null;
  key?: string | null;
  genre?: string | null;
  filename: string;
  audioUrl: string;
};

export type ShareVideoProgress = {
  phase: 'loading' | 'rendering' | 'encoding' | 'done' | 'error';
  progress: number;
  message?: string;
};

const W = 1080;
const H = 1920;
const FPS = 30;
const MAX_DURATION_SEC = 20;

function pickMimeType(): { mimeType: string; ext: 'mp4' | 'webm' } {
  const candidates: Array<{ mimeType: string; ext: 'mp4' | 'webm' }> = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { mimeType: 'video/mp4', ext: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
  ];

  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }

  return { mimeType: '', ext: 'webm' };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawLogoMark(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#FF215C';
  // simplified Loopera mark as geometric star-like mark
  ctx.beginPath();
  ctx.moveTo(48, 12);
  ctx.lineTo(36, 42);
  ctx.lineTo(34, 38);
  ctx.lineTo(62, 36);
  ctx.lineTo(132, 72);
  ctx.lineTo(36, 54);
  ctx.lineTo(38, 50);
  ctx.lineTo(52, 82);
  ctx.lineTo(40, 90);
  ctx.lineTo(26, 58);
  ctx.lineTo(28, 58);
  ctx.lineTo(14, 90);
  ctx.lineTo(0, 80);
  ctx.lineTo(16, 48);
  ctx.lineTo(18, 52);
  ctx.lineTo(-8, 54);
  ctx.lineTo(-8, 36);
  ctx.lineTo(20, 36);
  ctx.lineTo(18, 40);
  ctx.lineTo(4, 8);
  ctx.lineTo(16, 0);
  ctx.lineTo(30, 32);
  ctx.lineTo(28, 32);
  ctx.lineTo(42, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseSize: number,
  minSize: number,
  maxWidth: number,
  weight = 700,
  family = '"DM Sans", Arial, sans-serif',
): number {
  let size = baseSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) {
      return size;
    }
    size -= 1;
  }
  return minSize;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  meta: LoopShareMeta,
  analyserData: Uint8Array,
  timeSec: number,
  duration: number,
) {
  // background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#07070a');
  bg.addColorStop(0.45, '#12101a');
  bg.addColorStop(1, '#1a0a12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // soft pink glow
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.38, 40, W * 0.5, H * 0.38, 520);
  glow.addColorStop(0, 'rgba(255, 42, 85, 0.35)');
  glow.addColorStop(0.55, 'rgba(255, 42, 85, 0.08)');
  glow.addColorStop(1, 'rgba(255, 42, 85, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // top badge
  ctx.save();
  roundRect(ctx, 72, 120, 280, 64, 32);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
  ctx.fillStyle = '#FF4D6D';
  ctx.font = '700 28px "Syne", "Arial Black", sans-serif';
  ctx.fillText('LOOPERA', 108, 162);
  ctx.restore();

  // circular waveform
  const cx = W / 2;
  const cy = H * 0.42;
  const baseR = 220;
  const bins = analyserData.length;

  ctx.save();
  ctx.translate(cx, cy);

  // outer ring
  ctx.beginPath();
  ctx.arc(0, 0, baseR + 70, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const barCount = 96;
  for (let i = 0; i < barCount; i++) {
    const idx = Math.floor((i / barCount) * bins);
    const v = (analyserData[idx] || 0) / 255;
    const amp = 28 + v * 160;
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const x1 = Math.cos(angle) * baseR;
    const y1 = Math.sin(angle) * baseR;
    const x2 = Math.cos(angle) * (baseR + amp);
    const y2 = Math.sin(angle) * (baseR + amp);

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, 'rgba(255, 42, 85, 0.25)');
    grad.addColorStop(1, `rgba(255, ${Math.floor(80 + v * 120)}, ${Math.floor(140 - v * 40)}, ${0.55 + v * 0.45})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // center disc
  const disc = ctx.createRadialGradient(0, 0, 20, 0, 0, baseR - 24);
  disc.addColorStop(0, '#2a1220');
  disc.addColorStop(1, '#12080e');
  ctx.beginPath();
  ctx.arc(0, 0, baseR - 24, 0, Math.PI * 2);
  ctx.fillStyle = disc;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 42, 85, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // spinning accent
  ctx.rotate(timeSec * 0.8);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, baseR - 50, 0, Math.PI * 0.55);
  ctx.stroke();
  ctx.restore();

  // title
  const title = (meta.title || 'Untitled Loop').slice(0, 48);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px "Syne", "Arial Black", sans-serif';
  wrapText(ctx, title, cx, H * 0.68, W - 140, 72);

  // author
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '600 36px "DM Sans", Arial, sans-serif';
  ctx.fillText(`@${meta.author || 'loopera'}`, cx, H * 0.74);

  // meta pills
  const pills: string[] = [];
  if (meta.bpm) pills.push(`${meta.bpm} BPM`);
  if (meta.key) pills.push(String(meta.key));
  if (meta.genre) pills.push(String(meta.genre));
  if (pills.length === 0) pills.push('LOOP');

  const pillW = 180;
  const gap = 18;
  const totalW = pills.length * pillW + (pills.length - 1) * gap;
  let px = (W - totalW) / 2;
  const py = H * 0.78;
  pills.forEach((p) => {
    roundRect(ctx, px, py, pillW, 56, 28);
    ctx.fillStyle = 'rgba(255, 42, 85, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 42, 85, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '700 26px "DM Sans", Arial, sans-serif';
    ctx.fillText(p, px + pillW / 2, py + 37);
    px += pillW + gap;
  });

  // progress bar
  const progress = Math.min(1, timeSec / Math.max(duration, 0.01));
  roundRect(ctx, 120, H * 0.86, W - 240, 10, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
  roundRect(ctx, 120, H * 0.86, (W - 240) * progress, 10, 5);
  ctx.fillStyle = '#FF2A55';
  ctx.fill();

  // bottom brand bar
  roundRect(ctx, 72, H - 260, W - 144, 150, 36);
  ctx.fillStyle = 'rgba(10, 10, 12, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  drawLogoMark(ctx, 120, H - 220, 0.95);

  const brandLeft = 230;
  const brandMaxWidth = W - 340;
  const brandTitle = 'Loopera';
  const brandSubtitle = 'loop on Loopera';
  const brandUrl = 'loopera.ru';

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  const titleSize = fitFontSize(ctx, brandTitle, 40, 28, brandMaxWidth, 800, '"Syne", "Arial Black", sans-serif');
  ctx.font = `800 ${titleSize}px "Syne", "Arial Black", sans-serif`;
  ctx.fillText(brandTitle, brandLeft, H - 180);

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  const subtitleSize = fitFontSize(ctx, brandSubtitle, 28, 20, brandMaxWidth, 600);
  ctx.font = `600 ${subtitleSize}px "DM Sans", Arial, sans-serif`;
  ctx.fillText(brandSubtitle, brandLeft, H - 132);

  ctx.fillStyle = 'rgba(255, 77, 109, 0.95)';
  const urlSize = fitFontSize(ctx, brandUrl, 24, 18, brandMaxWidth, 700);
  ctx.font = `700 ${urlSize}px "DM Sans", Arial, sans-serif`;
  ctx.fillText(brandUrl, brandLeft, H - 92);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.slice(0, 2).forEach((l, i) => {
    ctx.fillText(l, x, startY + i * lineHeight);
  });
}

export async function generateLoopShareVideo(
  meta: LoopShareMeta,
  onProgress?: (p: ShareVideoProgress) => void,
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  onProgress?.({ phase: 'loading', progress: 0.05, message: 'Loading audio…' });

  const response = await fetch(meta.audioUrl);
  if (!response.ok) {
    throw new Error('Failed to load loop audio');
  }
  const arrayBuffer = await response.arrayBuffer();

  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  const duration = Math.min(audioBuffer.duration, MAX_DURATION_SEC);

  onProgress?.({ phase: 'rendering', progress: 0.15, message: 'Rendering visual…' });

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }

  const { mimeType, ext } = pickMimeType();
  const stream = canvas.captureStream(FPS);

  // audio graph
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const data = new Uint8Array(analyser.frequencyBinCount);
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(analyser);
  analyser.connect(dest);
  // keep silent while encoding — preview plays after download ready
  // analyser.connect(audioCtx.destination);

  dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
    : new MediaRecorder(stream, { videoBitsPerSecond: 8_000_000 });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Recording failed'));
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/webm' }));
    };
  });

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  recorder.start(200);
  source.start(0);

  const startedAt = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      analyser.getByteFrequencyData(data);
      drawFrame(ctx, meta, data, Math.min(elapsed, duration), duration);
      onProgress?.({
        phase: 'encoding',
        progress: Math.min(0.95, 0.15 + (elapsed / duration) * 0.8),
        message: 'Encoding video…',
      });

      if (elapsed >= duration) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  try {
    source.stop();
  } catch {
    // already stopped
  }

  if (recorder.state !== 'inactive') {
    recorder.stop();
  }

  stream.getTracks().forEach((t) => t.stop());
  await audioCtx.close();

  const blob = await recorded;
  const safeTitle = (meta.title || 'loop')
    .replace(/[^\w\u0400-\u04FF\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40) || 'loop';

  onProgress?.({ phase: 'done', progress: 1, message: 'Ready' });

  return {
    blob,
    filename: `loopera_${safeTitle}.${ext}`,
    mimeType: blob.type || mimeType || 'video/webm',
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
