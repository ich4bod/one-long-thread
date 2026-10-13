import { createState, pull, knit, paintArea, transformPicture, choosePattern } from './model.mjs?v=picture-halves-20261013';
import { createRenderer } from './render.mjs';

let state = createState();
let knitTimer = null;
let gesture = null;
let dyeStroke = null;
let suppressClickTarget = null;
const undoPictures = [];
const redoPictures = [];
const undoDye = document.querySelector('#dye-undo');
const redoDye = document.querySelector('#dye-redo');
const handle = document.querySelector('#pull-handle');
const stage = document.querySelector('#stage');
const draw = createRenderer(stage);
const motion = document.querySelector('#motion');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
motion.checked = !reducedMotion.matches;

const colorNames = ['Cream', 'Rust', 'Coral', 'Moss'];
const colorValues = ['#f4e6c8', '#bf593f', '#ee997b', '#819480'];
const pattern = document.querySelector('#pattern');
const dyeArea = document.querySelector('#dye-area');
const dyeDrag = document.querySelector('#dye-drag');
let chosenArea = dyeArea.value;
const pictureTransform = document.querySelector('#picture-transform');
const pictureSwapControls = document.querySelector('#picture-swap-controls');
const pictureSwapFrom = document.querySelector('#picture-swap-from');
const pictureSwapTo = document.querySelector('#picture-swap-to');
const transformApply = document.querySelector('#picture-transform-apply');
const palette = [...document.querySelectorAll('.palette [data-color]')];
const grid = document.querySelector('#paint-grid');
const pictureKeep = document.querySelector('#picture-keep');
const pictureReturn = document.querySelector('#picture-return');
const keptPictureLabel = document.querySelector('#kept-picture-label');
const keptPicturePlan = document.querySelector('#kept-picture-plan');
let keptPicture = null;
let chosenColor = 0;
let focusedStitch = 0;
const stitches = [];
// Display top to bottom, left to right; strand order reverses on odd rows.
for (let r = 15; r >= 0; r--) {
  const row = document.createElement('div');
  row.setAttribute('role', 'row');
  grid.append(row);
  for (let c = 0; c < 12; c++) {
    const index = r * 12 + (r % 2 === 0 ? c : 11 - c);
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.index = index;
    button.tabIndex = stitches.length === focusedStitch ? 0 : -1;
    button.setAttribute('aria-label', `Row ${r + 1}, stitch ${c + 1}: ${colorNames[state.colors[index]]}`);
    button.style.setProperty('--dye', colorValues[state.colors[index]]);
    const cell = document.createElement('div');
    cell.setAttribute('role', 'gridcell');
    cell.append(button);
    stitches.push(button);
    row.append(cell);
  }
}

function updateStitchPlace() {
  const index = Number(stitches[focusedStitch].dataset.index);
  const r = Math.floor(index / 12);
  const c = r % 2 ? 11 - index % 12 : index % 12;
  document.querySelector('#stitch-place').textContent =
    `Row ${r + 1} · column ${c + 1} · strand section ${index + 1}. From full cloth, pull ${192 - index} releases this section.`;
}

Object.defineProperty(window, 'threadToy', {
  value: Object.freeze({ getState: () => ({ ...state, colors: state.colors.slice() }) }),
  writable: false,
  configurable: false,
});

function pictureSnapshot(picture) {
  return { pattern: picture.pattern, colors: picture.colors.slice() };
}
function samePicture(a, b) {
  return a.pattern === b.pattern && a.colors.every((color, index) => color === b.colors[index]);
}
function canEditPicture() {
  return state.remaining === 192 && knitTimer === null && gesture === null && dyeStroke === null;
}
function commitPicture(next, before = state) {
  if (!canEditPicture() || (next.pattern === before.pattern &&
      next.colors.every((color, index) => color === before.colors[index]))) return;
  undoPictures.push(pictureSnapshot(before));
  if (undoPictures.length > 12) undoPictures.shift();
  redoPictures.length = 0;
  state = { ...state, ...pictureSnapshot(next) };
  render();
}
function restorePicture(from, to) {
  if (!canEditPicture() || from.length === 0) return;
  to.push(pictureSnapshot(state));
  state = { ...state, ...pictureSnapshot(from.pop()) };
  render();
}
function refreshPictureMemory() {
  const editable = canEditPicture();
  const equalsKept = keptPicture !== null && samePicture(state, keptPicture);
  pictureKeep.disabled = !editable || equalsKept;
  pictureReturn.disabled = !editable || keptPicture === null || equalsKept;
}
function showKeptPicture() {
  const names = {
    moth: 'Moth', stairs: 'Stairs', comet: 'Comet', blank: 'Blank cloth',
    lantern: 'Lantern', fern: 'Fern', window: 'Window', custom: 'Your picture',
  };
  keptPictureLabel.textContent = `Kept picture: ${names[keptPicture.pattern]}.`;
  keptPicturePlan.replaceChildren();
  for (let r = 15; r >= 0; r--) {
    for (let c = 0; c < 12; c++) {
      const index = r * 12 + (r % 2 === 0 ? c : 11 - c);
      const square = document.createElement('span');
      square.dataset.section = String(index);
      square.dataset.dye = String(keptPicture.colors[index]);
      square.setAttribute('aria-hidden', 'true');
      square.style.backgroundColor = colorValues[keptPicture.colors[index]];
      keptPicturePlan.append(square);
    }
  }
  keptPicturePlan.hidden = false;
}
pictureKeep.addEventListener('click', () => {
  if (!canEditPicture() || (keptPicture !== null && samePicture(state, keptPicture))) return;
  keptPicture = pictureSnapshot(state);
  showKeptPicture();
  refreshPictureMemory();
});
pictureReturn.addEventListener('click', () => {
  if (!canEditPicture() || keptPicture === null || samePicture(state, keptPicture)) return;
  const candidate = { ...pictureSnapshot(keptPicture), remaining: 192 };
  commitPicture(candidate);
});
undoDye.addEventListener('click', () => restorePicture(undoPictures, redoPictures));
redoDye.addEventListener('click', () => restorePicture(redoPictures, undoPictures));

function transformCandidate() {
  return pictureTransform.value === 'swap-colors'
    ? transformPicture(state, pictureTransform.value, {
      from: Number(pictureSwapFrom.value), to: Number(pictureSwapTo.value),
    })
    : transformPicture(state, pictureTransform.value);
}
function canApplyTransform(candidate) {
  return canEditPicture() && candidate.colors.some((color, index) => color !== state.colors[index]);
}
function refreshTransform() {
  const editable = canEditPicture();
  pictureTransform.disabled = !editable;
  pictureSwapControls.hidden = pictureTransform.value !== 'swap-colors';
  pictureSwapFrom.disabled = !editable;
  pictureSwapTo.disabled = !editable;
  transformApply.disabled = !canApplyTransform(transformCandidate());
}
function refreshDyeDrag() {
  const eligible = state.remaining === 192 && dyeArea.value === 'stitch' && knitTimer === null && gesture === null;
  dyeDrag.disabled = !eligible || dyeStroke !== null;
  grid.classList.toggle('dye-drag-enabled', dyeDrag.checked && eligible);
}
pictureTransform.addEventListener('change', refreshTransform);
pictureSwapFrom.addEventListener('change', refreshTransform);
pictureSwapTo.addEventListener('change', refreshTransform);
transformApply.addEventListener('click', () => {
  const candidate = transformCandidate();
  if (!canApplyTransform(candidate)) return;
  commitPicture(candidate);
});

function render() {
  draw(state);
  updateStitchPlace();
  document.querySelector('#status').textContent = `${state.remaining} stitches in cloth · ${192 - state.remaining} in thread`;
  const newPictureEndNotes = {
    blank: 'Nothing lost. Just no longer blank cloth.',
    lantern: 'Nothing lost. Just no longer a lantern.',
    fern: 'Nothing lost. Just no longer a fern.',
    window: 'Nothing lost. Just no longer a window.',
  };
  document.querySelector('#end-note').textContent = state.remaining === 192
    ? 'Find the end.' : state.remaining === 0
      ? newPictureEndNotes[state.pattern] ?? `Nothing lost. Just no longer ${state.pattern === 'custom' ? 'your picture' : state.pattern === 'stairs' ? 'stairs' : `a ${state.pattern}`}.`
      : 'The next loop is holding the edge.';
  pattern.value = state.pattern === 'custom' ? '' : state.pattern;
  const locked = state.remaining !== 192;
  const competing = knitTimer !== null || gesture !== null || dyeStroke !== null;
  dyeArea.disabled = !canEditPicture();
  pattern.disabled = dyeStroke !== null;
  refreshDyeDrag();
  refreshTransform();
  undoDye.disabled = !canEditPicture() || undoPictures.length === 0;
  redoDye.disabled = !canEditPicture() || redoPictures.length === 0;
  refreshPictureMemory();
  document.querySelector('#design-instruction').textContent = locked
    ? 'Knit back before dyeing.'
    : 'Choose a color, then tap a stitch. Dyeing changes the color, not the thread.';
  for (const button of palette) {
    button.disabled = locked || competing;
    button.setAttribute('aria-pressed', String(Number(button.dataset.color) === chosenColor));
  }
  for (let position = 0; position < stitches.length; position++) {
    const button = stitches[position];
    const color = state.colors[Number(button.dataset.index)];
    const r = 15 - Math.floor(position / 12);
    const c = position % 12;
    button.disabled = locked || (competing && dyeStroke === null);
    button.style.setProperty('--dye', colorValues[color]);
    button.setAttribute('aria-label', `Row ${r + 1}, stitch ${c + 1}: ${colorNames[color]}`);
  }
}
function cancelKnitting() {
  if (knitTimer !== null) clearTimeout(knitTimer);
  knitTimer = null;
}
function pullStitches(count) {
  finishDyeStroke();
  cancelKnitting();
  state = pull(state, count);
  render();
}
function knitStitches(count) {
  finishDyeStroke();
  cancelKnitting();
  state = knit(state, count);
  render();
}
function knitBack() {
  finishDyeStroke();
  cancelGesture();
  cancelKnitting();
  if (state.remaining === 192 || document.hidden) return;
  if (!motion.checked) {
    state = knit(state, 192);
    render();
    return;
  }
  function batch() {
    knitTimer = null;
    if (document.hidden) return;
    state = knit(state, 12);
    render();
    if (state.remaining < 192) knitTimer = setTimeout(batch, 120);
  }
  knitTimer = setTimeout(batch, 120);
  refreshTransform();
  refreshPictureMemory();
}

function finishDyeStroke() {
  if (!dyeStroke) return;
  const stroke = dyeStroke;
  dyeStroke = null;
  if (stroke.captureTarget.hasPointerCapture(stroke.pointerId)) {
    stroke.captureTarget.releasePointerCapture(stroke.pointerId);
  }
  suppressClickTarget = stroke.startButton;
  if (stroke.changed) commitPicture(pictureSnapshot(state), stroke.before);
  else render();
}
function dyeAtPoint(stroke, clientX, clientY) {
  const hit = document.elementFromPoint(clientX, clientY);
  const button = hit instanceof Element ? hit.closest('#paint-grid button[data-index]') : null;
  if (!button || button.closest('#paint-grid') !== grid || !grid.contains(button) || button.disabled) return;
  const index = Number(button.dataset.index);
  if (!Number.isInteger(index) || stroke.visited.has(index)) return;
  stroke.visited.add(index);
  if (state.colors[index] === stroke.color) return;
  state = paintArea(state, index, stroke.color, 'stitch');
  stroke.changed = true;
  render();
}
function cancelGesture() {
  if (!gesture) return;
  const pointerId = gesture.pointerId;
  gesture = null;
  if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
  refreshTransform();
  refreshPictureMemory();
}
function stop() {
  finishDyeStroke();
  cancelKnitting();
  cancelGesture();
}

handle.addEventListener('pointerdown', event => {
  if (gesture || !event.isPrimary || event.button !== 0) return;
  event.preventDefault();
  cancelKnitting();
  handle.focus({ preventScroll: true });
  gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, travel: 0 };
  refreshTransform();
  refreshPictureMemory();
  handle.setPointerCapture(event.pointerId);
});
handle.addEventListener('pointermove', event => {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  event.preventDefault();
  const coalesced = event.getCoalescedEvents?.();
  const samples = coalesced?.length ? coalesced : [event];
  for (const sample of samples) {
    gesture.travel += Math.abs(sample.clientX - gesture.x) + Math.abs(sample.clientY - gesture.y);
    gesture.x = sample.clientX;
    gesture.y = sample.clientY;
  }
  const count = Math.floor(gesture.travel / 14);
  if (count > 0) {
    gesture.travel -= count * 14;
    pullStitches(count);
  }
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  handle.addEventListener(type, event => {
    if (gesture?.pointerId === event.pointerId) cancelGesture();
  });
}
handle.addEventListener('keydown', event => {
  if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  cancelGesture();
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') pullStitches(1);
  else knitStitches(1);
});

for (const [id, operation, count] of [
  ['pull-one', pullStitches, 1], ['pull-row', pullStitches, 12], ['knit-one', knitStitches, 1],
]) {
  document.querySelector(`#${id}`).addEventListener('click', () => {
    cancelGesture();
    operation(count);
  });
}
pattern.addEventListener('change', () => {
  stop();
  state = choosePattern(state, pattern.value);
  undoPictures.length = 0;
  redoPictures.length = 0;
  render();
});
dyeArea.addEventListener('change', () => {
  if (!canEditPicture()) {
    dyeArea.value = chosenArea;
    return;
  }
  chosenArea = dyeArea.value;
  render();
});
dyeDrag.addEventListener('change', () => render());
grid.addEventListener('pointerdown', event => {
  if (dyeStroke || !event.isPrimary || event.button !== 0 || !dyeDrag.checked || dyeDrag.disabled) return;
  const button = event.target instanceof Element ? event.target.closest('#paint-grid button[data-index]') : null;
  if (!button || button.closest('#paint-grid') !== grid || !grid.contains(button) || button.disabled) return;
  event.preventDefault();
  suppressClickTarget = null;
  dyeStroke = {
    pointerId: event.pointerId,
    captureTarget: button,
    startButton: button,
    before: pictureSnapshot(state),
    color: chosenColor,
    visited: new Set(),
    changed: false,
  };
  button.setPointerCapture(event.pointerId);
  dyeAtPoint(dyeStroke, event.clientX, event.clientY);
  render();
});
document.addEventListener('pointermove', event => {
  if (!dyeStroke || dyeStroke.pointerId !== event.pointerId) return;
  const samples = event.getCoalescedEvents?.();
  for (const sample of samples?.length ? samples : [event]) {
    dyeAtPoint(dyeStroke, sample.clientX, sample.clientY);
  }
});
for (const type of ['pointerup', 'pointercancel']) {
  document.addEventListener(type, event => {
    if (dyeStroke?.pointerId === event.pointerId) finishDyeStroke();
  });
}
grid.addEventListener('lostpointercapture', event => {
  if (dyeStroke?.pointerId === event.pointerId) finishDyeStroke();
});
grid.addEventListener('click', event => {
  if (event.detail === 0 || !suppressClickTarget) return;
  const button = event.target instanceof Element ? event.target.closest('#paint-grid button[data-index]') : null;
  if (button !== suppressClickTarget) return;
  suppressClickTarget = null;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);
for (const button of palette) {
  button.addEventListener('click', () => {
    if (state.remaining !== 192) return;
    chosenColor = Number(button.dataset.color);
    for (const colorButton of palette) {
      colorButton.setAttribute('aria-pressed', String(colorButton === button));
    }
  });
}
for (let position = 0; position < stitches.length; position++) {
  const button = stitches[position];
  button.addEventListener('focus', () => {
    stitches[focusedStitch].tabIndex = -1;
    focusedStitch = position;
    button.tabIndex = 0;
    updateStitchPlace();
  });
  button.addEventListener('click', () => {
    if (!canEditPicture()) return;
    const index = Number(button.dataset.index);
    commitPicture(paintArea(state, index, chosenColor, dyeArea.value));
  });
  button.addEventListener('keydown', event => {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -12, ArrowDown: 12 };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const column = position % 12;
    if ((event.key === 'ArrowLeft' && column === 0) ||
        (event.key === 'ArrowRight' && column === 11)) return;
    const target = position + offsets[event.key];
    if (target < 0 || target >= stitches.length) return;
    stitches[target].focus({ preventScroll: true });
    stitches[target].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}
document.querySelector('#knit-back').addEventListener('click', knitBack);
document.querySelector('#stop').addEventListener('click', stop);
window.addEventListener('blur', stop);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
});
motion.addEventListener('change', stop);
reducedMotion.addEventListener('change', event => {
  if (event.matches) {
    motion.checked = false;
    stop();
  }
});
render();
