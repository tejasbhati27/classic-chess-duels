import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import './App.css';

// --- SVG Piece Component ---
// Stores SVG paths for chess pieces (standard Merida style often seen)
// Source: Often derived from Wikimedia Commons SVGs (ensure license compatibility if distributing)
const pieceSvgPaths = {
    w: { // White pieces
        p: <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62h9c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" stroke="#000" strokeWidth="1" strokeLinecap="round" />,
        r: <path d="M9 36v-4h27v4H9zM12 32V12h21v20H12zM9 12V9h27v3H9z" stroke="#000" strokeWidth="1" strokeLinejoin="round" />,
        n: <path d="M10 28 C 12 31, 14 32, 17.5 32 C 21 32, 22.5 30, 22.5 28 C 22.5 26, 21 24.5, 19.5 24 L 18.5 23 C 15 21, 13 18, 13 14 C 13 10, 16 8, 21 8 C 24 8, 27 9, 28 11 L 27 13 C 25.5 11.5, 23.5 10, 21 10 C 18 10, 16 11.5, 16 14 C 16 16.5, 18 18.5, 20 19.5 L 21 20 C 23.5 21.5, 25.5 23.5, 25.5 28 C 25.5 32.5, 21.5 34, 17.5 34 C 13 34, 10 32, 8.5 30 L 10 28 z M 31.5 11.5 L 31.5 30" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />,
        b: <path d="M9 36c3.39-.97 10.11-4.03 13.5-11.56a15.5 15.5 0 000-11.88C22.61 4.03 15.89.97 12.5 0h10C25.89.97 32.61 4.03 36 11.56a15.5 15.5 0 010 11.88C32.61 31.97 25.89 35.03 22.5 36h-10zM22.5 11.88a6.5 6.5 0 110 11.24 6.5 6.5 0 110-11.24z" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />,
        q: <path d="M8 12a2 2 0 11-4 0 2 2 0 014 0zM24.5 7.5a2 2 0 11-4 0 2 2 0 014 0zM41 12a2 2 0 11-4 0 2 2 0 014 0zM16 8.5a2 2 0 11-4 0 2 2 0 014 0zM33 9a2 2 0 11-4 0 2 2 0 014 0zM9 26c8.5-1.5 20.5-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12zM9 36v-4h27v4H9z" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />,
        k: <path d="M22.5 11.63V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5M12.5 36l10-10 10 10H12.5zM12.5 36v-4M32.5 36v-4M11 26.5h23v-3H11v3zM11 14.5h23v3H11v-3z" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    },
    b: { // Black pieces - Reuse paths, color set by CSS fill
        p: <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62h9c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" stroke="#AAA" strokeWidth="1" strokeLinecap="round" />,
        r: <path d="M9 36v-4h27v4H9zM12 32V12h21v20H12zM9 12V9h27v3H9z" stroke="#AAA" strokeWidth="1" strokeLinejoin="round" />,
        n: <path d="M10 28 C 12 31, 14 32, 17.5 32 C 21 32, 22.5 30, 22.5 28 C 22.5 26, 21 24.5, 19.5 24 L 18.5 23 C 15 21, 13 18, 13 14 C 13 10, 16 8, 21 8 C 24 8, 27 9, 28 11 L 27 13 C 25.5 11.5, 23.5 10, 21 10 C 18 10, 16 11.5, 16 14 C 16 16.5, 18 18.5, 20 19.5 L 21 20 C 23.5 21.5, 25.5 23.5, 25.5 28 C 25.5 32.5, 21.5 34, 17.5 34 C 13 34, 10 32, 8.5 30 L 10 28 z M 31.5 11.5 L 31.5 30" stroke="#AAA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />,
        b: <path d="M9 36c3.39-.97 10.11-4.03 13.5-11.56a15.5 15.5 0 000-11.88C22.61 4.03 15.89.97 12.5 0h10C25.89.97 32.61 4.03 36 11.56a15.5 15.5 0 010 11.88C32.61 31.97 25.89 35.03 22.5 36h-10zM22.5 11.88a6.5 6.5 0 110 11.24 6.5 6.5 0 110-11.24z" stroke="#AAA" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />,
        q: <path d="M8 12a2 2 0 11-4 0 2 2 0 014 0zM24.5 7.5a2 2 0 11-4 0 2 2 0 014 0zM41 12a2 2 0 11-4 0 2 2 0 014 0zM16 8.5a2 2 0 11-4 0 2 2 0 014 0zM33 9a2 2 0 11-4 0 2 2 0 014 0zM9 26c8.5-1.5 20.5-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12zM9 36v-4h27v4H9z" stroke="#AAA" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />,
        k: <path d="M22.5 11.63V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5M12.5 36l10-10 10 10H12.5zM12.5 36v-4M32.5 36v-4M11 26.5h23v-3H11v3zM11 14.5h23v3H11v-3z" stroke="#AAA" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    }
};

function Piece({ piece }) { // Renders the SVG piece
    if (!piece) return null;
    const svgPath = pieceSvgPaths[piece.color]?.[piece.type];
    if (!svgPath) return null; // Should not happen

    return (
        <span className={`piece ${piece.color === 'b' ? 'black-piece' : 'white-piece'}`}>
            {/* SVG Viewbox is standardized for these paths */}
            <svg viewBox="0 0 45 45">
                {svgPath}
            </svg>
        </span>
    );
}


// --- Helper Function --- (Keep getPieceName)
function getPieceName(piece) {
    // ... (same as before)
    if (!piece) return '';
    switch (piece.type) {
        case 'p': return 'Pawn';
        case 'r': return 'Rook';
        case 'n': return 'Knight';
        case 'b': return 'Bishop';
        case 'q': return 'Queen';
        case 'k': return 'King';
        default: return '';
    }
}

// --- Components --- (Square, Chessboard, CapturedPieces modified)

function Square({
    squareName,
    pieceInfo, // Renamed from 'piece' to avoid conflict with Piece component
    isDark,
    isSelected,
    isLegalMove,
    onSquareClick,
    onPieceDragStart,
    onDragOverSquare,
    onDropOnSquare,
    isDraggingOver,
    currentTurn // Pass turn down for draggable check
}) {
    let className = 'square';
    className += isDark ? ' dark' : ' light';
    if (isSelected && !isDraggingOver) className += ' selected';
    if (isDraggingOver === 'valid') className += ' drag-over-valid';
    if (isDraggingOver === 'invalid') className += ' drag-over-invalid';

    const isDraggable = pieceInfo && pieceInfo.color === currentTurn;

    return (
        <div
            className={className}
            onClick={() => onSquareClick(squareName)}
            onDragOver={(e) => onDragOverSquare(e, squareName)}
            onDrop={(e) => onDropOnSquare(e, squareName)}
        >
            {pieceInfo && (
                <div // Wrap Piece component for drag events and styling hook
                   draggable={isDraggable}
                   onDragStart={(e) => {
                       if (isDraggable) {
                           onPieceDragStart(e, squareName, pieceInfo);
                           // Add slight delay for visual feedback (browser dependent)
                           // setTimeout(() => e.target.classList.add('dragging'), 0);
                       } else {
                           e.preventDefault();
                       }
                   }}
                   onDragEnd={(e) => {
                       // e.target.classList.remove('dragging');
                   }}
                   // Check window state for visual feedback (less ideal than state prop)
                   className={`piece-container ${window.DRAGGING_SQUARE === squareName ? 'hidden' : ''}`}
                >
                    <Piece piece={pieceInfo} />
                </div>
            )}
            {isLegalMove && !pieceInfo && <div className="legal-move-indicator"></div>}
             {/* Optional: indicator on capture squares */}
            {isLegalMove && pieceInfo && pieceInfo.color !== currentTurn && <div className="legal-move-indicator capture"></div>}
        </div>
    );
}


function Chessboard({ // Mostly the same logic, but passes props to new Square
    chess,
    board,
    onMove,
    selectedSquare,
    setSelectedSquare,
    legalMoves,
    setLegalMoves
}) {
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [draggingOverSquare, setDraggingOverSquare] = useState(null);
    const [isDropValid, setIsDropValid] = useState(null);
    const currentTurn = chess.turn(); // Get current turn

     // Access dragging state globally (simpler than prop drilling deep)
     window.DRAGGING_SQUARE = draggingPiece ? draggingPiece.from : null;

    // --- Event Handlers (handleSquareClick, handlePieceDragStart, etc.) ---
    // --- Keep the existing useCallback hooks for these handlers ---
    // --- from the *previous* App.js version (with drag/drop) ---
    // --- Ensure they work with `pieceInfo` instead of `piece` where applicable ---
     const handleSquareClick = useCallback(/* ... Keep previous D&D click logic ... */ (squareName) => {
        if (squareName === selectedSquare) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }
        const pieceInfo = chess.get(squareName);
        if (selectedSquare) {
            const move = legalMoves.find(m => m.from === selectedSquare && m.to === squareName);
            if (move) {
                onMove(move);
                setSelectedSquare(null); setLegalMoves([]);
            } else {
                if (pieceInfo && pieceInfo.color === chess.turn()) {
                    setSelectedSquare(squareName);
                    setLegalMoves(chess.moves({ square: squareName, verbose: true }));
                } else {
                    setSelectedSquare(null); setLegalMoves([]);
                }
            }
        } else {
            if (pieceInfo && pieceInfo.color === chess.turn()) {
                setSelectedSquare(squareName);
                setLegalMoves(chess.moves({ square: squareName, verbose: true }));
            }
        }
    }, [chess, selectedSquare, legalMoves, onMove, setSelectedSquare, setLegalMoves]);


    const handlePieceDragStart = useCallback(/* ... Keep previous D&D drag start logic ... */ (e, squareName, pieceInfo) => {
        e.dataTransfer.setData('text/plain', squareName);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingPiece({ from: squareName, piece: pieceInfo });
        setSelectedSquare(squareName);
        setLegalMoves(chess.moves({ square: squareName, verbose: true }));
    }, [chess, setSelectedSquare, setLegalMoves]);


    const handleDragOverSquare = useCallback(/* ... Keep previous D&D drag over logic ... */ (e, squareName) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDraggingOverSquare(squareName);
        if (draggingPiece) {
            const isValid = legalMoves.some(m => m.from === draggingPiece.from && m.to === squareName);
            setIsDropValid(isValid ? 'valid' : 'invalid');
        }
    }, [draggingPiece, legalMoves]);


    const handleDropOnSquare = useCallback(/* ... Keep previous D&D drop logic ... */ (e, toSquare) => {
        e.preventDefault();
        const fromSquare = e.dataTransfer.getData('text/plain');
        if (!fromSquare || fromSquare === toSquare || !draggingPiece) {
             setDraggingPiece(null); setDraggingOverSquare(null); setIsDropValid(null);
             return;
         }
        const move = legalMoves.find(m => m.from === fromSquare && m.to === toSquare);
        if (move) {
            onMove(move);
        }
        setDraggingPiece(null); setDraggingOverSquare(null); setIsDropValid(null);
        setSelectedSquare(null); setLegalMoves([]);
    }, [legalMoves, onMove, setSelectedSquare, setLegalMoves, draggingPiece]);


     // --- Cleanup Effect (Keep from previous D&D version) ---
     useEffect(() => {
        const handleDragEnd = () => {
            if (window.DRAGGING_SQUARE) { // Use window state check
                 setDraggingPiece(null);
                 setDraggingOverSquare(null);
                 setIsDropValid(null);
            }
        };
        document.addEventListener('dragend', handleDragEnd, true);
        return () => document.removeEventListener('dragend', handleDragEnd, true);
    }, []); // Empty dependency array, relies on window state change

    // --- Rendering Logic ---
    const squares = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const squareName = `${String.fromCharCode(97 + j)}${8 - i}`;
            const pieceInfo = board[i][j]; // Get piece info
            const isDark = (i + j) % 2 === 1;
            const isSelected = squareName === selectedSquare;
            const isLegal = legalMoves.some(m => m.to === squareName);
            let draggingOverState = null;
            if (draggingOverSquare === squareName) {
                draggingOverState = isDropValid;
            }

            squares.push(
                <Square
                    key={squareName}
                    squareName={squareName}
                    pieceInfo={pieceInfo} // Pass piece info
                    isDark={isDark}
                    isSelected={isSelected}
                    isLegalMove={isLegal}
                    onSquareClick={handleSquareClick}
                    onPieceDragStart={handlePieceDragStart}
                    onDragOverSquare={handleDragOverSquare}
                    onDropOnSquare={handleDropOnSquare}
                    isDraggingOver={draggingOverState}
                    currentTurn={currentTurn} // Pass turn info
                />
            );
        }
    }

    return <div className="chessboard" onDragLeave={() => {
         setDraggingOverSquare(null);
         setIsDropValid(null);
    }}>{squares}</div>;
}


function CapturedPieces({ pieces, color, layout = 'vertical' }) { // Default to vertical layout
    const pieceOrder = { p: 1, n: 2, b: 3, r: 4, q: 5 };
    const sortedPieces = [...pieces].sort((a, b) => (pieceOrder[a.type] || 99) - (pieceOrder[b.type] || 99));
    const capturedByColor = color === 'white' ? 'captured-by-black' : 'captured-by-white'; // Class based on who captured

    return (
        // Add layout class ('vertical' or 'horizontal')
        <div className={`captured-pieces ${layout} ${capturedByColor}`}>
            {sortedPieces.map((piece, index) => (
                 <div // Use div wrapper for layout consistency
                    key={`${color}-${piece.type}-${index}`}
                    title={getPieceName(piece)}
                    className="piece-icon" // Class for sizing
                 >
                    <Piece piece={piece} /> {/* Render using Piece component */}
                 </div>
            ))}
        </div>
    );
}

// --- Main App Component ---

function App() {
    const [game, setGame] = useState(new Chess());
    const [board, setBoard] = useState(game.board());
    const [status, setStatus] = useState('');
    const [capturedWhite, setCapturedWhite] = useState([]); // Pieces Black captured
    const [capturedBlack, setCapturedBlack] = useState([]); // Pieces White captured
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);
    const [moveCount, setMoveCount] = useState(0);
    const [theme, setTheme] = useState('chesscom'); // Default to chess.com theme
    const gameRef = useRef(game);

     // --- Keep existing useEffects and Callbacks ---
     // (updateStatus, handleMove, handleNewGame)
     // from the previous D&D version. Ensure handleMove clears state correctly.
     useEffect(() => { gameRef.current = game; }, [game]);

     const updateStatus = useCallback(/* ... Keep previous status logic ... */ (currentGame) => {
        let currentStatus = ''; let turnColor = currentGame.turn() === 'w' ? 'White' : 'Black';
        if (currentGame.isCheckmate()) currentStatus = `Checkmate! ${turnColor === 'White' ? 'Black' : 'White'} wins.`;
        else if (currentGame.isDraw()) { /* ... draw reasons ... */ currentStatus = 'Draw!'; }
        else { currentStatus = `${turnColor}'s Turn`; if (currentGame.isCheck()) currentStatus += ' (Check!)'; }
        setStatus(currentStatus);
    }, []);

    useEffect(() => {
        setBoard(game.board());
        setMoveCount(Math.ceil(game.history().length / 2));
        updateStatus(game);
    }, [game, updateStatus]);

    const handleMove = useCallback(/* ... Keep previous move logic ... */ (move) => {
        const currentGame = gameRef.current; const gameCopy = new Chess(currentGame.fen());
        let promotionPiece = 'q';
        /* Add promotion UI logic here if needed */
        const result = gameCopy.move({ from: move.from, to: move.to, promotion: promotionPiece });
        if (result) {
            if (result.captured) {
                const capturedPiece = { type: result.captured, color: result.color === 'w' ? 'b' : 'w' };
                if (result.color === 'w') setCapturedBlack(prev => [...prev, capturedPiece]);
                else setCapturedWhite(prev => [...prev, capturedPiece]);
            }
            setGame(gameCopy);
        }
        setSelectedSquare(null); setLegalMoves([]); // Ensure state clears
    }, []);

    const handleNewGame = useCallback(/* ... Keep previous new game logic ... */ () => {
        const newGame = new Chess();
        setGame(newGame); setCapturedWhite([]); setCapturedBlack([]);
        setSelectedSquare(null); setLegalMoves([]); updateStatus(newGame);
    }, [updateStatus]);

    useEffect(() => { // Apply theme class
        document.body.className = ''; // Clear previous themes
        document.documentElement.className = `theme-${theme}`; // Apply to html for global access if needed
        document.body.classList.add(`theme-${theme}`);
    }, [theme]);

    // Determine captured pieces layout based on screen width (can be refined)
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    // Crude breakpoint logic - sync with CSS media queries if possible
    const capturedLayout = windowWidth <= 550 ? 'horizontal' : 'vertical';

    return (
        <div className={`app theme-${theme}`}>
            <h1>Classic Chess Duels</h1>
            <div className="game-area">
                 {/* Pass layout prop based on screen size */}
                <CapturedPieces pieces={capturedWhite} color="white" layout={capturedLayout} /> {/* White pieces captured BY BLACK */}

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
                            <button onClick={() => setTheme('chesscom')} className="control-button" disabled={theme === 'chesscom'}>Chess.com</button>
                             {/* Add other theme buttons if kept */}
                             {/* <button onClick={() => setTheme('classic')} className="control-button" disabled={theme === 'classic'}>Classic</button> */}
                        </div>
                    </div>
                </div>
                 {/* Pass layout prop based on screen size */}
                <CapturedPieces pieces={capturedBlack} color="black" layout={capturedLayout} /> {/* Black pieces captured BY WHITE */}
            </div>
        </div>
    );
}

export default App;
