import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import './App.css';

// --- DETAILED STAUNTON SVG PIECE DEFINITIONS ---
// Inspired by Cburnett style SVGs (commonly available under permissive licenses)
// Includes a base ellipse with class="piece-base" for styling
const pieceSvgPaths = {
    w: { // White Pieces
        p: <g><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21v6h13v-6c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" /><ellipse class="piece-base" cx="22.5" cy="38" rx="11.5" ry="3" /></g>,
        r: <g><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" /><path d="M34 14l-3 3h-1l-4 2h-4.5l-4-2h-1l-3-3" /><path d="M11 14h23v14H11V14z" /><path d="M14 28v-9h4v9h-4zM20.5 28v-9h4v9h-4zM27 28v-9h4v9h-4z" /><ellipse class="piece-base" cx="22.5" cy="40.5" rx="14" ry="2.5" /></g>,
        n: <g><path d="M22 10c10.5 1 16.5 8 16 29H15c-2 0-2.8-4-3-6-1-1-1-2-1-3 0-1 0-2 1-3-1 0-1 0-1-1 0 0 1.28-1 1-3-1-1-1-2-1-3 0-1 0-1 1-2-1-1-1-1.5-1-3 0-2 2.24-4 4-4 1 0 1 1 2 1 1 1 1 1 2 1s2.78-2 4.78-2c2 0 4 2 4 4zm-1.5 17c0 .28.22.5.5.5h1.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5.22-.5.5v1zM25 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /><ellipse class="piece-base" cx="22.5" cy="40.5" rx="14" ry="2.5" /></g>,
        b: <g><path d="M22.5 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-6 10c-1.53 1.93-2.5 4.33-2.5 7v3h17v-3c0-2.67-.97-5.07-2.5-7-1.53-1.93-3.57-3-6-3s-4.47 1.07-6 3z" /><path d="M19.5 29h6m-3-3v6" strokeWidth="1.5"/><ellipse class="piece-base" cx="22.5" cy="38" rx="11.5" ry="3" /></g>,
        q: <g><path d="M11 9a2 2 0 11-4 0 2 2 0 014 0zM22.5 7a2 2 0 11-4 0 2 2 0 014 0zM34 9a2 2 0 11-4 0 2 2 0 014 0zM16.5 11.5a2 2 0 11-4 0 2 2 0 014 0zM28.5 11.5a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M9 26c8.5-1.5 18.5-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12z" /><path d="M9 39h27v-3H9v3z" /><ellipse class="piece-base" cx="22.5" cy="40.5" rx="14" ry="2.5" /></g>,
        k: <g><path d="M22.5 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 7.5v8.5m-2.5-7.5h5" strokeWidth="1.5"/><path d="M11.5 39h22v-3h-22v3z" /><path d="M11.5 30c5.5-2.5 16.5-2.5 22 0v6h-22v-6z" /><path d="M11.5 30V19.5L5.75 17l.75-4.5 5 2.5V11h5v4h5V11h5v4l5-2.5.75 4.5-5.75 2.5V30" /><ellipse class="piece-base" cx="22.5" cy="40.5" rx="14" ry="2.5" /></g>
    },
    b: { // Black Pieces - Reuse paths, color set by CSS
        p: <g><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21v6h13v-6c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" /><ellipse class="piece-base" cx="22.5" cy="38" rx="11.5" ry="3" /></g>,
        r: <g><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" /><path d="M34 14l-3 3h-1l-4 2h-4.5l-4-2h-1l-3-3" /><path d="M11 14h23v14H11V14z" /><path d="M14 28v-9h4v9h-4zM20.5 28v-9h4v9h-4zM27 28v-9h4v9h-4z" /><ellipse class="piece-base" cx="22.5" cy="40.5" rx="14" ry="2.5" /></g>,
        n: <g><path d="M22 10c10.5 1 16.5 8 16 29H15c-2 0-2.8-4-3-6-1-1-1-2-1-3 0-1 0-2 1-3-1 0-1 0-1-1 0 0 1.28-1 1-3-1-1-1-2-1-3 0-1 0-1 1-2-1-1-1-1.5-1-3 0-2 2.24-4 4-4 1 0 1 1 2 1 1 1 1 1 2 1s2.78-2 4.78-2c2 0 4 2 4 4zm-1.5 17c0 .28.22.5.5.5h1.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5.22-.5.5v1zM25 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /><ellipse class="piece-base" cx="22.5" cy="40.5" rx="14" ry="2.5" /></g>,
        b: <g><path d="M22.5 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-6 10c-1.53 1.93-2.5 4.33-2.5 7v3h17v-3c0-2.67-.97-5.07-2.5-7-1.53-1.93-3.57-3-6-3s-4.47 1.07-6 3z" /><path d="M19.5 29h6m-3-3v6" strokeWidth="1.5"/><ellipse class="piece-base" cx="22.5" cy="38" rx="11.5" ry="3" /></g>,
        q: <g><path d="M11 9a2 2 0 11-4 0 2 2 0 014 0zM22.5 7a2 2 0 11-4 0 2 2 0 014 0zM34 9a2 2 0 11-4 0 2 2 0 014 0zM16.5 11.5a2 2 0 11-4 0 2 2 0 014 0zM28.5 11.5a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M9 26c8.5-1.5 18.5-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12z" /><path d="M9 39h27v-3H9v3z" /><ellipse class="piece-base" cx="22.5" cy="40.5" rx="14" ry="2.5" /></g>,
        k: <g><path d="M22.5 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 7.5v8.5m-2.5-7.5h5" strokeWidth="1.5"/><path d="M11.5 39h22v-3h-22v3z" /><path d="M11.5 30c5.5-2.5 16.5-2.5 22 0v6h-22v-6z" /><path d="M11.5 30V19.5L5.75 17l.75-4.5 5 2.5V11h5v4h5V11h5v4l5-2.5.75 4.5-5.75 2.5V30" /><ellipse class="piece-base" cx="22.5" cy="40.5" rx="14" ry="2.5" /></g>
    }
};


// --- Piece Component ---
// Handles rendering the grouped SVG and applying color
function Piece({ piece }) {
    if (!piece) return null;
    const svgGroup = pieceSvgPaths[piece.color]?.[piece.type]; // Get the <g> element
    if (!svgGroup) return null;

    // We assume the primary paths should inherit fill from CSS 'color'
    // The base ellipse should have its own fill set by CSS targeting '.piece-base'

    return (
        <span className={`piece ${piece.color === 'b' ? 'black-piece' : 'white-piece'}`}>
            <svg viewBox="0 0 45 45">
                {/* Render the group; paths inside will inherit color/fill from CSS */}
                {svgGroup}
            </svg>
        </span>
    );
}

// --- getPieceName (Keep As Is) ---
function getPieceName(piece) { /* ... */ }

// --- Square Component (Keep As Is from previous SVG version) ---
function Square({ squareName, pieceInfo, isDark, isSelected, isLegalMove, onSquareClick, onPieceDragStart, onDragOverSquare, onDropOnSquare, isDraggingOver, currentTurn }) { /* ... */ }

// --- Chessboard Component (Keep As Is from previous SVG version) ---
function Chessboard({ chess, board, onMove, selectedSquare, setSelectedSquare, legalMoves, setLegalMoves }) { /* ... */ }

// --- CapturedPieces Component (Keep As Is from previous SVG version) ---
function CapturedPieces({ pieces, color, layout = 'vertical' }) { /* ... */ }

// --- App Component ---
function App() {
    const [game, setGame] = useState(new Chess());
    const [board, setBoard] = useState(game.board());
    const [status, setStatus] = useState('');
    const [capturedWhite, setCapturedWhite] = useState([]);
    const [capturedBlack, setCapturedBlack] = useState([]);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);
    const [moveCount, setMoveCount] = useState(0);
    const [theme, setTheme] = useState('classic-wood'); // <-- NEW DEFAULT THEME
    const gameRef = useRef(game);

    // --- Keep existing useEffects and Callbacks ---
    // (updateStatus, handleMove, handleNewGame, Layout determination)
    useEffect(() => { gameRef.current = game; }, [game]);
    const updateStatus = useCallback(/* ... */ (currentGame) => { let currentStatus = ''; let turnColor = currentGame.turn() === 'w' ? 'White' : 'Black'; if (currentGame.isCheckmate()) currentStatus = `Checkmate! ${turnColor === 'White' ? 'Black' : 'White'} wins.`; else if (currentGame.isDraw()) { currentStatus = 'Draw!'; } else { currentStatus = `${turnColor}'s Turn`; if (currentGame.isCheck()) currentStatus += ' (Check!)'; } setStatus(currentStatus); }, []);
    useEffect(() => { setBoard(game.board()); setMoveCount(Math.ceil(game.history().length / 2)); updateStatus(game); }, [game, updateStatus]);
    const handleMove = useCallback(/* ... */ (move) => { const currentGame = gameRef.current; const gameCopy = new Chess(currentGame.fen()); let promotionPiece = 'q'; if (move.flags.includes('p')) { console.log("Auto-promoting to Queen."); } const result = gameCopy.move({ from: move.from, to: move.to, promotion: promotionPiece }); if (result) { if (result.captured) { const capturedPiece = { type: result.captured, color: result.color === 'w' ? 'b' : 'w' }; if (result.color === 'w') setCapturedBlack(prev => [...prev, capturedPiece]); else setCapturedWhite(prev => [...prev, capturedPiece]); } setGame(gameCopy); } setSelectedSquare(null); setLegalMoves([]); }, []);
    const handleNewGame = useCallback(/* ... */ () => { const newGame = new Chess(); setGame(newGame); setCapturedWhite([]); setCapturedBlack([]); setSelectedSquare(null); setLegalMoves([]); updateStatus(newGame); }, [updateStatus]);
    useEffect(() => { document.body.className = ''; document.documentElement.className = ''; document.documentElement.classList.add(`theme-${theme}`); document.body.classList.add(`theme-${theme}`); }, [theme]);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    useEffect(() => { const handleResize = () => setWindowWidth(window.innerWidth); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
    const capturedLayout = windowWidth <= 550 ? 'horizontal' : 'vertical';

    return (
        <div className={`app theme-${theme}`}>
            <h1>Classic Chess Duels</h1>
            <div className="game-area">
                <CapturedPieces pieces={capturedWhite} color="white" layout={capturedLayout} />
                <div className="board-container">
                    <div className="status-bar">
                        <span className="status-message">{status}</span>
                        <span>Move: {moveCount}</span>
                    </div>
                    <Chessboard
                        chess={game}
                        board={board}
                        onMove={handleMove}
                        selectedSquare={selectedSquare}
                        setSelectedSquare={setSelectedSquare}
                        legalMoves={legalMoves}
                        setLegalMoves={setLegalMoves}
                    />
                     <div className="controls">
                        <button onClick={handleNewGame} className="control-button">
                            New Game
                        </button>
                         <div className="theme-selector">
                             {/* ADD BUTTON FOR THE NEW THEME */}
                            <button onClick={() => setTheme('classic-wood')} className="control-button" disabled={theme === 'classic-wood'}>Classic Wood</button>
                            {/* Keep other theme buttons if desired */}
                            <button onClick={() => setTheme('abstract-minimalist')} className="control-button" disabled={theme === 'abstract-minimalist'}>Abstract</button>
                            <button onClick={() => setTheme('chesscom')} className="control-button" disabled={theme === 'chesscom'}>Chess.com</button>
                            <button onClick={() => setTheme('minimalist-green')} className="control-button" disabled={theme === 'minimalist-green'}>Minimalist</button>
                         </div>
                    </div>
                </div>
                <CapturedPieces pieces={capturedBlack} color="black" layout={capturedLayout} />
            </div>
        </div>
    );
}

export default App;
