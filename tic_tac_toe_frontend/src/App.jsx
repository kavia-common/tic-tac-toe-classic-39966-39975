import { useEffect, useMemo, useState } from 'react'
import { useTizenKeys } from './hooks/useTizenKeys'
import './App.css'

/**
 * Game constants and helpers
 */
const EMPTY_BOARD = Array(9).fill(null);
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// PUBLIC_INTERFACE
function checkWinner(board) {
  /** Determine the winner for a given board state.
   * Returns: { winner: 'X'|'Y'|null, line: [a,b,c]|null, isDraw: boolean }
   */
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c], isDraw: false };
    }
  }
  const isDraw = board.every(Boolean);
  return { winner: null, line: null, isDraw };
}

// PUBLIC_INTERFACE
function computeAIMove(board, aiSymbol, humanSymbol) {
  /** Simple AI:
   * 1) Win if possible.
   * 2) Block opponent's win.
   * 3) Take center.
   * 4) Take a corner.
   * 5) Take any side.
   * Returns index or null if no moves.
   */
  const empty = board
    .map((v, i) => (v ? null : i))
    .filter((v) => v !== null);

  if (empty.length === 0) return null;

  const tryMove = (idx, symbol) => {
    const copy = board.slice();
    copy[idx] = symbol;
    return checkWinner(copy).winner === symbol;
  };

  // 1) Win
  for (const idx of empty) {
    if (tryMove(idx, aiSymbol)) return idx;
  }
  // 2) Block
  for (const idx of empty) {
    if (tryMove(idx, humanSymbol)) return idx;
  }
  // 3) Center
  if (empty.includes(4)) return 4;

  const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  const sides = [1, 3, 5, 7].filter((i) => empty.includes(i));
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];

  return empty[0];
}

function Header() {
  return (
    <header className="app-header">
      <h1 className="app-title">Tic Tac Toe</h1>
      <p className="app-subtitle">Ocean Professional • Retro Minimal</p>
    </header>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <span>Use arrows + Enter on remote • ESC/BACK to reset focus</span>
    </footer>
  );
}

function ModeSelector({ mode, setMode, disabled }) {
  return (
    <div className="mode-selector" role="group" aria-label="Game mode">
      <button
        className={`mode-btn ${mode === 'pvp' ? 'active' : ''}`}
        onClick={() => setMode('pvp')}
        disabled={disabled}
      >
        Player vs Player
      </button>
      <button
        className={`mode-btn ${mode === 'pvc' ? 'active' : ''}`}
        onClick={() => setMode('pvc')}
        disabled={disabled}
      >
        Player vs Computer
      </button>
    </div>
  );
}

function Controls({ onNewGame, onReset, canReset }) {
  return (
    <div className="controls">
      <button className="primary" onClick={onNewGame}>New Game</button>
      <button className="secondary" onClick={onReset} disabled={!canReset}>Reset Board</button>
    </div>
  );
}

function Status({ current, winner, isDraw, mode }) {
  let text = '';
  if (winner) {
    text = `${winner} wins!`;
  } else if (isDraw) {
    text = "It's a draw.";
  } else {
    const role = mode === 'pvc' && current === 'O' ? '(Computer)' : '';
    text = `Turn: ${current} ${role}`;
  }
  return <div className="status">{text}</div>;
}

function Square({ value, onClick, focused, highlight }) {
  return (
    <button
      className={`square ${focused ? 'focused' : ''} ${highlight ? 'highlight' : ''}`}
      onClick={onClick}
      aria-label={`Cell ${value ? value : 'empty'}`}
    >
      <span className={`symbol ${value ? 'filled' : ''}`}>{value || ''}</span>
    </button>
  );
}

function Board({ board, onMove, focusIndex, highlightLine }) {
  return (
    <div className="board" role="grid" aria-label="Tic Tac Toe board">
      {board.map((val, idx) => (
        <Square
          key={idx}
          value={val}
          onClick={() => onMove(idx)}
          focused={focusIndex === idx}
          highlight={highlightLine?.includes(idx)}
        />
      ))}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState('pvc'); // 'pvp' | 'pvc'
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [current, setCurrent] = useState('X');
  const [focusIndex, setFocusIndex] = useState(4);
  const [lockInput, setLockInput] = useState(false);

  const result = useMemo(() => checkWinner(board), [board]);

  const canPlay = !result.winner && !result.isDraw && !lockInput;

  const makeMove = (idx) => {
    if (!canPlay) return;
    if (board[idx]) return;

    const next = board.slice();
    next[idx] = current;
    setBoard(next);
    setCurrent((c) => (c === 'X' ? 'O' : 'X'));
  };

  // AI turn
  useEffect(() => {
    if (mode !== 'pvc') return;
    if (result.winner || result.isDraw) return;
    if (current !== 'O') return;

    setLockInput(true);
    const id = setTimeout(() => {
      const idx = computeAIMove(board, 'O', 'X');
      if (idx !== null) {
        const next = board.slice();
        next[idx] = 'O';
        setBoard(next);
        setCurrent('X');
        setFocusIndex(idx);
      }
      setLockInput(false);
    }, 450); // subtle delay for UX

    return () => clearTimeout(id);
  }, [mode, board, current, result.winner, result.isDraw]);

  const onNewGame = () => {
    setBoard(EMPTY_BOARD);
    setCurrent('X');
    setFocusIndex(4);
  };
  const onReset = () => {
    setBoard(EMPTY_BOARD);
    setCurrent('X');
  };

  // Remote control / keyboard navigation with Tizen keys
  useTizenKeys({
    onLeft: () => setFocusIndex((i) => (i % 3 === 0 ? i : i - 1)),
    onRight: () => setFocusIndex((i) => (i % 3 === 2 ? i : i + 1)),
    onUp: () => setFocusIndex((i) => (i - 3 >= 0 ? i - 3 : i)),
    onDown: () => setFocusIndex((i) => (i + 3 <= 8 ? i + 3 : i)),
    onEnter: () => {
      if (mode === 'pvc' && current === 'O') return; // avoid human acting on AI turn
      makeMove(focusIndex);
    },
    onBack: () => {
      // Soft reset focus
      setFocusIndex(4);
    },
  });

  const disabledModeSwitch = board.some(Boolean) && !result.winner && !result.isDraw;

  return (
    <div className="tv-app">
      <div className="surface">
        <Header />
        <div className="content">
          <ModeSelector mode={mode} setMode={setMode} disabled={disabledModeSwitch} />
          <Status
            current={current}
            winner={result.winner}
            isDraw={result.isDraw}
            mode={mode}
          />
          <Board
            board={board}
            onMove={makeMove}
            focusIndex={focusIndex}
            highlightLine={result.line}
          />
          <Controls
            onNewGame={onNewGame}
            onReset={onReset}
            canReset={board.some(Boolean)}
          />
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default App
