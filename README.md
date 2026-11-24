# Study Notebook Design

The shared look and features for my interactive courses: pages that look like a student's notebook,
with ruled paper, handwritten headings, highlighters, sticky notes and red-pen notes.

> **Using this design? Please give credit.** It's free to use, even commercially, as long as it shows **"Paper, pens & highlighters by Gradient AI Labs"**, linked to
> [gradlabs.in](https://gradlabs.in). on its home page and at the end of each lesson; `common.js` adds this line for you. See
> [Licence and credit](#licence-and-credit).

Used by:
- [Build a Tiny LLM](https://gradlabs.in/learn/tiny-llm/)
- [Transformers & LLMs](https://gradlabs.in/learn/transformers/)
- [Build an AI Agent](https://gradlabs.in/learn/agents/)
- [Forward Deployed Engineering](https://gradlabs.in/learn/fde/)
- [Build an AI Team](https://mo-ri-ch.github.io/agent-team/)
- [Web Foundations](https://mo-ri-ch.github.io/web-foundations/)
- [Deep Learning, Hands-on](https://mo-ri-ch.github.io/deep-learning/) (session)
- [Generative AI & Prompt Engineering for Developers](https://mo-ri-ch.github.io/genai-webinar/) (webinar)

## What's inside

```
v1/style.css    the notebook look (light and dark)
v1/common.js    one part per screen, slide thumbnails, progress, quizzes, copy and run buttons
v1/pen.js       write your own notes and sticky notes on any slide (P); board mode: pinch to zoom, two fingers to move (B)
v1/guide.js     "Guide me": a soft glow on the one thing to look at now
v1/codewalk.js  "Step through" code line by line, and tap-to-explain Python words
v1/home.css     the course home page: lessons as sticky notes joined by questions
v1/home.js      builds that home page from the lesson list
v1/webinar.css  a webinar's home page: event details, resources, parts of the talk, next courses (all optional)
v1/webinar.js   builds that page from COURSE.webinar
starter/        a blank course to copy
starter-webinar/ a blank webinar to copy
```

## Start a new course

1. Make a new, empty public repo on GitHub.
2. Copy everything in `starter/` into it.
3. In `assets/course.js`, set a unique `id` and write your lesson list.
4. Write the lessons in `lessons/`, starting from `lesson1.html`.
5. Turn on GitHub Pages (Settings → Pages → Deploy from branch → `main`).

Each course keeps only its own lessons. Every page loads the design from this repo:

```html
<link rel="stylesheet" href="https://mo-ri-ch.github.io/study-notebook-design/v1/style.css">
...
<script src="../assets/course.js"></script>   <!-- the course's own settings, first -->
<script src="https://mo-ri-ch.github.io/study-notebook-design/v1/common.js"></script>
```

## Start a new webinar

A webinar is a short companion to one live talk: the same notebook look, but its home page is about the event.

1. Make a new, empty public repo on GitHub.
2. Copy everything in `starter-webinar/` into it.
3. In `assets/course.js`, set a unique `id` and fill in `webinar`: date, speaker, resources, parts, next courses (leave out what you don't need).
   A resource with `href: null` shows "Soon" (for the slides or recording, until they're ready).
4. Write the talk in `lessons/talk.html`, one `<section class="part">` per screen.
5. Turn on GitHub Pages. Webinars are unlisted: every page has `noindex`; share the link directly.

## Change the design

Edit the files in `v1/` and push. Every course updates within a few minutes
(press Ctrl + Shift + R to see it straight away).

For a change that would break existing courses, copy `v1/` to `v2/` and change it there.
Courses keep using `v1` until you move them to `v2`.

## Licence and credit

© 2026 Gradient AI Labs. Free to use and adapt, even commercially, under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (see `LICENSE`).

**If you use this design, in full or in part, you must credit Gradient AI Labs:**

1. Keep the line **"Paper, pens & highlighters by Gradient AI Labs"**, linked to https://gradlabs.in,
   visible on the home page and at the end of each lesson. `common.js` adds it there; don't
   remove or hide it.
2. If you don't use `common.js`, or you build your own pages from this design, add the line yourself:

   ```html
   <p class="design-credit">Paper, pens &amp; highlighters by <a href="https://gradlabs.in">Gradient AI Labs</a></p>
   ```

3. Keep the `LICENSE` file and the notice at the top of each file in your copy.

The credit is for the design (the look and the shared features), not for your course content.

Using it in your own courses? Take your own copy of `v1/` rather than loading these files
live: changes here would otherwise change your pages too.
