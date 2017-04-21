var bodyParser = require('body-parser')
var bcrypt = require('bcryptjs')
var mongoose = require('mongoose')
var csrf = require('csurf')
var session = require('client-sessions')
var express = require('express')
var crypto = require('crypto')

var middleware = require('./config/auth-middleware')
var utils = require('./config/utils')
var userModel = require('./models/user')

mongoose.connect('mongodb://localhost/arrows')

var app = express()

app.set('views', 'views')
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
	cookieName: 'session',
	secret: '07tLl5BRJtv&SJG9EI*k$@zO',
	duration: 60 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
}))
app.use(csrf())
app.use(middleware.authMiddleware)

/*
	Routes
*/

// Render the home page
app.get('/', function(req, res) {
	res.render('index')
})

// Render the dashboard page
app.get('/dashboard', utils.requireLogin, function(req, res) {
	res.render('dashboard')
})

// Render the profile page
app.get('/profile', function(req, res) {
	res.render('profile', {
		csrfToken: req.csrfToken(),
		error: '',
		success: ''
	})
})

// Update profile
app.post('/profile', function(req, res) {
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
})

// Render the registration page
app.get('/register', function(req, res) {
	res.render('register', {
		csrfToken: req.csrfToken(),
		error: ''
	})
})

// Create a new user
app.post('/register', function(req, res) {
	var error = utils.checkPassword(req.body.password)
	if(error){
		res.render('register', {
		  csrfToken: req.csrfToken(),
		  error: error
		})
		return
	}
	var salt = bcrypt.genSaltSync(10)
	var hash = bcrypt.hashSync(req.body.password, salt)

	var user = new userModel.User({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		password: hash
	})
	user.save(function(err) {
		if(err) {
			error = 'Something went wrong.'
			if(err.code === 11000) {
				error = "This email is already taken."
			}

			res.render('register', {
				csrfToken: req.csrfToken(),
				error: error
			})
		} else {
			utils.createUserSession(req, res, user)
			res.redirect('/dashboard')
		}
	})
})

// Render the login page
app.get('/login', function(req, res) {
	res.render('login', { 
		csrfToken: req.csrfToken(),
		error: ''
	})
})

// Log in the user
app.post('/login', function(req, res) {
	userModel.User.findOne({ email: req.body.email }, 'firstName lastName email password', function(err, user) {
	    if (!user) {
	      res.render('login', { error: "Incorrect email / password.", csrfToken: req.csrfToken() })
	    } else {
	      if (bcrypt.compareSync(req.body.password, user.password)) {
	        utils.createUserSession(req, res, user)
	        res.redirect('/dashboard')
	      } else {
	        res.render('login', { error: "Incorrect email / password.", csrfToken: req.csrfToken() })
	      }
	    }
	  })
})

// Render the forgot password page
app.get('/forgot-password', function(req, res) {
	res.render('forgot-password', {
		csrfToken: req.csrfToken(),
		error: '',
		success: ''
	})
})

// Send reset email
app.post('/forgot-password', function(req, res) {
	userModel.User.findOne({ email: req.body.email }, function(err, user) {
		var error = ''
		var success = ''
		if(!user){
			error = "User doesn't exists."
		} else {
			// Generate a random token for the user 
			crypto.randomBytes(32, function(ex, buf) {
			    var token = buf.toString('hex')
			    user.passwordResetToken = token
			    user.passwordResetExpire = Date.now() + 3600000
			    user.save()
			})

			// TODO - send email

			success = 'An email has been sent to ' + req.body.email
		}
		res.render('forgot-password', {
			csrfToken: req.csrfToken(),
			error: error,
			success: success
		})
	})
})

// Render the reset password page
app.get('/reset-password/:token', function(req, res) {
	userModel.User.findOne({ passwordResetToken: req.params.token, passwordResetExpire: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      res.redirect('/forgot-password')
    } else {
	    res.render('reset-password', {
	      csrfToken: req.csrfToken(),
	      error: ''
	    })
	  }
  })
})

// Reset user password
app.post('/reset-password/:token', function(req, res) {
	var error = utils.checkPassword(req.body.password)
	if(!error && req.body.password != req.body.password1){
		error = "Password doesn't match."
	}
	if(error){
		res.render('reset-password', {
		  csrfToken: req.csrfToken(),
		  error: error
		})
		return
	}

	userModel.User.findOne({ passwordResetToken: req.params.token, passwordResetExpire: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      res.redirect('/forgot-password')
    } else {
    	var salt = bcrypt.genSaltSync(10)
    	var hash = bcrypt.hashSync(req.body.password, salt)

    	user.password = hash
      user.passwordResetToken = undefined
      user.passwordResetExpire = undefined
      user.save()

      // TODO - send email

		  res.redirect('/login')
	  }
  })
})

// Log out the user
app.get('/logout', function(req, res) {
	if(req.session) {
		req.session.reset()
	}
	res.redirect('/')
})

app.listen(3000)