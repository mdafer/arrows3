var diagramModel = require('../models/diagram')
var userModel = require('../models/user')

// Redirect to diagram
module.exports.view = function(req, res, next) {
	userModel.User.findOne({ _id: req.session.user._id }, 'currentDiagram', function(err, user) {
		// TODO: Check if currentDiagram exist

		if(user.currentDiagram) { 
			res.redirect('/dashboard/' + user.currentDiagram)
		} else {
			module.exports.addDiagram(req, res, next)
		}
	})
}

// Render the diagram page
module.exports.diagram = function(req, res, next) {
	diagramModel.Diagram.findOne({ _id: req.params.id, user: req.session.user._id}, function(err, diagram) {
		if(diagram){
			diagramModel.Diagram.find({ user: req.session.user._id }, function(err, diagrams) {
				userModel.User.findByIdAndUpdate(req.session.user._id, { $set: { "currentDiagram": diagram._id }}, { new: true }, function(err) {
					res.render('dashboard', {
						csrfToken: req.csrfToken(),
						diagram: diagram,
						diagrams: diagrams
					})
				})
			})
		} else {
			next()
		}
	})
}

// Add new diagram
module.exports.addDiagram = function(req, res, next) {
	var diagram = diagramModel.Diagram()
	diagram.user = req.session.user._id
	diagram.data.nodes.push(diagramModel.Node())
	diagram.history.push(diagram.data)
	diagram.save(function(err){
		res.redirect('/dashboard/' + diagram._id)
	})
}