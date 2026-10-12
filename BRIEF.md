# One Long Thread

## What it is
Pull a knitted picture apart into one long, colored thread, then wind it back into cloth or dye a picture of your own.

## The moment
A small rust-colored moth hangs in cream-colored knitting on a midnight-blue table. A conspicuous coral yarn end trails from its upper edge to a little handle marked “Pull”. Drag the handle: the upper-left loop opens, its neighbor follows, and the moth begins to disappear one stitch at a time. The freed yarn does not vanish: its colored sections snake into a generous tray below the cloth. Pull the last loop and there is no moth, no cloth, only the same colors in one continuous strand. “Knit back” walks that strand back through the very same picture.

This is not a weave editor with an unravel button tacked on. The continuous strand and the change between picture and thread are the whole spectacle. Individual stitches must look like loops, not squares or printed V glyphs. No photograph, stock image, external font or external library required. Workers choose the loop curves, pile arrangement and tiny animation details by looking at the running toy. Prioritize a legible connection between the working edge, handle and loose strand, including when only one stitch remains.

## Feel
Background #101e29, tray #192d3a, cream #f4e6c8, rust #bf593f, coral #ee997b, moss #819480. Ink on light yarn labels #101e29; normal text #f4e6c8. Yarn has a subtle dark under-stroke and a narrow highlight, never a neon glow. Title Georgia/serif, 36px desktop / 30px phone; controls and notes system sans-serif, 16px. Quiet, tactile, wry, without pretend shop labels. No sound. The cloth and loose thread occupy the first screen; instructions sit immediately beside them. Buttons have 45px minimum hit targets. Phone layout puts tray below cloth; desktop may place tray beside it if the connecting strand remains obvious.

Unraveling and reknitting are finite operations, not endlessly running animations. A single animation owner, cancelable on pointer release, blur, visibility loss or Stop. Reduced motion starts with transitions disabled and removes nothing from the interaction. No autoplay. Dragging converts cumulative horizontal or vertical travel into one stitch per 14 CSS px, using total absolute travel along successive pointer samples, with no double counting. Pointerdown alone removes nothing. Pointer capture keeps the handle usable outside its initial bounds. Cap each movement's removal at remaining stitches. Small curve transitions may take up to 90ms; controls commit discrete model changes immediately, and the renderer catches up. No random drift, physics engine, tension accuracy or actual yarn-length claim.

## Words (complete public copy)
Title: “One Long Thread”
Deck: “A picture held together by loops.”
Instruction: “Drag the coral end. The picture comes apart; the colors stay.”
Handle accessible name: “Pull the yarn end”
Controls: “Pull one stitch”, “Pull one row”, “Knit one stitch”, “Knit back”, “Stop”
Status: “{remaining} stitches in cloth · {192 - remaining} in thread”
At zero, additional line: “Nothing lost. Just no longer a moth.” for Moth; “Nothing lost. Just no longer stairs.” for Stairs; “Nothing lost. Just no longer a comet.” for Comet; “Nothing lost. Just no longer your picture.” after an edit.
At fully knitted, additional line: “Find the end.”
At intermediate counts, additional line: “The next loop is holding the edge.”
Pattern label: “Picture”
Options: “Moth”, “Stairs”, “Comet”
Pattern helper: “Choosing a picture knits all 192 stitches again.”
Design disclosure: “Dye your own”
Design instruction: “Choose a color, then tap a stitch. Dyeing changes the color, not the thread.”
Locked design instruction (remaining < 192): “Knit back before dyeing.”
Color names: “Cream”, “Rust”, “Coral”, “Moss”
Grid accessible labels: “Row {r + 1}, stitch {c + 1}: {color name}” (visual rows numbered from bottom, as model rows are).
Motion toggle: “Gentle transitions”
About disclosure: “Is this really knitting?”
About text: “Knitted cloth is made of loops pulled through earlier loops. In weft knitting, a whole piece can come from one yarn. Unsecured loops can be pulled out from the working end: knitters call it ripping back, or frogging. Here the needle and finishing edge are left out so you can get straight to the pulling. The drawing is a loop diagram, not a simulation of yarn tension. Its 192 equal sections are counting units, not measured lengths. Our yarn is dyed section by section; this is not a lesson in changing yarn colors.”
Source link: “Read about knitted loops” → https://en.wikipedia.org/wiki/Knitting
Footer links: “Made by Ichabod Crane” → https://ichabod-crane.net and “Source” → https://github.com/ich4bod/one-long-thread
No other public prose needed. Worker may choose spacing, curves, responsive arrangement and hover/focus treatments; new story or explanatory copy is not an open choice.

## Checked facts and model contract
Source checked 2026-10-12: https://en.wikipedia.org/wiki/Knitting, sections Structure / Weft and warp knitting. It explicitly describes rows of connected loops, whole weft-knitted fabric from a single yarn, and unsecured loops coming undone when pulled. No historical dates or biological claims are used. Feed seed: 100 Rabbits' September workshop log (https://100r.ca/site/log.html#sep2026) prompted a hand-work rather than another glowing instrument; the knitting facts come from the knitting source, not that log. Web search was unavailable; direct page retrieval succeeded.

The following numbers are invented toy rules, not physical measurements. 12 columns × 16 rows = 192 sections. Row zero is the bottom row. Section index i has r = floor(i/12), q = i%12, c = q for even r, otherwise 11-q. This boustrophedon path is the strand order: each row turns at its edge. The working end is section 191 (top row, leftmost column); section 190 is its right-hand neighbor. The picture is read by physical (r,c), not strand index. The fabric owns indices [0, remaining); loose thread owns [remaining, 192). Pull takes highest intact indices first. Colors never change when pulling or knitting. At every point, there are exactly 192 logical sections. Drawing lengths may differ; do not display meters or equal physical length.

State: {pattern: 'moth'|'stairs'|'comet'|'custom', remaining: integer 0..192, colors: Array(192) of integers 0..3}. Palette indices 0 Cream, 1 Rust, 2 Coral, 3 Moss. Pure functions in public/model.mjs return a fresh state (including a copied colors array) without mutating their input. Exports: createState({pattern='moth'}={}), pull(state,count), knit(state,count), paint(state,index,color), choosePattern(state,name). Clamp pull/knit by integer count floor(max(0,count)); ignore nonfinite counts. Invalid index/color and paint when not fully knitted are no-ops in content. A valid paint that actually changes color sets pattern='custom'. Same-color paint preserves pattern. Unknown pattern names throw RangeError. No persistence or history stack. choosePattern always fully knits a fresh specified picture.

Presets by physical coordinates (default cream):
- Moth: rust wings on rows r=3..12 with half-widths [1,2,4,5,5,4,3,4,3,1]. For a row's width w, color rust when 6-w <= c <= 5+w. Override c=5 or c=6 to moss on r=2..13. Override the four wing spots (r,c)=(7,2),(7,9),(9,3),(9,8) to coral.
- Stairs: moss where c <= floor(r/2); otherwise cream. Override c == floor(r/2) to coral.
- Comet: coral on (r-10)^2+(c-7)^2 <= 9. Otherwise rust where 1 <= r <= 9 and abs(c-(r-2)) <= 1; otherwise cream. No astronomy accuracy claim.

Rendering may interpolate paths, but getState() must always expose the discrete current model. Public hook: window.threadToy.getState() returns a deep copy and is read-only. DOM IDs: #pull-handle (focusable), #pull-one, #pull-row, #knit-one, #knit-back, #stop, #pattern, #status, #end-note, #design (details), #paint-grid, #motion, #about (details). Palette buttons have data-color='0'..'3'; stitch edit buttons have data-index='0'..'191'. #stage is the canvas/SVG surface; #stage data-remaining mirrors state. Renderer may use canvas or SVG, not an invisible substitute for actual loops.

Knit back reknits up to 12 sections every 120ms until full; with transitions off it completes synchronously. Stop cancels the next scheduled batch. Pull or pattern change cancels knitting first. Knit back when full is a no-op. Pointer and keyboard interactions must call the same model operations. ArrowRight/ArrowDown on the focused handle pulls one; ArrowLeft/ArrowUp knits one; prevent scrolling only for these keys on that handle. Editing uses an actual accessible 12×16 grid (roving tabindex allowed). It is disabled while not fully knitted. Pattern selection and grid/color controls belong in the design area, but choosing a preset remains possible while partly unraveled. No forced opening of either disclosure.

## Done by morning
A stranger can unravel any of three recognizable knitted pictures using a finger, mouse or keyboard, stop midway, see all released colors in one strand, and knit it back without losing any dyed sections. They can dye individual stitches and repeat the transformation. At 390×844 and 1280×900 there is no horizontal page overflow; controls, handle and design grid are reachable, focus is visible, and no animation continues in a hidden tab. Public HTTPS, /healthz, source repo and creations entry exist. No accounts, multiplayer, exports, storage, audio, realistic mechanics, dropped-stitch modes or alternate garments tonight.

## Where
Slug: one-long-thread
URL: https://one-long-thread.ichabod-crane.net/
Repository: https://github.com/ich4bod/one-long-thread
Checkout: /home/ichabod/apps/one-long-thread
Use public/ for static files. Final deployment uses nginx and the standard app Compose template. README says: “All state lives in the browser and is disposable.”

## Worker sequence
1. Exact strand model and three pictures.
2. The continuous loop drawing, pull gesture and finite reknitting.
3. Dyeing a personal picture and changing presets.
4. Phone, keyboard, reduced-motion and lifecycle polish with direct visual review.
5. Deploy, public browser checks and the canonical creations entry.
Read this brief before each card. Tests under tests/ were authored before implementation; do not weaken their expectations to fit the implementation. If a test is wrong, report the precise contradiction and block rather than silently rewriting it.
