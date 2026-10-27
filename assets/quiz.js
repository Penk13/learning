/* Cards: runs every .quiz[data-quiz] on lesson pages and on the review page (see DESIGN.md).
 *
 * Multiple choice: has .quiz-options with <button data-answer="correct|wrong">; options are
 *   shuffled each time, the pick is marked and .quiz-explanation shows.
 * Free text / case study: has .quiz-answer (the model answer); a text box and Submit button
 *   are added, and the model answer shows after submitting. Optional .quiz-case holds a scenario.
 *
 * After each answer it fires the event assets/progress.js records:
 *   quiz:answered  detail { qid, kind, question, answer, correct, course?, lesson? }
 * course/lesson come from the card's data attributes on the review page, else the page.
 * window.LearningQuiz.init(root) wires cards added later (the review page uses it). */
(() => {
  "use strict";

  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();

  function answered(quiz, detail) {
    quiz.classList.add("answered");
    quiz.dispatchEvent(new CustomEvent("quiz:answered", {
      bubbles: true,
      detail: {
        qid: quiz.dataset.qid,
        question: [text(quiz.querySelector(".quiz-case")), text(quiz.querySelector(".quiz-question"))].filter(Boolean).join(" "),
        course: quiz.dataset.course,
        lesson: quiz.dataset.lesson,
        ...detail,
      },
    }));
  }

  function status(quiz) {
    let el = quiz.querySelector(".quiz-status");
    if (!el) {
      el = document.createElement("p");
      el.className = "quiz-status";
      el.setAttribute("aria-live", "polite");
      (quiz.querySelector(".quiz-options, .quiz-write") || quiz.querySelector(".quiz-question")).after(el);
    }
    return el;
  }

  function multipleChoice(quiz, list) {
    const buttons = shuffle([...list.querySelectorAll("button[data-answer]")]);
    list.append(...buttons);
    buttons.forEach((button) => button.addEventListener("click", () => {
      if (quiz.classList.contains("answered")) return;
      const correct = button.dataset.answer === "correct";
      buttons.forEach((option) => {
        option.disabled = true;
        if (option.dataset.answer === "correct") option.classList.add("is-correct");
      });
      if (!correct) button.classList.add("is-wrong");
      status(quiz).textContent = correct ? "Correct." : "Not quite. The correct option is highlighted.";
      answered(quiz, { kind: "mcq", answer: text(button), correct });
    }));
  }

  function freeText(quiz, model) {
    const write = document.createElement("div");
    write.className = "quiz-write";
    write.innerHTML = '<textarea rows="4" aria-label="Your answer"></textarea>'
      + '<button type="button">Submit</button>';
    const [area, submit] = write.children;
    model.before(write);
    submit.addEventListener("click", () => {
      if (quiz.classList.contains("answered")) return;
      if (!area.value.trim()) { status(quiz).textContent = "Write your answer first."; return; }
      area.readOnly = true;
      submit.disabled = true;
      status(quiz).textContent = "Saved. Compare with the model answer.";
      answered(quiz, { kind: "text", answer: area.value.trim(), correct: null });
    });
  }

  function init(root = document) {
    root.querySelectorAll(".quiz[data-quiz]:not([data-quiz-ready])").forEach((quiz) => {
      quiz.dataset.quizReady = "";
      const list = quiz.querySelector(".quiz-options");
      const model = quiz.querySelector(".quiz-answer");
      if (list) multipleChoice(quiz, list);
      else if (model) freeText(quiz, model);
    });
  }

  window.LearningQuiz = { init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
})();
