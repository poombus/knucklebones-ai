const err404 = (req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    //next(err);
    res.render('err404', {
        title: 'Error 404'
    });
}

module.exports = err404;