var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var csrf = require('csurf');
var session = require('client-sessions');
var express = require('express');
var middleware = require('./config/auth-middleware');

var main = require('./routes/main');
var dashboard = require('./routes/dashboard');
var diagram = require('./routes/diagram');
var profile = require('./routes/profile');
var auth = require('./routes/auth');

mongoose.connect('mongodb://localhost/arrows');

var app = express();

app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    cookieName: 'session',
    secret: '07tLl5BRJtv&SJG9EI*k$@zO',
    duration: 60 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));
app.use(csrf());
app.use(middleware.authMiddleware);
app.use(express.static('public'));

// Main
app.get('/', main.view);

// Dashboard
app.get('/dashboard', middleware.requireLogin, dashboard.view);
app.put('/dashboard/update-title', middleware.requireLogin, dashboard.updateTitle);
app.post('/dashboard/add-diagram', middleware.requireLogin, dashboard.addDiagram);
app.delete('/dashboard/delete-diagram', middleware.requireLogin, dashboard.deleteDiagram);
app.put('/dashboard/save-sort', middleware.requireLogin, dashboard.saveSort);
app.post('/dashboard/import', middleware.requireLogin, dashboard.import);
app.get('/dashboard/sample', middleware.requireLogin, dashboard.sample);
app.get('/dashboard/export', middleware.requireLogin, dashboard.export);
app.get('/dashboard/:id', middleware.requireLogin, dashboard.diagram);

// Diagram
app.put('/diagram/add-node', middleware.requireLogin, diagram.addNode);
app.put('/diagram/update-node', middleware.requireLogin, diagram.updateNode);
app.delete('/diagram/delete-node', middleware.requireLogin, diagram.deleteNode);
app.put('/diagram/add-relationship', middleware.requireLogin, diagram.addRelationship);
app.put('/diagram/update-relationship', middleware.requireLogin, diagram.updateRelationship);
app.delete('/diagram/delete-relationship', middleware.requireLogin, diagram.deleteRelationship);
app.put('/diagram/update-to-index', middleware.requireLogin, diagram.updateToIndex);
app.post('/diagram/create-branch', middleware.requireLogin, diagram.createBranch);

// Profile
app.get('/profile', profile.view);
app.post('/profile', profile.update);

// Auth
app.get('/register', auth.registerView);
app.post('/register', auth.register);
app.get('/login', auth.loginView);
app.post('/login', auth.login);
app.get('/forgot-password', auth.forgotView);
app.post('/forgot-password', auth.forgot);
app.get('/reset-password/:token', auth.resetView);
app.post('/reset-password/:token', auth.reset);
app.get('/logout', auth.logout);

app.listen(3000);