import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WIN_SCORE,
  createInitialState,
  getMatchWinner,
  playRound,
  removeHistoryEntry,
  resolveRoundOutcome,
  setPlayerName,
} from "../src/rules.js";

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
