import { WIN_SCORE, isValidChoice } from "./rules.js";

const STORAGE_KEY = "rps-game:save";
const SAVE_VERSION = 1;
const VALID_OUTCOMES = new Set(["win", "loss", "draw"]);

function isValidRoundEntry(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    Number.isInteger(entry.round) &&
    entry.round > 0 &&
    isValidChoice(entry.playerChoice) &&
    isValidChoice(entry.computerChoice) &&
    typeof entry.outcome === "string" &&
    VALID_OUTCOMES.has(entry.outcome)
  );
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

  if (!scoresValid) {
    return false;
  }

  const lastRoundValid = data.lastRound === null || isValidRoundEntry(data.lastRound);
  const historyValid = Array.isArray(data.history) && data.history.every(isValidRoundEntry);

  return lastRoundValid && historyValid;
}

export function saveState(state) {
  try {
    const payload = JSON.stringify({
      version: SAVE_VERSION,
      state,
    });
    localStorage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    console.error("Не удалось сохранить состояние игры:", error);
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
      return null;
    }

    return parsed.state;
  } catch {
    return null;
  }
}