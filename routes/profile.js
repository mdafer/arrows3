var bcrypt = require('bcryptjs')
var utils = require('../config/utils')
var userModel = require('../models/user')

// Render the profile page
module.exports.view = function(req, res) {
	res.render('profile', {
		csrfToken: req.csrfToken(),
		error: '',
		success: ''
	})
}

// Update profile
module.exports.update = function(req, res) {
	var error = ''
	if(req.body.password1 != req.body.password2){
		error = "New Password doesn't match."
	}
	if(req.body.password1 && !error) {
		error = utils.checkPassword(req.body.password1)
	}
	if(error){
		res.render('profile', {
		  csrfToken: req.csrfToken(),
		  error: error,
		  success: ''
		})
		return
	}
	userModel.User.findOne({ email: req.user.email }, 'firstName lastName email password', function(err, user) {
		if(bcrypt.compareSync(req.body.password, user.password)) {
			if(req.user.email === req.body.email) {
				user.firstName = req.body.firstName
				user.lastName = req.body.lastName
				if(req.body.password1){
					var salt = bcrypt.genSaltSync(10)
					var hash = bcrypt.hashSync(req.body.password1, salt)
					user.password = hash
				}
				user.save()

				utils.createUserSession(req, res, user)
				res.render('profile', {
					csrfToken: req.csrfToken(),
					error: '',
					success: 'Your profile has been successfully updated'
				})
			} else {
				// Check if the new email is not already used
				userModel.User.findOne({ email: req.body.email }, 'email', function(err, usr) {
				  if(usr) {
				  	res.render('profile', {
				  		csrfToken: req.csrfToken(),
				  		error: 'Email already used',
				  		success: ''
				  	})
				  } else {
				  	user.email = req.body.email
				  	user.firstName = req.body.firstName
				  	user.lastName = req.body.lastName
				  	if(req.body.password1){
				  		var salt = bcrypt.genSaltSync(10)
				  		var hash = bcrypt.hashSync(req.body.password1, salt)
				  		user.password = hash
				  	}
				  	user.save()

				  	utils.createUserSession(req, res, user)
				  	res.render('profile', {
				  		csrfToken: req.csrfToken(),
				  		error: '',
				  		success: 'Your profile has been successfully updated'
				  	})
				  }
				})
			}
		} else {
			error = "Current password doesn't match"
			res.render('profile', {
				csrfToken: req.csrfToken(),
				error: "Current password doesn't match",
				success: ''
			})
		}
	})
}