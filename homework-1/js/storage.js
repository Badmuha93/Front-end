import { WIN_SCORE, isValidChoice, resolveRoundOutcome } from "./rules.js";

const STORAGE_KEY = "rps-game:save";
const SAVE_VERSION = 1;

function isValidRoundEntry(entry) {
  if (entry === null || typeof entry !== "object") {
    return false;
  }

  const hasValidFields =
    Number.isInteger(entry.round) &&
    entry.round > 0 &&
    isValidChoice(entry.playerChoice) &&
    isValidChoice(entry.computerChoice) &&
    typeof entry.outcome === "string";

  if (!hasValidFields) {
    return false;
  }

  return resolveRoundOutcome(entry.playerChoice, entry.computerChoice) === entry.outcome;
}

function isValidState(data) {
  if (data === null || typeof data !== "object") {
    return false;
  }

  const scoresValid =
    Number.isInteger(data.playerScore) &&
    data.playerScore >= 0 &&
    data.playerScore <= WIN_SCORE &&
    Number.isInteger(data.computerScore) &&
    data.computerScore >= 0 &&
    data.computerScore <= WIN_SCORE &&
    Number.isInteger(data.round) &&
    data.round >= 0;

  const bothWon = data.playerScore === WIN_SCORE && data.computerScore === WIN_SCORE;
  const scoresFitRounds = data.playerScore + data.computerScore <= data.round;

  if (!scoresValid || bothWon || !scoresFitRounds) {
    return false;
  }

  if (!Array.isArray(data.history) || data.history.length !== data.round) {
    return false;
  }

  if (data.round === 0) {
    return data.lastRound === null;
  }

  if (!isValidRoundEntry(data.lastRound) || data.lastRound.round !== data.round) {
    return false;
  }

  let expectedRound = data.round;
  let wins = 0;
  let losses = 0;

  for (const entry of data.history) {
    if (!isValidRoundEntry(entry) || entry.round !== expectedRound) {
      return false;
    }
    expectedRound -= 1;

    if (entry.outcome === "win") {
      wins += 1;
    } else if (entry.outcome === "loss") {
      losses += 1;
    }
  }

  if (wins !== data.playerScore || losses !== data.computerScore) {
    return false;
  }

  const latest = data.history[0];
  if (
    (data.playerScore === WIN_SCORE && latest.outcome !== "win") ||
    (data.computerScore === WIN_SCORE && latest.outcome !== "loss")
  ) {
    return false;
  }

  return (
    latest.playerChoice === data.lastRound.playerChoice &&
    latest.computerChoice === data.lastRound.computerChoice &&
    latest.outcome === data.lastRound.outcome
  );
}

export function saveState(state) {
  try {
    const payload = JSON.stringify({
      version: SAVE_VERSION,
      state,
    });
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    return;
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed?.version !== SAVE_VERSION || !isValidState(parsed.state)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.state;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      return null;
    }
    return null;
  }
}
