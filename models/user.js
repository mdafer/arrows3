var mongoose = require('mongoose')
var Schema = mongoose.Schema

// User model
module.exports.User = mongoose.model('User', new Schema({
	firstName: { type: String },
	lastName: { type: String },
	email: { type: String, unique: true, require: true },
	password: { type: String, require: true },
	passwordResetToken: { type: String },
	passwordResetExpire: { type: Date },
	currentDiagram: { type: String },
	sortDiagrams: {
		asc: { type: Boolean, default: true },
		col: { type: String, default: 'title' }
	}
}))