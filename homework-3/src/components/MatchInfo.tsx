import { CHOICES, WIN_SCORE } from "../rules";
import type { Choice, GameState, Outcome, Winner } from "../types";

const messages: Record<Outcome, string> = {
  win: "Вы выиграли раунд!",
  loss: "Компьютер выиграл раунд",
  draw: "Ничья в раунде",
};

function gesture(choice: Choice) {
  const { emoji, label } = CHOICES[choice];
  return `${emoji} ${label}`;
}

type Props = { state: GameState; winner: Winner };

export default function MatchInfo({ state, winner }: Props) {
  const name = state.playerName.trim() || "Игрок";
  const last = state.lastRound;
  let outcome = last?.outcome;
  let message = last
    ? messages[last.outcome]
    : "Сделайте первый ход, чтобы начать партию";

  if (winner === "player") {
    message = `Победа в матче! ${name} набрал ${WIN_SCORE} очка.`;
    outcome = "win";
  } else if (winner === "computer") {
    message = `Поражение в матче. Компьютер набрал ${WIN_SCORE} очка.`;
    outcome = "loss";
  }

  return (
    <>
      <section className="scoreboard" aria-label="Счёт матча">
        <div className="score-card">
          <span className="score-card__label" id="player-label">
            {name}
          </span>
          <strong className="score-card__value" id="player-score">
            {state.playerScore}
          </strong>
        </div>
        <div className="score-card">
          <span className="score-card__label">Раунд</span>
          <strong className="score-card__value" id="round-number">
            {state.round}
          </strong>
        </div>
        <div className="score-card">
          <span className="score-card__label">Компьютер</span>
          <strong className="score-card__value" id="computer-score">
            {state.computerScore}
          </strong>
        </div>
      </section>

      <section className="arena" aria-live="polite">
        <p
          id="status-message"
          className={
            outcome
              ? `status-message status-message--${outcome}`
              : "status-message"
          }
        >
          {message}
        </p>

        {last && (
          <div className="duel" id="duel-display">
            <div className="duel__side">
              <span className="duel__caption">Ваш ход</span>
              <span className="duel__choice">{gesture(last.playerChoice)}</span>
            </div>
            <span className="duel__vs">VS</span>
            <div className="duel__side">
              <span className="duel__caption">Ход компьютера</span>
              <span className="duel__choice">
                {gesture(last.computerChoice)}
              </span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
