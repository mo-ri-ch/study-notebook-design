// course.js — everything that belongs to this webinar only.
// The shared look and features come from study-notebook-design (loaded after this file).
// A webinar has ONE talk page (lessons/talk.html) whose parts are the parts of the talk.

const COURSE_LESSONS = [
  { n: 1, step: "the talk", title: "The talk", file: "talk.html", ready: true,
    summary: "Everything from the live session, one part per screen.", leaves: null },
];

window.COURSE = {
  id: "my-webinar",                // CHANGE THIS: a short, unique name. Notes are saved under it.
  pathLabel: "The webinar",
  lessons: COURSE_LESSONS,
  support: false,                  // no support note inside a webinar
  setup: [],

  // Read by webinar.js on the home page
  webinar: {
    when: ["[Date]", "[Time]", "[Speaker]"],
    resources: [
      { icon: "📖", title: "The talk", sum: "Every idea from the session, with things to try.", href: "lessons/talk.html", open: "Start" },
      { icon: "🧪", title: "Colab notebook", sum: "Run the demo yourself.", href: null },
      { icon: "🎞️", title: "Slides", sum: "The deck from the session.", href: null },
      { icon: "🎥", title: "Recording", sum: "Posted after the session.", href: null },
    ],
    parts: [
      { title: "First part", sum: "One line on this part.", href: "lessons/talk.html#1" },
      { title: "Second part", sum: "One line on this part.", href: "lessons/talk.html#3" },
    ],
    next: [
      { title: "Build a Tiny LLM", sum: "Write a working language model, line by line.", href: "https://gradlabs.in/learn/tiny-llm/" },
      { title: "Transformers & LLMs", sum: "How attention and transformers really work.", href: "https://gradlabs.in/learn/transformers/" },
      { title: "Build an AI Agent", sum: "Teach a model to think, use tools and get things done.", href: "https://gradlabs.in/learn/agents/" },
    ],
  },
};
