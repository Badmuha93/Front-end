import confetti from "canvas-confetti";
import "./style.css";
import {
  createInitialState,
  getMatchWinner,
  playRound,
  removeHistoryEntry,
  setPlayerName,
} from "./rules.js";
import { loadState, saveState } from "./storage.js";
import { render } from "./render.js";

const KEY_TO_CHOICE = {
  Digit1: "rock",
  Numpad1: "rock",
  KeyR: "rock",
  Digit2: "scissors",
  Numpad2: "scissors",
  KeyS: "scissors",
  Digit3: "paper",
  Numpad3: "paper",
  KeyP: "paper",
};

const ui = {
  playerNameInput: document.querySelector("#player-name-input"),
  playerLabel: document.querySelector("#player-label"),
  playerScore: document.querySelector("#player-score"),
  computerScore: document.querySelector("#computer-score"),
  roundNumber: document.querySelector("#round-number"),
  statusMessage: document.querySelector("#status-message"),
  duelDisplay: document.querySelector("#duel-display"),
  playerChoiceDisplay: document.querySelector("#player-choice-display"),
  computerChoiceDisplay: document.querySelector("#computer-choice-display"),
  choiceButtons: document.querySelectorAll(".choice-btn"),
  newGameBtn: document.querySelector("#new-game-btn"),
  historyEmpty: document.querySelector("#history-empty"),
  historyList: document.querySelector("#history-list"),
};

let state = loadState() ?? createInitialState();

function update(nextState) {
  state = nextState;
  saveState(state);
  render(state, ui);
}

function handleMove(choice) {
  const prevWinner = getMatchWinner(state);
  const nextState = playRound(state, choice);
  if (nextState === state) {
    return;
  }

  update(nextState);

  if (prevWinner === null && getMatchWinner(nextState) === "player") {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
}

function handleNewGame() {
  update(createInitialState(state.playerName));
}

ui.playerNameInput.addEventListener("input", (event) => {
  update(setPlayerName(state, event.target.value));
});

for (const button of ui.choiceButtons) {
  button.addEventListener("click", () => {
    handleMove(button.dataset.choice);
  });
}

ui.newGameBtn.addEventListener("click", handleNewGame);

ui.historyList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const deleteBtn = target.closest(".history__delete-btn");
  if (deleteBtn === null) {
    return;
  }

  const item = deleteBtn.closest(".history__item");
  if (item?.dataset.id !== undefined) {
    update(removeHistoryEntry(state, item.dataset.id));
  }
});

document.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return;
  }

  if (event.code === "KeyN") {
    handleNewGame();
    return;
  }

  const choice = KEY_TO_CHOICE[event.code];
  if (choice !== undefined) {
    handleMove(choice);
  }
});

render(state, ui);
