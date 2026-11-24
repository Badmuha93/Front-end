export const WIN_SCORE = 3;

export const CHOICES = {
  rock: { id: "rock", label: "Камень", emoji: "🪨", beats: "scissors" },
  scissors: { id: "scissors", label: "Ножницы", emoji: "✂️", beats: "paper" },
  paper: { id: "paper", label: "Бумага", emoji: "📄", beats: "rock" },
};

const CHOICE_KEYS = Object.keys(CHOICES);

export function isValidChoice(value) {
  return typeof value === "string" && Object.hasOwn(CHOICES, value);
}

export function createInitialState() {
  return {
    playerScore: 0,
    computerScore: 0,
    round: 0,
    lastRound: null,
    history: [],
  };
}

export function getRandomChoice() {
  const index = Math.floor(Math.random() * CHOICE_KEYS.length);
  return CHOICE_KEYS[index];
}

export function resolveRoundOutcome(playerChoice, computerChoice) {
  if (!isValidChoice(playerChoice) || !isValidChoice(computerChoice)) {
    return null;
  }
  if (playerChoice === computerChoice) {
    return "draw";
  }
  return CHOICES[playerChoice].beats === computerChoice ? "win" : "loss";
}

export function getMatchWinner(state) {
  if (state.playerScore >= WIN_SCORE) {
    return "player";
  }
  if (state.computerScore >= WIN_SCORE) {
    return "computer";
  }
  return null;
}

export function playRound(state, playerChoice, computerChoice = getRandomChoice()) {
  if (
    !isValidChoice(playerChoice) ||
    !isValidChoice(computerChoice) ||
    getMatchWinner(state) !== null
  ) {
    return state;
  }

  const outcome = resolveRoundOutcome(playerChoice, computerChoice);
  const nextRound = state.round + 1;
  const roundEntry = {
    round: nextRound,
    playerChoice,
    computerChoice,
    outcome,
  };

  return {
    playerScore: state.playerScore + (outcome === "win" ? 1 : 0),
    computerScore: state.computerScore + (outcome === "loss" ? 1 : 0),
    round: nextRound,
    lastRound: roundEntry,
    history: [roundEntry, ...state.history],
  };
}