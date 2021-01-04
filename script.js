const ROWS = 6;
const COLUMNS = 7;

const boxes = Array.from(document.getElementsByClassName("box")); // boxes refer to the actual cells in the HTML
let board; // board is a 2D array hidden from the HTML, that parallels the HTML boxes. it is used to handle game logic
const nextMoveButtons = Array.from(document.getElementsByClassName("next-move"));
const playText = document.getElementById("play-text");
const restartButton = document.getElementById("restart-button");

const RED = "red";
const YELLOW = "yellow";
let currentPlayer = YELLOW; // technically RED starts first, but we assign YELLOW first since we need to call switchPlayer() at start of new game
let lastMove;

// initializes board to a 2D array of 6 rows by 7 columns
function createBoard() {
    board = [];
    for (let i=0; i<ROWS; i++) {
        let newRow = []
        for (let j=0; j<COLUMNS; j++) {
            newRow.push(null);
        }
        board.push(newRow);
    }
}

// function to handle user move
function columnChosen(e) {
    let column = +e.target.id.match(/(\d+)/)[0];
    for (let row=ROWS-1; row>=0; row--) {
        if (!board[row][column]) {        
            makeMove(row, column);
            break;
        }
    }
}

// "drops" the player's token into the board
// when the game ends all next move buttons are devoid of their event listeners
function makeMove(row, column) {
    board[row][column] = currentPlayer;
    lastMove = { row, column };
    
    // create the token image inside the correct box
    let translateVal = (row+1) * 100;
    boxes[row*COLUMNS + column].innerHTML = `<img style="transform: translateY(-${translateVal}px)" src="images/${currentPlayer}.png" alt="${currentPlayer}-token">`;
    let token = boxes[row*COLUMNS + column].childNodes[0]; // keep a ref of the img node we just added
    setTimeout(() => {
        token.classList.add("fly-in");
    }, 50); // the token's "transition" effect can only be triggered after a certain amount of time has passed since adding the initial style to the token

    let winner = getWinner();
    if (winner) {
        playText.innerText = winner === 'tie' ? "Tie" : `${winner} has won!`;
        toggleNextMoveButtons();
    } else {
        switchPlayer();
    }
}
// old ver for local multiplayer
// function switchPlayer() {
//     if (currentPlayer === RED) {
//         currentPlayer = YELLOW;
//         nextMoveButtons.forEach(button => {
//             button.classList.remove("red-move");
//             button.classList.add("yellow-move");
//         })
//     } else {
//         currentPlayer = RED;
//         nextMoveButtons.forEach(button => {
//             button.classList.remove("yellow-move");
//             button.classList.add("red-move");
//         })
//     }
//     playText.innerText = `${currentPlayer}'s Turn`
// }
function switchPlayer() {
    currentPlayer = currentPlayer === RED ? YELLOW : RED;
    playText.innerText = `${currentPlayer}'s Turn`;
    if (currentPlayer === RED) {
        toggleNextMoveButtons(true);
    } else {
        toggleNextMoveButtons(false);
        setTimeout(aiMove, 500);
    }
}

function toggleNextMoveButtons(turnOn) {
    if (turnOn) {
        nextMoveButtons.forEach(button => {
            button.addEventListener("click", columnChosen); // re-enable move buttons
        })
    } else {
        nextMoveButtons.forEach(button => {
            button.removeEventListener('click', columnChosen); // disable move buttons
        });
    }
} 

// returns the winner if any. if the game is tied returns "tie". else null is returned.
function getWinner() {
    const row = lastMove.row;
    const column = lastMove.column;

    // check vertical win
    for (let i=row+3; i>=3; i--) {
        if (i >= ROWS) continue;
        if (board[i][column] && board[i][column] === board[i-1][column] && board[i-1][column] === board[i-2][column] && board[i-2][column] === board[i-3][column]) {
            return board[i][column];
        }
    }

    // check horizontal win
    for (let j=column-3; j<COLUMNS-3; j++) {
        if (j < 0) continue;
        if (board[row][j] && board[row][j] === board[row][j+1] && board[row][j+1] === board[row][j+2] && board[row][j+2] === board[row][j+3]) {
            return board[row][j];
        }
    }

    // check bottom-left to top-right diagonal win
    for (let i=row+3, j=column-3; i>=3 && j<COLUMNS-3; i--, j++) {
        if (i >= ROWS || j < 0) continue;
        if (board[i][j] && board[i][j] === board[i-1][j+1] && board[i-1][j+1] === board[i-2][j+2] && board[i-2][j+2] === board[i-3][j+3]) {
            return board[i][j];
        }
    }

    // check top-left to bottom-right diagonal win
    for (let i=row+3, j=column+3; i>=3 && j>=3; i--, j--) {
        if (i >= ROWS || j >= COLUMNS) continue;
        if (board[i][j] && board[i][j] === board[i-1][j-1] && board[i-1][j-1] === board[i-2][j-2] && board[i-2][j-2] === board[i-3][j-3]) {
            return board[i][j];
        }
    }

    if (checkTie()) return "tie";

    return null;
}

function checkTie() {
    for (let i=0; i<ROWS; i++) {
        for (let j=0; j<COLUMNS; j++) {
            if (!board[i][j]) {
                return false;
            }
        }
    }
    return true;
}

function restart() {
    playText.innerText = "Let's Play!";
    createBoard();
    switchPlayer();
    boxes.forEach(box => {
        box.innerText = "";
    })
    nextMoveButtons.forEach(button => {
        button.addEventListener("click", columnChosen);
    })
}

function aiMove() {
    let result = alphabeta(6, -Infinity, Infinity, true);
    makeMove(result[0], result[1]);
}

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
    let centerIndex = Math.floor(COLUMNS/2);
    let centerColumn = [];
    for (let row=0; row<ROWS; row++) {
        centerColumn.push(board[row][centerIndex]);
    }
    score += centerColumn.count(player) * 3;

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

function evaluateWindow(window, player) {
    let opponent = player === RED ? YELLOW : RED;
    let playerPieces = window.count(player);
    let emptyPieces = window.count(null);
    let opponentPieces = window.count(opponent);

    if (playerPieces === 4) return 100;
    if (playerPieces === 3 && emptyPieces === 1) return 5;
    else if (playerPieces === 2 && emptyPieces === 2) return 2;
    else if (opponentPieces === 3 && emptyPieces === 1) return -4;

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
            // console.log(space);
            let row = space.row;
            let col = space.col;
            board[row][col] = YELLOW; 
            // logBoard(depth, isMaximizing);
            let newScore = alphabeta(depth-1, alpha, beta, false)[2];
            board[row][col] = null; // alternative is to copy the board and pass to the function but it takes more memory
            // logBoard(depth, isMaximizing);
            // console.log(`newScore = ${newScore}, bestScore = ${bestScore}, alpha = ${alpha}, beta = ${beta}, row = ${row}, col = ${col}`)
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
            // console.log(space);
            let row = space.row;
            let col = space.col;
            board[row][col] = RED; 
            // logBoard(depth, isMaximizing);
            let newScore = alphabeta(depth-1, alpha, beta, true)[2];
            board[row][col] = null; // alternative is to copy the board and pass to the function but it takes more memory
            // logBoard(depth, isMaximizing);
            // console.log(`newScore = ${newScore}, bestScore = ${bestScore}, alpha = ${alpha}, beta = ${beta}, row = ${row}, col = ${col}`)
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

// temp function
function logBoard(depth, isMaximizing) {
    let log = "depth = " + depth + " isMaximizing = " + isMaximizing + "\n";
    for (let i=0; i<ROWS; i++) {
        log += board[i].toString() + "\n";
    }
    console.log(log);
}

restartButton.addEventListener('click', restart);
nextMoveButtons.forEach(button => {
    button.classList.add("red-move");
})

restart();

