import { createState, pull, knit } from './model.mjs';
import { createRenderer } from './render.mjs';

let state = createState();
let knitTimer = null;
let gesture = null;
const handle = document.querySelector('#pull-handle');
const stage = document.querySelector('#stage');
const draw = createRenderer(stage);
const motion = document.querySelector('#motion');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
motion.checked = !reducedMotion.matches;

Object.defineProperty(window, 'threadToy', {
  value: Object.freeze({ getState: () => ({ ...state, colors: state.colors.slice() }) }),
  writable: false,
  configurable: false,
});

function render() {
  draw(state);
  document.querySelector('#status').textContent = `${state.remaining} stitches in cloth · ${192 - state.remaining} in thread`;
  document.querySelector('#end-note').textContent = state.remaining === 192
    ? 'Find the end.' : state.remaining === 0
      ? 'Nothing lost. Just no longer a moth.' : 'The next loop is holding the edge.';
}
function cancelKnitting() {
  if (knitTimer !== null) clearTimeout(knitTimer);
  knitTimer = null;
}
function pullStitches(count) {
  cancelKnitting();
  state = pull(state, count);
  render();
}
function knitStitches(count) {
  cancelKnitting();
  state = knit(state, count);
  render();
}
function knitBack() {
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
}

function cancelGesture() {
  if (!gesture) return;
  const pointerId = gesture.pointerId;
  gesture = null;
  if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
}
function stop() {
  cancelKnitting();
  cancelGesture();
}

handle.addEventListener('pointerdown', event => {
  if (gesture || !event.isPrimary || event.button !== 0) return;
  event.preventDefault();
  cancelKnitting();
  handle.focus({ preventScroll: true });
  gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, travel: 0 };
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
