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
- **Explain from scratch.** Assume the student knows very little. When an idea needs background
  (vectors, a neural network, matrix multiplication…), add a short "✏️ Quick basics" slide first.
- **Plain words with concrete examples.** No terse labels like "Interpretable" or "Extra work"
  on their own: say what it means, with an example the student has just seen.
- **Don't over-explain.** Once the main idea is clear, stop. Every extra line or "why" on the page
  can confuse a beginner more than it helps. Later slides answer later questions; if something must
  be said, put it in a hover or a 🤔, not on the page.
- **One idea and at most one activity per slide.** If a slide holds several ideas, split it
  along natural boundaries, with matching titles and a one-line hook to the next slide.
  Never split a single idea across slides.
- **Hands-on where possible.** Typing and seeing results live beats reading.
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
- **Say the idea, not where it was taught.** "Like in Lesson 3" makes the reader stop and try to recall it. Say the
  idea itself in a few words instead ("by counting how often each letter comes next"). Don't name earlier lessons in
  passing, and don't add a link to every mention. Link only when the reader really needs to see something there (a
  table, a number), and name that thing in the link ("the counting table"), not the lesson. Future lessons may be named
  ("coming in Lesson 6").
- **Show the whole when showing part.** If a table shows 5 of 14 items, say where the other 9 are.
- **Be honest about trade-offs** (e.g. learning takes more passes than counting here; say so, and say why it's still worth it).
- **Explain an idea where it first appears,** not a page later.

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
- **Links to other pages open beside the page.** A link to another page or lesson (`<a class="xref" href="lesson3.html#3">`):
  on a laptop the screen splits in two, this page on the left and the linked page on the right, both complete and fully
  working (page list, pen, guide…), like two browser windows side by side. Drag the middle bar to resize; "Go to this
  page →" opens it fully; ✕ or Esc closes the split (the left side keeps where you got to). Clicking the same link again goes there.
  If Guide me is on, the left half keeps guiding from the same glowing step; the right half starts with the guide off
  (turning it on there affects only that half).
  On phones, a look-only box slides up from the bottom instead (drag to pan, pinch / − + to zoom).
  Use `xref` only for the few links worth opening (see "Say the idea, not where it was taught").
- **Show me how: sticky-note steps inside an activity.** When an activity shows several things at once, give it
  steps with `addTour(el, steps, { id })` (in common.js): a sticky note points at one part at a time (a box, a row, a button),
  sets the activity up for that step, dims everything else (like Guide me), and explains it with the real numbers. A step can wait for the reader to press
  something ("Your turn ↑") instead of Next. It opens by itself the first time (not in teach mode or split preview);
  the small "?" button beside ↺ Reset replays it. Skip, ✕ or Esc closes; ← → move while it's open.
  Working correctly is not the same as easy to follow: if a reader can't tell where to look first, add a tour.
- G guide me · P pen · ← → back/next · T big text · Esc stop pen/guide (one thing per press).
- Notes written in Guide mode belong to the glowing step; with the guide off only ordinary notes
  show, plus a "✎ N in Guide mode" hint.
- The side list of slides scrolls when it's long.

## Working with Rishal
- Replies in chat: **brief and simple.** He often asks "in brief". Avoid jargon.
- When he asks "what do you think?", give a clear recommendation, then ask before big changes.
- Ask before pushing anything that changes how existing pages look or work.
- After changing the shared design, check that every course still looks and works the same.
