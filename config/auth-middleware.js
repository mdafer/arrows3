var userModel = require('../models/user');
var utils = require('./utils');

// authentication middleware
module.exports.authMiddleware = function (req, res, next) {
    if (req.session && req.session.user) {
        userModel.User.findOne({email: req.session.user.email}, '_id firstName lastName email', function (err, user) {
            if (user) {
                utils.createUserSession(req, res, user);
            }
            next();
        });
    } else {
        next();
    }
};

// Check if user is logged in
module.exports.requireLogin = function (req, res, next) {
    if (!req.user) {
        res.redirect('/login');
    } else {
        next();
    }
};
