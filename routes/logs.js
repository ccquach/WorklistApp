var express = require("express");
var router = express.Router({ mergeParams: true });
var Account = require("../models/account");
var Log = require("../models/log");
var middleware = require("../middleware");
const { isLoggedIn } = middleware;

// new log entry
router.get("/new", isLoggedIn, function(req, res) {
	Account.findById(req.params.id, function(err, account) {
		if(err || !account) {
			req.flash("error", "Unable to find account.");
			return res.back();
		}
		res.render("logs/new", { account: account });
	});
});

// create log entry
router.post("/", isLoggedIn, function(req, res) {
	req.body.log.note = req.sanitize(req.body.log.note);
	console.log(req.body.log);
	// Find account by Id
	Account.findById(req.params.id, function(err, account) {
		if(err || !account) {
			req.flash("error", "Unable to find account.");
			return res.render({ prevLog: req.body.log });
		}
		// Create new log entry
		Log.create(req.body.log, function(err, log) {
			if(err || !log) {
				req.flash("error", "Failed to add new follow-up to log.");
				return res.back();
			}
			// Add account number to log entry
			log.account = account._id;
			// Add username and id to log entry
			log.author.id = req.user._id;
			log.author.username = req.user.username;
			log.save();
			// Connect new log entry to account
			account.logs.push(log._id);
			account.lastModified = Date.now();
			account.save();
			// Redirect to account show page
			req.flash("success", "Successfully added new follow-up to communication log.");
			res.redirect("/accounts/" + req.params.id);
		});
	});
});

module.exports = router;