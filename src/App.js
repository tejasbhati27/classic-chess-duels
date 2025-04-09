import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import './App.css';

// --- SVG Piece Definitions (Approximated from Minimalist Green Image) ---
const pieceSvgPaths = {
    w: { // Define shapes once
        p: <path d="M 22.5,36 C 22.5,36 27,27 27,19 C 27,11 22.5,9 22.5,9 C 22.5,9 18,11 18,19 C 18,27 22.5,36 22.5,36 z" />,
        r: <path d="M 9,36 V 9 H 36 V 36 H 9 z M 12,12 H 33 V 18 H 12 z" />,
        n: <path d="M 15,36 C 18,30 22,26 28,26 C 34,26 36,31 36,34 C 28,34 26,24 20,24 C 14,24 12,34 9,34 C 9,31 11,26 17,26 C 23,26 25,30 28,33" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>, // Use stroke for 'S' shape
        b: <path d="M 22.5,9 C 28,9 33,14 33,22.5 C 33,31 28,36 22.5,36 C 22.5,36 18,27 18,22.5 C 18,18 22.5,9 22.5,9 z M 19,12 A 15 15 0 0 0 19 33" />, // Combined shape
        q: <path d="M 9,14 L 13,36 H 32 L 36,14 L 31,19 L 28,11 L 22.5,22 L 17,11 L 14,19 L 9,14 z M 11,9 A 2 2 0 1 1 7,9 A 2 2 0 0 1 11,9 z M 24.5,9 A 2 2 0 1 1 20.5,9 A 2 2 0 0 1 24.5,9 z M 38,9 A 2 2 0 1 1 34,9 A 2 2 0 0 1 38,9 z" />,
        k: <path d="M 22.5,9 V 36 M 9,22.5 H 36 M 16,13 H 29 V 19 H 16 z M 16,26 H 29 V 32 H 16 z" strokeWidth="2.5" strokeLinecap="round" /> // Cross shape
    },
    b: { // Black pieces reference white paths - color handled by CSS
        p: <path d="M 22.5,36 C 22.5,36 27,27 27,19 C 27,11 22.5,9 22.5,9 C 22.5,9 18,11 18,19 C 18,27 22.5,36 22.5,36 z" />,
        r: <path d="M 9,36 V 9 H 36 V 36 H 9 z M 12,12 H 33 V 18 H 12 z" />,
        n: <path d="M 15,36 C 18,30 22,26 28,26 C 34,26 36,31 36,34 C 28,34 26,24 20,24 C 14,24 12,34 9,34 C 9,31 11,26 17,26 C 23,26 25,30 28,33" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>,
        b: <path d="M 22.5,9 C 28,9 33,14 33,22.5 C 33,31 28,36 22.5,36 C 22.5,36 18,27 18,22.5 C 18,18 22.5,9 22.5,9 z M 19,12 A 15 15 0 0 0 19 33" />,
        q: <path d="M 9,14 L 13,36 H 32 L 36,14 L 31,19 L 28,11 L 22.5,22 L 17,11 L 14,19 L 9,14 z M 11,9 A 2 2 0 1 1 7,9 A 2 2 0 0 1 11,9 z M 24.5,9 A 2 2 0 1 1 20.5,9 A 2 2 0 0 1 24.5,9 z M 38,9 A 2 2 0 1 1 34,9 A 2 2 0 0 1 38,9 z" />,
        k: <path d="M 22.5,9 V 36 M 9,22.5 H 36 M 16,13 H 29 V 19 H 16 z M 16,26 H 29 V 32 H 16 z" strokeWidth="2.5" strokeLinecap="round" />
    }
};


// --- Piece Component ---
function Piece({ piece }) {
    if (!piece) return null;
    const svgPath = pieceSvgPaths[piece.color]?.[piece.type];
    if (!svgPath) return null; // Should not happen

    // Check if the path uses stroke (like Knight) or fill
    const styleProps = svgPath.props.fill === 'none'
        ? { stroke: 'currentColor' } // Apply color via stroke
        : { fill: 'currentColor' };   // Apply color via fill

    return (
        <span className={`piece ${piece.color === 'b' ? 'black-piece' : 'white-piece'}`}>
            <svg viewBox="0 0 45 45">
                {/* Clone element to apply dynamic fill/stroke based on CSS color */}
                {React.cloneElement(svgPath, styleProps)}
            </svg>
        </span>
    );
}

// --- Helper Function ---
function getPieceName(piece) {
    if (!piece) return '';
    switch (piece.type) {
        case 'p': return 'Pawn'; case 'r': return 'Rook'; case 'n': return 'Knight';
        case 'b': return 'Bishop'; case 'q': return 'Queen'; case 'k': return 'King';
        default: return '';
    }
}

// --- Square Component ---
function Square({ squareName, pieceInfo, isDark, isSelected, isLegalMove, onSquareClick, onPieceDragStart, onDragOverSquare, onDropOnSquare, isDraggingOver, currentTurn }) {
    let className = 'square';
    className += isDark ? ' dark' : ' light';
    // Show selection outline only if not dragging over THIS square
    if (isSelected && (!isDraggingOver || isDraggingOver === 'invalid')) {
         className += ' selected';
    }
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
                <div // Wrapper for drag handling and styling
                   draggable={isDraggable}
                   onDragStart={(e) => {
                       if (isDraggable) {
                           onPieceDragStart(e, squareName, pieceInfo);
                       } else {
                           e.preventDefault();
                       }
                   }}
                   // Apply hidden style based on global state (less ideal)
                   className={`piece-container ${window.DRAGGING_SQUARE === squareName ? 'hidden' : ''}`}
                >
                    <Piece piece={pieceInfo} />
                </div>
            )}
            {/* Show dot indicator only on empty legal squares */}
            {isLegalMove && !pieceInfo && <div className="legal-move-indicator"></div>}
            {/* Optional: Indicator for capture squares */}
            {isLegalMove && pieceInfo && pieceInfo.color !== currentTurn && <div className="legal-move-indicator capture"></div>}
        </div>
    );
}

// --- Chessboard Component ---
function Chessboard({ chess, board, onMove, selectedSquare, setSelectedSquare, legalMoves, setLegalMoves }) {
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [draggingOverSquare, setDraggingOverSquare] = useState(null);
    const [isDropValid, setIsDropValid] = useState(null);
    const currentTurn = chess.turn();

    // Global state for visual feedback (simpler than deep prop drilling)
    window.DRAGGING_SQUARE = draggingPiece ? draggingPiece.from : null;

    // --- Event Handlers ---
    const handleSquareClick = useCallback((squareName) => {
        if (squareName === selectedSquare) { // Clicked selected square again
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        const pieceInfo = chess.get(squareName); // Get piece info for the clicked square

        if (selectedSquare) { // A piece was already selected
            const move = legalMoves.find(m => m.from === selectedSquare && m.to === squareName);
            if (move) { // Clicked on a legal move destination
                onMove(move); // Make the move
                setSelectedSquare(null); setLegalMoves([]); // Clear selection
            } else { // Clicked somewhere else
                if (pieceInfo && pieceInfo.color === currentTurn) { // Clicked another of own pieces
                    setSelectedSquare(squareName); // Select the new piece
                    setLegalMoves(chess.moves({ square: squareName, verbose: true }));
                } else { // Clicked empty square or opponent piece (not a legal move target)
                    setSelectedSquare(null); setLegalMoves([]); // Deselect
                }
            }
        } else { // No piece was selected
            if (pieceInfo && pieceInfo.color === currentTurn) { // Clicked one of own pieces
                setSelectedSquare(squareName); // Select it
                setLegalMoves(chess.moves({ square: squareName, verbose: true }));
            }
        }
    }, [chess, selectedSquare, legalMoves, onMove, setSelectedSquare, setLegalMoves, currentTurn]);

    const handlePieceDragStart = useCallback((e, squareName, pieceInfo) => {
        e.dataTransfer.setData('text/plain', squareName);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingPiece({ from: squareName, piece: pieceInfo });
        // Select square being dragged and calculate its moves
        setSelectedSquare(squareName);
        setLegalMoves(chess.moves({ square: squareName, verbose: true }));
    }, [chess, setSelectedSquare, setLegalMoves]);

    const handleDragOverSquare = useCallback((e, squareName) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        setDraggingOverSquare(squareName); // Track which square we are over

        if (draggingPiece) { // Check if the drop target is valid
            const isValid = legalMoves.some(m => m.from === draggingPiece.from && m.to === squareName);
            setIsDropValid(isValid ? 'valid' : 'invalid');
        } else {
            setIsDropValid(null);
        }
    }, [draggingPiece, legalMoves]);

    const handleDropOnSquare = useCallback((e, toSquare) => {
        e.preventDefault();
        const fromSquare = e.dataTransfer.getData('text/plain');

        // Ensure drag started properly and isn't dropping on itself
        if (!fromSquare || fromSquare === toSquare || !draggingPiece) {
            setDraggingPiece(null); setDraggingOverSquare(null); setIsDropValid(null);
            // Don't clear selection immediately on bad drop, allow click to deselect
            return;
        }

        // Find the move based on drag origin and drop target
        const move = legalMoves.find(m => m.from === fromSquare && m.to === toSquare);

        if (move) {
            onMove(move); // Execute the move if valid
        } else {
            console.log("Invalid drop target"); // Optional feedback
        }

        // Cleanup state regardless of move success
        setDraggingPiece(null); setDraggingOverSquare(null); setIsDropValid(null);
        setSelectedSquare(null); setLegalMoves([]); // Clear selection after drop

    }, [legalMoves, onMove, setSelectedSquare, setLegalMoves, draggingPiece]);

    // --- Cleanup Effect for External Drag End ---
    useEffect(() => {
        const handleDragEnd = () => {
            // If draggingPiece state exists when drag ends globally, cleanup
            if (window.DRAGGING_SQUARE) {
                 setDraggingPiece(null);
                 setDraggingOverSquare(null);
                 setIsDropValid(null);
                 // Optionally clear selection if drag is cancelled externally
                 // setSelectedSquare(null);
                 // setLegalMoves([]);
            }
        };
        // Listen in capture phase to ensure cleanup
        document.addEventListener('dragend', handleDragEnd, true);
        return () => {
            document.removeEventListener('dragend', handleDragEnd, true);
            window.DRAGGING_SQUARE = null; // Clear global flag on unmount
        };
    }, []); // Run once on mount

    // --- Render Board ---
    const squares = [];
    for (let i = 0; i < 8; i++) { // Rank
        for (let j = 0; j < 8; j++) { // File
            const squareName = `${String.fromCharCode(97 + j)}${8 - i}`;
            const pieceInfo = board[i][j];
            const isDark = (i + j) % 2 === 1;
            const isSel = squareName === selectedSquare; // Use different var name
            const isLegal = legalMoves.some(m => m.to === squareName);
            let draggingOverState = null;
            if (draggingOverSquare === squareName) {
                draggingOverState = isDropValid;
            }

            squares.push(
                <Square
                    key={squareName}
                    squareName={squareName}
                    pieceInfo={pieceInfo}
                    isDark={isDark}
                    isSelected={isSel}
                    isLegalMove={isLegal}
                    onSquareClick={handleSquareClick}
                    onPieceDragStart={handlePieceDragStart}
                    onDragOverSquare={handleDragOverSquare}
                    onDropOnSquare={handleDropOnSquare}
                    isDraggingOver={draggingOverState}
                    currentTurn={currentTurn}
                />
            );
        }
    }

    return <div className="chessboard" onDragLeave={() => {
        // Reset visual cue if drag leaves board entirely
         setDraggingOverSquare(null);
         setIsDropValid(null);
    }}>{squares}</div>;
}


// --- CapturedPieces Component ---
function CapturedPieces({ pieces, color, layout = 'vertical' }) {
    const pieceOrder = { p: 1, n: 2, b: 3, r: 4, q: 5 };
    // Sort captured pieces (e.g., pawns first, then knights, etc.)
    const sortedPieces = [...pieces].sort((a, b) => (pieceOrder[a.type] || 99) - (pieceOrder[b.type] || 99));
    // Class indicates who captured these pieces (e.g., white pieces captured BY black)
    const capturedByColor = color === 'white' ? 'captured-by-black' : 'captured-by-white';

    return (
        <div className={`captured-pieces ${layout} ${capturedByColor}`}>
            {sortedPieces.map((piece, index) => (
                 <div
                    key={`${color}-${piece.type}-${index}`} // Unique key
                    title={getPieceName(piece)}
                    className="piece-icon" // For specific sizing/styling of captured icons
                 >
                    <Piece piece={piece} /> {/* Render the SVG */}
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
    const [theme, setTheme] = useState('minimalist-green'); // Default theme
    const gameRef = useRef(game); // Ref to access latest game state in callbacks

    // Update gameRef whenever game state changes
    useEffect(() => {
        gameRef.current = game;
    }, [game]);

    // --- Game Status Update Logic ---
    const updateStatus = useCallback((currentGame) => {
        let currentStatus = '';
        let turnColor = currentGame.turn() === 'w' ? 'White' : 'Black';

        if (currentGame.isCheckmate()) {
            currentStatus = `Checkmate! ${turnColor === 'White' ? 'Black' : 'White'} wins.`;
        } else if (currentGame.isDraw()) {
            if (currentGame.isStalemate()) currentStatus = 'Draw by Stalemate!';
            else if (currentGame.isThreefoldRepetition()) currentStatus = 'Draw by Threefold Repetition!';
            else if (currentGame.isInsufficientMaterial()) currentStatus = 'Draw by Insufficient Material!';
            else currentStatus = 'Draw!'; // Other draw conditions
        } else {
            currentStatus = `${turnColor}'s Turn`;
             if (currentGame.isCheck()) {
                currentStatus += ' (Check!)'; // Indicate check
            }
        }
        setStatus(currentStatus);
    }, []);

    // --- Effect to Update Board and Status ---
    useEffect(() => {
        setBoard(game.board()); // Update board representation
        setMoveCount(Math.ceil(game.history().length / 2)); // Update move counter
        updateStatus(game); // Update status message
    }, [game, updateStatus]);

    // --- Handle Player Move ---
    const handleMove = useCallback((move) => {
        const currentGame = gameRef.current; // Get latest game state from ref
        const gameCopy = new Chess(currentGame.fen()); // Create copy to safely attempt move

        let promotionPiece = 'q'; // Default promotion to Queen

        // Simple Pawn Promotion Handling (Auto-Queen)
        // TODO: Implement UI for promotion choice if needed
        if (move.flags.includes('p')) {
            console.log("Pawn promotion occurred - auto-promoting to Queen.");
            // Example: const chosenPiece = await showPromotionDialog(); promotionPiece = chosenPiece;
        }

        // Attempt the move in the copy
        const result = gameCopy.move({
            from: move.from,
            to: move.to,
            promotion: promotionPiece // Apply promotion piece
        });

        if (result) { // Move was valid
            // Update captured pieces state if a capture occurred
            if (result.captured) {
                const capturedPiece = { type: result.captured, color: result.color === 'w' ? 'b' : 'w' }; // Note color inversion
                if (result.color === 'w') { // White made the move, capturing a black piece
                    setCapturedBlack(prev => [...prev, capturedPiece]);
                } else { // Black made the move, capturing a white piece
                    setCapturedWhite(prev => [...prev, capturedPiece]);
                }
            }
            setGame(gameCopy); // Update the main game state with the successful move
        } else {
             console.error("Invalid move object passed to handleMove or move failed:", move);
        }

        // Clear selections regardless of move success/failure after attempt
        setSelectedSquare(null);
        setLegalMoves([]);

    }, []); // No dependencies that change frequently

    // --- Handle New Game Button ---
    const handleNewGame = useCallback(() => {
        const newGame = new Chess();
        setGame(newGame); // Reset game state
        setCapturedWhite([]); // Clear captured pieces
        setCapturedBlack([]);
        setSelectedSquare(null); // Clear selection
        setLegalMoves([]);
        updateStatus(newGame); // Update status for new game
    }, [updateStatus]);

     // --- Effect to Apply Theme Class ---
     useEffect(() => {
        // Clear previous theme classes first
        document.body.className = '';
        document.documentElement.className = '';
        // Add current theme class
        document.documentElement.classList.add(`theme-${theme}`); // Add to html for potential global use
        document.body.classList.add(`theme-${theme}`); // Add to body
    }, [theme]);

    // --- Determine Layout based on Window Width ---
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        // Cleanup listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    // Determine layout based on width - sync with CSS breakpoints
    const capturedLayout = windowWidth <= 550 ? 'horizontal' : 'vertical';

    // --- Render App ---
    return (
        <div className={`app theme-${theme}`}>
            <h1>Classic Chess Duels</h1>
            <div className="game-area">
                {/* Captured pieces for White (pieces black lost) */}
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
                            {/* Theme Buttons */}
                            <button onClick={() => setTheme('minimalist-green')} className="control-button" disabled={theme === 'minimalist-green'}>Minimalist</button>
                            <button onClick={() => setTheme('chesscom')} className="control-button" disabled={theme === 'chesscom'}>Chess.com</button>
                            {/* Add buttons for other themes here if they exist */}
                         </div>
                    </div>
                </div>

                {/* Captured pieces for Black (pieces white lost) */}
                <CapturedPieces pieces={capturedBlack} color="black" layout={capturedLayout} />
            </div>
        </div>
    );
}

export default App;
