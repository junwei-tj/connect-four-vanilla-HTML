function getValidSpaces() {
    let validSpaces = [];
    for (let col=0; col<COLUMNS; col++) {
        for (let row=ROWS-1; row>=0; row--) {
            if (!board[row][col]) {
                validSpaces.push({ row, col });
                break;
            }
        }
    }
    return validSpaces;
}

function calculateScore(player) {
    let WINDOW_SIZE = 4;
    let score = 0;

    // points for center (3 pts each)
    // no center advantage at beginner difficulty;
    if (difficulty !== "beginner") {
        let centerIndex = Math.floor(COLUMNS/2);
        let centerColumn = [];
        for (let row=0; row<ROWS; row++) {
            centerColumn.push(board[row][centerIndex]);
        }
        score += centerColumn.count(player) * 3;
    }

    // points for horizontal
    for (let row=0; row<ROWS; row++) {
        for (let column=0; column<COLUMNS-WINDOW_SIZE+1; column++) {
            let window = [board[row][column], board[row][column+1], board[row][column+2], board[row][column+3]];
            score += evaluateWindow(window, player);
        }
    }

    // points for vertical
    for (let column=0; column<COLUMNS; column++) {
        for (let row=0; row<ROWS-WINDOW_SIZE+1; row++) {
            let window = [board[row][column], board[row+1][column], board[row+2][column], board[row+3][column]];
            score += evaluateWindow(window, player);
        }
    }

    // points for bottom left to top right diagonal
    for (let row=ROWS-1; row>ROWS-WINDOW_SIZE; row--) { // note we go from bottom up for row
        for (let column=0; column<COLUMNS-WINDOW_SIZE+1; column++) {
            let window = [board[row][column], board[row-1][column+1], board[row-2][column+2], board[row-3][column+3]];
            score += evaluateWindow(window, player);
        }
    }

    // points for top left to bottom right diagonal
    for (let row=0; row<ROWS-WINDOW_SIZE+1; row++) { 
        for (let column=COLUMNS-1; column>COLUMNS-WINDOW_SIZE; column--) { // note we go from top down for column
            let window = [board[row][column], board[row+1][column-1], board[row+2][column-2], board[row+3][column-3]];
            score += evaluateWindow(window, player);
        }
    }

    return score;
}

// TODO: refine AI to identify with a window where AI has 3 pieces, how close are they to filling the last empty slot
// Reasoning: AI can potentially have 2 "3-piece window" that requires more moves to complete it, while the player has only one
// "3-piece" window but can win in the next turn. AI will prioritise getting the 2 windows as opposed to stopping the player from winning
function evaluateWindow(window, player) {
    let opponent = player === RED ? YELLOW : RED;
    let playerPieces = window.count(player);
    let emptyPieces = window.count(null);
    let opponentPieces = window.count(opponent);

    if (playerPieces === 4) return 100;
    if (playerPieces === 3 && emptyPieces === 1) return 5;
    else if (playerPieces === 2 && emptyPieces === 2) return 2;
    else if (opponentPieces === 3 && emptyPieces === 1) return -10; // original -4, to compensate for above issue

    return 0;
}

// helper function for array
Array.prototype.count = function(toFind) {
    let count = 0;
    for (element of this) {
        if (element === toFind) count++;
    }
    return count;
}

function alphabeta(depth, alpha, beta, isMaximizing) {
    // terminal conditions
    if (depth != 0) {
        let winner = getWinner();
        if (winner) {
            switch(winner) {
                case RED: return [null, null, -100000000000];
                case YELLOW: return [null, null, 100000000000];
                case "tie": return [null, null, 0];
            }
        }
    }
    else {
        return [null, null, calculateScore(YELLOW)]; // probably should return a score indicating how close to victory
    }

    let validSpaces = getValidSpaces();
    let moveRow = null;
    let moveCol = null;
    if (isMaximizing) { // maximizing player
        let bestScore = -Infinity;        
        for (space of validSpaces) {
            let row = space.row;
            let col = space.col;
            board[row][col] = YELLOW;
            let newScore = alphabeta(depth-1, alpha, beta, false)[2];
            board[row][col] = null; // alternative is to copy the board and pass to the function but it takes more memory
            if (newScore > bestScore) {
                bestScore = newScore;
                moveRow = row;
                moveCol = col;
            }
            alpha = Math.max(alpha, bestScore);
            if (alpha >= beta) {
                break;
            }
        }
        return [moveRow, moveCol, bestScore];
    } else { // minimizing player
        let bestScore = Infinity;
        for (space of validSpaces) {
            let row = space.row;
            let col = space.col;
            board[row][col] = RED; 
            let newScore = alphabeta(depth-1, alpha, beta, true)[2];
            board[row][col] = null; // alternative is to copy the board and pass to the function but it takes more memory
            if (newScore < bestScore) {
                bestScore = newScore;
                moveRow = row;
                moveCol = col;
            }
            beta = Math.min(beta, bestScore);
            if (alpha >= beta) {
                break;
            }
        }
        return [moveRow, moveCol, bestScore];
    }
}