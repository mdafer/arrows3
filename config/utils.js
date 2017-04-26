// Store the user object in req
// Make the user object available to template
// Set a session cookie with the user object
module.exports.createUserSession = function (req, res, user) {
    var cleanUser = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
    };

    req.session.user = cleanUser;
    req.user = cleanUser;
    req.app.locals.user = cleanUser;
};

// Password policy
module.exports.checkPassword = function (password) {
    if (password.length < 8) {
        return 'The password must be at least 8 characters.';
    }
    return '';
};