// Small hand-built SVG charts. One series per chart, one y axis, tap a mark to read its value.

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
const fmt = (v: number) => (Math.abs(v) >= 1000 ? String(Math.round(v / 100) / 10) + "k" : String(Math.round(v * 10) / 10));

export interface Bar {
  value: number;
  label: string;        // x axis label
  sub?: string;         // second line under the label (e.g. W / L)
  tip: string;          // readout when tapped
  hot?: boolean;        // gold instead of navy
}

/**
 * Vertical bar chart. `ref` draws a dashed reference line (a target) with its own label.
 * Readout text sits above the plot and updates when a bar is tapped.
 */
export function barChart(id: string, bars: Bar[], opts: { unit?: string; ref?: { value: number; label: string }; readout: string; min?: number; int?: boolean }): string {
  const W = 340, H = 170, L = 30, R = 6, T = opts.ref ? 24 : 12, B = bars.some(b => b.sub) ? 34 : 22;
  const pw = W - L - R, ph = H - T - B;
  const peak = Math.max(opts.min ?? 0, opts.ref?.value ?? 0, ...bars.map(b => b.value));
  let top = opts.int ? Math.max(1, Math.ceil(peak)) : niceMax(peak);
  if (opts.int && top > 4 && top % 2) top += 1;
  const Y = (v: number) => T + ph - (v / top) * ph;
  const slot = pw / Math.max(bars.length, 1);
  const bw = Math.max(6, Math.min(34, slot - 6));
  const ticks = opts.int && top <= 4 ? Array.from({ length: top + 1 }, (_, i) => i) : [0, top / 2, top];

  let g = ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" stroke-width="1"/>
    <text x="${L - 6}" y="${Y(t) + 3.5}" text-anchor="end" class="ax">${fmt(t)}</text>`).join("");

  bars.forEach((b, i) => {
    const cx = L + slot * i + slot / 2, x = cx - bw / 2, y = Y(b.value), h = Math.max(0, T + ph - y);
    const r = Math.min(4, bw / 2, h);
    // rounded top, square base on the axis
    const d = h > 0
      ? `M${x},${T + ph} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${T + ph} Z`
      : "";
    g += `<g class="mk" data-i="${i}" data-tip="${esc(b.tip)}">
      <rect x="${L + slot * i}" y="${T}" width="${slot}" height="${ph + B}" fill="transparent"/>
      ${d ? `<path d="${d}" fill="${b.hot ? "var(--hot)" : "var(--accent)"}"/>` : `<line x1="${x}" x2="${x + bw}" y1="${T + ph - 1}" y2="${T + ph - 1}" stroke="var(--line)" stroke-width="2"/>`}
      <text x="${cx}" y="${T + ph + 13}" text-anchor="middle" class="ax">${esc(b.label)}</text>
      ${b.sub ? `<text x="${cx}" y="${T + ph + 27}" text-anchor="middle" class="ax strong">${esc(b.sub)}</text>` : ""}
    </g>`;
  });

  if (opts.ref) {
    const y = Y(opts.ref.value);
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--hot)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <line x1="${W - R - 88}" x2="${W - R - 72}" y1="9" y2="9" stroke="var(--hot)" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="${W - R - 66}" y="12.5" class="ax strong">${esc(opts.ref.label)}</text>`;
  }
  return chartShell(id, opts.readout, `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(opts.readout)}">${g}</svg>`);
}

export interface Pt { x: number; y: number; label: string; tip: string }

/** Line chart over time. x is a timestamp; labels on the first and last points only. */
export function lineChart(id: string, pts: Pt[], opts: { unit?: string; readout: string }): string {
  const W = 340, H = 170, L = 34, R = 12, T = 14, B = 22;
  const pw = W - L - R, ph = H - T - B;
  const ys = pts.map(p => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = Math.max((hi - lo) * 0.15, hi * 0.05, 1);
  lo = Math.max(0, Math.floor((lo - pad) / 2.5) * 2.5); hi = Math.ceil((hi + pad) / 2.5) * 2.5;
  const x0 = pts[0].x, x1 = pts[pts.length - 1].x, span = x1 - x0 || 1;
  const X = (x: number) => (pts.length === 1 ? L + pw / 2 : L + ((x - x0) / span) * pw);
  const Y = (y: number) => T + ph - ((y - lo) / (hi - lo || 1)) * ph;
  const ticks = [lo, (lo + hi) / 2, hi];

  let g = ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" stroke-width="1"/>
    <text x="${L - 6}" y="${Y(t) + 3.5}" text-anchor="end" class="ax">${fmt(t)}</text>`).join("");
  const path = pts.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
  if (pts.length > 1) {
    g += `<path d="${path} L${X(x1)},${T + ph} L${X(x0)},${T + ph} Z" fill="var(--hot)" fill-opacity=".14"/>
      <path d="${path}" fill="none" stroke="var(--hot)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const hitW = pts.length > 1 ? pw / (pts.length - 1) : pw;
  pts.forEach((p, i) => {
    const last = i === pts.length - 1;
    g += `<g class="mk" data-i="${i}" data-tip="${esc(p.tip)}">
      <rect x="${X(p.x) - hitW / 2}" y="${T}" width="${hitW}" height="${ph + B}" fill="transparent"/>
      <circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${last ? 5 : 4}" fill="${last ? "var(--hot)" : "var(--surface)"}" stroke="var(--hot)" stroke-width="2"/>
    </g>`;
  });
  const first = pts[0], lastP = pts[pts.length - 1];
  g += `<text x="${X(first.x)}" y="${H - 6}" text-anchor="${pts.length === 1 ? "middle" : "start"}" class="ax">${esc(first.label)}</text>`;
  if (pts.length > 1) g += `<text x="${X(lastP.x)}" y="${H - 6}" text-anchor="end" class="ax">${esc(lastP.label)}</text>`;
  return chartShell(id, opts.readout, `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(opts.readout)}">${g}</svg>`);
}

function chartShell(id: string, readout: string, svg: string): string {
  return `<div class="chart-box" id="${id}" data-default="${esc(readout)}"><div class="readout">${esc(readout)}</div>${svg}</div>`;
}

/** One delegated handler: tapping a mark shows its value in the chart's readout and highlights it. */
export function wireCharts(root: HTMLElement) {
  root.addEventListener("click", ev => {
    const mk = (ev.target as Element).closest<SVGGElement>(".mk");
    const box = (ev.target as Element).closest<HTMLElement>(".chart-box");
    if (!box) return;
    const out = box.querySelector(".readout")!;
    const wasSel = !!mk?.classList.contains("sel");
    box.querySelectorAll(".mk.sel").forEach(e => e.classList.remove("sel"));
    if (mk && !wasSel) { mk.classList.add("sel"); out.textContent = mk.dataset.tip || ""; }
    else out.textContent = box.dataset.default || "";
  });
}
