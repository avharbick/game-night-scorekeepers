import { useState } from "react";
import { GAME_CATALOG } from "./games/catalog";

export default function App() {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const selectedGame = GAME_CATALOG.find((game) => game.id === selectedGameId);

  if (selectedGame) {
    const SelectedGame = selectedGame.Component;
    return <SelectedGame onExit={() => setSelectedGameId(null)} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="Game Night">
          <span className="brand-mark" aria-hidden="true">⚄</span>
          <span>Game Night</span>
        </div>
      </header>

      <section className="library-view page-enter">
        <div className="library-hero">
          <span className="eyebrow">What are we playing?</span>
          <h1>Choose a game</h1>
          <p>Pick a scorekeeper to get started.</p>
        </div>

        <div className="game-library">
          {GAME_CATALOG.map((game) => (
            <button className="game-card" key={game.id} onClick={() => setSelectedGameId(game.id)}>
              <span className="game-card-icon" aria-hidden="true">{game.icon}</span>
              <span className="game-card-copy">
                <small>{game.detail}</small>
                <strong>{game.name}</strong>
                <span>{game.description}</span>
              </span>
              <span className="game-card-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>

        <p className="library-note">More games can be added here later.</p>
      </section>
    </main>
  );
}
