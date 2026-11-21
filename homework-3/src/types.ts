export type Choice = "rock" | "scissors" | "paper";
export type Outcome = "win" | "loss" | "draw";
export type Winner = "player" | "computer" | null;

export interface Round {
  id: string;
  round: number;
  playerChoice: Choice;
  computerChoice: Choice;
  outcome: Outcome;
}

export interface GameState {
  playerName: string;
  playerScore: number;
  computerScore: number;
  round: number;
  lastRound: Round | null;
  history: Round[];
}

export type GameAction =
  | { type: "play"; playerChoice: Choice; computerChoice: Choice; id: string }
  | { type: "rename"; name: string }
  | { type: "remove"; id: string }
  | { type: "reset" };
