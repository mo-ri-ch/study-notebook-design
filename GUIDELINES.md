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
- **One idea and at most one activity per slide.** If a slide holds several ideas, split it
  along natural boundaries, with matching titles and a one-line hook to the next slide.
  Never split a single idea across slides.
- **Hands-on where possible.** Typing and seeing results live beats reading.
- **Every activity has ↺ Reset** to put it back to how it started.
- **No greyed-out buttons.** A button appears only when it can be used (e.g. "← Back" only after
  the first step; at the end of a game, one clear "↺ Start again" instead of dead buttons).
- **Put explanations after the thing they explain** (e.g. pros/cons of word pieces after the
  merge game that shows how pieces are learned).
- **Doubts only some readers will have** (e.g. "what about spaces?") are never text on the page.
  They sit behind a small 🤔 beside the box they belong to (`<button class="doubt" data-peek-from="…">`):
  hover or tap shows the question and answer. It's not part of the guide's glowing steps.
  The 🤔's title is **the student's real question, short and specific**, as they'd think it
  (e.g. "Why only between −1 and 1?", not a vague "Isn't a dot product any number?").
- **Details on hover (or tap), not on the page.** Numbers and terms that need a breakdown get a
  "peek" (`data-peek="…"` or `data-peek-from="id"`, dotted underline): the page stays calm and the
  detail is one move away. Works with a tap on phones; Esc or a tap elsewhere closes it.
  Use it freely: **the main idea stays on the page; side details go in peeks** — full names of
  abbreviations (BPE, CBOW, RNN, LSTM), "real models have more", "this picture is simplified",
  history and dates.
- **Don't repeat another course.** E.g. the Transformers course has no writing demo, because
  Build a Tiny LLM already has one.

## Features and keys (shared by all courses)
- G guide me · P pen · ← → back/next · T big text · Esc stop pen/guide (one thing per press).
- Notes written in Guide mode belong to the glowing step; with the guide off only ordinary notes
  show, plus a "✎ N in Guide mode" hint.
- The side list of slides scrolls when it's long.

## Working with Rishal
- Replies in chat: **brief and simple.** He often asks "in brief". Avoid jargon.
- When he asks "what do you think?", give a clear recommendation, then ask before big changes.
- Ask before pushing anything that changes how existing pages look or work.
- After changing the shared design, check that every course still looks and works the same.
