var mongoose = require("mongoose");

var logSchema = new mongoose.Schema({
	payer: {
		name: String,
		phone: String,
		ref: String,
		rep: String
	},
	status: String,
	note: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Log", logSchema);