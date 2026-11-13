# Design guidelines

What Rishal (the owner) has asked for while building these courses. Follow these in every course
and every change. Add to this file whenever he gives new design advice.

## The feel
- **Comfy, not scary.** A beginner should never feel overwhelmed. Invite curiosity.
- **Little to read.** Short lines, plain words. The home page especially: a title, one line, the path.
- **Empty space, few distractions.** Calm pages. Highlighters only where something matters.
- **The notebook look.** Ruled paper, handwritten headings, coloured highlighters with meaning,
  sticky notes, red-pen notes. Keep it consistent across courses.

## Lessons
- **Teach every new thing before it's used.** Before a page shows code or an idea, check that each part of it
  (a Python word, a pattern, a dictionary, a symbol) was taught on an earlier page, is explained on that page, or
  has a tap-for-help. If a whole lesson leans on background it hasn't taught (e.g. reading Python), add a
  "✏️ Quick basics" page first. If something can be avoided instead (a regex where a plain loop would do), avoid it.
- **Explain from scratch.** Assume the student knows very little. When an idea needs background
  (vectors, a neural network, matrix multiplication…), add a short "✏️ Quick basics" slide first.
- **Plain words with concrete examples.** No terse labels like "Interpretable" or "Extra work"
  on their own: say what it means, with an example the student has just seen.
- **Write for a beginner, sentence by sentence.** No compressed lines ("That saved numbers.",
  "its partner × the push"): say what, compared with what, and why, in full plain words. Each "it",
  "this" or "that" must point to something on the page. Read every sentence as a first-time
  student: if it needs the reader to fill a gap, fill it.
- **Describe first, then name.** When a page brings in something new (a new kind of number, a new step, a
  new term), say what it is in plain words first, then give its name, and only then use the name: "Each seat also
  has 3 numbers of its own, always the same for that seat. These are called position numbers." No "New" labels.
- **One word for one thing.** Don't use "number", "score" and "weight" loosely; each names one
  thing all through a lesson. Use the real term (e.g. "embedding") once it is introduced, not a
  made-up one.
- **A rule comes with real numbers.** Never a formula in words on its own ("its partner × the push"):
  show it on a row the student can see (−0.04 × 1.31, push −0.80), then let the activity repeat it.
- **No "page 3" or "Lesson 5" in the text.** Say what the thing is ("the score table", "before",
  "three tables") instead of where it was.
- **Don't over-explain.** Once the main idea is clear, stop. Every extra line or "why" on the page
  can confuse a beginner more than it helps. Later slides answer later questions; if something must
  be said, put it in a hover or a 🤔, not on the page.
- **One idea and at most one activity per slide.** If a slide holds several ideas, split it
  along natural boundaries, with matching titles and a one-line hook to the next slide.
  Never split a single idea across slides.
- **Hands-on where possible.** Typing and seeing results live beats reading.
- **Animate enough to understand.** When numbers flow or a new part appears (a score becoming a
  push, a push going back to each number), show it moving, one step at a time (a "Next step →"
  button), not as one finished table. Hidden parts keep their space so nothing jumps; respect
  reduced-motion.
- **Don't say it twice.** If the activity walks through an example, the text above gives only the
  idea in a few sentences. The numbers live in the activity.
- **Pictures where they explain better than words** (e.g. arrows for embeddings). Always our own
  drawings in the notebook style, ideally ones that move or respond; never copied from lecture slides.
- **An activity fits on one laptop screen** (about 650px tall), so it can be presented without scrolling. Big data goes in small pictures (shaded grids, hover to read a number), with the numbers shown only for the part in use.
- **Every activity has ↺ Reset** to put it back to how it started.
- **No greyed-out buttons.** A button appears only when it can be used (e.g. "← Back" only after
  the first step; at the end of a game, one clear "↺ Start again" instead of dead buttons).
- **Put explanations after the thing they explain** (e.g. pros/cons of word pieces after the
  merge game that shows how pieces are learned).
- **Show equations as real equations, not in words** (a fraction with a line, powers raised), and
  work them through with the slide's own numbers (e.g. softmax: e²·⁰ / (e²·⁰ + e⁰·⁵ + e⁰·¹) = 73%).
  Keep them short enough to fit a phone.
- **Doubts only some readers will have** (e.g. "what about spaces?") are never text on the page.
  They sit behind a small 🤔 beside the box they belong to (`<button class="doubt" data-peek-from="…">`):
  hover or tap shows the question and answer. It's not part of the guide's glowing steps.
  The 🤔's title is **the student's real question, short and specific**, as they'd think it
  (e.g. "Why only between −1 and 1?", not a vague "Isn't a dot product any number?").
  The **answer is easy to grasp**: a few short lines, plain words, an example from the slide, and no
  terms the lesson hasn't taught yet.
- **Details on hover (or tap), not on the page.** Numbers and terms that need a breakdown get a
  "peek" (`data-peek="…"` or `data-peek-from="id"`, dotted underline): the page stays calm and the
  detail is one move away. Works with a tap on phones; Esc or a tap elsewhere closes it.
  Use it freely: **the main idea stays on the page; side details go in peeks** — full names of
  abbreviations (BPE, CBOW, RNN, LSTM), "real models have more", "this picture is simplified",
  history and dates.
- **Don't repeat another course.** E.g. the Transformers course has no writing demo, because
  Build a Tiny LLM already has one.

- **Explain properly; never assume the student already gets it.** Say what changes, why, and show it with the
  slide's real numbers. Avoid vague words ("harder push", "size", "magnitude"); say it plainly ("the further from 0,
  the more it moves"). More words are fine when they make it clearer; keep each sentence short.
- **Never make the student remember.** Show again what a page relies on (e.g. the training text, with the part the
  page talks about highlighted).
- **Teach before you use.** Never use a word, number, control or idea the reader hasn't been taught yet (e.g. a
  "step size" menu before step size is explained). Introduce it first, with real numbers, then use it. Before adding
  anything to a page, check every term on it was taught on an earlier page or right there. This includes hidden
  🤔 notes, hovers and quiz feedback: a reader can open them all. (Build a Tiny LLM checks this with tools/check_terms.py;
  add each lesson's new words to its list.)
- **Under about 120 words per page**, outside the activity (up to about 150 for a page that introduces a new rule).
  Say each idea once. Side details go into a 🤔, the activity's own notes, or its sticky-note tour. But never trim
  below **one fully worked example in the text**: the reader must see the rule work on real numbers before pressing
  anything. (Build a Tiny LLM checks this with tools/check_pages.py.)
- **Say the idea, not where it was taught.** "Like in Lesson 3" makes the reader stop and try to recall it. Say the
  idea itself in a few words instead ("by counting how often each letter comes next"). Don't name earlier lessons in
  passing, and don't add a link to every mention. Link only when the reader really needs to see something there (a
  table, a number), and name that thing in the link ("the counting table"), not the lesson. Future lessons may be named
  ("coming in Lesson 6").
- **Show the whole when showing part.** If a table shows 5 of 14 items, say where the other 9 are.
- **Be honest about trade-offs** (e.g. learning takes more passes than counting here; say so, and say why it's still worth it).
- **Explain an idea where it first appears,** not a page later.

- **Box the key equations.** Put an equation the student must remember inside the sentence as `<b class="eqbox">gradient = chance − goal</b>` (light yellow note, inked border). One idea per box; never box a whole calculation.

- **One step per line.** When a sentence chains a calculation (a = b = c, or "…, which is…, so…"), put each step on its own line with `<br>` inside the same paragraph. Keep the lines of one idea inside **one element**: Guide me glows one element at a time, so separate elements would glow separately.

- **A 🤔 beside its line.** The 🤔 normally sits at the top-right of its paragraph. When it explains one line of a longer paragraph, wrap that line in `<span class="near">…</span>` (with the button inside) so it sits right beside it.

## Lesson tests
- Each lesson ends with a **test** (`<div class="test" data-test="N">` holding `.quiz` questions; set `test: <page>` on the
  lesson in the course list). One question per key idea; only what was taught.
- Questions make the student **think, not recall**: predict an outcome, apply the idea to new numbers, work a small
  calculation, spot the mistake in a claim. Plausible wrong answers, each with its own short "why".
- Each question has `data-page` / `data-topic`: a wrong answer links to the page to re-read.
- Pass = every question right (retries allowed). The first-try score is shown honestly, with the pages worth another look.
- The next lesson gently reminds you if you haven't passed (with "Continue anyway"); never a hard lock.
- **Teaching (T):** no reminders, nothing counts; picking an answer only marks it, and "Reveal the answer" shows it,
  so a class can think and vote first.

## Supporting the work
- **Ask gently, only at the end, and only from Lesson 3 on** (readers first see what the notebook is
  like; `supportFrom` in course.js changes this). A lesson's last page shows one quiet pencil line under Next:
  "Enjoyed this lesson? Support our work →", linking to gradlabs.in/support. When a whole
  notebook is finished (its last lesson, every lesson ready), its last page shows a small taped card
  instead. Never on other pages, never in teach mode (T) or a split-screen preview.
- Built into common.js, so every notebook gets it. A notebook can change the link with
  `support: "https://…"` in its course.js, or turn it off with `support: false`.
- Kind, never pushy: no pop-ups, no amounts on the lesson page, no guilt.

## Features and keys (shared by all courses)
- **Python words (tap a dotted word in code).** The shared list lives in `v1/codewalk.js`. A course adds its own words,
  or replaces one, by setting `window.PYWORDS_EXTRA = { word: { what, ex, out } }` in its `assets/course.js`
  (loaded before codewalk.js). Run every `ex` in Python and check it prints `out`.
- **Links to other pages open beside the page.** A link to another page or lesson (`<a class="xref" href="lesson3.html#3">`):
  on a laptop the screen splits in two, this page on the left and the linked page on the right, both complete and fully
  working (page list, pen, guide…), like two browser windows side by side. Drag the middle bar to resize; "Go to this
  page →" opens it fully; ✕ or Esc closes the split (the left side keeps where you got to). Clicking the same link again goes there.
  If Guide me is on, the left half keeps guiding from the same glowing step; the right half starts with the guide off
  (turning it on there affects only that half).
  On phones, a look-only box slides up from the bottom instead (drag to pan, pinch / − + to zoom).
  Use `xref` only for the few links worth opening (see "Say the idea, not where it was taught").
- **Eagle-eye view: nothing happens off-screen.** Rishal wants to understand everything that happens, and see the
  whole picture. Whenever numbers change (a learning step, a sum, a push), the reader can watch it happen: step by
  step (one press = one step, with ◀ Back), or played slowly (▶ Play / ⏸ Pause), with the math of the latest step
  shown in real numbers (old → new) and where it's heading (goals, best possible). Never just show a result.
- **Page addresses use gradlabs.in.** Any link to a course page that students see (notebook headers, READMEs, links
  between courses) points to gradlabs.in/learn/<course>/…, never to github.io. Colab notebooks still open from GitHub
  (Colab needs that), but the link back inside them goes to gradlabs.in.
- **Show me how: sticky-note steps inside an activity.** When an activity shows several things at once, give it
  steps with `addTour(el, steps, { id })` (in common.js): a sticky note points at one part at a time (a box, a row, a button),
  sets the activity up for that step, dims everything else (like Guide me), and explains it with the real numbers. A step can wait for the reader to press
  something ("Your turn ↑") instead of Next. It never opens by itself (Rishal, 9 Nov 2026): the reader starts it with the
  small "?" button beside ↺ Reset. Until they have opened it once, the "?" pulses gently. Skip, ✕ or Esc closes; ← → move while it's open.
  With Guide me on: the guide never opens notes or Step through by itself (and notes don't auto-open). When the glow
  is on something that has them, the guide bar says so ("? = a walk-through…", "👣 Step through = …"). Once you
  click ? or 👣, → and ← move inside it; after the last note or line, → leaves it and the guide carries on.
  Working correctly is not the same as easy to follow: if a reader can't tell where to look first, add a tour.
- **Swipe on phones, like flipping cards:** drag a page sideways and it follows your finger, with the next (or previous)
  page sliding in beside it. Let go past a third of the screen, or flick, to move on; otherwise it springs back. At the
  ends it just stretches. While sticky notes, Step through or Guide me are on, a swipe acts like → / ← instead. Ignored
  on sliders, the cube, wide tables, the pen, link previews and at the screen edge. Add data-no-swipe to anything else
  dragged sideways. On every screen, a page changed with the arrows or Next slides in from its side (not with reduced motion).
- G guide me · P pen · ← → back/next · T big text · Esc stop pen/guide (one thing per press).
- Notes written in Guide mode belong to the glowing step; with the guide off only ordinary notes
  show, plus a "✎ N in Guide mode" hint.
- The side list of slides scrolls when it's long.

## Dark theme
- A 🌙/☀️ button in the top bar (added by `common.js`) switches the theme. The choice is saved as `notebook-theme` and shared by every course. Light is the default; dark never turns on by itself.
- Colors only through variables (`--paper`, `--ink`, `--pen`, `--redpen`, `--good`, `--hl-*`, `--note-*`, `--card`). No hard-coded hex in lessons, including SVG (`stroke="var(--pen)"`). Exception: pastel chips that carry their own dark text.
- Text on a note color (`--note-*`) uses `--ink`. `--on-hl` is only for text on the bright highlights (`--hl-*`), because notes turn dark in the dark theme.
- Every page has this one line in `<head>`, before the stylesheet, so the saved theme applies before the page draws: `<script>try{if(localStorage.getItem("notebook-theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}</script>` (the starter has it).
- Check every new activity in both themes before pushing.

## All on one page
- Every lesson page has a small 📜 button in the top bar (hover: "Show every page of this lesson on one long page"). It shows every part one under the other, to scroll through; the 📖 button goes back. Off by default, remembered per course (`<course id>-view-all` in localStorage).
- In that view the side list follows the part at the top, Previous/Next buttons and the support note are hidden, parts are separated by a dashed line, and each part's closing hook stays as a quiet line under it, and links to the previous and next lesson sit at the end.
- Page scripts must not assume only one part is visible (measure sizes when the part is shown, as with `ResizeObserver`; don't act on `hidden` changes).

## Working with Rishal
- Replies in chat: **always brief and simple**, without being asked. Avoid jargon.
- When he asks "what do you think?", give a clear recommendation, then ask before big changes.
- Ask before pushing anything that changes how existing pages look or work.
- After changing the shared design, check that every course still looks and works the same.
- **A rule and its box share one line.** "The rule: [boxed equation]" goes on its own line (`<br>` before it), never wrapped so the box drops under its label. Keep any short idea (a rule, a worked line) whole on one line.
- **Concept, then practice.** After every 2 to 3 idea pages, add a "✏️ Practice" page (titled "✏️ Practice 4.1", "4.2" … by lesson, with `<section class="part" data-nonum …>`: practice pages get no page number in the sidebar and do not count in the numbers of the other pages): a few problems that make the reader *apply* the ideas to new numbers (type the answer, Check, a hint when wrong, Show working, ↺ Reset). Recall questions are not practice. Practice pages stay out of the way of the concept pages, which keep their word limit.
- **A practice page uses only what the pages before it taught.** Place it right after the last idea it needs, and restate any rule it uses (boxed) at the top of the page, so nothing has to be remembered or looked up. A rule taught later waits for a later practice page.
- **Every practice page opens with a "Remember:" block** of the equations and rules its problems use (key equations boxed, one per line), so the reader never goes back to look them up.
