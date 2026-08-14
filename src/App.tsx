"use client";

import { useEffect, useMemo, useState } from "react";

type Player = { id: string; name: string; score: number; farkles: number };
type Settings = { winningScore: number; openingScore: number; finalRound: boolean };
type HistoryGame = { id: string; finishedAt: string; winner: string; scores: Array<{ name: string; score: number }> };
type GameState = {
  players: Player[];
  activeIndex: number;
  round: number;
  turnScore: number;
  finalRoundTrigger: string | null;
  finalRoundTurnsLeft: number;
  startedAt: string;
};
type UndoState = { game: GameState; message: string };

const DEFAULT_SETTINGS: Settings = { winningScore: 10000, openingScore: 500, finalRound: true };
const DEFAULT_NAMES = ["Aiden", "Elise"];
const STORAGE_KEY = "game-night-farkle-v1";
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const cloneGame = (game: GameState) => JSON.parse(JSON.stringify(game)) as GameState;
const formatScore = (score: number) => score.toLocaleString("en-US");

export default function Home() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"home" | "game" | "history">("home");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [playerNames, setPlayerNames] = useState(DEFAULT_NAMES);
  const [game, setGame] = useState<GameState | null>(null);
  const [history, setHistory] = useState<HistoryGame[]>([]);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.history) setHistory(parsed.history);
        if (parsed.playerNames) setPlayerNames(parsed.playerNames);
        if (parsed.game) { setGame(parsed.game); setScreen("game"); }
      }
    } catch { /* Ignore a malformed local save. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, history, playerNames, game }));
  }, [ready, settings, history, playerNames, game]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const serviceWorkerUrl = new URL("sw.js", window.location.href).pathname;
      navigator.serviceWorker.register(serviceWorkerUrl).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const rankedPlayers = useMemo(() => [...(game?.players ?? [])].sort((a, b) => b.score - a.score), [game?.players]);
  const activePlayer = game?.players[game.activeIndex];

  function updateName(index: number, value: string) {
    setPlayerNames((names) => names.map((name, i) => i === index ? value : name));
  }

  function startGame() {
    const cleanNames = playerNames.map((name) => name.trim()).filter(Boolean);
    if (cleanNames.length < 2) { setToast("Add at least two player names"); return; }
    setGame({
      players: cleanNames.map((name) => ({ id: makeId(), name, score: 0, farkles: 0 })),
      activeIndex: 0, round: 1, turnScore: 0, finalRoundTrigger: null,
      finalRoundTurnsLeft: 0, startedAt: new Date().toISOString(),
    });
    setPlayerNames(cleanNames);
    setUndo(null);
    setScreen("game");
  }

  function setTurnScore(value: number) {
    if (!game) return;
    setGame({ ...game, turnScore: Math.max(0, Math.min(99950, Math.round(value / 50) * 50)) });
  }

  function finishGame(finalPlayers: Player[]) {
    const ordered = [...finalPlayers].sort((a, b) => b.score - a.score);
    const completed: HistoryGame = {
      id: makeId(), finishedAt: new Date().toISOString(), winner: ordered[0].name,
      scores: ordered.map(({ name, score }) => ({ name, score })),
    };
    setHistory((items) => [completed, ...items].slice(0, 50));
    setPlayerNames(finalPlayers.map((player) => player.name));
    setGame(null); setUndo(null); setScreen("home");
    setToast(`${ordered[0].name} wins with ${formatScore(ordered[0].score)}!`);
  }

  function completeTurn(kind: "bank" | "farkle") {
    if (!game || !activePlayer) return;
    if (kind === "bank" && game.turnScore <= 0) { setToast("Enter a turn score first"); return; }
    if (kind === "bank" && activePlayer.score === 0 && game.turnScore < settings.openingScore) {
      setToast(`${activePlayer.name} needs ${formatScore(settings.openingScore)} to get on the board`); return;
    }

    const snapshot = cloneGame(game);
    const updatedPlayers = game.players.map((player, index) => index !== game.activeIndex ? player :
      kind === "bank" ? { ...player, score: player.score + game.turnScore } : { ...player, farkles: player.farkles + 1 });
    const updatedActive = updatedPlayers[game.activeIndex];
    const justTriggered = kind === "bank" && !game.finalRoundTrigger && updatedActive.score >= settings.winningScore;

    if (justTriggered && !settings.finalRound) { finishGame(updatedPlayers); return; }

    let finalRoundTrigger = game.finalRoundTrigger;
    let finalRoundTurnsLeft = game.finalRoundTurnsLeft;
    if (justTriggered) { finalRoundTrigger = updatedActive.id; finalRoundTurnsLeft = updatedPlayers.length - 1; }
    else if (finalRoundTrigger) {
      finalRoundTurnsLeft -= 1;
      if (finalRoundTurnsLeft <= 0) { finishGame(updatedPlayers); return; }
    }

    const upcomingIndex = (game.activeIndex + 1) % updatedPlayers.length;
    setGame({ ...game, players: updatedPlayers, activeIndex: upcomingIndex,
      round: upcomingIndex === 0 ? game.round + 1 : game.round, turnScore: 0,
      finalRoundTrigger, finalRoundTurnsLeft });
    setUndo({ game: snapshot, message: kind === "farkle" ? `${activePlayer.name}'s Farkle` : `${activePlayer.name}'s +${formatScore(game.turnScore)}` });
    if (justTriggered) setToast("Final round! Everyone gets one last turn.");
  }

  function undoLastTurn() {
    if (!undo) return;
    setGame(undo.game); setUndo(null); setScreen("game"); setToast("Last turn restored");
  }

  function abandonGame() {
    if (!game || !window.confirm("End this game without saving it to history?")) return;
    setGame(null); setUndo(null); setScreen("home");
  }

  if (!ready) return <main className="loading-shell">Shaking the dice…</main>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setScreen(game ? "game" : "home")}>
          <span className="brand-mark" aria-hidden="true">⚄</span><span>Game Night</span>
        </button>
        <div className="top-actions">
          <button className="icon-button" onClick={() => setScreen("history")} aria-label="Game history">↺</button>
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Scoring settings">⚙</button>
        </div>
      </header>

      {screen === "home" && <section className="home-view page-enter">
        <div className="hero-copy"><span className="eyebrow">Ready to roll?</span><h1>Farkle</h1><p>Fast scoring, no pencil required.</p></div>
        <div className="setup-card">
          <div className="section-heading"><div><span className="step-label">Tonight&apos;s table</span><h2>Who&apos;s playing?</h2></div><span className="player-count">{playerNames.length} players</span></div>
          <div className="player-list">{playerNames.map((name, index) => <div className="player-input-row" key={index}>
            <span className="player-number">{index + 1}</span>
            <input aria-label={`Player ${index + 1} name`} value={name} onChange={(e) => updateName(index, e.target.value)} autoCapitalize="words" />
            {playerNames.length > 2 && <button className="remove-player" onClick={() => setPlayerNames((names) => names.filter((_, i) => i !== index))} aria-label={`Remove ${name}`}>×</button>}
          </div>)}</div>
          <button className="add-player" onClick={() => setPlayerNames((names) => [...names, `Player ${names.length + 1}`])}>＋ Add player</button>
          <button className="primary-button" onClick={startGame}>Start game <span>→</span></button>
        </div>
        <div className="rule-summary"><span>Playing to <strong>{formatScore(settings.winningScore)}</strong></span><span className="dot">•</span><span><strong>{formatScore(settings.openingScore)}</strong> to get on board</span><button onClick={() => setSettingsOpen(true)}>Edit rules</button></div>
        {history.length > 0 && <button className="last-game" onClick={() => setScreen("history")}><span className="trophy">♛</span><span><small>Last winner</small><strong>{history[0].winner}</strong></span><span className="chevron">›</span></button>}
      </section>}

      {screen === "game" && game && activePlayer && <section className="game-view page-enter">
        <div className="game-status-row"><span className="live-pill"><i /> Round {game.round}</span><button className="text-button danger-text" onClick={abandonGame}>End game</button></div>
        {game.finalRoundTrigger && <div className="final-round-banner"><span>⚡</span><div><strong>Final round</strong><small>{game.finalRoundTurnsLeft} turn{game.finalRoundTurnsLeft === 1 ? "" : "s"} left</small></div></div>}
        <div className="scoreboard" aria-label="Scoreboard">{rankedPlayers.map((player, rank) => {
          const isActive = player.id === activePlayer.id;
          return <div className={`score-row ${isActive ? "active" : ""}`} key={player.id}><span className="rank">{rank + 1}</span><div className="score-name"><strong>{player.name}</strong><small>{isActive ? "Rolling now" : `${player.farkles} Farkle${player.farkles === 1 ? "" : "s"}`}</small></div><strong className="score-total">{formatScore(player.score)}</strong></div>;
        })}</div>
        <div className="turn-card">
          <div className="turn-heading"><span className="avatar">{activePlayer.name.slice(0, 1).toUpperCase()}</span><div><span>Current turn</span><h2>{activePlayer.name}</h2></div></div>
          <label className="score-input-wrap"><span>Turn score</span><div className="score-input-line"><input type="number" inputMode="numeric" step="50" min="0" value={game.turnScore || ""} placeholder="0" onChange={(e) => setTurnScore(Number(e.target.value))} aria-label="Score this turn" /><small>pts</small></div></label>
          <div className="quick-score-grid" aria-label="Quick score buttons">{[50, 100, 500, 1000].map((amount) => <button key={amount} onClick={() => setTurnScore(game.turnScore + amount)}>+{formatScore(amount)}</button>)}</div>
          <div className="turn-actions"><button className="farkle-button" onClick={() => completeTurn("farkle")}><span>💥</span> Farkle</button><button className="bank-button" onClick={() => completeTurn("bank")} disabled={game.turnScore <= 0}>Bank score <span>→</span></button></div>
        </div>
        {undo && <button className="undo-bar" onClick={undoLastTurn}><span>↶</span><span><small>Last action</small><strong>{undo.message}</strong></span><b>Undo</b></button>}
      </section>}

      {screen === "history" && <section className="history-view page-enter">
        <div className="view-title"><button className="back-button" onClick={() => setScreen(game ? "game" : "home")} aria-label="Go back">←</button><div><span className="eyebrow">The record book</span><h1>Game history</h1></div></div>
        {history.length === 0 ? <div className="empty-state"><span>♛</span><h2>No champions yet</h2><p>Finished games will appear here.</p></div> : <div className="history-list">{history.map((item) => <article className="history-card" key={item.id}>
          <div className="history-card-top"><div><small>{new Date(item.finishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</small><h2>{item.winner} won</h2></div><button onClick={() => setHistory((items) => items.filter((entry) => entry.id !== item.id))} aria-label="Delete game">×</button></div>
          <div className="history-scores">{item.scores.map((score, index) => <div key={`${item.id}-${score.name}`}><span>{index + 1}. {score.name}</span><strong>{formatScore(score.score)}</strong></div>)}</div>
        </article>)}</div>}
      </section>}

      {settingsOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}><section className="settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-handle" /><div className="sheet-title-row"><div><span className="eyebrow">Farkle</span><h2 id="settings-title">Scoring rules</h2></div><button onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button></div>
        <label className="setting-field"><span><strong>Winning score</strong><small>First player to reach this starts the final round.</small></span><input type="number" inputMode="numeric" step="500" min="1000" value={settings.winningScore} onChange={(e) => setSettings({ ...settings, winningScore: Math.max(1000, Number(e.target.value)) })} /></label>
        <label className="setting-field"><span><strong>Opening score</strong><small>Minimum first bank required to get on the board.</small></span><input type="number" inputMode="numeric" step="50" min="0" value={settings.openingScore} onChange={(e) => setSettings({ ...settings, openingScore: Math.max(0, Number(e.target.value)) })} /></label>
        <label className="toggle-setting"><span><strong>One final turn</strong><small>After someone reaches the goal, everyone else gets one last chance.</small></span><input type="checkbox" checked={settings.finalRound} onChange={(e) => setSettings({ ...settings, finalRound: e.target.checked })} /><i /></label>
        <button className="primary-button" onClick={() => setSettingsOpen(false)}>Save rules</button><button className="reset-rules" onClick={() => setSettings(DEFAULT_SETTINGS)}>Reset standard rules</button>
      </section></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
