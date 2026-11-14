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

function update(nextState) {
  state = nextState;
  saveState(state);
  render(state, ui);
}

function handleMove(choice) {
  const nextState = playRound(state, choice);
  if (nextState !== state) {
    update(nextState);
  }
}

function handleNewGame() {
  update(createInitialState());
}

for (const button of ui.choiceButtons) {
  button.addEventListener("click", () => {
    handleMove(button.dataset.choice);
  });
}

ui.newGameBtn.addEventListener("click", handleNewGame);

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
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