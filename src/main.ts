import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/800";
import "@fontsource/figtree/400";
import "@fontsource/figtree/500";
import "@fontsource/figtree/600";
import "@fontsource/figtree/700";
import "./style.css";
import { PLAN, WEEK, SESSION_DAY, LIFT_NAMES, findExercise, type Exercise, type Session } from "./plan";
import { barChart, lineChart, wireCharts } from "./charts";
import { loadAll, put, remove, replaceAll, askPersist, loadGames, putGame, removeGame, replaceGames, type DayLog, type SetLog, type Game } from "./store";

/* ---------------- appearance ---------------- */
type Theme = "system" | "light" | "dark";
function getTheme(): Theme { try { return (localStorage.getItem("gymplan-theme") as Theme) || "system"; } catch { return "system"; } }
function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
  const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(m => { m.content = dark ? "#0B1526" : "#F5F6F8"; m.removeAttribute("media"); });
}
applyTheme(getTheme());
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme(getTheme()));

/* ---------------- state ---------------- */
let days: Record<string, DayLog> = {};
let view: "train" | "progress" | "games" | "backup" = "train";
let games: Game[] = [];
let gameForm: Game | null = null;   // open form (new or editing)
let confirmGameDelete = false;
let teamFilter: "all" | "1st" | "2nd" = "all";
let pickedSession: number | null = null;
let confirmClear = false;
let pendingRender = false;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => keyOf(new Date());
const dowMon = (d: Date) => (d.getDay() + 6) % 7;
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const kg = (v: number) => String(Math.round(v * 10) / 10);
const restTxt = (s: number) => (s >= 60 ? (s % 60 ? `${Math.floor(s / 60)}:${pad(s % 60)}` : `${s / 60} min`) : `${s}s`);
const repsTxt = (e: Exercise) => e.repsTxt ?? (e.fail ? "to failure" : e.lo === e.hi ? `${e.lo} reps` : `${e.lo} to ${e.hi} reps`);
const unit = (e: Exercise) => (e.kind === "bw" ? "+kg" : e.kind === "db" ? "kg ea" : "kg");

const sortedDates = () => Object.keys(days).sort().reverse();
const setsDone = (d?: DayLog) => (d ? Object.values(d.ex).reduce((n, a) => n + a.filter(s => s.done).length, 0) : 0);
const plan = (n: number): Session => PLAN[n - 1];

function nextSession(): number {
  const tk = todayKey();
  for (const d of sortedDates()) {
    if (d === tk) continue;
    if (setsDone(days[d]) > 0) return (days[d].session % 4) + 1;
  }
  return 1;
}
function activeSession(): number {
  const t = days[todayKey()];
  if (t) return t.session;
  if (pickedSession) return pickedSession;
  const suggested = WEEK[dowMon(new Date())].s;
  return suggested || nextSession();
}
function today(): DayLog {
  const tk = todayKey();
  if (!days[tk]) days[tk] = { date: tk, session: activeSession(), ex: {}, extra: { done: false, note: "" }, updated: Date.now() };
  return days[tk];
}
function setRow(d: DayLog, e: Exercise, i: number): SetLog {
  const arr = d.ex[e.id] || (d.ex[e.id] = []);
  while (arr.length <= i) arr.push({ kg: null, reps: null, done: false });
  return arr[i];
}

/* ---------------- saving ---------------- */
const saveTimers: Record<string, number> = {};
function save(date: string, now = false) {
  clearTimeout(saveTimers[date]);
  const run = () => (days[date] ? put(days[date]) : remove(date)).catch(() => toast("Couldn't save. Try again."));
  if (now) run(); else saveTimers[date] = window.setTimeout(run, 400);
}

/* ---------------- suggestions ---------------- */
interface Hint { text: string; kg: number | null; up: boolean; last: SetLog[] | null }

function lastSets(key: string): SetLog[] | null {
  const tk = todayKey();
  for (const d of sortedDates()) {
    if (d === tk) continue;
    const day = days[d];
    for (const e of plan(day.session).ex) {
      if (e.key !== key) continue;
      const sets = (day.ex[e.id] || []).filter(s => s.done && (s.reps ?? 0) > 0);
      if (sets.length) return sets;
    }
  }
  return null;
}

function suggest(e: Exercise): Hint {
  const last = lastSets(e.key);
  if (!last) {
    return e.kind === "bw"
      ? { text: `${repsTxt(e)} at bodyweight`, kg: null, up: false, last }
      : { text: "Pick a weight with 2 reps in the tank", kg: null, up: false, last };
  }
  const top = Math.max(0, ...last.map(s => s.kg ?? 0));
  const atTop = last.filter(s => (s.kg ?? 0) === top);
  if (e.fail) {
    const total = atTop.reduce((a, s) => a + (s.reps ?? 0), 0);
    return { text: `Beat ${total} total reps`, kg: top || null, up: false, last };
  }
  const hi = e.hi!, lo = e.lo!;
  const allTop = atTop.length >= Math.min(2, e.sets) && atTop.every(s => (s.reps ?? 0) >= hi);
  if (e.kind === "bw" && !top) {
    return allTop
      ? { text: e.inc ? "Add a little weight" : "Slow the reps down", kg: null, up: true, last }
      : { text: `Aim for ${hi} each set`, kg: null, up: false, last };
  }
  if (allTop && e.inc) return { text: `Up to ${kg(top + e.inc)}kg`, kg: top + e.inc, up: true, last };
  if (atTop.some(s => (s.reps ?? 0) < lo)) return { text: `Stay at ${kg(top)}kg`, kg: top, up: false, last };
  return { text: `${kg(top)}kg, add a rep`, kg: top, up: false, last };
}

/* ---------------- render ---------------- */
const TICK = `<svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`;

function renderHeader() {
  const now = new Date();
  $("date").textContent = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
  const t = dowMon(now);
  $("week").innerHTML = WEEK.map((w, i) => `<div class="day ${w.c} ${i === t ? "today" : ""}"><b>${w.d}</b><span>${w.t}</span></div>`).join("");
}

function renderTrain() {
  const n = activeSession(), s = plan(n), nx = nextSession(), day = days[todayKey()];
  const kind = WEEK[dowMon(new Date())].c;
  const banner =
    kind === "rugby" ? `<div class="banner"><b>Rugby tonight.</b> Not a gym day, but you can still log here.</div>` :
    kind === "game" ? `<div class="banner banner-row"><span><b>Game day.</b> Nothing to lift.</span><button class="mini" id="log-game">Log the game</button></div>` :
    kind === "rest" ? `<div class="banner"><b>Sunday.</b> Session 4 if you've got the legs, otherwise rest.</div>` : "";

  const chips = PLAN.map(p => `<button class="chip ${p.n === nx && p.n !== n ? "is-next" : ""}" data-pick="${p.n}" aria-pressed="${p.n === n}" aria-label="Session ${p.n}, ${SESSION_DAY[p.n]}${p.n === nx ? ", up next in the rotation" : ""}">
      <b>S${p.n}</b><small>${SESSION_DAY[p.n]}</small></button>`).join("");

  const groups: { ss?: string; items: Exercise[] }[] = [];
  s.ex.forEach(e => {
    const g = groups[groups.length - 1];
    if (e.ss && g && g.ss === e.ss) g.items.push(e); else groups.push({ ss: e.ss, items: [e] });
  });
  const cards = groups.map(g => g.items.length > 1
    ? `<section class="card ss"><div class="ss-tag">Superset · rest ${restTxt(g.items[0].rest)} after both</div>${g.items.map(e => exHTML(e, day)).join("")}</section>`
    : `<section class="card">${exHTML(g.items[0], day)}</section>`).join("");

  const x = day?.extra ?? { done: false, note: "" };
  const extra = `<section class="card"><div class="extra ${x.done ? "done" : ""}" id="extra">
      <span class="lbl">Extras</span><h2>${esc(s.extra.title)}</h2><p>${esc(s.extra.detail)}</p>
      <div class="extra-row"><input id="extra-note" type="text" enterkeyhint="done" placeholder="${esc(s.extra.placeholder)}" value="${esc(x.note)}" aria-label="${esc(s.extra.title)} result">
      <button class="tick" id="extra-tick" aria-label="Mark extras done">${TICK}</button></div></div></section>`;

  const count = setsDone(day);
  const foot = count ? `<div class="foot"><span class="num">${count} sets logged today</span>${confirmClear
      ? `<span class="confirm">Clear today? <button class="danger" id="clear-yes">Clear</button><button id="clear-no">Keep</button></span>`
      : `<button class="link" id="clear">Clear today</button>`}</div>` : "";

  $("train").innerHTML = `${banner}
    <div class="picker">${chips}</div>
    <div class="title"><h1>${esc(s.title)}</h1><p>${esc(s.focus)} · ${s.ex.length} lifts plus extras</p></div>
    ${cards}${extra}${foot}`;
}

// Today's weight carries down to the next set, so you only type it once.
function carryKg(sets: SetLog[], i: number): number | null {
  for (let j = i - 1; j >= 0; j--) if (sets[j]?.kg != null) return sets[j].kg;
  return null;
}

function exHTML(e: Exercise, day?: DayLog): string {
  const h = suggest(e);
  const logged = day?.ex[e.id] ?? [];
  const n = Math.max(e.sets, logged.length);
  const lastTxt = h.last ? `Last ${h.last.map(s => (s.kg ? kg(s.kg) + "×" : "") + s.reps).join("  ")}` : "First time";
  const rows = Array.from({ length: n }, (_, i) => {
    const s = logged[i] ?? { kg: null, reps: null, done: false };
    const carry = carryKg(logged, i);
    const kgPh = carry != null ? kg(carry) : h.kg != null ? kg(h.kg) : e.kind === "bw" ? "0" : "";
    return `<div class="set ${s.done ? "done" : ""}" data-ex="${e.id}" data-i="${i}">
      <span class="n">${i + 1}</span>
      <label class="field"><input id="${e.id}-${i}-kg" type="number" inputmode="decimal" step="0.5" placeholder="${kgPh}" value="${s.kg ?? ""}" data-f="kg" aria-label="${esc(e.name)} set ${i + 1} weight"><em>${unit(e)}</em></label>
      <label class="field"><input id="${e.id}-${i}-reps" type="number" inputmode="numeric" placeholder="${e.fail ? "" : e.hi}" value="${s.reps ?? ""}" data-f="reps" aria-label="${esc(e.name)} set ${i + 1} reps"><em>reps</em></label>
      <button class="tick" data-tick aria-label="Log set ${i + 1}">${TICK}</button></div>`;
  }).join("");
  return `<div class="ex">
    <div class="ex-top"><div><h2>${esc(e.name)}</h2><div class="rx">${esc(e.setsTxt ?? e.sets + " sets")} · ${esc(repsTxt(e))} · rest ${restTxt(e.rest)}</div></div>
      <button class="cue-btn" data-cue="${e.id}" aria-expanded="false">Cues</button></div>
    <p class="cue" id="cue-${e.id}" hidden>${esc(e.cue)}</p>
    <div class="hint"><span class="last num">${esc(lastTxt)}</span><span class="go ${h.up ? "up" : ""}">${esc(h.text)}</span></div>
    <div class="sets">${rows}</div>
    <div class="set-actions"><button class="add" data-add="${e.id}">+ Add a set</button>${n > e.sets ? `<button class="add remove" data-remove="${e.id}">Remove set ${n}</button>` : ""}</div></div>`;
}

let openLift: string | null = null;

function weekStart(d: Date): Date { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - dowMon(x)); return x; }
const shortDate = (k: string) => new Date(k + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function renderProgress() {
  const dates = sortedDates().filter(d => setsDone(days[d]) > 0);
  const cut = new Date(); cut.setDate(cut.getDate() - 27);
  const recent = dates.filter(d => d >= keyOf(cut));
  const dayVol = (d: string) => Object.values(days[d].ex).reduce((a, arr) => a + arr.reduce((b, st) => b + (st.done ? (st.kg ?? 0) * (st.reps ?? 0) : 0), 0), 0);
  const vol = recent.reduce((a, d) => a + dayVol(d), 0);

  // last 8 training weeks, Monday to Sunday
  const thisWeek = weekStart(new Date());
  const weeks = Array.from({ length: 8 }, (_, i) => { const w = new Date(thisWeek); w.setDate(w.getDate() - 7 * (7 - i)); return w; });
  const wk = weeks.map(w => {
    const from = keyOf(w), toD = new Date(w); toD.setDate(toD.getDate() + 6); const to = keyOf(toD);
    const inWeek = dates.filter(d => d >= from && d <= to);
    return { from, n: inWeek.length, vol: inWeek.reduce((a, d) => a + dayVol(d), 0) };
  });
  const sessionsChart = barChart("c-sessions", wk.map((w, i) => ({
    value: w.n, label: shortDate(w.from).replace(" ", " "), hot: i === 7,
    tip: `Week of ${shortDate(w.from)}: ${w.n} session${w.n === 1 ? "" : "s"}`,
  })), { ref: { value: 3, label: "Target 3" }, min: 3, int: true, readout: `This week: ${wk[7].n} of 3 sessions` });
  const volChart = barChart("c-volume", wk.map((w, i) => ({
    value: w.vol, label: shortDate(w.from).replace(" ", " "), hot: i === 7,
    tip: `Week of ${shortDate(w.from)}: ${Math.round(w.vol).toLocaleString("en-GB")}kg lifted`,
  })), { readout: `This week: ${Math.round(wk[7].vol).toLocaleString("en-GB")}kg lifted` });

  // per lift history, oldest first
  type LP = { d: string; top: number; reps: number };
  const lifts: Record<string, { pts: LP[]; best: { kg: number; reps: number; e1: number } | null }> = {};
  dates.slice().reverse().forEach(d => {
    const day = days[d];
    plan(day.session).ex.forEach(e => {
      const sets = (day.ex[e.id] || []).filter(st => st.done && (st.reps ?? 0) > 0);
      if (!sets.length) return;
      const L = lifts[e.key] || (lifts[e.key] = { pts: [], best: null });
      const top = Math.max(0, ...sets.map(st => st.kg ?? 0));
      const reps = Math.max(...sets.filter(st => (st.kg ?? 0) === top).map(st => st.reps ?? 0));
      L.pts.push({ d, top, reps });
      sets.forEach(st => {
        const e1 = (st.kg ?? 0) * (1 + (st.reps ?? 0) / 30);
        if (!L.best || e1 > L.best.e1 || (!e1 && !L.best.e1 && (st.reps ?? 0) > L.best.reps)) L.best = { kg: st.kg ?? 0, reps: st.reps ?? 0, e1 };
      });
    });
  });

  const liftRows = Object.entries(lifts).sort((a, b) => LIFT_NAMES[a[0]].localeCompare(LIFT_NAMES[b[0]])).map(([k, L]) => {
    const b = L.best!, weighted = b.e1 > 0, n = L.pts.length, open = openLift === k;
    const vs = L.pts.map(p => (weighted ? p.top : p.reps));
    const first = L.pts[0], last = L.pts[n - 1];
    const change = weighted && n > 1 ? last.top - first.top : 0;
    const detail = open ? `<div class="lift-detail">${lineChart("c-lift-" + k, L.pts.map(p => ({
        x: new Date(p.d + "T12:00:00").getTime(), y: weighted ? p.top : p.reps, label: shortDate(p.d),
        tip: weighted ? `${shortDate(p.d)}: ${kg(p.top)}kg × ${p.reps}` : `${shortDate(p.d)}: ${p.reps} reps`,
      })), { readout: weighted ? `Top set each session${n > 1 ? `, ${change >= 0 ? "up" : "down"} ${kg(Math.abs(change))}kg since ${shortDate(first.d)}` : ""}` : "Best reps each session" })}</div>` : "";
    return `<div class="lift-wrap ${open ? "open" : ""}"><button class="lift" data-lift="${k}" aria-expanded="${open}"><h3>${esc(LIFT_NAMES[k])}</h3>
      <span class="pr num">${weighted ? `Best ${kg(b.kg)}kg × ${b.reps}` : `Best ${b.reps} reps`}</span>
      <span class="meta">${weighted ? `Est. max ${Math.round(b.e1)}kg · ` : ""}${n} session${n > 1 ? "s" : ""}</span>
      ${spark(vs, weighted ? "kg" : "")}</button>${detail}</div>`;
  }).join("");

  const hist = dates.slice(0, 12).map(d => {
    const day = days[d];
    const label = new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    return `<div class="hist"><b>${label}</b><span class="num">Session ${day.session} · ${setsDone(day)} set${setsDone(day) === 1 ? "" : "s"}${day.extra.done ? " · extras" : ""}</span></div>`;
  }).join("");

  $("progress").innerHTML = `
    <div class="title"><h1>Progress</h1></div>
    <div class="stats">
      <div class="stat"><span>Last 4 weeks</span><b class="num">${recent.length}<small>/12</small></b></div>
      <div class="stat"><span>Volume</span><b class="num">${vol >= 1000 ? (vol / 1000).toFixed(1) + "t" : Math.round(vol) + "kg"}</b></div>
      <div class="stat"><span>All time</span><b class="num">${dates.length}</b></div>
    </div>
    <h2 class="sec">Sessions per week</h2>
    <section class="card pad">${sessionsChart}</section>
    <h2 class="sec">Weight lifted per week</h2>
    <section class="card pad">${volChart}</section>
    <h2 class="sec">Lifts <span class="sec-hint">tap for the full chart</span></h2>
    <section class="card">${liftRows || `<div class="empty">Log a session and every lift gets a best set and a trend line here.</div>`}</section>
    <h2 class="sec">Recent sessions</h2>
    <section class="card">${hist || `<div class="empty">No sessions yet.</div>`}</section>`;
}

function spark(vs: number[], u: string): string {
  const W = 120, H = 50, P = 4, base = H - 12;
  if (vs.length < 2) {
    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><line x1="${P}" y1="${base / 2 + 4}" x2="${W - P}" y2="${base / 2 + 4}" stroke="var(--line)" stroke-dasharray="3 4"/><circle cx="${W - P}" cy="${base / 2 + 4}" r="4" fill="var(--gold)"/></svg>`;
  }
  const lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const X = (i: number) => P + (i * (W - 2 * P)) / (vs.length - 1);
  const Y = (v: number) => base - ((v - lo) / span) * (base - P - 4);
  const pts = vs.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Top set from ${kg(vs[0])} to ${kg(vs[vs.length - 1])}${u}">
    <path d="M${X(0)},${base} L${pts.join(" L")} L${X(vs.length - 1)},${base} Z" fill="var(--gold)" fill-opacity=".16"/>
    <polyline points="${pts.join(" ")}" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${X(vs.length - 1)}" cy="${Y(vs[vs.length - 1])}" r="4" fill="var(--gold)"/>
    <text x="${P}" y="${H - 1}" font-size="10" fill="var(--muted)">${kg(vs[0])}</text>
    <text x="${W - P}" y="${H - 1}" font-size="10" fill="var(--muted)" text-anchor="end">${kg(vs[vs.length - 1])}${u}</text></svg>`;
}

function renderBackup() {
  const n = sortedDates().filter(d => setsDone(days[d]) > 0).length;
  $("backup").innerHTML = `
    <div class="title"><h1>Backup</h1><p>Your log lives only on this phone. Save a copy every couple of weeks.</p></div>
    <div class="panel"><h2>Save a backup</h2><p>${n} session${n === 1 ? "" : "s"} and ${games.length} game${games.length === 1 ? "" : "s"} logged. Save the file to iCloud Drive or Files.</p>
      <button class="btn" id="export">Save backup file</button></div>
    <div class="panel"><h2>Restore</h2><p>Replaces everything on this phone with the backup you pick.</p>
      <label class="btn alt btn-file">Choose backup file<input type="file" id="import" accept="application/json,.json"></label></div>
    <div class="panel"><h2>Appearance</h2><p>Auto follows your phone's light and dark setting.</p>
      <div class="seg theme" role="group" aria-label="Appearance">
        ${(["system", "light", "dark"] as const).map(t => `<button type="button" data-theme-pick="${t}" aria-pressed="${getTheme() === t}">${t === "system" ? "Auto" : t[0].toUpperCase() + t.slice(1)}</button>`).join("")}
      </div></div>
    <div class="panel"><h2>About</h2><p>gymplan runs the HHF 12 Week Turnover Start Up sessions across Monday, Wednesday and Friday. Works offline.</p></div>`;
}

function render() {
  renderHeader();
  $("train").hidden = view !== "train";
  $("progress").hidden = view !== "progress";
  $("backup").hidden = view !== "backup";
  $("games").hidden = view !== "games";
  document.querySelectorAll<HTMLButtonElement>(".tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.view === view)));
  if (view === "train") renderTrain(); else if (view === "progress") renderProgress(); else if (view === "games") renderGames(); else renderBackup();
}
function requestRender() {
  const a = document.activeElement;
  if (a && a.tagName === "INPUT") { pendingRender = true; return; }
  render();
}
document.addEventListener("focusout", () => setTimeout(() => {
  if (pendingRender && document.activeElement?.tagName !== "INPUT") { pendingRender = false; render(); }
}, 60));

/* ---------------- train interactions ---------------- */
const train = $("train");

train.addEventListener("input", ev => {
  const t = ev.target as HTMLInputElement;
  const d = today();
  if (t.id === "extra-note") { d.extra.note = t.value; save(d.date); return; }
  const row = t.closest<HTMLElement>(".set"); if (!row) return;
  const e = findExercise(row.dataset.ex!)!, s = setRow(d, e, +row.dataset.i!);
  const v = t.value === "" ? null : parseFloat(t.value);
  (s as any)[t.dataset.f!] = v != null && isFinite(v) ? v : null;
  save(d.date);
});

train.addEventListener("click", ev => {
  const el = ev.target as HTMLElement;
  const pick = el.closest<HTMLElement>("[data-pick]");
  if (pick) {
    const n = +pick.dataset.pick!, d = days[todayKey()];
    if (d) { d.session = n; save(d.date, true); } else pickedSession = n;
    confirmClear = false; render(); window.scrollTo({ top: 0 }); return;
  }
  const cue = el.closest<HTMLElement>("[data-cue]");
  if (cue) { const p = $("cue-" + cue.dataset.cue); p.hidden = !p.hidden; cue.setAttribute("aria-expanded", String(!p.hidden)); return; }
  const rm = el.closest<HTMLElement>("[data-remove]");
  if (rm) {
    const e = findExercise(rm.dataset.remove!)!, d = today(), arr = d.ex[e.id] || [];
    if (arr.length > e.sets) { arr.pop(); save(d.date, true); render(); }
    return;
  }
  const add = el.closest<HTMLElement>("[data-add]");
  if (add) { const e = findExercise(add.dataset.add!)!, d = today(); setRow(d, e, Math.max(e.sets, (d.ex[e.id] || []).length)); save(d.date); render(); return; }
  if (el.closest("#extra-tick")) {
    const d = today(); d.extra.done = !d.extra.done; $("extra").classList.toggle("done", d.extra.done);
    if (d.extra.done) buzz(); save(d.date, true); return;
  }
  if (el.closest("#log-game")) { view = "games"; gameForm = newGame(); render(); window.scrollTo({ top: 0 }); return; }
  if (el.closest("#clear")) { confirmClear = true; render(); return; }
  if (el.closest("#clear-no")) { confirmClear = false; render(); return; }
  if (el.closest("#clear-yes")) { const k = todayKey(); delete days[k]; confirmClear = false; save(k, true); render(); toast("Today cleared"); return; }

  const tick = el.closest<HTMLElement>("[data-tick]");
  if (tick) {
    unlockAudio();
    const row = tick.closest<HTMLElement>(".set")!, e = findExercise(row.dataset.ex!)!, i = +row.dataset.i!;
    const d = today(), s = setRow(d, e, i);
    if (!s.done) {
      const h = suggest(e);
      const carry = carryKg(d.ex[e.id] || [], i);
      if (s.kg == null) s.kg = carry ?? h.kg;
      if (s.reps == null && !e.fail) s.reps = e.hi;
      if (s.reps == null) { toast("Enter your reps first"); row.querySelector<HTMLInputElement>('[data-f="reps"]')!.focus(); return; }
      s.done = true;
      row.classList.add("done");
      row.querySelector<HTMLInputElement>('[data-f="kg"]')!.value = s.kg != null ? String(s.kg) : "";
      row.querySelector<HTMLInputElement>('[data-f="reps"]')!.value = String(s.reps);
      // show this weight as the starting point for the sets below
      document.querySelectorAll<HTMLInputElement>(`.set[data-ex="${e.id}"] [data-f="kg"]`).forEach((inp, j) => {
        if (j > i && s.kg != null) inp.placeholder = kg(s.kg);
      });
      buzz();
      afterSet(e, i);
    } else { s.done = false; row.classList.remove("done"); }
    save(d.date, true);
  }
});

function afterSet(e: Exercise, i: number) {
  const s = plan(activeSession()), idx = s.ex.findIndex(x => x.id === e.id), partner = s.ex[idx + 1];
  if (e.ss && partner && partner.ss === e.ss) { toast(`Straight into ${partner.name}`); return; }
  const total = Math.max(e.sets, (today().ex[e.id] || []).length);
  let next: string;
  if (i + 1 < total) {
    const first = e.ss ? s.ex.find(x => x.ss === e.ss)! : e;
    next = `Set ${i + 2}, ${first.name}`;
  } else next = partner ? `Next: ${partner.name}` : `Extras: ${s.extra.title}`;
  startRest(e.rest, next);
}

/* ---------------- rest timer ---------------- */
const T = { end: 0, total: 0, iv: 0, fired: false };
function startRest(sec: number, label: string) {
  T.total = sec; T.end = Date.now() + sec * 1000; T.fired = false;
  $("t-next").textContent = label; $("t-sub").textContent = `Rest ${restTxt(sec)}`;
  $("timer").classList.add("on"); $("timer").classList.remove("over");
  clearInterval(T.iv); T.iv = window.setInterval(tickTimer, 250); tickTimer(); wake();
}
function tickTimer() {
  const ms = T.end - Date.now(), left = Math.round(ms / 1000), a = Math.abs(left);
  $("t-clock").textContent = `${left < 0 ? "+" : ""}${Math.floor(a / 60)}:${pad(a % 60)}`;
  $("t-prog").style.width = `${Math.min(100, Math.max(0, (1 - ms / (T.total * 1000)) * 100))}%`;
  if (left <= 0 && !T.fired) {
    T.fired = true; $("timer").classList.add("over"); $("t-sub").textContent = "Go"; beep(); buzz([200, 100, 200]);
  }
}
$("t-plus").onclick = () => { T.end += 15000; T.total += 15; T.fired = false; $("timer").classList.remove("over"); tickTimer(); };
$("t-done").onclick = () => { clearInterval(T.iv); $("timer").classList.remove("on", "over"); };
document.addEventListener("visibilitychange", () => { if (!document.hidden && $("timer").classList.contains("on")) { tickTimer(); wake(); } });

let actx: AudioContext | null = null;
function unlockAudio() {
  try {
    if (!actx) { const A = window.AudioContext || (window as any).webkitAudioContext; if (A) actx = new A(); }
    if (actx && actx.state === "suspended") actx.resume();
  } catch { /* no audio */ }
}
function beep() {
  if (!actx) return;
  try {
    [0, 0.22, 0.44].forEach((t, k) => {
      const o = actx!.createOscillator(), g = actx!.createGain(), at = actx!.currentTime + t;
      o.frequency.value = k === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
      o.connect(g).connect(actx!.destination); o.start(at); o.stop(at + 0.2);
    });
  } catch { /* no audio */ }
}
function buzz(p: number | number[] = 15) { try { navigator.vibrate?.(p); } catch { /* iOS ignores */ } }

let lock: WakeLockSentinel | null = null;
async function wake() {
  try { if (!lock && "wakeLock" in navigator) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } }
  catch { /* not granted */ }
}

let tt = 0;
function toast(msg: string) {
  const el = $("toast"); el.textContent = msg; el.classList.add("on");
  clearTimeout(tt); tt = window.setTimeout(() => el.classList.remove("on"), 1800);
}

/* ---------------- backup ---------------- */
$("backup").addEventListener("click", ev => {
  const tp = (ev.target as HTMLElement).closest<HTMLElement>("[data-theme-pick]");
  if (tp) {
    const t = tp.dataset.themePick as Theme;
    try { localStorage.setItem("gymplan-theme", t); } catch { /* private mode */ }
    applyTheme(t); renderBackup(); return;
  }
  if (!(ev.target as HTMLElement).closest("#export")) return;
  const data = { app: "gymplan", version: 1, exported: new Date().toISOString(), days: Object.values(days).filter(d => setsDone(d) > 0 || d.extra.note), games };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const name = `gymplan-backup-${todayKey()}.json`;
  const file = new File([blob], name, { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file], title: name }).catch(() => { /* cancelled */ });
  } else {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
});
$("backup").addEventListener("change", async ev => {
  const input = ev.target as HTMLInputElement;
  if (input.id !== "import" || !input.files?.[0]) return;
  try {
    const parsed = JSON.parse(await input.files[0].text());
    if (parsed.app !== "gymplan" || !Array.isArray(parsed.days)) throw new Error("bad");
    const list: DayLog[] = parsed.days.filter((d: DayLog) => d && d.date && d.session >= 1 && d.session <= 4);
    await replaceAll(list);
    days = {}; list.forEach(d => { days[d.date] = d; });
    const g: Game[] = Array.isArray(parsed.games) ? parsed.games.filter((x: Game) => x && x.id && x.date) : [];
    await replaceGames(g); games = g;
    toast(`Restored ${list.length} sessions and ${g.length} games`); render();
  } catch { toast("That file isn't a gymplan backup"); }
  input.value = "";
});

$("progress").addEventListener("click", ev => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>("[data-lift]");
  if (!b) return;
  openLift = openLift === b.dataset.lift ? null : b.dataset.lift!;
  renderProgress();
});
wireCharts($("progress"));
wireCharts($("games"));

/* ---------------- games ---------------- */
function lastSaturday(): string {
  const d = new Date(); const back = (dowMon(d) - 5 + 7) % 7; d.setDate(d.getDate() - back); return keyOf(d);
}
function newGame(): Game {
  const lastTeam = sortedGames()[0]?.team ?? "1st";
  return { id: "g" + Date.now().toString(36), date: lastSaturday(), opponent: "", venue: "home", team: lastTeam, us: null, them: null, mins: null, tries: 0, points: 0, updated: 0 };
}
function result(g: Game): "W" | "L" | "D" | "" {
  if (g.us == null || g.them == null) return "";
  return g.us > g.them ? "W" : g.us < g.them ? "L" : "D";
}
const sortedGames = () => games.slice().sort((a, b) => b.date.localeCompare(a.date) || b.updated - a.updated);

const teamOf = (g: Game) => g.team ?? "1st";
const teamLabel = (t: string) => (t === "2nd" ? "2nd XV" : "1st XV");

function renderGames() {
  const all = games;
  const hasBoth = all.some(g => teamOf(g) === "1st") && all.some(g => teamOf(g) === "2nd");
  if (!hasBoth) teamFilter = "all";
  const games_ = teamFilter === "all" ? all : all.filter(g => teamOf(g) === teamFilter);
  const filterBar = hasBoth ? `<div class="seg filter" role="group" aria-label="Show games for">
      ${(["all", "1st", "2nd"] as const).map(t => `<button type="button" data-team-filter="${t}" aria-pressed="${teamFilter === t}">${t === "all" ? "Both" : teamLabel(t)}${t === "all" ? "" : ` <small>${all.filter(g => teamOf(g) === t).length}</small>`}</button>`).join("")}
    </div>` : "";
  return renderGamesFor(games_, filterBar);
}

function renderGamesFor(games: Game[], filterBar: string) {
  const played = games.length;
  const w = games.filter(g => result(g) === "W").length, l = games.filter(g => result(g) === "L").length, d = games.filter(g => result(g) === "D").length;
  const tries = games.reduce((a, g) => a + (g.tries || 0), 0);
  const pts = games.reduce((a, g) => a + (g.points || 0), 0);
  const withMins = games.filter(g => g.mins != null);
  const mins = withMins.reduce((a, g) => a + (g.mins || 0), 0);

  const form = gameForm ? gameFormHTML(gameForm) : `<button class="btn" id="game-new">Log a game</button>`;

  const sorted = games.slice().sort((a, b) => b.date.localeCompare(a.date) || b.updated - a.updated);
  const recentGames = sorted.slice(0, 10).reverse();
  const abbr = (o: string) => (o || "?").replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 3).toUpperCase() || "?";
  const lab = (g: Game) => (g.opponent.trim().includes(" ") ? abbr(g.opponent) : g.opponent.slice(0, 4));
  const vsTxt = (g: Game) => `${teamLabel(teamOf(g))} ${g.venue === "away" ? "at" : "v"} ${g.opponent}`;
  const charts = recentGames.length ? `
    <h2 class="sec">Your points per game</h2>
    <section class="card pad">${barChart("c-points", recentGames.map(g => ({
      value: g.points || 0, label: lab(g), sub: result(g) || "?", hot: (g.tries || 0) > 0,
      tip: `${shortDate(g.date)} ${vsTxt(g)}: ${g.points || 0} pts${g.tries ? `, ${g.tries} ${g.tries === 1 ? "try" : "tries"}` : ""}`,
    })), { min: 5, readout: "Gold bars are games you scored a try" })}</section>
    <h2 class="sec">Minutes played</h2>
    <section class="card pad">${barChart("c-mins", recentGames.map(g => ({
      value: g.mins ?? 0, label: lab(g), sub: result(g) || "?",
      tip: `${shortDate(g.date)} ${vsTxt(g)}: ${g.mins ?? "no"} mins, ${g.us ?? "?"}-${g.them ?? "?"}`,
    })), { ref: { value: 80, label: "Full 80" }, readout: `Last ${recentGames.length} game${recentGames.length === 1 ? "" : "s"}, tap a bar for details` })}</section>` : "";

  const list = sorted.map(g => {
    const r = result(g);
    const label = new Date(g.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const mine = [g.mins != null ? `${g.mins} mins` : "", g.tries ? `${g.tries} ${g.tries === 1 ? "try" : "tries"}` : "", g.points ? `${g.points} pts` : ""].filter(Boolean).join(" · ") || "No personal stats";
    return `<button class="gamerow" data-game="${g.id}">
      <span class="res ${r.toLowerCase()}">${r || "?"}</span>
      <span class="g-main"><b>${g.venue === "away" ? "at " : "v "}${esc(g.opponent || "Opponent")}</b><small>${label} · <span class="xv">${teamLabel(teamOf(g))}</span> · ${esc(mine)}</small></span>
      <span class="score num">${g.us ?? "?"}<i>-</i>${g.them ?? "?"}</span></button>`;
  }).join("");

  $("games").innerHTML = `
    <div class="title"><h1>Games</h1><p>Match days, minutes and points.</p></div>
    ${filterBar}
    <div class="stats">
      <div class="stat"><span>Record</span><b class="num">${w}-${d}-${l}</b><em>W · D · L</em></div>
      <div class="stat"><span>Your points</span><b class="num">${pts}</b><em>${tries} ${tries === 1 ? "try" : "tries"}</em></div>
      <div class="stat"><span>Minutes</span><b class="num">${mins}</b><em>${withMins.length ? Math.round(mins / withMins.length) + " avg" : "per game"}</em></div>
    </div>
    ${form}
    ${charts}
    <h2 class="sec">${teamFilter === "all" ? "Season" : teamLabel(teamFilter)}${played ? ` · ${played} played` : ""}</h2>
    <section class="card">${list || `<div class="empty">No games yet. Log your first one after Saturday.</div>`}</section>`;
}

function gameFormHTML(g: Game): string {
  const editing = games.some(x => x.id === g.id);
  const opps = Array.from(new Set(games.map(x => x.opponent).filter(Boolean))).sort();
  return `<form class="panel gform" id="game-form" autocomplete="off">
    <h2>${editing ? "Edit game" : "Log a game"}</h2>
    <div class="grid2">
      <label class="lab">Date<input type="date" id="g-date" value="${g.date}" required></label>
      <div class="lab">Venue<div class="seg" role="group">
        <button type="button" data-venue="home" aria-pressed="${g.venue === "home"}">Home</button>
        <button type="button" data-venue="away" aria-pressed="${g.venue === "away"}">Away</button></div></div>
    </div>
    <div class="lab">Team<div class="seg" role="group">
      <button type="button" data-team="1st" aria-pressed="${teamOf(g) === "1st"}">1st XV</button>
      <button type="button" data-team="2nd" aria-pressed="${teamOf(g) === "2nd"}">2nd XV</button></div></div>
    <label class="lab">Opponent<input type="text" id="g-opp" list="opp-list" value="${esc(g.opponent)}" placeholder="e.g. Tabard" enterkeyhint="next" required></label>
    <datalist id="opp-list">${opps.map(o => `<option value="${esc(o)}">`).join("")}</datalist>
    <div class="lab">Score<div class="scoreline">
      <label class="field"><input type="number" inputmode="numeric" id="g-us" value="${g.us ?? ""}" placeholder="0" aria-label="Our score"><em>Us</em></label>
      <span class="vs">v</span>
      <label class="field"><input type="number" inputmode="numeric" id="g-them" value="${g.them ?? ""}" placeholder="0" aria-label="Their score"><em>Them</em></label>
    </div></div>
    <div class="grid3">
      <label class="lab">Mins played<span class="field"><input type="number" inputmode="numeric" id="g-mins" value="${g.mins ?? ""}" placeholder="80"><em>min</em></span></label>
      <div class="lab">Tries<div class="stepper">
        <button type="button" data-step="-1" aria-label="One less try">−</button>
        <b class="num" id="g-tries">${g.tries}</b>
        <button type="button" data-step="1" aria-label="One more try">+</button></div></div>
      <label class="lab">Your points<span class="field"><input type="number" inputmode="numeric" id="g-pts" value="${g.points || ""}" placeholder="${g.tries * 5}"><em>pts</em></span></label>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn">Save game</button>
      <button type="button" class="btn alt" id="game-cancel">Cancel</button>
    </div>
    ${editing ? (confirmGameDelete
      ? `<div class="confirm">Delete this game? <button type="button" class="danger" id="game-del-yes">Delete</button><button type="button" id="game-del-no">Keep</button></div>`
      : `<button type="button" class="link" id="game-del">Delete game</button>`) : ""}
  </form>`;
}

function readForm(): void {
  if (!gameForm) return;
  const num = (id: string) => { const v = ($(id) as HTMLInputElement).value; return v === "" ? null : Math.max(0, Math.round(+v)); };
  gameForm.date = ($("g-date") as HTMLInputElement).value || gameForm.date;
  gameForm.opponent = ($("g-opp") as HTMLInputElement).value.trim();
  gameForm.us = num("g-us"); gameForm.them = num("g-them"); gameForm.mins = num("g-mins");
  const p = num("g-pts"); gameForm.points = p ?? gameForm.tries * 5;
}

const gamesEl = $("games");
gamesEl.addEventListener("click", ev => {
  const el = ev.target as HTMLElement;
  if (el.closest("#game-new")) { gameForm = newGame(); confirmGameDelete = false; render(); $("g-opp").focus(); return; }
  const row = el.closest<HTMLElement>("[data-game]");
  if (row) { const g = games.find(x => x.id === row.dataset.game); if (g) { gameForm = { ...g }; confirmGameDelete = false; render(); window.scrollTo({ top: 0, behavior: "smooth" }); } return; }
  const tf = el.closest<HTMLElement>("[data-team-filter]");
  if (tf) { if (gameForm) readForm(); teamFilter = tf.dataset.teamFilter as typeof teamFilter; render(); return; }
  if (!gameForm) return;
  const tm = el.closest<HTMLElement>("[data-team]");
  if (tm) { readForm(); gameForm.team = tm.dataset.team as "1st" | "2nd"; render(); return; }
  const v = el.closest<HTMLElement>("[data-venue]");
  if (v) { readForm(); gameForm.venue = v.dataset.venue as Game["venue"]; render(); return; }
  const st = el.closest<HTMLElement>("[data-step]");
  if (st) {
    readForm();
    const hadAuto = ($("g-pts") as HTMLInputElement).value === "" || gameForm.points === gameForm.tries * 5;
    gameForm.tries = Math.max(0, gameForm.tries + +st.dataset.step!);
    if (hadAuto) gameForm.points = gameForm.tries * 5;
    render(); return;
  }
  if (el.closest("#game-cancel")) { gameForm = null; confirmGameDelete = false; render(); return; }
  if (el.closest("#game-del")) { readForm(); confirmGameDelete = true; render(); return; }
  if (el.closest("#game-del-no")) { readForm(); confirmGameDelete = false; render(); return; }
  if (el.closest("#game-del-yes")) {
    const id = gameForm.id; games = games.filter(g => g.id !== id); gameForm = null; confirmGameDelete = false;
    removeGame(id).catch(() => toast("Couldn't delete. Try again.")); render(); toast("Game deleted"); return;
  }
});
gamesEl.addEventListener("submit", ev => {
  ev.preventDefault();
  if (!gameForm) return;
  readForm();
  if (!gameForm.opponent) { toast("Add the opponent"); $("g-opp").focus(); return; }
  const g = gameForm, i = games.findIndex(x => x.id === g.id);
  if (i >= 0) games[i] = g; else games.push(g);
  putGame(g).then(() => toast(result(g) === "W" ? "Win logged" : "Game logged")).catch(() => toast("Couldn't save. Try again."));
  gameForm = null; buzz(); render();
});

/* ---------------- tabs & boot ---------------- */
document.querySelectorAll<HTMLButtonElement>(".tabs button").forEach(b => b.addEventListener("click", () => {
  view = b.dataset.view as typeof view; confirmClear = false; gameForm = null; confirmGameDelete = false; render(); window.scrollTo({ top: 0 });
}));

// Roll over to a new day if the app is left open overnight.
let shownDay = todayKey();
setInterval(() => { if (todayKey() !== shownDay) { shownDay = todayKey(); pickedSession = null; requestRender(); } }, 60000);

(async () => {
  try { days = await loadAll(); games = await loadGames(); } catch { toast("Storage unavailable. Logs won't save."); }
  render();
  askPersist();
})();
