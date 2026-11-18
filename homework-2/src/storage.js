import {
  MAX_NAME_LENGTH,
  WIN_SCORE,
  isValidChoice,
  resolveRoundOutcome,
} from "./rules.js";

const STORAGE_KEY = "rps-game:v2:save";
const SAVE_VERSION = 2;

function isValidRoundEntry(entry) {
  if (entry === null || typeof entry !== "object") {
    return false;
  }

  const hasValidFields =
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    Number.isInteger(entry.round) &&
    entry.round > 0 &&
    isValidChoice(entry.playerChoice) &&
    isValidChoice(entry.computerChoice) &&
    typeof entry.outcome === "string";

  if (!hasValidFields) {
    return false;
  }

  return (
    resolveRoundOutcome(entry.playerChoice, entry.computerChoice) ===
    entry.outcome
  );
}

export function isValidState(data) {
  if (data === null || typeof data !== "object") {
    return false;
  }

  const nameValid =
    typeof data.playerName === "string" &&
    data.playerName.length <= MAX_NAME_LENGTH;

  const scoresValid =
    Number.isInteger(data.playerScore) &&
    data.playerScore >= 0 &&
    data.playerScore <= WIN_SCORE &&
    Number.isInteger(data.computerScore) &&
    data.computerScore >= 0 &&
    data.computerScore <= WIN_SCORE &&
    Number.isInteger(data.round) &&
    data.round >= 0;

  const bothWon =
    data.playerScore === WIN_SCORE && data.computerScore === WIN_SCORE;
  const scoresFitRounds = data.playerScore + data.computerScore <= data.round;

  if (!nameValid || !scoresValid || bothWon || !scoresFitRounds) {
    return false;
  }

  if (!Array.isArray(data.history) || data.history.length > data.round) {
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

  const seenIds = new Set();
  let prevRound = data.round + 1;

  for (const entry of data.history) {
    if (
      !isValidRoundEntry(entry) ||
      entry.round >= prevRound ||
      seenIds.has(entry.id)
    ) {
      return false;
    }
    seenIds.add(entry.id);
    prevRound = entry.round;
  }

  if (data.history.length > 0 && data.history[0].round === data.round) {
    const latest = data.history[0];
    const matchesLastRound =
      latest.id === data.lastRound.id &&
      latest.playerChoice === data.lastRound.playerChoice &&
      latest.computerChoice === data.lastRound.computerChoice &&
      latest.outcome === data.lastRound.outcome;

    if (!matchesLastRound) {
      return false;
    }
  }

  return true;
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    const payload = JSON.stringify({
      version: SAVE_VERSION,
      state,
    });
    storage.setItem(STORAGE_KEY, payload);
  } catch {
    return;
  }
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed?.version !== SAVE_VERSION || !isValidState(parsed.state)) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.state;
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      return null;
    }
    return null;
  }
}
