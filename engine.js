// Simple AI engine for Black

const aiPlaysBlack = true;
const aiEnabled = true;

function cloneBoard(boardState) {
  return boardState.map((row) => row.slice());
}

function simulateMove(boardState, move, side, epTarget) {
  const newBoard = cloneBoard(boardState);
  const enemySide = side === "w" ? "b" : "w";
  const enemyPawnChar = enemySide === "w" ? "P" : "p";

  let newEpTarget = null;
  let gameOverSim = false;
  let winnerSim = null;

  const piece = newBoard[move.fromR][move.fromC];
  newBoard[move.fromR][move.fromC] = null;

  if (move.isEnPassant) {
    newBoard[move.capturedR][move.capturedC] = null;
  } else if (move.isCapture) {
    newBoard[move.toR][move.toC] = null;
  }

  if (move.promotion) {
    newBoard[move.toR][move.toC] = side === "w" ? "Q" : "q";
  } else {
    newBoard[move.toR][move.toC] = piece;
  }

  if (move.isDoublePush) {
    const epR = side === "w" ? move.toR + 1 : move.toR - 1;
    newEpTarget = { r: epR, c: move.toC };
  }

  if (move.promotion) {
    gameOverSim = true;
    winnerSim = side;
  }

  if (!gameOverSim) {
    let enemyPawns = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (newBoard[r][c] === enemyPawnChar) enemyPawns++;
      }
    }
    if (enemyPawns === 0) {
      gameOverSim = true;
      winnerSim = side;
    }
  }

  if (!gameOverSim) {
    const enemyMoves = generateAllLegalMoves(
      enemySide,
      newBoard,
      newEpTarget,
      false
    );
    if (enemyMoves.length === 0) {
      gameOverSim = true;
      winnerSim = side;
    }
  }

  return {
    board: newBoard,
    enPassantTarget: newEpTarget,
    gameOver: gameOverSim,
    winner: winnerSim,
  };
}

function isAttackedByWhitePawn(r, c, boardState) {
  const attackerRow = r + 1;
  if (attackerRow < 0 || attackerRow > 7) return false;
  for (const dc of [-1, 1]) {
    const cc = c + dc;
    if (cc < 0 || cc > 7) continue;
    if (boardState[attackerRow][cc] === "P") return true;
  }
  return false;
}

function isAttackedByBlackPawn(r, c, boardState) {
  const attackerRow = r - 1;
  if (attackerRow < 0 || attackerRow > 7) return false;
  for (const dc of [-1, 1]) {
    const cc = c + dc;
    if (cc < 0 || cc > 7) continue;
    if (boardState[attackerRow][cc] === "p") return true;
  }
  return false;
}

function isPassedPawn(r, c, side, boardState) {
  if (side === "b") {
    for (let rr = r + 1; rr <= 7; rr++) {
      for (const dc of [-1, 0, 1]) {
        const cc = c + dc;
        if (cc < 0 || cc > 7) continue;
        if (boardState[rr][cc] === "P") return false;
      }
    }
    return true;
  } else {
    for (let rr = r - 1; rr >= 0; rr--) {
      for (const dc of [-1, 0, 1]) {
        const cc = c + dc;
        if (cc < 0 || cc > 7) continue;
        if (boardState[rr][cc] === "p") return false;
      }
    }
    return true;
  }
}

function evaluatePositionForBlack(boardState, gameOverSim, winnerSim) {
  if (gameOverSim) {
    if (winnerSim === "b") return 10000;
    if (winnerSim === "w") return -10000;
  }

  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = boardState[r][c];

      if (piece === "p") {
        score += 100;
        score += r * 8;

        const passed = isPassedPawn(r, c, "b", boardState);
        if (passed) {
          score += 150;
          score += r * 10;
        }

        if (isAttackedByWhitePawn(r, c, boardState)) {
          score -= 70;
        }
      } else if (piece === "P") {
        score -= 100;
        score -= (7 - r) * 8;

        const passed = isPassedPawn(r, c, "w", boardState);
        if (passed) {
          score -= 150;
          score -= (7 - r) * 10;
        }

        if (isAttackedByBlackPawn(r, c, boardState)) {
          score += 70;
        }
      } else if (piece === "q") {
        score += 900;
      } else if (piece === "Q") {
        score -= 900;
      }
    }
  }

  return score;
}

function chooseBestMoveForBlack() {
  const moves = generateAllLegalMoves("b", board, enPassantTarget, false);
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const sim = simulateMove(board, move, "b", enPassantTarget);

    if (sim.gameOver) {
      const scoreTerminal = evaluatePositionForBlack(
        sim.board,
        sim.gameOver,
        sim.winner
      );
      if (scoreTerminal > bestScore) {
        bestScore = scoreTerminal;
        bestMove = move;
      }
      continue;
    }

    const whiteMoves = generateAllLegalMoves(
      "w",
      sim.board,
      sim.enPassantTarget,
      false
    );

    let moveScore;
    if (whiteMoves.length === 0) {
      moveScore = evaluatePositionForBlack(sim.board, true, "b");
    } else {
      let worstForBlack = Infinity;
      for (const wMove of whiteMoves) {
        const sim2 = simulateMove(
          sim.board,
          wMove,
          "w",
          sim.enPassantTarget
        );
        const eval2 = evaluatePositionForBlack(
          sim2.board,
          sim2.gameOver,
          sim2.winner
        );
        if (eval2 < worstForBlack) {
          worstForBlack = eval2;
        }
      }
      moveScore = worstForBlack;
    }

    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = move;
    }
  }

  return bestMove;
}

function maybeAIMove() {
  if (!aiEnabled) return;
  if (gameOver) return;
  if (!aiPlaysBlack) return;
  if (sideToMove !== "b") return;

  const move = chooseBestMoveForBlack();
  if (!move) return;

  applyMove(move);
}
