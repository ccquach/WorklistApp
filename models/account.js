var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

var accountSchema = new mongoose.Schema({
	number: { type: String, unique: true },
	firstName: String,
	lastName: String,
	currentBalance: Number,
	createdAt: { type: Date, default: Date.now },
	lastModified: { type: Date, default: Date.now },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	]
});

accountSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Account", accountSchema);