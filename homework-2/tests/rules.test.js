import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WIN_SCORE,
  createInitialState,
  createRoundId,
  getMatchWinner,
  playRound,
  removeHistoryEntry,
  resolveRoundOutcome,
  setPlayerName,
} from "../src/rules.js";
import { isValidState, loadState, saveState } from "../src/storage.js";

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

describe("Правила игры «Камень, ножницы, бумага»", () => {
  it("корректно определяет исход раунда для всех комбинаций", () => {
    assert.equal(resolveRoundOutcome("rock", "scissors"), "win");
    assert.equal(resolveRoundOutcome("scissors", "paper"), "win");
    assert.equal(resolveRoundOutcome("paper", "rock"), "win");

    assert.equal(resolveRoundOutcome("scissors", "rock"), "loss");
    assert.equal(resolveRoundOutcome("paper", "scissors"), "loss");
    assert.equal(resolveRoundOutcome("rock", "paper"), "loss");

    assert.equal(resolveRoundOutcome("rock", "rock"), "draw");
  });

  it("обновляет счёт, номер раунда и историю без мутации исходного состояния", () => {
    const initial = createInitialState("Эрдэни");
    const afterWin = playRound(initial, "rock", "scissors", "r-1");

    assert.equal(initial.playerScore, 0);
    assert.equal(initial.history.length, 0);

    assert.equal(afterWin.playerScore, 1);
    assert.equal(afterWin.computerScore, 0);
    assert.equal(afterWin.round, 1);
    assert.equal(afterWin.history.length, 1);
    assert.deepEqual(afterWin.history[0], {
      id: "r-1",
      round: 1,
      playerChoice: "rock",
      computerChoice: "scissors",
      outcome: "win",
    });
  });

  it("игнорирует некорректные жесты игрока и компьютера", () => {
    const initial = createInitialState();

    assert.equal(playRound(initial, "lizard", "rock", "r-bad-1"), initial);
    assert.equal(playRound(initial, "rock", "spock", "r-bad-2"), initial);
    assert.ok(createRoundId().length > 0);
  });

  it("завершает матч при достижении WIN_SCORE и блокирует последующие ходы", () => {
    let state = createInitialState();
    for (let i = 1; i <= WIN_SCORE; i += 1) {
      state = playRound(state, "paper", "rock", `r-${i}`);
    }

    assert.equal(getMatchWinner(state), "player");
    assert.equal(state.playerScore, WIN_SCORE);

    const afterExtraMove = playRound(state, "rock", "scissors", "r-extra");
    assert.equal(afterExtraMove, state);
    assert.equal(afterExtraMove.round, WIN_SCORE);
  });

  it("удаляет выбранную запись из истории раундов", () => {
    let state = createInitialState();
    state = playRound(state, "rock", "scissors", "r-1");
    state = playRound(state, "paper", "rock", "r-2");

    const updated = removeHistoryEntry(state, "r-1");
    assert.equal(updated.history.length, 1);
    assert.equal(updated.history[0].id, "r-2");
  });

  it("обновляет и ограничивает длину имени игрока", () => {
    const initial = createInitialState();
    const renamed = setPlayerName(
      initial,
      "ОченьДлинноеИмяИгрокаКотороеНадоОбрезать",
    );

    assert.equal(renamed.playerName.length, 24);
  });
});

describe("валидация и восстановление сохранения из localStorage", () => {
  it("отклоняет невозможные сочетания счёта, числа раундов и lastRound", () => {
    const afterOneRound = playRound(
      createInitialState("Эрдэни"),
      "rock",
      "scissors",
      "r-1",
    );

    const wonAtZeroRounds = {
      ...createInitialState("Эрдэни"),
      playerScore: WIN_SCORE,
      round: 0,
    };

    const scoreGreaterThanRounds = {
      ...afterOneRound,
      playerScore: 2,
      computerScore: 2,
      round: 3,
    };

    const staleLastRound = {
      ...createInitialState("Эрдэни"),
      round: 0,
      lastRound: afterOneRound.lastRound,
    };

    assert.equal(isValidState(wonAtZeroRounds), false);
    assert.equal(isValidState(scoreGreaterThanRounds), false);
    assert.equal(isValidState(staleLastRound), false);
  });

  it("отклоняет запись раунда с несогласованным исходом", () => {
    const state = playRound(
      createInitialState("Эрдэни"),
      "rock",
      "scissors",
      "r-1",
    );
    const wrongOutcomeEntry = {
      ...state.lastRound,
      outcome: "loss",
    };

    assert.equal(
      isValidState({
        ...state,
        lastRound: wrongOutcomeEntry,
        history: [wrongOutcomeEntry],
      }),
      false,
    );
  });

  it("сохраняет и восстанавливает состояние через saveState() и loadState()", () => {
    const storage = createMemoryStorage();
    let state = createInitialState("Эрдэни");
    state = playRound(state, "rock", "scissors", "r-1");
    state = playRound(state, "paper", "scissors", "r-2");
    state = removeHistoryEntry(state, "r-1");

    saveState(state, storage);
    assert.deepEqual(loadState(storage), state);
  });

  it("тихо сбрасывает повреждённый JSON и невалидные данные при loadState()", () => {
    const storage = createMemoryStorage();

    storage.setItem("rps-game:v2:save", "{broken-json");
    assert.equal(loadState(storage), null);
    assert.equal(storage.getItem("rps-game:v2:save"), null);

    storage.setItem(
      "rps-game:v2:save",
      JSON.stringify({
        version: 2,
        state: {
          ...createInitialState("Эрдэни"),
          playerScore: 3,
          round: 0,
        },
      }),
    );
    assert.equal(loadState(storage), null);
    assert.equal(storage.getItem("rps-game:v2:save"), null);
  });
});
