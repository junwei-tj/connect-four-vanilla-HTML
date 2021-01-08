// constant values
const ROWS = 6;
const COLUMNS = 7;
const RED = "red";
const YELLOW = "yellow";

// HTML elements
const boxes = Array.from(document.getElementsByClassName("box")); // boxes refer to the actual cells in the HTML
const nextMoveButtons = Array.from(document.getElementsByClassName("next-move"));
const playText = document.getElementById("play-text");
const newGameButton = document.getElementById("new-game-button");
const restartButton = document.getElementById("restart-button");
const opponentOptions = Array.from(document.getElementsByName("player-type"));

const playerOne = document.getElementById("player-one");
const playerTwo = document.getElementById("player-two");
const playerOneScoreText = document.getElementById("player-one-score");
const playerTwoScoreText = document.getElementById("player-two-score");

// global variables
let board; // board is a 2D array hidden from the HTML, that parallels the HTML boxes. it is used to handle game logic
let currentPlayer;
let startingPlayer;
let opponent;
let difficulty;
let playerOneScore;
let playerTwoScore;

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
// checks if game has ended as well and updates score accordingly
// when the game ends all next move buttons are devoid of their event listeners
// if game has ended, change who starts the next round
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
        if (winner === "tie") {
            playText.innerText = "Tie Game";
        } else {
            playText.innerText = `${winner} has won!`;
            if (winner === RED) {
                playerOneScoreText.innerText = `${++playerOneScore}`;
            } else {
                playerTwoScoreText.innerText = `${++playerTwoScore}`;
            }
        }        
        toggleNextMoveButtons(false);
        startingPlayer = startingPlayer === RED ? YELLOW : RED;
        newGameButton.innerText = "New Game";
    } else {
        switchPlayer();
    }
}

// switches currentPlayer and updates relevant information
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

// used in makeMove when game ends (disables)
// used in restart (enables)
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

// returns true if all boxes are not null
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

// function to let AI choose its next move
// uses alpha-beta-pruning version of minimax to decide next move
// a larger depth value will make AI harder but consequently takes longer to evaluate a move (may hang browser)
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
    }, 500); // simulates AI "thinking" so that each move is not instantaneous
}

// starts a new game with the desired opponent and difficulty level (if applicable)
// resets scores to 0
function newGame() {
    opponent = document.querySelector("input[name = player-type]:checked").value;
    if (opponent == "computer") {
        difficulty = document.querySelector("input[name = difficulty]:checked").value;
        playerOne.innerText = "You";
        playerTwo.innerText = `Computer (${difficulty[0].toUpperCase() + difficulty.slice(1)})`; // difficulty is title-cased
    } else if (opponent !== "human") {
        return;
    }
    startingPlayer = RED;
    restart();
    playerOneScore = 0;
    playerTwoScore = 0;
    playerOneScoreText.innerText = playerOneScore;
    playerTwoScoreText.innerText = playerTwoScore;
}

// restarts game with the same opponent and without resetting score
// calls switchPlayer() to alternate between who starts first
function restart() {
    toggleNextMoveButtons(true);
    boxes.forEach(box => {
        box.innerText = "";
    });
    createBoard();
    currentPlayer = startingPlayer === RED ? YELLOW : RED; // we need to set the currentPlayer to the opposite of currentPlayer for switchPlayer to switch correctly
    switchPlayer();
}

// function to display the different difficulty levels only if computer is chosen as the opponent
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

// function to consolidate all the required addition of event listeners / onclicks
function addRequiredEventListeners() {
    newGameButton.addEventListener('click', newGame);
    restartButton.addEventListener('click', restart);
    opponentOptions.forEach(option => {
        option.onclick = toggleDifficultyOptions;
    })
}

// reset radio buttons to default checked on reload
window.onload = () => {
    document.getElementById("human").checked = true;
    document.getElementById("easy").checked = true;
}

addRequiredEventListeners();