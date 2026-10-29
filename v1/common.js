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
//     support: "https://…",         // optional: where the end-of-lesson support note links; false hides it
//     supportFrom: 3,               // optional: the first lesson (as numbered for readers) that shows it
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
      seg.setAttribute("aria-label", `Go to ${p.hasAttribute("data-nonum") ? "" : "part " + pageNumber(parts, i) + ": "}${p.dataset.title || ""}`);
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
  // On the last page, when the next lesson isn't out yet, say so where its link would be
  const upcoming = here >= 0 && LESSONS[here + 1] && !LESSONS[here + 1].ready ? LESSONS[here + 1] : null;
  let soon = null;
  if (next && upcoming) {
    soon = document.createElement("span");
    soon.className = "next-soon";
    soon.textContent = `Lesson ${upcoming.label || upcoming.n}: coming soon`;
    next.after(soon);
  }
  const backText = back ? back.textContent : "";

  // A gentle support note on a lesson's last page: one quiet line under Next, or, at the end of a
  // finished notebook, a small card. Not in the first lessons (a reader first sees what the notebook
  // is like), on other pages, in teach mode, or in a split-screen preview.
  const supportUrl = COURSE.support === false ? null : COURSE.support || "https://gradlabs.in/support";
  const lessonNo = here >= 0 ? parseInt(LESSONS[here].label || LESSONS[here].n, 10) : NaN;
  let support = null;
  if (supportUrl && pagebar && lessonNo >= (COURSE.supportFrom || 3)) {
    const courseDone = here >= 0 && here === LESSONS.length - 1 && LESSONS.every(l => l.ready);
    support = document.createElement("div");
    support.className = courseDone ? "support-note card" : "support-note";
    support.innerHTML = courseDone
      ? `<h3>You finished the notebook!</h3><p>If it helped you, every bit helps us keep going.</p><a class="support-btn" href="${supportUrl}" target="_blank" rel="noopener">Support the work →</a>`
      : `<a href="${supportUrl}" target="_blank" rel="noopener">Enjoyed this lesson? Support our work →</a>`;
    pagebar.after(support);
  }

  let current = 0, first = true, quiet = false;   // quiet: a finished drag already slid the page in
  const still = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function go(i) {
    const from = current;
    // Past the last page: open the next lesson. Before the first page: open the previous lesson's last page.
    if (i > parts.length - 1 && nextLesson) { location.href = nextLesson.file + "#1"; return; }
    if (i < 0 && prevLesson) { location.href = prevLesson.file + "#last"; return; }
    current = Math.max(0, Math.min(parts.length - 1, i));
    seen.add(current);
    parts.forEach((p, k) => { p.hidden = k !== current; });
    // Slide the new page in from the side it comes from (not on first load, not after a drag, not with reduced motion)
    if (!first && !quiet && current !== from && !still() && parts[current].animate) {
      const d = current > from ? 1 : -1;
      parts[current].animate([{ transform: `translateX(${d * 40}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 220, easing: "ease-out" });
    }
    first = false;
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
    if (soon) soon.hidden = current !== parts.length - 1;
    if (hint) {
      const h = parts[current].querySelector(".hook");
      hint.textContent = h ? h.textContent : "";
      hint.hidden = !h || next.hidden;
    }
    if (support) support.hidden = current !== parts.length - 1;
    if (label) { const n = pageNumber(parts, current); label.textContent = (n ? `${n} / ${pageTotal(parts)}  ` : "") + (parts[current].dataset.title || ""); }
    try { history.replaceState(null, "", `#${current + 1}`); } catch (e) { /* file:// */ }
    window.scrollTo(0, 0);
    const area = document.querySelector(".wrap");
    if (area) area.scrollTop = 0;
  }
  pagedGo = (delta) => go(current + delta);
  // For the touch drag: the pages, which one is showing, and a way to switch without the slide-in
  window.__paged = { parts, now: () => current, hasPrevLesson: !!prevLesson, hasNextLesson: !!nextLesson,
    goQuiet: (delta) => { quiet = true; go(current + delta); quiet = false; } };

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

// Pages with data-nonum (practice pages) are not numbered, and don't count in the numbers of the others
function pageNumber(parts, i) { return parts[i].hasAttribute("data-nonum") ? 0 : parts.slice(0, i + 1).filter(p => !p.hasAttribute("data-nonum")).length; }
function pageTotal(parts) { return parts.filter(p => !p.hasAttribute("data-nonum")).length; }
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
    const num = pageNumber(parts, i);
    b.setAttribute("aria-label", (num ? `Page ${num}: ` : "") + (part.dataset.title || ""));

    const cap = document.createElement("span");
    cap.className = "thumb-cap";
    cap.innerHTML = (num ? `<b>${num}</b> ` : "") + (part.dataset.title || "");

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

// ---------- Swipe on phones: drag a page sideways, like flipping cards ----------
// The page follows your finger and the next (or previous) one slides in beside it. Let go past a third of the
// screen, or flick, and it moves on; otherwise it springs back. On the first or last page it just stretches a little.
// Ignored when the drag starts on something you drag sideways (sliders, the cube, wide tables, the pen, link previews)
// or at the screen's edge (the phone's back gesture). While sticky notes, Step through or Guide me are on, a swipe
// acts like the → / ← keys instead, so it moves through them.
function setupSwipe() {
  if (document.documentElement.classList.contains("embed")) return;
  const NO = 'input, textarea, select, canvas, svg, .table-scroll, [class*="xref-"], .peek-pop, .pen-tools, .sticky, [data-no-swipe]';
  const still = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function scrollsSideways(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const o = getComputedStyle(n).overflowX;
      if ((o === "auto" || o === "scroll") && n.scrollWidth > n.clientWidth + 2) return true;
    }
    return false;
  }
  const key = k => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  const busy = () => tourOpen || document.body.classList.contains("walking-code") || document.body.classList.contains("guiding");
  let x0 = 0, y0 = 0, t0 = 0, armed = false, mode = null, cur = null, side = null, dir = 0, W = 0, dx = 0;
  function clearStyles(el) { if (el) ["transform", "transition", "position", "top", "left", "width", "zIndex"].forEach(p => el.style[p] = ""); }
  function setNeighbour(d) {
    const P = window.__paged; if (!P) return;
    const i = P.now() + d, next = P.parts[i];
    if (side && side !== next) { side.hidden = true; clearStyles(side); }
    side = next || null; dir = d;
    if (!side) return;
    // lay the neighbour beside the current page, its top where the screen's top is
    const main = cur.parentElement, mr = main.getBoundingClientRect(), cr = cur.getBoundingClientRect();
    main.style.position = main.style.position || "relative";
    main.style.overflowX = "clip";   // the pages beside it must not widen the screen
    side.hidden = false;
    Object.assign(side.style, { position: "absolute", left: (cr.left - mr.left) + "px", width: cr.width + "px", top: Math.max(cr.top - mr.top, -mr.top + 8) + "px", zIndex: 1 });
  }
  function place(x) {
    cur.style.transform = `translateX(${x}px)`;
    if (side) side.style.transform = `translateX(${x + dir * (W + 24)}px)`;   // the next page comes in from the right, the previous from the left
  }
  function finish(go) {
    const P = window.__paged, t = still() ? 0 : 220;
    const tr = `transform ${t}ms ease-out`;
    cur.style.transition = tr; if (side) side.style.transition = tr;
    if (go && side) place(-dir * (W + 24)); else place(0);
    const c = cur, sd = side, d = dir;
    setTimeout(() => {
      clearStyles(c);
      if (sd) { clearStyles(sd); if (!go) sd.hidden = true; }
      if (go && sd) P.goQuiet(d);
      const main = c.parentElement; if (main) main.style.overflowX = "";
    }, t + 10);
    cur = side = null; mode = null;
  }
  document.addEventListener("touchstart", e => {
    armed = false; mode = null;
    if (e.touches.length !== 1 || document.body.classList.contains("pen-on")) return;
    const t = e.touches[0], edge = 24;
    if (t.clientX < edge || t.clientX > window.innerWidth - edge) return;
    if (e.target.closest && e.target.closest(NO)) return;
    if (scrollsSideways(e.target)) return;
    x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); armed = true; dx = 0;
  }, { passive: true });
  document.addEventListener("touchmove", e => {
    if (!armed) return;
    const t = e.touches[0], mx = t.clientX - x0, my = t.clientY - y0;
    if (!mode) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      if (Math.abs(mx) < 1.5 * Math.abs(my)) { armed = false; return; }   // scrolling up/down: leave it alone
      mode = busy() || !window.__paged ? "key" : "drag";
      if (mode === "drag") { cur = window.__paged.parts[window.__paged.now()]; W = cur.getBoundingClientRect().width; }
    }
    dx = mx;
    if (mode !== "drag") return;
    e.preventDefault();
    const d = dx < 0 ? 1 : -1;
    if (d !== dir || !side) setNeighbour(d);
    place(side ? dx : dx * 0.3);   // nothing on that side: just stretch a little
  }, { passive: false });
  document.addEventListener("touchend", e => {
    if (!armed) return;
    armed = false;
    const t = e.changedTouches[0], fx = t.clientX - x0, fy = t.clientY - y0, ms = Date.now() - t0;
    const far = Math.abs(fx) > Math.max(70, window.innerWidth * 0.33), flick = Math.abs(fx) > 40 && Math.abs(fx) / ms > 0.5;
    if (mode === "drag") {
      const P = window.__paged, d = fx < 0 ? 1 : -1;
      if ((far || flick) && !side && ((d > 0 && P.hasNextLesson && P.now() === P.parts.length - 1) || (d < 0 && P.hasPrevLesson && P.now() === 0))) {
        finish(false); pagedGo(d); return;   // past the lesson's end: open the next (or previous) lesson
      }
      finish(far || flick); return;
    }
    if (mode === "key" && (far || flick) && Math.abs(fx) > 2 * Math.abs(fy)) key(fx < 0 ? "ArrowRight" : "ArrowLeft");
  }, { passive: true });
  document.addEventListener("touchcancel", () => { if (mode === "drag" && cur) finish(false); armed = false; }, { passive: true });
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


// ---------- Show me how: game-style bubbles that walk through one activity ----------
// addTour(elementInsideActivity, steps, { id, auto })
//   steps: [{ at, say, run, click, keep }]
//     at    — the element to point at (element, selector inside the activity, or a function returning one)
//     say   — the bubble's text (HTML, or a function returning it, called after run)
//     run   — optional: set the activity up for this step (pick a group, mark a box…)
//     click — optional: instead of a Next button, wait for the reader to click this element
//     keep  — optional: element(s) the bubble must not cover, e.g. the text the step talks about
//     wide  — optional: a wider note, for a small table
//   id   — remembers that the reader has seen it (it opens by itself only the first time)
//   auto — open by itself the first time the page is shown (default true; never in teach mode)
// Adds a small "?" button (Show me how) beside ↺ Reset. Esc, ✕ or "Skip" closes; ← → move while it's open.
let tourOpen = null;
function addTour(inside, steps, opts = {}) {
  const el = typeof inside === "string" ? document.getElementById(inside) : inside;
  const box = el && el.closest(".activity");
  if (!box || !steps.length) return;
  const key = ((window.COURSE && COURSE.id) || "notebook") + "-tour-" + (opts.id || "x");
  const seen = () => { try { return localStorage.getItem(key) === "1"; } catch (e) { return false; } };
  const markSeen = () => { try { localStorage.setItem(key, "1"); } catch (e) {} };
  const btn = document.createElement("button");
  btn.className = "tour-btn"; btn.type = "button"; btn.textContent = "?"; btn.title = "Show me how"; btn.setAttribute("aria-label", "Show me how this activity works");
  box.insertBefore(btn, box.firstChild); box.classList.add("has-tour");
  const find = a => typeof a === "function" ? a() : typeof a === "string" ? box.querySelector(a) : a || box;
  let i = 0, bubble = null, target = null, waitEl = null, waitFn = null, scrolled = false;
  // Dim everything on the page part except what this step points at (and what it keeps visible), like Guide me
  const root = box.closest("section.part") || box.parentElement;
  function undim() { root.querySelectorAll(".tour-dim").forEach(x => x.classList.remove("tour-dim")); }
  function dim(els) {
    undim();
    els = els.filter(Boolean);
    const path = new Set();
    els.forEach(e => { for (let n = e; n && n !== root; n = n.parentElement) path.add(n); });
    const walk = node => [...node.children].forEach(ch => {
      if (els.includes(ch) || ch.matches("h2")) return;
      if (path.has(ch)) walk(ch); else ch.classList.add("tour-dim");
    });
    walk(root);
  }
  function clearWait() { if (waitEl && waitFn) waitEl.removeEventListener("click", waitFn); waitEl = waitFn = null; }
  // The page may scroll inside a box (e.g. beside the page list), not the window
  function scrollParent(el) {
    for (let n = el.parentElement; n; n = n.parentElement) { const o = getComputedStyle(n).overflowY; if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight) return n; }
    return document.scrollingElement || document.documentElement;
  }
  function place() {
    if (!bubble || !target) return;
    // Try below, above, right, left: the first side where the bubble fits on screen and covers neither the
    // thing it points at nor anything the step says to keep visible (step.keep). Otherwise below, scrolled into view.
    const W = document.documentElement.clientWidth, H = window.innerHeight, M = 10, G = 14;
    const w = Math.min(steps[i].wide ? 470 : 340, W - 2 * M); bubble.style.width = w + "px";
    const h = bubble.offsetHeight, r = target.getBoundingClientRect();
    const keep = [r, ...[].concat(steps[i].keep ? find(steps[i].keep) : []).filter(Boolean).map(k => k.getBoundingClientRect())];
    const hits = (x, y) => keep.some(k => x < k.right + 4 && x + w > k.left - 4 && y < k.bottom + 4 && y + h > k.top - 4);
    const fits = (x, y) => x >= M && y >= M && x + w <= W - M && y + h <= H - M && !hits(x, y);
    const midX = Math.min(Math.max(M, r.left + r.width / 2 - w / 2), W - w - M), midY = Math.min(Math.max(M, r.top + r.height / 2 - h / 2), H - h - M);
    const sides = [["below", midX, r.bottom + G], ["above", midX, r.top - G - h], ["right", r.right + G, midY], ["left", r.left - G - w, midY]];
    let pick = sides.find(([, x, y]) => fits(x, y));
    if (!pick) {
      // Nothing fits: put it below everything to keep, and scroll so it shows
      const bottom = Math.max(...keep.map(k => k.bottom));
      pick = ["below", midX, Math.max(M, Math.min(bottom + G, H - h - M))];   // on a short screen it may overlap the bottom of what it points at
      const top = Math.min(...keep.map(k => k.top));
      const over = Math.min(bottom + G + h - (H - M), top - M);   // scroll up to fit the note, but never past the top of what it points at
      if (over > 0 && !scrolled) { scrolled = true; scrollParent(target).scrollBy({ top: over, behavior: "instant" }); return place(); }   // once per step
    }
    const [side, left, top] = pick;
    bubble.style.left = left + "px";   // the note is position: fixed, so it stays in place whichever box scrolls
    bubble.style.top = top + "px";
    bubble.dataset.side = side;
    const ax = Math.min(Math.max(16, r.left + r.width / 2 - left), w - 16);
    bubble.style.setProperty("--tapeX", (side === "below" && ax < w / 2 ? w - 70 : side === "below" ? 70 : w / 2) + "px");   // tape away from the arrow
    if (side === "below" || side === "above") bubble.style.setProperty("--arrow", ax + "px");
    else bubble.style.setProperty("--arrowY", Math.min(Math.max(16, r.top + r.height / 2 - top), h - 16) + "px");
  }
  function show(n) {
    clearWait();
    i = Math.max(0, Math.min(n, steps.length - 1));
    scrolled = false;
    const st = steps[i];
    if (st.run) st.run();
    if (target) target.classList.remove("tour-on");
    target = find(st.at); target.classList.add("tour-on");
    const say = typeof st.say === "function" ? st.say() : st.say;
    const last = i === steps.length - 1;
    bubble.innerHTML = `<div class="tour-top"><span class="tour-n">${i + 1} / ${steps.length}</span><button class="tour-x" type="button" aria-label="Close">✕</button></div>` +
      `<div class="tour-say">${say}</div><div class="tour-nav">` +
      (i ? `<button class="tour-back" type="button">← Back</button>` : `<button class="tour-skip" type="button">Skip</button>`) +
      (st.click ? `<span class="tour-wait">Your turn: press it ↑</span><button class="tour-next tour-doit" type="button">Do it for me</button>` : `<button class="tour-next primary" type="button">${last ? "Done ✓" : "Next →"}</button>`) + `</div>`;
    bubble.querySelector(".tour-x").onclick = close;
    const back = bubble.querySelector(".tour-back"), skip = bubble.querySelector(".tour-skip"), next = bubble.querySelector(".tour-next");
    if (back) back.onclick = () => show(i - 1);
    if (skip) skip.onclick = close;
    if (next) next.onclick = () => st.click ? find(st.click).click() : last ? close() : show(i + 1);   // on a "your turn" step it presses the thing for you
    if (st.click) {
      waitEl = find(st.click); waitEl.classList.add("tour-on");
      waitFn = () => { waitEl.classList.remove("tour-on"); setTimeout(() => last ? close() : show(i + 1), 60); };
      waitEl.addEventListener("click", waitFn);
    }
    dim([target, ...[].concat(st.keep ? find(st.keep) : []), waitEl]);
    const r = target.getBoundingClientRect();
    if (r.top < 70 || r.bottom > window.innerHeight - 160) target.scrollIntoView({ block: "center", behavior: "instant" });   // instant, so the note can be placed right away
    place(); setTimeout(place, 350);
    (next || bubble.querySelector(".tour-x")).focus({ preventScroll: true });
  }
  function open() {
    if (tourOpen) tourOpen();
    bubble = document.createElement("div"); bubble.className = "tour-bubble"; bubble.setAttribute("role", "dialog"); bubble.setAttribute("aria-label", "Show me how");
    document.body.appendChild(bubble); box.classList.add("touring"); document.body.classList.add("touring");
    tourOpen = close; markSeen();
    document.addEventListener("scroll", place, { passive: true, capture: true }); window.addEventListener("resize", place);
    show(0);
  }
  function close() {
    clearWait();
    if (target) target.classList.remove("tour-on");
    box.querySelectorAll(".tour-on").forEach(x => x.classList.remove("tour-on"));
    undim();
    if (bubble) bubble.remove(); bubble = null; target = null; box.classList.remove("touring"); document.body.classList.remove("touring");
    document.removeEventListener("scroll", place, { capture: true }); window.removeEventListener("resize", place);
    if (tourOpen === close) tourOpen = null;
  }
  btn.addEventListener("click", () => { btn.blur(); open(); });
  // If Guide me's glow moves off this activity (its own buttons, a click elsewhere), the notes close too
  document.addEventListener("guidestep", e => {
    if (tourOpen !== close || !e.detail || !e.detail.on) return;
    if (!box.closest(".guide-now") && !box.querySelector(".guide-now") && !box.classList.contains("guide-now")) close();
  });
  box.addEventListener("click", e => { if (tourOpen === close && e.target.closest(".reset")) close(); });   // ↺ Reset ends the tour
  document.addEventListener("keydown", e => {
    if (tourOpen !== close) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); e.stopImmediatePropagation(); if (!steps[i].click) i === steps.length - 1 ? close() : show(i + 1); }   // on a "your turn" step, → waits too (it must not turn the page)
    else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopImmediatePropagation(); if (i > 0) show(i - 1); else close(); }   // ← on the first note leaves the notes
  }, true);
  // The first time its page is shown, open by itself (not in teach mode or Guide me, not inside a split-screen preview)
  if (opts.auto !== false) {
    const sec = box.closest("section.part");
    const embedded = /[?&]embed=1/.test(location.search);
    const maybe = () => {
      const teach = document.body.classList.contains("teach"), guiding = document.body.classList.contains("guiding");   // while guiding, only on request
      if (!seen() && !embedded && !teach && !guiding && (!sec || !sec.hidden) && !tourOpen) setTimeout(() => { if (!sec || !sec.hidden) open(); }, 500);
    };
    if (sec) new MutationObserver(() => { if (!sec.hidden) maybe(); }).observe(sec, { attributes: true, attributeFilter: ["hidden"] });
    document.addEventListener("DOMContentLoaded", () => setTimeout(maybe, 0));
  }
  return { open, close };
}
// Close an open tour when the page changes
document.addEventListener("click", e => { if (tourOpen && e.target.closest("[data-page-next], [data-page-back], .progress a, .progress button")) tourOpen(); }, true);


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
  const teaching = () => document.body.classList.contains("teach");
  document.querySelectorAll(".quiz").forEach(quiz => {
    const feedback = quiz.querySelector(".feedback");
    const buttons = [...quiz.querySelectorAll(".options button")];
    const again = document.createElement("button");
    again.className = "reset quiz-reset"; again.type = "button"; again.textContent = "↺ Try again"; again.hidden = true;
    const reveal = document.createElement("button");
    reveal.className = "quiz-reveal"; reveal.type = "button"; reveal.textContent = "Reveal the answer"; reveal.hidden = true;
    function clear() {
      buttons.forEach(x => x.classList.remove("right", "wrong", "chosen"));
      if (feedback) { feedback.innerHTML = ""; feedback.className = "feedback"; }
      again.hidden = true; reveal.hidden = true;
    }
    function show(b) {
      buttons.forEach(x => x.classList.remove("right", "wrong", "chosen"));
      const right = b.hasAttribute("data-right");
      b.classList.add(right ? "right" : "wrong");
      if (feedback) {
        let html = right ? (quiz.dataset.right || "Right!") : (b.dataset.why || "Not quite. Try another.");
        // A wrong answer points to the page that teaches it
        if (!right && quiz.dataset.page) html += ` <span class="quiz-back">Re-read: <a class="xref" href="${quiz.dataset.page}">${quiz.dataset.topic || "this page"}</a></span>`;
        feedback.innerHTML = html;
        feedback.className = "feedback " + (right ? "good" : "bad");
      }
      again.hidden = false; reveal.hidden = true;
      quiz.dispatchEvent(new CustomEvent("answered", { bubbles: true, detail: { right } }));
    }
    again.addEventListener("click", clear);
    // Teaching (T): the class picks first; the answer shows only when you press Reveal
    reveal.addEventListener("click", () => show(buttons.find(x => x.hasAttribute("data-right"))));
    quiz.append(reveal, again);
    buttons.forEach(b => b.addEventListener("click", () => {
      if (teaching()) { clear(); b.classList.add("chosen"); reveal.hidden = false; return; }
      show(b);
    }));
  });
}

// ---------- Lesson test: <div class="test" data-test="4"> with .quiz questions inside ----------
// Pass = every question answered right (retry allowed). The first-try score is shown honestly,
// with the pages to re-read. Saved per lesson; the next lesson reminds you if you skipped it.
function testKey(n) { return `${STORE}-test:${n}`; }
function testPassed(n) { try { return JSON.parse(localStorage.getItem(testKey(n)) || "{}").passed === true; } catch (e) { return false; } }
function setupTests() {
  document.querySelectorAll(".test[data-test]").forEach(test => {
    const n = test.dataset.test, quizzes = [...test.querySelectorAll(".quiz")];
    const state = new Map();   // quiz -> { first: true/false, right: true/false }
    const card = document.createElement("div");
    card.className = "test-result"; card.setAttribute("aria-live", "polite");
    test.appendChild(card);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(testKey(n)) || "{}"); } catch (e) { saved = {}; }
    function render() {
      const done = quizzes.filter(q => state.get(q) && state.get(q).right).length;
      const firstRight = quizzes.filter(q => state.get(q) && state.get(q).first).length;
      const answered = quizzes.filter(q => state.has(q)).length;
      const missed = quizzes.filter(q => state.has(q) && !state.get(q).first);
      if (done === quizzes.length) {
        const rec = { passed: true, firstTry: firstRight, of: quizzes.length };
        try { localStorage.setItem(testKey(n), JSON.stringify(rec)); } catch (e) { /* private */ }
        card.innerHTML = `<b>✓ Lesson ${n} test passed.</b> First try: ${firstRight} of ${quizzes.length}.` +
          (missed.length ? `<br>Worth another look: ${missed.map(q => `<a class="xref" href="${q.dataset.page}">${q.dataset.topic}</a>`).join(", ")}.` : " Every idea landed first time.");
        card.className = "test-result passed";
      } else {
        card.innerHTML = saved.passed && !answered ? `✓ You passed this test before (first try: ${saved.firstTry} of ${saved.of}). You can take it again.`
          : `${done} of ${quizzes.length} right so far.`;
        card.className = "test-result";
      }
    }
    test.addEventListener("answered", e => {
      if (document.body.classList.contains("teach")) return;   // a class discussion doesn't count
      const q = e.target.closest(".quiz"); if (!q) return;
      const st = state.get(q);
      if (!st) state.set(q, { first: e.detail.right, right: e.detail.right });
      else if (e.detail.right) st.right = true;
      render();
    });
    render();
  });
  // A soft reminder at the start of a lesson whose previous lesson has a test you haven't passed
  const file = location.pathname.split("/").pop();
  const here = LESSONS.findIndex(l => l.file === file), prev = here > 0 ? LESSONS[here - 1] : null;
  const main = document.querySelector("main[data-paged]");
  if (!prev || !prev.test || !main || testPassed(prev.n) || document.documentElement.classList.contains("embed")) return;
  let skipped = false; try { skipped = sessionStorage.getItem(testKey(prev.n) + ":skip") === "1"; } catch (e) { /* fine */ }
  if (skipped) return;
  const note = document.createElement("div");
  note.className = "test-gate";
  note.innerHTML = `<b>Before this lesson:</b> take the Lesson ${prev.n} test, to check every idea landed.
    <span class="test-gate-row"><a class="btn primary" href="${prev.file}#${prev.test}">Take the Lesson ${prev.n} test</a>
    <button type="button">Continue anyway</button></span>`;
  note.querySelector("button").addEventListener("click", () => { try { sessionStorage.setItem(testKey(prev.n) + ":skip", "1"); } catch (e) { /* fine */ } note.remove(); });
  if (!document.body.classList.contains("teach")) main.prepend(note);
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
  // The scrolling part of a page: on wide screens the lesson area scrolls by itself, otherwise the window does
  const scroller = doc => doc.querySelector("body.has-thumbs .wrap") || doc.scrollingElement;
  const calm = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SLIDE = 450;   // ms
  function columns(left, bar, right) { split.style.gridTemplateColumns = `${left}px ${bar}px ${right}px`; }
  function openSplit(href, name) {
    if (split && splitHref === href) { location.href = href; return; }   // same link again: go there
    if (!split) {
      split = document.createElement("div");
      split.className = "split-view";
      split.style.visibility = "hidden";   // shown once the left half looks exactly like this page
      split.innerHTML = `<iframe class="split-left" title="This page"></iframe>
        <div class="split-bar" role="separator" aria-label="Drag to resize the two halves"></div>
        <div class="split-right"><div class="split-inner"><div class="split-head"><span class="split-name"></span>
          <a class="xref-go" target="_top">Go to this page →</a>
          <button type="button" class="xref-close" aria-label="Close the split screen">✕</button></div>
          <iframe class="split-frame" title="Linked page"></iframe></div></div>`;
      const left = split.querySelector(".split-left"), inner = split.querySelector(".split-inner");
      split.querySelector(".xref-close").addEventListener("click", closeSplit);
      // drag the middle bar to resize
      const bar = split.querySelector(".split-bar");
      bar.addEventListener("pointerdown", e => {
        bar.setPointerCapture(e.pointerId); split.classList.add("dragging");
        const move = ev => { const x = Math.max(280, Math.min(window.innerWidth - 280, ev.clientX)); split.style.gridTemplateColumns = `${x}px 8px minmax(0, 1fr)`; };
        const up = () => { split.classList.remove("dragging"); bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); };
        bar.addEventListener("pointermove", move); bar.addEventListener("pointerup", up);
      });
      const W = window.innerWidth, half = Math.round((W - 8) / 2);
      columns(W, 0, 0);
      document.body.appendChild(split);
      document.documentElement.classList.add("split-open");
      // Once the left half has loaded, put it at the same scroll, show it, then slide: left shrinks, right comes in from the right
      let started = false;
      const slideIn = () => {
        if (started || !split) return; started = true;
        try { scroller(left.contentDocument).scrollTop = scroller(document).scrollTop; } catch (e) { /* fine */ }
        split.style.visibility = "";
        if (calm()) { split.style.gridTemplateColumns = "minmax(0, 1fr) 8px minmax(0, 1fr)"; return; }
        inner.style.width = (W - half - 8) + "px";   // the right page keeps its size and slides in with the edge
        requestAnimationFrame(() => requestAnimationFrame(() => {
          split.classList.add("sliding"); columns(half, 8, W - half - 8);
          setTimeout(() => { if (!split) return; split.classList.remove("sliding"); inner.style.width = ""; split.style.gridTemplateColumns = "minmax(0, 1fr) 8px minmax(0, 1fr)"; }, SLIDE + 30);
        }));
      };
      left.addEventListener("load", () => setTimeout(slideIn, 60));
      setTimeout(slideIn, 2500);   // don't wait forever
      left.src = location.href;
    }
    splitHref = href;
    split.querySelector(".split-frame").src = href;
    split.querySelector(".split-name").textContent = name || "";
    split.querySelector(".xref-go").href = href;
  }
  function closeSplit() {
    if (!split || split.classList.contains("closing")) return;
    const left = split.querySelector(".split-left");
    // Went to another page on the left? Just open it.
    let lw = null;
    try { lw = left.contentWindow; if (lw.location.pathname !== location.pathname) { location.href = lw.location.href; return; } } catch (e) { lw = null; }
    const finish = () => {
      // Carry over where you got to on the left: same page, same scroll
      try {
        if (lw && lw.location.hash && lw.location.hash !== location.hash) location.hash = lw.location.hash;
        const top = scroller(left.contentDocument).scrollTop;
        requestAnimationFrame(() => { scroller(document).scrollTop = top; });
      } catch (e) { /* fine */ }
      split.remove(); split = null; splitHref = null;
      document.documentElement.classList.remove("split-open");
    };
    if (calm()) { finish(); return; }
    // Slide back: the right half leaves to the right, the left grows to the full width
    split.classList.add("closing");
    const W = window.innerWidth, lwPx = left.getBoundingClientRect().width, inner = split.querySelector(".split-inner");
    inner.style.width = split.querySelector(".split-right").getBoundingClientRect().width + "px";
    columns(lwPx, 8, W - lwPx - 8);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      split.classList.add("sliding"); columns(W, 0, 0);
      setTimeout(finish, SLIDE + 30);
    }));
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
  setupSwipe();
  setupQuizzes();
  setupTests();
  setupPredictions();
  setupWalkthroughs();
  setupDoneToggle();
  setupLlmPath();
  setupPeeks();
});
