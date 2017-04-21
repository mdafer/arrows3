// Store the user object in req
// Make the user object available to template
// Set a session cookie with the user object
module.exports.createUserSession = function(req, res, user) {
	var user = {
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
	}

	req.session.user = user
	req.user = user
	req.app.locals.user = user
}

// Check if user is logged in
module.exports.requireLogin = function(req, res, next){
	if(!req.user) {
		res.redirect('/login')
	} else {
		next()
	}
}


// Password policy
module.exports.checkPassword = function(password) {
	if(password.length < 8){
		return 'The password must be at least 8 characters.'
	}
	return ''
}
