var mongoose = require('mongoose')
var Schema = mongoose.Schema

// Diagram model
module.exports.Diagram = mongoose.model('Diagram', new Schema({
	data: {
		nodes: { type: Array },
		relationships: { type: Array }
	},
	history: { type: Array },
	meta: {
		created: { type: Date, default: Date.now() },
		history: { type: Number, default: 0 },
		lastUpdate: { type: Date, default: Date.now() },
		title: { type: String, default: 'My new diagram'}
	},
	user: { type: Schema.Types.ObjectId, ref: 'User' }
}))

// Node object
module.exports.Node = function(){
	var node = {
		x: 100,
		y: 100
	}

	return node
}

// Relationship object
module.exports.Relationship = function(){
	var relationships = {
		startNode: 0,
		endNode: 1
	}

	return relationships
}