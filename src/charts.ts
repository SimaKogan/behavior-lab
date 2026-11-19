type P = [number, number, number][];
const ACC = '124,92,255', ACC2 = '34,211,238', TXT = '#cbd5e1';

function fit(c: HTMLCanvasElement) {
  const r = devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
  c.width = w * r; c.height = h * r;
  const x = c.getContext('2d')!;
  x.setTransform(r, 0, 0, r, 0, 0);
  return { x, w, h };
}

export function heat(c: HTMLCanvasElement, pts: P) {
  const { x, w, h } = fit(c);
  x.strokeStyle = 'rgba(255,255,255,.05)';
  for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo((w / 8) * i, 0); x.lineTo((w / 8) * i, h); x.moveTo(0, (h / 8) * i); x.lineTo(w, (h / 8) * i); x.stroke(); }
  x.globalCompositeOperation = 'lighter';
  for (const [px, py] of pts) {
    const cx = px * w, cy = py * h, g = x.createRadialGradient(cx, cy, 0, cx, cy, 26);
    g.addColorStop(0, `rgba(${ACC},.16)`); g.addColorStop(1, `rgba(${ACC},0)`);
    x.fillStyle = g; x.fillRect(cx - 26, cy - 26, 52, 52);
  }
  x.globalCompositeOperation = 'source-over';
}

export function rhythm(c: HTMLCanvasElement, iv: number[]) {
  const { x, w, h } = fit(c), B = 20, bins = new Array(B).fill(0);
  iv.forEach((v) => { bins[Math.min(B - 1, Math.floor(v / 50))]++; });
  const max = Math.max(1, ...bins), bw = w / B, ch = h - 22;
  const g = x.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, `rgb(${ACC2})`); g.addColorStop(1, `rgb(${ACC})`);
  bins.forEach((n, i) => {
    const bh = (n / max) * (ch - 6);
    x.fillStyle = g; x.beginPath(); x.roundRect(i * bw + 2, ch - bh, bw - 4, bh, 4); x.fill();
  });
  x.fillStyle = TXT; x.font = '11px system-ui'; x.textAlign = 'start';
  ['0', '500', '1000+'].forEach((s, i) => { x.textAlign = i === 0 ? 'left' : i === 1 ? 'center' : 'right'; x.fillText(s, [0, w / 2, w][i], h - 4); });
}

export function radar(c: HTMLCanvasElement, vals: number[], labels: string[]) {
  const { x, w, h } = fit(c), n = vals.length, cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 30;
  const pt = (i: number, r: number): [number, number] => [cx + Math.sin((i / n) * 2 * Math.PI) * r, cy - Math.cos((i / n) * 2 * Math.PI) * r];
  x.strokeStyle = 'rgba(255,255,255,.12)';
  for (let k = 1; k <= 5; k++) { x.beginPath(); for (let i = 0; i < n; i++) x.lineTo(...pt(i, (R * k) / 5)); x.closePath(); x.stroke(); }
  for (let i = 0; i < n; i++) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(...pt(i, R)); x.stroke(); }
  x.beginPath(); vals.forEach((v, i) => x.lineTo(...pt(i, (R * v) / 5))); x.closePath();
  x.fillStyle = `rgba(${ACC},.35)`; x.fill(); x.strokeStyle = `rgb(${ACC2})`; x.lineWidth = 2; x.stroke();
  x.fillStyle = TXT; x.font = '12px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
  labels.forEach((l, i) => x.fillText(l, ...pt(i, R + 18)));
}
