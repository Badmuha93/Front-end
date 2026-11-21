import { useEffect, useRef, type Dispatch } from "react";
import party from "party-js";
import { CHOICES, playAction } from "../rules";
import type { Choice, GameAction, Winner } from "../types";

const shortcuts: Partial<Record<string, Choice>> = {
  Digit1: "rock",
  Numpad1: "rock",
  KeyR: "rock",
  Digit2: "scissors",
  Numpad2: "scissors",
  KeyS: "scissors",
  Digit3: "paper",
  Numpad3: "paper",
  KeyP: "paper",
};

type Props = { winner: Winner; dispatch: Dispatch<GameAction> };

export default function Controls({ winner, dispatch }: Props) {
  const reset = useRef<HTMLButtonElement>(null);
  const previousWinner = useRef(winner);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;

      if (
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.isComposing
      )
        return;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select"))
      )
        return;

      if (event.code === "KeyN") {
        if (document.activeElement?.closest(".history__list")) {
          reset.current?.focus();
        }
        dispatch({ type: "reset" });
        return;
      }

      const choice = shortcuts[event.code];
      if (choice) dispatch(playAction(choice));
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dispatch]);

  useEffect(() => {
    const justFinished = previousWinner.current === null && winner !== null;
    previousWinner.current = winner;
    if (!justFinished || !reset.current) return;

    const active = document.activeElement;
    if (active === document.body || active?.matches(".choice-btn:disabled")) {
      reset.current.focus();
    }
    if (winner === "player") party.confetti(reset.current, { count: 60 });
  }, [winner]);

  return (
    <>
      <section className="controls" aria-label="Выбор хода">
        {Object.values(CHOICES).map((choice) => (
          <button
            key={choice.id}
            className="choice-btn"
            type="button"
            data-choice={choice.id}
            disabled={winner !== null}
            onClick={() => dispatch(playAction(choice.id))}
          >
            <span className="choice-btn__emoji" aria-hidden="true">
              {choice.emoji}
            </span>
            <span className="choice-btn__title">{choice.label}</span>
            <kbd className="choice-btn__key">{choice.keys}</kbd>
          </button>
        ))}
      </section>

      <div className="actions">
        <button
          id="new-game-btn"
          ref={reset}
          type="button"
          className={winner ? "reset-btn reset-btn--highlight" : "reset-btn"}
          onClick={() => dispatch({ type: "reset" })}
        >
          Новая партия <kbd>N</kbd>
        </button>
      </div>
    </>
  );
}
