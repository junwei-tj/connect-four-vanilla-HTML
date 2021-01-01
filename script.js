const ROWS = 6;
const COLUMNS = 7;

const boxes = Array.from(document.getElementsByClassName("box"));
let board;
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

/* 
"drops" the player's token into the board
when the game ends all next move buttons are devoid of their event listeners
*/
function columnChosen(e) {
    let column = +e.target.id.match(/(\d+)/)[0];
    for (let row=ROWS-1; row>=0; row--) {
        if (!board[row][column]) {        
            board[row][column] = currentPlayer;
            boxes[row*COLUMNS + column].innerHTML = `<img src="images/${currentPlayer}.png" alt="red-token">`;
            lastMove = { row, column };
            let winner = getWinner();
            if (winner) {
                playText.innerText = winner === 'tie' ? "The game has ended in a tie." : `${winner} has won!`;
                nextMoveButtons.forEach(button => {
                    button.removeEventListener('click', columnChosen);
                })
            } else {
                switchPlayer();
            }
            break;
        }
    }
}

function switchPlayer() {
    if (currentPlayer === RED) {
        currentPlayer = YELLOW;
        nextMoveButtons.forEach(button => {
            button.classList.remove("red-move");
            button.classList.add("yellow-move");
        })
    } else {
        currentPlayer = RED;
        nextMoveButtons.forEach(button => {
            button.classList.remove("yellow-move");
            button.classList.add("red-move");
        })
    }
    playText.innerText = `${currentPlayer}'s Turn`
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

restartButton.addEventListener('click', restart);

restart();