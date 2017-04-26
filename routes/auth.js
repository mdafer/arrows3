var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var utils = require('../config/utils');

var userModel = require('../models/user');

// Render the registration page
module.exports.registerView = function (req, res) {
    res.render('register', {
        csrfToken: req.csrfToken(),
        error: ''
    });
};

// Create a new user
module.exports.register = function (req, res) {
    var error = utils.checkPassword(req.body.password);
    if(error){
        res.render('register', {
            csrfToken: req.csrfToken(),
            error: error
        });
        return;
    }
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.password, salt);

    var user = new userModel.User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hash
    });
    user.save(function (err) {
        if(err) {
            error = 'Something went wrong.';
            if(err.code === 11000) {
                error = "This email is already taken.";
            }

            res.render('register', {
                csrfToken: req.csrfToken(),
                error: error
            });
        } else {
            utils.createUserSession(req, res, user);
            res.redirect('/dashboard');
        }
    });
};

// Render the login page
module.exports.loginView = function (req, res) {
    res.render('login', { 
        csrfToken: req.csrfToken(),
        error: ''
    });
};

// Log in the user
module.exports.login = function(req, res) {
    userModel.User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          res.render('login', {
            error: "Incorrect email / password.",
            csrfToken: req.csrfToken()
          });
        } else {
            if (bcrypt.compareSync(req.body.password, user.password)) {
                utils.createUserSession(req, res, user);
                res.redirect('/dashboard');
            } else {
                res.render('login', {
                    error: "Incorrect email / password.",
                    csrfToken: req.csrfToken()
                });
            }
        }
      });
};

// Render the forgot password page
module.exports.forgotView = function(req, res) {
    res.render('forgot-password', {
        csrfToken: req.csrfToken(),
        error: '',
        success: ''
    });
};

// Send reset email
module.exports.forgot = function(req, res) {
    userModel.User.findOne({ email: req.body.email }, function(err, user) {
        var error = '';
        var success = '';
        if(!user){
            error = "User doesn't exists.";
        } else {
            // Generate a random token for the user 
            crypto.randomBytes(32, function(ex, buf) {
                var token = buf.toString('hex');
                user.passwordResetToken = token;
                user.passwordResetExpire = Date.now() + 3600000;
                user.save();
            });

            // TODO - send email

            success = 'An email has been sent to ' + req.body.email;
        }
        res.render('forgot-password', {
            csrfToken: req.csrfToken(),
            error: error,
            success: success
        });
    });
};

// Render the reset password page
module.exports.resetView = function(req, res) {
    userModel.User.findOne({ passwordResetToken: req.params.token, passwordResetExpire: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      res.redirect('/forgot-password');
    } else {
        res.render('reset-password', {
            csrfToken: req.csrfToken(),
            error: ''
        });
      }
  });
};

// Reset user password
module.exports.reset = function(req, res) {
    var error = utils.checkPassword(req.body.password);
    if(!error && req.body.password != req.body.password1){
        error = "Password doesn't match.";
    }
    if(error){
        res.render('reset-password', {
            csrfToken: req.csrfToken(),
            error: error
        });
        return;
    }

    userModel.User.findOne({ passwordResetToken: req.params.token, passwordResetExpire: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      res.redirect('/forgot-password');
    } else {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password, salt);

        user.password = hash;
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        user.save(function(err) {
            // TODO - send email

            res.redirect('/login');
            });
        }
    });
};

// Log out the user
module.exports.logout = function(req, res) {
    if(req.session) {
        req.session.reset();
    }
    res.redirect('/');
};