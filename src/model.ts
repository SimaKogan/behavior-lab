import { EMO } from './i18n';
import { Stats } from './tracker';

export interface Sess { t: number; f: number[]; e: number[] }
export const MIN = 5;
const KEY = 'bl-sessions';

export const featsOf = (s: Stats) => [
  s.speed, s.avgInt, s.sdInt, s.backRatio * 100,
  s.seconds ? (s.clicks / s.seconds) * 60 : 0, s.seconds ? s.keys / s.seconds : 0,
];
export const load = (): Sess[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
export const save = (a: Sess[]) => localStorage.setItem(KEY, JSON.stringify(a));
export const clear = () => localStorage.removeItem(KEY);

function solve(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const k = M[r][c] / (M[c][c] || 1e-9); for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / (M[i][i] || 1e-9); }
  return x;
}

/** Ridge regression on standardized features. Returns a predictor. */
function fit(X: number[][], y: number[], lam = 2) {
  const n = X.length, m = X[0].length;
  const mu = Array.from({ length: m }, (_, j) => X.reduce((a, r) => a + r[j], 0) / n);
  const sd = Array.from({ length: m }, (_, j) => Math.sqrt(X.reduce((a, r) => a + (r[j] - mu[j]) ** 2, 0) / n) || 1);
  const Z = X.map((r) => [1, ...r.map((v, j) => (v - mu[j]) / sd[j])]);
  const A = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => Z.reduce((a, r) => a + r[i] * r[j], 0) + (i === j && i > 0 ? lam : 0)));
  const w = solve(A, Array.from({ length: m + 1 }, (_, i) => Z.reduce((a, r, k) => a + r[i] * y[k], 0)));
  return (x: number[]) => w[0] + x.reduce((a, v, j) => a + (w[j + 1] * (v - mu[j])) / sd[j], 0);
}
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

/** For each emotion: prediction for `cur`, plus leave-one-out error of the model vs. a "guess the average" baseline. */
export function evaluate(all: Sess[], cur: number[], excludeLast: boolean) {
  const train = excludeLast ? all.slice(0, -1) : all;
  return EMO.map((_, k) => {
    const pred = Math.min(5, Math.max(0, fit(train.map((s) => s.f), train.map((s) => s.e[k]))(cur)));
    let eM = 0, eB = 0;
    all.forEach((s, i) => {
      const tr = all.filter((_, j) => j !== i);
      eM += Math.abs(fit(tr.map((r) => r.f), tr.map((r) => r.e[k]))(s.f) - s.e[k]);
      eB += Math.abs(mean(tr.map((r) => r.e[k])) - s.e[k]);
    });
    return { pred, mae: eM / all.length, base: eB / all.length };
  });
}
