var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    res.render('training', {
        title: 'Training Page'
    });
});

module.exports = router;