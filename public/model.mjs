const COLUMNS = 12;
const ROWS = 16;
const SECTIONS = COLUMNS * ROWS;
const MOTH_WIDTHS = [1, 2, 4, 5, 5, 4, 3, 4, 3, 1];

function presetColor(pattern, r, c) {
  if (pattern === 'moth') {
    const width = MOTH_WIDTHS[r - 3];
    let color = width !== undefined && c >= 6 - width && c <= 5 + width ? 1 : 0;
    if (r >= 2 && r <= 13 && (c === 5 || c === 6)) color = 3;
    if ((r === 7 && (c === 2 || c === 9)) || (r === 9 && (c === 3 || c === 8))) color = 2;
    return color;
  }
  if (pattern === 'stairs') {
    const edge = Math.floor(r / 2);
    return c === edge ? 2 : c <= edge ? 3 : 0;
  }
  if ((r - 10) ** 2 + (c - 7) ** 2 <= 9) return 2;
  return r >= 1 && r <= 9 && Math.abs(c - (r - 2)) <= 1 ? 1 : 0;
}

export function createState({ pattern = 'moth' } = {}) {
  if (!['moth', 'stairs', 'comet'].includes(pattern)) {
    throw new RangeError(`Unknown pattern: ${pattern}`);
  }
  const colors = Array.from({ length: SECTIONS }, (_, i) => {
    const r = Math.floor(i / COLUMNS);
    const q = i % COLUMNS;
    const c = r % 2 === 0 ? q : COLUMNS - 1 - q;
    return presetColor(pattern, r, c);
  });
  return { pattern, remaining: SECTIONS, colors };
}

function copyState(state) {
  return { ...state, colors: state.colors.slice() };
}

function stitchCount(count) {
  return Number.isFinite(count) ? Math.floor(Math.max(0, count)) : 0;
}

export function pull(state, count) {
  const next = copyState(state);
  next.remaining = Math.max(0, state.remaining - stitchCount(count));
  return next;
}

export function knit(state, count) {
  const next = copyState(state);
  next.remaining = Math.min(SECTIONS, state.remaining + stitchCount(count));
  return next;
}

export function paint(state, index, color) {
  const next = copyState(state);
  if (state.remaining !== SECTIONS ||
      !Number.isInteger(index) || index < 0 || index >= SECTIONS ||
      !Number.isInteger(color) || color < 0 || color > 3 ||
      state.colors[index] === color) return next;
  next.colors[index] = color;
  next.pattern = 'custom';
  return next;
}

export function paintArea(state, index, color, area) {
  const next = copyState(state);
  if (state.remaining !== SECTIONS ||
      !Number.isInteger(index) || index < 0 || index >= SECTIONS ||
      !Number.isInteger(color) || color < 0 || color > 3 ||
      !['stitch', 'patch', 'row', 'column'].includes(area)) return next;
  const row = Math.floor(index / COLUMNS);
  const column = row % 2 ? COLUMNS - 1 - index % COLUMNS : index % COLUMNS;
  const at = (r, c) => r * COLUMNS + (r % 2 ? COLUMNS - 1 - c : c);
  const members = [];
  if (area === 'stitch') members.push(index);
  else if (area === 'row') {
    for (let c = 0; c < COLUMNS; c++) members.push(at(row, c));
  } else if (area === 'column') {
    for (let r = 0; r < ROWS; r++) members.push(at(r, column));
  } else {
    const originalColor = state.colors[index];
    const queue = [[row, column]];
    const seen = new Set();
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const [r, c] = queue[cursor];
      if (r < 0 || r >= ROWS || c < 0 || c >= COLUMNS) continue;
      const i = at(r, c);
      if (seen.has(i) || state.colors[i] !== originalColor) continue;
      seen.add(i);
      members.push(i);
      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }
  }
  for (const i of members) {
    if (state.colors[i] === color) continue;
    next.colors[i] = color;
    next.pattern = 'custom';
  }
  return next;
}

export function choosePattern(state, name) {
  if (!['moth', 'stairs', 'comet'].includes(name)) {
    throw new RangeError(`Unknown pattern: ${name}`);
  }
  return createState({ pattern: name });
}
