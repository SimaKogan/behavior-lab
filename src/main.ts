import './style.css';
import { EMO, LANGS, Lang, t } from './i18n';
import { Tracker, Stats } from './tracker';
import { evaluate, featsOf, load, save, clear, MIN } from './model';
import { heat, radar, rhythm } from './charts';

type Step = 'intro' | 'test' | 'result';
const app = document.getElementById('app')!;
const guess = (): Lang => {
  const s = localStorage.getItem('bl-lang') as Lang | null;
  if (s && LANGS.includes(s)) return s;
  const n = navigator.language.slice(0, 2);
  return n === 'he' || n === 'ru' ? n : 'en';
};
const S = { lang: guess(), step: 'intro' as Step, text: '', consent: false, saved: false, emo: {} as Record<string, number> };
EMO.forEach((e) => (S.emo[e] = 0));
let tr: Tracker | null = null;
let stats: Stats | null = null;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function view(): string {
  const L = (k: string) => t(S.lang, k);
  const head = `<header><div class="logo">◉ Behavior Lab</div><nav>${LANGS.map((l) => `<button data-lang="${l}" class="${l === S.lang ? 'on' : ''}">${l.toUpperCase()}</button>`).join('')}</nav></header>`;
  if (S.step === 'intro')
    return `${head}<main class="card hero fade"><h1>Behavior Lab</h1><p class="sub">${L('sub')}</p>
      <ul>${L('priv').split('|').map((p) => `<li>${p}</li>`).join('')}</ul>
      <label class="check"><input type="checkbox" id="consent" ${S.consent ? 'checked' : ''}/> ${L('consent')}</label>
      <button class="cta" data-act="start" ${S.consent ? '' : 'disabled'}>${L('start')}</button></main>`;
  if (S.step === 'test')
    return `${head}<main class="grid fade"><section class="card"><h2>${L('s1')}</h2>
      ${EMO.map((e) => `<label class="row"><span>${L('e_' + e)}</span><input type="range" min="0" max="5" step="1" data-emo="${e}" value="${S.emo[e]}"/><output>${S.emo[e]}</output></label>`).join('')}
      <h2>${L('s2')}</h2><p class="quote">${L('sample')}</p>
      <textarea id="ta" rows="3">${esc(S.text)}</textarea>
      <button class="cta" id="fin" data-act="finish" ${S.text.length >= 20 ? '' : 'disabled'}>${L('finish')}</button></section>
      <aside class="card"><h2>${L('live')}</h2><canvas id="live"></canvas><p class="sub">${L('tip')}</p></aside></main>`;
  const s = stats!;
  const kpi = (v: string, k: string) => `<div class="kpi"><b>${v}</b><span>${L(k)}</span></div>`;
  return `${head}<main class="fade"><h1 class="r">${L('r_title')}</h1>
    <div class="kpis">${kpi(String(s.speed), 'k_speed')}${kpi(String(s.avgInt), 'k_int')}${kpi((s.backRatio * 100).toFixed(1) + '%', 'k_back')}${kpi(String(s.clicks), 'k_clicks')}</div>
    <div class="grid3"><section class="card"><h2>${L('c_heat')}</h2><canvas id="c1"></canvas></section>
    <section class="card"><h2>${L('c_rhythm')}</h2><canvas id="c2"></canvas></section>
    <section class="card"><h2>${L('c_radar')}</h2><canvas id="c3"></canvas></section></div>
    ${modelCard(s)}
    <p class="sub center">${L('note')}</p>
    <div class="actions"><button class="cta" data-act="dl">${L('dl')}</button><button class="ghost" data-act="again">${L('again')}</button></div></main>`;
}

function modelCard(s: Stats): string {
  const L = (k: string) => t(S.lang, k);
  const all = load();
  let body: string;
  if (all.length < MIN) body = `<p class="sub">${L('m_need').replace('{n}', String(all.length)).replace('{k}', String(MIN - all.length))}</p>`;
  else {
    const ev = evaluate(all, featsOf(s), S.saved);
    body = `<table><tr><th></th><th>${L('m_rep')}</th><th>${L('m_pred')}</th><th>${L('m_err')}</th><th></th></tr>${EMO.map((e, i) =>
      `<tr><td>${L('e_' + e)}</td><td>${S.emo[e]}</td><td>${ev[i].pred.toFixed(1)}</td><td>${ev[i].mae.toFixed(2)} / ${ev[i].base.toFixed(2)}</td><td class="${ev[i].mae < ev[i].base ? 'ok' : 'no'}">${L(ev[i].mae < ev[i].base ? 'm_win' : 'm_lose')}</td></tr>`).join('')}</table>`;
  }
  return `<section class="card model"><h2>${L('m_title')}</h2>${body}<p class="sub">${L('m_note')}</p>
    <button class="ghost" data-act="save" ${S.saved ? 'disabled' : ''}>${L(S.saved ? 'm_saved' : 'm_save')}</button>
    <button class="ghost" data-act="clear">${L('m_clear')}</button></section>`;
}

function render() {
  document.documentElement.lang = S.lang;
  document.documentElement.dir = S.lang === 'he' ? 'rtl' : 'ltr';
  app.innerHTML = view();
  if (S.step === 'result' && stats) requestAnimationFrame(() => {
    const g = (id: string) => document.getElementById(id) as HTMLCanvasElement;
    heat(g('c1'), tr!.pts);
    rhythm(g('c2'), stats!.intervals);
    radar(g('c3'), EMO.map((e) => S.emo[e]), EMO.map((e) => t(S.lang, 'e_' + e)));
  });
}

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest('[data-lang],[data-act]') as HTMLElement | null;
  if (!el) return;
  if (el.dataset.lang) { S.lang = el.dataset.lang as Lang; localStorage.setItem('bl-lang', S.lang); return render(); }
  const a = el.dataset.act;
  if (a === 'start') { tr = new Tracker(); tr.start(); S.step = 'test'; render(); }
  if (a === 'finish') { tr!.stop(); stats = tr!.stats(); S.step = 'result'; render(); }
  if (a === 'save') { save([...load(), { t: Date.now(), f: featsOf(stats!), e: EMO.map((k) => S.emo[k]) }]); S.saved = true; render(); }
  if (a === 'clear') { clear(); S.saved = false; render(); }
  if (a === 'again') { S.saved = false; tr = null; stats = null; S.text = ''; S.step = 'intro'; EMO.forEach((k) => (S.emo[k] = 0)); render(); }
  if (a === 'dl') {
    const data = { app: 'behavior-lab', date: new Date().toISOString(), emotions: S.emo, stats,
      mouse: tr!.pts.map(([x, y, ts]) => [+x.toFixed(3), +y.toFixed(3), Math.round(ts)]) };
    const a2 = document.createElement('a');
    a2.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a2.download = 'behavior-lab.json'; a2.click(); URL.revokeObjectURL(a2.href);
  }
});
app.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.id === 'consent') { S.consent = el.checked; (app.querySelector('[data-act=start]') as HTMLButtonElement).disabled = !el.checked; }
  if (el.dataset.emo) { S.emo[el.dataset.emo] = +el.value; (el.nextElementSibling as HTMLElement).textContent = el.value; }
  if (el.id === 'ta') { S.text = el.value; (document.getElementById('fin') as HTMLButtonElement).disabled = el.value.length < 20; }
});
setInterval(() => {
  const c = document.getElementById('live') as HTMLCanvasElement | null;
  if (c && tr) heat(c, tr.pts);
}, 150);
render();
