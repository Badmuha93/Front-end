import { memo, useRef, type Dispatch } from "react";
import { CHOICES } from "../rules";
import type { GameAction, Outcome, Round } from "../types";

const badges: Record<Outcome, string> = {
  win: "Победа",
  loss: "Поражение",
  draw: "Ничья",
};

type Props = { entries: Round[]; dispatch: Dispatch<GameAction> };

export default memo(function History({ entries, dispatch }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);

  function remove(id: string, button: HTMLButtonElement) {
    if (document.activeElement === button) {
      const row = button.closest("li");
      const neighbor = row?.nextElementSibling ?? row?.previousElementSibling;
      const nextFocus = neighbor?.querySelector("button") ?? heading.current;
      nextFocus?.focus();
    }
    dispatch({ type: "remove", id });
  }

  return (
    <section className="history" aria-labelledby="history-title">
      <h2 id="history-title" tabIndex={-1} ref={heading}>
        История раундов
      </h2>

      {entries.length === 0 && <p className="history__empty">История пуста</p>}

      <ul className="history__list" id="history-list">
        {entries.map((entry) => (
          <li key={entry.id} className="history__item" data-id={entry.id}>
            <span>
              Раунд {entry.round}: {CHOICES[entry.playerChoice].emoji} против{" "}
              {CHOICES[entry.computerChoice].emoji}
            </span>

            <div className="history__meta">
              <strong className={`history__badge--${entry.outcome}`}>
                {badges[entry.outcome]}
              </strong>
              <button
                type="button"
                className="history__delete-btn"
                aria-label={`Удалить запись раунда ${entry.round}`}
                onClick={(event) => remove(entry.id, event.currentTarget)}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
});
