const NS = 'http://www.w3.org/2000/svg';
const PALETTE = ['#f4e6c8', '#bf593f', '#ee997b', '#819480'];
const X = 86, BOTTOM = 316, DX = 20, DY = 18;

// Each section ends exactly where the next one starts, including row turns.
// The path is a loop diagram; its drawn lengths are not yarn measurements.
function clothSection(i) {
  const r = Math.floor(i / 12), q = i % 12;
  const c = r % 2 ? 11 - q : q;
  const direction = r % 2 ? -1 : 1;
  const x = X + (c + (direction < 0 ? 1 : 0)) * DX;
  const y = BOTTOM - r * DY;
  const endX = x + direction * DX;
  let d = `M ${x} ${y} C ${x + direction * 8} ${y + 11}, ${x + direction * 4} ${y - 11}, ${x + direction * 10} ${y - 11} C ${x + direction * 16} ${y - 11}, ${x + direction * 12} ${y + 11}, ${endX} ${y}`;
  let end = { x: endX, y };
  if (q === 11 && i < 191) {
    d += ` C ${endX + direction * 13} ${y}, ${endX + direction * 13} ${y - DY}, ${endX} ${y - DY}`;
    end = { x: endX, y: y - DY };
  }
  return { d, end };
}

// Slots run from the working end down through a folded, wavy pile. Reversing
// their traversal makes the loose sections keep the model's strand order.
function slot(j) {
  const r = Math.floor(j / 24), q = j % 24;
  const x = 55 + (r % 2 ? 24 - q : q) * (310 / 24);
  const ripple = q === 0 ? 0 : Math.sin(q * 0.65 + r * 0.9) * 3;
  return { x, y: 371 + r * 13 + ripple };
}
function looseSection(i) {
  const j = 192 - i;
  const a = slot(j), b = slot(j - 1);
  if (j % 24 === 0) {
    const outside = a.x > 206 ? 386 : 34;
    return `M ${a.x} ${a.y} C ${outside} ${a.y}, ${outside} ${b.y}, ${b.x} ${b.y}`;
  }
  const wiggle = Math.sin(j * 0.7) * 2;
  return `M ${a.x} ${a.y} C ${a.x + (b.x - a.x) / 3} ${a.y + wiggle}, ${a.x + (b.x - a.x) * 2 / 3} ${b.y + wiggle}, ${b.x} ${b.y}`;
}
function path(d, color) {
  const element = document.createElementNS(NS, 'path');
  element.setAttribute('d', d);
  if (color) element.setAttribute('stroke', color);
  return element;
}

export function createRenderer(stage) {
  const shadow = stage.querySelector('#yarn-shadow');
  const colors = stage.querySelector('#yarn-color');
  const light = stage.querySelector('#yarn-light');
  const cloth = Array.from({ length: 192 }, (_, i) => clothSection(i));
  const loose = Array.from({ length: 192 }, (_, i) => looseSection(i));
  return function render(state) {
    const pieces = [];
    const n = 192 - state.remaining;
    for (let i = 0; i < state.remaining; i++) pieces.push([cloth[i].d, PALETTE[state.colors[i]]]);
    if (state.remaining > 0) {
      const e = cloth[state.remaining - 1].end;
      if (n === 0) {
        pieces.push([`M ${e.x} ${e.y} C ${e.x - 16} ${e.y - 10}, 62 33, 35 33`, PALETTE[2]]);
      } else {
        const a = slot(n);
        const side = e.x > 206 ? 386 : 35;
        pieces.push([`M ${e.x} ${e.y} C ${side} ${e.y}, ${side} 333, ${side} 340 C ${side} 356, ${a.x} ${a.y - 14}, ${a.x} ${a.y}`, PALETTE[state.colors[state.remaining]]]);
      }
    }
    for (let i = state.remaining; i < 192; i++) pieces.push([loose[i], PALETTE[state.colors[i]]]);
    if (n > 0) {
      const e = slot(0);
      pieces.push([`M ${e.x} ${e.y} C 12 ${e.y}, 12 343, 12 320 L 12 63 Q 12 33, 35 33`, PALETTE[2]]);
    }
    const darkFragment = document.createDocumentFragment();
    const colorFragment = document.createDocumentFragment();
    const lightFragment = document.createDocumentFragment();
    for (const [d, color] of pieces) {
      darkFragment.append(path(d));
      colorFragment.append(path(d, color));
      lightFragment.append(path(d));
    }
    shadow.replaceChildren(darkFragment);
    colors.replaceChildren(colorFragment);
    light.replaceChildren(lightFragment);
    stage.dataset.remaining = String(state.remaining);
  };
}
