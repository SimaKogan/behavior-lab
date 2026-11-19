export interface Stats {
  speed: number; avgInt: number; sdInt: number; backRatio: number;
  keys: number; clicks: number; moves: number; seconds: number; intervals: number[];
}

/** Records timing only. Key characters are never stored (just "was it Backspace?"). */
export class Tracker {
  pts: [number, number, number][] = []; // normalized x, y and timestamp (ms)
  keys: number[] = [];
  back = 0;
  clicks = 0;
  private t0 = performance.now();
  private last = 0;

  private mm = (e: MouseEvent) => {
    if (e.timeStamp - this.last < 30) return;
    this.last = e.timeStamp;
    this.pts.push([e.clientX / innerWidth, e.clientY / innerHeight, e.timeStamp]);
  };
  private kd = (e: KeyboardEvent) => {
    this.keys.push(e.timeStamp);
    if (e.key === 'Backspace') this.back++;
  };
  private ck = () => { this.clicks++; };

  start() {
    addEventListener('mousemove', this.mm);
    addEventListener('keydown', this.kd);
    addEventListener('click', this.ck);
  }
  stop() {
    removeEventListener('mousemove', this.mm);
    removeEventListener('keydown', this.kd);
    removeEventListener('click', this.ck);
  }

  stats(): Stats {
    let dist = 0, time = 0;
    for (let i = 1; i < this.pts.length; i++) {
      const dt = this.pts[i][2] - this.pts[i - 1][2];
      if (dt > 500) continue; // ignore idle gaps
      dist += Math.hypot((this.pts[i][0] - this.pts[i - 1][0]) * innerWidth, (this.pts[i][1] - this.pts[i - 1][1]) * innerHeight);
      time += dt;
    }
    const intervals: number[] = [];
    for (let i = 1; i < this.keys.length; i++) {
      const dt = this.keys[i] - this.keys[i - 1];
      if (dt < 2000) intervals.push(Math.round(dt));
    }
    const avg = intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    const sd = intervals.length ? Math.sqrt(intervals.reduce((a, b) => a + (b - avg) ** 2, 0) / intervals.length) : 0;
    return {
      speed: time ? Math.round((dist / time) * 1000) : 0,
      avgInt: Math.round(avg), sdInt: Math.round(sd),
      backRatio: this.keys.length ? this.back / this.keys.length : 0,
      keys: this.keys.length, clicks: this.clicks, moves: this.pts.length,
      seconds: Math.round((performance.now() - this.t0) / 1000), intervals,
    };
  }
}
