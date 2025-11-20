// Pawn Lab main script

// DOM elements
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const moveListEl = document.getElementById("moveList");
const restartBtn = document.getElementById("restartBtn");
const showCoordsCheckbox = document.getElementById("showCoords");
const superPawnToggle = document.getElementById("superPawnToggle");
const knightPawnToggle = document.getElementById("knightPawnToggle");

// Game state
let board = [];
let sideToMove = "w";
let selected = null;
let legalMovesFromSelected = [];
let enPassantTarget = null;
let moveHistory = [];
let gameOver = false;
let winner = null;
let winReason = "";
let superPawnUsed = false;
let knightPawnUsed = false;

// Puzzle state
let currentPuzzle = null;

// Puzzles: row 0 = rank 8 (top), row 7 = rank 1 (bottom)
// Puzzles: row 0 = rank 8 (top), row 7 = rank 1 (bottom)
const puzzles = [
  {
    key: "passed",
    title: "Create a passed pawn",
    description: "Black has pawns on c6 and d7; you have a pawn on b5. Try to create a passed pawn (hint: don't trade right away).",
    sideToMove: "w",
    rows: [
      "........", 
      "...p....", 
      "..p.....", 
      ".P......", 
      "........", 
      "........", 
      "........", 
      "........"
    ],
  },

  {
    key: "race",
    title: "Pawn race",
    description: "Both sides have runners. White to move — look for the strongest first pawn push (hint: a4!).",
    sideToMove: "w",
    rows: [
      "........",
      "...p...p",
      "........",
      "........",
      "........",
      "........",
      "P..P....",
      "........"
    ],
  },

  {
    key: "enpassant",
    title: "En passant",
    description: "Black's last move was b7–b5. You can capture en passant: look for cxb5 e.p., then try to win the pawn game.",
    sideToMove: "w",
    enPassantTarget: { r: 2, c: 1 },
    rows: [
      "........",
      "...p....",
      "........",
      ".pP.....",
      "........",
      "........",
      "........",
      "........"
    ],
  },

  {
    key: "capture",
    title: "Capture battle",
    description: "A small pawn skirmish. Win material and then promote one of your pawns.",
    sideToMove: "w",
    rows: [
      "........",
      "....p...",
      "...pp...",
      "..PP....",
      "........",
      "........",
      "........",
      "........"
    ],
  },

  {
    key: "3v3break",
    title: "3-on-3 Pawn Break",
    description: "Classic pawn-break pattern. White to move — find the correct pawn break to create a passed pawn.",
    sideToMove: "w",
    rows: [
      "........",
      "ppp.....",
      "........",
      "PPP.....",
      "........",
      "........",
      "........",
      "........"
    ],
  },
];


// Utility: convert row/col to algebraic square like "a8"
function algebraicFromRC(r, c) {
  const file = String.fromCharCode("a".charCodeAt(0) + c);
  const rank = 8 - r;
  return file + rank;
}

// --- Board setup ---

function createEmptyBoard() {
  board = new Array(8).fill(null).map(() => new Array(8).fill(null));
}

function loadBoardFromRows(rows) {
  createEmptyBoard();
  for (let r = 0; r < 8; r++) {
    const row = rows[r];
    for (let c = 0; c < 8; c++) {
      const ch = row[c];
      if (ch === "P" || ch === "p" || ch === "Q" || ch === "q") {
        board[r][c] = ch;
      } else {
        board[r][c] = null;
      }
    }
  }
}

function setupInitialPosition() {
  currentPuzzle = null;
  createEmptyBoard();

  // White pawns on rank 2 (row 6), Black pawns on rank 7 (row 1)
  for (let c = 0; c < 8; c++) {
    board[6][c] = "P";
    board[1][c] = "p";
  }

  sideToMove = "w";
  selected = null;
  legalMovesFromSelected = [];
  enPassantTarget = null;
  moveHistory = [];
  gameOver = false;
  winner = null;
  winReason = "";
  superPawnUsed = false;
  knightPawnUsed = false;

  if (superPawnToggle) {
    superPawnToggle.checked = false;
    superPawnToggle.disabled = false;
  }
  if (knightPawnToggle) {
    knightPawnToggle.checked = false;
    knightPawnToggle.disabled = false;
  }

  renderMoveList();
  renderBoard();
  updateStatus();
}

function loadPuzzle(puzzle) {
  currentPuzzle = puzzle;

  loadBoardFromRows(puzzle.rows);
  sideToMove = puzzle.sideToMove;
  selected = null;
  legalMovesFromSelected = [];
  enPassantTarget = puzzle.enPassantTarget || null;
  moveHistory = [];
  gameOver = false;
  winner = null;
  winReason = "";
  superPawnUsed = false;
  knightPawnUsed = false;

  if (superPawnToggle) {
    superPawnToggle.checked = false;
    superPawnToggle.disabled = false;
  }
  if (knightPawnToggle) {
    knightPawnToggle.checked = false;
    knightPawnToggle.disabled = false;
  }

  renderBoard();
  renderMoveList();
  updateStatus();
}

// --- Rendering ---

function renderBoard() {
  boardEl.innerHTML = "";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement("div");
      square.classList.add("square");
      const isLight = (r + c) % 2 === 0;
      square.classList.add(isLight ? "light" : "dark");
      square.dataset.row = r.toString();
      square.dataset.col = c.toString();

      const piece = board[r][c];
      if (piece) {
        const span = document.createElement("span");
        span.classList.add("piece");
        if (piece === "P" || piece === "Q") {
          span.classList.add("white-piece");
        } else {
          span.classList.add("black-piece");
        }

        if (piece === "P") span.textContent = "♙";
        else if (piece === "p") span.textContent = "♟";
        else if (piece === "Q") span.textContent = "♕";
        else if (piece === "q") span.textContent = "♛";

        square.appendChild(span);
      }

      // selection + legal move highlights
      if (selected && selected.r === r && selected.c === c) {
        square.classList.add("selected");
      } else if (selected && legalMovesFromSelected.length > 0) {
        const movesToSquare = legalMovesFromSelected.filter(
          (m) => m.toR === r && m.toC === c
        );

        if (movesToSquare.length > 0) {
          const hasKnight = movesToSquare.some((m) => m.usesKnightPawn);
          const hasSuper = movesToSquare.some((m) => m.usesSuperPawn);

          if (hasKnight) {
            square.classList.add("highlight-knight");
          } else if (hasSuper) {
            square.classList.add("highlight-super");
          } else {
            square.classList.add("highlight");
          }
        }
      }

      // coordinates overlay
      if (showCoordsCheckbox && showCoordsCheckbox.checked) {
        const coord = document.createElement("div");
        coord.className = "coord";
        coord.textContent = algebraicFromRC(r, c);
        square.appendChild(coord);
      }

      square.addEventListener("click", onSquareClick);
      boardEl.appendChild(square);
    }
  }
}

function renderMoveList() {
  moveListEl.innerHTML = "";
  for (let i = 0; i < moveHistory.length; i += 2) {
    const li = document.createElement("li");
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moveHistory[i] ? moveHistory[i].notation : "";
    const blackMove = moveHistory[i + 1] ? moveHistory[i + 1].notation : "";
    li.textContent = `${moveNumber}. ${whiteMove}  ${blackMove}`;
    moveListEl.appendChild(li);
  }
  moveListEl.scrollTop = moveListEl.scrollHeight;
}

// --- Fun / trash-talk messaging ---

function pickRandom(arr) {
  if (!arr.length) return "";
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function buildWinTexts() {
  if (!gameOver || !winner) {
    return {
      title: "",
      phrase: "",
    };
  }

  const humanWon = winner === "w";
  const usedAnyPower = superPawnUsed || knightPawnUsed;

  const reasonText =
    winReason === "promotion"
      ? "by promotion"
      : winReason === "all pawns captured"
      ? "by capturing all enemy pawns"
      : winReason === "opponent has no legal moves"
      ? "because your opponent has no legal moves"
      : "";

  if (humanWon) {
    if (!usedAnyPower) {
      return {
        title: "You won!",
        phrase: pickRandom([
          `You won ${reasonText}. Nice clean pawn technique.`,
          "Nice! That pawn structure was too solid to crack.",
          "You outplayed the engine with pure pawn power – no tricks needed.",
          "Textbook pawn play. Your students better watch out.",
        ]),
      };
    }

    if (knightPawnUsed) {
      return {
        title: "You won – Knight Pawn style!",
        phrase: pickRandom([
          "You hop-jumped your way to victory. That Knight Pawn is spicy.",
          "Okay, okay – Knight Pawn cheese is still a win.",
          "Yeah, you beat me using that knight superpower… but I bet you can’t beat me with no superpowers next time.",
        ]),
      };
    }

    if (superPawnUsed) {
      return {
        title: "You won – Super Pawn activated!",
        phrase: pickRandom([
          "Super Pawn to the rescue! Show this one to your class.",
          "You won – that king-moving pawn was a serious boss move.",
          "Congrats! Using a Super Pawn is totally fair… mostly.",
        ]),
      };
    }
  } else {
    return {
      title: "You lost this one.",
      phrase: pickRandom([
        "The pawns have risen. Try again – and watch those pawn races.",
        "My pawns were just vibing today. Rematch?",
        "Don’t worry – losing to pawns builds character.",
        "Good practice game. See if you can stop my passed pawns next time.",
      ]),
    };
  }

  return {
    title: "Game over",
    phrase: "",
  };
}

function updateStatus() {
  if (gameOver) {
    const { title, phrase } = buildWinTexts();
    statusEl.textContent = title;
    resultEl.textContent = phrase;
  } else if (currentPuzzle) {
    const whoseMove = sideToMove === "w" ? "White" : "Black";
    statusEl.textContent = `Puzzle: ${currentPuzzle.title} – ${whoseMove} to move`;
    resultEl.textContent = currentPuzzle.description;
  } else {
    const sideName = sideToMove === "w" ? "White to move" : "Black to move";
    statusEl.textContent = sideName;
    resultEl.textContent =
      "Remember: win by promotion, capturing all enemy pawns, or leaving your opponent with no legal moves.";
  }
}

// --- Move generation ---

function generatePawnMovesFor(
  r,
  c,
  side,
  boardState,
  epTarget,
  includePowers
) {
  const moves = [];
  const piece = boardState[r][c];
  if (!piece) return moves;
  if (side === "w" && piece !== "P") return moves;
  if (side === "b" && piece !== "p") return moves;

  const dir = side === "w" ? -1 : 1;
  const startRow = side === "w" ? 6 : 1;
  const promotionRow = side === "w" ? 0 : 7;
  const enemy = side === "w" ? "p" : "P";

  const oneR = r + dir;

  // forward 1
  if (oneR >= 0 && oneR < 8 && boardState[oneR][c] === null) {
    moves.push({
      fromR: r,
      fromC: c,
      toR: oneR,
      toC: c,
      isCapture: false,
      isEnPassant: false,
      isDoublePush: false,
      promotion: oneR === promotionRow,
      usesSuperPawn: false,
      usesKnightPawn: false,
    });

    // forward 2 from starting rank
    const twoR = r + 2 * dir;
    if (
      r === startRow &&
      twoR >= 0 &&
      twoR < 8 &&
      boardState[twoR][c] === null &&
      boardState[oneR][c] === null
    ) {
      moves.push({
        fromR: r,
        fromC: c,
        toR: twoR,
        toC: c,
        isCapture: false,
        isEnPassant: false,
        isDoublePush: true,
        promotion: false,
        usesSuperPawn: false,
        usesKnightPawn: false,
      });
    }
  }

  // captures (normal + en passant)
  for (const dc of [-1, 1]) {
    const cr = r + dir;
    const cc = c + dc;
    if (cr < 0 || cr > 7 || cc < 0 || cc > 7) continue;

    const targetPiece = boardState[cr][cc];

    // normal capture
    if (targetPiece && targetPiece === enemy) {
      moves.push({
        fromR: r,
        fromC: c,
        toR: cr,
        toC: cc,
        isCapture: true,
        isEnPassant: false,
        isDoublePush: false,
        promotion: cr === promotionRow,
        usesSuperPawn: false,
        usesKnightPawn: false,
      });
    }

    // en passant
    if (epTarget && epTarget.r === cr && epTarget.c === cc && !targetPiece) {
      const capturedR = r;
      const capturedC = cc;
      const capturedPiece = boardState[capturedR][capturedC];
      if (capturedPiece === enemy) {
        moves.push({
          fromR: r,
          fromC: c,
          toR: cr,
          toC: cc,
          isCapture: true,
          isEnPassant: true,
          capturedR,
          capturedC,
          isDoublePush: false,
          promotion: cr === promotionRow,
          usesSuperPawn: false,
          usesKnightPawn: false,
        });
      }
    }
  }

  // Super Pawn (White only, once, only for selected pawn)
  const superPawnActive =
    includePowers &&
    side === "w" &&
    !superPawnUsed &&
    superPawnToggle &&
    superPawnToggle.checked &&
    selected &&
    selected.r === r &&
    selected.c === c;

  if (superPawnActive) {
    const enemyPiece = "p";
    const kingDirs = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dr, dc] of kingDirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;

      const target = boardState[nr][nc];
      const isEmpty = !target;
      const isCapture = !!target && target === enemyPiece;

      if (!isEmpty && !isCapture) continue;

      const promo = nr === promotionRow;

      moves.push({
        fromR: r,
        fromC: c,
        toR: nr,
        toC: nc,
        isCapture,
        isEnPassant: false,
        isDoublePush: false,
        promotion: promo,
        usesSuperPawn: true,
        usesKnightPawn: false,
      });
    }
  }

  // Knight Pawn (White only, once, only for selected pawn)
  const knightPawnActive =
    includePowers &&
    side === "w" &&
    !knightPawnUsed &&
    knightPawnToggle &&
    knightPawnToggle.checked &&
    selected &&
    selected.r === r &&
    selected.c === c;

  if (knightPawnActive) {
    const enemyPiece = "p";
    const knightDirs = [
      [-2, -1], [-2, 1],
      [-1, -2], [-1, 2],
      [1, -2],  [1, 2],
      [2, -1],  [2, 1],
    ];

    for (const [dr, dc] of knightDirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;

      const target = boardState[nr][nc];
      const isEmpty = !target;
      const isCapture = !!target && target === enemyPiece;

      if (!isEmpty && !isCapture) continue;

      const promo = nr === promotionRow;

      moves.push({
        fromR: r,
        fromC: c,
        toR: nr,
        toC: nc,
        isCapture,
        isEnPassant: false,
        isDoublePush: false,
        promotion: promo,
        usesSuperPawn: false,
        usesKnightPawn: true,
      });
    }
  }

  return moves;
}

function generateAllLegalMoves(
  side,
  boardState,
  epTarget,
  includePowers = false
) {
  const allMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = boardState[r][c];
      if (!piece) continue;
      if (side === "w" && piece === "P") {
        allMoves.push(
          ...generatePawnMovesFor(r, c, "w", boardState, epTarget, includePowers)
        );
      } else if (side === "b" && piece === "p") {
        allMoves.push(
          ...generatePawnMovesFor(r, c, "b", boardState, epTarget, false)
        );
      }
    }
  }
  return allMoves;
}

// --- Apply move & state updates ---

function applyMove(move) {
  if (gameOver) return;

  const side = sideToMove;
  const enemySide = side === "w" ? "b" : "w";

  // consume powers
  if (move.usesSuperPawn) {
    superPawnUsed = true;
    if (superPawnToggle) {
      superPawnToggle.checked = false;
      superPawnToggle.disabled = true;
    }
  }
  if (move.usesKnightPawn) {
    knightPawnUsed = true;
    if (knightPawnToggle) {
      knightPawnToggle.checked = false;
      knightPawnToggle.disabled = true;
    }
  }

  const piece = board[move.fromR][move.fromC];
  board[move.fromR][move.fromC] = null;

  if (move.isEnPassant) {
    board[move.capturedR][move.capturedC] = null;
  } else if (move.isCapture) {
    board[move.toR][move.toC] = null;
  }

  if (move.promotion) {
    board[move.toR][move.toC] = side === "w" ? "Q" : "q";
  } else {
    board[move.toR][move.toC] = piece;
  }

  if (move.isDoublePush) {
    const epR = side === "w" ? move.toR + 1 : move.toR - 1;
    enPassantTarget = { r: epR, c: move.toC };
  } else {
    enPassantTarget = null;
  }

  const fromSq = algebraicFromRC(move.fromR, move.fromC);
  const toSq = algebraicFromRC(move.toR, move.toC);
  const fromFile = fromSq[0];
  let notation;

  if (move.isCapture) {
    notation = `${fromFile}x${toSq}`;
  } else {
    notation = toSq;
  }
  if (move.promotion) {
    notation += "=Q";
  }

  moveHistory.push({ side, notation });

  if (move.promotion) {
    gameOver = true;
    winner = side;
    winReason = "promotion";
  }

  if (!gameOver) {
    const enemyPawnChar = enemySide === "w" ? "P" : "p";
    let enemyPawns = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === enemyPawnChar) enemyPawns++;
      }
    }
    if (enemyPawns === 0) {
      gameOver = true;
      winner = side;
      winReason = "all pawns captured";
    }
  }

  sideToMove = enemySide;

  if (!gameOver) {
    const enemyMoves = generateAllLegalMoves(
      enemySide,
      board,
      enPassantTarget,
      false
    );
    if (enemyMoves.length === 0) {
      gameOver = true;
      winner = side;
      winReason = "opponent has no legal moves";
    }
  }

  selected = null;
  legalMovesFromSelected = [];
  renderBoard();
  renderMoveList();
  updateStatus();

  if (!gameOver && typeof maybeAIMove === "function") {
    maybeAIMove();
  }
}

// --- Click handling ---

function onSquareClick(e) {
  if (gameOver) return;
  if (sideToMove === "b") return; // human is White

  const r = parseInt(e.currentTarget.dataset.row, 10);
  const c = parseInt(e.currentTarget.dataset.col, 10);
  const piece = board[r][c];

  if (selected) {
    const move = legalMovesFromSelected.find(
      (m) => m.toR === r && m.toC === c
    );
    if (move) {
      applyMove(move);
      return;
    }
    if (selected.r === r && selected.c === c) {
      selected = null;
      legalMovesFromSelected = [];
      renderBoard();
      return;
    }
  }

  if (piece === "P" && sideToMove === "w") {
    selected = { r, c };
    legalMovesFromSelected = generatePawnMovesFor(
      r,
      c,
      "w",
      board,
      enPassantTarget,
      true
    );
    renderBoard();
  }
}

// --- Events & init ---

if (restartBtn) {
  restartBtn.addEventListener("click", setupInitialPosition);
}
if (showCoordsCheckbox) {
  showCoordsCheckbox.addEventListener("change", renderBoard);
}

const puzzleSelect = document.getElementById("puzzleSelect");
const loadPuzzleBtn = document.getElementById("loadPuzzleBtn");

if (loadPuzzleBtn && puzzleSelect) {
  loadPuzzleBtn.addEventListener("click", () => {
    let list = puzzles;
    const val = puzzleSelect.value;
    if (val !== "random") {
      list = puzzles.filter((p) => p.key === val);
    }
    if (!list.length) return;
    const choice = list[Math.floor(Math.random() * list.length)];
    loadPuzzle(choice);
  });
}

setupInitialPosition();
