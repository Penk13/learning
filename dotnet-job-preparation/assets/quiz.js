(() => {
  "use strict";

  document.querySelectorAll("[data-quiz]").forEach((quiz, i) => {
    const buttons = [...quiz.querySelectorAll("[data-answer]")];
    const feedback = quiz.querySelector("[data-feedback]");
    const explanation = quiz.querySelector("[data-explanation]");
    const correct = quiz.dataset.correct;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const isCorrect = button.dataset.answer === correct;

        buttons.forEach((candidate) => {
          candidate.classList.remove("is-selected", "is-correct", "is-wrong");
          candidate.setAttribute("aria-pressed", "false");
        });

        button.classList.add("is-selected", isCorrect ? "is-correct" : "is-wrong");
        button.setAttribute("aria-pressed", "true");
        feedback.hidden = false;
        feedback.className = `quiz-feedback ${isCorrect ? "is-correct" : "is-wrong"}`;
        feedback.textContent = isCorrect
          ? `Correct. ${explanation.dataset.correctText}`
          : `Not quite. ${explanation.dataset.retryText}`;

        // Picked up by assets/progress.js for answer sync.
        const prompt = [...quiz.querySelectorAll("h3, p:not([data-feedback], [data-explanation])")].map((el) => el.textContent).join(" ");
        quiz.dispatchEvent(new CustomEvent("quiz:answered", {
          bubbles: true,
          detail: { qid: quiz.dataset.qid || `q${i + 1}`, question: prompt, answer: button.textContent, correct: isCorrect },
        }));
      });
    });
  });
})();
