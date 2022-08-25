const boardSize = 3;

const gameDiv = document.getElementById("game");
const opponentTable = document.getElementById("opponent");
const playerTable = document.getElementById("player");
const rollElement = document.getElementById("diceRoll");
const oscore = document.getElementById("oscore");
const pscore = document.getElementById("pscore");

let playerTurn = 0;
let actionable = false;

let dice = 6;

let game = {
    opponent: {
        board: [
            [0,0,0], //col1
            [0,0,0], //col2
            [0,0,0] //col3
        ],
        score: 0
    },
    player: {
        board: [
            [0,0,0], //col1
            [0,0,0], //col2
            [0,0,0] //col3
        ],
        score: 0
    }
}

//game state functions
function start() {
    document.getElementById("startButton").style.display = 'none';
    gameDiv.style.display = '';
    generateTables();

    setTurn(Math.round(Math.random()));
}

function checkEndGame() {
    let fb;
    for (e in game) {
        fb = true;
        e = game[e];
        for (c of e.board) for (v of c) if (v == 0) fb = false;
        if (fb == true) return true;
    }

    return false;
}

function endGame() {
    game.player.score = 0;
    game.opponent.score = 0;

    for (c in game.player.board) {
        game.player.score += getColumnScore('p',c);
    }
    for (c in game.opponent.board) {
        game.opponent.score += getColumnScore('o',c);
    }

    if (game.player.score > game.opponent.score) rollElement.innerHTML = "Player wins!";
    else if (game.player.score < game.opponent.score) rollElement.innerHTML = "Opponent wins...";
    else rollElement.innerHTML = "Tied.";
    rollElement.innerHTML += `<br>${game.player.score} - ${game.opponent.score}`;
    document.getElementById("turnLabel").innerHTML = "...";
    document.getElementById("turnLabel").style.color = "white";
}

function generateTables() {
    opponentTable.innerHTML = "";
    playerTable.innerHTML = "";

    //dice grid
    for (let i=0; i<boardSize; i++) {
        let row = "<tr>";
        for (let k=0; k<boardSize; k++) row += `<td class=cell id='or${i}c${k}'>--</td>`;
        row += "</tr>";
        opponentTable.innerHTML += row;
    }
    for (let i=0; i<boardSize; i++) {
        let row = "<tr>";
        for (let k=0; k<boardSize; k++) row += `<td class=playerCell id='pr${i}c${k}' onclick="clickedCell(${i},${k})">--</td>`;
        row += "</tr>";
        playerTable.innerHTML += row;
    }

    //score
    oscore.innerHTML = '';
    pscore.innerHTML = '';
    let row = "<tr>";
    for (let k=0; k<boardSize; k++) row += `<td class=score id='oscore${k}'">0</td>`;
    row += "</tr>";
    oscore.innerHTML += row;
    row = "<tr>";
    for (let k=0; k<boardSize; k++) row += `<td class=score id='pscore${k}'">0</td>`;
    row += "</tr>";
    pscore.innerHTML += row;

    //array
    game.opponent.board = [];
    game.player.board = [];
    for (let i=0; i<boardSize; i++) {
        let col = [];
        for (let k=0; k<boardSize; k++) col.push(0);
        game.opponent.board.push(col);
    }

    for (let i=0; i<boardSize; i++) {
        let col = [];
        for (let k=0; k<boardSize; k++) col.push(0);
        game.player.board.push(col);
    }
}

//dice
function shakeDice() {
    rollElement.innerHTML = '...';
    setTimeout(rollDice, 500);
}

function rollDice() {
    let roll = Math.floor(Math.random()*6) + 1;
    rollElement.innerHTML = roll;
    dice = roll;
    actionable = true;

    setTimeout(makeRandomMove, 1500);

    return roll;
}

//board functions
function setCell(who,c,val) {
    if (who == 'o') {
        for (let row=0; row<boardSize; row++) {
            game.player.board[c][row] = game.player.board[c][row] == val ? 0 : game.player.board[c][row];
        }
        for (let i=boardSize-1; i>=0; i--) {
            if (game.opponent.board[c][i] != 0) continue;
            game.opponent.board[c][i] = val;
            break;
        }
    } else if (who == 'p') {
        for (let row=0; row<boardSize; row++) {
            game.opponent.board[c][row] = game.opponent.board[c][row] == val ? 0 : game.opponent.board[c][row];
        }
        for (let i=boardSize-1; i>=0; i--) {
            if (game.player.board[c][i] != 0) continue;
            game.player.board[c][i] = val;
            break;
        }
    }
}

function updateBoard() {
    //displays value in cell
    for ([_c,c] of game.opponent.board.entries()) {
        for ([_r,r] of c.entries()) {
            if (r == 0) r = '--';
            document.getElementById(`or${_r}c${_c}`).innerHTML = r;
            document.getElementById(`or${_r}c${_c}`).style.backgroundColor = '';
        }
    }
    for ([_c,c] of game.player.board.entries()) {
        for ([_r,r] of c.entries()) {
            if (r == 0) r = '--';
            document.getElementById(`pr${_r}c${_c}`).innerHTML = r;
            document.getElementById(`pr${_r}c${_c}`).style.backgroundColor = '';
        }
    }

    //colors cells based on matches
    for (let c=0; c<boardSize; c++) {
        let matches = findColumnMatches('o',c);
        for (let m=0; m<matches.length; m++) {
            if (matches.length == 2) document.getElementById(`or${matches[m]}c${c}`).style.backgroundColor = 'rgb(175, 131, 0)';
            else if (matches.length == 3) document.getElementById(`or${matches[m]}c${c}`).style.backgroundColor = '#0043af';
        }
    }
    for (let c=0; c<boardSize; c++) {
        let matches = findColumnMatches('p',c);
        for (let m=0; m<matches.length; m++) {
            if (matches.length == 2) document.getElementById(`pr${matches[m]}c${c}`).style.backgroundColor = 'rgb(175, 131, 0)';
            else if (matches.length == 3) document.getElementById(`pr${matches[m]}c${c}`).style.backgroundColor = '#0043af';
        }
    }

    //score
    for (let c=0; c<boardSize; c++) {
        let score = getColumnScore('o',c);
        document.getElementById('oscore'+c).innerHTML = score;
    }
    for (let c=0; c<boardSize; c++) {
        let score = getColumnScore('p',c);
        document.getElementById('pscore'+c).innerHTML = score;
    }
}

//scoring
function findColumnMatches(who, col) {
    let matchedRows = [];

    let board = who == 'o' ? game.opponent.board : game.player.board;
    if (board[col][0] == board[col][1] && board[col][0] == board[col][2] && board[col][0] != 0) {
        matchedRows.push(0);
        matchedRows.push(1);
        matchedRows.push(2);
    } else if (board[col][0] == board[col][1] && board[col][0] != 0) {
        matchedRows.push(0);
        matchedRows.push(1);
    } else if (board[col][0] == board[col][2] && board[col][0] != 0) {
        matchedRows.push(0);
        matchedRows.push(2);
    } else if (board[col][1] == board[col][2] && board[col][1] != 0) {
        matchedRows.push(1);
        matchedRows.push(2);
    }

    return matchedRows;
}

function getColumnScore(who, col) {
    let board = who == 'o' ? game.opponent.board : game.player.board;

    let score = 0;
    let multiplier = Math.max(1,findColumnMatches(who, col).length);
    for (let i=0; i<boardSize; i++) if (board[col][i] != 0) score += board[col][i];
    score = score*multiplier;

    return score;
}

//moves and turn order
function setTurn(num = null) {
    if (num != null) {
        num = Math.abs(num);
        if (num > 1) num = 1;
    
        playerTurn = num;
    } else {
        if (playerTurn == 0) playerTurn = 1;
        else playerTurn = 0;
    }

    if (playerTurn == 0) {
        document.getElementById("turnLabel").innerHTML = "Opponent's turn...";
        document.getElementById("turnLabel").style.color = "#cf1b1b";
    } else {
        document.getElementById("turnLabel").innerHTML = "Your turn...";
        document.getElementById("turnLabel").style.color = "#4ecf1b";
    }

    actionable = false;
    if (checkEndGame() == false) shakeDice();
    else endGame();
}

function makeRandomMove() {
    if (playerTurn != 0 || !actionable) return;
    let col = Math.floor(Math.random()*3);
    let allowed = false;
    while (!allowed) {
        allowed = true;
        let hasOpen = false;
        for (r of game.opponent.board[col]) if (r == 0) hasOpen = true;
        allowed = hasOpen;
        if (!allowed) col = Math.floor(Math.random()*3);
    }

    setCell('o', col, dice);
    updateBoard();
    setTurn();
}

function clickedCell(r,c) {
    if (playerTurn != 1 || !actionable) return;
    
    let hasOpen = false;
    for (row of game.player.board[c]) if (row == 0) hasOpen = true;
    if (!hasOpen) return;

    setCell('p', c, dice);
    updateBoard();
    setTurn();
}