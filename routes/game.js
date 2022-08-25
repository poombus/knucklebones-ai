var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    res.render('game', {
        title: 'Game Page'
    });
});

module.exports = router;