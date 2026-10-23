// A page opened inside a link preview (?embed=1) shows only its content
if (new URLSearchParams(location.search).get("embed")) {
  document.documentElement.classList.add("embed");
  const base = document.createElement("base"); base.target = "_top"; document.head.appendChild(base);   // links inside open in the real page
}

// common.js — the shared parts of every course page (study-notebook-design, v1):
// one-part-per-screen lessons, slide thumbnails, progress, quizzes, teach mode, copy and run buttons.
//
// Each course sets window.COURSE in its own assets/course.js, loaded BEFORE this file:
//   window.COURSE = {
//     id: "my-course",              // prefix for everything saved in the browser (progress, notes)
//     pathLabel: "Building the LLM", // label of the step row in each lesson's closing question
//     lessons: [ { n, label?, step, title, file, ready, summary, leaves }, ... ],   // label: shown instead of n, e.g. "1a"
//     setup: [ fn, ... ],            // optional: course-only extras, run before the shared setup
//   };
const COURSE = window.COURSE || {};
const LESSONS = COURSE.lessons || [];
const STORE = COURSE.id || "notebook";

// ---------- Step row ("Building the LLM: ✓ numbers → …") in each lesson's closing question ----------
// One row of steps: done ones get a ✓, the next one is highlighted.
function setupLlmPath() {
  const box = document.querySelector(".open-question");
  if (!box) return;
  const file = location.pathname.split("/").pop();
  const lesson = LESSONS.find(l => l.file === file);
  if (!lesson) return;
  const row = document.createElement("div");
  row.className = "llm-path";
  const label = COURSE.pathLabel || "Course path";
  row.setAttribute("aria-label", `${label}: step ${lesson.n} of ${LESSONS.length} done`);
  let html = `<span class="llm-path-label">${label}:</span>`;
  LESSONS.forEach((l, i) => {
    const state = l.n <= lesson.n ? "done" : l.n === lesson.n + 1 ? "next" : "later";
    html += (i ? '<span class="llm-arrow" aria-hidden="true">→</span>' : "") +
      `<span class="llm-step ${state}">${state === "done" ? "✓ " : ""}${l.step}</span>`;
  });
  row.innerHTML = html;
  box.appendChild(row);
}

// ---------- Progress (saved in this browser only) ----------
const PROGRESS_KEY = STORE + "-progress";

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) { /* storage blocked */ }
}
function isDone(n) { return !!loadProgress()[n]; }
function setDone(n, value) { const p = loadProgress(); p[n] = value; saveProgress(p); }

// ---------- One part per screen ----------
// A lesson page with <main data-paged> shows one <section class="part"> at a time.
let pagedGo = null;

function setupPagedLesson() {
  const main = document.querySelector("main[data-paged]");
  if (!main) return;
  const parts = Array.from(main.querySelectorAll("section.part"));
  const bar = document.querySelector(".progress");
  const back = document.querySelector("[data-page-back]");
  const next = document.querySelector("[data-page-next]");
  const label = document.querySelector("[data-page-label]");

  // Previous / Next sit right below the slide, as quiet text
  const pagebar = document.querySelector(".pagebar");
  if (pagebar) (document.querySelector(".wrap") || main).appendChild(pagebar);

  // Progress bar: one segment per part, each one clickable
  if (bar) {
    parts.forEach((p, i) => {
      const seg = document.createElement("button");
      seg.className = "seg";
      seg.setAttribute("aria-label", `Go to part ${i + 1}: ${p.dataset.title || ""}`);
      seg.addEventListener("click", () => go(i));
      bar.appendChild(seg);
    });
  }

  const thumbs = buildThumbnails(parts, (i) => go(i));
  const seen = new Set();

  // The lessons before and after this one (only ready ones), so the arrows can cross between lessons
  const file = location.pathname.split("/").pop();
  const here = LESSONS.findIndex(l => l.file === file);
  const prevLesson = here > 0 && LESSONS[here - 1].ready ? LESSONS[here - 1] : null;
  const nextLesson = here >= 0 && LESSONS[here + 1] && LESSONS[here + 1].ready ? LESSONS[here + 1] : null;
  const nextText = next ? next.textContent : "";
  // Each page's closing line (.hook) is shown right above the Next link, so it reads as "what's next"
  let hint = null;
  if (next) {
    const side = document.createElement("div");
    side.className = "next-side";
    hint = document.createElement("div");
    hint.className = "next-hint";
    next.replaceWith(side);
    side.append(hint, next);
  }
  const backText = back ? back.textContent : "";

  let current = 0;
  function go(i) {
    // Past the last page: open the next lesson. Before the first page: open the previous lesson's last page.
    if (i > parts.length - 1 && nextLesson) { location.href = nextLesson.file + "#1"; return; }
    if (i < 0 && prevLesson) { location.href = prevLesson.file + "#last"; return; }
    current = Math.max(0, Math.min(parts.length - 1, i));
    seen.add(current);
    parts.forEach((p, k) => { p.hidden = k !== current; });
    if (bar) Array.from(bar.children).forEach((s, k) => {
      s.classList.toggle("now", k === current);
      s.classList.toggle("seen", seen.has(k) && k !== current);
    });
    thumbs.forEach((t, k) => {
      t.classList.toggle("now", k === current);
      t.classList.toggle("seen", seen.has(k) && k !== current);
      if (k === current) t.setAttribute("aria-current", "step"); else t.removeAttribute("aria-current");
    });
    // Keep the current slide's name in view in the side list (only up/down, never sideways)
    if (thumbs[current]) {
      const t = thumbs[current], box = t.closest(".thumbs");
      if (box) {
        const r = t.getBoundingClientRect(), b = box.getBoundingClientRect();
        if (r.top < b.top + 8) box.scrollTop -= b.top + 8 - r.top;
        else if (r.bottom > b.bottom - 8) box.scrollTop += r.bottom - (b.bottom - 8);
        box.scrollLeft = 0;
      }
    }
    if (back) {
      back.disabled = current === 0 && !prevLesson;
      back.textContent = current === 0 && prevLesson ? `← Lesson ${prevLesson.label || prevLesson.n}` : backText;
    }
    if (next) {
      next.hidden = current === parts.length - 1 && !nextLesson;
      next.textContent = current === parts.length - 1 && nextLesson ? `Lesson ${nextLesson.label || nextLesson.n} →` : nextText;
    }
    if (hint) {
      const h = parts[current].querySelector(".hook");
      hint.textContent = h ? h.textContent : "";
      hint.hidden = !h || next.hidden;
    }
    if (label) label.textContent = `${current + 1} / ${parts.length}  ${parts[current].dataset.title || ""}`;
    try { history.replaceState(null, "", `#${current + 1}`); } catch (e) { /* file:// */ }
    window.scrollTo(0, 0);
    const area = document.querySelector(".wrap");
    if (area) area.scrollTop = 0;
  }
  pagedGo = (delta) => go(current + delta);

  if (back) back.addEventListener("click", () => go(current - 1));
  if (next) next.addEventListener("click", () => go(current + 1));

  const start = location.hash === "#last" ? parts.length : parseInt(location.hash.slice(1), 10);
  go(Number.isFinite(start) ? Math.min(start, parts.length) - 1 : 0);

  // Links like lesson4.html#5 jump straight to part 5
  window.addEventListener("hashchange", () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (Number.isFinite(n) && n - 1 !== current) go(n - 1);
  });
}

// ---------- Slide thumbnails on the right ----------
// A list of every part by name; click one to jump to it.
const THUMBS_KEY = STORE + "-thumbs-hidden";

function buildThumbnails(parts, onPick) {
  const aside = document.createElement("aside");
  aside.className = "thumbs";
  aside.setAttribute("aria-label", "Pages in this lesson");

  const toggle = document.createElement("button");
  toggle.className = "thumbs-toggle";
  document.body.appendChild(toggle);

  // Every lesson in order, like a table of contents. The current lesson is open, with its slides indented below it.
  const toc = document.createElement("ol");
  toc.className = "toc";
  aside.appendChild(toc);
  const file = location.pathname.split("/").pop();
  const list = document.createElement("ol");
  list.className = "thumb-list";

  LESSONS.forEach(l => {
    const li = document.createElement("li");
    const here = l.file === file;
    const done = isDone(l.n);
    let head;
    if (here) {
      head = document.createElement("span");
      head.setAttribute("aria-current", "page");
    } else if (l.ready) {
      head = document.createElement("a");
      head.href = l.file;
    } else {
      head = document.createElement("span");
      head.title = "Coming soon";
    }
    head.className = "toc-lesson" + (here ? " here" : "") + (done ? " done" : "") + (l.ready ? "" : " soon");
    head.innerHTML = `<span class="toc-n">${done ? "✓" : (l.label || l.n)}</span><span class="toc-t">${l.title}</span>`;
    li.appendChild(head);
    if (here) li.appendChild(list);
    toc.appendChild(li);
  });

  const items = parts.map((part, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.className = "thumb";
    b.setAttribute("aria-label", `Page ${i + 1}: ${part.dataset.title || ""}`);

    const cap = document.createElement("span");
    cap.className = "thumb-cap";
    cap.innerHTML = `<b>${i + 1}</b> ${part.dataset.title || ""}`;

    b.append(cap);
    b.addEventListener("click", () => onPick(i));
    li.appendChild(b);
    list.appendChild(li);
    return b;
  });
  document.body.appendChild(aside);

  function setHidden(hidden) {
    document.body.classList.toggle("thumbs-off", hidden);
    toggle.textContent = hidden ? "Show pages" : "Hide pages";
    toggle.setAttribute("aria-expanded", hidden ? "false" : "true");
    try { localStorage.setItem(THUMBS_KEY, hidden ? "1" : ""); } catch (e) { /* ignore */ }
  }
  // A simple list of slide names (no previews), like a table of contents
  // Always fits without scrolling: if it's too tall, make it a bit tighter
  function fit() {
    aside.classList.add("compact");
    aside.classList.remove("tight", "tighter");
    if (aside.scrollHeight > aside.clientHeight + 1) aside.classList.add("tight");
    if (aside.scrollHeight > aside.clientHeight + 1) aside.classList.add("tighter");
  }
  window.addEventListener("resize", fit);

  let startHidden = false;
  try { startHidden = localStorage.getItem(THUMBS_KEY) === "1"; } catch (e) { /* ignore */ }
  toggle.addEventListener("click", () => { setHidden(!document.body.classList.contains("thumbs-off")); fit(); });
  setHidden(startHidden);
  document.body.classList.add("has-thumbs");
  fit();

  // Put the lesson title next to "Lesson N of 10" (the big title is hidden on wide screens)
  const where = document.querySelector(".topbar .where");
  const title = document.querySelector(".paged-head h1");
  if (where && title) where.dataset.full = `${where.textContent}: ${title.textContent}`;
  return items;
}

// ---------- Teach mode: press T for big text (for a projector) ----------
function setupTeachMode() {
  document.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "t" || e.key === "T") document.body.classList.toggle("teach");
  });
}

// ---------- Arrow keys move between parts ----------
function setupKeys() {
  document.addEventListener("keydown", (e) => {
    if (!pagedGo) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") pagedGo(1);
    if (e.key === "ArrowLeft") pagedGo(-1);
  });
}

// ---------- Reset: every activity can go back to how it started ----------
// addReset(anyElementInsideTheActivity, functionThatResetsIt)
function addReset(inside, fn) {
  const el = typeof inside === "string" ? document.getElementById(inside) : inside;
  const box = el && el.closest(".activity");
  if (!box) return;
  const b = document.createElement("button");
  b.className = "reset";
  b.type = "button";
  b.textContent = "↺ Reset";
  b.setAttribute("aria-label", "Reset this activity");
  b.addEventListener("click", () => { fn(); b.blur(); });
  box.appendChild(b);
}


// ---------- Copy button on every code block ----------
function setupCopy() {
  document.querySelectorAll("main pre:not(.term-out)").forEach(pre => {
    const b = document.createElement("button");
    b.className = "copy";
    b.type = "button";
    b.textContent = "Copy";
    b.setAttribute("aria-label", "Copy this code");
    // Code with hidden answers gets a "Show output" toggle
    if (pre.classList.contains("has-answers")) {
      const t = document.createElement("button");
      t.className = "copy show-out";
      t.type = "button";
      t.textContent = "Show output";
      t.setAttribute("aria-pressed", "false");
      t.addEventListener("click", () => {
        const on = pre.classList.toggle("answers-on");
        t.textContent = on ? "Hide output" : "Show output";
        t.setAttribute("aria-pressed", on ? "true" : "false");
      });
      pre.appendChild(t);
    }
    b.addEventListener("click", async () => {
      // Copy just the code, without the answers
      const code = (pre.querySelector("code") || pre).cloneNode(true);
      code.querySelectorAll(".ans").forEach(a => {
        const nl = a.nextSibling;
        if (nl && nl.nodeType === 3 && nl.textContent.startsWith("\n")) nl.textContent = nl.textContent.slice(1);
        a.remove();
      });
      const text = code.textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        // Older browsers: copy through a hidden text box
        const area = document.createElement("textarea");
        area.value = text; document.body.appendChild(area); area.select();
        try { document.execCommand("copy"); } catch (e2) { /* nothing more we can do */ }
        area.remove();
      }
      b.textContent = "✓ Copied";
      setTimeout(() => { b.textContent = "Copy"; }, 1500);
    });
    pre.appendChild(b);
  });
}

// ---------- ▶ Run: show the code's real output in a small terminal ----------
function setupRun() {
  document.querySelectorAll(".run-area").forEach(area => {
    const button = area.querySelector(".run-code");
    const term = area.querySelector(".terminal");
    button.addEventListener("click", () => {
      const open = term.hidden;
      term.hidden = !open;
      button.textContent = open ? "Hide output" : "▶ Run";
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) term.scrollIntoView({ block: "nearest" });
    });
  });
}

// ---------- Clickable quizzes ----------
// <div class="quiz"><button data-right>…</button><button>…</button><div class="feedback"></div></div>
function setupQuizzes() {
  document.querySelectorAll(".quiz").forEach(quiz => {
    const feedback = quiz.querySelector(".feedback");
    const again = document.createElement("button");
    again.className = "reset quiz-reset";
    again.type = "button";
    again.textContent = "↺ Try again";
    again.hidden = true;
    again.addEventListener("click", () => {
      quiz.querySelectorAll(".options button").forEach(x => x.classList.remove("right", "wrong"));
      if (feedback) { feedback.textContent = ""; feedback.className = "feedback"; }
      again.hidden = true;
    });
    quiz.appendChild(again);
    quiz.querySelectorAll(".options button").forEach(b => {
      b.addEventListener("click", () => {
        quiz.querySelectorAll(".options button").forEach(x => x.classList.remove("right", "wrong"));
        const right = b.hasAttribute("data-right");
        b.classList.add(right ? "right" : "wrong");
        if (feedback) {
          feedback.innerHTML = right ? (quiz.dataset.right || "Right!") : (b.dataset.why || "Not quite. Try another.");
          feedback.className = "feedback " + (right ? "good" : "bad");
        }
        again.hidden = false;
      });
    });
  });
}

// ---------- Predict-first boxes (click to reveal) ----------
function setupPredictions() {
  document.querySelectorAll(".predict").forEach(box => {
    const button = box.querySelector("[data-reveal]");
    if (!button) return;
    button.addEventListener("click", () => {
      const open = box.classList.toggle("open");
      button.textContent = open ? "Hide answer" : "Show answer";
    });
  });
}

// ---------- Walkthroughs: show one step at a time ----------
function setupWalkthroughs() {
  document.querySelectorAll(".walk").forEach(walk => {
    const stages = Array.from(walk.querySelectorAll(".stage"));
    const next = walk.querySelector("[data-walk-next]");
    const all = walk.querySelector("[data-walk-all]");
    const count = walk.querySelector(".count");
    let shown = 1;
    function render() {
      stages.forEach((s, i) => s.classList.toggle("shown", i < shown));
      if (count) count.textContent = `Step ${shown} of ${stages.length}`;
      if (next) next.disabled = shown >= stages.length;
    }
    if (next) next.addEventListener("click", () => {
      shown = Math.min(stages.length, shown + 1);
      render();
      stages[shown - 1].scrollIntoView({ block: "nearest" });
    });
    if (all) all.addEventListener("click", () => { shown = stages.length; render(); });
    render();
  });
}

// ---------- "Mark as done" button ----------
function setupDoneToggle() {
  const button = document.querySelector("[data-done]");
  if (!button) return;
  const n = Number(button.dataset.done);
  function render() {
    const done = isDone(n);
    button.setAttribute("aria-pressed", done ? "true" : "false");
    button.textContent = done ? "✓ Lesson done" : "Mark lesson as done";
  }
  button.addEventListener("click", () => { setDone(n, !isDone(n)); render(); });
  render();
}


// ---------- Peek: more detail on hover (or tap), so pages stay uncluttered ----------
// <span data-peek="Short extra detail">11 pieces</span>            shows that text
// <span data-peek-from="someId">11 pieces</span>                   shows the current contents of #someId
// The element gets a dotted underline so people know there's more. Tap works on phones; Esc or a tap elsewhere closes.
function setupPeeks() {
  const pop = document.createElement("div");
  pop.className = "peek-pop"; pop.hidden = true; pop.setAttribute("role", "tooltip"); pop.id = "peekPop";
  document.body.appendChild(pop);
  let owner = null, pinned = false;
  // An open peek follows its source: type in a box or press a button, and it updates right away
  const follow = new MutationObserver(() => { if (owner && !pop.hidden) show(owner); });
  const target = el => el && el.closest && el.closest("[data-peek], [data-peek-from]");
  function show(el) {
    const from = el.dataset.peekFrom && document.getElementById(el.dataset.peekFrom);
    pop.innerHTML = from ? from.innerHTML : el.dataset.peek;
    follow.disconnect();
    if (from) follow.observe(from, { childList: true, subtree: true, characterData: true });
    pop.hidden = false; owner = el; el.setAttribute("aria-describedby", "peekPop");
    // Short peeks stay narrow; longer ones get more room, so they don't become tall towers
    const long = pop.textContent.length > 160;
    const r = el.getBoundingClientRect(), w = Math.min(long ? 460 : 340, window.innerWidth - 24);
    pop.style.maxWidth = w + "px";
    place(r);
  }
  // Put the peek where it fits, and never on top of the thing being hovered (that would close it at once)
  function place(r) {
    const M = 12, G = 8, W = window.innerWidth, H = window.innerHeight;
    pop.style.maxHeight = ""; pop.style.overflowY = "";
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const roomBelow = H - r.bottom - G - M, roomAbove = r.top - G - M;
    const roomLeft = r.left - G - M, roomRight = W - r.right - G - M;
    const clampX = x => Math.min(Math.max(M, x), W - w - M), clampY = y => Math.min(Math.max(M, y), H - h - M);
    let left, top;
    if (h <= roomBelow) { left = clampX(r.left); top = r.bottom + G; }
    else if (h <= roomAbove) { left = clampX(r.left); top = r.top - G - h; }
    else if (w <= roomLeft) { left = r.left - G - w; top = clampY(r.top + r.height / 2 - h / 2); }
    else if (w <= roomRight) { left = r.right + G; top = clampY(r.top + r.height / 2 - h / 2); }
    else {
      // Nowhere fits fully: use the bigger side and let the peek scroll inside
      const below = roomBelow >= roomAbove, room = Math.max(80, below ? roomBelow : roomAbove);
      pop.style.maxHeight = room + "px"; pop.style.overflowY = "auto";
      left = clampX(r.left); top = below ? r.bottom + G : r.top - G - Math.min(h, room);
    }
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }
  function hide() { clearTimeout(closing); follow.disconnect(); pop.hidden = true; if (owner) owner.removeAttribute("aria-describedby"); owner = null; pinned = false; }
  // Closing waits a moment, so the mouse can cross the small gap from a word to its peek (to click a link in it)
  let closing = null;
  const stay = () => { clearTimeout(closing); closing = null; };
  const hideSoon = () => { stay(); closing = setTimeout(() => { if (!pinned) hide(); }, 300); };
  document.addEventListener("mouseover", e => { const t = target(e.target); if (t && !pinned) { stay(); if (owner !== t || pop.hidden) show(t); } });
  document.addEventListener("mouseout", e => {
    const t = target(e.target);
    if (t && !pinned && !t.contains(e.relatedTarget) && !pop.contains(e.relatedTarget)) hideSoon();
  });
  // You can move onto the peek to read it; it closes when you leave it (unless you go back to its word)
  pop.addEventListener("mouseenter", stay);
  pop.addEventListener("mouseleave", e => { if (!pinned && !(owner && owner.contains(e.relatedTarget))) hideSoon(); });
  document.addEventListener("focusin", e => { const t = target(e.target); if (t) show(t); });
  document.addEventListener("focusout", e => { if (target(e.target) && !pinned) hide(); });
  document.addEventListener("click", e => {
    const t = target(e.target);
    if (t) { if (pinned && owner === t) hide(); else { show(t); pinned = true; } return; }
    if (!pop.contains(e.target)) hide();
  });
  // Esc closes the peek first (and only that: the guide waits for the next Esc)
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !pop.hidden) { e.preventDefault(); hide(); } }, true);
  document.addEventListener("scroll", () => { if (!pinned) hide(); }, true);
  // Peek targets can be reached with the keyboard
  new MutationObserver(mark).observe(document.body, { childList: true, subtree: true });
  function mark() { document.querySelectorAll("[data-peek]:not([tabindex]), [data-peek-from]:not([tabindex])").forEach(el => el.tabIndex = 0); }
  mark();
}

// ---------- Link previews: a link to another page (a.xref) first shows that page in a small box ----------
// Click once: a live, shrunk view of the exact page opens beside the link. Click the link again, or
// "Go to this page →", to go there. Esc, ✕ or a click elsewhere closes it. On phones it slides up from the bottom.
function setupLinkPreviews() {
  if (document.documentElement.classList.contains("embed")) return;
  const wide = () => window.innerWidth >= 900;
  // Inside one half of a split screen: links open (or replace) the right half of the top page
  let topSplit = null;
  try { topSplit = window.parent !== window && window.parent.__notebookSplit; } catch (e) { topSplit = null; }
  if (topSplit) {
    document.addEventListener("click", e => {
      const link = e.target.closest && e.target.closest("a.xref");
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      topSplit.open(link.href, link.textContent.trim());
    });
    return;
  }
  // ----- Wide screens: split the screen. This page on the left, the linked page on the right, both fully working -----
  let split = null, splitHref = null;
  function openSplit(href, name) {
    if (split && splitHref === href) { location.href = href; return; }   // same link again: go there
    if (!split) {
      split = document.createElement("div");
      split.className = "split-view";
      split.innerHTML = `<iframe class="split-left" title="This page"></iframe>
        <div class="split-bar" role="separator" aria-label="Drag to resize the two halves"></div>
        <div class="split-right"><div class="split-head"><span class="split-name"></span>
          <a class="xref-go" target="_top">Go to this page →</a>
          <button type="button" class="xref-close" aria-label="Close the split screen">✕</button></div>
          <iframe class="split-frame" title="Linked page"></iframe></div>`;
      split.querySelector(".split-left").src = location.href;
      split.querySelector(".xref-close").addEventListener("click", closeSplit);
      // drag the middle bar to resize
      const bar = split.querySelector(".split-bar");
      bar.addEventListener("pointerdown", e => {
        bar.setPointerCapture(e.pointerId); split.classList.add("dragging");
        const move = ev => { const x = Math.max(280, Math.min(window.innerWidth - 280, ev.clientX)); split.style.gridTemplateColumns = `${x}px 8px 1fr`; };
        const up = () => { split.classList.remove("dragging"); bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); };
        bar.addEventListener("pointermove", move); bar.addEventListener("pointerup", up);
      });
      document.body.appendChild(split);
      document.documentElement.classList.add("split-open");
    }
    splitHref = href;
    split.querySelector(".split-frame").src = href;
    split.querySelector(".split-name").textContent = name || "";
    split.querySelector(".xref-go").href = href;
  }
  function closeSplit() {
    if (!split) return;
    // Carry over where you got to on the left
    try {
      const l = split.querySelector(".split-left").contentWindow.location;
      if (l.pathname !== location.pathname) { location.href = l.href; return; }
      if (l.hash && l.hash !== location.hash) location.hash = l.hash;
    } catch (e) { /* not reachable */ }
    split.remove(); split = null; splitHref = null;
    document.documentElement.classList.remove("split-open");
  }
  window.__notebookSplit = { open: openSplit, close: closeSplit };
  document.addEventListener("keydown", e => { if (e.key === "Escape" && split) { e.preventDefault(); closeSplit(); } });

  // ----- Narrow screens (phones): a look-only box slides up from the bottom -----
  let box = null, owner = null, k = null;
  const pageW = () => window.innerWidth < 640 ? 520 : 1000;   // the previewed page is laid out this wide (phone or laptop layout), then shrunk or enlarged
  function zoom(dir) {
    if (!box) return;
    const steps = [0.4, 0.5, 0.62, 0.75, 0.9, 1, 1.15, 1.3, 1.5];
    const now = k || fitK();
    k = dir > 0 ? (steps.find(v => v > now + 0.001) || now) : ([...steps].reverse().find(v => v < now - 0.001) || now);
    place();
  }
  function fitK() { return (window.innerWidth < 640 ? window.innerWidth : Math.min(620, window.innerWidth - 24)) / pageW(); }
  // Smooth zoom (pinch, Ctrl + wheel), keeping the point under the finger/mouse still
  function zoomBy(f, cx, cy) {
    if (!box) return;
    const view = box.querySelector(".xref-view"), win = box.querySelector("iframe").contentWindow;
    const old = k || fitK(), nk = Math.max(0.3, Math.min(2, old * f));
    const r = view.getBoundingClientRect(), px = cx - r.left, py = cy - r.top;
    const pageX = (view.scrollLeft + px) / old, pageY = (win ? win.scrollY : 0) + py / old;
    k = nk; place();
    view.scrollLeft = pageX * nk - px;
    if (win) win.scrollTo(0, pageY - py / nk);
  }
  function close() { if (box) box.remove(); box = null; owner = null; }
  function open(link) {
    close();
    owner = link;
    const url = new URL(link.href, location.href);
    const inner = new URL(url); inner.searchParams.set("embed", "1");
    box = document.createElement("div");
    box.className = "xref-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Preview of " + link.textContent.trim());
    box.innerHTML = `<div class="xref-bar"><span class="xref-name"></span>
        <span class="xref-zoom"><button type="button" data-z="-1" aria-label="Zoom out">−</button><span class="xref-pct"></span><button type="button" data-z="1" aria-label="Zoom in">+</button></span>
        <a class="xref-go" href="${url.href}">Go to this page →</a>
        <button type="button" class="xref-close" aria-label="Close preview">✕</button></div>
      <div class="xref-view"><div class="xref-size"><iframe title="Preview" loading="eager"></iframe></div><div class="xref-wait">Loading…</div></div>`;
    box.querySelector(".xref-name").textContent = link.textContent.trim();
    const frame = box.querySelector("iframe");
    frame.addEventListener("load", () => { const w = box && box.querySelector(".xref-wait"); if (w) w.remove(); });
    frame.src = inner.href;
    box.querySelector(".xref-close").addEventListener("click", close);
    panAndZoom(box.querySelector(".xref-view"), frame);
    box.querySelectorAll(".xref-zoom button").forEach(b => b.addEventListener("click", () => zoom(Number(b.dataset.z))));
    k = null;   // start at the size that fits
    document.body.appendChild(box);
    place();
  }
  // Look only: drag to pan, wheel to scroll, pinch or Ctrl + wheel to zoom. The page inside can't be clicked or typed in.
  function panAndZoom(view, frame) {
    const win = () => frame.contentWindow;
    const pts = new Map();
    let last = null, spread = 0;
    view.addEventListener("pointerdown", e => { view.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); last = [e.clientX, e.clientY]; spread = 0; });
    view.addEventListener("pointermove", e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) {   // pinch
        const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (spread) zoomBy(d / spread, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        spread = d; return;
      }
      const z = k || fitK();
      view.scrollLeft -= e.clientX - last[0];
      if (win()) win().scrollBy(0, -(e.clientY - last[1]) / z);
      last = [e.clientX, e.clientY];
    });
    const up = e => { pts.delete(e.pointerId); spread = 0; if (pts.size === 1) last = [...pts.values()][0]; };
    view.addEventListener("pointerup", up); view.addEventListener("pointercancel", up);
    view.addEventListener("wheel", e => {
      e.preventDefault();
      if (e.ctrlKey) { zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX, e.clientY); return; }
      const z = k || fitK();
      view.scrollLeft += e.deltaX;
      if (win()) win().scrollBy(0, e.deltaY / z);
    }, { passive: false });
  }
  function place() {
    if (!box || !owner) return;
    const phone = window.innerWidth < 640;
    box.classList.toggle("sheet", phone);
    const view = box.querySelector(".xref-view"), frame = box.querySelector("iframe"), sizer = box.querySelector(".xref-size");
    const w = phone ? window.innerWidth : Math.min(620, window.innerWidth - 24);
    const h = phone ? Math.round(window.innerHeight * 0.55) : Math.min(400, window.innerHeight - 140);
    const z = k || fitK();   // how much the page is shrunk (or enlarged) inside the box
    view.style.height = h + "px";
    // The page keeps its width; when zoomed in, the box scrolls sideways, and the page scrolls up and down inside
    frame.style.width = pageW() + "px"; frame.style.height = Math.round(h / z) + "px"; frame.style.transform = `scale(${z})`;
    sizer.style.width = Math.round(pageW() * z) + "px"; sizer.style.height = h + "px";
    box.querySelector(".xref-pct").textContent = Math.round(z / fitK() * 100) + "%";
    if (phone) { box.style.left = "0"; box.style.top = ""; box.style.width = "100%"; return; }
    box.style.width = w + "px";
    const r = owner.getBoundingClientRect(), bh = box.offsetHeight;
    let top = r.bottom + 8;
    if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 8);   // no room below: open above
    box.style.top = top + "px";
    box.style.left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12)) + "px";
  }
  document.addEventListener("click", e => {
    const link = e.target.closest && e.target.closest("a.xref");
    if (link) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;   // new tab etc.: as usual
      if (wide()) {
        e.preventDefault(); close(); openSplit(link.href, link.textContent.trim()); return;
      }
      if (link === owner) return;   // second click: go there
      e.preventDefault();
      open(link);
      return;
    }
    if (box && !box.contains(e.target)) close();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && box) { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  window.addEventListener("resize", place);
  document.addEventListener("scroll", () => { if (box && !box.classList.contains("sheet")) place(); }, true);
}

document.addEventListener("DOMContentLoaded", () => {
  (COURSE.setup || []).forEach(fn => fn());
  setupLinkPreviews();
  setupPagedLesson();
  setupCopy();
  setupRun();
  setupTeachMode();
  setupKeys();
  setupQuizzes();
  setupPredictions();
  setupWalkthroughs();
  setupDoneToggle();
  setupLlmPath();
  setupPeeks();
});
