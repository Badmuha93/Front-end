import type { Choice, GameAction, GameState, Outcome, Winner } from "./types";

export const WIN_SCORE = 3;
export const MAX_NAME_LENGTH = 24;

export const CHOICES = {
  rock: {
    id: "rock",
    label: "Камень",
    emoji: "🪨",
    beats: "scissors",
    keys: "1 / R",
  },
  scissors: {
    id: "scissors",
    label: "Ножницы",
    emoji: "✂️",
    beats: "paper",
    keys: "2 / S",
  },
  paper: {
    id: "paper",
    label: "Бумага",
    emoji: "📄",
    beats: "rock",
    keys: "3 / P",
  },
} as const;

const choices = Object.values(CHOICES);

export function isValidChoice(value: unknown): value is Choice {
  return typeof value === "string" && Object.hasOwn(CHOICES, value);
}

export function createRoundId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function getRandomChoice(): Choice {
  return choices[Math.floor(Math.random() * choices.length)].id;
}

export function normalizePlayerName(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_NAME_LENGTH) : "";
}

export function createInitialState(name = ""): GameState {
  return {
    playerName: normalizePlayerName(name),
    playerScore: 0,
    computerScore: 0,
    round: 0,
    lastRound: null,
    history: [],
  };
}

export function setPlayerName(state: GameState, name: string): GameState {
  const playerName = normalizePlayerName(name);
  return playerName === state.playerName ? state : { ...state, playerName };
}

export function resolveRoundOutcome(
  player: unknown,
  computer: unknown,
): Outcome | null {
  if (!isValidChoice(player) || !isValidChoice(computer)) return null;
  if (player === computer) return "draw";
  return CHOICES[player].beats === computer ? "win" : "loss";
}

export function getMatchWinner(state: GameState): Winner {
  if (state.playerScore >= WIN_SCORE) return "player";
  if (state.computerScore >= WIN_SCORE) return "computer";
  return null;
}

export function playRound(
  state: GameState,
  playerChoice: Choice,
  computerChoice: Choice,
  id: string,
): GameState {
  const outcome = resolveRoundOutcome(playerChoice, computerChoice);
  if (outcome === null || getMatchWinner(state) !== null) return state;

  const round = state.round + 1;
  const entry = { id, round, playerChoice, computerChoice, outcome };

  return {
    ...state,
    playerScore: state.playerScore + (outcome === "win" ? 1 : 0),
    computerScore: state.computerScore + (outcome === "loss" ? 1 : 0),
    round,
    lastRound: entry,
    history: [entry, ...state.history],
  };
}

export function removeHistoryEntry(state: GameState, id: string): GameState {
  const history = state.history.filter((entry) => entry.id !== id);
  return history.length === state.history.length
    ? state
    : { ...state, history };
}

export function playAction(playerChoice: Choice): GameAction {
  return {
    type: "play",
    playerChoice,
    computerChoice: getRandomChoice(),
    id: createRoundId(),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "play":
      return playRound(
        state,
        action.playerChoice,
        action.computerChoice,
        action.id,
      );
    case "rename":
      return setPlayerName(state, action.name);
    case "remove":
      return removeHistoryEntry(state, action.id);
    case "reset":
      return createInitialState(state.playerName);
  }
}
