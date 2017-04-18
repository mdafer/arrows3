var bodyParser = require('body-parser')
var bcrypt = require('bcryptjs')
var mongoose = require('mongoose')
var csrf = require('csurf')
var session = require('client-sessions')
var express = require('express')

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
app.use(csrf());
app.use(middleware.authMiddleware);

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

// Render the registration page
app.get('/register', function(req, res) {
	res.render('register', {
		csrfToken: req.csrfToken(),
		error: ''
	})
})

// Create a new user
app.post('/register', function(req, res) {
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
			var error = 'Something went wrong.'

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
	      res.render('login', { error: "Incorrect email / password.", csrfToken: req.csrfToken() });
	    } else {
	      if (bcrypt.compareSync(req.body.password, user.password)) {
	        utils.createUserSession(req, res, user);
	        res.redirect('/dashboard');
	      } else {
	        res.render('login', { error: "Incorrect email / password.", csrfToken: req.csrfToken() });
	      }
	    }
	  });
})

// Log out the user
app.get('/logout', function(req, res) {
	if(req.session) {
		req.session.reset()
	}
	res.redirect('/')
})

app.listen(3000);