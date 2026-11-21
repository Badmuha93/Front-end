import {
  MAX_NAME_LENGTH,
  WIN_SCORE,
  isValidChoice,
  resolveRoundOutcome,
} from "./rules.js";

const STORAGE_KEY = "rps-game:v2:save";
const SAVE_VERSION = 2;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidRoundEntry(entry) {
  return (
    isObject(entry) &&
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    Number.isSafeInteger(entry.round) &&
    entry.round > 0 &&
    isValidChoice(entry.playerChoice) &&
    isValidChoice(entry.computerChoice) &&
    resolveRoundOutcome(entry.playerChoice, entry.computerChoice) ===
      entry.outcome
  );
}

function isSameRound(first, second) {
  return (
    first.id === second.id &&
    first.round === second.round &&
    first.playerChoice === second.playerChoice &&
    first.computerChoice === second.computerChoice &&
    first.outcome === second.outcome
  );
}

export function isValidState(data) {
  if (!isObject(data)) {
    return false;
  }

  const nameValid =
    typeof data.playerName === "string" &&
    data.playerName.length <= MAX_NAME_LENGTH;

  const scoresValid =
    Number.isSafeInteger(data.playerScore) &&
    data.playerScore >= 0 &&
    data.playerScore <= WIN_SCORE &&
    Number.isSafeInteger(data.computerScore) &&
    data.computerScore >= 0 &&
    data.computerScore <= WIN_SCORE &&
    Number.isSafeInteger(data.round) &&
    data.round >= 0;

  if (
    !nameValid ||
    !scoresValid ||
    data.playerScore + data.computerScore > data.round ||
    (data.playerScore === WIN_SCORE && data.computerScore === WIN_SCORE) ||
    !Array.isArray(data.history) ||
    data.history.length > data.round
  ) {
    return false;
  }

  if (data.round === 0) {
    return data.lastRound === null && data.history.length === 0;
  }

  if (
    !isValidRoundEntry(data.lastRound) ||
    data.lastRound.round !== data.round
  ) {
    return false;
  }

  if (
    (data.playerScore === WIN_SCORE && data.lastRound.outcome !== "win") ||
    (data.computerScore === WIN_SCORE && data.lastRound.outcome !== "loss")
  ) {
    return false;
  }

  let knownRounds = 1;
  let knownWins = data.lastRound.outcome === "win" ? 1 : 0;
  let knownLosses = data.lastRound.outcome === "loss" ? 1 : 0;
  let previousRound = Infinity;
  const seenIds = new Set();

  for (const entry of data.history) {
    if (
      !isValidRoundEntry(entry) ||
      entry.round > data.round ||
      entry.round >= previousRound ||
      seenIds.has(entry.id)
    ) {
      return false;
    }

    seenIds.add(entry.id);
    previousRound = entry.round;

    if (entry.round === data.round) {
      if (!isSameRound(entry, data.lastRound)) {
        return false;
      }
      continue;
    }

    if (entry.id === data.lastRound.id) {
      return false;
    }

    knownRounds += 1;
    knownWins += entry.outcome === "win" ? 1 : 0;
    knownLosses += entry.outcome === "loss" ? 1 : 0;
  }

  const unknownRounds = data.round - knownRounds;
  const unknownWins = data.playerScore - knownWins;
  const unknownLosses = data.computerScore - knownLosses;

  return (
    unknownWins >= 0 &&
    unknownLosses >= 0 &&
    unknownWins + unknownLosses <= unknownRounds
  );
}

export function saveState(state, storage) {
  try {
    const targetStorage = storage ?? globalThis.localStorage;
    targetStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SAVE_VERSION, state }),
    );
  } catch {
    return;
  }
}

export function loadState(storage) {
  let targetStorage;

  try {
    targetStorage = storage ?? globalThis.localStorage;
    const raw = targetStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed?.version !== SAVE_VERSION || !isValidState(parsed.state)) {
      targetStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.state;
  } catch {
    try {
      targetStorage?.removeItem(STORAGE_KEY);
    } catch {
      return null;
    }

    return null;
  }
}