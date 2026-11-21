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

function onStateChange(prevState, nextState) {
  saveState(nextState);
  render(nextState, ui);

  if (
    getMatchWinner(prevState) === null &&
    getMatchWinner(nextState) === "player"
  ) {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
}

function setState(updater) {
  const nextState = updater(state);
  if (nextState === state) {
    return;
  }

  const prevState = state;
  state = nextState;
  onStateChange(prevState, nextState);
}

ui.playerNameInput.addEventListener("input", (event) => {
  setState((current) => setPlayerName(current, event.target.value));
});

for (const button of ui.choiceButtons) {
  button.addEventListener("click", () => {
    setState((current) => playRound(current, button.dataset.choice));
  });
}

ui.newGameBtn.addEventListener("click", () => {
  setState((current) => createInitialState(current.playerName));
});

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
  const entryId = item?.dataset.id;
  if (entryId !== undefined) {
    setState((current) => removeHistoryEntry(current, entryId));
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
    setState((current) => createInitialState(current.playerName));
    return;
  }

  const choice = KEY_TO_CHOICE[event.code];
  if (choice !== undefined) {
    setState((current) => playRound(current, choice));
  }
});

render(state, ui);
