// webinar.js — the home page of a webinar notebook (study-notebook-design, v1).
// Needs common.js first. Reads COURSE.webinar from assets/course.js:
//
//   webinar: {
//     when:  ["14 Nov 2026", "7:00 pm IST", "Speaker name"],   // written under the title
//     resources: [ { icon, title, sum, href } ],                // no href: shows "Soon" (e.g. the recording)
//     parts:     [ { title, sum, href } ],                      // the parts of the talk, in order
//     next:      [ { title, sum, href } ],                      // "Keep learning": the full courses
//   }
//
// It fills these, when the page has them:
//   <ul class="w-when" id="wWhen"></ul>
//   <ul class="w-notes" id="wResources"></ul>
//   <ul class="w-notes" id="wParts"></ul>
//   <ul class="w-next" id="wNext"></ul>

(function webinarHome() {
  const W = (window.COURSE && COURSE.webinar) || {};
  const COLORS = ["y", "b", "g", "p", "o"];
  const TILT = [-1.2, 0.9, -0.6, 1.1, -0.9];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const external = href => /^https?:/.test(href) && !href.startsWith(location.origin);

  function fill(id, items, render) {
    const list = document.getElementById(id);
    if (!list || !items || !items.length) { if (list) list.hidden = true; return; }
    list.innerHTML = items.map(render).join("");
  }

  fill("wWhen", W.when, w => `<li>${esc(w)}</li>`);

  // A sticky note: a link when it has an address, otherwise a quiet "Soon" note
  function note(item, i, kicker, stampOpen) {
    const tag = item.href ? "a" : "div";
    const attrs = item.href
      ? `href="${esc(item.href)}"${external(item.href) ? ' target="_blank" rel="noopener"' : ""}`
      : "";
    const stamp = item.href ? `<span class="stamp open">${esc(stampOpen)}</span>` : '<span class="stamp soon">Soon</span>';
    return `<li><${tag} class="w-note ${COLORS[i % 5]}${item.href ? "" : " soon"}" ${attrs} style="transform:rotate(${TILT[i % 5]}deg)">
        ${item.icon ? `<span class="ico" aria-hidden="true">${esc(item.icon)}</span>` : ""}
        ${kicker ? `<span class="kicker">${esc(kicker)}</span>` : ""}
        <span class="title">${esc(item.title)}</span>
        <span class="sum">${esc(item.sum)}</span>${stamp}
      </${tag}></li>`;
  }

  fill("wResources", W.resources, (r, i) => note(r, i, "", r.open || "Open"));
  fill("wParts", W.parts, (p, i) => note(p, i + 1, `Part ${i + 1}`, "Open"));
  fill("wNext", W.next, n => `<li><a href="${esc(n.href)}">
      <span class="title">${esc(n.title)}</span><span class="sum">${esc(n.sum)}</span><span class="go">Open →</span></a></li>`);
})();
