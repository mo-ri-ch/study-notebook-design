// home.js — the course home page (study-notebook-design, v1).
// Needs common.js first (for LESSONS and isDone).
//   <ol class="path" id="pathList"></ol>     → the lessons as sticky notes, joined by each lesson's question
//   <button data-note="needNote">…</button>  → opens the small sticky note with id="needNote" in place

// ---------------- The path: sticky notes joined by questions ----------------
(function buildPath() {
  const list = document.getElementById("pathList");
  if (!list) return;
  const COLORS = ["y", "p", "b", "g", "o"];
  const TILT = [-1.2, 1, -0.6, 1.2, -0.9];

  LESSONS.forEach((lesson, i) => {
    const right = i % 2 === 1;
    const done = isDone(lesson.n);
    const stamp = done ? '<span class="stamp done">✓ Done</span>'
      : lesson.ready ? '<span class="stamp open">Open</span>' : '<span class="stamp soon">Soon</span>';

    const step = document.createElement("li");
    step.className = "step" + (right ? " right" : "");
    const tag = lesson.ready ? "a" : "div";
    step.innerHTML = `<${tag} class="lnote ${COLORS[i % 5]}${lesson.ready ? "" : " soon-note"}"
        ${lesson.ready ? `href="lessons/${lesson.file}"` : ""} style="transform:rotate(${TILT[i % 5]}deg)">
        <div class="num">Lesson ${lesson.label || lesson.n}</div>
        <div class="title">${lesson.title}</div>
        <div class="sum">${lesson.summary}</div>${stamp}
      </${tag}>`;
    list.appendChild(step);

    if (!lesson.leaves) return;
    // A curved line from under this note to above the next one, with the question on it
    const from = right ? 78 : 22, to = right ? 22 : 78;
    const link = document.createElement("li");
    link.className = "link";
    link.innerHTML = `
      <svg viewBox="0 0 100 130" preserveAspectRatio="none" aria-hidden="true">
        <path d="M${from},4 C${from},70 ${to},60 ${to},126" vector-effect="non-scaling-stroke"/>
      </svg>
      <p class="q">${lesson.leaves}</p>`;
    list.appendChild(link);
  });
})();

// ---------------- Small notes that open in place ("What you need", "How to use") ----------------
(function notes() {
  const buttons = document.querySelectorAll("[data-note]");
  if (!buttons.length) return;
  function open(id) {
    buttons.forEach(b => {
      const on = b.dataset.note === id;
      document.getElementById(b.dataset.note).hidden = !on;
      b.setAttribute("aria-expanded", on);
    });
  }
  buttons.forEach(b => b.onclick = () => {
    const note = document.getElementById(b.dataset.note);
    open(note.hidden ? b.dataset.note : null);
  });
  document.querySelectorAll(".need .close").forEach(c => c.onclick = () => open(null));
  document.addEventListener("keydown", e => { if (e.key === "Escape") open(null); });
})();
