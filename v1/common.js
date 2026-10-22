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
    const left = Math.min(Math.max(12, r.left), window.innerWidth - pop.offsetWidth - 12);
    const below = r.bottom + 8 + pop.offsetHeight < window.innerHeight;
    pop.style.left = left + "px";
    pop.style.top = (below ? r.bottom + 8 : Math.max(12, r.top - pop.offsetHeight - 8)) + "px";
  }
  function hide() { follow.disconnect(); pop.hidden = true; if (owner) owner.removeAttribute("aria-describedby"); owner = null; pinned = false; }
  document.addEventListener("mouseover", e => { const t = target(e.target); if (t && !pinned) show(t); });
  document.addEventListener("mouseout", e => { const t = target(e.target); if (t && !pinned && !t.contains(e.relatedTarget)) hide(); });
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

document.addEventListener("DOMContentLoaded", () => {
  (COURSE.setup || []).forEach(fn => fn());
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
