# Study Notebook Design

The shared look and features for my interactive courses: pages that look like a student's notebook,
with ruled paper, handwritten headings, highlighters, sticky notes and red-pen notes.

Used by:
- [Build a Tiny LLM](https://mo-ri-ch.github.io/build-an-llm-from-scratch/)
- [Transformers & LLMs](https://mo-ri-ch.github.io/transformers-and-llms/)

## What's inside

```
v1/style.css    the notebook look (light and dark)
v1/common.js    one part per screen, slide thumbnails, progress, quizzes, teach mode (T), copy and run buttons
v1/pen.js       write your own notes and sticky notes on any slide (P)
v1/guide.js     "Guide me": a soft glow on the one thing to look at now
v1/codewalk.js  "Step through" code line by line, and tap-to-explain Python words
v1/home.css     the course home page: lessons as sticky notes joined by questions
v1/home.js      builds that home page from the lesson list
starter/        a blank course to copy
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

## Change the design

Edit the files in `v1/` and push. Every course updates within a few minutes
(press Ctrl + Shift + R to see it straight away).

For a change that would break existing courses, copy `v1/` to `v2/` and change it there.
Courses keep using `v1` until you move them to `v2`.
