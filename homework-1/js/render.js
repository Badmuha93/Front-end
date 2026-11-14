import { CHOICES, WIN_SCORE, getMatchWinner } from "./rules.js";

const OUTCOME_TEXT = {
  win: { status: "Вы выиграли раунд!", badge: "Победа", className: "win" },
  loss: { status: "Компьютер выиграл раунд", badge: "Поражение", className: "loss" },
  draw: { status: "Ничья в раунде", badge: "Ничья", className: "draw" },
};

export function render(state, ui) {
  const winner = getMatchWinner(state);
  const isFinished = winner !== null;

  ui.playerScore.textContent = String(state.playerScore);
  ui.computerScore.textContent = String(state.computerScore);
  ui.roundNumber.textContent = String(state.round);

  ui.statusMessage.className = "status-message";

  if (winner === "player") {
    ui.statusMessage.textContent = `Победа в матче! Вы первым набрали ${WIN_SCORE} очка.`;
    ui.statusMessage.classList.add("status-message--win");
  } else if (winner === "computer") {
    ui.statusMessage.textContent = `Поражение в матче. Компьютер первым набрал ${WIN_SCORE} очка.`;
    ui.statusMessage.classList.add("status-message--loss");
  } else if (state.lastRound !== null) {
    const info = OUTCOME_TEXT[state.lastRound.outcome];
    ui.statusMessage.textContent = info.status;
    ui.statusMessage.classList.add(`status-message--${info.className}`);
  } else {
    ui.statusMessage.textContent = "Сделайте первый ход, чтобы начать партию";
  }

  if (state.lastRound === null) {
    ui.duelDisplay.hidden = true;
  } else {
    const playerChoice = CHOICES[state.lastRound.playerChoice];
    const computerChoice = CHOICES[state.lastRound.computerChoice];
    ui.duelDisplay.hidden = false;
    ui.playerChoiceDisplay.textContent = `${playerChoice.emoji} ${playerChoice.label}`;
    ui.computerChoiceDisplay.textContent = `${computerChoice.emoji} ${computerChoice.label}`;
  }

  for (const button of ui.choiceButtons) {
    button.disabled = isFinished;
  }

  ui.newGameBtn.classList.toggle("reset-btn--highlight", isFinished);

  ui.historyEmpty.hidden = state.history.length > 0;
  const items = state.history.map((entry) => {
    const li = document.createElement("li");
    li.className = "history__item";

    const player = CHOICES[entry.playerChoice];
    const computer = CHOICES[entry.computerChoice];
    const info = OUTCOME_TEXT[entry.outcome];

    const summary = document.createElement("span");
    summary.textContent = `Раунд ${entry.round}: ${player.emoji} против ${computer.emoji}`;

    const badge = document.createElement("strong");
    badge.className = `history__badge--${info.className}`;
    badge.textContent = info.badge;

    li.append(summary, badge);
    return li;
  });

  ui.historyList.replaceChildren(...items);
}