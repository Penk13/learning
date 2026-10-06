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
          if (option.dataset.answer === "correct") option.classList.add("is-correct");
        });
        if (!correct) button.classList.add("is-wrong");

        if (status) {
          status.textContent = correct
            ? "Correct. Explain the reason in your own words."
            : "Not quite. The correct option is highlighted; explain why it is correct.";
        }
        quiz.classList.add("answered");
      });
    });
  });
})();
