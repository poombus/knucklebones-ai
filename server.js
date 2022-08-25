const ml = require('./modules/ml');
const kb = require('./modules/knucklebones');

const appVersion = require('./package.json').version;
const port = 3002;

const fs = require('fs');
const socket = require('socket.io');

const path = require('path');
const http = require('http');
const express = require('express');
const app = express();
let listener;
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');

let index = require('./routes/index');
let game = require('./routes/game');
let training = require('./routes/training');

app.use('/',index);
app.use('/game',game);
app.use('/training',training);
app.use(require('./routes/err404')); //err404

//=================================
let io;
function setupSocket() {
    io = socket(listener);
    io.on('connection', socket => {

    });
}

startApp();
async function startApp() {
    console.log("Starting app..."); //prints time of app starting

    app.locals["appVersion"] = appVersion;

    listener = app.listen(port, () => {
        console.log('Node Server now running on port ' + port);
    });;

    setupSocket();

    kb.populateTournament();
} 