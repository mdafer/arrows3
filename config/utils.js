// Store the user object in req
// Make the user object available to template
// Set a session cookie with the user object
module.exports.createUserSession = function(req, res, user) {
	var user = {
		_id: user._id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
	}

	req.session.user = user
	req.user = user
	req.app.locals.user = user
}

// Password policy
module.exports.checkPassword = function(password) {
	if(password.length < 8){
		return 'The password must be at least 8 characters.'
	}
	return ''
}