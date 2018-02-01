var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

var accountSchema = new mongoose.Schema({
	number: { type: String, unique: true },
	firstName: String,
	lastName: String,
	dob: Date,
	admit: Date,
	discharge: Date,
	charges: Number,
	balance: Number,
	status: String,
	type: String,
	lastModified: { type: Date, default: Date.now },
	commercial: {
		fc: String,
		payer: String,
		insuredId: String,
		isEligible: Boolean,
		billedDate: Date,
		expected: Number,
		paidOn: Date,
		reim: Number,
		soc: Number,
		variance: Number,
		status: String
	},
	mcal: {
		arTrans: String,
		retractionDate: Date,
		recoup: Number,
		isCif: Boolean,
		cifAmount: Number,
		cycle: String,
		hmsIssueDate: Date,
		hmsCloseDate: Date
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	logs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Log"
		}
	],
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	createdAt: { type: Date, default: Date.now }
});

accountSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Account", accountSchema);