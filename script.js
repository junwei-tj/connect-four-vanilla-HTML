const ROWS = 6;
const COLUMNS = 7;

const boxes = Array.from(document.getElementsByClassName("box")); // boxes refer to the actual cells in the HTML
let board; // board is a 2D array hidden from the HTML, that parallels the HTML boxes. it is used to handle game logic
const nextMoveButtons = Array.from(document.getElementsByClassName("next-move"));
const playText = document.getElementById("play-text");
const restartButton = document.getElementById("restart-button");
const opponentOptions = Array.from(document.getElementsByName("player-type"));

const RED = "red";
const YELLOW = "yellow";
let currentPlayer;
let opponent;
let difficulty;

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
        restartButton.innerText = "New Game";
    } else {
        switchPlayer();
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === RED ? YELLOW : RED;
    if (opponent === "human") {
        playText.innerText = `${currentPlayer}'s Turn`;
        if (currentPlayer === RED) {
            nextMoveButtons.forEach(button => {
                button.classList.remove("yellow-move");
                button.classList.add("red-move");
            })
        } else {
            nextMoveButtons.forEach(button => {
                button.classList.remove("red-move");
                button.classList.add("yellow-move");
            })
        }
    } else if (opponent === "computer") {
        nextMoveButtons.forEach(button => {
            button.classList.remove("yellow-move");
            button.classList.add("red-move");
        })
        if (currentPlayer === RED) {
            playText.innerText = "Your Turn";
            toggleNextMoveButtons(true);
        } else {
            playText.innerText = "Computer's Turn";
            toggleNextMoveButtons(false);
            aiMove();
        }
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

function aiMove() {
    let depth;
    switch (difficulty) {
        case "beginner": 
            depth = 1; 
            break;
        case "easy":
            depth = 2;
            break;
        case "medium":
            depth = 4;
            break;
        case "hard":
            depth = 5;
            break;
        default:
            depth = 2;
    }
    let result = alphabeta(depth, -Infinity, Infinity, true);
    setTimeout(() => {
        makeMove(result[0], result[1])
    }, 500);
}

function newGame() {
    opponent = document.querySelector("input[name = player-type]:checked").value;
    if (opponent == "computer") {
        difficulty = document.querySelector("input[name = difficulty]:checked").value;
    } else if (opponent !== "human") {
        return;
    }
    toggleNextMoveButtons(true);
    boxes.forEach(box => {
        box.innerText = "";
    });
    createBoard();
    restartButton.innerText = "Restart";
    currentPlayer = YELLOW; // technically RED starts first, but have to set YELLOW first so that switchPlayer will switch to RED correctly;
    switchPlayer();
}

function toggleDifficultyOptions(e) {
    if (e.target.value === "human") {
        document.getElementById("difficulty-container").style.display="none";
    } else if (e.target.value === "computer") {
        document.getElementById("difficulty-container").style.display="block";
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

function onStart() {
    restartButton.addEventListener('click', newGame);
    opponentOptions.forEach(option => {
        option.onclick = toggleDifficultyOptions;
    })
}

onStart();

// reset radio buttons to default checked on reload
window.onload = () => {
    document.getElementById("human").checked = true;
    document.getElementById("easy").checked = true;
}