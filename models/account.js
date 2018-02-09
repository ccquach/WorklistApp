var mongoose = require("mongoose");

var accountSchema = new mongoose.Schema({
	facility: String,
	number: String,
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
		status: String
	},
	mcal: {
		arTrans: String,
		retractionDate: Date,
		recoup: Number,
		cifDate: Date,
		cifAmount: Number,
		cycle: Number,
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

module.exports = mongoose.model("Account", accountSchema);