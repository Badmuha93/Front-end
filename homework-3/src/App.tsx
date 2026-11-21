import { useEffect, useReducer } from "react";
import { gameReducer, getMatchWinner, MAX_NAME_LENGTH } from "./rules";
import { saveState } from "./storage";
import type { GameState } from "./types";
import MatchInfo from "./components/MatchInfo";
import Controls from "./components/Controls";
import History from "./components/History";

export default function App({ initialState }: { initialState: GameState }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const winner = getMatchWinner(state);

  useEffect(() => {
    if (state !== initialState) saveState(state);
  }, [state, initialState]);

  return (
    <>
      <header className="game__header">
        <h1>Камень, ножницы, бумага</h1>
        <p className="subtitle">
          Матч до 3 побед • прогресс сохраняется автоматически
        </p>
      </header>

      <section className="player-bar" aria-label="Настройки игрока">
        <label className="player-bar__label" htmlFor="player-name-input">
          Имя игрока
        </label>
        <input
          id="player-name-input"
          className="player-bar__input"
          value={state.playerName}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Введите имя"
          onChange={(event) =>
            dispatch({ type: "rename", name: event.currentTarget.value })
          }
        />
      </section>

      <MatchInfo state={state} winner={winner} />
      <Controls winner={winner} dispatch={dispatch} />
      <History entries={state.history} dispatch={dispatch} />
    </>
  );
}
