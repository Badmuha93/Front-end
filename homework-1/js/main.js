import { createInitialState, playRound } from "./rules.js";
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

function onStateChange(nextState) {
  saveState(nextState);
  render(nextState, ui);
}

function setState(updater) {
  const nextState = updater(state);
  if (nextState === state) {
    return;
  }

  state = nextState;
  onStateChange(nextState);
}

for (const button of ui.choiceButtons) {
  button.addEventListener("click", () => {
    setState((current) => playRound(current, button.dataset.choice));
  });
}

ui.newGameBtn.addEventListener("click", () => {
  setState(() => createInitialState());
});

document.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.code === "KeyN") {
    setState(() => createInitialState());
    return;
  }

  const choice = KEY_TO_CHOICE[event.code];
  if (choice !== undefined) {
    setState((current) => playRound(current, choice));
  }
});

render(state, ui);