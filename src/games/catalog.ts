import FarkleGame from "./farkle/FarkleGame";
import type { GameModule } from "./types";

export const GAME_CATALOG: GameModule[] = [
  {
    id: "farkle",
    name: "Farkle",
    description: "Fast scoring, no pencil required.",
    detail: "2+ players",
    icon: "⚄",
    Component: FarkleGame,
  },
];
