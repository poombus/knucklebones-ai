const ml = require('./ml');
const tools = require('./tools');

let round = 1;
let winners = [];
let losers = [];
let mvp = null;

//game state functions
function populateTournament() {
    ml.beginTraining({}, 100, 19, 3);
    //randomly add children to winners bracket
    for(let i=0; i<ml.getFamily().length; i++) {
        winners.splice(Math.floor(Math.random()*(winners.length+1)),0,ml.getChild(i));
    }
    bracketize(winners);

    start();
}

function bracketize(arr) {
    //arr = tools.shuffleArray(arr);
    for (let i=0; i<arr.length; i++) {
        arr[i].fitness = 0;
        if (arr[i+1]) arr.splice(i,2, {
            "0": {
                "data":arr[i],
                board: [
                    [0,0,0], //col1
                    [0,0,0], //col2
                    [0,0,0] //col3
                ],
                score: 0
            }, 
            "1": {
                "data":arr[i+1],
                board: [
                    [0,0,0], //col1
                    [0,0,0], //col2
                    [0,0,0] //col3
                ],
                score: 0
            },
            "playerTurn": Math.round(Math.random()),
            "actionable": false,
            "dice": 0,
            "winner": null
        });
        else arr.splice(i,1, {
            "0": {
                "data":arr[i],
                board: [
                    [0,0,0], //col1
                    [0,0,0], //col2
                    [0,0,0] //col3
                ],
                score: 0
            }, 
            "1": null,
            "playerTurn": Math.round(Math.random()),
            "actionable": false,
            "dice": 0,
            "winner": 0
        });
    }
}

function start() {
    for (match of winners) setTurn(match, Math.round(Math.random()));
    for (match of losers) setTurn(match, Math.round(Math.random()));
    nextTurn();
}

function nextTurn() {
    let finished = true;
    for (match of winners) {
        if (match.winner == null) finished = false;
        else continue;
        shakeDice(match);
    }
    for (match of losers) {
        if (match.winner == null) finished = false;
        else continue;
        shakeDice(match);
    }

    if (finished) nextRound();
    else setTimeout(nextTurn, 1000);
}

function nextRound() {
    round++;
    console.log('starting round ',round);

    for (c in losers) { //losers are eliminated
        c = parseInt(c);
        let match = losers[c];
        let winner = match[match.winner.toString()];
        let loser = match.winner == 0 ? match['1'] : match['0'];
        if (loser != null && (mvp == null || mvp.fitness < loser.data.fitness)) mvp = loser.data; //if loser has mvp fitness score, hold a copy
        losers.splice(c,1, winner.data);
    }
    losers = [];
    for (c in winners) { //losers are moved to losers bracket
        c = parseInt(c);
        let match = winners[c];
        let winner = match[match.winner.toString()];
        let loser = match.winner == 0 ? match['1'] : match['0'];
        if (loser != null) losers.push(loser.data);
        winners.splice(c,1, match[match.winner.toString()].data);
    }

    if (winners.length > 1 || losers.length > 1) {
        bracketize(winners);
        bracketize(losers);
        nextTurn();
    } else {
        let arr = [winners[0],losers[0]];
        if (mvp != null) arr.push(mvp);
        nextGeneration(arr);
    }
}

function nextGeneration(arr) {
    ml.newGeneration(arr); //new generation with winners[0], losers[0], and mvp as the parents
    round = 1;
    console.log('starting round ',round);

    winners = [];
    losers = [];
    mvp = null;

    for(let i=0; i<ml.getFamily().length; i++) {
        winners.splice(Math.floor(Math.random()*(winners.length+1)),0,ml.getChild(i));
    }
    bracketize(winners);

    start();
}

function checkEndGame(match) {
    let fb;
    for (e of ['0','1']) {
        fb = true;
        e = match[e];
        for (c of e.board) for (v of c) if (v == 0) fb = false;
        if (fb == true) return true;
    }

    return false;
}

function endGame(match) {
    let a = match['0'];
    let b = match['1'];
    a.score = 0;
    b.score = 0;
    for (c in a.board) {
        c = parseInt(c);
        a.score += getColumnScore(match, 0,c);
    }
    for (c in b.board) {
        c = parseInt(c);
        b.score += getColumnScore(match, 1,c);
    }

    if (a.score > b.score) {
        match.winner = 0;
        ml.reward(a.data, 20);
        ml.reward(b.data, -20);
    } else if (b.score > a.score) {
        match.winner = 1;
        ml.reward(a.data, -20);
        ml.reward(b.data, 20);
    }
    ml.reward(a.data, a.score);
    ml.reward(b.data, b.score);
}

//dice
function shakeDice(match) {
    setTimeout(() => {rollDice(match)}, 100);
}

function rollDice(match) {
    let roll = Math.floor(Math.random()*6) + 1;
    match.dice = roll;
    match.actionable = true;

    setTimeout(() => {mlDecision(match)},100);

    return roll;
}

//board functions
function setCell(match, who,c,val) {
    let e = match[who.toString()];
    let o = who.toString() == '0' ? match['1'] : match['0'];

    for (let row=0; row<3; row++) {
        if (o.board[c][row] == val) {
            ml.reward(o.data, Math.min(-1,-findColumnMatches(match, who == 0 ? 1 : 0, c).length^2));
            ml.reward(e.data, Math.max(1,findColumnMatches(match, who, c).length^2));
        }
        o.board[c][row] = o.board[c][row] == val ? 0 : o.board[c][row];
    }
    for (let i=3-1; i>=0; i--) {
        if (e.board[c][i] != 0) continue;
        e.board[c][i] = val;
        break;
    }
}

//scoring
function findColumnMatches(match, who, col) {
    let matchedRows = [];

    let board = match[who.toString()].board;
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

function getColumnScore(match, who, col) {
    let board = match[who.toString()].board;

    let score = 0;
    let multiplier = Math.max(1,findColumnMatches(match, who, col).length);
    for (let i=0; i<3; i++) if (board[col][i] != 0) score += board[col][i];
    score = score*multiplier;

    return score;
}

//moves and turn order
function setTurn(match, num = null) {
    if (num != null) {
        num = Math.abs(num);
        if (num > 1) num = 1;
    
        match.playerTurn = num;
    } else {
        if (match.playerTurn == 0) match.playerTurn = 1;
        else match.playerTurn = 0;
    }

    actionable = false;
    if (checkEndGame(match) == false) return;
    else endGame(match);
}

function mlDecision(match) {
    let who = match.playerTurn;
    let e = match[who.toString()];
    let o = who == 0 ? match['1'] : match ['0'];
    let input = [];
    for (c of e.board) for (r of c) input.push(r/6);
    for (c of o.board) for (r of c) input.push(r/6);
    input.push(match.dice/6);
    let output = ml.brainActivity(e.data, input);
    
    for (d in output) {
        d = parseInt(d);
        if (chooseColumn(match, tools.getNthBiggest(output,d))) break;
    }

    setTurn(match);
}

function chooseColumn(match, c) {
    let e = match[match.playerTurn.toString()];
    let hasOpen = false;
    for (row of e.board[c]) if (row == 0) hasOpen = true;
    if (!hasOpen) return false;

    setCell(match, match.playerTurn, c, match.dice);
    return true;
}

module.exports = {
    populateTournament: () => populateTournament()
}