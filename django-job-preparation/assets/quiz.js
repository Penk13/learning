(() => {
  "use strict";

  document.querySelectorAll("[data-quiz]").forEach((quiz) => {
    const buttons = [...quiz.querySelectorAll("button[data-answer]")];
    const status = quiz.querySelector("[data-quiz-status]");
    let answered = false;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        if (answered) return;
        answered = true;

        const correct = button.dataset.answer === "correct";
        buttons.forEach((option) => {
          option.disabled = true;
          if (option.dataset.answer === "correct") {
            option.classList.add("is-correct");
          }
        });
        if (!correct) button.classList.add("is-wrong");

        if (status) {
          status.textContent = correct
            ? "Correct. Keep the explanation in your own words."
            : "Not quite. The correct option is highlighted; try explaining why.";
        }
        quiz.classList.add("answered");
      });
    });
  });
})();
