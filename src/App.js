import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import './App.css';

// --- Helper Functions (Keep these the same) ---

function getPieceSymbol(piece) {
  // ... (same as before)
    if (!piece) return '';
    // Use standard unicode chess symbols
    switch (piece.type) {
        case 'p': return piece.color === 'w' ? '♙' : '♟';
        case 'r': return piece.color === 'w' ? '♖' : '♜';
        case 'n': return piece.color === 'w' ? '♘' : '♞';
        case 'b': return piece.color === 'w' ? '♗' : '♝';
        case 'q': return piece.color === 'w' ? '♕' : '♛';
        case 'k': return piece.color === 'w' ? '♔' : '♚';
        default: return '';
    }
}

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


// --- Components ---

function Square({
    squareName, // Added prop
    piece,
    isDark,
    isSelected,
    isLegalMove,
    onSquareClick, // Renamed from onClick for clarity
    onPieceDragStart,
    onDragOverSquare,
    onDropOnSquare,
    isDraggingOver // New prop for styling drop target
}) {
    const pieceSymbol = getPieceSymbol(piece);
    let className = 'square';
    className += isDark ? ' dark' : ' light';
    if (isSelected && !isDraggingOver) className += ' selected'; // Show selection only if not dragging over

    // Add drag-over styling based on isDraggingOver state
    if (isDraggingOver === 'valid') className += ' drag-over-valid';
    if (isDraggingOver === 'invalid') className += ' drag-over-invalid';

    // Make the square draggable only if it contains a piece of the current player's color
    const isDraggable = piece && piece.color === window.CURRENT_TURN; // Access global variable (hacky but simple here)

    return (
        <div
            className={className}
            onClick={() => onSquareClick(squareName)}
            onDragOver={(e) => onDragOverSquare(e, squareName)}
            onDrop={(e) => onDropOnSquare(e, squareName)}
        >
            {piece && (
                 <span
                    draggable={isDraggable}
                    onDragStart={(e) => {
                         if (isDraggable) {
                            onPieceDragStart(e, squareName, piece);
                         } else {
                             e.preventDefault(); // Prevent dragging opponent's pieces
                         }
                     }}
                    className={`piece ${piece.color === 'b' ? 'black-piece' : 'white-piece'} ${window.DRAGGING_SQUARE === squareName ? 'hidden' : ''}`}
                    // Add 'hidden' class while dragging this piece
                 >
                    {pieceSymbol}
                 </span>
            )}
            {isLegalMove && !piece && <div className="legal-move-indicator"></div>} {/* Show dot only on empty legal squares */}
            {isLegalMove && piece && piece.color !== window.CURRENT_TURN && <div className="legal-move-indicator capture"></div>} {/* Optional: different indicator for captures */}
        </div>
    );
}


function Chessboard({
    chess,
    board,
    onMove,
    selectedSquare,
    setSelectedSquare,
    legalMoves,
    setLegalMoves // Need setter for drag start
}) {
    const [draggingPiece, setDraggingPiece] = useState(null); // Info about the piece being dragged
    const [draggingOverSquare, setDraggingOverSquare] = useState(null); // Which square is being dragged over
    const [isDropValid, setIsDropValid] = useState(null); // 'valid', 'invalid', or null

    // Hacky way to share turn info with Square for draggable check
    // A better way involves Context API or prop drilling further
    window.CURRENT_TURN = chess.turn();
    window.DRAGGING_SQUARE = draggingPiece ? draggingPiece.from : null;


    const handleSquareClick = useCallback((squareName) => {
        // If clicking the selected square, deselect
        if (squareName === selectedSquare) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        const piece = chess.get(squareName);

        if (selectedSquare) {
            // Attempt move if a square was already selected
            const move = legalMoves.find(m => m.from === selectedSquare && m.to === squareName);
            if (move) {
                onMove(move); // Make the move
                setSelectedSquare(null);
                setLegalMoves([]);
            } else {
                // Clicked somewhere else - select if it's own piece, otherwise deselect
                if (piece && piece.color === chess.turn()) {
                    setSelectedSquare(squareName);
                    setLegalMoves(chess.moves({ square: squareName, verbose: true }));
                } else {
                    setSelectedSquare(null);
                    setLegalMoves([]);
                }
            }
        } else {
            // No square selected, select if it's own piece
            if (piece && piece.color === chess.turn()) {
                setSelectedSquare(squareName);
                setLegalMoves(chess.moves({ square: squareName, verbose: true }));
            }
        }
    }, [chess, selectedSquare, legalMoves, onMove, setSelectedSquare, setLegalMoves]);

    // --- Drag and Drop Handlers ---

    const handlePieceDragStart = useCallback((e, squareName, pieceInfo) => {
        // console.log('Drag Start:', squareName);
        e.dataTransfer.setData('text/plain', squareName); // Store the 'from' square
        e.dataTransfer.effectAllowed = 'move';
        setDraggingPiece({ from: squareName, piece: pieceInfo });
        setSelectedSquare(squareName); // Select the piece being dragged
        setLegalMoves(chess.moves({ square: squareName, verbose: true }));

        // Optional: Hide the original piece slightly delayed
        // setTimeout(() => {
        //     // Logic to visually hide the piece in the original square if desired
        // }, 0);

    }, [chess, setSelectedSquare, setLegalMoves]);


    const handleDragOverSquare = useCallback((e, squareName) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        setDraggingOverSquare(squareName);

        if (draggingPiece) {
            // Check if the current square is a legal move for the dragged piece
            const isValid = legalMoves.some(m => m.from === draggingPiece.from && m.to === squareName);
            setIsDropValid(isValid ? 'valid' : 'invalid');
        }

    }, [draggingPiece, legalMoves]);


    const handleDropOnSquare = useCallback((e, toSquare) => {
        e.preventDefault();
        // console.log('Drop on:', toSquare);
        const fromSquare = e.dataTransfer.getData('text/plain');

        if (!fromSquare || fromSquare === toSquare) {
            // Reset if dropped on itself or invalid drag data
            setDraggingPiece(null);
            setDraggingOverSquare(null);
            setIsDropValid(null);
            // Don't deselect immediately on drop fail, allow click to deselect
            // setSelectedSquare(null);
            // setLegalMoves([]);
            return;
        }

        const move = legalMoves.find(m => m.from === fromSquare && m.to === toSquare);

        if (move) {
            onMove(move); // Execute the move
        } else {
             console.log("Invalid drop"); // Handle invalid drop (optional feedback)
        }

        // Cleanup drag state regardless of move success/failure
        setDraggingPiece(null);
        setDraggingOverSquare(null);
        setIsDropValid(null);
        setSelectedSquare(null); // Deselect after drop
        setLegalMoves([]);


    }, [legalMoves, onMove, setSelectedSquare, setLegalMoves]);

    // Cleanup effect if drag ends outside the board
    useEffect(() => {
        const handleDragEnd = () => {
            // console.log("Global Drag End");
            if (draggingPiece) { // Only cleanup if we were actually dragging
                 setDraggingPiece(null);
                 setDraggingOverSquare(null);
                 setIsDropValid(null);
                 // Maybe deselect here too if drag cancelled externally
                 // setSelectedSquare(null);
                 // setLegalMoves([]);
            }
        };
        // Use capture phase to ensure cleanup happens
        document.addEventListener('dragend', handleDragEnd, true);
        return () => {
            document.removeEventListener('dragend', handleDragEnd, true);
        };
    }, [draggingPiece]); // Rerun if draggingPiece changes

    // --- Rendering Logic ---
    const squares = [];
    for (let i = 0; i < 8; i++) { // Rank (row)
        for (let j = 0; j < 8; j++) { // File (column)
            const squareName = `${String.fromCharCode(97 + j)}${8 - i}`;
            const piece = board[i][j];
            const isDark = (i + j) % 2 === 1;
            const isSelected = squareName === selectedSquare;
            const isLegal = legalMoves.some(m => m.to === squareName);

            // Determine drag over state for this specific square
            let draggingOverState = null;
            if (draggingOverSquare === squareName) {
                draggingOverState = isDropValid;
            }


            squares.push(
                <Square
                    key={squareName}
                    squareName={squareName}
                    piece={piece}
                    isDark={isDark}
                    isSelected={isSelected}
                    isLegalMove={isLegal}
                    onSquareClick={handleSquareClick} // Use click handler
                    onPieceDragStart={handlePieceDragStart}
                    onDragOverSquare={handleDragOverSquare}
                    onDropOnSquare={handleDropOnSquare}
                    isDraggingOver={draggingOverState} // Pass down drop target status
                />
            );
        }
    }

    return <div className="chessboard" onDragLeave={() => {
        // Reset visual indication if mouse leaves the board entirely while dragging
         setDraggingOverSquare(null);
         setIsDropValid(null);
    }}>{squares}</div>;
}


function CapturedPieces({ pieces, color }) {
    const pieceOrder = { p: 1, n: 2, b: 3, r: 4, q: 5 };
    const sortedPieces = [...pieces].sort((a, b) => (pieceOrder[a.type] || 99) - (pieceOrder[b.type] || 99));

    return (
        <div className={`captured-pieces captured-${color}`}>
            {sortedPieces.map((piece, index) => (
                <span
                    key={`${color}-${piece.type}-${index}`} // More robust key
                    title={getPieceName(piece)}
                    // Force black/white styling via class names
                    className={`piece-icon ${piece.color === 'b' ? 'black-piece' : 'white-piece'}`}
                 >
                    {getPieceSymbol(piece)}
                </span>
            ))}
        </div>
    );
}

// --- Main App Component ---

function App() {
    const [game, setGame] = useState(new Chess());
    const [board, setBoard] = useState(game.board());
    const [status, setStatus] = useState('');
    const [capturedWhite, setCapturedWhite] = useState([]);
    const [capturedBlack, setCapturedBlack] = useState([]);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);
    const [moveCount, setMoveCount] = useState(0);
    const [theme, setTheme] = useState('light'); // Add theme state
    const gameRef = useRef(game); // Use ref to access latest game state in callbacks

    // Update gameRef whenever game state changes
    useEffect(() => {
        gameRef.current = game;
    }, [game]);

    const updateStatus = useCallback((currentGame) => {
        let currentStatus = '';
        let turnColor = currentGame.turn() === 'w' ? 'White' : 'Black';

        if (currentGame.isCheckmate()) {
            currentStatus = `Checkmate! ${turnColor === 'White' ? 'Black' : 'White'} wins.`;
        } else if (currentGame.isDraw()) {
            if (currentGame.isStalemate()) currentStatus = 'Draw by Stalemate!';
            else if (currentGame.isThreefoldRepetition()) currentStatus = 'Draw by Threefold Repetition!';
            else if (currentGame.isInsufficientMaterial()) currentStatus = 'Draw by Insufficient Material!';
            else currentStatus = 'Draw!';
        } else {
            currentStatus = `${turnColor}'s Turn`;
             if (currentGame.isCheck()) {
                currentStatus += ' (Check!)';
            }
        }
        setStatus(currentStatus);
    }, []);

    // Effect to update board and status
    useEffect(() => {
        setBoard(game.board());
        setMoveCount(Math.ceil(game.history().length / 2));
        updateStatus(game);
    }, [game, updateStatus]);


    const handleMove = useCallback((move) => {
        const currentGame = gameRef.current; // Use ref for latest game state
        const gameCopy = new Chess(currentGame.fen());

        let promotionPiece = 'q'; // Default promotion to Queen

        // Simple Pawn Promotion Logic (Needs UI Improvement)
        if (move.flags.includes('p')) {
            // In a real app, show a modal here to choose the piece
            console.log("Pawn promotion! Auto-promoting to Queen.");
            // Example: const chosenPiece = await showPromotionDialog(); promotionPiece = chosenPiece;
        }

        const result = gameCopy.move({
            from: move.from,
            to: move.to,
            promotion: promotionPiece
        });

        if (result) {
            if (result.captured) {
                const capturedPiece = { type: result.captured, color: result.color === 'w' ? 'b' : 'w' };
                if (result.color === 'w') {
                    setCapturedBlack(prev => [...prev, capturedPiece]);
                } else {
                    setCapturedWhite(prev => [...prev, capturedPiece]);
                }
            }
            setGame(gameCopy); // Update the main game state
        } else {
             console.error("Invalid move object passed to handleMove:", move);
        }

        // Clear selections after move attempt
        setSelectedSquare(null);
        setLegalMoves([]);

    }, []); // Dependencies: only callbacks that don't change often

    const handleNewGame = useCallback(() => {
        const newGame = new Chess();
        setGame(newGame);
        setCapturedWhite([]);
        setCapturedBlack([]);
        setSelectedSquare(null);
        setLegalMoves([]);
        updateStatus(newGame);
    }, [updateStatus]); // Depend on updateStatus callback

     // Apply theme class to body for global styling
     useEffect(() => {
        document.body.className = `theme-${theme}`;
    }, [theme]);


    return (
        // Apply theme class to the main app container as well if needed for scoped styles
        <div className={`app theme-${theme}`}>
            <h1>Classic Chess Duels</h1>
            <div className="game-area">
                <CapturedPieces pieces={capturedWhite} color="white" />
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
                        setLegalMoves={setLegalMoves} // Pass setter down
                    />
                     <div className="controls">
                        <button onClick={handleNewGame} className="control-button">
                            New Game
                        </button>
                         {/* Simple Theme Selector */}
                         <div className="theme-selector">
                            <button onClick={() => setTheme('light')} className="control-button" disabled={theme === 'light'}>Light</button>
                            <button onClick={() => setTheme('dark')} className="control-button" disabled={theme === 'dark'}>Dark</button>
                            <button onClick={() => setTheme('forest')} className="control-button" disabled={theme === 'forest'}>Forest</button>
                            {/* Add more theme buttons here */}
                        </div>
                    </div>
                </div>
                <CapturedPieces pieces={capturedBlack} color="black" />
            </div>
        </div>
    );
}

export default App;
