import { CHOICES, WIN_SCORE, getMatchWinner } from "./rules.js";

const OUTCOME_TEXT = {
  win: { status: "Вы выиграли раунд!", badge: "Победа", className: "win" },
  loss: {
    status: "Компьютер выиграл раунд",
    badge: "Поражение",
    className: "loss",
  },
  draw: { status: "Ничья в раунде", badge: "Ничья", className: "draw" },
};

function setText(element, value) {
  if (element.textContent !== value) {
    element.textContent = value;
  }
}

function createHistoryItem(id) {
  const item = document.createElement("li");
  item.className = "history__item";
  item.dataset.id = id;

  const summary = document.createElement("span");
  const meta = document.createElement("div");
  meta.className = "history__meta";

  const badge = document.createElement("strong");
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "history__delete-btn";
  deleteBtn.textContent = "×";

  meta.append(badge, deleteBtn);
  item.append(summary, meta);
  return item;
}

function renderHistory(history, list) {
  const itemsById = new Map(
    Array.from(list.children, (item) => [item.dataset.id, item]),
  );
  const activeIds = new Set(history.map((entry) => entry.id));

  for (const [id, item] of itemsById) {
    if (!activeIds.has(id)) {
      item.remove();
    }
  }

  let nextNode = list.firstElementChild;

  for (const entry of history) {
    const item = itemsById.get(entry.id) ?? createHistoryItem(entry.id);
    const summary = item.firstElementChild;
    const meta = item.lastElementChild;
    const badge = meta.firstElementChild;
    const deleteBtn = meta.lastElementChild;
    const player = CHOICES[entry.playerChoice];
    const computer = CHOICES[entry.computerChoice];
    const info = OUTCOME_TEXT[entry.outcome];

    setText(
      summary,
      `Раунд ${entry.round}: ${player.emoji} против ${computer.emoji}`,
    );
    setText(badge, info.badge);

    const badgeClass = `history__badge--${info.className}`;
    if (badge.className !== badgeClass) {
      badge.className = badgeClass;
    }

    const deleteLabel = `Удалить запись раунда ${entry.round}`;
    if (deleteBtn.getAttribute("aria-label") !== deleteLabel) {
      deleteBtn.setAttribute("aria-label", deleteLabel);
    }

    if (item !== nextNode) {
      list.insertBefore(item, nextNode);
    }
    nextNode = item.nextElementSibling;
  }
}

export function render(state, ui) {
  const winner = getMatchWinner(state);
  const isFinished = winner !== null;
  const displayName = state.playerName.trim() || "Игрок";

  if (document.activeElement !== ui.playerNameInput) {
    ui.playerNameInput.value = state.playerName;
  }

  ui.playerLabel.textContent = displayName;
  ui.playerScore.textContent = String(state.playerScore);
  ui.computerScore.textContent = String(state.computerScore);
  ui.roundNumber.textContent = String(state.round);

  ui.statusMessage.className = "status-message";

  if (winner === "player") {
    ui.statusMessage.textContent = `Победа в матче! ${displayName} первым набрал ${WIN_SCORE} очка.`;
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
  renderHistory(state.history, ui.historyList);
}