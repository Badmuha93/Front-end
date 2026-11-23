import {
  MAX_NAME_LENGTH,
  WIN_SCORE,
  isValidChoice,
  resolveRoundOutcome,
} from "./rules";
import type { GameState, Round } from "./types";

const KEY = "rps-game:v2:save";
const VERSION = 2;

type SaveStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isRound(value: unknown): value is Round {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isCount(value.round) &&
    value.round > 0 &&
    isValidChoice(value.playerChoice) &&
    isValidChoice(value.computerChoice) &&
    resolveRoundOutcome(value.playerChoice, value.computerChoice) ===
      value.outcome
  );
}

function sameRound(a: Round, b: Round): boolean {
  return (
    a.id === b.id &&
    a.round === b.round &&
    a.playerChoice === b.playerChoice &&
    a.computerChoice === b.computerChoice &&
    a.outcome === b.outcome
  );
}

export function isValidState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;

  const { playerName, playerScore, computerScore, round, lastRound, history } =
    value;

  if (
    typeof playerName !== "string" ||
    playerName.length > MAX_NAME_LENGTH ||
    !isCount(playerScore) ||
    playerScore > WIN_SCORE ||
    !isCount(computerScore) ||
    computerScore > WIN_SCORE ||
    !isCount(round) ||
    playerScore + computerScore > round ||
    !Array.isArray(history) ||
    history.length > round
  ) {
    return false;
  }

  if (round === 0) return lastRound === null;
  if (!isRound(lastRound) || lastRound.round !== round) return false;
  if (playerScore === WIN_SCORE && lastRound.outcome !== "win") return false;
  if (computerScore === WIN_SCORE && lastRound.outcome !== "loss") return false;

  const remaining = {
    win: playerScore,
    loss: computerScore,
    draw: round - playerScore - computerScore,
  };
  remaining[lastRound.outcome] -= 1;

  const ids = new Set([lastRound.id]);
  let previous = Infinity;

  for (const entry of history) {
    if (!isRound(entry) || entry.round > round || entry.round >= previous) {
      return false;
    }
    previous = entry.round;

    if (entry.round === round) {
      if (!sameRound(entry, lastRound)) return false;
    } else {
      if (ids.has(entry.id)) return false;
      ids.add(entry.id);
      remaining[entry.outcome] -= 1;
    }
  }

  return remaining.win >= 0 && remaining.loss >= 0 && remaining.draw >= 0;
}

function decode(raw: string): GameState | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (
      isRecord(data) &&
      data.version === VERSION &&
      isValidState(data.state)
    ) {
      return data.state;
    }
  } catch {
    return null;
  }
  return null;
}

export function loadState(storage?: SaveStorage): GameState | null {
  try {
    const target = storage ?? globalThis.localStorage;
    const raw = target.getItem(KEY);
    if (raw === null) return null;

    const state = decode(raw);
    if (state === null) target.removeItem(KEY);
    return state;
  } catch {
    return null;
  }
}

export function saveState(state: GameState, storage?: SaveStorage): void {
  try {
    const target = storage ?? globalThis.localStorage;
    target.setItem(KEY, JSON.stringify({ version: VERSION, state }));
  } catch {
    return;
  }
}
