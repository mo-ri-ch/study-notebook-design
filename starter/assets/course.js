// course.js — everything that belongs to this course only.
// The shared look and features come from study-notebook-design (loaded after this file),
// which reads the settings below.

const COURSE_LESSONS = [
  // n: lesson number · step: short word for the step row · file: the page in lessons/
  // ready: false shows "Soon" on the home page · leaves: the question that leads to the next lesson
  { n: 1, step: "first idea", title: "First lesson", file: "lesson1.html", ready: true,
    summary: "One sentence on what this lesson does.",
    leaves: "The question this lesson leaves open, which Lesson 2 answers." },
  { n: 2, step: "next idea", title: "Second lesson", file: "lesson2.html", ready: false,
    summary: "One sentence on what this lesson does.",
    leaves: null },
];

window.COURSE = {
  id: "my-course",                 // CHANGE THIS: a short, unique name. Progress and notes are saved under it.
  pathLabel: "The course",         // label of the step row in each lesson's closing question
  lessons: COURSE_LESSONS,
  setup: [],                       // optional: your own functions to run on every page
};
