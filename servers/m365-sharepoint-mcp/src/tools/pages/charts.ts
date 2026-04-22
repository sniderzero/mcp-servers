/**
 * Static SVG chart generators for embedding in SharePoint pages.
 * No JavaScript — pure SVG that SharePoint's HTML sanitizer will accept.
 */

const COLORS = [
  "#4472C4", "#ED7D31", "#A5A5A5", "#FFC000", "#5B9BD5",
  "#70AD47", "#264478", "#9B57A0", "#636363", "#EB5757",
  "#48C9B0", "#AF7AC5", "#F4D03F", "#5DADE2", "#EC7063",
];

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pickColor(i: number, customColors?: string[]): string {
  const palette = customColors?.length ? customColors : COLORS;
  return palette[i % palette.length];
}

export interface ChartData {
  labels: string[];
  datasets: { name?: string; values: number[] }[];
}

export interface ChartOptions {
  title?: string;
  width?: number;
  height?: number;
  colors?: string[];
  showValues?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
}

// ── Bar Chart ────────────────────────────────────────────────────────

export function barChart(data: ChartData, opts: ChartOptions = {}): string {
  const W = opts.width ?? 700;
  const H = opts.height ?? 400;
  const margin = { top: 50, right: 20, bottom: 60, left: 60 };
  const chartW = W - margin.left - margin.right;
  const chartH = H - margin.top - margin.bottom;
  const showValues = opts.showValues !== false;
  const showGrid = opts.showGrid !== false;
  const showLegend = opts.showLegend !== false && data.datasets.length > 1;

  const allValues = data.datasets.flatMap((d) => d.values);
  const maxVal = Math.max(...allValues, 0) * 1.15 || 1;

  const nGroups = data.labels.length;
  const nSeries = data.datasets.length;
  const groupW = chartW / nGroups;
  const barW = Math.min(groupW * 0.7 / nSeries, 60);
  const groupPad = (groupW - barW * nSeries) / 2;

  const gridLines = buildGridLines(maxVal);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:Segoe UI,sans-serif;background:#fff">`;

  if (opts.title) {
    svg += `<text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${escapeXml(opts.title)}</text>`;
  }

  svg += `<g transform="translate(${margin.left},${margin.top})">`;

  // Grid
  if (showGrid) {
    for (const v of gridLines) {
      const y = chartH - (v / maxVal) * chartH;
      svg += `<line x1="0" y1="${y}" x2="${chartW}" y2="${y}" stroke="#e0e0e0" stroke-dasharray="3,3"/>`;
      svg += `<text x="-8" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">${formatNum(v)}</text>`;
    }
  }

  // Axes
  svg += `<line x1="0" y1="0" x2="0" y2="${chartH}" stroke="#999"/>`;
  svg += `<line x1="0" y1="${chartH}" x2="${chartW}" y2="${chartH}" stroke="#999"/>`;

  // Bars
  for (let g = 0; g < nGroups; g++) {
    const gx = g * groupW + groupPad;
    for (let s = 0; s < nSeries; s++) {
      const val = data.datasets[s].values[g] ?? 0;
      const barH = (val / maxVal) * chartH;
      const x = gx + s * barW;
      const y = chartH - barH;
      const color = pickColor(s, opts.colors);
      svg += `<rect x="${x}" y="${y}" width="${barW - 1}" height="${barH}" fill="${color}" rx="2"/>`;
      if (showValues) {
        svg += `<text x="${x + (barW - 1) / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="#333">${formatNum(val)}</text>`;
      }
    }
    // X-axis label
    const labelX = g * groupW + groupW / 2;
    svg += `<text x="${labelX}" y="${chartH + 18}" text-anchor="middle" font-size="11" fill="#333">${escapeXml(data.labels[g])}</text>`;
  }

  svg += `</g>`;

  if (showLegend) {
    svg += buildLegend(data.datasets, W, H - 15, opts.colors);
  }

  svg += `</svg>`;
  return svg;
}

// ── Horizontal Bar Chart ─────────────────────────────────────────────

export function horizontalBarChart(data: ChartData, opts: ChartOptions = {}): string {
  const W = opts.width ?? 700;
  const H = opts.height ?? Math.max(400, data.labels.length * 40 + 100);
  const margin = { top: 50, right: 30, bottom: 30, left: 120 };
  const chartW = W - margin.left - margin.right;
  const chartH = H - margin.top - margin.bottom;
  const showValues = opts.showValues !== false;

  const allValues = data.datasets.flatMap((d) => d.values);
  const maxVal = Math.max(...allValues, 0) * 1.15 || 1;

  const nGroups = data.labels.length;
  const nSeries = data.datasets.length;
  const groupH = chartH / nGroups;
  const barH = Math.min(groupH * 0.7 / nSeries, 30);
  const groupPad = (groupH - barH * nSeries) / 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:Segoe UI,sans-serif;background:#fff">`;

  if (opts.title) {
    svg += `<text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${escapeXml(opts.title)}</text>`;
  }

  svg += `<g transform="translate(${margin.left},${margin.top})">`;

  // Axes
  svg += `<line x1="0" y1="0" x2="0" y2="${chartH}" stroke="#999"/>`;
  svg += `<line x1="0" y1="${chartH}" x2="${chartW}" y2="${chartH}" stroke="#999"/>`;

  for (let g = 0; g < nGroups; g++) {
    const gy = g * groupH + groupPad;
    for (let s = 0; s < nSeries; s++) {
      const val = data.datasets[s].values[g] ?? 0;
      const barW = (val / maxVal) * chartW;
      const y = gy + s * barH;
      const color = pickColor(s, opts.colors);
      svg += `<rect x="0" y="${y}" width="${barW}" height="${barH - 1}" fill="${color}" rx="2"/>`;
      if (showValues) {
        svg += `<text x="${barW + 6}" y="${y + barH / 2 + 4}" font-size="10" fill="#333">${formatNum(val)}</text>`;
      }
    }
    const labelY = g * groupH + groupH / 2 + 4;
    svg += `<text x="-8" y="${labelY}" text-anchor="end" font-size="11" fill="#333">${escapeXml(data.labels[g])}</text>`;
  }

  svg += `</g>`;
  svg += `</svg>`;
  return svg;
}

// ── Line Chart ───────────────────────────────────────────────────────

export function lineChart(data: ChartData, opts: ChartOptions = {}): string {
  const W = opts.width ?? 700;
  const H = opts.height ?? 400;
  const margin = { top: 50, right: 20, bottom: 60, left: 60 };
  const chartW = W - margin.left - margin.right;
  const chartH = H - margin.top - margin.bottom;
  const showValues = opts.showValues ?? false;
  const showGrid = opts.showGrid !== false;
  const showLegend = opts.showLegend !== false && data.datasets.length > 1;

  const allValues = data.datasets.flatMap((d) => d.values);
  const maxVal = Math.max(...allValues, 0) * 1.15 || 1;
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - Math.min(minVal, 0);

  const gridLines = buildGridLines(maxVal);
  const nPoints = data.labels.length;
  const stepX = nPoints > 1 ? chartW / (nPoints - 1) : chartW / 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:Segoe UI,sans-serif;background:#fff">`;

  if (opts.title) {
    svg += `<text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${escapeXml(opts.title)}</text>`;
  }

  svg += `<g transform="translate(${margin.left},${margin.top})">`;

  if (showGrid) {
    for (const v of gridLines) {
      const y = chartH - (v / range) * chartH;
      svg += `<line x1="0" y1="${y}" x2="${chartW}" y2="${y}" stroke="#e0e0e0" stroke-dasharray="3,3"/>`;
      svg += `<text x="-8" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">${formatNum(v)}</text>`;
    }
  }

  // Axes
  svg += `<line x1="0" y1="0" x2="0" y2="${chartH}" stroke="#999"/>`;
  svg += `<line x1="0" y1="${chartH}" x2="${chartW}" y2="${chartH}" stroke="#999"/>`;

  // Lines + dots
  for (let s = 0; s < data.datasets.length; s++) {
    const color = pickColor(s, opts.colors);
    const points: string[] = [];

    for (let i = 0; i < nPoints; i++) {
      const val = data.datasets[s].values[i] ?? 0;
      const x = i * stepX;
      const y = chartH - (val / range) * chartH;
      points.push(`${x},${y}`);
    }

    svg += `<polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>`;

    for (let i = 0; i < nPoints; i++) {
      const val = data.datasets[s].values[i] ?? 0;
      const x = i * stepX;
      const y = chartH - (val / range) * chartH;
      svg += `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
      if (showValues) {
        svg += `<text x="${x}" y="${y - 10}" text-anchor="middle" font-size="10" fill="#333">${formatNum(val)}</text>`;
      }
    }
  }

  // X-axis labels
  for (let i = 0; i < nPoints; i++) {
    const x = i * stepX;
    svg += `<text x="${x}" y="${chartH + 18}" text-anchor="middle" font-size="11" fill="#333">${escapeXml(data.labels[i])}</text>`;
  }

  svg += `</g>`;

  if (showLegend) {
    svg += buildLegend(data.datasets, W, H - 15, opts.colors);
  }

  svg += `</svg>`;
  return svg;
}

// ── Area Chart ───────────────────────────────────────────────────────

export function areaChart(data: ChartData, opts: ChartOptions = {}): string {
  const W = opts.width ?? 700;
  const H = opts.height ?? 400;
  const margin = { top: 50, right: 20, bottom: 60, left: 60 };
  const chartW = W - margin.left - margin.right;
  const chartH = H - margin.top - margin.bottom;
  const showGrid = opts.showGrid !== false;
  const showLegend = opts.showLegend !== false && data.datasets.length > 1;

  const allValues = data.datasets.flatMap((d) => d.values);
  const maxVal = Math.max(...allValues, 0) * 1.15 || 1;

  const gridLines = buildGridLines(maxVal);
  const nPoints = data.labels.length;
  const stepX = nPoints > 1 ? chartW / (nPoints - 1) : chartW / 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:Segoe UI,sans-serif;background:#fff">`;

  if (opts.title) {
    svg += `<text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${escapeXml(opts.title)}</text>`;
  }

  svg += `<g transform="translate(${margin.left},${margin.top})">`;

  if (showGrid) {
    for (const v of gridLines) {
      const y = chartH - (v / maxVal) * chartH;
      svg += `<line x1="0" y1="${y}" x2="${chartW}" y2="${y}" stroke="#e0e0e0" stroke-dasharray="3,3"/>`;
      svg += `<text x="-8" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">${formatNum(v)}</text>`;
    }
  }

  svg += `<line x1="0" y1="0" x2="0" y2="${chartH}" stroke="#999"/>`;
  svg += `<line x1="0" y1="${chartH}" x2="${chartW}" y2="${chartH}" stroke="#999"/>`;

  for (let s = data.datasets.length - 1; s >= 0; s--) {
    const color = pickColor(s, opts.colors);
    let path = `M0,${chartH}`;

    for (let i = 0; i < nPoints; i++) {
      const val = data.datasets[s].values[i] ?? 0;
      const x = i * stepX;
      const y = chartH - (val / maxVal) * chartH;
      path += ` L${x},${y}`;
    }
    path += ` L${(nPoints - 1) * stepX},${chartH} Z`;

    svg += `<path d="${path}" fill="${color}" fill-opacity="0.25"/>`;
    // Stroke line on top
    let linePts = "";
    for (let i = 0; i < nPoints; i++) {
      const val = data.datasets[s].values[i] ?? 0;
      const x = i * stepX;
      const y = chartH - (val / maxVal) * chartH;
      linePts += `${x},${y} `;
    }
    svg += `<polyline points="${linePts.trim()}" fill="none" stroke="${color}" stroke-width="2"/>`;
  }

  for (let i = 0; i < nPoints; i++) {
    const x = i * stepX;
    svg += `<text x="${x}" y="${chartH + 18}" text-anchor="middle" font-size="11" fill="#333">${escapeXml(data.labels[i])}</text>`;
  }

  svg += `</g>`;

  if (showLegend) {
    svg += buildLegend(data.datasets, W, H - 15, opts.colors);
  }

  svg += `</svg>`;
  return svg;
}

// ── Pie / Donut Chart ────────────────────────────────────────────────

export function pieChart(
  data: ChartData,
  opts: ChartOptions & { donut?: boolean } = {}
): string {
  const W = opts.width ?? 500;
  const H = opts.height ?? 500;
  const cx = W / 2;
  const cy = (H / 2) + (opts.title ? 10 : 0);
  const R = Math.min(W, H) / 2 - 60;
  const innerR = opts.donut ? R * 0.55 : 0;
  const showValues = opts.showValues !== false;

  const values = data.datasets[0]?.values ?? [];
  const total = values.reduce((a, b) => a + b, 0) || 1;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:Segoe UI,sans-serif;background:#fff">`;

  if (opts.title) {
    svg += `<text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${escapeXml(opts.title)}</text>`;
  }

  let angle = -Math.PI / 2;

  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    const sweep = (val / total) * 2 * Math.PI;
    const color = pickColor(i, opts.colors);

    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep);
    const y2 = cy + R * Math.sin(angle + sweep);
    const largeArc = sweep > Math.PI ? 1 : 0;

    let d: string;
    if (innerR > 0) {
      const ix1 = cx + innerR * Math.cos(angle);
      const iy1 = cy + innerR * Math.sin(angle);
      const ix2 = cx + innerR * Math.cos(angle + sweep);
      const iy2 = cy + innerR * Math.sin(angle + sweep);
      d = `M${ix1},${iy1} L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} L${ix2},${iy2} A${innerR},${innerR} 0 ${largeArc},0 ${ix1},${iy1} Z`;
    } else {
      d = `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z`;
    }

    svg += `<path d="${d}" fill="${color}" stroke="#fff" stroke-width="2"/>`;

    // Label
    if (showValues) {
      const labelR = innerR > 0 ? (R + innerR) / 2 : R * 0.65;
      const midAngle = angle + sweep / 2;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      const pct = Math.round((val / total) * 100);
      svg += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#fff">${pct}%</text>`;
    }

    angle += sweep;
  }

  // Legend
  const legendY = H - values.length * 10 - 15;
  const legendStartX = 20;
  for (let i = 0; i < data.labels.length; i++) {
    const lx = legendStartX + (i % 3) * (W / 3);
    const ly = H - 40 + Math.floor(i / 3) * 20;
    const color = pickColor(i, opts.colors);
    svg += `<rect x="${lx}" y="${ly - 10}" width="12" height="12" rx="2" fill="${color}"/>`;
    svg += `<text x="${lx + 18}" y="${ly}" font-size="11" fill="#333">${escapeXml(data.labels[i])} (${formatNum(values[i])})</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ── Table Chart ──────────────────────────────────────────────────────

export function tableChart(data: ChartData, opts: ChartOptions = {}): string {
  const cellW = 120;
  const cellH = 32;
  const headerColor = "#4472C4";
  const rowEven = "#f5f7fa";
  const rowOdd = "#ffffff";

  const cols = 1 + data.datasets.length;
  const rows = 1 + data.labels.length;
  const W = opts.width ?? cols * cellW;
  const H = opts.height ?? rows * cellH + (opts.title ? 40 : 0);
  const adjCellW = W / cols;
  const offsetY = opts.title ? 40 : 0;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:Segoe UI,sans-serif;background:#fff">`;

  if (opts.title) {
    svg += `<text x="${W / 2}" y="24" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${escapeXml(opts.title)}</text>`;
  }

  // Header row
  svg += `<rect x="0" y="${offsetY}" width="${W}" height="${cellH}" fill="${headerColor}"/>`;
  svg += `<text x="${adjCellW / 2}" y="${offsetY + cellH / 2 + 5}" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">Label</text>`;
  for (let s = 0; s < data.datasets.length; s++) {
    const x = (s + 1) * adjCellW;
    svg += `<text x="${x + adjCellW / 2}" y="${offsetY + cellH / 2 + 5}" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">${escapeXml(data.datasets[s].name ?? `Series ${s + 1}`)}</text>`;
  }

  // Data rows
  for (let r = 0; r < data.labels.length; r++) {
    const ry = offsetY + (r + 1) * cellH;
    const fill = r % 2 === 0 ? rowEven : rowOdd;
    svg += `<rect x="0" y="${ry}" width="${W}" height="${cellH}" fill="${fill}"/>`;
    svg += `<text x="${adjCellW / 2}" y="${ry + cellH / 2 + 5}" text-anchor="middle" font-size="11" fill="#333">${escapeXml(data.labels[r])}</text>`;
    for (let s = 0; s < data.datasets.length; s++) {
      const x = (s + 1) * adjCellW;
      svg += `<text x="${x + adjCellW / 2}" y="${ry + cellH / 2 + 5}" text-anchor="middle" font-size="11" fill="#333">${formatNum(data.datasets[s].values[r] ?? 0)}</text>`;
    }
  }

  // Grid lines
  for (let r = 0; r <= data.labels.length + 1; r++) {
    const y = offsetY + r * cellH;
    svg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ddd"/>`;
  }
  for (let c = 0; c <= cols; c++) {
    const x = c * adjCellW;
    svg += `<line x1="${x}" y1="${offsetY}" x2="${x}" y2="${offsetY + rows * cellH}" stroke="#ddd"/>`;
  }

  svg += `</svg>`;
  return svg;
}

// ── Helpers ──────────────────────────────────────────────────────────

function buildGridLines(maxVal: number): number[] {
  const lines: number[] = [];
  const step = niceStep(maxVal);
  for (let v = step; v <= maxVal; v += step) {
    lines.push(v);
  }
  return lines;
}

function niceStep(max: number): number {
  const rough = max / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  if (norm <= 1) return mag;
  if (norm <= 2) return 2 * mag;
  if (norm <= 5) return 5 * mag;
  return 10 * mag;
}

function formatNum(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e6) return n.toLocaleString("en-US");
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(1);
}

function buildLegend(
  datasets: { name?: string }[],
  svgW: number,
  y: number,
  colors?: string[]
): string {
  let svg = "";
  const totalW = datasets.reduce((sum, d) => sum + (d.name?.length ?? 8) * 7 + 30, 0);
  let x = (svgW - totalW) / 2;

  for (let s = 0; s < datasets.length; s++) {
    const color = pickColor(s, colors);
    const name = datasets[s].name ?? `Series ${s + 1}`;
    svg += `<rect x="${x}" y="${y - 10}" width="14" height="14" rx="2" fill="${color}"/>`;
    svg += `<text x="${x + 20}" y="${y + 1}" font-size="11" fill="#333">${escapeXml(name)}</text>`;
    x += name.length * 7 + 30;
  }

  return svg;
}

// ── Main dispatcher ──────────────────────────────────────────────────

export type ChartType = "bar" | "horizontalBar" | "line" | "area" | "pie" | "donut" | "table";

export function generateChart(
  type: ChartType,
  data: ChartData,
  opts: ChartOptions = {}
): string {
  switch (type) {
    case "bar":
      return barChart(data, opts);
    case "horizontalBar":
      return horizontalBarChart(data, opts);
    case "line":
      return lineChart(data, opts);
    case "area":
      return areaChart(data, opts);
    case "pie":
      return pieChart(data, { ...opts, donut: false });
    case "donut":
      return pieChart(data, { ...opts, donut: true });
    case "table":
      return tableChart(data, opts);
    default:
      throw new Error(`Unknown chart type: ${type}`);
  }
}
