import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WIN_SCORE,
  createInitialState,
  playRound,
  removeHistoryEntry,
} from "../src/rules.js";
import { isValidState, loadState, saveState } from "../src/storage.js";

const STORAGE_KEY = "rps-game:v2:save";

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function createGame(outcomes) {
  const computerChoices = { win: "scissors", loss: "paper", draw: "rock" };

  return outcomes.reduce(
    (state, outcome, index) =>
      playRound(state, "rock", computerChoices[outcome], `r-${index + 1}`),
    createInitialState("Эрдэни"),
  );
}

function assertRejected(state) {
  assert.equal(isValidState(state), false);

  const storage = createMemoryStorage();
  saveState(state, storage);
  assert.equal(loadState(storage), null);
  assert.equal(storage.getItem(STORAGE_KEY), null);
}

describe("Согласованность сохранённого матча", () => {
  it("отклоняет счёт, противоречащий единственному раунду", () => {
    assertRejected({ ...createGame(["win"]), playerScore: 0 });
    assertRejected({ ...createGame(["loss"]), computerScore: 0 });
    assertRejected({ ...createGame(["draw"]), playerScore: 1 });
  });

  it("сверяет счёт со всей сохранившейся историей", () => {
    const state = createGame(["win", "loss", "draw"]);
    assertRejected({ ...state, playerScore: 2 });
    assertRejected({ ...state, computerScore: 0 });
  });

  it("не приписывает одному удалённому раунду два очка", () => {
    const state = removeHistoryEntry(
      createGame(["draw", "win", "loss", "draw"]),
      "r-1",
    );
    assertRejected({ ...state, playerScore: 2, computerScore: 2 });
  });

  for (const outcome of ["win", "loss"]) {
    it(`отклоняет лишний раунд после завершения матча: ${outcome}`, () => {
      const state = createGame(Array(WIN_SCORE).fill(outcome));
      const extraRound = {
        id: "extra",
        round: state.round + 1,
        playerChoice: "rock",
        computerChoice: "rock",
        outcome: "draw",
      };

      assertRejected({
        ...state,
        round: extraRound.round,
        lastRound: extraRound,
        history: [extraRound, ...state.history],
      });
    });
  }

  it("сопоставляет lastRound с текущим раундом в истории", () => {
    const state = createGame(["win", "loss"]);
    assertRejected({
      ...state,
      lastRound: { ...state.lastRound, id: "another-id" },
    });
    assertRejected({
      ...state,
      lastRound: { ...state.lastRound, round: 1 },
    });
  });

  it("не разрешает повторно использовать id удалённого последнего раунда", () => {
    const state = removeHistoryEntry(createGame(["win", "loss"]), "r-2");
    assertRejected({
      ...state,
      lastRound: { ...state.lastRound, id: "r-1" },
    });
  });

  it("отклоняет дубликаты и неправильный порядок истории", () => {
    const state = createGame(["win", "loss", "draw"]);
    assertRejected({ ...state, history: [...state.history].reverse() });
    assertRejected({
      ...state,
      history: [
        state.history[0],
        { ...state.history[1], id: state.history[0].id },
        state.history[2],
      ],
    });
    assertRejected({
      ...state,
      history: [
        state.history[0],
        { ...state.history[1], round: state.round },
        state.history[2],
      ],
    });
  });

  for (const outcomes of [
    [],
    ["win", "draw", "loss"],
    ["win", "draw", "loss", "win", "win"],
    ["loss", "draw", "win", "loss", "loss"],
  ]) {
    it(`восстанавливает допустимый матч и удалённую историю: ${outcomes.join(", ") || "новый"}`, () => {
      const state = createGame(outcomes);
      const variants = [
        state,
        removeHistoryEntry(state, "r-1"),
        removeHistoryEntry(state, state.lastRound?.id),
        { ...state, history: [] },
      ];

      for (const variant of variants) {
        const storage = createMemoryStorage();
        assert.equal(isValidState(variant), true);
        saveState(variant, storage);
        assert.deepEqual(loadState(storage), variant);
      }
    });
  }

  it("сбрасывает неизвестную версию сохранения", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, state: createInitialState() }),
    );
    assert.equal(loadState(storage), null);
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });

  it("не ломает игру при ошибках чтения, записи и удаления", () => {
    const fail = () => {
      throw new Error("Storage is unavailable");
    };
    const storage = { getItem: fail, setItem: fail, removeItem: fail };

    assert.doesNotThrow(() => saveState(createInitialState(), storage));
    assert.equal(loadState(storage), null);
  });

  it("обрабатывает запрет доступа к самому localStorage", () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage",
    );

    try {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get() {
          throw new Error("Access denied");
        },
      });

      assert.doesNotThrow(() => saveState(createInitialState()));
      assert.equal(loadState(), null);
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, "localStorage", descriptor);
      } else {
        delete globalThis.localStorage;
      }
    }
  });
});