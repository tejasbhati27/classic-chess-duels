import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js'; // Import Chess.js library
import './App.css';

// --- Components ---

// Represents a single square on the board
function Square({ piece, isDark, isSelected, isLegalMove, onClick }) {
  const pieceSymbol = getPieceSymbol(piece);
  let className = 'square';
  className += isDark ? ' dark' : ' light';
  if (isSelected) className += ' selected';
  if (isLegalMove) className += ' legal-move';

  return (
    <div className={className} onClick={onClick}>
      <span className={`piece ${piece?.color === 'b' ? 'black-piece' : 'white-piece'}`}>
        {pieceSymbol}
      </span>
      {isLegalMove && <div className="legal-move-indicator"></div>}
    </div>
  );
}

// Renders the 8x8 Chessboard
function Chessboard({ chess, board, onMove, selectedSquare, legalMoves, setSelectedSquare }) {
  const handleSquareClick = (squareName) => {
    if (!selectedSquare) {
      // If no piece selected, try selecting one
      const piece = chess.get(squareName);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(squareName);
      }
    } else {
      // If a piece is selected, try moving it
      const move = legalMoves.find(m => m.from === selectedSquare && m.to === squareName);
      if (move) {
        onMove(move); // Make the move
        setSelectedSquare(null); // Deselect after move
      } else {
        // Clicked on a different square - deselect or select new piece
        const piece = chess.get(squareName);
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(squareName); // Select the new piece
        } else {
          setSelectedSquare(null); // Deselect if clicked empty/opponent square
        }
      }
    }
  };

  const squares = [];
  for (let i = 0; i < 8; i++) { // Rank (row)
    for (let j = 0; j < 8; j++) { // File (column)
      const squareName = `${String.fromCharCode(97 + j)}${8 - i}`; // e.g., 'a8', 'h1'
      const piece = board[i][j];
      const isDark = (i + j) % 2 === 1;
      const isSelected = squareName === selectedSquare;
      const isLegalMove = legalMoves.some(m => m.to === squareName && m.from === selectedSquare);

      squares.push(
        <Square
          key={squareName}
          piece={piece}
          isDark={isDark}
          isSelected={isSelected}
          isLegalMove={isLegalMove}
          onClick={() => handleSquareClick(squareName)}
        />
      );
    }
  }

  return <div className="chessboard">{squares}</div>;
}

// Displays captured pieces for one side
function CapturedPieces({ pieces, color }) {
    const pieceOrder = { p: 1, n: 2, b: 3, r: 4, q: 5 }; // Order for display

    const sortedPieces = [...pieces].sort((a, b) => {
        const orderA = pieceOrder[a.type] || 99;
        const orderB = pieceOrder[b.type] || 99;
        return orderA - orderB;
    });

    return (
        <div className={`captured-pieces captured-${color}`}>
            {sortedPieces.map((piece, index) => (
                <span key={index} title={getPieceName(piece)} className={`piece-icon ${piece.color === 'b' ? 'black-piece' : 'white-piece'}`}>
                    {getPieceSymbol(piece)}
                </span>
            ))}
        </div>
    );
}


// --- Helper Functions ---

function getPieceSymbol(piece) {
  if (!piece) return '';
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


// --- Main App Component ---

function App() {
  // Initialize chess game state using chess.js
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [status, setStatus] = useState('');
  const [capturedWhite, setCapturedWhite] = useState([]); // Pieces captured by Black
  const [capturedBlack, setCapturedBlack] = useState([]); // Pieces captured by White
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  // Add theme state if implementing themes
  // const [theme, setTheme] = useState('light');

  // Update board, status, and legal moves when game state changes
  const updateGameState = useCallback((currentGame) => {
    setBoard(currentGame.board());
    setMoveCount(Math.ceil(currentGame.history().length / 2)); // Full moves

    let currentStatus = '';
    if (currentGame.isCheckmate()) {
      currentStatus = `Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins.`;
    } else if (currentGame.isDraw()) {
        if (currentGame.isStalemate()) currentStatus = 'Stalemate!';
        else if (currentGame.isThreefoldRepetition()) currentStatus = 'Draw by Threefold Repetition!';
        else if (currentGame.isInsufficientMaterial()) currentStatus = 'Draw by Insufficient Material!';
        else currentStatus = 'Draw!';
    } else if (currentGame.isCheck()) {
      currentStatus = 'Check!';
    } else {
      currentStatus = `${currentGame.turn() === 'w' ? 'White' : 'Black'}'s Turn`;
    }
    setStatus(currentStatus);

    // Update legal moves for the selected piece if one is selected
    if (selectedSquare) {
        const moves = currentGame.moves({ square: selectedSquare, verbose: true });
        setLegalMoves(moves);
    } else {
        setLegalMoves([]); // Clear legal moves if no piece is selected
    }

  }, [selectedSquare]); // Re-run only if selectedSquare changes

  // Effect to update game state whenever the 'game' object changes
  useEffect(() => {
    updateGameState(game);
  }, [game, updateGameState]); // Depend on game and the memoized update function

    // Effect to calculate legal moves when selectedSquare changes
    useEffect(() => {
        if (selectedSquare) {
            const moves = game.moves({ square: selectedSquare, verbose: true });
            setLegalMoves(moves);
        } else {
            setLegalMoves([]);
        }
    }, [selectedSquare, game]); // Re-calculate when selection or game state changes

  // Handle player moves
  const handleMove = (move) => {
    const gameCopy = new Chess(game.fen()); // Create copy to safely attempt move

    // Basic pawn promotion (always promotes to Queen for simplicity)
    // A real implementation needs a UI prompt
    let promotion = undefined;
    if (move.flags.includes('p')) { // Check if the move flags indicate promotion
        promotion = 'q'; // Default to Queen
    }

    const result = gameCopy.move({
        from: move.from,
        to: move.to,
        promotion: promotion
    });

    if (result) {
      // If move is valid, update captures
      if (result.captured) {
        const capturedPiece = { type: result.captured, color: result.color === 'w' ? 'b' : 'w' };
        if (result.color === 'w') { // White made the move, captured black piece
            setCapturedBlack(prev => [...prev, capturedPiece]);
        } else { // Black made the move, captured white piece
            setCapturedWhite(prev => [...prev, capturedPiece]);
        }
      }
      setGame(gameCopy); // Update the main game state
    } else {
        // Handle invalid move attempt if needed (e.g., show message)
        console.error("Invalid move attempted:", move);
        setSelectedSquare(null); // Deselect if move failed
        setLegalMoves([]);
    }
  };

  // Start a new game
  const handleNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setSelectedSquare(null);
    setLegalMoves([]);
    updateGameState(newGame); // Immediately update UI for new game
  };

  return (
    <div className="app">
      <h1>Classic Chess Duels</h1>
      <div className="game-area">
        <CapturedPieces pieces={capturedWhite} color="white" /> {/* Pieces White lost */}
        <div className="board-container">
             <div className="status-bar">
                <span>{status}</span>
                <span>Move: {moveCount}</span>
            </div>
            <Chessboard
                chess={game}
                board={board}
                onMove={handleMove}
                selectedSquare={selectedSquare}
                legalMoves={legalMoves}
                setSelectedSquare={setSelectedSquare} // Pass setter down
            />
            <button onClick={handleNewGame} className="new-game-button">
                New Game
            </button>
            {/* Add Settings button/menu here later */}
        </div>
        <CapturedPieces pieces={capturedBlack} color="black" /> {/* Pieces Black lost */}
      </div>
       {/* <div className="settings-area"> Settings components go here </div> */}
       {/* <div className="about-area"> About info goes here </div> */}
    </div>
  );
}

export default App;
